import type { AuState, Rule } from "../types";

export { CITIES } from "./countries";

/**
 * 호주 지식팩.
 * 숫자와 규정은 아래 기준일에 확인한 값이다. 매년 7월 1일 최저임금이 바뀌므로
 * 배포 전 Fair Work Ombudsman 페이지에서 최신 값을 확인하고 갱신할 것.
 */
export const AU_PAY = {
  nationalMinimumHourly: 24.95,
  casualLoading: 0.25,
  superGuaranteeRate: 0.12,
  effectiveFrom: "2025-07-01",
  studentFortnightLimit: 48,
};

export const BOND_AUTHORITY: Record<AuState, { name: string; url: string; within: string }> = {
  QLD: { name: "RTA (Residential Tenancies Authority)", url: "https://www.rta.qld.gov.au", within: "받은 날로부터 10일 안에" },
  NSW: { name: "NSW Fair Trading (Rental Bonds Online)", url: "https://www.fairtrading.nsw.gov.au", within: "10영업일 안에" },
  VIC: { name: "RTBA (Residential Tenancies Bond Authority)", url: "https://www.consumer.vic.gov.au/housing/renting", within: "10영업일 안에" },
};

const FWO_MIN_WAGE = { name: "Fair Work Ombudsman · 최저임금", url: "https://www.fairwork.gov.au/pay-and-wages/minimum-wages" };
const FWO_PAYSLIP = { name: "Fair Work Ombudsman · 급여명세서", url: "https://www.fairwork.gov.au/pay-and-wages/paying-wages/pay-slips" };
const FWO_VISA = { name: "Fair Work Ombudsman · 비자 소지자 안내", url: "https://www.fairwork.gov.au/find-help-for/visa-holders-migrants" };
const FWO_HOME = { name: "Fair Work Ombudsman", url: "https://www.fairwork.gov.au" };
const ATO_SUPER = { name: "ATO · 고용주 연금(super) 의무", url: "https://www.ato.gov.au/businesses-and-organisations/super-for-employers" };
const HA_STUDENT = { name: "내무부 · 학생비자(500) 조건", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500" };
const HA_HOME = { name: "호주 내무부 (Home Affairs)", url: "https://immi.homeaffairs.gov.au" };
const SCAMWATCH = { name: "Scamwatch · 구인 사기", url: "https://www.scamwatch.gov.au" };
const NPS = { name: "국민연금공단 · 사회보장협정", url: "https://www.nps.or.kr" };
const ATO_HOME = { name: "ATO (호주 국세청)", url: "https://www.ato.gov.au" };
const CHECKLIST = { name: "Global-In 파견 체크리스트 (일반 권장 사항)", url: "" };

export const AU_RULES: Rule[] = [
  {
    id: "AU-WAGE-BELOW-MIN",
    title: "시급이 최저 기준보다 낮아요",
    level: "risk",
    personas: ["student", "jobseeker", "worker"],
    docTypes: ["employment_contract", "payslip", "job_ad"],
    explain: `호주 국가 최저시급은 A$${AU_PAY.nationalMinimumHourly}이고, 캐주얼은 유급휴가가 없는 대신 25%를 더 받아야 해요. 업종별 어워드(Award)에 따라 이보다 높을 수 있어요.`,
    korea: "한국으로 치면 최저시급보다 적게 주는 알바예요.",
    action: "서명 전이라면 시급을 기준 이상으로 고쳐 달라고 요청하고, 이미 일했다면 급여 계산으로 차액을 확인해 정산을 요청하세요.",
    kind: "law",
    source: FWO_MIN_WAGE,
  },
  {
    id: "AU-PAYSLIP",
    title: "급여명세서는 꼭 줘야 해요",
    level: "risk",
    personas: ["student", "jobseeker", "worker"],
    docTypes: ["employment_contract", "payslip"],
    explain: "고용주는 급여를 준 날로부터 1영업일 안에 급여명세서를 줘야 해요. 현금으로 줘도 마찬가지예요.",
    korea: "한국의 임금명세서 교부 의무와 같아요.",
    action: "매 급여마다 명세서를 달라고 요청하고, 내 근무 시간을 따로 기록해 두세요.",
    kind: "law",
    source: FWO_PAYSLIP,
  },
  {
    id: "AU-CASH-PAY",
    title: "현금 지급은 기록을 꼭 남기세요",
    level: "caution",
    personas: ["student", "jobseeker"],
    docTypes: ["employment_contract", "payslip", "job_ad"],
    explain: "현금 지급 자체가 불법은 아니지만, 이때도 최저임금·명세서·세금 원천징수·super 납부 의무는 그대로예요. 현금은 기록이 남지 않아 손해를 증명하기 어려워요.",
    korea: "한국의 '현금 알바'처럼 기록이 안 남는 구조예요.",
    action: "받은 날짜·금액·근무 시간을 매번 사진이나 메모로 남겨 두세요.",
    kind: "guide",
    source: FWO_VISA,
  },
  {
    id: "AU-UNPAID-TRIAL",
    title: "무급 트라이얼은 짧은 시연까지만",
    level: "caution",
    personas: ["student", "jobseeker"],
    docTypes: ["employment_contract", "job_ad"],
    explain: "일을 할 수 있는지 보여주는 짧은 시연은 무급일 수 있지만, 그 이상 일을 시키면 임금을 줘야 해요. 며칠·몇 주짜리 무급 트라이얼은 문제가 될 수 있어요.",
    korea: "한국에서 '수습이니까 무급'이라고 하는 것과 비슷하지만, 호주에선 허용 범위가 훨씬 좁아요.",
    action: "트라이얼이 몇 시간인지, 끝나면 임금을 주는지 서면으로 확인하세요.",
    kind: "guide",
    source: FWO_VISA,
  },
  {
    id: "AU-SUPER",
    title: "연금(super)이 빠져 있어요",
    level: "risk",
    personas: ["student", "jobseeker", "worker"],
    docTypes: ["employment_contract", "payslip"],
    explain: `대부분의 직원에게 고용주는 급여의 ${Math.round(AU_PAY.superGuaranteeRate * 100)}%를 연금(super)으로 따로 내야 해요. 시급에 포함됐다고 하거나 안 낸다고 하면 문제예요.`,
    korea: "한국의 국민연금 회사 부담분처럼, 내 월급과 별개로 회사가 내야 하는 돈이에요.",
    action: "super 계좌를 만들어 고용주에게 알려주고, 명세서에 super 금액이 찍히는지 확인하세요.",
    kind: "law",
    source: ATO_SUPER,
  },
  {
    id: "AU-SHAM-ABN",
    title: "직원인데 ABN(개인사업자)으로 일하라고 해요",
    level: "caution",
    personas: ["student", "jobseeker"],
    docTypes: ["employment_contract", "job_ad"],
    explain: "실제로는 직원처럼 일하는데 개인사업자(ABN) 계약을 시키면, 최저임금·super·휴가 같은 권리를 못 받을 수 있어요. 이를 위장 도급(sham contracting)이라고 해요.",
    korea: "한국의 '프리랜서 위장 계약'과 같은 문제예요.",
    action: "근무 시간·장소를 회사가 정한다면 직원일 가능성이 높아요. Fair Work에 상담해 보세요.",
    kind: "law",
    source: FWO_HOME,
  },
  {
    id: "AU-FLAT-RATE",
    title: "주말·야간 가산이 없는 '고정 시급'",
    level: "caution",
    personas: ["student", "jobseeker"],
    docTypes: ["employment_contract", "job_ad"],
    explain: "많은 업종 어워드는 주말·야간·공휴일에 가산 임금(penalty rate)을 줘야 해요. 고정 시급으로 퉁치려면 가산을 받았을 때보다 손해가 없어야 해요.",
    korea: "한국의 야간·휴일 가산수당을 포괄임금으로 퉁치는 것과 비슷해요.",
    action: "주말·야간 근무가 많다면 어워드 기준으로 손해가 없는지 확인하세요.",
    kind: "guide",
    source: FWO_MIN_WAGE,
  },
  {
    id: "AU-BOND-PRIVATE",
    title: "보증금(bond)을 집주인 계좌로 보내라고 해요",
    level: "risk",
    personas: ["student", "jobseeker", "worker"],
    docTypes: ["lease"],
    explain: "정식 임대차라면 집주인은 받은 보증금을 주(州) 정부 기관에 맡겨야 해요. 기관에 맡기지 않으면 나중에 돌려받기 어려워요.",
    korea: "한국 보증금과 비슷하지만, 집주인이 아니라 정부 기관이 보관한다는 점이 달라요.",
    action: "보증금을 정부 기관에 맡기는지 확인하고, 맡긴 뒤 받는 접수 확인을 꼭 받으세요.",
    kind: "law",
    source: { name: "주 정부 보증금 기관", url: "https://www.rta.qld.gov.au" },
  },
  {
    id: "AU-STUDENT-HOURS",
    title: "학기 중 2주 48시간을 넘게 일하게 돼요",
    level: "risk",
    personas: ["student"],
    docTypes: ["employment_contract", "job_ad", "offer_letter"],
    explain: `학생비자는 학기 중 2주(fortnight)에 ${AU_PAY.studentFortnightLimit}시간까지만 일할 수 있어요. 넘기면 비자 조건 위반이 될 수 있어요. 방학 기간은 제한이 없어요.`,
    korea: "한국 유학생의 시간제 취업 허가 시간 제한과 비슷해요.",
    action: "근무표를 받으면 2주 단위로 합산해 보고, 넘는 시간은 서면으로 거절하세요.",
    kind: "law",
    source: HA_STUDENT,
  },
  {
    id: "AU-OSHC",
    title: "학생 건강보험(OSHC) 내용이 안 보여요",
    level: "info",
    personas: ["student"],
    docTypes: ["offer_letter"],
    explain: "학생비자는 체류 기간 내내 학생 건강보험(OSHC)을 유지해야 해요. 입학 서류에 포함됐는지, 따로 들어야 하는지 확인하세요.",
    korea: "한국 유학생의 건강보험 의무 가입과 비슷해요.",
    action: "보험 시작·종료일이 비자 기간을 덮는지 확인하세요.",
    kind: "law",
    source: HA_STUDENT,
  },
  {
    id: "AU-JOB-FEE",
    title: "일을 시작하려면 돈을 내라고 해요",
    level: "risk",
    personas: ["student", "jobseeker"],
    docTypes: ["job_ad", "employment_contract", "offer_letter"],
    explain: "교육비·유니폼비·등록비처럼 일을 얻기 위해 먼저 돈을 내라고 하는 건 구인 사기의 대표 신호예요.",
    korea: "한국의 '취업 알선비' 사기와 같은 패턴이에요.",
    action: "돈을 보내지 말고 Scamwatch에 신고하세요.",
    kind: "guide",
    source: SCAMWATCH,
  },
  {
    id: "AU-SPONSOR-PAY",
    title: "비자 스폰서 대가로 돈을 요구해요",
    level: "risk",
    personas: ["jobseeker", "worker"],
    docTypes: ["job_ad", "employment_contract", "offer_letter"],
    explain: "호주에서는 비자 스폰서를 해주는 대가로 돈이나 혜택을 주고받는 것이 불법이에요. 요구한 쪽과 낸 쪽 모두 불이익을 받을 수 있어요.",
    korea: "한국에는 비슷한 제도가 없어서 '원래 그런가 보다' 하기 쉬운 부분이에요.",
    action: "어떤 명목이든 스폰서 비용을 내지 말고 내무부에 신고하세요.",
    kind: "law",
    source: HA_HOME,
  },
  {
    id: "WK-HOUSING",
    title: "주거 지원 조건이 적혀 있지 않아요",
    level: "caution",
    personas: ["worker"],
    docTypes: ["assignment_letter"],
    explain: "현지 렌트비는 도시에 따라 부담이 커요. 주거 지원 금액·기간·보증금 처리가 서면에 없으면 도착 후 협상이 어려워요.",
    action: "주거 지원 금액, 지원 기간, 보증금을 누가 내는지 서면으로 받으세요.",
    kind: "checklist",
    source: CHECKLIST,
  },
  {
    id: "WK-TAX",
    title: "세금 처리 기준이 적혀 있지 않아요",
    level: "caution",
    personas: ["worker"],
    docTypes: ["assignment_letter"],
    explain: "호주 세금 거주자인지에 따라 세율과 신고 방법이 달라져요. 회사가 세금을 보전해 주는지(tax equalisation)도 확인이 필요해요.",
    action: "어느 나라에서 원천징수하는지, 이중과세는 어떻게 처리하는지 확인하세요.",
    kind: "checklist",
    source: ATO_HOME,
  },
  {
    id: "WK-PENSION",
    title: "국민연금·super 처리 기준이 없어요",
    level: "caution",
    personas: ["worker"],
    docTypes: ["assignment_letter"],
    explain: "한국과 호주는 사회보장협정을 맺고 있어서, 조건에 맞는 파견자는 국민연금을 유지하고 호주 super 납부를 면제받을 수 있어요. 이때 가입증명서가 필요해요.",
    action: "회사에 국민연금 가입증명서 발급 여부를 확인하세요.",
    kind: "guide",
    source: NPS,
  },
  {
    id: "WK-INSURANCE",
    title: "의료보험 내용이 없어요",
    level: "caution",
    personas: ["worker"],
    docTypes: ["assignment_letter"],
    explain: "한국인은 호주 공공의료(Medicare) 대상이 아니라서, 회사 보험이 없으면 병원비가 크게 나올 수 있어요. 가족 동반이면 가족 보장도 확인해야 해요.",
    action: "본인·가족 의료보험을 누가, 어디까지 보장하는지 확인하세요.",
    kind: "checklist",
    source: CHECKLIST,
  },
  {
    id: "WK-RETURN",
    title: "귀임 조건이 적혀 있지 않아요",
    level: "info",
    personas: ["worker"],
    docTypes: ["assignment_letter"],
    explain: "파견 기간, 연장 조건, 귀임 후 직무·직급, 귀국 이사 비용이 정해져 있지 않으면 나중에 분쟁이 생기기 쉬워요.",
    action: "파견 기간과 귀임 후 처우를 서면으로 받으세요.",
    kind: "checklist",
    source: CHECKLIST,
  },
];

export function bondSourceFor(state: AuState) {
  const a = BOND_AUTHORITY[state];
  return { name: a.name, url: a.url };
}
