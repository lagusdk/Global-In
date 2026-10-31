"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconSend } from "@/components/icons";
import { ModeBadge, Spinner, TopBar, useProfile } from "@/components/ui";
import { scenarioFor } from "@/lib/caseFlow";
import { SCENARIOS, SCENARIOS_BY_ID } from "@/lib/scenarios";
import { getCase, updateCase } from "@/lib/store";
import type { ChatTurn, CoachFeedback, RehearseReply } from "@/lib/types";

type Turn = ChatTurn & { coach?: CoachFeedback; translated?: string };

type SpeechRec = { lang: string; interimResults: boolean; onresult: (e: { results: { 0: { transcript: string } }[] }) => void; onend: () => void; start: () => void; stop: () => void };

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-AU";
    u.rate = 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {
    /* 음성 합성을 지원하지 않는 브라우저 */
  }
}

function Dots({ n }: { n: number }) {
  return (
    <span aria-label={`3점 중 ${n}점`} style={{ display: "inline-flex", gap: 2, verticalAlign: "middle" }}>
      {[1, 2, 3].map((i) => (
        <span key={i} style={{ width: 8, height: 8, background: i <= n ? "#111" : "#dadad6" }} />
      ))}
    </span>
  );
}

function CoachCard({ coach, translated }: { coach: CoachFeedback; translated?: string }) {
  return (
    <div style={{ border: "1.5px dashed #111", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span className="tag-dark">코치</span>
        <span className="small muted" style={{ display: "inline-flex", gap: 10 }}>
          <span>
            명확 <Dots n={coach.scores.clarity} />
          </span>
          <span>
            근거 <Dots n={coach.scores.evidence} />
          </span>
          <span>
            공손 <Dots n={coach.scores.politeness} />
          </span>
        </span>
      </div>
      {translated && (
        <span className="small muted">
          영어로 바꾸면: <span style={{ color: "#111" }}>“{translated}”</span>
        </span>
      )}
      <span className="body" style={{ fontSize: 13 }}>{coach.praise}</span>
      <span style={{ fontSize: 14, lineHeight: 1.55 }}>
        이렇게 말해 보세요: “<span className="hl">{coach.better}</span>”
      </span>
    </div>
  );
}

export default function Rehearse() {
  const profile = useProfile();
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"ai" | "offline">();
  const [done, setDone] = useState(false);
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    const c = getCase();
    const id = c.scenarioId && SCENARIOS_BY_ID[c.scenarioId] ? c.scenarioId : scenarioFor(profile.persona, c.analysis);
    setScenarioId(id);
    setTurns(c.rehearsal?.turns ?? []);
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    setCanListen(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, [profile]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, busy]);

  if (!profile || !scenarioId) return <main className="phone" />;
  const scenario = SCENARIOS_BY_ID[scenarioId];
  const options = SCENARIOS.filter((s) => s.personas.includes(profile.persona));

  const choose = (id: string) => {
    setScenarioId(id);
    setTurns([]);
    setDone(false);
    updateCase({ scenarioId: id, rehearsal: undefined });
  };

  const send = async () => {
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    const history: ChatTurn[] = turns.map(({ role, content }) => ({ role, content }));
    const optimistic: Turn[] = [...turns, { role: "user", content: message }];
    setTurns(optimistic);
    try {
      const res = await fetch("/api/rehearse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, history, message }),
      });
      const data = (await res.json()) as RehearseReply & { error?: string };
      if (!res.ok) throw new Error(data.error);
      setMode(data.mode);
      const next: Turn[] = [...turns, { role: "user", content: message, coach: data.coach, translated: data.translated }, { role: "counterpart", content: data.reply, coach: data.coach }];
      setTurns(next);
      setDone(Boolean(data.done));
      updateCase({ scenarioId, rehearsal: { turns: next } });
    } catch {
      setTurns(turns);
      setInput(message);
    } finally {
      setBusy(false);
    }
  };

  const toggleMic = () => {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Rec = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Rec) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Rec();
    rec.lang = "en-AU";
    rec.interimResults = false;
    rec.onresult = (e) => setInput((prev) => (prev ? prev + " " : "") + e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <main className="phone">
      <div className="screen" style={{ gap: 12, paddingBottom: 140 }}>
        <TopBar
          title="리허설"
          back=""
          right={
            <Link href="/send" className="small" style={{ fontWeight: 700, borderBottom: "1.5px solid #111", padding: "4px 0" }}>
              메시지로 정리 →
            </Link>
          }
        />

        {options.length > 1 && (
          <div className="seg" role="group" aria-label="연습 상황" style={{ alignSelf: "flex-start", flexWrap: "wrap" }}>
            {options.map((s) => (
              <button key={s.id} aria-pressed={s.id === scenarioId} onClick={() => choose(s.id)}>
                {s.title}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 12, borderBottom: "1.5px solid #111" }}>
          <span className="mono small muted" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>SCENE — {scenario.title}</span>
            <ModeBadge mode={mode} />
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="display" style={{ width: 36, height: 36, border: "1.5px solid #111", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
              {scenario.counterpart.name[0]}
            </span>
            <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                {scenario.counterpart.name} · {scenario.counterpart.role} 역할
              </span>
              <span className="small muted">목표: {scenario.goal}</span>
            </span>
            <span className="tag-caution">{scenario.counterpart.style}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }} aria-live="polite">
          <Bubble who="counterpart" text={scenario.opening} />
          {turns.length === 0 && (
            <div className="notice">
              영어로 답해 보세요. 한국어로 써도 {mode === "offline" ? "AI 연결 시 " : ""}영어로 바꿔 드려요.
              <br />
              막히면: “{scenario.modelLine}”
            </div>
          )}
          {turns.map((t, i) =>
            t.role === "user" ? (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Bubble who="user" text={t.content} />
                {t.coach && <CoachCard coach={t.coach} translated={t.translated} />}
              </div>
            ) : (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Bubble who="counterpart" text={t.content} />
                {t.coach?.pressure && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span className="stamp-risk" style={{ marginTop: 2 }}>압박 감지</span>
                    <span className="body" style={{ fontSize: 13 }}>{t.coach.pressureNote ?? "불이익을 암시하는 말이에요. 침착하게 근거를 다시 말하세요."}</span>
                  </div>
                )}
              </div>
            ),
          )}
          {busy && (
            <span className="small muted">
              <Spinner label={`${scenario.counterpart.name}이(가) 답하는 중…`} />
            </span>
          )}
          {done && (
            <div className="card-wash" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>상대가 받아들였어요. 이제 서면으로 남겨요.</span>
              <Link href="/send" className="btn sm">
                메시지 만들기
              </Link>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="actions" style={{ flexDirection: "column", gap: 8, borderTop: "1.5px solid #111", padding: "10px 16px 22px" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <label htmlFor="reply" className="sr-only">
            답장 입력
          </label>
          <input id="reply" className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`${scenario.counterpart.name}에게 대답하기`} style={{ flex: 1, minWidth: 0 }} autoComplete="off" />
          {canListen && (
            <button type="button" className="icon-btn" onClick={toggleMic} aria-label={listening ? "듣기 멈추기" : "영어로 말하기"} aria-pressed={listening} style={{ border: "1.5px solid #111", width: 48, height: 48, background: listening ? "#ffe14d" : "#fff" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
          )}
          <button type="submit" className="icon-btn" aria-label="보내기" disabled={busy || !input.trim()} style={{ background: "#111", width: 48, height: 48 }}>
            <IconSend color="#fff" />
          </button>
        </form>
      </div>
    </main>
  );
}

function Bubble({ who, text }: { who: "user" | "counterpart"; text: string }) {
  const mine = who === "user";
  return (
    <div style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "84%", display: "flex", alignItems: "flex-end", gap: 6, flexDirection: mine ? "row-reverse" : "row" }}>
      <div
        lang={mine ? undefined : "en"}
        style={{
          background: mine ? "#111" : "#f4f4f2",
          color: mine ? "#fff" : "#111",
          borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          padding: "10px 14px",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        {text}
      </div>
      {!mine && (
        <button className="icon-btn" onClick={() => speak(text)} aria-label="소리로 듣기" style={{ width: 32, height: 32 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a4a48" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 10v4h4l5 4V6L8 10z" />
            <path d="M16 9a4 4 0 0 1 0 6" />
          </svg>
        </button>
      )}
    </div>
  );
}
