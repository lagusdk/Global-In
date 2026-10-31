"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconChevron, IconCopy, IconExternal } from "@/components/icons";
import { ModeBadge, Spinner, TopBar, useProfile } from "@/components/ui";
import { scenarioFor } from "@/lib/caseFlow";
import { BOND_AUTHORITY } from "@/lib/kb/au";
import { CITIES, COUNTRIES } from "@/lib/kb/countries";
import { SCENARIOS_BY_ID } from "@/lib/scenarios";
import { getCase } from "@/lib/store";
import type { AuState, Country, DraftMessage } from "@/lib/types";

type Help = { name: string; desc: string; url: string };

function helpFor(kind: string, country: Country, region: string): Help[] {
  if (country === "JP") {
    const embassyJp: Help = { name: "주일본 대한민국 대사관·총영사관", desc: "재외국민 영사 조력", url: "https://overseas.mofa.go.kr/jp-ko/index.do" };
    if (kind === "bond") return [{ name: "소비자 핫라인 188", desc: "임대·계약 분쟁 상담 (일본 소비자청)", url: "https://www.caa.go.jp" }, { name: "국토교통성 원상회복 가이드라인", desc: "퇴거 비용 부담 기준", url: "https://www.mlit.go.jp" }, embassyJp];
    if (kind === "package") return [{ name: "국민연금공단", desc: "한일 사회보장협정 가입증명서 안내", url: "https://www.nps.or.kr" }, { name: "일본 국세청", desc: "거주자·비거주자 판정 안내", url: "https://www.nta.go.jp" }];
    if (kind === "hours") return [{ name: "출입국재류관리청", desc: "자격외활동 허가·조건 안내", url: "https://www.moj.go.jp/isa/" }, embassyJp];
    return [{ name: "후생노동성 노동조건 상담", desc: "노동기준감독서·외국인 노동자 상담 다이얼 안내", url: "https://www.check-roudou.mhlw.go.jp" }, embassyJp];
  }
  const state = region as AuState;
  const embassy: Help = { name: "대한민국 대사관·총영사관", desc: "재외국민 영사 조력", url: "https://overseas.mofa.go.kr/au-ko/index.do" };
  if (kind === "bond") {
    const a = BOND_AUTHORITY[state];
    return [{ name: a.name, desc: `보증금 보관 기관 · 집주인은 ${a.within} 맡겨야 해요`, url: a.url }, embassy];
  }
  if (kind === "package") return [{ name: "국민연금공단", desc: "사회보장협정 가입증명서 안내", url: "https://www.nps.or.kr" }, { name: "ATO", desc: "호주 세금 거주자 판정 안내", url: "https://www.ato.gov.au" }];
  return [
    { name: "Fair Work Ombudsman", desc: "임금·근로 상담·신고 무료 · 통역 TIS 131 450", url: "https://www.fairwork.gov.au" },
    { name: "워킹홀리데이 인포센터 (재외동포청)", desc: "호주 임금체불 대응 절차·준비 자료 안내 (한국어)", url: "https://whic.mofa.go.kr/whic/nation/info.jsp?boardNo=100002" },
    embassy,
  ];
}

