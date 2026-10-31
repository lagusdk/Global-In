"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconCamera, IconChevron, IconLock, IconPaste } from "@/components/icons";
import { ModeBadge, Spinner, TabBar, TopBar, useProfile } from "@/components/ui";
import { downscaleImage } from "@/lib/image";
import { DOC_TYPE_LABEL } from "@/lib/personas";
import { samplesFor, type SampleDoc } from "@/lib/samples";
import { getCase, updateCase, type Stage } from "@/lib/store";
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
  const [stage, setStage] = useState<Stage>("before");

  useEffect(() => setStage(getCase().stage ?? "before"), []);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setMode(d.mode))
      .catch(() => setMode("offline"));
  }, []);

  if (!profile) return <main className="phone" />;
  const samples = samplesFor(profile.persona, profile.country ?? "AU");

  const analyze = async (payload: { text?: string; imageDataUrl?: string; docType?: DocType; title?: string }) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 학생비자를 고른 경우에만 학생 근무시간 한도를 적용한다.
        body: JSON.stringify({ persona: profile.visa === "student" ? "student" : profile.persona === "student" && profile.visa ? "jobseeker" : profile.persona, city: profile.city, ...payload }),
      });
      const data = (await res.json()) as AnalysisResult & { text: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "분석에 실패했어요.");
      updateCase({ analysis: data, wage: undefined, rehearsal: undefined, scenarioId: undefined, shared: false, stage });
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

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="h2">지금 어떤 상황이에요?</span>
          <div className="seg" role="group" aria-label="지금 상황" style={{ alignSelf: "flex-start", flexWrap: "wrap" }}>
            {(
              [
                ["before", "서명 전"],
                ["working", "일하는 중"],
                ["harmed", "이미 피해를 봤어요"],
              ] as [Stage, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                aria-pressed={stage === id}
                onClick={() => {
                  setStage(id);
                  updateCase({ stage: id });
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="small faint">
            {stage === "before" ? "서명 전에 고칠 조항과 물어볼 질문을 정리해 드려요." : stage === "working" ? "받은 돈과 근무 기록을 기준과 맞춰 보고, 정산 요청을 도와드려요." : "증거를 정리하고, 공식 상담기관에 낼 요약을 만들어 드려요."}
          </span>
        </div>

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
              <IconPaste size={16} /> 계약서·문자·광고를 그대로 붙여넣되, 개인정보는 지워 주세요
            </span>
          </section>
        )}

        {tab !== "sample" && (
          <div className="card-wash" role="note" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, lineHeight: 1.55 }}>
            <span style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <IconLock size={15} /> 보내기 전에 확인하세요
            </span>
            <span className="muted">· 사진·글은 분석을 위해 Global-In 서버를 거쳐 AI(NVIDIA API)로 전송돼요. 오프라인 모드에서는 서버의 규칙 엔진만 써요.</span>
            <span className="muted">· Global-In 서버에는 저장하지 않고, 분석 결과는 이 기기에만 남아요. AI 업체의 처리 방식은 NVIDIA 정책을 따라요.</span>
            <span className="muted">
              · <b style={{ color: "#111" }}>이름·주소·계좌번호·연락처·여권번호</b>는 가리거나 지운 뒤 올려 주세요. 사진은 펜으로 가리거나 잘라 내면 돼요.
            </span>
          </div>
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
            {busy ? <Spinner label="현지 기준으로 확인하는 중…" /> : "분석하기"}
          </button>
        )}
        {busy && tab === "sample" && (
          <div className="notice">
            <Spinner label="현지 기준으로 확인하는 중…" />
          </div>
        )}
      </div>
      <TabBar persona={profile.persona} />
    </main>
  );
}
