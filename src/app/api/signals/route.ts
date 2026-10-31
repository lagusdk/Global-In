import { NextResponse } from "next/server";
import { isCity, isCountry, isPersona, readJson, bad, str } from "@/lib/http";
import { addReport, nearbyWarning, summarize } from "@/lib/signals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/signals?persona=student  |  GET /api/signals?city=brisbane&industry=카페·요식 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const city = url.searchParams.get("city");
  const industry = url.searchParams.get("industry");
  if (city) return NextResponse.json({ nearby: await nearbyWarning(city, industry ?? "") });
  const persona = url.searchParams.get("persona");
  const country = url.searchParams.get("country");
  return NextResponse.json(await summarize(isPersona(persona) ? persona : undefined, isCountry(country) ? country : "AU"));
}

/** POST /api/signals — 사용자가 동의하고 고른 항목만 받는다. 이름·사업장·원문은 받지 않는다. */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body || !isCity(body.city)) return bad("지역 정보가 필요해요.");
  const issues = Array.isArray(body.issues) ? (body.issues as unknown[]).filter((i): i is string => typeof i === "string" && i.length <= 40).slice(0, 5) : [];
  if (!issues.length) return bad("알릴 어려움을 하나 이상 골라 주세요.");
  await addReport({
    city: body.city,
    industry: str(body.industry, 30),
    issues,
    visa: str(body.visa, 30),
    persona: isPersona(body.persona) ? body.persona : undefined,
    at: new Date().toISOString().slice(0, 10),
  });
  return NextResponse.json({ ok: true });
}
