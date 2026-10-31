/**
 * NVIDIA Build(OpenAI 호환) 클라이언트. 서버(API 라우트)에서만 import 한다.
 * 키가 없거나 FORCE_OFFLINE=1 이면 호출하지 않고, 호출하는 쪽이 오프라인 경로로 내려가게 한다.
 */

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
export type LlmMessage = { role: "system" | "user" | "assistant"; content: string | (TextPart | ImagePart)[] };

const BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";

/**
 * 용도별 모델 목록. 앞에서부터 시도하고, 실패(단종 410·404·5xx·시간 초과)하면 다음 모델로 넘어간다.
 * 환경 변수에는 쉼표로 여러 개를 적을 수 있다. 기본값은 2026-10-31 한국어 JSON 비교 결과로 골랐다.
 */
function modelList(env: string, fallback: string): string[] {
  return (process.env[env] || fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type ModelKind = "text" | "fast" | "vision";

export const MODELS: Record<ModelKind, string[]> = {
  text: modelList("NVIDIA_TEXT_MODEL", "nvidia/nemotron-3.5-super-vl-120b-a12b,nvidia/nemotron-3-ultra-550b-a55b,openai/gpt-oss-20b"),
  fast: modelList("NVIDIA_FAST_MODEL", "nvidia/nemotron-3.5-bolt-e4b,nvidia/nemotron-3-ultra-550b-a55b"),
  vision: modelList("NVIDIA_VISION_MODEL", "nvidia/nemotron-3.5-super-vl-120b-a12b,meta/llama-3.2-90b-vision-instruct"),
};

export const TEXT_MODEL = MODELS.text[0];
export const FAST_MODEL = MODELS.fast[0];
export const VISION_MODEL = MODELS.vision[0];

export function llmEnabled(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY) && process.env.FORCE_OFFLINE !== "1";
}

export class LlmError extends Error {}

/** 추론 모델이 붙이는 <think>…</think> 블록을 지운다. 닫히지 않은 블록은 끝까지 지운다. */
export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?(<\/think>|$)/gi, "").trim();
}

async function callModel(model: string, opts: ChatOptions): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30_000);
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 1500,
        stream: false,
        // Nemotron 계열의 내부 추론을 끈다. 켜 두면 응답이 3~7배 느려지고 토큰을 다 써서 빈 답이 오기도 한다.
        chat_template_kwargs: { enable_thinking: false, thinking: false },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new LlmError(`${model} → ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
    const content = stripThinking(data.choices?.[0]?.message?.content ?? "");
    if (!content) throw new LlmError(`${model} → empty completion`);
    return content;
  } catch (e) {
    if (e instanceof LlmError) throw e;
    throw new LlmError(`${model} → ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    clearTimeout(timer);
  }
}

type ChatOptions = {
  messages: LlmMessage[];
  kind?: ModelKind;
  temperature?: number;
  maxTokens?: number;
  /** 모델 하나당 제한 시간 */
  timeoutMs?: number;
  /** 실제로 답한 모델 이름을 받는다 */
  onModel?: (model: string) => void;
};

export async function chat(opts: ChatOptions): Promise<string> {
  if (!llmEnabled()) throw new LlmError("LLM disabled");
  const errors: string[] = [];
  for (const model of MODELS[opts.kind ?? "text"]) {
    try {
      const content = await callModel(model, opts);
      opts.onModel?.(model);
      return content;
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
      console.warn("[llm] model failed, trying next:", errors[errors.length - 1]);
    }
  }
  throw new LlmError(errors.join(" | "));
}

/** 모델 응답에서 첫 JSON 객체를 꺼낸다. 코드펜스나 앞뒤 설명이 붙어 와도 견딘다. */
export function parseJsonObject<T>(raw: string): T {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(raw);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf("{");
  if (start < 0) throw new LlmError("no JSON object in completion");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < body.length; i++) {
    const c = body[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return JSON.parse(body.slice(start, i + 1)) as T;
  }
  throw new LlmError("unterminated JSON object in completion");
}

export async function chatJson<T>(opts: Parameters<typeof chat>[0]): Promise<T> {
  const raw = await chat(opts);
  try {
    return parseJsonObject<T>(raw);
  } catch {
    // 한 번만 형식을 고쳐 달라고 다시 묻는다.
    const retry = await chat({
      ...opts,
      messages: [
        ...opts.messages,
        { role: "assistant", content: raw },
        { role: "user", content: "위 답을 설명 없이 유효한 JSON 객체 하나로만 다시 출력해 주세요." },
      ],
    });
    return parseJsonObject<T>(retry);
  }
}
