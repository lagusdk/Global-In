"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { IconLock } from "@/components/icons";
import { Spinner } from "@/components/ui";
import { COUNTRIES } from "@/lib/kb/countries";
import { CERT_GOAL, clearMentor, getMentor, setMentor, type MentorSession } from "@/lib/mentorSession";
import type { QCategory, QuestionView } from "@/lib/questions";

const CATEGORY_LABEL: Record<QCategory, string> = { language: "언어·소통", legal: "법률·계약", life: "생활·정착" };

function AnswerBox({ q, mentor, onDone }: { q: QuestionView; mentor: MentorSession; onDone: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/questions/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: q.id, text, mentor: mentor.name, major: mentor.major }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "답변을 올리지 못했어요.");
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label className="sr-only" htmlFor={`a-${q.id}`}>
        답변
      </label>
      <textarea id={`a-${q.id}`} className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="쉬운 말로, 단정하지 말고, 필요하면 공식 창구를 함께 안내해 주세요" style={{ fontFamily: "var(--sans)", fontSize: 14, minHeight: 110 }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {q.draft && (
          <button className="btn outline sm" onClick={() => setText(q.draft!)} type="button">
            AI 초안 불러오기
          </button>
        )}
        <button className="btn sm" onClick={post} disabled={busy || text.trim().length < 10} type="button" style={{ marginLeft: "auto" }}>
          {busy ? <Spinner /> : "검토 후 답변 등록"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default function Mentor() {
  const router = useRouter();
  const [mentor, setM] = useState<MentorSession | null>(null);
  const [tab, setTab] = useState<"todo" | "done">("todo");
  const [questions, setQuestions] = useState<QuestionView[] | null>(null);

  useEffect(() => {
    const m = getMentor();
    if (!m) router.replace("/mentor/login");
    else setM(m);
  }, [router]);

  const load = useCallback(async () => {
    if (!mentor) return;
    const res = await fetch(`/api/questions?country=${mentor.country}&role=mentor`);
    setQuestions((await res.json()).questions);
  }, [mentor]);

  useEffect(() => {
    load();
  }, [load]);

  if (!mentor) return <main className="phone" />;
  const todo = (questions ?? []).filter((q) => !q.answered).sort((a, b) => Number(Boolean(b.urgent)) - Number(Boolean(a.urgent)));
  const done = (questions ?? []).filter((q) => q.answered);
  const list = tab === "todo" ? todo : done;
  const progress = mentor.answered % CERT_GOAL;

  const onAnswered = () => {
    const next = { ...mentor, answered: mentor.answered + 1 };
    setMentor(next);
    setM(next);
    load();
  };

  return (
    <main className="phone">
      <div className="screen" style={{ gap: 16 }}>
        <div className="topbar" style={{ justifyContent: "space-between" }}>
          <span className="wordmark">Global-In</span>
          <button
            className="small"
            onClick={() => {
              clearMentor();
              router.replace("/mentor/login");
            }}
            style={{ background: "none", border: 0, textDecoration: "underline", cursor: "pointer", padding: 8 }}
          >
            로그아웃
          </button>
        </div>

        <section className="box" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="tag-caution" style={{ alignSelf: "flex-start" }}>
              멘토 서포터즈 · {COUNTRIES[mentor.country].label}
            </span>
            <span className="display" style={{ fontSize: 26 }}>
              {mentor.name}
            </span>
            <span className="small muted">{mentor.major}</span>
          </div>
          <div style={{ borderTop: "1.5px dashed #111", background: "#f4f4f2", padding: "12px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>활동 인증서까지</span>
              <span className="mono">
                {progress}/{CERT_GOAL} · 누적 {mentor.answered}건 · {mentor.answered * 10}P
              </span>
            </div>
            <div style={{ height: 8, background: "#d3d3cf", borderRadius: 2, overflow: "hidden" }} aria-hidden="true">
              <div style={{ height: 8, width: `${(progress / CERT_GOAL) * 100}%`, background: "#111" }} />
            </div>
          </div>
        </section>

        <section>
          <div className="section-head" style={{ alignItems: "center" }}>
            <div className="seg" role="group" aria-label="질문 목록">
              <button aria-pressed={tab === "todo"} onClick={() => setTab("todo")}>
                답변 대기 {todo.length}
              </button>
              <button aria-pressed={tab === "done"} onClick={() => setTab("done")}>
                답변 완료 {done.length}
              </button>
            </div>
            <button className="small" onClick={load} style={{ background: "none", border: 0, textDecoration: "underline", cursor: "pointer", padding: 6 }}>
              새로고침
            </button>
          </div>

          {!questions ? (
            <div className="row">
              <Spinner label="불러오는 중…" />
            </div>
          ) : list.length === 0 ? (
            <div className="row small muted">{tab === "todo" ? "지금은 기다리는 질문이 없어요." : "아직 답변한 질문이 없어요."}</div>
          ) : (
            list.map((q) => (
              <article key={q.id} style={{ borderBottom: "1px solid #dadad6", padding: "14px 0", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {q.urgent && <span className="stamp-risk">긴급</span>}
                  <span className="tag-info">{CATEGORY_LABEL[q.category]}</span>
                  {q.locked && (
                    <span className="small muted" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <IconLock size={13} /> 비공개 (멘토만)
                    </span>
                  )}
                </div>
                <div className="card-wash" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="small muted">AI 요약</span>
                  <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.45 }}>{q.summary}</span>
                  {q.related && q.related.length > 0 && (
                    <span className="small" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span className="muted">관련 근거</span>
                      {q.related.map((r) => (
                        <a key={r.id} href={r.source.url || undefined} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                          {r.title}
                        </a>
                      ))}
                    </span>
                  )}
                </div>
                <span className="body" style={{ fontSize: 14 }}>
                  <b style={{ color: "#111" }}>원문</b> {q.text}
                </span>
                {q.answer ? (
                  <div className="notice">
                    <b style={{ color: "#111" }}>{q.answer.mentor}</b> · {q.answer.text}
                  </div>
                ) : (
                  <AnswerBox q={q} mentor={mentor} onDone={onAnswered} />
                )}
              </article>
            ))
          )}
        </section>

        <Link href="/ask" className="small" style={{ textDecoration: "underline", alignSelf: "center", padding: 8 }}>
          질문자 화면 보기
        </Link>
      </div>
    </main>
  );
}
