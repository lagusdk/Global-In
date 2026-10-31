import type { CoachFeedback, PersonaId } from "./types";

export type Scenario = {
  id: string;
  personas: PersonaId[];
  title: string;
  counterpart: { name: string; role: string; style: string };
  goal: string;
  /** 상대가 먼저 하는 말 */
  opening: string;
  /** 모델에게 줄 사실관계 */
  facts: string;
  /** 사용자가 쓰면 좋은 모범 문장 */
  modelLine: string;
  /** 오프라인 모드에서 상대가 차례로 하는 말 */
  script: { reply: string; pressure?: boolean; pressureNote?: string }[];
  /** 메시지 정리 화면에서 쓸 기본 상황 */
  messageKind: "wage" | "bond" | "hours" | "package";
};

export const SCENARIOS: Scenario[] = [
  {
    id: "wage-boss",
    personas: ["jobseeker", "student"],
    title: "급여 정산 요청",
    counterpart: { name: "Mark", role: "카페 사장", style: "버티는 타입" },
    goal: "캐주얼 최저시급으로 정산받기",
    opening: "Everyone here gets $22 cash. That's just how it works for backpackers.",
    facts:
      "The user is a casual barista in Brisbane paid $22/hour in cash for 38 hours a week with no payslips. The casual minimum is $31.19/hour (national minimum $24.95 + 25% casual loading). The weekly shortfall is $349.22.",
    modelLine: "I'd like to be paid at least the casual minimum rate — $31.19 an hour — and get a payslip each week.",
    script: [
      {
        reply: "If you don't like it, plenty of others would take the job.",
        pressure: true,
        pressureNote: "권리를 말했다는 이유로 불이익을 주는 건 호주 법에서 금지돼 있어요.",
      },
      { reply: "Look, I can't just change everyone's pay overnight. Where did you even get that number?" },
      { reply: "Fine. Send me what you calculated and I'll look at it with my accountant this week." },
    ],
    messageKind: "wage",
  },
  {
    id: "bond-landlord",
    personas: ["jobseeker", "student", "worker"],
    title: "보증금 처리 요청",
    counterpart: { name: "Sarah", role: "쉐어하우스 집주인", style: "편하게 넘기려는 타입" },
    goal: "보증금을 정부 기관에 맡기도록 요청하기",
    opening: "Just transfer the bond to my account, it's easier that way. We keep things casual here.",
    facts:
      "The user is moving into a share house in Brisbane, rent $280/week, bond $1,120. In Queensland, a bond for a tenancy must be lodged with the RTA within 10 days. The landlord wants it paid to a personal account with no written lease.",
    modelLine: "I'm happy to pay the bond, but I'd like it lodged with the RTA and to sign a written agreement first.",
    script: [
      { reply: "Honestly, nobody bothers with the RTA for a room. It's just paperwork." },
      {
        reply: "If you want all that, maybe this room isn't for you.",
        pressure: true,
        pressureNote: "보증금 기관 이용을 요구했다고 계약을 거절하는 집은 나중에 보증금을 돌려받기 더 어려울 수 있어요.",
      },
      { reply: "Okay, okay. I'll fill in the RTA form and you can pay it through them." },
    ],
    messageKind: "bond",
  },
  {
    id: "student-hours",
    personas: ["student"],
    title: "학기 중 초과 근무 거절",
    counterpart: { name: "Daniel", role: "레스토랑 매니저", style: "밀어붙이는 타입" },
    goal: "학기 중 2주 48시간을 넘는 근무를 정중히 거절하기",
    opening: "We need you for 30 hours this week. You can do that, right?",
    facts:
      "The user is on an Australian student visa. During study periods they may work up to 48 hours per fortnight. They already worked 26 hours last week, so 30 hours this week would mean 56 hours in the fortnight.",
    modelLine: "I can work up to 22 hours this week — my student visa limits me to 48 hours per fortnight during semester.",
    script: [
      { reply: "Come on, nobody checks that. Just this once." },
      {
        reply: "If you can't be flexible, I'll have to give your shifts to someone else.",
        pressure: true,
        pressureNote: "비자 조건 위반은 학생 본인이 책임져요. 거절했다고 불이익을 주는 건 부당한 대우예요.",
      },
      { reply: "Alright, 22 hours this week then. Let me know your availability for the holidays." },
    ],
    messageKind: "hours",
  },
  {
    id: "hr-package",
    personas: ["worker"],
    title: "파견 조건 서면 확인",
    counterpart: { name: "Emma", role: "현지 법인 HR 담당", style: "나중에 하자는 타입" },
    goal: "주거·세금·의료보험 조건을 출국 전에 서면으로 받기",
    opening: "Your assignment package is standard. We can sort out the details after you arrive.",
    facts:
      "The user is being seconded from a Korean company to the Melbourne office for two years. The assignment letter does not specify housing support amount, tax treatment, pension (Korea–Australia social security agreement certificate), health insurance, or return conditions.",
    modelLine: "Before I relocate, could you confirm the housing allowance, tax treatment and health cover in writing?",
    script: [
      { reply: "Most people just figure it out once they're here. It's really not a big deal." },
      { reply: "Housing is usually around two weeks of support, but I'd need to check with Seoul." },
      { reply: "Fair enough. I'll put the housing, tax and insurance terms in an email to you by Friday." },
    ],
    messageKind: "package",
  },
];

export const SCENARIOS_BY_ID: Record<string, Scenario> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

const HANGUL = /[가-힣]/;

export function hasHangul(text: string): boolean {
  return HANGUL.test(text);
}

/** 오프라인 코치: 숫자·근거·요청 표현이 있는지로 간단히 채점한다. */
export function offlineCoach(message: string, scenario: Scenario): Omit<CoachFeedback, "pressure" | "pressureNote"> {
  const m = message.toLowerCase();
  const hasNumber = /\$?\d/.test(m);
  const hasBasis = /minimum|award|fair work|law|legal|rta|visa|limit|contract|in writing|payslip|rate/.test(m);
  const hasAsk = /i'?d like|i would like|could you|can you|please|i need|i want|i'?m asking/.test(m);
  const polite = /please|thank|could you|would you|appreciate|happy to/.test(m);
  const rude = /stupid|idiot|f\*|fuck|shut up/.test(m);

  const evidence = hasNumber && hasBasis ? 3 : hasNumber || hasBasis ? 2 : 1;
  const clarity = hasAsk && (hasNumber || hasBasis) ? 3 : hasAsk ? 2 : 1;
  const politeness = rude ? 1 : polite ? 3 : 2;

  let praise = "말을 꺼낸 것부터 잘했어요.";
  if (evidence === 3 && clarity === 3) praise = "금액과 근거가 분명해서 아주 단단한 요청이에요.";
  else if (evidence >= 2) praise = "근거를 붙인 점이 좋아요. 원하는 걸 더 분명하게 말해 볼까요?";
  else if (clarity >= 2) praise = "원하는 걸 말한 점이 좋아요. 금액이나 근거를 붙이면 더 단단해져요.";

  return { praise, better: scenario.modelLine, scores: { clarity, evidence, politeness } };
}
