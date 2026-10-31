import { NextResponse } from "next/server";
import { decide, listApplications } from "@/lib/applications";
import { bad, readJson, str } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 관리기관용 서포터즈 심사 API (데모: 인증 없음).
 * 실서비스에서는 관리기관 계정 인증 뒤에 둔다.
 */
export async function GET() {
  return NextResponse.json({ applications: await listApplications() });
}

export async function POST(req: Request) {
  const body = await readJson(req);
  const id = str(body?.id, 40);
  const state = body?.state === "approved" || body?.state === "rejected" ? body.state : null;
  if (!id || !state) return bad("심사 정보가 필요해요.");
  const app = await decide(id, state, str(body?.by, 40) || "관리기관", str(body?.reason, 200));
  if (!app) return bad("신청서를 찾지 못했어요.", 404);
  return NextResponse.json({ application: app });
}
