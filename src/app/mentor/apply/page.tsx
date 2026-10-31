"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconCheck, IconLock, IconUpload } from "@/components/icons";
import { Spinner } from "@/components/ui";
import { COUNTRIES } from "@/lib/kb/countries";
import { CERT_GOAL, getMentor, setMentor } from "@/lib/mentorSession";
import type { Country } from "@/lib/types";

const STATUS_OPTIONS = [
  ["undergrad", "대학(원) 재학"],
  ["graduate", "졸업"],
  ["worker", "직장인"],
  ["other", "구직·기타"],
] as const;

const PERKS = [
  `답변 ${CERT_GOAL}건마다 Global-In 서포터즈 활동 인증서`,
  "대학 봉사시간·비교과 인정 연계 (협약 기관)",
  "우수 서포터즈 활동비 · 추천서",
  "외국어·법학을 실제 고민 해결에 쓰는 경험",
];

export default function MentorApply() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number][0]>("undergrad");
  const [field, setField] = useState("");
  const [languages, setLanguages] = useState("");
  const [experience, setExperience] = useState("");
  const [country, setCountry] = useState<Country>("AU");
  const [file, setFile] = useState<{ fileName: string; size: number; type: string } | null>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getMentor()) router.replace("/mentor");
  }, [router]);

  const fillExample = () => {
    setName("김지민");
    setNickname("서포터 지민");
    setBirthYear("2000");
    setStatus("graduate");
    setField("일본어·일본학");
    setLanguages("JLPT N1");
    setExperience("도쿄 워홀 1년");
    setCountry("JP");
    setFile({ fileName: "졸업증명서_예시.pdf", size: 120_000, type: "application/pdf" });
    setAgree(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/mentors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, nickname, birthYear: Number(birthYear), status, field, languages, experience, country, certificate: file }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMentor({ id: d.id, token: d.token, nickname, country });
      router.push("/mentor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "신청하지 못했어요.");
      setBusy(false);
    }
  };

  return (
    <main className="phone">
      <form onSubmit={submit} className="screen" style={{ gap: 18 }}>
        <div className="topbar" style={{ justifyContent: "space-between" }}>
          <Link href="/" className="wordmark">
            Global-In
          </Link>
          <span className="tag-caution">데모</span>
        </div>

        <h1 className="display h1">
          해외 첫 달을 지켜 줄
          <br />
          <span className="hl">서포터즈 모집</span>
        </h1>
        <p className="body" style={{ margin: 0 }}>
          외국어·법학을 공부했거나 해외에서 살아 본 <b style={{ color: "#111" }}>만 19~34세 청년이면 누구나</b> 신청할 수 있어요. 대학생이 아니어도 괜찮아요. 관리기관이 증빙을 확인하고 승인하면 활동을 시작해요.
        </p>

        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {PERKS.map((p) => (
            <li key={p} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14 }}>
              <IconCheck size={16} /> {p}
            </li>
          ))}
        </ul>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <label className="field">
            이름 (실명)
            <input className="input" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            활동명
            <input className="input" value={nickname} maxLength={20} onChange={(e) => setNickname(e.target.value)} placeholder="예: 서포터 지민" />
          </label>
          <label className="field">
            출생연도
            <input className="input mono" inputMode="numeric" value={birthYear} maxLength={4} onChange={(e) => setBirthYear(e.target.value)} placeholder="예: 2000" />
          </label>
          <label className="field">
            지금 상태
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              {STATUS_OPTIONS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          전공·관련 분야
          <input className="input" value={field} maxLength={60} onChange={(e) => setField(e.target.value)} placeholder="예: 법학, 일본어·일본학, 통번역" />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <label className="field">
            외국어 능력 (선택)
            <input className="input" value={languages} maxLength={80} onChange={(e) => setLanguages(e.target.value)} placeholder="예: IELTS 7.0" />
          </label>
          <label className="field">
            해외 경험 (선택)
            <input className="input" value={experience} maxLength={60} onChange={(e) => setExperience(e.target.value)} placeholder="예: 시드니 워홀 1년" />
          </label>
        </div>
        <div className="field">
          답변할 국가
          <div className="seg" role="group" aria-label="답변할 국가" style={{ alignSelf: "flex-start" }}>
            {(Object.keys(COUNTRIES) as Country[]).map((k) => (
              <button key={k} type="button" aria-pressed={country === k} onClick={() => setCountry(k)}>
                {COUNTRIES[k].label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          증빙 서류 (재학·졸업증명서, 재직증명서 등)
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            aria-label="증빙 서류 선택"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFile({ fileName: f.name, size: f.size, type: f.type });
            }}
          />
          <button type="button" className="btn outline sm" onClick={() => fileRef.current?.click()} style={{ justifyContent: "flex-start" }}>
            <IconUpload size={18} /> {file ? `${file.fileName} (${Math.round(file.size / 1000)}KB)` : "파일 선택"}
          </button>
          <span className="notice" style={{ fontWeight: 400, display: "flex", gap: 6 }}>
            <IconLock size={15} />
            <span>데모에서는 파일을 저장하지 않고 파일 이름만 기록해요. 실제 증명서는 올리지 마세요. 실서비스에서는 관리기관만 볼 수 있게 보관하고, 심사가 끝나면 30일 안에 파기해요.</span>
          </span>
        </div>

        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.5, cursor: "pointer" }}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ width: 20, height: 20, accentColor: "#111", flexShrink: 0 }} />
          심사를 위한 개인정보 수집·이용에 동의해요. 답변은 법률 자문이 아니라 공부와 경험을 나누는 안내이고, 필요하면 공식 상담 창구를 함께 안내할게요. 질문자의 정보는 밖으로 옮기지 않을게요.
        </label>

        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn outline" onClick={fillExample} style={{ flex: 1 }}>
            예시로 채우기
          </button>
          <button type="submit" className="btn" disabled={!agree || busy} style={{ flex: 1.4 }}>
            {busy ? <Spinner /> : "신청하기"}
          </button>
        </div>
        <span className="small faint">이미 신청했다면 이 기기에서 자동으로 심사 상태 화면으로 이동해요.</span>
      </form>
    </main>
  );
}
