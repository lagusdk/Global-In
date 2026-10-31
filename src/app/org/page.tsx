"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AusMap } from "@/components/AusMap";
import { IconLock } from "@/components/icons";
import { Spinner } from "@/components/ui";
import type { Brief, OrgId } from "@/lib/brief";
import type { SignalSummary } from "@/lib/signals";

type OrgView = {
  label: string;
  persona?: "student" | "jobseeker" | "worker";
  members: { title: string; rows: { city: string; label: string; who: string }[] } | null;
  kpis: (s: SignalSummary) => { label: string; value: string; unit?: string; red?: boolean }[];
  actions: { title: string; desc: string; brief?: boolean }[];
};

// 소속 인원 수는 기관이 직접 입력하는 값이라 데모에서는 예시로 둔다.
const VIEWS: Record<OrgId, OrgView> = {
  uni: {
    label: "대학 국제처",
    persona: "student",
    members: {
      title: "우리 학생이 있는 도시",
      rows: [
        { city: "sydney", label: "시드니", who: "교환학생 7명" },
        { city: "brisbane", label: "브리즈번", who: "교환·인턴 6명" },
        { city: "melbourne", label: "멜버른", who: "어학연수 4명" },
      ],
    },
    kpis: (s) => [
      { label: "우리 학교 호주 체류 학생", value: "17", unit: "명" },
      { label: "학생 대상 위험 신호", value: String(s.total), unit: "건", red: true },
      { label: "출국 예정 (11–12월)", value: "15", unit: "명" },
      { label: "가장 많은 어려움", value: s.topIssues[0]?.issue ?? "—" },
    ],
    actions: [
      { title: "출국 전 오리엔테이션 자료 만들기", desc: "최근 많이 나온 어려움 Top 5로 자동 구성", brief: true },
      { title: "체류 학생에게 안내 보내기", desc: "학교 알림에 동의한 학생 대상" },
    ],
  },
  youth: {
    label: "청년·고용 지원기관",
    persona: "jobseeker",
    members: null,
    kpis: (s) => [
      { label: "워홀·구직 청년 제보", value: String(s.total), unit: "건", red: true },
      { label: "가장 많은 어려움", value: s.topIssues[0]?.issue ?? "—" },
      { label: "급증 패턴", value: s.patterns[0] ? `${s.patterns[0].cityLabel} ${s.patterns[0].industry}` : "—" },
      { label: "선입금 요구 제보", value: String(s.topIssues.find((i) => i.issue.includes("선입금"))?.count ?? 0), unit: "건" },
    ],
    actions: [
      { title: "워홀·해외취업 준비 교육 자료", desc: "지역·업종별 주의사항을 교육용으로 정리", brief: true },
      { title: "구인 사기 경보 공지", desc: "선입금·스폰서 대가 요구 패턴 안내" },
    ],
  },
  hr: {
    label: "기업 HR",
    persona: "worker",
    members: {
      title: "우리 회사 파견자",
      rows: [
        { city: "melbourne", label: "멜버른", who: "현지 법인 4명" },
        { city: "perth", label: "퍼스", who: "프로젝트 파견 2명" },
      ],
    },
    kpis: (s) => [
      { label: "호주 파견 중", value: "6", unit: "명" },
      { label: "출국 예정 (다음 분기)", value: "3", unit: "명" },
      { label: "파견자 관련 신호", value: String(s.total), unit: "건", red: true },
      { label: "가장 많은 문제", value: s.topIssues[0]?.issue ?? "—" },
    ],
    actions: [
      { title: "파견자 정착 체크리스트 만들기", desc: "주거·세금·연금·보험·귀임 조건 점검표", brief: true },
      { title: "발령서 표준 문안 점검", desc: "'별도 협의'로 남은 항목 찾기" },
    ],
  },
  gov: {
    label: "재외공관·공공기관",
    members: null,
    kpis: (s) => [
      { label: "동의 제보", value: String(s.total), unit: "건" },
      { label: "급증 패턴", value: s.patterns[0] ? `${s.patterns[0].cityLabel} +${s.patterns[0].change}%` : "—", red: true },
      { label: "가장 많은 어려움", value: s.topIssues[0]?.issue ?? "—" },
      { label: "대상별 제보", value: `학생 ${s.byPersona.student} · 구직 ${s.byPersona.jobseeker} · 직장 ${s.byPersona.worker}` },
    ],
    actions: [
      { title: "재외국민 안전 공지 초안 만들기", desc: "지역·업종별 주의사항을 한국어로 정리", brief: true },
      { title: "현지 노동 당국 협조 요청 자료", desc: "유형별 집계를 영문 요약으로" },
    ],
  },
};

