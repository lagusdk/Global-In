export type PersonaId = "student" | "jobseeker" | "worker";

export type Country = "AU" | "JP";

export type CityId = "brisbane" | "sydney" | "melbourne" | "tokyo" | "osaka" | "fukuoka";

export type AuState = "QLD" | "NSW" | "VIC";

export type Profile = {
  persona: PersonaId;
  country: Country;
  city: CityId;
  arrival: string; // YYYY-MM-DD
  name?: string;
};

export type DocType =
  | "employment_contract"
  | "payslip"
  | "lease"
  | "offer_letter"
  | "assignment_letter"
  | "job_ad"
  | "other";

export type Level = "risk" | "caution" | "info";

export type EmploymentType = "casual" | "part_time" | "full_time" | "unknown";

export type Source = { name: string; url: string };

export type Rule = {
  id: string;
  title: string;
  level: Level;
  personas: PersonaId[];
  docTypes: DocType[];
  /** 무엇이 문제인지 (한국어, 2문장 이내) */
  explain: string;
  /** 한국 상황에 빗댄 설명 */
  korea?: string;
  /** 사용자가 할 일 */
  action: string;
  /** law: 법·규정, guide: 공식 안내, checklist: 일반 권장 확인 사항 */
  kind: "law" | "guide" | "checklist";
  source: Source;
};

export type Finding = {
  ruleId: string | null;
  level: Level;
  title: string;
  quote?: string;
  explanation: string;
  korea?: string;
  action?: string;
  source?: Source;
  /** rule: 규칙 엔진, ai: LLM, both: 둘 다 찾음 */
  origin: "rule" | "ai" | "both";
};

export type Extracted = {
  hourlyRate?: number;
  employmentType?: EmploymentType;
  hoursPerWeek?: number;
  payMethod?: "cash" | "bank" | "unknown";
  weeklyRent?: number;
  bondAmount?: number;
};

export type AnalysisResult = {
  docType: DocType;
  docTitle: string;
  language: string;
  summary: string;
  koreaSummary: string;
  findings: Finding[];
  okItems: string[];
  extracted: Extracted;
  mode: "ai" | "offline";
  model?: string;
  /** AI 모드에서 실패해 규칙 엔진만으로 답한 경우 그 이유 */
  notice?: string;
};

export type ChatTurn = { role: "user" | "counterpart"; content: string };

export type CoachFeedback = {
  praise: string;
  better: string;
  scores: { clarity: number; evidence: number; politeness: number };
  pressure: boolean;
  pressureNote?: string;
};

export type RehearseReply = {
  reply: string;
  coach: CoachFeedback;
  /** 사용자가 한국어로 말했을 때 영어로 옮긴 문장 */
  translated?: string;
  mode: "ai" | "offline";
  done?: boolean;
};

/** 현지어(영어·일본어) 메시지와 확인용 한국어 번역 */
export type DraftMessage = {
  lang: "en" | "ja";
  subjectLocal: string;
  subjectKo: string;
  bodyLocal: string;
  bodyKo: string;
  mode: "ai" | "offline";
};

export type Report = {
  city: CityId;
  industry?: string;
  issues: string[];
  visa?: string;
  persona?: PersonaId;
  at: string;
};
