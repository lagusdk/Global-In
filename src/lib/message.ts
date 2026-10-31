import { AU_PAY, BOND_AUTHORITY } from "./kb/au";
import { CITIES } from "./kb/countries";
import { JP_PAY, jpMinHourly } from "./kb/jp";
import { chatJson, llmEnabled } from "./llm";
import { SCENARIOS_BY_ID } from "./scenarios";
import type { AuState, CityId, DraftMessage } from "./types";
import { formatAud } from "./wage";

export type MessageInput = {
  scenarioId: string;
  city: CityId;
  name?: string;
  wage?: { hours: number; paidHourly?: number; paidTotal: number; expectedHourly: number; expectedTotal: number; shortfall: number };
  findings?: string[];
};

const yen = (n: number) => `${Math.round(n).toLocaleString("ja-JP")}円`;

/** 오프라인용 템플릿. 숫자는 항상 코드가 계산한 값을 넣는다. */
export function templateMessage(input: MessageInput): DraftMessage {
  return CITIES[input.city].country === "JP" ? templateJp(input) : templateAu(input);
}

function templateAu(input: MessageInput): DraftMessage {
  const scenario = SCENARIOS_BY_ID[input.scenarioId];
  const name = input.name?.trim() || "Jiwoo";
  const nameKo = input.name?.trim() || "지우";
  const to = scenario?.counterpart.name ?? "there";
  const kind = scenario?.messageKind ?? "wage";
  const authority = BOND_AUTHORITY[CITIES[input.city].region as AuState];
  const base = { lang: "en" as const, mode: "offline" as const };

  if (kind === "wage" && input.wage) {
    const w = input.wage;
    const paid = w.paidHourly !== undefined ? `$${formatAud(w.paidHourly)} an hour` : `$${formatAud(w.paidTotal)} in total`;
    const paidKo = w.paidHourly !== undefined ? `시간당 $${formatAud(w.paidHourly)}` : `총 $${formatAud(w.paidTotal)}`;
    return {
      ...base,
      subjectLocal: "Pay for last week",
      subjectKo: "지난주 급여 관련",
      bodyLocal: `Hi ${to},\n\nI worked ${w.hours} hours last week and was paid ${paid}. The minimum casual rate is $${formatAud(w.expectedHourly)} an hour, so I believe I was underpaid by $${formatAud(w.shortfall)}.\n\nCould you please pay the difference and give me a payslip each pay period?\n\nThanks,\n${name}`,
      bodyKo: `안녕하세요 ${to},\n\n지난주 ${w.hours}시간 일하고 ${paidKo}을 받았어요. 캐주얼 최저시급은 $${formatAud(w.expectedHourly)}라서 $${formatAud(w.shortfall)}를 덜 받은 것 같아요.\n\n차액을 지급해 주시고, 매번 급여명세서를 받을 수 있을까요?\n\n감사합니다,\n${nameKo}`,
    };
  }
  if (kind === "bond") {
    return {
      ...base,
      subjectLocal: "Bond for the room",
      subjectKo: "방 보증금 관련",
      bodyLocal: `Hi ${to},\n\nThanks for showing me the room. I'm happy to pay the bond, but I'd like it lodged with ${authority.name} and to sign a written agreement before I move in.\n\nCould you send me the lodgement form?\n\nThanks,\n${name}`,
      bodyKo: `안녕하세요 ${to},\n\n방 보여 주셔서 감사해요. 보증금은 낼 생각인데, ${authority.name}에 맡기고 입주 전에 서면 계약을 하고 싶어요.\n\n보증금 접수 양식을 보내 주실 수 있을까요?\n\n감사합니다,\n${nameKo}`,
    };
  }
  if (kind === "hours") {
    return {
      ...base,
      subjectLocal: "My availability this fortnight",
      subjectKo: "이번 2주 근무 가능 시간",
      bodyLocal: `Hi ${to},\n\nThanks for the extra shifts. During semester my student visa lets me work up to ${AU_PAY.studentFortnightLimit} hours per fortnight, so I can only take the hours that keep me under that limit.\n\nI'm happy to work more during the holidays.\n\nThanks,\n${name}`,
      bodyKo: `안녕하세요 ${to},\n\n추가 근무 제안 감사해요. 학기 중에는 학생비자 조건상 2주에 ${AU_PAY.studentFortnightLimit}시간까지만 일할 수 있어서, 그 안에서만 근무할 수 있어요.\n\n방학 때는 더 일할 수 있어요.\n\n감사합니다,\n${nameKo}`,
    };
  }
  return {
    ...base,
    subjectLocal: "Assignment terms before relocation",
    subjectKo: "출국 전 파견 조건 확인 요청",
    bodyLocal: `Hi ${to},\n\nBefore I relocate, could you confirm the following in writing?\n- Housing allowance amount and period\n- Tax treatment (which country withholds, any tax equalisation)\n- Pension: certificate of coverage under the Korea–Australia agreement\n- Health insurance for me and my family\n- Return conditions at the end of the assignment\n\nThank you,\n${name}`,
    bodyKo: `안녕하세요 ${to},\n\n출국 전에 아래 내용을 서면으로 확인해 주실 수 있을까요?\n- 주거 지원 금액과 기간\n- 세금 처리 (원천징수 국가, 세금 보전 여부)\n- 연금: 한-호 사회보장협정 가입증명서\n- 본인·가족 의료보험\n- 파견 종료 후 귀임 조건\n\n감사합니다,\n${nameKo}`,
  };
}

