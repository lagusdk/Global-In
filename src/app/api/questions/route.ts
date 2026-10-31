import { NextResponse } from "next/server";
import { approvedMentor } from "@/lib/applications";
import { bad, isCountry, isPersona, readJson, str } from "@/lib/http";
import { moderate } from "@/lib/moderation";
import { addQuestion, listQuestions, type QCategory } from "@/lib/questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CATEGORIES: QCategory[] = ["language", "legal", "life"];

/**
 * GET /api/questions?country=JP&mine=id:token,id:token
 * 승인된 서포터즈는 &mentor=id:token 을 붙이면 잠긴 질문까지 본다.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const country = url.searchParams.get("country");
  const mine: Record<string, string> = {};
  for (const pair of (url.searchParams.get("mine") ?? "").split(",")) {
    const [id, token] = pair.split(":");
    if (id && token) mine[id] = token;
  }
  const [mentorId, mentorToken] = (url.searchParams.get("mentor") ?? "").split(":");
  const mentor = mentorId && mentorToken ? await approvedMentor(mentorId, mentorToken) : null;
  return NextResponse.json({ questions: await listQuestions(isCountry(country) ? country : "AU", mentor ? "mentor" : "public", mine) });
}

/** POST /api/questions — 익명 질문 등록. 욕설·개인정보는 막는다. 받은 token은 질문자 기기에만 저장한다. */
export async function POST(req: Request) {
  const body = await readJson(req);
  const text = str(body?.text, 1000)?.trim();
  if (!text || text.length < 5) return bad("질문을 조금 더 자세히 적어 주세요.");
  if (!isCountry(body?.country)) return bad("국가 정보가 필요해요.");
  const check = await moderate(text);
  if (!check.ok) return bad(check.reason, 422);
  const category = CATEGORIES.includes(body?.category as QCategory) ? (body!.category as QCategory) : "life";
  const q = await addQuestion({ country: body.country, persona: isPersona(body.persona) ? body.persona : undefined, category, text, locked: Boolean(body.locked) });
  return NextResponse.json({ id: q.id, token: q.token });
}
