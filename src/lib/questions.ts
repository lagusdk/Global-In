import { randomUUID } from "node:crypto";
import { RULES_BY_ID, rulesFor } from "./kb";
import { chatJson, llmEnabled } from "./llm";
import type { Country, PersonaId, Source } from "./types";

/**
 * 멘토 질문함. 사용자는 익명으로 질문하고, 🔒을 걸면 멘토만 볼 수 있다.
 * AI가 질문을 먼저 요약·분류하고 관련 규칙과 답변 초안을 붙여 멘토에게 넘긴다. 답변은 멘토(사람)가 확인해서 올린다.
 * 데모에서는 서버 메모리에 저장한다 (서버가 다시 시작되면 예시 질문만 남는다).
 */

export type QCategory = "language" | "legal" | "life";

export const CATEGORY_LABEL: Record<QCategory, string> = { language: "언어·소통", legal: "법률·계약", life: "생활·정착" };

export type Triage = { summary: string; ruleIds: string[]; urgent: boolean; draft: string; mode: "ai" | "offline" };

export type Answer = { mentor: string; major: string; text: string; at: string };

export type Question = {
  id: string;
  token: string;
  country: Country;
  persona?: PersonaId;
  category: QCategory;
  text: string;
  locked: boolean;
  createdAt: string;
  triage: Triage;
  answer?: Answer;
};

/** 공개 화면용. 잠긴 질문은 내용을 빼고 보낸다. */
export type QuestionView = {
  id: string;
  country: Country;
  category: QCategory;
  locked: boolean;
  createdAt: string;
  text?: string;
  summary?: string;
  related?: { id: string; title: string; source: Source }[];
  urgent?: boolean;
  draft?: string;
  answer?: Answer;
  answered: boolean;
  mine?: boolean;
};

type Store = { questions: Question[] };
const g = globalThis as unknown as { __giQuestions?: Store };

function seed(): Question[] {
  const at = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  const triage = (summary: string, ruleIds: string[], urgent = false): Triage => ({ summary, ruleIds, urgent, draft: "", mode: "offline" });
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
      triage: triage("TFN 없이 일하면 세금이 많이 떼이는지", []),
      answer: {
        mentor: "멘토 하은",
        major: "영어영문학 · 호주 워홀 경험",
        text: "네, TFN을 고용주에게 내지 않으면 가장 높은 세율로 원천징수될 수 있어요. 호주 국세청(ATO) 사이트에서 온라인으로 바로 신청할 수 있고, 받으면 고용주에게 알려 주세요. 이미 많이 떼였다면 연말 세금 신고로 돌려받을 수 있어요.",
        at: at(26),
      },
    },
    {
      id: "seed-au-2",
      token: randomUUID(),
      country: "AU",
      persona: "student",
      category: "legal",
      text: "(비공개 질문)",
      locked: true,
      createdAt: at(5),
      triage: triage("근무시간 초과 요청에 대한 상담", ["AU-STUDENT-HOURS"]),
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
      triage: triage("퇴거 청소비 특약을 꼭 지켜야 하는지", ["JP-RESTORATION"]),
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
      createdAt: at(2),
      triage: triage("유학생 방학 중 아르바이트 시간 한도", ["JP-STUDENT-28H"]),
    },
  ];
}

const store: Store = (g.__giQuestions ??= { questions: seed() });

/** 키 없이도 동작하는 분류: 한국어 키워드로 규칙을 고른다. */
function offlineTriage(text: string, country: Country): Triage {
  const t = text.toLowerCase();
  const pick: string[] = [];
  const add = (au: string, jp: string, re: RegExp) => re.test(t) && pick.push(country === "JP" ? jp : au);
  add("AU-WAGE-BELOW-MIN", "JP-WAGE-BELOW-MIN", /최저|시급|월급|급여|덜 받/);
  add("AU-PAYSLIP", "JP-PAYSLIP", /명세서|payslip/);
  add("AU-BOND-PRIVATE", "JP-RESTORATION", /보증금|bond|시키킨|敷金|퇴거|청소비/);
  add("AU-STUDENT-HOURS", "JP-STUDENT-28H", /시간.*(한도|제한|초과)|몇 시간|28시간|48시간/);
  add("AU-JOB-FEE", "JP-JOB-FEE", /수수료|등록비|알선|선입금/);
  add("AU-UNPAID-TRIAL", "JP-UNPAID-TRAINING", /트라이얼|무급|수습|연수/);
  const ruleIds = [...new Set(pick)].filter((id) => RULES_BY_ID[id]).slice(0, 3);
  const urgent = /폭력|위협|협박|여권.*(뺏|가져)|감금|돈.*(안 줘|못 받)|쫓겨/.test(t);
  const summary = text.replace(/\s+/g, " ").slice(0, 40) + (text.length > 40 ? "…" : "");
  const draft = ruleIds.length
    ? `${RULES_BY_ID[ruleIds[0]].explain} ${RULES_BY_ID[ruleIds[0]].action}`
    : "상황을 조금 더 알려 주시면 정확히 안내해 드릴게요. 급하면 현지 공식 상담 창구에 먼저 연락해 보세요.";
  return { summary, ruleIds, urgent, draft, mode: "offline" };
}

