import { AU_PAY } from "./kb/au";
import { COUNTRIES, CITIES } from "./kb/countries";
import { RULES_BY_ID, rulesFor } from "./kb";
import { JP_PAY, jpMinHourly } from "./kb/jp";
import { LlmError, TEXT_MODEL, chat, chatJson, llmEnabled } from "./llm";
import { DOC_TYPE_LABEL } from "./personas";
import { detectDocType, runRules, sortFindings } from "./ruleEngine";
import type { AnalysisResult, CityId, DocType, Extracted, Finding, Level, PersonaId } from "./types";

export type AnalyzeInput = {
  persona: PersonaId;
  city: CityId;
  text?: string;
  imageDataUrl?: string;
  docType?: DocType;
  title?: string;
};

export class AnalyzeError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

const MAX_TEXT = 12_000;

/** 모델에게 알려 줄 국가별 기준 숫자 */
function basisLine(cityId: CityId): string {
  if (CITIES[cityId].country === "JP") {
    return `${CITIES[cityId].region} 최저임금 시급 ¥${jpMinHourly(cityId)} (${JP_PAY.effectiveFrom}), 주 40시간·하루 8시간 초과 25% 할증, 심야(22~5시) 25% 할증, 유학생 자격외활동 주 28시간.`;
  }
  return `국가 최저시급 A$${AU_PAY.nationalMinimumHourly}, 캐주얼 가산 25% (${AU_PAY.effectiveFrom} 기준), 학생비자 학기 중 2주 48시간.`;
}

/** 서류 사진을 비전 모델로 글자 그대로 옮긴다. */
export async function transcribeImage(dataUrl: string): Promise<string> {
  const text = await chat({
    kind: "vision",
    maxTokens: 1500,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Transcribe all text in this document image exactly as written, line by line, in its original language. Do not summarise, translate or add commentary. If there is no readable text, reply with NO_TEXT.",
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });
  const trimmed = text.trim();
  if (!trimmed || trimmed === "NO_TEXT") throw new AnalyzeError("사진에서 글자를 읽지 못했어요. 더 밝고 가까이 찍어 주세요.", 422);
  return trimmed;
}

type LlmAnalysis = {
  docTitle?: string;
  language?: string;
  summary?: string;
  koreaSummary?: string;
  findings?: { ruleId?: string | null; level?: Level; title?: string; quote?: string; explanation?: string; korea?: string; action?: string }[];
  okItems?: string[];
  extracted?: Extracted;
};

function buildPrompt(text: string, input: AnalyzeInput, docType: DocType, ruleHits: Finding[]) {
  const city = CITIES[input.city];
  const rules = rulesFor(city.country).filter((r) => r.personas.includes(input.persona));
  const ruleList = rules.map((r) => `- ${r.id} [${r.level}] ${r.title}: ${r.explain}`).join("\n");
  const hits = ruleHits.map((f) => `- ${f.ruleId}: ${f.title}${f.quote ? ` ("${f.quote}")` : ""}`).join("\n") || "- (없음)";

  const system = `당신은 해외에 처음 나간 한국 청년을 돕는 서류 검토 도우미입니다.
규칙:
1. 반드시 아래 '지식팩 규칙' 목록에 있는 근거로만 위험을 판정하고, 해당 규칙 id를 ruleId에 적습니다.
2. 목록에 없는 우려는 ruleId를 null로 두고 level은 "caution" 이하로만 씁니다. 법 조항이나 숫자를 지어내지 않습니다.
3. 금액 계산은 하지 않습니다(코드가 따로 계산합니다). 서류에 적힌 숫자만 extracted에 옮깁니다.
4. 설명은 쉬운 한국어 존댓말(해요체)로, 각 항목 2문장 이내로 씁니다. 'korea'에는 한국 상황에 빗댄 한 문장을 씁니다.
5. quote에는 서류 원문 문장을 그대로 짧게 인용합니다.
6. 출력은 JSON 객체 하나만 씁니다.`;

  const user = `사용자: ${input.persona === "student" ? "학생(학생비자)" : input.persona === "worker" ? "직장인(회사 파견)" : "워킹홀리데이/해외취업"} · ${COUNTRIES[city.country].label} ${city.label}(${city.region})
서류 종류: ${DOC_TYPE_LABEL[docType]}
기준: ${basisLine(input.city)}

[지식팩 규칙]
${ruleList}

[규칙 엔진이 이미 찾은 항목]
${hits}

[서류 원문]
"""
${text.slice(0, MAX_TEXT)}
"""

다음 형식으로 답하세요:
{"docTitle": "서류 제목(한국어, 15자 이내)", "language": "원문 언어(한국어로)", "summary": "가장 중요한 문제를 담은 한 줄 요약 (해요체)", "koreaSummary": "가장 큰 문제를 한국 상황에 빗댄 한 문장 (해요체, 예: 한국으로 치면 명세서 없이 최저시급보다 적게 주는 현금 알바예요.)", "findings": [{"ruleId": "규칙 id 또는 null", "level": "risk|caution|info", "title": "짧은 제목", "quote": "원문 인용", "explanation": "설명", "korea": "한국에 빗댄 설명", "action": "할 일"}], "okItems": ["문제없는 조항 요약"], "extracted": {"hourlyRate": 숫자 또는 null, "employmentType": "casual|part_time|full_time|unknown", "hoursPerWeek": 숫자 또는 null, "payMethod": "cash|bank|unknown", "weeklyRent": 숫자 또는 null, "bondAmount": 숫자 또는 null}}`;

  return { system, user };
}

