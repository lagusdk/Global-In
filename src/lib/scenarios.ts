import type { CoachFeedback, Country, PersonaId } from "./types";

export type Scenario = {
  id: string;
  country: Country;
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
    country: "AU",
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
    country: "AU",
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
    country: "AU",
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
    country: "AU",
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

  // ── 일본 (상대는 일본어로 말한다) ──
  {
    id: "jp-wage-boss",
    country: "JP",
    personas: ["jobseeker", "student"],
    title: "시급·잔업수당 정정 요청",
    counterpart: { name: "田中", role: "이자카야 점장", style: "버티는 타입" },
    goal: "지역 최저임금과 잔업수당을 지켜 달라고 요청하기",
    opening: "うちは時給1,100円で、残業代も込みなんだよ。みんなそれでやってるから。",
    facts:
      "The user works part-time at an izakaya in Tokyo for ¥1,100/hour, about 45 hours a week, with 'overtime included'. Tokyo's minimum wage is ¥1,226/hour, and hours over 40 per week need at least a 25% premium.",
    modelLine: "東京の最低賃金は時給1,226円なので、それ以上の時給と、週40時間を超えた分の残業代をお願いできますか。",
    script: [
      {
        reply: "嫌なら辞めてもらってもいいんだよ。代わりはいくらでもいるから。",
        pressure: true,
        pressureNote: "권리를 말했다고 해고를 암시하는 건 부당한 압박이에요. 침착하게 근거를 다시 말하세요.",
      },
      { reply: "最低賃金って言われてもなあ……どこで調べたの？" },
      { reply: "わかった、本部に確認して来月から直すよ。差額の計算も見せてくれる？" },
    ],
    messageKind: "wage",
  },
  {
    id: "jp-lease",
    country: "JP",
    personas: ["jobseeker", "student", "worker"],
    title: "퇴거 비용·여권 보관 문의",
    counterpart: { name: "佐藤", role: "셰어하우스 관리회사 직원", style: "규정이라는 타입" },
    goal: "시키킨 미반환 특약과 여권 보관을 바로잡아 달라고 하기",
    opening: "退去時のクリーニング代は全額負担で、敷金はお返ししない決まりなんです。パスポートもお預かりしますね。",
    facts:
      "The user is moving into a Tokyo share house. The contract says cleaning/repair costs are fully on the tenant and the deposit (敷金 ¥65,000) is never returned, and the company keeps the passport. Japanese government guidelines say tenants do not pay for normal wear and tear, and keeping a foreign resident's passport is improper.",
    modelLine: "通常の使用による汚れは借主負担ではないと国交省のガイドラインにあります。パスポートはお預けできません。コピーでもよろしいですか。",
    script: [
      { reply: "皆さんにお願いしていることなので、例外はちょっと……" },
      {
        reply: "それでしたら、ほかの方に入居していただくことになりますが。",
        pressure: true,
        pressureNote: "정당한 요구를 했다고 계약을 거절하겠다는 건 압박이에요. 서면으로 남겨 두세요.",
      },
      { reply: "承知しました。パスポートはコピーで結構です。退去費用は実費で精算するよう特約を直します。" },
    ],
    messageKind: "bond",
  },
  {
    id: "jp-student-hours",
    country: "JP",
    personas: ["student"],
    title: "주 28시간 초과 근무 거절",
    counterpart: { name: "鈴木", role: "편의점 점장", style: "밀어붙이는 타입" },
    goal: "유학생 한도(주 28시간)를 넘는 시프트를 정중히 거절하기",
    opening: "来週、人が足りないから35時間入ってくれる？留学生でも大丈夫でしょ。",
    facts:
      "The user is an international student in Osaka. Students may work up to 28 hours per week (any 7-day period) during term. 35 hours would exceed the limit and risk their visa.",
    modelLine: "留学生は週28時間までしか働けないので、来週は28時間以内でお願いします。",
    script: [
      { reply: "ちょっとくらいならバレないって。今回だけだから。" },
      {
        reply: "協力してくれないなら、シフトを減らすしかないなあ。",
        pressure: true,
        pressureNote: "비자 조건 위반은 학생 본인이 책임져요. 거절했다고 불이익을 주는 건 부당해요.",
      },
      { reply: "わかった、28時間以内で組むよ。長期休みのときはまた相談させて。" },
    ],
    messageKind: "hours",
  },
  {
    id: "jp-hr-package",
    country: "JP",
    personas: ["worker"],
    title: "파견 조건 서면 확인",
    counterpart: { name: "山本", role: "도쿄 지사 인사 담당", style: "나중에 하자는 타입" },
    goal: "주거·세금·건강보험 조건을 출국 전에 서면으로 받기",
    opening: "条件は標準的なものですので、詳細は来日後にご説明しますね。",
    facts:
      "The user is being seconded from Korea to the Tokyo branch for three years. The letter leaves housing 'to be discussed' and does not cover tax treatment, Japanese health insurance enrolment, or return conditions. The Korea–Japan social security agreement covers pensions only.",
    modelLine: "赴任前に、住宅補助・税金の扱い・健康保険の加入について書面で確認させていただけますか。",
    script: [
      { reply: "皆さん来日してから決めていますので、大丈夫ですよ。" },
      { reply: "住宅は社宅か家賃補助のどちらかになると思いますが、本社に確認が必要です。" },
      { reply: "承知しました。金曜日までに住宅・税金・保険の条件をメールでお送りします。" },
    ],
    messageKind: "package",
  },
];

export function scenariosFor(country: Country, persona: PersonaId): Scenario[] {
  return SCENARIOS.filter((s) => s.country === country && s.personas.includes(persona));
}

export const SCENARIOS_BY_ID: Record<string, Scenario> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

const HANGUL = /[가-힣]/;

export function hasHangul(text: string): boolean {
  return HANGUL.test(text);
}

/** 오프라인 코치: 숫자·근거·요청 표현이 있는지로 간단히 채점한다. */
export function offlineCoach(message: string, scenario: Scenario): Omit<CoachFeedback, "pressure" | "pressureNote"> {
  const m = message.toLowerCase();
  const hasNumber = /[$¥]?\d/.test(m);
  const hasBasis = /minimum|award|fair work|law|legal|rta|visa|limit|contract|in writing|payslip|rate|最低賃金|残業|割増|28時間|ガイドライン|書面|契約|法律|ビザ|在留/.test(m);
  const hasAsk = /i'?d like|i would like|could you|can you|please|i need|i want|i'?m asking|お願い|いただけ|ください|たいです|できますか/.test(m);
  const polite = /please|thank|could you|would you|appreciate|happy to|お願いします|恐れ入り|すみません|ありがとう|いただけますか/.test(m);
  const rude = /stupid|idiot|f\*|fuck|shut up|ふざけるな|バカ/.test(m);

  const evidence = hasNumber && hasBasis ? 3 : hasNumber || hasBasis ? 2 : 1;
  const clarity = hasAsk && (hasNumber || hasBasis) ? 3 : hasAsk ? 2 : 1;
  const politeness = rude ? 1 : polite ? 3 : 2;

  let praise = "말을 꺼낸 것부터 잘했어요.";
  if (evidence === 3 && clarity === 3) praise = "금액과 근거가 분명해서 아주 단단한 요청이에요.";
  else if (evidence >= 2) praise = "근거를 붙인 점이 좋아요. 원하는 걸 더 분명하게 말해 볼까요?";
  else if (clarity >= 2) praise = "원하는 걸 말한 점이 좋아요. 금액이나 근거를 붙이면 더 단단해져요.";

  return { praise, better: scenario.modelLine, scores: { clarity, evidence, politeness } };
}
