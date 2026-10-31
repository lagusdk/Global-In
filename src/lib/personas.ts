import type { DocType, PersonaId } from "./types";

export type Todo = { id: string; text: string };

export type PersonaPack = {
  id: PersonaId;
  title: string;
  sub: string;
  short: string;
  visaLabel: string;
  workLabel: string;
  todos: Todo[];
  /** 홈에서 먼저 보여 줄 서류 종류 */
  docTypes: DocType[];
  calculator: "wage" | "hours" | "none";
  scenarioIds: string[];
  /** 홈 '내 주변 경고'에 쓰는 업종 */
  industry: string;
};

export const PERSONAS: Record<PersonaId, PersonaPack> = {
  student: {
    id: "student",
    title: "공부하러 가요",
    sub: "교환학생 · 유학 · 어학연수",
    short: "학생",
    visaLabel: "학생비자 500",
    workLabel: "학생 · 아르바이트",
    todos: [
      { id: "oshc", text: "학생 건강보험(OSHC) 기간 확인" },
      { id: "tfn", text: "TFN(세금번호) 신청" },
      { id: "bank", text: "은행 계좌 개설" },
      { id: "bond", text: "숙소 bond 맡길 정부 기관 확인" },
      { id: "hours", text: "근무 시간 2주 단위로 기록하기" },
    ],
    docTypes: ["lease", "employment_contract", "offer_letter"],
    calculator: "hours",
    scenarioIds: ["student-hours", "bond-landlord"],
    industry: "요식업",
  },
  jobseeker: {
    id: "jobseeker",
    title: "일하면서 지내요",
    sub: "워킹홀리데이 · 해외취업 준비",
    short: "취준생",
    visaLabel: "워홀 417",
    workLabel: "카페 바리스타",
    todos: [
      { id: "tfn", text: "TFN(세금번호) 신청" },
      { id: "bank", text: "은행 계좌 개설" },
      { id: "super", text: "super(연금) 계좌 만들기" },
      { id: "bond", text: "렌트 계약 전 bond 맡길 곳 확인" },
      { id: "log", text: "근무 시간·받은 돈 기록 시작" },
    ],
    docTypes: ["employment_contract", "payslip", "lease", "job_ad"],
    calculator: "wage",
    scenarioIds: ["wage-boss", "bond-landlord"],
    industry: "카페·요식",
  },
  worker: {
    id: "worker",
    title: "회사에서 보내요",
    sub: "파견 · 주재원 · 현지 법인 취업",
    short: "직장인",
    visaLabel: "취업비자 482",
    workLabel: "현지 법인 파견",
    todos: [
      { id: "letter", text: "파견 발령서 조건 서면 확인" },
      { id: "nps", text: "국민연금 가입증명서 발급 확인" },
      { id: "taxres", text: "세금 거주자 여부 확인" },
      { id: "health", text: "본인·가족 의료보험 확인" },
      { id: "lease", text: "주거 계약·bond 확인" },
    ],
    docTypes: ["assignment_letter", "lease", "employment_contract"],
    calculator: "none",
    scenarioIds: ["hr-package", "bond-landlord"],
    industry: "사무·전문직",
  },
};

export const PERSONA_LIST: PersonaPack[] = [PERSONAS.student, PERSONAS.jobseeker, PERSONAS.worker];

export const DOC_TYPE_LABEL: Record<DocType, string> = {
  employment_contract: "근로계약서",
  payslip: "급여명세서",
  lease: "렌트 계약",
  offer_letter: "입학·합격 서류",
  assignment_letter: "파견 발령서",
  job_ad: "구인 광고",
  other: "기타 서류",
};
