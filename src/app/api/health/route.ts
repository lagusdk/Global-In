import { NextResponse } from "next/server";
import { AU_PAY } from "@/lib/kb/au";
import { JP_PAY } from "@/lib/kb/jp";
import { FAST_MODEL, TEXT_MODEL, VISION_MODEL, llmEnabled } from "@/lib/llm";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    mode: llmEnabled() ? "ai" : "offline",
    textModel: TEXT_MODEL,
    fastModel: FAST_MODEL,
    visionModel: VISION_MODEL,
    payBasis: { AU: AU_PAY.effectiveFrom, JP: JP_PAY.effectiveFrom },
  });
}
