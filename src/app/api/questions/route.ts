import { NextResponse } from "next/server";
import { bad, isCountry, isPersona, readJson, str } from "@/lib/http";
import { addQuestion, listQuestions, type QCategory } from "@/lib/questions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CATEGORIES: QCategory[] = ["language", "legal", "life"];

/** GET /api/questions?country=JP&role=mentor&mine=id:token,id:token */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const country = url.searchParams.get("country");
  const role = url.searchParams.get("role") === "mentor" ? "mentor" : "public";
  const mine: Record<string, string> = {};
  for (const pair of (url.searchParams.get("mine") ?? "").split(",")) {
    const [id, token] = pair.split(":");
    if (id && token) mine[id] = token;
  }
  return NextResponse.json({ questions: listQuestions(isCountry(country) ? country : "AU", role, mine) });
}

/** POST /api/questions — 익명 질문 등록. 받은 token은 질문자 기기에만 저장해서 '내 질문' 확인에 쓴다. */
export async function POST(req: Request) {
  const body = await readJson(req);
  const text = str(body?.text, 1000)?.trim();
  if (!text || text.length < 5) return bad("질문을 조금 더 자세히 적어 주세요.");
  if (!isCountry(body?.country)) return bad("국가 정보가 필요해요.");
  const category = CATEGORIES.includes(body?.category as QCategory) ? (body!.category as QCategory) : "life";
  const q = await addQuestion({ country: body.country, persona: isPersona(body.persona) ? body.persona : undefined, category, text, locked: Boolean(body.locked) });
  return NextResponse.json({ id: q.id, token: q.token, summary: q.triage.summary });
}
