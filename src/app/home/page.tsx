"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconBell, IconCamera, IconCheck, IconChevron } from "@/components/icons";
import { LevelTag, TabBar, useProfile } from "@/components/ui";
import { CITIES } from "@/lib/kb/au";
import { DOC_TYPE_LABEL, PERSONAS } from "@/lib/personas";
import { daysSince, getCase, updateCase, type CaseState } from "@/lib/store";

type Nearby = { count: number; issues: string[]; scope: string } | null | undefined;

const CITY_CODE: Record<string, string> = { brisbane: "BNE", sydney: "SYD", melbourne: "MEL" };

export default function Home() {
  const profile = useProfile();
  const [c, setC] = useState<CaseState>({});
  const [nearby, setNearby] = useState<Nearby>(undefined);

  useEffect(() => setC(getCase()), []);

  useEffect(() => {
    if (!profile) return;
    const industry = PERSONAS[profile.persona].industry;
    fetch(`/api/signals?city=${profile.city}&industry=${encodeURIComponent(industry)}`)
      .then((r) => r.json())
      .then((d) => setNearby(d.nearby))
      .catch(() => setNearby(null));
  }, [profile]);

  if (!profile) return <main className="phone" />;
  const pack = PERSONAS[profile.persona];
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

  return (
    <main className="phone">
      <div className="screen with-tabs" style={{ gap: 18 }}>
        <div className="topbar" style={{ justifyContent: "space-between" }}>
          <span className="wordmark">Global-In</span>
          <Link href="/onboarding" className="icon-btn" aria-label="프로필 바꾸기" style={{ marginRight: -10 }}>
            <IconBell />
          </Link>
        </div>

        <section className="box" style={{ overflow: "hidden" }} aria-label="내 체류 정보">
          <div style={{ padding: "14px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="mono small muted">ICN → {CITY_CODE[profile.city]}</span>
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
              ["유형", pack.short],
              ["비자", pack.visaLabel],
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
              <span style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${pack.todos.length}, minmax(0, 1fr))`, gap: 4 }} aria-hidden="true">
                {pack.todos.map((t) => (
                  <span key={t.id} style={{ height: 8, borderRadius: 2, background: done.has(t.id) ? "#111" : "#d3d3cf" }} />
                ))}
              </span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
                {pack.todos.filter((t) => done.has(t.id)).length}/{pack.todos.length}
              </span>
            </summary>
            <ul style={{ listStyle: "none", margin: 0, padding: "0 18px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
              {pack.todos.map((t) => (
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
            <br />한국 기준과 비교해서 풀어 드려요
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
            <span className="small faint">이용자 동의 제보 기준</span>
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
            </div>
          ) : nearby === null ? (
            <div className="card-wash small muted">아직 이 지역 제보가 5건 미만이라 표시하지 않아요.</div>
          ) : (
            <div className="card-wash small muted" style={{ minHeight: 88 }} aria-busy="true" />
          )}
        </section>

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
