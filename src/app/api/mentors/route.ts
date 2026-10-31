import { NextResponse } from "next/server";
import { apply, getOwn, validateApplication, type ApplicantStatus } from "@/lib/applications";
import { bad, isCountry, readJson, str } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: ApplicantStatus[] = ["undergrad", "grad", "graduate", "worker", "other"];

/** GET /api/mentors?id=..&token=.. — 신청자 본인의 심사 상태 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("token");
  if (!id || !token) return bad("신청 정보가 필요해요.");
  const app = await getOwn(id, token);
  if (!app) return bad("신청서를 찾지 못했어요.", 404);
  return NextResponse.json({ application: app });
}

/** POST /api/mentors — 서포터즈 신청. 증명서는 파일 이름·크기만 받는다(데모). */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return bad("요청 형식이 올바르지 않아요.");
  const cert = body.certificate as Record<string, unknown> | undefined;
  const input = {
    name: str(body.name, 30)?.trim() ?? "",
    nickname: str(body.nickname, 20)?.trim() ?? "",
    birthYear: Number(body.birthYear),
    status: STATUSES.includes(body.status as ApplicantStatus) ? (body.status as ApplicantStatus) : "other",
    field: str(body.field, 60)?.trim() ?? "",
    languages: str(body.languages, 80)?.trim() ?? "",
    experience: str(body.experience, 60)?.trim() || undefined,
    country: isCountry(body.country) ? body.country : "AU",
    certificate: {
      fileName: str(cert?.fileName, 120) ?? "",
      size: typeof cert?.size === "number" ? cert.size : 0,
      type: str(cert?.type, 60) ?? "",
    },
  } as const;
  const error = validateApplication({ ...input, certificate: { ...input.certificate } });
  if (error) return bad(error);
  const app = await apply({ ...input, certificate: { ...input.certificate } });
  return NextResponse.json({ id: app.id, token: app.token });
}
