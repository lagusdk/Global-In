"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@/components/ui";
import { APPLICANT_STATUS_LABEL, type ApplicationView } from "@/lib/applicationShared";
import { COUNTRIES } from "@/lib/kb/countries";

/** 관리기관 서포터즈 심사 (데모: 인증 없음) */
export default function Admin() {
  const [apps, setApps] = useState<ApplicationView[] | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/applications");
    setApps((await res.json()).applications);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id: string, state: "approved" | "rejected") => {
    setBusy(id);
    await fetch("/api/admin/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, state, reason: reasons[id], by: "Global-In 서포터즈 운영기관 (데모)" }),
    });
    setBusy(null);
    load();
  };

  const year = new Date().getFullYear();
  const pending = (apps ?? []).filter((a) => a.review.state === "pending");
  const decided = (apps ?? []).filter((a) => a.review.state !== "pending");

  return (
    <main className="org">
      <div className="org-inner" style={{ maxWidth: 880 }}>
        <header style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 12, paddingBottom: 16, borderBottom: "1.5px solid #111" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Link href="/" className="wordmark" style={{ fontSize: 18 }}>
                Global-In
              </Link>
              <span className="tag-caution">데모 · 인증 없음</span>
            </span>
            <h1 className="display" style={{ fontSize: 30 }}>
              서포터즈 신청 심사
            </h1>
          </div>
          <span className="small muted">기준: 만 19~34세 · 증빙(재학·졸업·재직증명서 등) 확인 · 답변 국가 적합성</span>
        </header>

        {!apps ? (
          <Spinner label="불러오는 중…" />
        ) : (
          <>
            <section>
              <div className="section-head">
                <h2 className="h2" style={{ fontSize: 18 }}>
                  심사 대기 {pending.length}
                </h2>
              </div>
              {pending.length === 0 && <div className="row small muted">기다리는 신청서가 없어요.</div>}
              {pending.map((a) => (
                <article key={a.id} style={{ borderBottom: "1px solid #dadad6", padding: "16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>
                      {a.name} <span className="muted" style={{ fontWeight: 500 }}>({a.nickname})</span>
                    </span>
                    <span className="small faint">{new Date(a.createdAt).toLocaleString("ko-KR")}</span>
                  </div>
                  <div className="card-wash" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "6px 16px", fontSize: 13 }}>
                    <span>
                      나이 <b>만 {year - a.birthYear}세</b> ({a.birthYear}년생)
                    </span>
                    <span>
                      상태 <b>{APPLICANT_STATUS_LABEL[a.status]}</b>
                    </span>
                    <span>
                      분야 <b>{a.field}</b>
                    </span>
                    <span>
                      외국어 <b>{a.languages || "—"}</b>
                    </span>
                    <span>
                      해외 경험 <b>{a.experience || "—"}</b>
                    </span>
                    <span>
                      답변 국가 <b>{COUNTRIES[a.country].label}</b>
                    </span>
                    <span>
                      증빙 <b>{a.certificate.fileName}</b> ({Math.round(a.certificate.size / 1000)}KB)
                    </span>
                  </div>
                  <span className="small faint">데모에서는 증빙 파일을 저장하지 않아 이름만 보여요. 실서비스에서는 이 화면에서 원본을 열람하고, 심사 후 30일 안에 파기해요.</span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <label className="sr-only" htmlFor={`r-${a.id}`}>
                      반려 사유
                    </label>
                    <input id={`r-${a.id}`} className="input" style={{ flex: "1 1 220px", height: 44 }} placeholder="반려 사유 (반려할 때만)" value={reasons[a.id] ?? ""} onChange={(e) => setReasons((r) => ({ ...r, [a.id]: e.target.value }))} />
                    <button className="btn outline sm" disabled={busy === a.id} onClick={() => decide(a.id, "rejected")}>
                      반려
                    </button>
                    <button className="btn sm" disabled={busy === a.id} onClick={() => decide(a.id, "approved")}>
                      {busy === a.id ? <Spinner /> : "승인"}
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <section>
              <div className="section-head">
                <h2 className="h2" style={{ fontSize: 18 }}>
                  심사 완료 {decided.length}
                </h2>
              </div>
              {decided.map((a) => (
                <div key={a.id} className="row" style={{ justifyContent: "space-between", fontSize: 14 }}>
                  <span>
                    <b>{a.nickname}</b> · {a.field} · {COUNTRIES[a.country].label}
                    {a.review.reason ? <span className="muted"> — {a.review.reason}</span> : null}
                  </span>
                  {a.review.state === "approved" ? <span className="tag-ok">승인 · 답변 {a.answered}건</span> : <span className="stamp-risk">반려</span>}
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
