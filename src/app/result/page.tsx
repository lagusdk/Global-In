"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { IconDown, IconExternal } from "@/components/icons";
import { LevelTag, ModeBadge, TopBar, useProfile } from "@/components/ui";
import { hasWageIssue, scenarioFor } from "@/lib/caseFlow";
import { getCase, updateCase, type CaseState } from "@/lib/store";
import type { Finding } from "@/lib/types";

/** 원문에서 인용된 문장에 형광펜과 번호를 붙인다. */
function DocExcerpt({ text, findings }: { text: string; findings: Finding[] }) {
  const lines = text.split("\n").filter((l) => l.trim());
  const numbered = findings.map((f, i) => ({ n: i + 1, quote: f.quote?.replace(/…$/, "").trim() })).filter((q) => q.quote && q.quote.length > 4);
  return (
    <div className="mono" style={{ background: "#f4f4f2", borderRadius: 6, padding: "14px 14px 14px 10px", fontSize: 12, lineHeight: 1.75, color: "#333331", display: "flex", flexDirection: "column", gap: 2, maxHeight: 260, overflow: "auto" }}>
      {lines.map((line, i) => {
        const hit = numbered.find((q) => line.replace(/\s+/g, " ").includes(q.quote!) || q.quote!.includes(line.trim()));
        if (!hit) return <span key={i} style={{ paddingLeft: 26 }}>{line}</span>;
        const norm = line.replace(/\s+/g, " ");
        const at = norm.indexOf(hit.quote!);
        return (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            <span className="num-dot" style={{ marginTop: 2 }}>{hit.n}</span>
            {at >= 0 ? (
              <span>
                {norm.slice(0, at)}
                <span className="mark">{hit.quote}</span>
                {norm.slice(at + hit.quote!.length)}
              </span>
            ) : (
              <span className="mark">{line}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FindingRow({ f, n, open, onToggle }: { f: Finding; n: number; open: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderTop: n === 1 ? "1.5px solid #111" : "1px solid #dadad6" }}>
      <button onClick={onToggle} aria-expanded={open} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "13px 0", background: "none", border: 0, cursor: "pointer", textAlign: "left" }}>
        <span className="num-dot">{n}</span>
        <LevelTag level={f.level} />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{f.title}</span>
        <span style={{ transform: open ? "rotate(180deg)" : "none", display: "inline-flex" }}>
          <IconDown />
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 0 14px 28px", display: "flex", flexDirection: "column", gap: 8 }}>
          {f.quote && (
            <span className="mono small muted" style={{ background: "#f4f4f2", borderRadius: 6, padding: "6px 8px" }}>
              “{f.quote}”
            </span>
          )}
          <span className="body" style={{ fontSize: 13 }}>{f.explanation}</span>
          {f.korea && (
            <span className="body" style={{ fontSize: 13 }}>
              <b style={{ color: "#111" }}>한국으로 치면</b> {f.korea.replace(/^한국으로 치면\s*/, "")}
            </span>
          )}
          {f.action && (
            <span className="body" style={{ fontSize: 13 }}>
              <b style={{ color: "#111" }}>할 일</b> {f.action}
            </span>
          )}
          <span className="small faint" style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            근거 ·{" "}
            {f.source?.url ? (
              <a href={f.source.url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 2 }}>
                {f.source.name} <IconExternal size={12} />
              </a>
            ) : f.source ? (
              f.source.name
            ) : (
              "AI 의견 (공식 근거 없음 — 참고만 하세요)"
            )}
            {f.origin === "both" && <span> · 규칙 엔진·AI 모두 확인</span>}
          </span>
        </div>
      )}
    </div>
  );
}

export default function Result() {
  const profile = useProfile();
  const router = useRouter();
  const [c, setC] = useState<CaseState | null>(null);
  const [open, setOpen] = useState<number>(0);

  useEffect(() => {
    const cs = getCase();
    if (!cs.analysis) router.replace("/scan");
    else setC(cs);
  }, [router]);

  if (!profile || !c?.analysis) return <main className="phone" />;
  const a = c.analysis;
  const counts = { risk: 0, caution: 0, info: 0 };
  a.findings.forEach((f) => counts[f.level]++);
  const scenarioId = scenarioFor(profile.persona, a, profile.country ?? "AU");
  const wage = profile.persona !== "worker" && hasWageIssue(a);
  const goRehearse = () => {
    updateCase({ scenarioId, rehearsal: undefined });
    router.push("/rehearse");
  };

  return (
    <main className="phone">
      <div className="screen with-actions" style={{ gap: 14 }}>
        <TopBar title={a.docTitle} back="/scan" right={<ModeBadge mode={a.mode} />} />

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <span className="display" style={{ fontSize: 28 }}>짚어볼 곳 {a.findings.length}</span>
          <span className="muted" style={{ fontSize: 13 }}>
            <b style={{ color: "#c42b1c" }}>위험 {counts.risk}</b> · 주의 {counts.caution} · 확인 {counts.info}
          </span>
        </div>

        {a.notice && <div className="notice">{a.notice}</div>}

        <div className="card-wash" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{a.summary}</span>
          <span className="body" style={{ fontSize: 13 }}>
            <b style={{ color: "#111" }}>한국으로 치면</b> {a.koreaSummary.replace(/^한국으로 치면\s*/, "")}
          </span>
        </div>

        {a.text && <DocExcerpt text={a.text} findings={a.findings} />}

        <section>
          {a.findings.map((f, i) => (
            <Fragment key={(f.ruleId ?? f.title) + i}>
              <FindingRow f={f} n={i + 1} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
            </Fragment>
          ))}
          {a.okItems.length > 0 && (
            <details style={{ borderTop: "1px solid #dadad6", padding: "12px 0" }}>
              <summary className="muted" style={{ fontSize: 13, cursor: "pointer" }}>
                괜찮은 조항 {a.okItems.length}건 보기
              </summary>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }} className="body">
                {a.okItems.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </details>
          )}
        </section>

        <p className="small faint" style={{ margin: 0, lineHeight: 1.5 }}>
          Global-In은 법률 자문이 아니라 확인을 돕는 도구예요. 중요한 결정 전에는 Fair Work Ombudsman 같은 공식 기관에 확인하세요.
        </p>

        <Link href="/share" className="small" style={{ textDecoration: "underline", alignSelf: "flex-start" }}>
          비슷한 일을 겪을 다음 사람을 위해 익명으로 알리기
        </Link>
      </div>

      <div className="actions">
        <button className="btn outline" onClick={goRehearse}>
          말하기 연습
        </button>
        {wage ? (
          <Link href="/pay" className="btn grow">
            급여 계산하기
          </Link>
        ) : (
          <Link href="/send" className="btn grow" onClick={() => updateCase({ scenarioId })}>
            보낼 메시지 만들기
          </Link>
        )}
      </div>
    </main>
  );
}
