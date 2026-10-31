"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { IconChevron, IconLock } from "@/components/icons";
import { Spinner, TopBar, useProfile } from "@/components/ui";
import { COUNTRIES } from "@/lib/kb/countries";
import type { QCategory, QuestionView } from "@/lib/questions";

const CATEGORY_LABEL: Record<QCategory, string> = { language: "언어·소통", legal: "법률·계약", life: "생활·정착" };
const MINE_KEY = "gi.myQuestions";

type Mine = { id: string; token: string }[];

function readMine(): Mine {
  try {
    return JSON.parse(localStorage.getItem(MINE_KEY) ?? "[]") as Mine;
  } catch {
    return [];
  }
}

function saveMine(m: Mine) {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify(m));
  } catch {
    /* 저장이 막힌 브라우저 */
  }
}

function ago(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "방금";
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function QuestionItem({ q, open, onToggle }: { q: QuestionView; open: boolean; onToggle: () => void }) {
  const hidden = q.locked && !q.text;
  return (
    <div style={{ borderBottom: "1px solid #dadad6" }}>
      <button
        onClick={hidden ? undefined : onToggle}
        aria-expanded={hidden ? undefined : open}
        disabled={hidden}
        style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: 10, padding: "13px 0", background: "none", border: 0, textAlign: "left", cursor: hidden ? "default" : "pointer" }}
      >
        <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          <span style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span className="tag-info">{CATEGORY_LABEL[q.category]}</span>
            {q.locked && (
              <span className="small muted" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                <IconLock size={13} /> 멘토만 보기
              </span>
            )}
            {q.mine && <span className="tag-dark">내 질문</span>}
            <span className="small faint">{ago(q.createdAt)}</span>
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: hidden ? "#6b6b68" : "#111" }}>{hidden ? "비공개 질문이에요. 멘토만 볼 수 있어요." : q.text}</span>
        </span>
        {q.answered ? <span className="tag-ok">답변 완료</span> : <span className="small faint" style={{ whiteSpace: "nowrap", paddingTop: 2 }}>답변 대기</span>}
      </button>
      {open && !hidden && (
        <div style={{ padding: "0 0 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {q.related && q.related.length > 0 && (
            <div className="small muted" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span>관련 근거</span>
              {q.related.map((r) => (
                <a key={r.id} href={r.source.url || undefined} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                  {r.title}
                </a>
              ))}
            </div>
          )}
          {q.answer ? (
            <div className="card-wash" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span className="tag-caution">멘토 서포터즈</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{q.answer.mentor}</span>
                <span className="small muted">{q.answer.major}</span>
              </span>
              <span className="body" style={{ fontSize: 14 }}>{q.answer.text}</span>
              <span className="small faint">멘토의 경험과 공부를 바탕으로 한 안내예요. 법률 자문이 필요하면 공식 상담 창구를 이용하세요.</span>
            </div>
          ) : (
            <div className="notice">AI가 질문을 정리해서 멘토에게 전달했어요. 답변이 달리면 여기에서 볼 수 있어요.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Ask() {
  const profile = useProfile();
  const [category, setCategory] = useState<QCategory>("legal");
  const [text, setText] = useState("");
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [questions, setQuestions] = useState<QuestionView[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const mine = readMine()
      .map((m) => `${m.id}:${m.token}`)
      .join(",");
    const res = await fetch(`/api/questions?country=${profile.country ?? "AU"}&mine=${encodeURIComponent(mine)}`);
    const d = await res.json();
    setQuestions(d.questions);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  if (!profile) return <main className="phone" />;
  const country = profile.country ?? "AU";

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, persona: profile.persona, category, text, locked }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      saveMine([{ id: d.id, token: d.token }, ...readMine()].slice(0, 30));
      setSent(d.summary);
      setText("");
      setTab("mine");
      await load();
      setOpen(d.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "질문을 보내지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  const list = (questions ?? []).filter((q) => (tab === "mine" ? q.mine : true));

  return (
    <main className="phone">
      <div className="screen" style={{ gap: 16 }}>
        <TopBar title="멘토 질문함" back="" right={<span className="mono small muted">{COUNTRIES[country].label}</span>} />

        <h1 className="display h1">
          혼자 고민하지 말고,
          <br />
          <span className="hl">멘토에게 물어보세요</span>
        </h1>
        <p className="body" style={{ margin: 0 }}>
          {COUNTRIES[country].langLabel}·법학 전공 <b style={{ color: "#111" }}>멘토 서포터즈</b>가 답해요. 이름 없이 질문하고, 자물쇠를 걸면 멘토만 볼 수 있어요.
        </p>

        <details className="card-wash" style={{ fontSize: 13, lineHeight: 1.6 }}>
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>멘토가 도울 수 있는 것 · 답변 시간 · 바로 공식 기관에 갈 때</summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <span>
              <b>도울 수 있어요</b> — 현지어 표현·문장 다듬기, 비슷한 경험 공유, 어떤 기관에 무엇을 물어보면 되는지 안내
            </span>
            <span>
              <b>어려워요</b> — 법률 판단이나 대리, 소송·신고 대행, 긴급 상황 대응 (멘토는 변호사·노무사가 아니에요)
            </span>
            <span>
              <b>답변 시간</b> — 보통 1~2일 안에 달려요. 바로 답이 필요하면 공식 상담 창구를 먼저 이용하세요.
            </span>
            <span>
              <b>이럴 땐 바로 공식 기관</b> — 폭력·협박, 여권·재류카드를 빼앗김, 임금을 전혀 못 받음, 비자 문제 → 현지 노동 상담기관이나 대사관·총영사관 (외교부 영사콜센터 +82-2-3210-0404, 24시간)
            </span>
          </div>
        </details>

        <section className="box" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="seg" role="group" aria-label="질문 종류" style={{ alignSelf: "flex-start", flexWrap: "wrap" }}>
            {(Object.keys(CATEGORY_LABEL) as QCategory[]).map((k) => (
              <button key={k} aria-pressed={category === k} onClick={() => setCategory(k)}>
                {CATEGORY_LABEL[k]}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="q">
            질문 내용
          </label>
          <textarea
            id="q"
            className="input"
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
            placeholder="예: 집주인이 보증금을 현금으로 달래요. 영수증만 받으면 괜찮을까요?"
            style={{ fontFamily: "var(--sans)", fontSize: 14, minHeight: 110 }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, minHeight: 44, cursor: "pointer" }}>
              <input type="checkbox" checked={locked} onChange={(e) => setLocked(e.target.checked)} style={{ width: 20, height: 20, accentColor: "#111" }} />
              <IconLock size={16} /> 멘토만 보기
            </label>
            <button className="btn sm" onClick={submit} disabled={busy || text.trim().length < 5} style={{ minWidth: 120 }}>
              {busy ? <Spinner label="정리 중…" /> : "익명으로 질문하기"}
            </button>
          </div>
          <span className="small faint">이름·연락처·사업장 이름은 적지 마세요. 질문은 AI가 요약·분류해서 멘토에게 전달돼요.</span>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {sent && (
            <div className="notice" role="status">
              질문을 보냈어요. AI 요약: <b style={{ color: "#111" }}>{sent}</b>
            </div>
          )}
        </section>

        <section>
          <div className="section-head" style={{ alignItems: "center" }}>
            <div className="seg" role="group" aria-label="목록">
              <button aria-pressed={tab === "all"} onClick={() => setTab("all")}>
                모두의 질문
              </button>
              <button aria-pressed={tab === "mine"} onClick={() => setTab("mine")}>
                내 질문
              </button>
            </div>
            <span className="small faint">{COUNTRIES[country].label}</span>
          </div>
          {!questions ? (
            <div className="row">
              <Spinner label="불러오는 중…" />
            </div>
          ) : list.length === 0 ? (
            <div className="row small muted">{tab === "mine" ? "아직 남긴 질문이 없어요." : "아직 질문이 없어요."}</div>
          ) : (
            list.map((q) => <QuestionItem key={q.id} q={q} open={open === q.id} onToggle={() => setOpen(open === q.id ? null : q.id)} />)
          )}
        </section>

        <Link href="/mentor/login" className="card-wash" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="small muted">외국어·법학 전공 대학생이라면</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              <span className="hl">멘토 서포터즈</span>로 참여하기
            </span>
          </span>
          <IconChevron />
        </Link>
      </div>
    </main>
  );
}
