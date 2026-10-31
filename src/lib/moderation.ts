import { chatJson, llmEnabled } from "./llm";

/**
 * 질문·답변 필터. 욕설·비하 표현과 개인정보(전화번호·이메일·주민번호)만 막는다.
 * 1) 정규식으로 먼저 거르고  2) 키가 있으면 AI로 한 번 더 본다. AI가 실패하면 정규식 결과만 쓴다.
 */

export type ModerationResult = { ok: true } | { ok: false; reason: string };

const PROFANITY = /시발|씨발|ㅅㅂ|ㅆㅂ|병신|ㅂㅅ|개새|좆|존나|지랄|꺼져|닥쳐|느금|애미|fuck|shit|bitch|asshole|クソ|死ね|バカ野郎/i;
const PHONE = /(?:\+?\d{1,3}[-\s]?)?(?:0\d{1,2}|\d{3})[-\s]?\d{3,4}[-\s]?\d{4}/;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
const RRN = /\d{6}[-\s]?[1-4]\d{6}/;

export function moderateOffline(text: string): ModerationResult {
  if (PROFANITY.test(text)) return { ok: false, reason: "욕설이나 비하 표현이 있어서 등록할 수 없어요. 표현을 바꿔 주세요." };
  if (RRN.test(text)) return { ok: false, reason: "주민등록번호처럼 보이는 숫자가 있어요. 개인정보는 지우고 올려 주세요." };
  if (EMAIL.test(text) || PHONE.test(text)) return { ok: false, reason: "전화번호나 이메일 같은 연락처는 적지 말아 주세요. 익명이 지켜지도록 지우고 올려 주세요." };
  return { ok: true };
}

export async function moderate(text: string): Promise<ModerationResult> {
  const offline = moderateOffline(text);
  if (!offline.ok || !llmEnabled()) return offline;
  try {
    const out = await chatJson<{ ok?: boolean; reason?: string }>({
      kind: "fast",
      temperature: 0,
      maxTokens: 120,
      timeoutMs: 8_000,
      messages: [
        {
          role: "system",
          content:
            '익명 질문함의 게시물을 검사합니다. 욕설·비하·혐오·성희롱 표현이 있거나, 특정 개인을 알아볼 수 있는 정보(실명+연락처, 주소 등)가 있으면 ok=false입니다. 노동·임대 피해를 설명하는 강한 표현이나 고용주를 비판하는 내용은 허용합니다. JSON 하나만: {"ok": boolean, "reason": "ok=false일 때 사용자에게 보여 줄 짧은 한국어 해요체 안내"}',
        },
        { role: "user", content: text.slice(0, 2000) },
      ],
    });
    if (out.ok === false) return { ok: false, reason: out.reason || "표현을 조금 바꿔서 다시 올려 주세요." };
    return { ok: true };
  } catch {
    return offline;
  }
}
