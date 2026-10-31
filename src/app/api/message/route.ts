import { NextResponse } from "next/server";
import { bad, isCity, readJson, str } from "@/lib/http";
import { draftMessage, type MessageInput } from "@/lib/message";
import { SCENARIOS_BY_ID } from "@/lib/scenarios";

export const runtime = "nodejs";
export const maxDuration = 60;

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined);

export async function POST(req: Request) {
  const body = await readJson(req);
  const scenarioId = str(body?.scenarioId, 40);
  if (!scenarioId || !SCENARIOS_BY_ID[scenarioId]) return bad("상황 정보가 필요해요.");
  if (!isCity(body?.city)) return bad("도시 정보가 필요해요.");

  let wage: MessageInput["wage"];
  const w = body?.wage as Record<string, unknown> | undefined;
  if (w && num(w.hours) && num(w.paidTotal) !== undefined && num(w.expectedHourly) && num(w.expectedTotal) && num(w.shortfall) !== undefined) {
    wage = {
      hours: num(w.hours)!,
      paidHourly: num(w.paidHourly),
      paidTotal: num(w.paidTotal)!,
      expectedHourly: num(w.expectedHourly)!,
      expectedTotal: num(w.expectedTotal)!,
      shortfall: num(w.shortfall)!,
    };
  }

  const findings = Array.isArray(body?.findings) ? (body.findings as unknown[]).filter((f): f is string => typeof f === "string").slice(0, 8) : [];
  return NextResponse.json(await draftMessage({ scenarioId, city: body.city, name: str(body?.name, 40), wage, findings }));
}
