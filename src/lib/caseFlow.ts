import { SCENARIOS_BY_ID, scenariosFor } from "./scenarios";
import type { AnalysisResult, Country, PersonaId } from "./types";

/** 서류에서 찾은 문제에 맞는 리허설 상황을 고른다. */
export function scenarioFor(persona: PersonaId, analysis?: AnalysisResult | null, country: Country = "AU"): string {
  const ids = new Set(analysis?.findings.map((f) => f.ruleId) ?? []);
  const has = (...xs: string[]) => xs.some((x) => ids.has(x));
  const pick = (id: string) => (SCENARIOS_BY_ID[id]?.personas.includes(persona) ? id : null);
  const first = () => scenariosFor(country, persona)[0].id;

  if (country === "JP") {
    if (has("JP-STUDENT-28H")) return pick("jp-student-hours") ?? first();
    if (has("JP-RESTORATION", "JP-REIKIN", "JP-PASSPORT") && analysis?.docType === "lease") return "jp-lease";
    if ([...ids].some((id) => id?.startsWith("WK-"))) return "jp-hr-package";
    if (has("JP-WAGE-BELOW-MIN", "JP-OVERTIME", "JP-PAYSLIP", "JP-PENALTY", "JP-DEDUCTION")) return pick("jp-wage-boss") ?? first();
    return first();
  }
  if (has("AU-STUDENT-HOURS")) return pick("student-hours") ?? first();
  if (has("AU-BOND-PRIVATE")) return "bond-landlord";
  if ([...ids].some((id) => id?.startsWith("WK-"))) return "hr-package";
  if (has("AU-WAGE-BELOW-MIN", "AU-PAYSLIP", "AU-CASH-PAY")) return pick("wage-boss") ?? first();
  return first();
}

export function hasWageIssue(analysis?: AnalysisResult | null): boolean {
  return Boolean(analysis?.findings.some((f) => f.ruleId === "AU-WAGE-BELOW-MIN" || f.ruleId === "JP-WAGE-BELOW-MIN" || f.ruleId === "JP-OVERTIME") || analysis?.extracted.hourlyRate);
}

/** 익명 제보 화면에서 고를 수 있는 '어려웠던 점' 후보 (규칙 → 집계용 짧은 이름) */
export const ISSUE_LABEL: Record<string, string> = {
  "AU-WAGE-BELOW-MIN": "최저임금 미달",
  "AU-PAYSLIP": "현금 지급 · 명세서 없음",
  "AU-CASH-PAY": "현금 지급 · 명세서 없음",
  "AU-UNPAID-TRIAL": "무급 트라이얼",
  "AU-SUPER": "연금(super) 미납",
  "AU-SHAM-ABN": "ABN(개인사업자) 계약 강요",
  "AU-FLAT-RATE": "고정 시급(가산 없음)",
  "AU-BOND-PRIVATE": "bond 개인계좌 송금 요구",
  "AU-STUDENT-HOURS": "학기 중 근로시간 초과 유도",
  "AU-JOB-FEE": "선입금·알선비 요구",
  "AU-SPONSOR-PAY": "스폰서 대가 요구",
  "JP-WAGE-BELOW-MIN": "최저임금 미달",
  "JP-OVERTIME": "잔업수당 미지급",
  "JP-MINASHI": "고정 잔업수당",
  "JP-PENALTY": "벌금·위약금 조항",
  "JP-PASSPORT": "여권·재류카드 보관 요구",
  "JP-DEDUCTION": "제복·기숙사비 과다 공제",
  "JP-SOCIAL-INS": "사회보험 미가입",
  "JP-UNPAID-TRAINING": "무급 연수",
  "JP-JOB-FEE": "선입금·알선비 요구",
  "JP-ENTERTAINMENT": "비자 금지 업종 권유",
  "JP-STUDENT-28H": "주 28시간 초과 유도",
  "JP-PAYSLIP": "급여명세서 없음",
  "JP-RESTORATION": "퇴거 비용 과다 청구",
  "WK-HOUSING": "파견 조건 '별도 협의'",
  "WK-TAX": "파견 조건 '별도 협의'",
  "WK-PENSION": "파견 조건 '별도 협의'",
  "WK-INSURANCE": "파견 조건 '별도 협의'",
  "WK-RETURN": "파견 조건 '별도 협의'",
};
