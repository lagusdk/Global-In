import type { Country, Rule } from "../types";
import { AU_PAY, AU_RULES } from "./au";
import { JP_RULES } from "./jp";

/**
 * 규칙별 적용 대상·기준일·판단 조건. 결과 화면의 근거 링크 옆에 보여 줘서
 * "이 판정이 누구에게, 언제 기준으로 맞는지"를 사용자가 확인할 수 있게 한다.
 */
const SCOPE: Record<string, string> = {
  "AU-WAGE-BELOW-MIN": `만 21세 이상 · 국가 최저시급 ${AU_PAY.effectiveFrom} 기준 · 업종 어워드는 더 높을 수 있음`,
  "AU-PAYSLIP": "모든 직원 · 급여일로부터 1영업일 안",
  "AU-CASH-PAY": "현금 지급도 최저임금·명세서·세금·super 의무 동일",
  "AU-UNPAID-TRIAL": "기술을 보여주는 짧은 시연만 무급 가능",
  "AU-SUPER": `대부분의 직원 · 급여의 ${Math.round(AU_PAY.superGuaranteeRate * 100)}% (${AU_PAY.effectiveFrom} 기준)`,
  "AU-SHAM-ABN": "실제로 직원처럼 일하는 경우",
  "AU-FLAT-RATE": "업종 어워드가 가산을 정한 경우",
  "AU-BOND-PRIVATE": "정식 임대차 · 주마다 맡기는 기관과 기한이 다름",
  "AU-STUDENT-HOURS": "학생비자(500) · 학기 중 2주 48시간 · 방학 중 제한 없음",
  "AU-OSHC": "학생비자(500) 체류 기간 전체",
  "AU-JOB-FEE": "일자리를 얻는 대가로 먼저 돈을 내는 경우",
  "AU-SPONSOR-PAY": "비자 스폰서십의 대가를 주고받는 경우",
  "JP-WAGE-BELOW-MIN": "도도부현별 지역 최저임금 · 2025년 개정 기준 · 수습·연수 포함",
  "JP-OVERTIME": "하루 8시간·주 40시간 초과, 심야 22~5시",
  "JP-MINASHI": "고정 잔업수당이 월급에 포함된 경우",
  "JP-PENALTY": "벌금·위약금을 미리 정한 계약 (노동기준법)",
  "JP-PASSPORT": "고용주·집주인 등 제3자의 보관",
  "JP-DEDUCTION": "세금·보험 외 공제는 노사 협정 필요",
  "JP-SOCIAL-INS": "일정 근무시간 이상 · 사업장 규모에 따라 다름",
  "JP-UNPAID-TRAINING": "회사 지시로 하는 연수·수습",
  "JP-JOB-FEE": "직업 소개 사업자가 구직자에게 받는 수수료",
  "JP-ENTERTAINMENT": "워킹홀리데이·유학생 자격외활동",
  "JP-STUDENT-28H": "유학 비자 · 자격외활동 허가 · 장기 방학 중 하루 8시간",
  "JP-PAYSLIP": "급여를 줄 때마다",
  "JP-RESTORATION": "통상 사용·경년 열화는 세입자 부담 아님 (가이드라인)",
  "JP-REIKIN": "돌려받지 못하는 사례금",
};

for (const r of [...AU_RULES, ...JP_RULES]) if (SCOPE[r.id]) r.scope = SCOPE[r.id];

/** 국가별 지식팩을 한곳에서 꺼낸다. 국가를 추가할 때는 여기에 팩을 등록한다. */
export const RULES: Record<Country, Rule[]> = { AU: AU_RULES, JP: JP_RULES };

export const RULES_BY_ID: Record<string, Rule> = Object.fromEntries([...AU_RULES, ...JP_RULES].map((r) => [r.id, r]));

export function rulesFor(country: Country): Rule[] {
  return RULES[country];
}
