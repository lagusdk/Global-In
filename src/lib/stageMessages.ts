import { RULES_BY_ID } from "./kb";
import { CITIES, COUNTRIES } from "./kb/countries";
import type { CityId, DraftMessage } from "./types";

/**
 * 상황별 메시지 템플릿.
 * - before(서명 전): 서명 전에 조항을 확인·수정해 달라는 요청
 * - harmed(피해 발생): 공식 상담기관·영사관에 낼 상담용 요약
 * 숫자는 코드가 계산한 값만 넣고, 조항 표현은 규칙 id로 고정한다.
 */

const CLAUSE: Record<string, { en?: string; ja?: string }> = {
  "AU-WAGE-BELOW-MIN": { en: "the hourly rate — it looks below the legal minimum for this role" },
  "AU-PAYSLIP": { en: "receiving a payslip every pay period" },
  "AU-CASH-PAY": { en: "how my pay will be recorded (cash payments without records)" },
  "AU-UNPAID-TRIAL": { en: "the unpaid trial period" },
  "AU-SUPER": { en: "superannuation payments" },
  "AU-SHAM-ABN": { en: "being engaged under an ABN rather than as an employee" },
  "AU-FLAT-RATE": { en: "weekend, night and overtime rates" },
  "AU-BOND-PRIVATE": { en: "lodging the bond with the state bond authority and a written lease" },
  "AU-STUDENT-HOURS": { en: "keeping my hours within my student visa limit (48 hours per fortnight during semester)" },
  "AU-JOB-FEE": { en: "the fee required before starting" },
  "AU-SPONSOR-PAY": { en: "the payment requested for visa sponsorship" },
  "JP-WAGE-BELOW-MIN": { ja: "時給（地域の最低賃金を下回っているようです）" },
  "JP-OVERTIME": { ja: "残業代・割増賃金のお支払い" },
  "JP-MINASHI": { ja: "固定残業代に含まれる時間と金額" },
  "JP-PENALTY": { ja: "遅刻などの罰金の規定" },
  "JP-PASSPORT": { ja: "パスポート・在留カードのお預かり" },
  "JP-DEDUCTION": { ja: "制服代・寮費などの給与からの控除" },
  "JP-SOCIAL-INS": { ja: "社会保険の加入" },
  "JP-UNPAID-TRAINING": { ja: "研修期間中の給与" },
  "JP-JOB-FEE": { ja: "登録料のお支払い" },
  "JP-ENTERTAINMENT": { ja: "業務内容（接客を伴う業務の有無）" },
  "JP-STUDENT-28H": { ja: "週28時間以内のシフト" },
  "JP-PAYSLIP": { ja: "給与明細の発行" },
  "JP-RESTORATION": { ja: "退去時の費用負担と敷金の返還" },
  "WK-HOUSING": { en: "housing allowance amount and period", ja: "住宅補助の金額と期間" },
  "WK-TAX": { en: "tax treatment and withholding", ja: "税金の扱い" },
  "WK-PENSION": { en: "pension coverage (certificate of coverage)", ja: "年金の扱い（加入証明書）" },
  "WK-INSURANCE": { en: "health insurance for me and my family", ja: "健康保険の加入" },
  "WK-RETURN": { en: "return conditions at the end of the assignment", ja: "任期終了後の帰任条件" },
};

export type StageInput = {
  city: CityId;
  to: string;
  name?: string;
  ruleIds: string[];
  wage?: { hours: number; shortfall: number; basisFrom?: string };
};

const yen = (n: number) => `${Math.round(n).toLocaleString("ja-JP")}円`;
const aud = (n: number) => `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function clauses(input: StageInput, lang: "en" | "ja") {
  const ids = input.ruleIds.filter((id) => CLAUSE[id]?.[lang]);
  return {
    local: ids.map((id) => CLAUSE[id][lang]!),
    ko: ids.map((id) => RULES_BY_ID[id]?.title ?? id),
  };
}

export function beforeSigningMessage(input: StageInput): DraftMessage {
  const ja = CITIES[input.city].country === "JP";
  const c = clauses(input, ja ? "ja" : "en");
  const localList = (c.local.length ? c.local : [ja ? "労働条件の詳細" : "the main working conditions"]).map((x) => (ja ? `・${x}` : `- ${x}`)).join("\n");
  const koList = (c.ko.length ? c.ko : ["주요 근무 조건"]).map((x) => `- ${x}`).join("\n");
  const nameKo = input.name?.trim() || "지우";
  if (ja) {
    return {
      lang: "ja",
      subjectLocal: "署名前の確認のお願い",
      subjectKo: "서명 전 확인 요청",
      bodyLocal: `${input.to}様\n\nこの度はありがとうございます。署名の前に、以下の点を確認させていただけますでしょうか。\n${localList}\n\n書面で確認・修正いただけましたら、署名いたします。\n\nよろしくお願いいたします。\n${input.name?.trim() || "キム・ジウ"}`,
      bodyKo: `${input.to} 님\n\n제안 감사합니다. 서명하기 전에 아래 내용을 확인하고 싶어요.\n${koList}\n\n서면으로 확인하거나 고쳐 주시면 서명할게요.\n\n잘 부탁드립니다.\n${nameKo}`,
      mode: "offline",
    };
  }
  return {
    lang: "en",
    subjectLocal: "A few questions before I sign",
    subjectKo: "서명 전 몇 가지 확인 요청",
    bodyLocal: `Hi ${input.to},\n\nThanks for the offer. Before I sign, could we go over a few points in the agreement?\n${localList}\n\nI'm happy to sign once these are confirmed or updated in writing.\n\nThanks,\n${input.name?.trim() || "Jiwoo"}`,
    bodyKo: `안녕하세요 ${input.to},\n\n제안 감사해요. 서명하기 전에 계약서에서 몇 가지를 확인하고 싶어요.\n${koList}\n\n서면으로 확인하거나 고쳐 주시면 서명할게요.\n\n감사합니다,\n${nameKo}`,
    mode: "offline",
  };
}

