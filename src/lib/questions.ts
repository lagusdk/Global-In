import { randomUUID } from "node:crypto";
import { RULES_BY_ID, rulesFor } from "./kb";
import { chat, llmEnabled } from "./llm";
import { db } from "./db";
import type { Country, PersonaId } from "./types";

/**
 * 멘토 질문함.
 * - 질문·답변은 서포터즈(사람)가 직접 쓴다. AI는 욕설·개인정보 필터(moderation.ts)에만 쓴다.
 * - 질문 후 48시간 동안 서포터즈 답변이 없으면, AI가 지식팩 근거로 답변을 대신 달고 "AI 답변"으로 표시한다.
 * - 🔒 잠긴 질문은 질문자 기기의 토큰과 승인된 멘토 화면에서만 내용이 보인다.
 */

export type QCategory = "language" | "legal" | "life";

export const CATEGORY_LABEL: Record<QCategory, string> = { language: "언어·소통", legal: "법률·계약", life: "생활·정착" };

export const AI_FALLBACK_HOURS = 48;

export type Answer = { mentor: string; major: string; text: string; at: string; byAI?: boolean };

export type Question = {
  id: string;
  token: string;
  country: Country;
  persona?: PersonaId;
  category: QCategory;
  text: string;
  locked: boolean;
  createdAt: string;
  answer?: Answer;
};

/** 화면용. 잠긴 질문은 권한이 없으면 내용을 빼고 보낸다. */
export type QuestionView = {
  id: string;
  country: Country;
  category: QCategory;
  locked: boolean;
  createdAt: string;
  text?: string;
  answer?: Answer;
  answered: boolean;
  /** AI 대체 답변까지 남은 시간(시간) */
  aiInHours?: number;
  mine?: boolean;
};

function seed(): Question[] {
  const at = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  return [
    {
      id: "seed-au-1",
      token: randomUUID(),
      country: "AU",
      persona: "jobseeker",
      category: "legal",
      text: "워홀 2주차인데, 사장님이 TFN(세금번호) 없으면 월급에서 세금을 거의 절반 뗀다고 해요. 진짜인가요?",
      locked: false,
      createdAt: at(30),
      answer: {
        mentor: "멘토 하은",
        major: "영어영문학 · 호주 워홀 경험",
        text: "네, TFN을 고용주에게 내지 않으면 가장 높은 세율로 원천징수될 수 있어요. 호주 국세청(ATO) 사이트에서 온라인으로 신청할 수 있고, 받으면 고용주에게 알려 주세요. 이미 많이 떼였다면 연말 세금 신고로 돌려받을 수 있어요.",
        at: at(26),
      },
    },
    {
      id: "seed-au-2",
      token: randomUUID(),
      country: "AU",
      persona: "student",
      category: "legal",
      text: "매니저가 시험 기간에도 주 30시간씩 일해 달라고 해요. 학생비자인데 거절해도 될까요?",
      locked: true,
      createdAt: at(5),
    },
    {
      id: "seed-au-3",
      token: randomUUID(),
      country: "AU",
      persona: "jobseeker",
      category: "life",
      text: "쉐어하우스 집주인이 보증금(bond)을 현금으로만 달래요. 영수증만 받으면 괜찮을까요?",
      locked: false,
      createdAt: at(50),
    },
    {
      id: "seed-jp-1",
      token: randomUUID(),
      country: "JP",
      persona: "student",
      category: "legal",
      text: "셰어하우스 퇴거할 때 청소비 3만 엔을 내라고 해요. 계약서에 써 있으면 무조건 내야 하나요?",
      locked: false,
      createdAt: at(20),
      answer: {
        mentor: "멘토 준서",
        major: "법학 · 일본 교환학생 경험",
        text: "금액이 계약서에 분명히 적혀 있고 입주 때 설명을 들었다면 청소비 특약은 유효할 수 있어요. 다만 보통으로 살면서 생긴 마모까지 전부 세입자에게 물리는 건 국토교통성 가이드라인과 달라서 따져 볼 수 있어요. 청구서에 항목별 금액을 달라고 하고, 입주 때 찍은 사진이 있으면 함께 보여 주세요. 정리가 안 되면 소비자 핫라인 188에 상담해 보세요.",
        at: at(18),
      },
    },
    {
      id: "seed-jp-2",
      token: randomUUID(),
      country: "JP",
      persona: "student",
      category: "life",
      text: "유학생인데 여름방학에는 알바를 몇 시간까지 할 수 있나요?",
      locked: false,
      createdAt: at(52),
    },
  ];
}

async function store() {
  const s = await db();
  const g = globalThis as unknown as { __giQSeeded?: boolean };
  if (!g.__giQSeeded) {
    const existing = await s.list<Question>("questions");
    if (!existing.length) for (const q of seed()) await s.put("questions", q.id, q);
    g.__giQSeeded = true;
  }
  return s;
}

const HELP_DESKS: Record<Country, string> = {
  AU: "Fair Work Ombudsman(임금·근로, 통역 TIS 131 450), 주 정부 보증금 기관(QLD RTA·NSW Fair Trading·VIC RTBA), Scamwatch(사기 신고), 워킹홀리데이 인포센터(재외동포청), 주호주 대한민국 대사관·총영사관",
  JP: "노동기준감독서·종합노동상담코너, 외국인 노동자 상담 다이얼(후생노동성), 출입국재류관리청(비자·자격외활동), 소비자 핫라인 188(임대·계약), 주일본 대한민국 대사관·총영사관",
};

