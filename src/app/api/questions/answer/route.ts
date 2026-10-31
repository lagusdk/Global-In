import { NextResponse } from "next/server";
import { APPLICANT_STATUS_LABEL, approvedMentor, countAnswer } from "@/lib/applications";
import { bad, readJson, str } from "@/lib/http";
import { moderate } from "@/lib/moderation";
import { answerQuestion } from "@/lib/questions";

export const runtime = "nodejs";
export const maxDuration = 30;

/** POST /api/questions/answer — 관리기관이 승인한 서포터즈만 답변할 수 있다. 답변도 욕설·개인정보 필터를 거친다. */
export async function POST(req: Request) {
  const body = await readJson(req);
  const id = str(body?.id, 40);
  const text = str(body?.text, 2000)?.trim();
  const mentorId = str(body?.mentorId, 40);
  const mentorToken = str(body?.mentorToken, 80);
  if (!id || !text || text.length < 10) return bad("답변을 10자 이상 적어 주세요.");
  const mentor = mentorId && mentorToken ? await approvedMentor(mentorId, mentorToken) : null;
  if (!mentor) return bad("관리기관 승인을 받은 서포터즈만 답변할 수 있어요.", 403);
  const check = await moderate(text);
  if (!check.ok) return bad(check.reason, 422);
  const q = await answerQuestion(id, {
    mentor: mentor.nickname,
    major: [mentor.field, APPLICANT_STATUS_LABEL[mentor.status], mentor.experience].filter(Boolean).join(" · "),
    text,
  });
  if (!q) return bad("질문을 찾지 못했어요.", 404);
  await countAnswer(mentor);
  return NextResponse.json({ ok: true });
}
