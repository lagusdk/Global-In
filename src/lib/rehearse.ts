import { LlmError, chatJson, llmEnabled } from "./llm";
import { SCENARIOS_BY_ID, hasHangul, offlineCoach } from "./scenarios";
import type { ChatTurn, RehearseReply } from "./types";

export type RehearseInput = { scenarioId: string; history: ChatTurn[]; message: string };

type LlmRehearse = {
  reply?: string;
  translated?: string | null;
  coach?: { praise?: string; better?: string; scores?: { clarity?: number; evidence?: number; politeness?: number }; pressure?: boolean; pressureNote?: string };
  done?: boolean;
};

const clampScore = (n: unknown, fallback: number) => (typeof n === "number" ? Math.min(3, Math.max(1, Math.round(n))) : fallback);

export async function rehearseTurn(input: RehearseInput): Promise<RehearseReply> {
  const scenario = SCENARIOS_BY_ID[input.scenarioId];
  if (!scenario) throw new Error("unknown scenario");
  const userTurns = input.history.filter((t) => t.role === "user").length;

  const offline = (): RehearseReply => {
    const step = scenario.script[Math.min(userTurns, scenario.script.length - 1)];
    const coach = offlineCoach(input.message, scenario);
    const korean = hasHangul(input.message);
    return {
      reply: step.reply,
      coach: {
        ...coach,
        praise: korean ? "오프라인 모드에서는 한국어를 영어로 바꿔 드리지 못해요. 아래 문장을 참고해 영어로 말해 보세요." : coach.praise,
        pressure: Boolean(step.pressure),
        pressureNote: step.pressureNote,
      },
      mode: "offline",
      done: userTurns >= scenario.script.length - 1,
    };
  };

  if (!llmEnabled()) return offline();

  const transcript = [
    `${scenario.counterpart.name}: ${scenario.opening}`,
    ...input.history.map((t) => `${t.role === "user" ? "User" : scenario.counterpart.name}: ${t.content}`),
    `User: ${input.message}`,
  ].join("\n");

  const system = `You are running a negotiation rehearsal for a young Korean person living in Australia.
Play ${scenario.counterpart.name}, a ${scenario.counterpart.role} (${scenario.counterpart.style}). Facts: ${scenario.facts}
Stay in character and speak natural, simple Australian English in at most 2 short sentences. Push back at first; become more cooperative only when the user states a clear request backed by a number or a rule. Never give legal advice as the character. Do not be abusive.
Also act as a coach for the user. Coach text must be in Korean (해요체), short. "better" is one improved English sentence the user could say next.
If the user's message is in Korean, put its natural English translation in "translated" and respond to that meaning.
Set coach.pressure to true only if YOUR reply as the character contains intimidation or a threat of losing the job/room; then explain in pressureNote (Korean, one sentence) why that matters.
Output one JSON object only: {"reply": string, "translated": string|null, "coach": {"praise": string, "better": string, "scores": {"clarity": 1-3, "evidence": 1-3, "politeness": 1-3}, "pressure": boolean, "pressureNote": string|null}, "done": boolean}`;

  try {
    const out = await chatJson<LlmRehearse>({
      temperature: 0.6,
      maxTokens: 600,
      timeoutMs: 30_000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Goal of the user: ${scenario.goal}\n\nConversation so far:\n${transcript}` },
      ],
    });
    if (!out.reply) throw new LlmError("missing reply");
    const fallback = offlineCoach(input.message, scenario);
    return {
      reply: out.reply,
      translated: out.translated || undefined,
      coach: {
        praise: out.coach?.praise || fallback.praise,
        better: out.coach?.better || fallback.better,
        scores: {
          clarity: clampScore(out.coach?.scores?.clarity, fallback.scores.clarity),
          evidence: clampScore(out.coach?.scores?.evidence, fallback.scores.evidence),
          politeness: clampScore(out.coach?.scores?.politeness, fallback.scores.politeness),
        },
        pressure: Boolean(out.coach?.pressure),
        pressureNote: out.coach?.pressureNote || undefined,
      },
      mode: "ai",
      done: Boolean(out.done),
    };
  } catch (e) {
    console.error("[rehearse] LLM failed, using script:", e instanceof Error ? e.message : e);
    return offline();
  }
}