function templateJp(input: MessageInput): DraftMessage {
  const scenario = SCENARIOS_BY_ID[input.scenarioId];
  const name = input.name?.trim() || "キム・ジウ";
  const nameKo = input.name?.trim() || "지우";
  const to = scenario?.counterpart.name ?? "ご担当者";
  const kind = scenario?.messageKind ?? "wage";
  const base = { lang: "ja" as const, mode: "offline" as const };
  const min = jpMinHourly(input.city);
  const cityJa = CITIES[input.city].region;

  if (kind === "wage" && input.wage) {
    const w = input.wage;
    const paid = w.paidHourly !== undefined ? `時給${yen(w.paidHourly)}` : `合計${yen(w.paidTotal)}`;
    const paidKo = w.paidHourly !== undefined ? `시급 ${yen(w.paidHourly)}` : `총 ${yen(w.paidTotal)}`;
    return {
      ...base,
      subjectLocal: "先週のお給料について",
      subjectKo: "지난주 급여 관련",
      bodyLocal: `${to}様\n\nお疲れさまです。先週は${w.hours}時間働き、${paid}でお支払いいただきました。${cityJa}の最低賃金は時給${yen(min)}で、週40時間を超えた分には25%以上の割増が必要なため、${yen(w.shortfall)}の差額があると思います。\n\n差額のお支払いと、毎月の給与明細の発行をお願いできますでしょうか。\n\nよろしくお願いいたします。\n${name}`,
      bodyKo: `${to} 님\n\n수고하십니다. 지난주 ${w.hours}시간 일하고 ${paidKo}로 받았어요. ${CITIES[input.city].label} 최저임금은 시급 ${yen(min)}이고 주 40시간을 넘는 시간은 25% 이상 할증이 필요해서, ${yen(w.shortfall)}의 차액이 있는 것 같아요.\n\n차액 지급과 매달 급여명세서 발행을 부탁드려도 될까요?\n\n잘 부탁드립니다.\n${nameKo}`,
    };
  }
  if (kind === "bond") {
    return {
      ...base,
      subjectLocal: "契約内容についてのご相談",
      subjectKo: "계약 내용 상담",
      bodyLocal: `${to}様\n\nお世話になっております。入居にあたり、2点ご相談させてください。\n1. 退去時の費用について、国土交通省のガイドラインでは通常の使用による汚れや経年劣化は借主の負担ではないとされています。実費精算にしていただけますでしょうか。\n2. パスポートの原本はお預けできません。コピーでもよろしいでしょうか。\n\nよろしくお願いいたします。\n${name}`,
      bodyKo: `${to} 님\n\n입주와 관련해 두 가지 상담드리고 싶어요.\n1. 퇴거 비용은 국토교통성 가이드라인상 보통으로 생활하며 생긴 마모나 시간이 지나 낡은 부분은 세입자 부담이 아니에요. 실비 정산으로 바꿔 주실 수 있을까요?\n2. 여권 원본은 맡길 수 없어요. 복사본으로 괜찮을까요?\n\n잘 부탁드립니다.\n${nameKo}`,
    };
  }
  if (kind === "hours") {
    return {
      ...base,
      subjectLocal: "シフトについてのご相談",
      subjectKo: "시프트 관련 상담",
      bodyLocal: `${to}様\n\nいつもありがとうございます。留学生の資格外活動は週${JP_PAY.studentWeeklyLimit}時間までと決められているため、来週のシフトは${JP_PAY.studentWeeklyLimit}時間以内でお願いできますでしょうか。\n\n長期休みの期間はもう少し入れますので、その際はご相談させてください。\n\nよろしくお願いいたします。\n${name}`,
      bodyKo: `${to} 님\n\n늘 감사합니다. 유학생 자격외활동은 주 ${JP_PAY.studentWeeklyLimit}시간까지로 정해져 있어서, 다음 주 시프트는 ${JP_PAY.studentWeeklyLimit}시간 이내로 부탁드려도 될까요?\n\n장기 방학 때는 더 일할 수 있으니 그때 다시 상의드릴게요.\n\n잘 부탁드립니다.\n${nameKo}`,
    };
  }
  return {
    ...base,
    subjectLocal: "赴任前の条件確認のお願い",
    subjectKo: "부임 전 조건 확인 요청",
    bodyLocal: `${to}様\n\nお世話になっております。赴任前に、以下の条件を書面でご確認いただけますでしょうか。\n・住宅補助の金額と期間（社宅か家賃補助か）\n・税金の扱い（源泉徴収国、税金補填の有無）\n・健康保険の加入（日韓社会保障協定は年金のみが対象のため）\n・家族帯同時の保険\n・任期終了後の帰任条件\n\nよろしくお願いいたします。\n${name}`,
    bodyKo: `${to} 님\n\n부임 전에 아래 조건을 서면으로 확인해 주실 수 있을까요?\n- 주거 지원 금액과 기간 (사택인지 월세 지원인지)\n- 세금 처리 (원천징수 국가, 세금 보전 여부)\n- 건강보험 가입 (한일 사회보장협정은 연금만 대상이라서요)\n- 가족 동반 시 보험\n- 파견 종료 후 귀임 조건\n\n잘 부탁드립니다.\n${nameKo}`,
  };
}