export function harmedSummary(input: StageInput): DraftMessage {
  const city = CITIES[input.city];
  const ja = city.country === "JP";
  const c = clauses(input, ja ? "ja" : "en");
  const country = COUNTRIES[city.country].label;
  const w = input.wage;
  if (ja) {
    const amount = w && w.shortfall > 0 ? `\n・未払いと思われる金額：約${yen(w.shortfall)}（週${w.hours}時間、${w.basisFrom ?? "最新"}基準の最低賃金と割増率で計算）` : "";
    return {
      lang: "ja",
      subjectLocal: "労働相談用のまとめ",
      subjectKo: "상담용 요약",
      bodyLocal: `相談内容のまとめ\n・勤務地：${city.region}（日本）\n・問題点：\n${(c.local.length ? c.local : ["労働条件"]).map((x) => `　- ${x}`).join("\n")}${amount}\n・手元の資料：雇用契約書／労働条件通知書、出退勤の記録、給与明細・振込記録、会社名・住所、やり取りの記録\n・希望：未払い分の支払いと、正しい労働条件への是正`,
      bodyKo: `상담 내용 요약\n- 근무지: ${city.label} (${country})\n- 문제:\n${(c.ko.length ? c.ko : ["근무 조건"]).map((x) => `  - ${x}`).join("\n")}${w && w.shortfall > 0 ? `\n- 덜 받은 것으로 보이는 금액: 약 ${yen(w.shortfall)} (주 ${w.hours}시간, ${w.basisFrom ?? "최신"} 기준 최저임금·할증으로 계산한 추정치)` : ""}\n- 가지고 있는 자료: 근로계약서·근로조건통지서, 출퇴근 기록, 급여명세서·입금 내역, 회사 이름·주소, 대화 기록\n- 원하는 것: 미지급분 지급과 근로 조건 시정`,
      mode: "offline",
    };
  }
  const amount = w && w.shortfall > 0 ? `\n- Estimated underpayment: about ${aud(w.shortfall)} for ${w.hours} hours (my calculation using the national minimum rate as of ${w.basisFrom ?? "the latest"})` : "";
  return {
    lang: "en",
    subjectLocal: "Summary for a workplace complaint",
    subjectKo: "상담·신고용 요약",
    bodyLocal: `Summary of my situation\n- Work location: ${city.label === "브리즈번" ? "Brisbane" : city.label === "시드니" ? "Sydney" : "Melbourne"}, Australia\n- Issues:\n${(c.local.length ? c.local : ["my pay and conditions"]).map((x) => `  - ${x}`).join("\n")}${amount}\n- Evidence I have: employment agreement or job ad, records of days and hours worked, payslips or bank records, employer name and ABN, messages with the employer\n- What I'm asking for: help recovering unpaid wages and correcting my conditions`,
    bodyKo: `내 상황 요약\n- 근무지: ${city.label} (${country})\n- 문제:\n${(c.ko.length ? c.ko : ["급여·근무 조건"]).map((x) => `  - ${x}`).join("\n")}${w && w.shortfall > 0 ? `\n- 덜 받은 것으로 보이는 금액: 약 ${aud(w.shortfall)} (${w.hours}시간, ${w.basisFrom ?? "최신"} 기준 국가 최저시급으로 계산한 추정치)` : ""}\n- 가지고 있는 자료: 근로계약서·구인 공고, 근무 날짜·시간 기록, 급여명세서·입금 내역, 고용주 이름·ABN, 고용주와 주고받은 메시지\n- 원하는 것: 미지급 임금 회수와 근무 조건 시정`,
    mode: "offline",
  };
}
