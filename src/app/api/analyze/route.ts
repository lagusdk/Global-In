import { NextResponse } from "next/server";
import { AnalyzeError, analyzeDocument } from "@/lib/analyze";
import { LlmError } from "@/lib/llm";
import { bad, isCity, isPersona, readJson, str } from "@/lib/http";
import type { DocType } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const DOC_TYPES: DocType[] = ["employment_contract", "payslip", "lease", "offer_letter", "assignment_letter", "job_ad", "other"];

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return bad("요청 형식이 올바르지 않아요.");
  if (!isPersona(body.persona) || !isCity(body.city)) return bad("프로필 정보가 필요해요.");

  const imageDataUrl = str(body.imageDataUrl, 6_000_000);
  if (imageDataUrl && !/^data:image\/(png|jpe?g|webp);base64,/.test(imageDataUrl)) return bad("이미지 형식이 올바르지 않아요.");

  try {
    const result = await analyzeDocument({
      persona: body.persona,
      city: body.city,
      text: str(body.text),
      imageDataUrl,
      docType: DOC_TYPES.includes(body.docType as DocType) ? (body.docType as DocType) : undefined,
      title: str(body.title, 60),
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AnalyzeError) return bad(e.message, e.status);
    if (e instanceof LlmError) return bad("AI가 사진을 읽지 못했어요. 서류 글자를 붙여넣어 다시 시도해 주세요.", 502);
    console.error("[api/analyze]", e);
    return bad("분석 중 문제가 생겼어요.", 500);
  }
}