export default function Send() {
  const profile = useProfile();
  const [draft, setDraft] = useState<DraftMessage | null>(null);
  const [lang, setLang] = useState<"local" | "ko">("local");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [stage, setStage] = useState<"before" | "working" | "harmed">("working");

  useEffect(() => {
    if (!profile) return;
    const c = getCase();
    const id = c.scenarioId && SCENARIOS_BY_ID[c.scenarioId] ? c.scenarioId : scenarioFor(profile.persona, c.analysis, profile.country ?? "AU");
    setScenarioId(id);
    setStage(c.stage ?? "working");
    const kind = SCENARIOS_BY_ID[id].messageKind;
    fetch("/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: id,
        city: profile.city,
        name: profile.name,
        wage: kind === "wage" && c.wage ? { hours: c.wage.hours, paidHourly: c.wage.paidHourly, paidTotal: c.wage.paidTotal, expectedHourly: c.wage.expectedHourly, expectedTotal: c.wage.expectedTotal, shortfall: c.wage.shortfall } : undefined,
        findings: c.analysis?.findings.map((f) => f.title) ?? [],
        ruleIds: c.analysis?.findings.map((f) => f.ruleId).filter(Boolean) ?? [],
        stage: c.stage ?? "working",
        basisFrom: c.wage?.effectiveFrom,
      }),
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setDraft(d);
      })
      .catch(() => setError("메시지를 만들지 못했어요. 잠시 후 다시 시도해 주세요."));
  }, [profile]);

  if (!profile || !scenarioId) return <main className="phone" />;
  const scenario = SCENARIOS_BY_ID[scenarioId];
  const country = CITIES[profile.city].country;
  const localLabel = country === "JP" ? "日本語" : "EN";
  const subject = draft ? (lang === "local" ? draft.subjectLocal : draft.subjectKo) : "";
  const body = draft ? (lang === "local" ? draft.bodyLocal : draft.bodyKo) : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft!.bodyLocal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("복사하지 못했어요. 글을 길게 눌러 직접 복사해 주세요.");
    }
  };

  return (
    <main className="phone">
      <div className="screen with-actions" style={{ gap: 12 }}>
        <TopBar
          title={stage === "before" ? "수정 요청 메시지" : stage === "harmed" ? "상담용 요약" : "보낼 메시지"}
          back=""
          right={
            <div className="seg" role="group" aria-label="언어">
              <button aria-pressed={lang === "local"} onClick={() => setLang("local")}>
                {localLabel}
              </button>
              <button aria-pressed={lang === "ko"} onClick={() => setLang("ko")}>
                한국어
              </button>
            </div>
          }
        />

        <div className="box" style={{ borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 12, padding: "10px 14px", borderBottom: "1px solid #dadad6", fontSize: 13 }}>
            <span className="faint" style={{ width: 44 }}>받는 이</span>
            <span style={{ fontWeight: 600 }}>
              {stage === "harmed" ? (country === "JP" ? "노동기준감독서 · 영사관 상담용" : "Fair Work · 영사관 상담용") : `${scenario.counterpart.name} (${scenario.counterpart.role})`}
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, padding: "10px 14px", borderBottom: "1px solid #dadad6", fontSize: 13 }}>
            <span className="faint" style={{ width: 44 }}>제목</span>
            <span style={{ fontWeight: 600 }}>{subject || "…"}</span>
          </div>
          <div style={{ padding: 14, fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap", minHeight: 180 }} lang={lang === "local" ? COUNTRIES[country].lang : "ko"}>
            {draft ? body : error ? null : <Spinner label="메시지를 다듬는 중…" />}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 14px 12px" }}>
            <span className="small faint">{lang === "ko" ? `한국어는 내용 확인용이에요. 보낼 땐 ${COUNTRIES[country].langLabel}로.` : "숫자는 계산 결과 그대로 들어가요"}</span>
            <ModeBadge mode={draft?.mode} />
          </div>
        </div>

        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        {stage === "harmed" && (
          <section>
            <div className="section-head">
              <span className="h2">지금 모아 둘 증거</span>
              <span className="small faint">이 기기에만 체크돼요</span>
            </div>
            {(country === "JP"
              ? ["회사 이름·주소·담당자", "출퇴근 날짜·시간 기록 (메모·사진도 좋아요)", "급여명세서·통장 입금 내역", "근로계약서·근로조건통지서·구인 광고", "점장과 주고받은 메시지 캡처"]
              : ["고용주 이름·사업자번호(ABN)·주소", "근무 날짜·시간 기록 (메모·사진도 좋아요)", "급여명세서·통장 입금 내역", "근로계약서·구인 광고", "고용주와 주고받은 메시지 캡처"]
            ).map((t) => (
              <label key={t} className="row" style={{ cursor: "pointer", minHeight: 44 }}>
                <input type="checkbox" style={{ width: 18, height: 18, accentColor: "#111" }} />
                <span style={{ fontSize: 14 }}>{t}</span>
              </label>
            ))}
          </section>
        )}

        <section>
          <div className="section-head">
            <span className="h2">{stage === "harmed" ? "상담할 곳" : "해결이 안 되면"}</span>
            <span className="small faint">{CITIES[profile.city].label} 기준</span>
          </div>
          {helpFor(scenario.messageKind, country, CITIES[profile.city].region).map((h) => (
            <a key={h.name} href={h.url} target="_blank" rel="noreferrer" className="row">
              <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{h.name}</span>
                <span className="small muted">{h.desc}</span>
              </span>
              <IconExternal />
            </a>
          ))}
        </section>

        <Link href="/share" className="card-wash" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="small muted">같은 일을 겪을 다음 사람을 위해</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              <span className="hl">익명으로 알리기</span>
            </span>
          </span>
          <IconChevron />
        </Link>
      </div>

      <div className="actions">
        <a className="btn outline" href={draft ? `mailto:?subject=${encodeURIComponent(draft.subjectLocal)}&body=${encodeURIComponent(draft.bodyLocal)}` : undefined} aria-disabled={!draft}>
          이메일 앱으로
        </a>
        <button className="btn grow" onClick={copy} disabled={!draft}>
          <IconCopy color="#fff" />
          {copied ? "복사했어요" : `${COUNTRIES[country].langLabel} 메시지 복사`}
        </button>
      </div>
    </main>
  );
}
