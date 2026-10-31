import { NextResponse } from "next/server";
import { bad, readJson, str } from "@/lib/http";
import { rehearseTurn } from "@/lib/rehearse";
import { SCENARIOS_BY_ID } from "@/lib/scenarios";
import type { ChatTurn } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await readJson(req);
  const scenarioId = str(body?.scenarioId, 40);
  const message = str(body?.message, 1000)?.trim();
  if (!scenarioId || !SCENARIOS_BY_ID[scenarioId]) return bad("연습 상황을 골라 주세요.");
  if (!message) return bad("할 말을 입력해 주세요.");

  const history: ChatTurn[] = Array.isArray(body?.history)
    ? (body.history as unknown[])
        .filter((t): t is ChatTurn => {
          const turn = t as ChatTurn;
          return (turn?.role === "user" || turn?.role === "counterpart") && typeof turn.content === "string";
        })
        .slice(-12)
        .map((t) => ({ role: t.role, content: t.content.slice(0, 1000) }))
    : [];

  const w = body?.wage as Record<string, unknown> | undefined;
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined);
  const wage = w && n(w.expectedHourly) && n(w.hours) && n(w.shortfall) !== undefined ? { expectedHourly: n(w.expectedHourly)!, paidHourly: n(w.paidHourly), hours: n(w.hours)!, shortfall: n(w.shortfall)! } : undefined;
  const stage = body?.stage === "before" || body?.stage === "harmed" ? body.stage : "working";
  return NextResponse.json(await rehearseTurn({ scenarioId, history, message, wage, stage }));
}
