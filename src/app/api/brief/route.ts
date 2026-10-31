import { NextResponse } from "next/server";
import { ORGS, makeBrief, type OrgId } from "@/lib/brief";
import { bad, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await readJson(req);
  const org = body?.org as OrgId;
  if (!org || !(org in ORGS)) return bad("기관 종류가 필요해요.");
  return NextResponse.json(await makeBrief(org));
}
