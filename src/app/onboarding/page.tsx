"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconChevron } from "@/components/icons";
import { CITIES, COUNTRIES, citiesOf } from "@/lib/kb/countries";
import { PERSONA_LIST, VISAS } from "@/lib/personas";
import { getProfile, setProfile, updateCase } from "@/lib/store";
import type { CityId, Country, PersonaId, VisaId } from "@/lib/types";

const COMING = ["캐나다", "영국", "뉴질랜드"];

function today(offsetDays = 0) {
  const d = new Date(Date.now() - offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export default function Onboarding() {
  const router = useRouter();
  const [persona, setPersona] = useState<PersonaId>("jobseeker");
  const [country, setCountry] = useState<Country>("AU");
  const [visa, setVisa] = useState<VisaId | "">("");
  const [city, setCity] = useState<CityId>("brisbane");
  const [arrival, setArrival] = useState(today(12));
  const [name, setName] = useState("");

  useEffect(() => {
    const p = getProfile();
    if (p) {
      setPersona(p.persona);
      setCountry(p.country ?? "AU");
      setVisa(p.visa ?? "");
      setCity(p.city);
      setArrival(p.arrival);
      setName(p.name ?? "");
    }
  }, []);

  const start = () => {
    const prev = getProfile();
    setProfile({ persona, country, city, arrival, visa: visa || undefined, name: name.trim() || undefined });
    // 대상이나 국가가 바뀌면 이전 사례 기록은 지운다.
    if (prev && (prev.persona !== persona || (prev.country ?? "AU") !== country)) updateCase({ analysis: undefined, wage: undefined, scenarioId: undefined, rehearsal: undefined, shared: false, doneTodos: [] });
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
            {(Object.keys(COUNTRIES) as Country[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={country === k}
                onClick={() => {
                  setCountry(k);
                  setCity(citiesOf(k)[0]);
                }}
                style={{ fontSize: 13, fontWeight: 600, padding: "7px 14px", borderRadius: 6, cursor: "pointer", minHeight: 36, ...(country === k ? { background: "#111", color: "#fff", border: "1.5px solid #111" } : { background: "#fff", color: "#111", border: "1.5px solid #111" }) }}
              >
                {COUNTRIES[k].label}
              </button>
            ))}
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
              {citiesOf(country).map((c) => (
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
          비자 (목적과 따로 골라 주세요)
          <select className="input" value={visa} onChange={(e) => setVisa(e.target.value as VisaId)}>
            <option value="" disabled>
              선택해 주세요
            </option>
            {VISAS[country].map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <span className="small faint" style={{ fontWeight: 400 }}>
            비자에 따라 일할 수 있는 시간·조건이 달라요. 학생비자를 고르면 근무시간 한도도 함께 확인해요.
          </span>
        </label>

        <label className="field">
          이름 (메시지 서명용, 선택)
          <input className="input" value={name} maxLength={20} placeholder="예: 지우" onChange={(e) => setName(e.target.value)} />
        </label>

        <Link href="/org/login" className="card-wash" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="small muted">대학 국제처 · 청년센터 · 기업 HR · 재외공관</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>기관 담당자이신가요? 대시보드로 가기</span>
          </span>
          <IconChevron />
        </Link>
      </div>

      <div className="actions" style={{ flexDirection: "column", gap: 8 }}>
        <button className="btn block" onClick={start} disabled={!arrival || !visa}>
          시작하기
        </button>
        <span className="small muted" style={{ textAlign: "center" }}>
          입력한 정보는 이 기기에만 저장돼요
        </span>
      </div>
    </main>
  );
}
