import { SCENARIOS, SCENARIOS_BY_ID } from "./scenarios";
import type { AnalysisResult, PersonaId } from "./types";

/** 서류에서 찾은 문제에 맞는 리허설 상황을 고른다. */
export function scenarioFor(persona: PersonaId, analysis?: AnalysisResult | null): string {
  const ids = new Set(analysis?.findings.map((f) => f.ruleId) ?? []);
  const pick = (id: string) => (SCENARIOS_BY_ID[id].personas.includes(persona) ? id : null);
  if (ids.has("AU-STUDENT-HOURS")) return pick("student-hours") ?? "student-hours";
  if (ids.has("AU-BOND-PRIVATE")) return "bond-landlord";
  if ([...ids].some((id) => id?.startsWith("WK-"))) return "hr-package";
  if (["AU-WAGE-BELOW-MIN", "AU-PAYSLIP", "AU-CASH-PAY"].some((id) => ids.has(id))) return pick("wage-boss") ?? "wage-boss";
  return SCENARIOS.find((s) => s.personas.includes(persona))!.id;
}

export function hasWageIssue(analysis?: AnalysisResult | null): boolean {
  return Boolean(analysis?.findings.some((f) => f.ruleId === "AU-WAGE-BELOW-MIN") || analysis?.extracted.hourlyRate);
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
  "WK-HOUSING": "파견 조건 '별도 협의'",
  "WK-TAX": "파견 조건 '별도 협의'",
  "WK-PENSION": "파견 조건 '별도 협의'",
  "WK-INSURANCE": "파견 조건 '별도 협의'",
  "WK-RETURN": "파견 조건 '별도 협의'",
};