const HELP_DESKS: Record<Country, string> = {
  AU: "Fair Work Ombudsman(임금·근로, 통역 TIS 131 450), 주 정부 보증금 기관(QLD RTA·NSW Fair Trading·VIC RTBA), Scamwatch(사기 신고), 주호주 대한민국 대사관·총영사관",
  JP: "노동기준감독서·종합노동상담코너, 외국인 노동자 상담 다이얼(후생노동성), 출입국재류관리청(비자·자격외활동), 소비자 핫라인 188(임대·계약), 주일본 대한민국 대사관·총영사관",
};

async function triageQuestion(text: string, country: Country): Promise<Triage> {
  const fallback = offlineTriage(text, country);
  if (!llmEnabled()) return fallback;
  const rules = rulesFor(country)
    .map((r) => `- ${r.id}: ${r.title} — ${r.explain} 할 일: ${r.action}`)
    .join("\n");
  try {
    const out = await chatJson<{ summary?: string; ruleIds?: string[]; urgent?: boolean; draft?: string }>({
      kind: "text",
      temperature: 0.2,
      maxTokens: 800,
      timeoutMs: 20_000,
      messages: [
        {
          role: "system",
          content: `해외(${country === "JP" ? "일본" : "호주"})에 있는 한국 청년의 익명 질문을 멘토에게 넘기기 전에 정리합니다.
- summary: 질문 요지를 한국어 40자 이내로
- ruleIds: 아래 규칙 목록에서 관련 있는 id 최대 3개 (없으면 빈 배열). 목록에 없는 id는 쓰지 않음
- urgent: 신체 위험·협박·여권 압수·당장 돈을 잃는 상황이면 true
- draft: 멘토가 다듬을 답변 초안. 쉬운 해요체 3~4문장. 아래 규칙의 설명과 할 일만 근거로 쓰고, 법 조항이나 숫자를 지어내지 않음. 부당한 요구는 정중히 거절해도 된다고 안내. 상담 창구는 아래 '현지 상담 창구' 목록에서만 고름 (한국 기관을 현지 창구처럼 쓰지 않음)
JSON 하나만 출력: {"summary","ruleIds","urgent","draft"}

[규칙 목록]
${rules}

[현지 상담 창구]
${HELP_DESKS[country]}`,
        },
        { role: "user", content: text.slice(0, 2000) },
      ],
    });
    const ruleIds = (out.ruleIds ?? []).filter((id) => typeof id === "string" && RULES_BY_ID[id] && rulesFor(country).some((r) => r.id === id)).slice(0, 3);
    return {
      summary: out.summary?.slice(0, 80) || fallback.summary,
      ruleIds: ruleIds.length ? ruleIds : fallback.ruleIds,
      urgent: Boolean(out.urgent) || fallback.urgent,
      draft: out.draft || fallback.draft,
      mode: "ai",
    };
  } catch (e) {
    console.error("[questions] triage failed, using keywords:", e instanceof Error ? e.message : e);
    return fallback;
  }
}

export async function addQuestion(input: { country: Country; persona?: PersonaId; category: QCategory; text: string; locked: boolean }): Promise<Question> {
  const q: Question = {
    id: randomUUID().slice(0, 8),
    token: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
    triage: await triageQuestion(input.text, input.country),
  };
  store.questions.unshift(q);
  return q;
}

export function answerQuestion(id: string, answer: Omit<Answer, "at">): Question | null {
  const q = store.questions.find((x) => x.id === id);
  if (!q) return null;
  q.answer = { ...answer, at: new Date().toISOString() };
  return q;
}

function related(q: Question) {
  return q.triage.ruleIds.map((id) => ({ id, title: RULES_BY_ID[id].title, source: RULES_BY_ID[id].source }));
}

/** role: "public"이면 잠긴 질문 내용을 숨기고, "mentor"면 모두 보여 준다. mine은 {id: token}. */
export function listQuestions(country: Country, role: "public" | "mentor", mine: Record<string, string> = {}): QuestionView[] {
  return store.questions
    .filter((q) => q.country === country)
    .map((q) => {
      const isMine = mine[q.id] === q.token;
      const open = !q.locked || role === "mentor" || isMine;
      const base: QuestionView = { id: q.id, country: q.country, category: q.category, locked: q.locked, createdAt: q.createdAt, answered: Boolean(q.answer), mine: isMine || undefined };
      if (!open) return base;
      return {
        ...base,
        text: q.text,
        summary: q.triage.summary,
        related: related(q),
        answer: q.answer,
        ...(role === "mentor" ? { urgent: q.triage.urgent, draft: q.triage.draft } : {}),
      };
    });
}
