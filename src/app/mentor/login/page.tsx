"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconCheck } from "@/components/icons";
import { COUNTRIES } from "@/lib/kb/countries";
import { CERT_GOAL, getMentor, setMentor } from "@/lib/mentorSession";
import type { Country } from "@/lib/types";

const MAJORS = ["영어·영문학", "일본어·일본학", "법학", "국제학·통번역", "기타 (해외 거주 경험)"];

const PERKS = [
  `답변 ${CERT_GOAL}건마다 Global-In 멘토 활동 인증서`,
  "대학 봉사시간·비교과 인정 연계 (협약 대학)",
  "우수 멘토 활동비 · 서포터즈 추천서",
  "AI가 질문을 정리하고 답변 초안까지 준비 — 확인하고 다듬기만",
];

export default function MentorLogin() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [major, setMajor] = useState(MAJORS[2]);
  const [country, setCountry] = useState<Country>("AU");
  const [experience, setExperience] = useState("");
  const [pledge, setPledge] = useState(false);

  useEffect(() => {
    if (getMentor()) router.replace("/mentor");
  }, [router]);

  const fillExample = () => {
    setName("멘토 지민");
    setMajor(MAJORS[1]);
    setCountry("JP");
    setExperience("도쿄 교환학생 1년");
    setPledge(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMentor({
      name: name.trim() || "멘토",
      major: experience.trim() ? `${major} · ${experience.trim()}` : major,
      country,
      experience: experience.trim() || undefined,
      answered: 0,
      at: new Date().toISOString(),
    });
    router.push("/mentor");
  };

  return (
    <main className="phone">
      <form onSubmit={submit} className="screen" style={{ gap: 18 }}>
        <div className="topbar" style={{ justifyContent: "space-between" }}>
          <Link href="/" className="wordmark">
            Global-In
          </Link>
          <span className="tag-caution">데모 · 인증 없음</span>
        </div>

        <h1 className="display h1">
          해외 첫 달을 지켜 줄
          <br />
          <span className="hl">멘토 서포터즈</span>
        </h1>
        <p className="body" style={{ margin: 0 }}>
          외국어·법학을 공부하는 대학생이 해외로 나간 청년의 익명 질문에 답해요. AI가 질문을 정리하고 근거와 초안을 붙여 주니까, 확인하고 다듬어서 보내기만 하면 돼요.
        </p>

        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {PERKS.map((p) => (
            <li key={p} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14 }}>
              <IconCheck size={16} /> {p}
            </li>
          ))}
        </ul>

        <label className="field">
          활동명
          <input className="input" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder="예: 멘토 지민" />
        </label>
        <label className="field">
          전공
          <select className="input" value={major} onChange={(e) => setMajor(e.target.value)}>
            {MAJORS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
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
        <label className="field">
          해외 경험 (선택)
          <input className="input" value={experience} maxLength={40} onChange={(e) => setExperience(e.target.value)} placeholder="예: 시드니 워홀 1년" />
        </label>
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.5, cursor: "pointer" }}>
          <input type="checkbox" checked={pledge} onChange={(e) => setPledge(e.target.checked)} style={{ width: 20, height: 20, accentColor: "#111", flexShrink: 0 }} />
          답변은 법률 자문이 아니라 공부와 경험을 나누는 안내이고, 필요하면 공식 상담 창구를 함께 안내할게요. 질문자의 정보는 밖으로 옮기지 않을게요.
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn outline" onClick={fillExample} style={{ flex: 1 }}>
            예시로 채우기
          </button>
          <button type="submit" className="btn" disabled={!pledge} style={{ flex: 1.4 }}>
            멘토로 시작하기
          </button>
        </div>
        <span className="small faint">데모라서 아무 값이나 넣어도 돼요. 실서비스에서는 재학·전공 확인 후 활동해요.</span>
      </form>
    </main>
  );
}
