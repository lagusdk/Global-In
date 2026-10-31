import { NextResponse } from "next/server";
import { bad, readJson, str } from "@/lib/http";
import { answerQuestion } from "@/lib/questions";

export const runtime = "nodejs";

/** POST /api/questions/answer — 멘토 답변 등록 (데모: 멘토 인증 없음) */
export async function POST(req: Request) {
  const body = await readJson(req);
  const id = str(body?.id, 40);
  const text = str(body?.text, 2000)?.trim();
  const mentor = str(body?.mentor, 30)?.trim();
  const major = str(body?.major, 60)?.trim();
  if (!id || !text || text.length < 10) return bad("답변을 10자 이상 적어 주세요.");
  if (!mentor) return bad("멘토 정보가 필요해요.");
  const q = answerQuestion(id, { mentor, major: major ?? "", text });
  if (!q) return bad("질문을 찾지 못했어요.", 404);
  return NextResponse.json({ ok: true });
}
