"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconCamera, IconChevron, IconPaste } from "@/components/icons";
import { ModeBadge, Spinner, TabBar, TopBar, useProfile } from "@/components/ui";
import { downscaleImage } from "@/lib/image";
import { DOC_TYPE_LABEL } from "@/lib/personas";
import { samplesFor, type SampleDoc } from "@/lib/samples";
import { updateCase } from "@/lib/store";
import type { AnalysisResult, DocType } from "@/lib/types";

type Tab = "photo" | "text" | "sample";

export default function Scan() {
  const profile = useProfile();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("sample");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [docType, setDocType] = useState<DocType | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"ai" | "offline">();

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setMode(d.mode))
      .catch(() => setMode("offline"));
  }, []);

  if (!profile) return <main className="phone" />;
  const samples = samplesFor(profile.persona);

  const analyze = async (payload: { text?: string; imageDataUrl?: string; docType?: DocType; title?: string }) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: profile.persona, city: profile.city, ...payload }),
      });
      const data = (await res.json()) as AnalysisResult & { text: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "분석에 실패했어요.");
      updateCase({ analysis: data, wage: undefined, rehearsal: undefined, scenarioId: undefined, shared: false });
      router.push("/result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석에 실패했어요.");
      setBusy(false);
    }
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    try {
      setImage(await downscaleImage(file));
    } catch {
      setError("사진을 불러오지 못했어요. 다른 사진으로 해 주세요.");
    }
  };

  const pickSample = (s: SampleDoc) => analyze({ text: s.text, docType: s.docType, title: s.title });

  return (
    <main className="phone">
      <div className="screen with-tabs">
        <TopBar title="서류 확인" right={<ModeBadge mode={mode} />} />

        <h1 className="display h1">
          어떤 서류를
          <br />
          <span className="hl">확인할까요?</span>
        </h1>

        <div className="seg" role="group" aria-label="서류 넣는 방법" style={{ alignSelf: "flex-start" }}>
          {(
            [
              ["sample", "예시 서류"],
              ["photo", "사진"],
              ["text", "글자 붙여넣기"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>

        {tab === "sample" && (
          <section style={{ display: "flex", flexDirection: "column" }}>
            <div className="section-head">
              <span className="h2">시연용 예시 서류</span>
              <span className="small faint">가상의 사업장</span>
            </div>
            {samples.map((s) => (
              <button
                key={s.id}
                className="row"
                onClick={() => pickSample(s)}
                disabled={busy}
                style={{ background: "none", border: 0, borderBottom: "1px solid #dadad6", textAlign: "left", cursor: "pointer", width: "100%" }}
              >
                <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{s.title}</span>
                  <span className="small faint">
                    {DOC_TYPE_LABEL[s.docType]} · {s.language}
                  </span>
                </span>
                <IconChevron />
              </button>
            ))}
          </section>
        )}

        {tab === "photo" && (
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label="서류 사진 선택" />
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="선택한 서류 사진" style={{ width: "100%", maxHeight: 320, objectFit: "contain", background: "#f4f4f2", borderRadius: 8 }} />
            ) : (
              <button className="card-wash" onClick={() => fileRef.current?.click()} style={{ border: "1.5px dashed #111", minHeight: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
                <IconCamera size={28} />
                <span style={{ fontSize: 15, fontWeight: 600 }}>서류 촬영 또는 사진 선택</span>
                <span className="small muted">글자가 잘 보이게 밝은 곳에서 찍어 주세요</span>
              </button>
            )}
            {image && (
              <button className="btn outline sm" onClick={() => fileRef.current?.click()}>
                다른 사진 고르기
              </button>
            )}
            {mode === "offline" && <div className="notice">지금은 오프라인 모드라 사진 판독이 꺼져 있어요. 예시 서류나 글자 붙여넣기로 확인해 보세요.</div>}
          </section>
        )}

        {tab === "text" && (
          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label className="field">
              서류 내용
              <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="계약서·문자·광고 내용을 그대로 붙여넣어 주세요" />
            </label>
            <span className="small muted" style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <IconPaste size={16} /> 이름·연락처는 지우고 붙여넣어도 돼요
            </span>
          </section>
        )}

        {tab !== "sample" && (
          <label className="field">
            서류 종류
            <select className="input" value={docType} onChange={(e) => setDocType(e.target.value as DocType | "")}>
              <option value="">자동으로 알아내기</option>
              {(Object.keys(DOC_TYPE_LABEL) as DocType[]).map((d) => (
                <option key={d} value={d}>
                  {DOC_TYPE_LABEL[d]}
                </option>
              ))}
            </select>
          </label>
        )}

        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        {tab !== "sample" && (
          <button
            className="btn block"
            disabled={busy || (tab === "photo" ? !image || mode === "offline" : text.trim().length < 20)}
            onClick={() => analyze(tab === "photo" ? { imageDataUrl: image!, docType: docType || undefined } : { text, docType: docType || undefined })}
          >
            {busy ? <Spinner label="한국 기준으로 읽는 중…" /> : "분석하기"}
          </button>
        )}
        {busy && tab === "sample" && (
          <div className="notice">
            <Spinner label="한국 기준으로 읽는 중…" />
          </div>
        )}
      </div>
      <TabBar persona={profile.persona} />
    </main>
  );
}
