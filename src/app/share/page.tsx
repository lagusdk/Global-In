"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconCheck } from "@/components/icons";
import { Spinner, TopBar, useProfile } from "@/components/ui";
import { ISSUE_LABEL } from "@/lib/caseFlow";
import { CITIES } from "@/lib/kb/au";
import { PERSONAS } from "@/lib/personas";
import { getCase, updateCase } from "@/lib/store";

type Item = { key: string; label: string; value: string; on: boolean };

export default function Share() {
  const profile = useProfile();
  const [items, setItems] = useState<Item[]>([]);
  const [issues, setIssues] = useState<{ label: string; on: boolean }[]>([]);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    if (!profile) return;
    const c = getCase();
    const pack = PERSONAS[profile.persona];
    setItems([
      { key: "city", label: "지역", value: CITIES[profile.city].label, on: true },
      { key: "industry", label: "업종", value: pack.industry[profile.country ?? "AU"], on: true },
      { key: "visa", label: "비자 종류", value: pack.visaLabel[profile.country ?? "AU"], on: false },
    ]);
    const found = [...new Set((c.analysis?.findings ?? []).map((f) => (f.ruleId ? ISSUE_LABEL[f.ruleId] : undefined)).filter((x): x is string => Boolean(x)))];
    setIssues(found.map((label) => ({ label, on: true })));
    if (c.shared) setState("done");
  }, [profile]);

  if (!profile) return <main className="phone" />;
  const toggle = (k: string) => setItems((xs) => xs.map((x) => (x.key === k ? { ...x, on: !x.on } : x)));
  const chosenIssues = issues.filter((i) => i.on).map((i) => i.label);
  const cityOn = items.find((i) => i.key === "city")?.on;

  const submit = async () => {
    setState("sending");
    const pick = (k: string) => items.find((i) => i.key === k && i.on)?.value;
    try {
      const res = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: profile.city, industry: pick("industry"), visa: pick("visa"), issues: chosenIssues, persona: profile.persona }),
      });
      if (!res.ok) throw new Error();
      updateCase({ shared: true });
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <main className="phone">
      <div className="screen with-actions" style={{ gap: 16 }}>
        <TopBar title="익명으로 알리기" back="" />

        <h1 className="display" style={{ fontSize: 27, lineHeight: 1.28 }}>
          비슷한 어려움,
          <br />
          <span className="hl">혼자만 겪은 게</span>
          <br />
          아닐 수 있어요
        </h1>
        <p className="body" style={{ margin: 0 }}>
          버튼을 누르면 어떤 부분이 어려웠는지만 익명으로 모여요. 모인 신호는 같은 지역·업종에 있는 사람들에게 경고로 전해지고, 대학 국제처와 재외공관이 출국 전 교육과 안내를 고치는 데 쓰여요.
        </p>

        <section>
          <div className="section-head">
            <span className="h2">어려웠던 점</span>
            <span className="small faint">서류 확인 결과에서 가져왔어요</span>
          </div>
          {issues.length === 0 && <div className="row small muted">서류를 먼저 확인하면 여기에 채워져요.</div>}
          {issues.map((i) => (
            <label key={i.label} className="row" style={{ cursor: "pointer", minHeight: 46 }}>
              <input type="checkbox" checked={i.on} onChange={() => setIssues((xs) => xs.map((x) => (x.label === i.label ? { ...x, on: !x.on } : x)))} style={{ width: 20, height: 20, accentColor: "#111" }} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{i.label}</span>
            </label>
          ))}
        </section>

        <section>
          <div className="section-head">
            <span className="h2">함께 보내는 정보</span>
            <span className="small faint">직접 고를 수 있어요</span>
          </div>
          {items.map((i) => (
            <label key={i.key} className="row" style={{ cursor: "pointer", minHeight: 46 }}>
              <input type="checkbox" checked={i.on} onChange={() => toggle(i.key)} style={{ width: 20, height: 20, accentColor: "#111" }} disabled={i.key === "city"} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>
                {i.label}
                {i.key === "city" && <span className="small faint"> (필수)</span>}
              </span>
              <span className="mono small muted">{i.value}</span>
            </label>
          ))}
        </section>

        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="h2">절대 보내지 않는 정보</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "6px 12px", fontSize: 13, color: "#333331" }}>
            {["이름 · 연락처", "사업장 이름", "서류 사진 · 원문", "정확한 위치"].map((t) => (
              <span key={t} style={{ textDecoration: "line-through", textDecorationColor: "#c42b1c" }}>
                {t}
              </span>
            ))}
          </div>
          <span className="small muted">같은 지역 제보가 5건 미만이면 지도에 표시하지 않아요.</span>
        </section>
      </div>

      <div className="actions" style={{ flexDirection: "column", gap: 8 }}>
        {state === "done" ? (
          <div style={{ background: "#ffe14d", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }} role="status">
            <IconCheck />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, lineHeight: 1.45 }}>고마워요. {CITIES[profile.city].label} 경고에 반영됐어요.</span>
            <Link href="/home" style={{ fontSize: 13, fontWeight: 700, borderBottom: "1.5px solid #111" }}>
              홈
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/home" className="btn outline" style={{ flex: 1 }}>
              이번엔 안 할게요
            </Link>
            <button className="btn" style={{ flex: 1.4 }} onClick={submit} disabled={!cityOn || chosenIssues.length === 0 || state === "sending"}>
              {state === "sending" ? <Spinner /> : "익명으로 알리기"}
            </button>
          </div>
        )}
        {state === "error" && <span className="small" style={{ color: "#8f1d14", textAlign: "center" }}>보내지 못했어요. 다시 시도해 주세요.</span>}
        <span className="small muted" style={{ textAlign: "center" }}>
          데모에서는 서버 메모리에만 쌓이고, 서버가 다시 시작되면 사라져요
        </span>
      </div>
    </main>
  );
}
