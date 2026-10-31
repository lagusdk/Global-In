/**
 * NVIDIA Build(OpenAI 호환) 클라이언트. 서버(API 라우트)에서만 import 한다.
 * 키가 없거나 FORCE_OFFLINE=1 이면 호출하지 않고, 호출하는 쪽이 오프라인 경로로 내려가게 한다.
 */

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
export type LlmMessage = { role: "system" | "user" | "assistant"; content: string | (TextPart | ImagePart)[] };

const BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
export const TEXT_MODEL = process.env.NVIDIA_TEXT_MODEL || "meta/llama-3.3-70b-instruct";
export const VISION_MODEL = process.env.NVIDIA_VISION_MODEL || "meta/llama-3.2-90b-vision-instruct";

export function llmEnabled(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY) && process.env.FORCE_OFFLINE !== "1";
}

export class LlmError extends Error {}

export async function chat(opts: {
  messages: LlmMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  if (!llmEnabled()) throw new LlmError("LLM disabled");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 45_000);
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: opts.model ?? TEXT_MODEL,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 1500,
        stream: false,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new LlmError(`NVIDIA API ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new LlmError("empty completion");
    return content;
  } catch (e) {
    if (e instanceof LlmError) throw e;
    throw new LlmError(e instanceof Error ? e.message : String(e));
  } finally {
    clearTimeout(timer);
  }
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
