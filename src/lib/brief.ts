import { AU_RULES } from "./kb/au";
import { chatJson, llmEnabled } from "./llm";
import { summarize } from "./signals";
import type { PersonaId } from "./types";

export type OrgId = "uni" | "youth" | "hr" | "gov";

export const ORGS: Record<OrgId, { label: string; persona?: PersonaId; doc: string; audience: string }> = {
  uni: { label: "대학 국제처", persona: "student", doc: "출국 전 오리엔테이션 자료", audience: "교환학생·유학생" },
  youth: { label: "청년·고용 지원기관", persona: "jobseeker", doc: "워홀·해외취업 준비 교육 자료", audience: "워킹홀리데이·해외취업 준비 청년" },
  hr: { label: "기업 HR", persona: "worker", doc: "파견자 정착 체크리스트", audience: "해외 파견 예정 직원" },
  gov: { label: "재외공관·공공기관", doc: "재외국민 안전 공지 초안", audience: "호주 체류 한국 청년" },
};

export type Brief = { title: string; sections: { heading: string; items: string[] }[]; mode: "ai" | "offline" };

function templateBrief(org: OrgId): Brief {
  const o = ORGS[org];
  const s = summarize(o.persona);
  const rules = AU_RULES.filter((r) => !o.persona || r.personas.includes(o.persona)).slice(0, 5);
  return {
    title: `${o.doc} (호주)`,
    sections: [
      { heading: "최근 30일, 이런 어려움이 많았어요", items: s.topIssues.map((i) => `${i.issue} — ${i.count}건`) },
      { heading: "서명 전에 꼭 확인할 것", items: rules.map((r) => `${r.title}: ${r.action}`) },
      {
        heading: "도움받을 곳",
        items: ["Fair Work Ombudsman — 임금·근로 상담 (통역 TIS 131 450)", "주 정부 보증금 기관 — 렌트 보증금 보관", "대한민국 대사관·총영사관 — 영사 조력"],
      },
    ],
    mode: "offline",
  };
}

export async function makeBrief(org: OrgId): Promise<Brief> {
  const template = templateBrief(org);
  if (!llmEnabled()) return template;
  const o = ORGS[org];
  try {
    const out = await chatJson<{ title?: string; sections?: { heading?: string; items?: string[] }[] }>({
      temperature: 0.3,
      maxTokens: 1200,
      timeoutMs: 30_000,
      messages: [
        {
          role: "system",
          content:
            "당신은 한국 기관 담당자를 돕는 편집자입니다. 주어진 집계와 체크리스트만 사용해, 대상자가 바로 읽을 수 있는 짧고 쉬운 한국어(해요체) 안내 자료를 만듭니다. 숫자와 기관명은 바꾸지 않고, 새로운 법 조항을 지어내지 않습니다. 출력은 JSON 하나: {\"title\": string, \"sections\": [{\"heading\": string, \"items\": string[]}]} (섹션 3~4개, 항목 3~5개).",
        },
        { role: "user", content: `자료 종류: ${o.doc}\n대상: ${o.audience}\n\n초안:\n${JSON.stringify(template.sections)}` },
      ],
    });
    const sections = (out.sections ?? [])
      .filter((sec) => sec.heading && Array.isArray(sec.items))
      .map((sec) => ({ heading: sec.heading!, items: sec.items!.filter((i) => typeof i === "string") }));
    if (!sections.length) return template;
    return { title: out.title || template.title, sections, mode: "ai" };
  } catch (e) {
    console.error("[brief] LLM failed, using template:", e instanceof Error ? e.message : e);
    return template;
  }
}
