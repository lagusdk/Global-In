import { AU_PAY, BOND_AUTHORITY, CITIES } from "./kb/au";
import { chatJson, llmEnabled } from "./llm";
import { SCENARIOS_BY_ID } from "./scenarios";
import type { CityId, DraftMessage } from "./types";
import { formatAud } from "./wage";

export type MessageInput = {
  scenarioId: string;
  city: CityId;
  name?: string;
  wage?: { hours: number; paidHourly?: number; paidTotal: number; expectedHourly: number; expectedTotal: number; shortfall: number };
  findings?: string[];
};

/** 오프라인용 템플릿. 숫자는 항상 코드가 계산한 값을 넣는다. */
export function templateMessage(input: MessageInput): DraftMessage {
  const scenario = SCENARIOS_BY_ID[input.scenarioId];
  const name = input.name?.trim() || "Jiwoo";
  const nameKo = input.name?.trim() || "지우";
  const to = scenario?.counterpart.name ?? "there";
  const kind = scenario?.messageKind ?? "wage";
  const authority = BOND_AUTHORITY[CITIES[input.city].state];

  if (kind === "wage" && input.wage) {
    const w = input.wage;
    const paid = w.paidHourly !== undefined ? `$${formatAud(w.paidHourly)} an hour` : `$${formatAud(w.paidTotal)} in total`;
    const paidKo = w.paidHourly !== undefined ? `시간당 $${formatAud(w.paidHourly)}` : `총 $${formatAud(w.paidTotal)}`;
    return {
      subjectEn: "Pay for last week",
      subjectKo: "지난주 급여 관련",
      bodyEn: `Hi ${to},\n\nI worked ${w.hours} hours last week and was paid ${paid}. The minimum casual rate is $${formatAud(w.expectedHourly)} an hour, so I believe I was underpaid by $${formatAud(w.shortfall)}.\n\nCould you please pay the difference and give me a payslip each pay period?\n\nThanks,\n${name}`,
      bodyKo: `안녕하세요 ${to},\n\n지난주 ${w.hours}시간 일하고 ${paidKo}을 받았어요. 캐주얼 최저시급은 $${formatAud(w.expectedHourly)}라서 $${formatAud(w.shortfall)}를 덜 받은 것 같아요.\n\n차액을 지급해 주시고, 매번 급여명세서를 받을 수 있을까요?\n\n감사합니다,\n${nameKo}`,
      mode: "offline",
    };
  }
  if (kind === "bond") {
    return {
      subjectEn: "Bond for the room",
      subjectKo: "방 보증금 관련",
      bodyEn: `Hi ${to},\n\nThanks for showing me the room. I'm happy to pay the bond, but I'd like it lodged with ${authority.name} and to sign a written agreement before I move in.\n\nCould you send me the lodgement form?\n\nThanks,\n${name}`,
      bodyKo: `안녕하세요 ${to},\n\n방 보여 주셔서 감사해요. 보증금은 낼 생각인데, ${authority.name}에 맡기고 입주 전에 서면 계약을 하고 싶어요.\n\n보증금 접수 양식을 보내 주실 수 있을까요?\n\n감사합니다,\n${nameKo}`,
      mode: "offline",
    };
  }
  if (kind === "hours") {
    return {
      subjectEn: "My availability this fortnight",
      subjectKo: "이번 2주 근무 가능 시간",
      bodyEn: `Hi ${to},\n\nThanks for the extra shifts. During semester my student visa lets me work up to ${AU_PAY.studentFortnightLimit} hours per fortnight, so I can only take the hours that keep me under that limit.\n\nI'm happy to work more during the holidays.\n\nThanks,\n${name}`,
      bodyKo: `안녕하세요 ${to},\n\n추가 근무 제안 감사해요. 학기 중에는 학생비자 조건상 2주에 ${AU_PAY.studentFortnightLimit}시간까지만 일할 수 있어서, 그 안에서만 근무할 수 있어요.\n\n방학 때는 더 일할 수 있어요.\n\n감사합니다,\n${nameKo}`,
      mode: "offline",
    };
  }
  return {
    subjectEn: "Assignment terms before relocation",
    subjectKo: "출국 전 파견 조건 확인 요청",
    bodyEn: `Hi ${to},\n\nBefore I relocate, could you confirm the following in writing?\n- Housing allowance amount and period\n- Tax treatment (which country withholds, any tax equalisation)\n- Pension: certificate of coverage under the Korea–Australia agreement\n- Health insurance for me and my family\n- Return conditions at the end of the assignment\n\nThank you,\n${name}`,
    bodyKo: `안녕하세요 ${to},\n\n출국 전에 아래 내용을 서면으로 확인해 주실 수 있을까요?\n- 주거 지원 금액과 기간\n- 세금 처리 (원천징수 국가, 세금 보전 여부)\n- 연금: 한-호 사회보장협정 가입증명서\n- 본인·가족 의료보험\n- 파견 종료 후 귀임 조건\n\n감사합니다,\n${nameKo}`,
    mode: "offline",
  };
}

type LlmMessage = { subjectEn?: string; subjectKo?: string; bodyEn?: string; bodyKo?: string };

export async function draftMessage(input: MessageInput): Promise<DraftMessage> {
  const template = templateMessage(input);
  if (!llmEnabled()) return template;
  try {
    const out = await chatJson<LlmMessage>({
      temperature: 0.3,
      maxTokens: 900,
      timeoutMs: 30_000,
      messages: [
        {
          role: "system",
          content:
            "You polish short workplace/tenancy messages for a young Korean person in Australia. Keep every number, name and fact from the draft exactly. Polite, firm, plain English; natural Korean (해요체) for the Korean version. No legal threats. Output one JSON object only: {\"subjectEn\", \"subjectKo\", \"bodyEn\", \"bodyKo\"}.",
        },
        {
          role: "user",
          content: `Draft (keep facts):\nEN subject: ${template.subjectEn}\nEN body:\n${template.bodyEn}\n\nKO subject: ${template.subjectKo}\nKO body:\n${template.bodyKo}\n\nIssues found in the document: ${(input.findings ?? []).join(", ") || "none"}`,
        },
      ],
    });
    if (!out.bodyEn || !out.bodyKo) return template;
    // 금액이 바뀌었으면 템플릿을 그대로 쓴다.
    if (input.wage && !out.bodyEn.includes(formatAud(input.wage.shortfall))) return template;
    return { subjectEn: out.subjectEn || template.subjectEn, subjectKo: out.subjectKo || template.subjectKo, bodyEn: out.bodyEn, bodyKo: out.bodyKo, mode: "ai" };
  } catch (e) {
    console.error("[message] LLM failed, using template:", e instanceof Error ? e.message : e);
    return template;
  }
}
