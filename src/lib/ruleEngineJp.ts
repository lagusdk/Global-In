import { JP_PAY, jpMinHourly } from "./kb/jp";
import type { RuleContext, RuleOutput } from "./ruleEngine";
import { assignmentChecks, dedupe, find, fromRule, quoteAround, sortFindings } from "./ruleUtil";
import type { CityId, Extracted, Finding } from "./types";

/** 일본 규칙 엔진. 일본어 원문(漢字·かな)과 영어 원문을 모두 본다. */

const num = (s: string) => Number(s.replace(/[,，]/g, ""));

function findRateJp(text: string): { value: number; index: number } | null {
  const m =
    /時給\s*[:：]?\s*[¥￥]?\s*([\d,，]{3,6})\s*円?/.exec(text) ??
    /[¥￥]\s*([\d,，]{3,6})\s*(?:\/|per)\s*(?:h|hour|時間)/i.exec(text) ??
    /([\d,，]{3,6})\s*円\s*\/\s*時間?/.exec(text) ??
    /(?:hourly|per hour)[^\d¥￥\n]{0,15}[¥￥]?\s*([\d,，]{3,6})/i.exec(text);
  return m ? { value: num(m[1]), index: m.index } : null;
}

export function extractFieldsJp(text: string): Extracted {
  const out: Extracted = { employmentType: "unknown" };
  const rate = findRateJp(text);
  if (rate) out.hourlyRate = rate.value;
  const week = /週\s*(\d{1,2}(?:\.\d)?)\s*時間/.exec(text) ?? /(\d{1,2})\s*(?:hours|hrs)\s*(?:per|a)\s*week/i.exec(text);
  const day = /(?:1日|一日)\s*(\d{1,2}(?:\.\d)?)\s*時間/.exec(text);
  const days = /週\s*(\d)\s*日/.exec(text);
  if (week) out.hoursPerWeek = Number(week[1]);
  else if (day && days) out.hoursPerWeek = Number(day[1]) * Number(days[1]);
  if (/アルバイト|パート|part[- ]time/i.test(text)) out.employmentType = "part_time";
  else if (/正社員|full[- ]time/i.test(text)) out.employmentType = "full_time";
  const rent = /家賃\s*[:：]?\s*[¥￥]?\s*([\d,，]{4,7})\s*円?/.exec(text);
  if (rent) out.weeklyRent = Math.round(num(rent[1]) / 4.33);
  const deposit = /敷金\s*[:：]?\s*[¥￥]?\s*([\d,，]{4,7})\s*円?/.exec(text);
  if (deposit) out.bondAmount = num(deposit[1]);
  return out;
}