/** 키 없이도 동작하는 대체 답변: 한국어 키워드로 관련 규칙을 고른다. */
function offlineAnswer(text: string, country: Country): string {
  const t = text.toLowerCase();
  const pick: string[] = [];
  const add = (au: string, jp: string, re: RegExp) => re.test(t) && pick.push(country === "JP" ? jp : au);
  add("AU-WAGE-BELOW-MIN", "JP-WAGE-BELOW-MIN", /최저|시급|월급|급여|덜 받/);
  add("AU-PAYSLIP", "JP-PAYSLIP", /명세서|payslip/);
  add("AU-BOND-PRIVATE", "JP-RESTORATION", /보증금|bond|시키킨|敷金|퇴거|청소비/);
  add("AU-STUDENT-HOURS", "JP-STUDENT-28H", /학생|유학|시간.*(한도|제한|초과)|몇 시간|28시간|48시간|방학/);
  add("AU-JOB-FEE", "JP-JOB-FEE", /수수료|등록비|알선|선입금/);
  add("AU-UNPAID-TRIAL", "JP-UNPAID-TRAINING", /트라이얼|무급|수습|연수/);
  const ids = [...new Set(pick)].filter((id) => RULES_BY_ID[id]).slice(0, 2);
  if (!ids.length) return `정확한 판단이 어려워서 공식 창구 확인을 권해요. 상황에 맞는 곳: ${HELP_DESKS[country]}.`;
  return ids.map((id) => `${RULES_BY_ID[id].explain} ${RULES_BY_ID[id].action}`).join(" ");
}

async function aiAnswer(q: Question): Promise<string> {
  if (!llmEnabled()) return offlineAnswer(q.text, q.country);
  const rules = rulesFor(q.country)
    .map((r) => `- ${r.title}: ${r.explain} 할 일: ${r.action}`)
    .join("\n");
  try {
    const out = await chat({
      kind: "text",
      temperature: 0.2,
      maxTokens: 600,
      timeoutMs: 20_000,
      messages: [
        {
          role: "system",
          content: `해외(${q.country === "JP" ? "일본" : "호주"})에 있는 한국 청년의 익명 질문에, 서포터즈 답변이 48시간 동안 없어서 대신 답합니다.
- 쉬운 해요체 3~5문장. 아래 규칙의 설명과 할 일만 근거로 쓰고, 법 조항이나 숫자를 지어내지 않음
- 확실하지 않으면 단정하지 말고 공식 창구를 안내. 상담 창구는 아래 목록에서만 고름 (한국 기관을 현지 창구처럼 쓰지 않음)
- 부당한 요구는 정중히 거절해도 된다고 안내
- 답변 본문만 출력

[규칙]
${rules}

[현지 상담 창구]
${HELP_DESKS[q.country]}`,
        },
        { role: "user", content: q.text.slice(0, 2000) },
      ],
    });
    return out.trim() || offlineAnswer(q.text, q.country);
  } catch (e) {
    console.error("[questions] AI fallback failed:", e instanceof Error ? e.message : e);
    return offlineAnswer(q.text, q.country);
  }
}

const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3_600_000;

/** 48시간 넘게 답이 없는 질문에 AI 대체 답변을 단다. 한 번에 최대 2건 (응답 지연을 막기 위해). */
async function fillOverdue(questions: Question[]) {
  const s = await store();
  const overdue = questions.filter((q) => !q.answer && hoursSince(q.createdAt) >= AI_FALLBACK_HOURS).slice(0, 2);
  for (const q of overdue) {
    q.answer = {
      mentor: "Global-In AI",
      major: `서포터즈 답변이 ${AI_FALLBACK_HOURS}시간 동안 없어 지식팩 근거로 작성`,
      text: await aiAnswer(q),
      at: new Date().toISOString(),
      byAI: true,
    };
    await s.put("questions", q.id, q);
  }
}

export async function addQuestion(input: { country: Country; persona?: PersonaId; category: QCategory; text: string; locked: boolean }): Promise<Question> {
  const s = await store();
  const q: Question = { id: randomUUID().slice(0, 8), token: randomUUID(), ...input, createdAt: new Date().toISOString() };
  await s.put("questions", q.id, q);
  return q;
}

/** 서포터즈 답변. AI 대체 답변이 있어도 사람 답변으로 바꿀 수 있다. */
export async function answerQuestion(id: string, answer: Omit<Answer, "at" | "byAI">): Promise<Question | null> {
  const s = await store();
  const q = await s.get<Question>("questions", id);
  if (!q) return null;
  q.answer = { ...answer, at: new Date().toISOString() };
  await s.put("questions", q.id, q);
  return q;
}

/** role: "public"이면 잠긴 질문 내용을 숨기고, "mentor"(승인된 서포터즈)면 모두 보여 준다. mine은 {id: token}. */
export async function listQuestions(country: Country, role: "public" | "mentor", mine: Record<string, string> = {}): Promise<QuestionView[]> {
  const s = await store();
  const all = (await s.list<Question>("questions")).filter((q) => q.country === country);
  await fillOverdue(all);
  return all
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((q) => {
      const isMine = mine[q.id] === q.token;
      const open = !q.locked || role === "mentor" || isMine;
      const base: QuestionView = {
        id: q.id,
        country: q.country,
        category: q.category,
        locked: q.locked,
        createdAt: q.createdAt,
        answered: Boolean(q.answer),
        aiInHours: q.answer ? undefined : Math.max(0, Math.ceil(AI_FALLBACK_HOURS - hoursSince(q.createdAt))),
        mine: isMine || undefined,
      };
      return open ? { ...base, text: q.text, answer: q.answer } : base;
    });
}