type LlmMessage = { subjectLocal?: string; subjectKo?: string; bodyLocal?: string; bodyKo?: string };

export async function draftMessage(input: MessageInput): Promise<DraftMessage> {
  const template = templateMessage(input);
  if (!llmEnabled()) return template;
  const ja = template.lang === "ja";
  try {
    const out = await chatJson<LlmMessage>({
      temperature: 0.3,
      maxTokens: 1000,
      timeoutMs: 30_000,
      messages: [
        {
          role: "system",
          content: `You polish short workplace/tenancy messages for a young Korean person in ${ja ? "Japan" : "Australia"}. Keep every number, name and fact from the draft exactly. ${ja ? "Polite business Japanese (です・ます調)" : "Polite, firm, plain English"} for the local version; natural Korean (해요체) for the Korean version. No legal threats. Output one JSON object only: {"subjectLocal", "subjectKo", "bodyLocal", "bodyKo"}.`,
        },
        {
          role: "user",
          content: `Draft (keep facts):\nLocal subject: ${template.subjectLocal}\nLocal body:\n${template.bodyLocal}\n\nKO subject: ${template.subjectKo}\nKO body:\n${template.bodyKo}\n\nIssues found in the document: ${(input.findings ?? []).join(", ") || "none"}`,
        },
      ],
    });
    if (!out.bodyLocal || !out.bodyKo) return template;
    // 금액이 바뀌었으면 템플릿을 그대로 쓴다.
    if (input.wage) {
      const amount = ja ? Math.round(input.wage.shortfall).toLocaleString("ja-JP") : formatAud(input.wage.shortfall);
      if (!out.bodyLocal.includes(amount)) return template;
    }
    return { lang: template.lang, subjectLocal: out.subjectLocal || template.subjectLocal, subjectKo: out.subjectKo || template.subjectKo, bodyLocal: out.bodyLocal, bodyKo: out.bodyKo, mode: "ai" };
  } catch (e) {
    console.error("[message] LLM failed, using template:", e instanceof Error ? e.message : e);
    return template;
  }
}
