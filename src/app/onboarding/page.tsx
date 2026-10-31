"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CITIES } from "@/lib/kb/au";
import { PERSONA_LIST } from "@/lib/personas";
import { getProfile, setProfile, updateCase } from "@/lib/store";
import type { CityId, PersonaId } from "@/lib/types";

const COMING = ["일본", "캐나다", "영국", "뉴질랜드"];

function today(offsetDays = 0) {
  const d = new Date(Date.now() - offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export default function Onboarding() {
  const router = useRouter();
  const [persona, setPersona] = useState<PersonaId>("jobseeker");
  const [city, setCity] = useState<CityId>("brisbane");
  const [arrival, setArrival] = useState(today(12));
  const [name, setName] = useState("");

  useEffect(() => {
    const p = getProfile();
    if (p) {
      setPersona(p.persona);
      setCity(p.city);
      setArrival(p.arrival);
      setName(p.name ?? "");
    }
  }, []);

  const start = () => {
    const prev = getProfile();
    setProfile({ persona, country: "AU", city, arrival, name: name.trim() || undefined });
    // 대상이 바뀌면 이전 사례 기록은 지운다.
    if (prev && prev.persona !== persona) updateCase({ analysis: undefined, wage: undefined, scenarioId: undefined, rehearsal: undefined, shared: false, doneTodos: [] });
    router.push("/home");
  };

  return (
    <main className="phone">
      <div className="screen with-actions" style={{ gap: 20 }}>
        <div className="topbar" style={{ justifyContent: "space-between" }}>
          <span className="wordmark">Global-In</span>
          <span className="mono small muted">호주 · 베타</span>
        </div>

        <h1 className="display h1">
          어떤 이유로
          <br />
          <span className="hl">해외에 가세요?</span>
        </h1>

        <div role="radiogroup" aria-label="체류 목적" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PERSONA_LIST.map((p) => {
            const on = persona === p.id;
            return (
              <button
                key={p.id}
                role="radio"
                aria-checked={on}
                onClick={() => setPersona(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 72,
                  padding: "14px 16px",
                  borderRadius: 12,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  border: on ? "2px solid #111" : "1.5px solid #dadad6",
                  background: on ? "#f4f4f2" : "#fff",
                }}
              >
                <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{p.title}</span>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {p.sub}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, border: on ? "7px solid #111" : "1.5px solid #9a9a96" }}
                />
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="h2">어디로 가세요?</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 600, padding: "7px 12px", borderRadius: 6, background: "#111", color: "#fff" }}>호주</span>
            {COMING.map((c) => (
              <span key={c} className="faint" style={{ fontSize: 13, padding: "7px 12px", borderRadius: 6, border: "1px solid #dadad6" }}>
                {c} · 준비 중
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <label className="field">
            도시
            <select className="input" value={city} onChange={(e) => setCity(e.target.value as CityId)}>
              {(Object.keys(CITIES) as CityId[]).map((c) => (
                <option key={c} value={c}>
                  {CITIES[c].label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            도착일
            <input className="input mono" type="date" value={arrival} max={today(-365)} onChange={(e) => setArrival(e.target.value)} style={{ fontSize: 14 }} />
          </label>
        </div>

        <label className="field">
          이름 (메시지 서명용, 선택)
          <input className="input" value={name} maxLength={20} placeholder="예: 지우" onChange={(e) => setName(e.target.value)} />
        </label>
      </div>

      <div className="actions" style={{ flexDirection: "column", gap: 8 }}>
        <button className="btn block" onClick={start} disabled={!arrival}>
          시작하기
        </button>
        <span className="small muted" style={{ textAlign: "center" }}>
          입력한 정보는 이 기기에만 저장돼요
        </span>
      </div>
    </main>
  );
}