export function runRulesJp(text: string, ctx: RuleContext): RuleOutput {
  const findings: Finding[] = [];
  const extracted = extractFieldsJp(text);
  const t = text.toLowerCase();
  const city = ctx.region as CityId;
  const isWorkDoc = ["employment_contract", "payslip", "job_ad"].includes(ctx.docType);
  const q = (hit: { index: number } | null) => (hit ? quoteAround(text, hit.index) : undefined);

  // 1) 지역 최저임금 비교 — 숫자 판정은 코드로
  if (isWorkDoc && extracted.hourlyRate !== undefined) {
    const min = jpMinHourly(city);
    if (extracted.hourlyRate < min) {
      findings.push(
        fromRule("JP-WAGE-BELOW-MIN", {
          quote: q(findRateJp(text)),
          explanation: `이 지역 최저임금은 시급 ¥${min.toLocaleString("ja-JP")}(2025년 개정 기준)인데 이 서류는 ¥${(min - extracted.hourlyRate).toLocaleString("ja-JP")} 낮아요. 수습·연수 기간이어도 최저임금보다 낮을 수 없어요.`,
        }),
      );
    }
  }

  // 2) 주 40시간 초과인데 할증 언급 없음 / 잔업수당 없음 명시
  const noOvertime = find(t, /残業代\s*[:：]?\s*(?:なし|無し|は出ない|は支給しない|込み)|割増\s*[:：]?\s*(?:なし|無し)|no overtime (?:pay|rate)/);
  const overLegal = (extracted.hoursPerWeek ?? 0) > JP_PAY.legalWeeklyHours;
  if (isWorkDoc && (noOvertime || (overLegal && !/割増|残業手当|残業代|overtime/.test(t)))) {
    const h = find(text, /週\s*\d{1,2}(?:\.\d)?\s*時間|(?:1日|一日)\s*\d{1,2}\s*時間/);
    findings.push(
      fromRule("JP-OVERTIME", {
        level: noOvertime ? "risk" : "caution",
        title: noOvertime ? "잔업수당을 주지 않는다고 해요" : "주 40시간을 넘는데 잔업수당 이야기가 없어요",
        quote: q(noOvertime ?? h),
      }),
    );
  }

  // 3) 고정 잔업수당
  const minashi = find(t, /みなし残業|固定残業|fixed overtime/);
  if (isWorkDoc && minashi && !noOvertime) findings.push(fromRule("JP-MINASHI", { quote: q(minashi) }));

  // 4) 벌금·위약금
  const penalty = find(t, /罰金|違約金|損害賠償.{0,10}(?:予定|定め|請求)|ペナルティ|penalty fee/);
  if (penalty) findings.push(fromRule("JP-PENALTY", { quote: q(penalty) }));

  // 5) 여권·재류카드 보관
  const passport = find(t, /(?:パスポート|旅券|在留カード|passport).{0,15}(?:預か|保管|預け|keep|hold)/);
  if (passport) findings.push(fromRule("JP-PASSPORT", { quote: q(passport) }));

  // 6) 공제
  const deduction = find(t, /(?:制服|ユニフォーム|研修費|寮費|食費|uniform).{0,15}(?:天引|差し引|差引|控除|deduct)/);
  if (deduction) findings.push(fromRule("JP-DEDUCTION", { quote: q(deduction) }));

  // 7) 사회보험 없음
  const noInsurance = find(t, /社会保険.{0,6}(?:なし|無し|未加入|加入しない|加入なし)|保険\s*(?:なし|無し)|no (?:social )?insurance/);
  if (isWorkDoc && noInsurance) findings.push(fromRule("JP-SOCIAL-INS", { quote: q(noInsurance) }));

  // 8) 무급 연수
  const unpaid = find(t, /(?:研修|試用|トライアル|見習い|trial|training).{0,15}(?:無給|無償|給料なし|給与なし|unpaid)/);
  if (unpaid) findings.push(fromRule("JP-UNPAID-TRAINING", { quote: q(unpaid) }));

  // 9) 소개 수수료·선입금
  const fee = find(t, /(?:登録料|紹介料|手数料|保証金|登録費).{0,20}(?:支払|払|必要|かかり)|(?:placement|registration) fee/);
  if (fee) findings.push(fromRule("JP-JOB-FEE", { quote: q(fee) }));

  // 10) 풍속영업(워홀·유학생 금지 업종)
  const ent = find(t, /スナック|キャバクラ|ホストクラブ|ガールズバー|風俗|接待|hostess/);
  if (ctx.persona !== "worker" && ent) findings.push(fromRule("JP-ENTERTAINMENT", { quote: q(ent) }));

  // 11) 유학생 주 28시간
  if (ctx.persona === "student" && extracted.hoursPerWeek !== undefined && extracted.hoursPerWeek > JP_PAY.studentWeeklyLimit) {
    findings.push(
      fromRule("JP-STUDENT-28H", {
        quote: q(find(text, /週\s*\d{1,2}(?:\.\d)?\s*時間|週\s*\d\s*日/)),
        explanation: `이 조건대로면 주 ${extracted.hoursPerWeek}시간이라 유학생 한도(주 28시간)를 넘어요. 장기 방학 중이 아니라면 비자 조건 위반이 될 수 있어요.`,
      }),
    );
  }

  // 12) 급여명세서 미발급
  const noSlip = find(t, /(?:給与明細|明細書?).{0,6}(?:なし|無し|発行しない|出さない|渡さない)|no pay ?slips?/);
  if (isWorkDoc && noSlip) findings.push(fromRule("JP-PAYSLIP", { quote: q(noSlip) }));

  // 13) 임대: 원상회복·시키킨 미반환, 레이킨 안내
  if (ctx.docType === "lease") {
    const restore = find(t, /(?:退去|解約).{0,20}(?:クリーニング|修繕|原状回復|リフォーム).{0,20}(?:全額|借主負担|入居者負担)|敷金.{0,10}(?:返還しない|返金なし|返金しない|償却)/);
    if (restore) findings.push(fromRule("JP-RESTORATION", { quote: q(restore) }));
    const reikin = find(t, /礼金/);
    if (reikin) findings.push(fromRule("JP-REIKIN", { quote: q(reikin) }));
  }

  // 14) 파견 발령서 — 일본 기준 설명으로 바꿔 끼운다
  if (ctx.docType === "assignment_letter") {
    findings.push(
      ...assignmentChecks(text, {
        "WK-PENSION": {
          explanation: "한국과 일본은 사회보장협정으로 연금만 이중 가입을 면제해요. 건강보험은 협정 대상이 아니라서 일본 건강보험 가입 여부를 따로 확인해야 해요.",
        },
        "WK-INSURANCE": {
          explanation: "일본에서 일하면 회사 건강보험(健康保険)이나 국민건강보험에 가입해야 해요. 가족 동반이면 피부양자 등록도 확인하세요.",
        },
        "WK-TAX": {
          explanation: "일본에 1년 이상 머무를 예정이면 보통 일본 세법상 거주자가 돼요. 어느 나라에서 원천징수하는지, 세금 보전이 있는지 확인하세요.",
          source: { name: "일본 국세청", url: "https://www.nta.go.jp" },
        },
      }),
    );
  }

  return { findings: sortFindings(dedupe(findings)), extracted };
}