/** 규칙 엔진 결과를 기준으로 LLM 결과를 합친다. 근거 없는 판정은 낮추고, 숫자는 규칙 엔진 값을 쓴다. */
export function mergeFindings(ruleHits: Finding[], llmFindings: LlmAnalysis["findings"]): Finding[] {
  const merged = new Map<string, Finding>();
  for (const f of ruleHits) merged.set(f.ruleId ?? f.title, f);

  for (const raw of llmFindings ?? []) {
    if (!raw?.title || !raw.explanation) continue;
    const rule = raw.ruleId ? RULES_BY_ID[raw.ruleId] : undefined;
    if (rule) {
      const existing = merged.get(rule.id);
      if (existing) {
        // 규칙 엔진의 숫자 설명은 유지하고, 인용이 없으면 LLM 인용으로 채운다.
        merged.set(rule.id, { ...existing, quote: existing.quote ?? raw.quote, origin: "both" });
      } else {
        merged.set(rule.id, {
          ruleId: rule.id,
          level: rule.level,
          title: raw.title,
          quote: raw.quote,
          explanation: raw.explanation,
          korea: raw.korea ?? rule.korea,
          action: raw.action ?? rule.action,
          source: rule.source.url ? rule.source : undefined,
          origin: "ai",
        });
      }
    } else {
      const key = `ai:${raw.title}`;
      if (merged.has(key)) continue;
      merged.set(key, {
        ruleId: null,
        level: raw.level === "risk" ? "caution" : raw.level === "info" ? "info" : "caution",
        title: raw.title,
        quote: raw.quote,
        explanation: raw.explanation,
        korea: raw.korea,
        action: raw.action,
        origin: "ai",
      });
    }
  }
  return sortFindings([...merged.values()]);
}

function offlineSummary(docType: DocType, findings: Finding[]): { summary: string; koreaSummary: string } {
  const risks = findings.filter((f) => f.level === "risk").length;
  const label = DOC_TYPE_LABEL[docType];
  if (!findings.length) return { summary: `${label}에서 지식팩 기준으로 걸리는 조항을 찾지 못했어요.`, koreaSummary: "그래도 서명 전에 근무 시간·급여·해지 조건은 직접 한 번 더 확인하세요." };
  return {
    summary: `${label}에서 짚어볼 곳 ${findings.length}건을 찾았어요${risks ? ` (위험 ${risks}건)` : ""}.`,
    koreaSummary: findings[0].korea ?? "서명하기 전에 아래 항목을 꼭 확인하세요.",
  };
}

export async function analyzeDocument(input: AnalyzeInput): Promise<AnalysisResult & { text: string }> {
  let text = input.text?.trim() ?? "";
  if (!text && input.imageDataUrl) {
    if (!llmEnabled()) throw new AnalyzeError("지금은 오프라인 모드라 사진을 읽을 수 없어요. 서류 글자를 붙여넣거나 예시 서류로 확인해 보세요.", 422);
    text = await transcribeImage(input.imageDataUrl);
  }
  if (!text) throw new AnalyzeError("확인할 서류 내용이 없어요.");

  const docType = input.docType ?? detectDocType(text);
  const city = CITIES[input.city];
  const rules = runRules(text, { country: city.country, persona: input.persona, region: city.country === "JP" ? input.city : city.region, docType });
  const base = {
    docType,
    docTitle: input.title ?? DOC_TYPE_LABEL[docType],
    language: /[가-힣]/.test(text) ? "한국어" : /[ぁ-んァ-ン一-龥]/.test(text) ? "일본어" : "영어",
    okItems: [] as string[],
    text,
  };

  if (!llmEnabled()) {
    return { ...base, ...offlineSummary(docType, rules.findings), findings: rules.findings, extracted: rules.extracted, mode: "offline" };
  }

  try {
    const { system, user } = buildPrompt(text, input, docType, rules.findings);
    let usedModel = TEXT_MODEL;
    const out = await chatJson<LlmAnalysis>({
      kind: "text",
      temperature: 0.1,
      maxTokens: 2000,
      timeoutMs: 25_000,
      onModel: (m) => (usedModel = m),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const findings = mergeFindings(rules.findings, out.findings);
    // 숫자는 규칙 엔진이 읽은 값을 우선한다.
    const extracted: Extracted = { ...cleanExtracted(out.extracted), ...stripUndefined(rules.extracted) };
    return {
      ...base,
      docTitle: input.title ?? out.docTitle ?? base.docTitle,
      language: out.language ?? base.language,
      summary: out.summary ?? offlineSummary(docType, findings).summary,
      koreaSummary: out.koreaSummary ?? offlineSummary(docType, findings).koreaSummary,
      findings,
      okItems: (out.okItems ?? []).filter((s) => typeof s === "string").slice(0, 5),
      extracted,
      mode: "ai",
      model: usedModel,
    };
  } catch (e) {
    const reason = e instanceof LlmError ? e.message : String(e);
    console.error("[analyze] LLM failed, falling back to rule engine:", reason);
    return {
      ...base,
      ...offlineSummary(docType, rules.findings),
      findings: rules.findings,
      extracted: rules.extracted,
      mode: "offline",
      notice: "AI 응답이 늦어 규칙 엔진 결과만 보여 드려요.",
    };
  }
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && !(v === "unknown"))) as Partial<T>;
}

function cleanExtracted(e: Extracted | undefined): Extracted {
  if (!e) return {};
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  return stripUndefined({
    hourlyRate: num(e.hourlyRate),
    hoursPerWeek: num(e.hoursPerWeek),
    weeklyRent: num(e.weeklyRent),
    bondAmount: num(e.bondAmount),
    employmentType: ["casual", "part_time", "full_time"].includes(e.employmentType as string) ? e.employmentType : undefined,
    payMethod: ["cash", "bank"].includes(e.payMethod as string) ? e.payMethod : undefined,
  });
}
