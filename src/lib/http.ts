import { NextResponse } from "next/server";
import { CITIES } from "./kb/au";
import type { CityId, PersonaId } from "./types";

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const isPersona = (v: unknown): v is PersonaId => v === "student" || v === "jobseeker" || v === "worker";
export const isCity = (v: unknown): v is CityId => typeof v === "string" && v in CITIES;
export const str = (v: unknown, max = 20_000): string | undefined => (typeof v === "string" && v.length <= max ? v : undefined);
