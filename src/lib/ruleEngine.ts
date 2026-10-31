import { BOND_AUTHORITY, RULES_BY_ID, bondSourceFor } from "./kb/au";
import type { AuState, DocType, EmploymentType, Extracted, Finding, Level, PersonaId } from "./types";
import { formatAud, minimumHourly } from "./wage";

/**
 * 규칙 엔진: 정규식으로 위험 조항 후보를 찾는다.
 * LLM 없이도 동작하고, LLM이 놓친 항목을 보완하며, 숫자 판정(최저임금 비교)은 항상 여기서 한다.
 */

export type RuleContext = { persona: PersonaId; state: AuState; docType: DocType };

export type RuleOutput = { findings: Finding[]; extracted: Extracted };

const LEVEL_ORDER: Record<Level, number> = { risk: 0, caution: 1, info: 2 };

export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}

export function detectDocType(text: string): DocType {
  const t = text.toLowerCase();
  if (/assignment|secondment|expatriate|파견|발령|주재원/.test(t)) return "assignment_letter";
  if (/gross pay|net pay|pay period|year to date|\bytd\b|pay ?slip\s*(?:for|period|date|no)/.test(t)) return "payslip";
  if (/offer of (?:admission|enrolment|enrollment)|confirmation of enrolment|\bcoe\b|tuition fee|입학/.test(t)) return "offer_letter";
  if (/tenancy|lease agreement|landlord|tenant|\brent\b|share ?house|room for rent/.test(t)) return "lease";
  if (/we are hiring|we're hiring|apply now|vacancy|job ad|now hiring|구인/.test(t)) return "job_ad";
  if (/employment|employee|employer|position|per hour|hourly|근로계약/.test(t)) return "employment_contract";
  return "other";
}

/** 매칭된 위치가 들어 있는 문장(줄)을 원문 인용으로 돌려준다. */
function quoteAround(text: string, index: number): string {
  // 문장 끝은 마침표 뒤에 공백·줄바꿈·끝이 올 때만 본다 ($22.00 같은 소수점에서 자르지 않도록).
  const start = Math.max(text.lastIndexOf("\n", index), text.lastIndexOf(". ", index) + 1, 0);
  const sentenceEnd = /\.(?=\s|$)|\n/g;
  sentenceEnd.lastIndex = index;
  const m = sentenceEnd.exec(text);
  const end = m ? (m[0] === "." ? m.index + 1 : m.index) : text.length;
  const q = text.slice(start, end).trim().replace(/\s+/g, " ");
  return q.length > 180 ? q.slice(0, 177) + "…" : q;
}

function find(text: string, re: RegExp): { index: number; match: RegExpExecArray } | null {
  const m = re.exec(text);
  return m ? { index: m.index, match: m } : null;
}

function fromRule(ruleId: string, extra: Partial<Finding> = {}): Finding {
  const r = RULES_BY_ID[ruleId];
  return {
    ruleId,
    level: r.level,
    title: r.title,
    explanation: r.explain,
    korea: r.korea,
    action: r.action,
    source: r.source.url ? r.source : { ...r.source },
    origin: "rule",
    ...extra,
  };
}

function findRate(text: string): { value: number; index: number } | null {
  const m =
    /(?:a\$|aud\s?|\$)\s?(\d{1,3}(?:\.\d{1,2})?)\s*(?:aud\s*)?(?:per\s*hour|\/\s*h(?:ou)?r\b|an\s+hour|p\/h\b|ph\b|hourly)/i.exec(text) ??
    /hourly\s+rate[^$\d\n]{0,20}\$?\s?(\d{1,3}(?:\.\d{1,2})?)/i.exec(text);
  return m ? { value: Number(m[1]), index: m.index } : null;
}

export function extractFields(text: string): Extracted {
  const out: Extracted = {};
  const rate = findRate(text);
  if (rate) out.hourlyRate = rate.value;

  const t = text.toLowerCase();
  let type: EmploymentType = "unknown";
  if (/\bcasual\b/.test(t)) type = "casual";
  else if (/part[- ]time/.test(t)) type = "part_time";
  else if (/full[- ]time/.test(t)) type = "full_time";
  out.employmentType = type;

  const weekly = /(\d{1,2}(?:\.\d)?)\s*(?:hours|hrs|h)\s*(?:per|a|each|\/)\s*week/i.exec(text);
  const fortnight = /(\d{1,2}(?:\.\d)?)\s*(?:hours|hrs|h)\s*(?:per|a|each|\/)\s*fortnight/i.exec(text);
  if (weekly) out.hoursPerWeek = Number(weekly[1]);
  else if (fortnight) out.hoursPerWeek = Number(fortnight[1]) / 2;

  if (/\bcash\b/.test(t)) out.payMethod = "cash";
  else if (/bank transfer|direct deposit|\bbsb\b/.test(t)) out.payMethod = "bank";

  const rent = /\$\s?(\d{2,4})(?:\.\d{2})?\s*(?:per|a|\/)\s*(?:week|wk)\b|\$\s?(\d{2,4})\s*pw\b/i.exec(text);
  if (rent) out.weeklyRent = Number(rent[1] ?? rent[2]);
  const bond = /bond[^$\d\n]{0,30}\$\s?(\d{1,2},?\d{3}|\d{3,5})/i.exec(text);
  if (bond) out.bondAmount = Number(bond[1].replace(",", ""));
  return out;
}

export function runRules(text: string, ctx: RuleContext): RuleOutput {
  const findings: Finding[] = [];
  const extracted = extractFields(text);
  const t = text.toLowerCase();
  const isWorkDoc = ["employment_contract", "payslip", "job_ad"].includes(ctx.docType);

  // 1) 최저임금 비교 — 숫자 판정은 항상 코드로 한다.
  if (isWorkDoc && extracted.hourlyRate !== undefined) {
    const type = extracted.employmentType ?? "unknown";
    const min = minimumHourly(type === "unknown" ? "part_time" : type);
    if (extracted.hourlyRate < min) {
      const gap = min - extracted.hourlyRate;
      const rateAt = findRate(text);
      findings.push(
        fromRule("AU-WAGE-BELOW-MIN", {
          title: type === "casual" ? "시급이 캐주얼 최저 기준보다 낮아요" : "시급이 최저임금보다 낮아요",
          quote: rateAt ? quoteAround(text, rateAt.index) : undefined,
          explanation:
            type === "casual"
              ? `캐주얼은 유급휴가가 없는 대신 25%를 더 받아야 해요. 최소 A$${formatAud(min)}인데 이 서류는 A$${formatAud(gap)} 낮아요.`
              : `최저시급은 A$${formatAud(min)}인데 이 서류는 A$${formatAud(gap)} 낮아요. 업종 어워드에 따라 기준이 더 높을 수 있어요.`,
        }),
      );
    }
  }

  // 2) 급여명세서 미발급
  const noSlip = find(t, /no pay ?slips?|pay ?slips? (?:will not|won't|are not|will never) be (?:issued|provided|given)|without (?:a )?pay ?slips?/);
  if (isWorkDoc && noSlip) findings.push(fromRule("AU-PAYSLIP", { quote: quoteAround(text, noSlip.index) }));

  // 3) 현금 지급
  const cash = find(t, /\bcash\b/);
  if (isWorkDoc && cash) findings.push(fromRule("AU-CASH-PAY", { quote: quoteAround(text, cash.index) }));

  // 4) 무급 트라이얼
  const trial = find(t, /unpaid[^.\n]{0,30}(?:trial|training|work experience|probation)|(?:trial|probation)[^.\n]{0,40}(?:unpaid|without pay|no pay)/);
  if (trial) findings.push(fromRule("AU-UNPAID-TRIAL", { quote: quoteAround(text, trial.index) }));

  // 5) super 누락
  const noSuper = find(
    t,
    /no super\b|super(?:annuation)?[^.\n]{0,40}(?:not (?:be )?(?:paid|provided|included))|super(?:annuation)?[^.\n]{0,20}included in (?:the |your )?(?:hourly )?(?:rate|wage|pay)|(?:rate|wage|pay)[^.\n]{0,30}includ(?:es|ing) super/,
  );
  if (isWorkDoc && noSuper) findings.push(fromRule("AU-SUPER", { quote: quoteAround(text, noSuper.index) }));
  else if (ctx.docType === "payslip" && !/super/.test(t))
    findings.push(fromRule("AU-SUPER", { level: "caution", title: "명세서에 연금(super)이 안 보여요" }));

  // 6) ABN 위장 도급
  const abn = find(t, /\babn\b|independent contractor|sub-?contractor/);
  if (isWorkDoc && abn) findings.push(fromRule("AU-SHAM-ABN", { quote: quoteAround(text, abn.index) }));

  // 7) 고정 시급(가산 없음)
  const flat = find(t, /flat rate|no (?:penalty|weekend|overtime) rates?|same rate (?:on|for) (?:weekends|public holidays)/);
  if (isWorkDoc && flat) findings.push(fromRule("AU-FLAT-RATE", { quote: quoteAround(text, flat.index) }));

  // 8) 보증금을 개인에게
  if (ctx.docType === "lease") {
    const bond = find(
      t,
      /bond[^.\n]{0,120}(?:my|our|the landlord'?s?|owner'?s?|personal)\s+(?:bank\s+)?account|bond[^.\n]{0,60}\bcash\b|(?:transfer|pay)[^.\n]{0,40}(?:bond|deposit)[^.\n]{0,40}(?:to me|directly)/,
    );
    if (bond) {
      const a = BOND_AUTHORITY[ctx.state];
      findings.push(
        fromRule("AU-BOND-PRIVATE", {
          quote: quoteAround(text, bond.index),
          explanation: `정식 임대차라면 집주인은 보증금을 ${a.within} ${a.name}에 맡겨야 해요. 개인 계좌로만 받으면 나중에 돌려받기 어려워요.`,
          source: bondSourceFor(ctx.state),
        }),
      );
    }
  }

  // 9) 학생비자 근로시간
  if (ctx.persona === "student" && extracted.hoursPerWeek !== undefined && extracted.hoursPerWeek * 2 > 48) {
    const h = find(text, /(\d{1,2}(?:\.\d)?)\s*(?:hours|hrs|h)\s*(?:per|a|each|\/)\s*(?:week|fortnight)/i);
    findings.push(
      fromRule("AU-STUDENT-HOURS", {
        quote: h ? quoteAround(text, h.index) : undefined,
        explanation: `이 조건대로면 2주에 ${extracted.hoursPerWeek * 2}시간이라 학기 중 한도(48시간)를 넘어요. 비자 조건 위반이 될 수 있어요. 방학 기간은 제한이 없어요.`,
      }),
    );
  }

  // 10) 학생 건강보험
  if (ctx.persona === "student" && ctx.docType === "offer_letter" && !/oshc|overseas student health cover|health insurance|health cover|건강보험/.test(t))
    findings.push(fromRule("AU-OSHC"));

  // 11) 선입금 요구 (구인 사기)
  const fee = find(t, /(?:training|uniform|registration|placement|application|admin(?:istration)?|processing)\s+fee|(?:pay|deposit|transfer)[^.\n]{0,40}before (?:you )?start/);
  if (fee) findings.push(fromRule("AU-JOB-FEE", { quote: quoteAround(text, fee.index) }));

  // 12) 스폰서 대가
  const sponsor = find(t, /sponsor(?:ship)?[^.\n]{0,80}(?:fee|cost|pay|\$)|(?:fee|\$\s?\d)[^.\n]{0,60}sponsor/);
  if (sponsor) findings.push(fromRule("AU-SPONSOR-PAY", { quote: quoteAround(text, sponsor.index) }));

  // 13) 파견 발령서 체크리스트 — 빠졌거나 '별도 협의'로만 적힌 항목을 찾는다 (영문·국문 모두)
  if (ctx.docType === "assignment_letter") {
    const checks: [string, RegExp, string][] = [
      ["WK-HOUSING", /housing|accommodation|rent allowance|주거|주택|숙소|임차/, "주거 지원"],
      ["WK-TAX", /\btax|withholding|equali[sz]ation|세금|원천징수|소득세/, "세금 처리"],
      ["WK-PENSION", /pension|social security|certificate of coverage|국민연금|사회보장/, "연금 처리"],
      ["WK-INSURANCE", /insurance|medical|health cover|보험|의료/, "의료보험"],
      ["WK-RETURN", /repatriation|return to korea|end of (?:the )?assignment|귀임|복귀|귀국/, "귀임 조건"],
    ];
    const vague = /별도\s*협의|추후\s*(?:협의|결정)|to be (?:discussed|confirmed|agreed)|\btbd\b|\btbc\b/;
    for (const [id, re, label] of checks) {
      const hit = find(t, re);
      if (!hit) {
        findings.push(fromRule(id));
        continue;
      }
      const line = quoteAround(text, hit.index);
      if (vague.test(line.toLowerCase())) findings.push(fromRule(id, { title: `${label}${subjectParticle(label)} '별도 협의'로만 적혀 있어요`, quote: line }));
    }
  }

  return { findings: sortFindings(dedupe(findings)), extracted };
}

/** 받침 유무에 따라 '이'/'가'를 고른다. */
function subjectParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return "이";
  return code % 28 === 0 ? "가" : "이";
}

function dedupe(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter((f) => {
    const key = f.ruleId ?? f.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
