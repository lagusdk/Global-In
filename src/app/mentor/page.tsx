"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { IconLock } from "@/components/icons";
import { Spinner } from "@/components/ui";
import type { ApplicationView } from "@/lib/applicationShared";
import { COUNTRIES } from "@/lib/kb/countries";
import { CERT_GOAL, clearMentor, getMentor, type MentorSession } from "@/lib/mentorSession";
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
        body: JSON.stringify({ id: q.id, text, mentorId: mentor.id, mentorToken: mentor.token }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setText("");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "답변을 올리지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label className="sr-only" htmlFor={`a-${q.id}`}>
        답변
      </label>
      <textarea
        id={`a-${q.id}`}
        className="input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="내 경험과 공부를 바탕으로, 쉬운 말로 써 주세요. 확실하지 않으면 단정하지 말고 공식 창구를 함께 안내해 주세요."
        style={{ fontFamily: "var(--sans)", fontSize: 14, minHeight: 120 }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span className="small faint">욕설·개인정보가 있으면 등록되지 않아요</span>
        <button className="btn sm" onClick={post} disabled={busy || text.trim().length < 10} type="button">
          {busy ? <Spinner /> : q.answer?.byAI ? "서포터즈 답변으로 바꾸기" : "답변 등록"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default function Mentor() {
  const router = useRouter();
  const [mentor, setM] = useState<MentorSession | null>(null);
  const [app, setApp] = useState<ApplicationView | null | undefined>(undefined);
  const [tab, setTab] = useState<"todo" | "done">("todo");
  const [questions, setQuestions] = useState<QuestionView[] | null>(null);

  useEffect(() => {
    const m = getMentor();
    if (!m) router.replace("/mentor/apply");
    else setM(m);
  }, [router]);

  const loadApp = useCallback(async () => {
    if (!mentor) return;
    const res = await fetch(`/api/mentors?id=${mentor.id}&token=${mentor.token}`);
    setApp(res.ok ? (await res.json()).application : null);
  }, [mentor]);

  const loadQuestions = useCallback(async () => {
    if (!mentor || app?.review.state !== "approved") return;
    const res = await fetch(`/api/questions?country=${mentor.country}&mentor=${mentor.id}:${mentor.token}`);
    setQuestions((await res.json()).questions);
  }, [mentor, app]);

  useEffect(() => {
    loadApp();
  }, [loadApp]);
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const leave = () => {
    clearMentor();
    router.replace("/mentor/apply");
  };

  if (!mentor || app === undefined) return <main className="phone" />;

  if (app === null) {
    return (
      <main className="phone">
        <div className="screen">
          <div className="error">신청서를 찾지 못했어요. 서버가 다시 시작되면 데모 신청서가 사라질 수 있어요.</div>
          <button className="btn" onClick={leave}>
            다시 신청하기
          </button>
        </div>
      </main>
    );
  }

  const state = app.review.state;
  const todo = (questions ?? []).filter((q) => !q.answered || q.answer?.byAI);
  const done = (questions ?? []).filter((q) => q.answered && !q.answer?.byAI);
  const list = tab === "todo" ? todo : done;
  const progress = app.answered % CERT_GOAL;

  return (
    <main className="phone">
      <div className="screen" style={{ gap: 16 }}>
        <div className="topbar" style={{ justifyContent: "space-between" }}>
          <span className="wordmark">Global-In</span>
          <button className="small" onClick={leave} style={{ background: "none", border: 0, textDecoration: "underline", cursor: "pointer", padding: 8 }}>
            이 기기에서 나가기
          </button>
        </div>

        <section className="box" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {state === "approved" ? <span className="tag-ok">승인됨</span> : state === "pending" ? <span className="tag-caution">심사 중</span> : <span className="stamp-risk">반려</span>}
              <span className="small muted">서포터즈 · {COUNTRIES[app.country].label}</span>
            </span>
            <span className="display" style={{ fontSize: 26 }}>
              {app.nickname}
            </span>
            <span className="small muted">
              {app.field}
              {app.experience ? ` · ${app.experience}` : ""}
            </span>
          </div>
          {state === "approved" && (
            <div style={{ borderTop: "1.5px dashed #111", background: "#f4f4f2", padding: "12px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>활동 인증서까지</span>
                <span className="mono">
                  {progress}/{CERT_GOAL} · 누적 {app.answered}건
                </span>
              </div>
              <div style={{ height: 8, background: "#d3d3cf", borderRadius: 2, overflow: "hidden" }} aria-hidden="true">
                <div style={{ height: 8, width: `${(progress / CERT_GOAL) * 100}%`, background: "#111" }} />
              </div>
            </div>
          )}
        </section>

        {state === "pending" && (
          <div className="card-wash" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>관리기관이 증빙을 확인하고 있어요</span>
            <span className="body" style={{ fontSize: 13 }}>
              제출한 증빙: {app.certificate.fileName}. 승인되면 이 화면에서 질문에 답할 수 있어요. 보통 2~3일 걸려요.
            </span>
            <button className="btn outline sm" onClick={loadApp}>
              심사 상태 새로고침
            </button>
            <Link href="/admin" className="small" style={{ textDecoration: "underline" }}>
              (데모) 관리기관 심사 화면 열기
            </Link>
          </div>
        )}

        {state === "rejected" && (
          <div className="error" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span>
              <b>반려 사유</b> {app.review.reason}
            </span>
            <button className="btn sm" onClick={leave}>
              다시 신청하기
            </button>
          </div>
        )}

        {state === "approved" && (
          <section>
            <div className="section-head" style={{ alignItems: "center" }}>
              <div className="seg" role="group" aria-label="질문 목록">
                <button aria-pressed={tab === "todo"} onClick={() => setTab("todo")}>
                  답변 필요 {todo.length}
                </button>
                <button aria-pressed={tab === "done"} onClick={() => setTab("done")}>
                  답변 완료 {done.length}
                </button>
              </div>
              <button className="small" onClick={loadQuestions} style={{ background: "none", border: 0, textDecoration: "underline", cursor: "pointer", padding: 6 }}>
                새로고침
              </button>
            </div>
            {!questions ? (
              <div className="row">
                <Spinner label="불러오는 중…" />
              </div>
            ) : list.length === 0 ? (
              <div className="row small muted">{tab === "todo" ? "지금은 기다리는 질문이 없어요." : "아직 서포터즈가 답한 질문이 없어요."}</div>
            ) : (
              list.map((q) => (
                <article key={q.id} style={{ borderBottom: "1px solid #dadad6", padding: "14px 0", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <span className="tag-info">{CATEGORY_LABEL[q.category]}</span>
                    {q.locked && (
                      <span className="small muted" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <IconLock size={13} /> 비공개 (서포터즈만)
                      </span>
                    )}
                    {!q.answered && q.aiInHours !== undefined && <span className="small faint">{q.aiInHours}시간 뒤 AI 대체 답변</span>}
                    {q.answer?.byAI && <span className="tag-caution">AI가 먼저 답함</span>}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.55 }}>{q.text}</span>
                  {q.answer && (
                    <div className="notice">
                      <b style={{ color: "#111" }}>{q.answer.mentor}</b> · {q.answer.text}
                    </div>
                  )}
                  {(!q.answer || q.answer.byAI) && <AnswerBox q={q} mentor={mentor} onDone={() => (loadApp(), loadQuestions())} />}
                </article>
              ))
            )}
          </section>
        )}

        <Link href="/ask" className="small" style={{ textDecoration: "underline", alignSelf: "center", padding: 8 }}>
          질문자 화면 보기
        </Link>
      </div>
    </main>
  );
}
