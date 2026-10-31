"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconCamera, IconCheck, IconChevron } from "@/components/icons";
import { Notifications, type Note } from "@/components/Notifications";
import { LevelTag, TabBar, useProfile } from "@/components/ui";
import type { Level } from "@/lib/types";
import { CITIES } from "@/lib/kb/au";
import { DOC_TYPE_LABEL, PERSONAS, visaLabel } from "@/lib/personas";
import { daysSince, getCase, updateCase, type CaseState } from "@/lib/store";

type Nearby = { count: number; sample: number; live: number; issues: string[]; scope: string } | null | undefined;


export default function Home() {
  const profile = useProfile();
  const [c, setC] = useState<CaseState>({});
  const [nearby, setNearby] = useState<Nearby>(undefined);

  useEffect(() => setC(getCase()), []);

  useEffect(() => {
    if (!profile) return;
    const industry = PERSONAS[profile.persona].industry[profile.country ?? "AU"];
    fetch(`/api/signals?city=${profile.city}&industry=${encodeURIComponent(industry)}`)
      .then((r) => r.json())
      .then((d) => setNearby(d.nearby))
      .catch(() => setNearby(null));
  }, [profile]);

  if (!profile) return <main className="phone" />;
  const pack = PERSONAS[profile.persona];
  const todos = pack.todos[profile.country ?? "AU"];
  const done = new Set(c.doneTodos ?? []);
  const toggle = (id: string) => {
    const next = new Set(done);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setC(updateCase({ doneTodos: [...next] }));
  };
  const a = c.analysis;
  const risks = a?.findings.filter((f) => f.level === "risk").length ?? 0;
  const day = daysSince(profile.arrival);
  const arrived = new Date(`${profile.arrival}T00:00:00`).getTime() <= Date.now();
  const nextTodo = todos.find((t) => !done.has(t.id));
  const notes: Note[] = [
    ...(a && a.findings.length
      ? [{ id: "doc", level: (risks ? "risk" : "caution") as Level, tag: risks ? `위험 ${risks}` : "주의", title: `${a.docTitle} — 짚어볼 곳 ${a.findings.length}건`, sub: "서명 전에 다시 확인하세요", href: "/result" }]
      : []),
    ...(nearby
      ? [{ id: "nearby", level: "caution" as Level, tag: "경고", title: `${CITIES[profile.city].label} ${nearby.scope} 제보 ${nearby.count}건`, sub: nearby.issues.join(" · ") }]
      : []),
    ...(nextTodo ? [{ id: "todo", tag: "할 일", title: nextTodo.text, sub: `첫 30일 할 일 ${todos.length - todos.filter((t) => done.has(t.id)).length}개 남음` }] : []),
    ...(c.shared ? [{ id: "shared", tag: "반영", title: "내 제보가 다른 사람들의 경고에 반영됐어요" }] : []),
  ];

  return (
    <main className="phone">
      <div className="screen with-tabs" style={{ gap: 18 }}>
        <div className="topbar" style={{ justifyContent: "space-between" }}>
          <span className="wordmark">Global-In</span>
          <Notifications notes={notes} />
        </div>

        <section className="box" style={{ overflow: "hidden" }} aria-label="내 체류 정보">
          <div style={{ padding: "14px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="mono small muted">
                ICN → {CITIES[profile.city].code}{" "}
                <Link href="/onboarding" style={{ fontFamily: "var(--sans)", textDecoration: "underline", marginLeft: 6 }}>
                  수정
                </Link>
              </span>
              <span className="display" style={{ fontSize: 32 }}>
                {CITIES[profile.city].label}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
              <span className="small muted">{arrived ? "도착 후" : "출국까지"}</span>
              <span className="display" style={{ fontSize: 32 }}>
                {arrived ? `D+${day}` : `D-${Math.ceil((new Date(`${profile.arrival}T00:00:00`).getTime() - Date.now()) / 86_400_000)}`}
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, padding: "0 18px 14px" }}>
            {[
              ["목적", pack.short],
              ["비자", visaLabel(profile.country ?? "AU", profile.visa)],
              ["이름", profile.name ?? "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span className="small faint">{k}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <details style={{ borderTop: "1.5px dashed #111", background: "#f4f4f2" }}>
            <summary style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", listStyle: "none" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>첫 30일 할 일</span>
              <span style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${todos.length}, minmax(0, 1fr))`, gap: 4 }} aria-hidden="true">
                {todos.map((t) => (
                  <span key={t.id} style={{ height: 8, borderRadius: 2, background: done.has(t.id) ? "#111" : "#d3d3cf" }} />
                ))}
              </span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
                {todos.filter((t) => done.has(t.id)).length}/{todos.length}
              </span>
            </summary>
            <ul style={{ listStyle: "none", margin: 0, padding: "0 18px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
              {todos.map((t) => (
                <li key={t.id}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 40, cursor: "pointer", fontSize: 14 }}>
                    <input type="checkbox" checked={done.has(t.id)} onChange={() => toggle(t.id)} style={{ width: 18, height: 18, accentColor: "#111" }} />
                    <span style={{ textDecoration: done.has(t.id) ? "line-through" : "none", color: done.has(t.id) ? "#6b6b68" : "#111" }}>{t.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          </details>
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 className="display" style={{ fontSize: 30, lineHeight: 1.22 }}>
            서명하기 전에,
            <br />
            <span className="hl">한 번 찍어보세요</span>
          </h1>
          <span className="body muted" style={{ fontSize: 14 }}>
            {pack.docTypes.slice(0, 3).map((d) => DOC_TYPE_LABEL[d]).join(" · ")}
            <br />현지 근로·주거 기준을 한국어로 쉽게 확인하세요
          </span>
          <Link href="/scan" className="btn block" style={{ fontSize: 16 }}>
            <IconCamera color="#fff" />
            서류 확인하기
          </Link>
        </section>

        {a && (
          <section style={{ display: "flex", flexDirection: "column" }}>
            <div className="section-head">
              <span className="h2">확인 필요</span>
              <span className="small faint">최근 서류</span>
            </div>
            <Link href="/result" className="row">
              {risks > 0 ? <LevelTag level="risk">위험 {risks}</LevelTag> : <LevelTag level="caution">주의 {a.findings.length}</LevelTag>}
              <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{a.docTitle}</span>
                <span className="small faint">짚어볼 곳 {a.findings.length}건</span>
              </span>
              <IconChevron />
            </Link>
          </section>
        )}

        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="h2">내 주변 경고</span>
            <span className="tag-caution">시연 데이터 포함</span>
          </div>
          {nearby ? (
            <div className="card-wash" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="mono small muted">
                {CITIES[profile.city].label} · {nearby.scope} · 최근 30일
              </span>
              <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45 }}>
                {nearby.issues.join(" · ")} 제보 <span className="hl">{nearby.count}건</span>
              </span>
              <span className="small muted">일을 시작하거나 계약하기 전에 서류를 꼭 확인하세요.</span>
              <details className="small muted">
                <summary style={{ cursor: "pointer" }}>
                  시연용 샘플 {nearby.sample}건 · 실제 제보 {nearby.live}건 — 이 숫자는 어떻게 세나요?
                </summary>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18, lineHeight: 1.6 }}>
                  <li>샘플은 시연을 위해 만든 가상 데이터예요. 실제 통계가 아니에요.</li>
                  <li>실제 제보는 이용자가 '익명으로 알리기'를 직접 누른 것만 세고, 서류 하나당 한 번만 알릴 수 있어요.</li>
                  <li>제보 내용은 운영진이 검증하기 전이에요. 같은 지역 5건 미만이면 표시하지 않아요.</li>
                </ul>
              </details>
            </div>
          ) : nearby === null ? (
            <div className="card-wash small muted">아직 이 지역 제보가 5건 미만이라 표시하지 않아요.</div>
          ) : (
            <div className="card-wash small muted" style={{ minHeight: 88 }} aria-busy="true" />
          )}
        </section>

        <Link href="/ask" className="box" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            <span className="small muted">외국어·법학 전공 멘토 서포터즈 · 익명</span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>
              혼자 고민될 땐 <span className="hl">멘토에게 물어보기</span>
            </span>
          </span>
          <IconChevron />
        </Link>

        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <Link href="/org/login" className="small faint" style={{ textDecoration: "underline", padding: 8 }}>
            기관 담당자용 대시보드
          </Link>
          <Link href="/mentor/apply" className="small faint" style={{ textDecoration: "underline", padding: 8 }}>
            멘토 서포터즈 참여
          </Link>
        </div>

        {c.shared && (
          <div className="notice" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <IconCheck size={16} /> 내가 알린 제보가 다른 사람들의 경고에 반영되고 있어요.
          </div>
        )}
      </div>
      <TabBar persona={profile.persona} />
    </main>
  );
}