export default function Org() {
  const [org, setOrg] = useState<OrgId>("uni");
  const [summary, setSummary] = useState<SignalSummary | null>(null);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [briefBusy, setBriefBusy] = useState(false);
  const view = VIEWS[org];

  useEffect(() => {
    setSummary(null);
    setBrief(null);
    fetch(`/api/signals${view.persona ? `?persona=${view.persona}` : ""}`)
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [org, view.persona]);

  const makeBrief = async () => {
    setBriefBusy(true);
    try {
      const res = await fetch("/api/brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ org }) });
      setBrief(await res.json());
    } finally {
      setBriefBusy(false);
    }
  };

  return (
    <main className="org">
      <div className="org-inner">
        <header style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 18, borderBottom: "1.5px solid #111" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Link href="/" className="wordmark" style={{ fontSize: 18 }}>
                Global-In
              </Link>
              <span style={{ width: 1.5, height: 16, background: "#111" }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>위험 신호 대시보드</span>
              <span className="tag-caution">샘플 데이터 포함</span>
            </div>
            <h1 className="display" style={{ fontSize: 34 }}>
              호주 · 최근 30일
            </h1>
          </div>
          <div className="seg" role="group" aria-label="기관 보기" style={{ flexWrap: "wrap" }}>
            {(Object.keys(VIEWS) as OrgId[]).map((id) => (
              <button key={id} aria-pressed={org === id} onClick={() => setOrg(id)} style={{ height: 36, fontSize: 14 }}>
                {VIEWS[id].label}
              </button>
            ))}
          </div>
        </header>

        {!summary ? (
          <Spinner label="집계 불러오는 중…" />
        ) : (
          <>
            <div className="kpis">
              {view.kpis(summary).map((k) => (
                <div key={k.label}>
                  <span style={{ fontSize: 13 }} className="muted">
                    {k.label}
                  </span>
                  <span className="kpi-num" style={{ color: k.red ? "#c42b1c" : undefined, fontSize: k.unit ? 34 : 22, paddingTop: k.unit ? 0 : 8 }}>
                    {k.value}
                    {k.unit && <small> {k.unit}</small>}
                  </span>
                </div>
              ))}
            </div>

            <div className="wrap-row">
              <section className="box" style={{ flex: "999 1 560px", minWidth: 0, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <h2 className="h2" style={{ fontSize: 18 }}>
                    지역별 위험 신호
                  </h2>
                  <div className="small muted" style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 5, background: "rgba(196,43,28,.25)", border: "1.5px solid #c42b1c" }} />
                      ~14건
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 6, background: "#e38a80", border: "1.5px solid #c42b1c" }} />
                      15~29건
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 7, background: "#c42b1c" }} />
                      30건+
                    </span>
                    {view.members && (
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 14, height: 14, borderRadius: 7, border: "1.5px dashed #111" }} />
                        우리 소속
                      </span>
                    )}
                  </div>
                </div>
                <AusMap cities={summary.cities} highlight={view.members?.rows.map((r) => r.city)} />
                <span className="small muted">원 크기 = 제보 건수 · 5건 미만인 지역은 개인 식별을 막기 위해 표시하지 않아요</span>
              </section>

              <section style={{ flex: "1 1 340px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
                {view.members && (
                  <div>
                    <div className="section-head">
                      <h2 className="h2" style={{ fontSize: 18 }}>
                        {view.members.title}
                      </h2>
                      <span className="small faint">기관 입력 예시</span>
                    </div>
                    {view.members.rows.map((m) => (
                      <div key={m.city} className="row" style={{ justifyContent: "space-between", fontSize: 14 }}>
                        <span>
                          <b>{m.label}</b> · {m.who}
                        </span>
                        <span className="mono">신호 {summary.cities.find((c) => c.id === m.city)?.count ?? 0}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!view.members && summary.patterns[0] && (
                  <div style={{ background: "#ffe14d", borderRadius: 10, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <span className="h2" style={{ fontSize: 13 }}>
                      이번 주 주목할 신호
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.45 }}>
                      {summary.patterns[0].cityLabel} {summary.patterns[0].industry}, ‘{summary.patterns[0].issue}’ 제보가 늘었어요 (+{summary.patterns[0].change}%)
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <h2 className="h2" style={{ fontSize: 18 }}>
                    할 수 있는 일
                  </h2>
                  {view.actions.map((a, i) => (
                    <div key={a.title} className="card-wash" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{a.title}</span>
                        <span className="muted" style={{ fontSize: 13 }}>
                          {a.desc}
                        </span>
                      </span>
                      {a.brief ? (
                        <button className="btn sm" onClick={makeBrief} disabled={briefBusy}>
                          {briefBusy ? <Spinner /> : "만들기"}
                        </button>
                      ) : (
                        <button className={`btn sm ${i ? "outline" : ""}`} disabled title="데모에서는 준비 중이에요">
                          준비 중
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {brief && (
                  <article className="box" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }} aria-live="polite">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                      <h3 className="h2" style={{ fontSize: 16 }}>
                        {brief.title}
                      </h3>
                      <span className="mono small faint">{brief.mode === "ai" ? "AI 초안" : "템플릿"}</span>
                    </div>
                    {brief.sections.map((s) => (
                      <div key={s.heading}>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{s.heading}</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }} className="body">
                          {s.items.map((it) => (
                            <li key={it}>{it}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </article>
                )}
              </section>
            </div>

            <div className="wrap-row" style={{ alignItems: "flex-start" }}>
              <section style={{ flex: "1 1 340px", minWidth: 0 }}>
                <div className="section-head">
                  <h2 className="h2" style={{ fontSize: 18 }}>
                    많이 나온 어려움 Top 5
                  </h2>
                </div>
                <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {summary.topIssues.map((t, i) => (
                    <li key={t.issue} style={{ display: "grid", gridTemplateColumns: "24px minmax(0,1fr) 48px", gap: 10, alignItems: "center", padding: "11px 0", borderBottom: "1px solid #dadad6", fontSize: 14 }}>
                      <span className="mono" style={{ fontWeight: 600 }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {t.issue}
                        <span style={{ height: 6, width: `${(t.count / summary.topIssues[0].count) * 100}%`, background: "#111" }} />
                      </span>
                      <span className="mono" style={{ textAlign: "right" }}>
                        {t.count}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>

              <section style={{ flex: "2 1 560px", minWidth: 0 }}>
                <div className="section-head">
                  <h2 className="h2" style={{ fontSize: 18 }}>
                    최근 늘어난 패턴
                  </h2>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>지역</th>
                        <th>업종</th>
                        <th>어려움 유형</th>
                        <th className="r">건수</th>
                        <th className="r">전월 대비</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.patterns.map((p) => (
                        <tr key={`${p.city}${p.industry}${p.issue}`}>
                          <td style={{ fontWeight: 600 }}>{p.cityLabel}</td>
                          <td>{p.industry}</td>
                          <td>{p.issue}</td>
                          <td className="r">{p.count}</td>
                          <td className="r" style={{ color: p.change >= 10 ? "#c42b1c" : "#4a4a48", fontWeight: 600 }}>
                            {p.change > 0 ? "+" : ""}
                            {p.change}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <footer style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingTop: 16, borderTop: "1.5px solid #111", fontSize: 13, lineHeight: 1.6, color: "#333331" }}>
              <IconLock />
              <span>
                이용자가 직접 <b style={{ color: "#111" }}>‘익명으로 알리기’</b>를 누른 제보만 모아요. 이름·연락처·사업장명·서류 원문은 저장하지 않고, 지역·업종·어려움 유형만 집계해요. 5건 미만인 칸은 표시하지 않아요.
                {summary.liveReports > 0 && ` (이번 세션 실제 제보 ${summary.liveReports}건 반영)`}
              </span>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
