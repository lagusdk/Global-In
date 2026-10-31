"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconLock } from "@/components/icons";
import type { OrgId } from "@/lib/brief";
import { CITIES } from "@/lib/kb/au";
import { ORG_TYPES, getOrgSession, setOrgSession } from "@/lib/orgSession";
import type { CityId } from "@/lib/types";

const CITY_IDS = Object.keys(CITIES) as CityId[];

export default function OrgLogin() {
  const router = useRouter();
  const [org, setOrg] = useState<OrgId>("uni");
  const [name, setName] = useState("");
  const [manager, setManager] = useState("");
  const [members, setMembers] = useState<Record<CityId, string>>({ brisbane: "", sydney: "", melbourne: "" });
  const [departing, setDeparting] = useState("");

  useEffect(() => {
    const s = getOrgSession();
    if (s) router.replace("/org");
  }, [router]);

  const type = ORG_TYPES.find((t) => t.id === org)!;

  const fillExample = () => {
    const e = type.example;
    setName(e.name);
    setManager(e.manager);
    setMembers({ brisbane: String(e.members.brisbane), sydney: String(e.members.sydney), melbourne: String(e.members.melbourne) });
    setDeparting(String(e.departing));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = (v: string) => Math.max(0, Math.min(9999, Math.round(Number(v) || 0)));
    setOrgSession({
      org,
      name: name.trim() || type.example.name,
      manager: manager.trim() || "담당자",
      members: { brisbane: num(members.brisbane), sydney: num(members.sydney), melbourne: num(members.melbourne) },
      departing: num(departing),
      at: new Date().toISOString(),
    });
    router.push("/org");
  };

  return (
    <main className="org" style={{ display: "flex", justifyContent: "center" }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" className="wordmark" style={{ fontSize: 18 }}>
            Global-In
          </Link>
          <span className="tag-caution">데모 · 인증 없음</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 className="display" style={{ fontSize: 30 }}>
            기관 담당자
            <br />
            <span className="hl">대시보드 시작하기</span>
          </h1>
          <p className="body" style={{ margin: 0 }}>
            이용자가 동의해서 알린 어려움을 지역·업종별로 모아 보여 드려요. 데모라서 아무 값이나 넣어도 들어갈 수 있어요.
          </p>
        </div>

        <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          <legend className="h2" style={{ marginBottom: 8 }}>
            기관 유형
          </legend>
          {ORG_TYPES.map((t) => {
            const on = org === t.id;
            return (
              <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, cursor: "pointer", border: on ? "2px solid #111" : "1.5px solid #dadad6", background: on ? "#f4f4f2" : "#fff" }}>
                <input type="radio" name="org" value={t.id} checked={on} onChange={() => setOrg(t.id)} style={{ width: 18, height: 18, accentColor: "#111" }} />
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{t.label}</span>
                  <span className="small muted">{t.sub}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <label className="field">
            기관명
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={type.example.name} maxLength={40} />
          </label>
          <label className="field">
            담당자 이름
            <input className="input" value={manager} onChange={(e) => setManager(e.target.value)} placeholder={type.example.manager} maxLength={20} />
          </label>
        </div>

        {type.memberLabel && (
          <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <legend className="h2" style={{ marginBottom: 8 }}>
              호주 {type.memberLabel} 수 (도시별)
            </legend>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              {CITY_IDS.map((c) => (
                <label key={c} className="field">
                  {CITIES[c].label}
                  <input className="input mono" inputMode="numeric" value={members[c]} onChange={(e) => setMembers((m) => ({ ...m, [c]: e.target.value }))} placeholder="0" />
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {org !== "gov" && (
          <label className="field" style={{ maxWidth: 240 }}>
            출국 예정 인원 (다음 분기)
            <input className="input mono" inputMode="numeric" value={departing} onChange={(e) => setDeparting(e.target.value)} placeholder="0" />
          </label>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn outline" onClick={fillExample} style={{ flex: "1 1 160px" }}>
            예시로 채우기
          </button>
          <button type="submit" className="btn" style={{ flex: "2 1 220px" }}>
            대시보드 들어가기
          </button>
        </div>

        <p className="small muted" style={{ margin: 0, display: "flex", gap: 8, lineHeight: 1.5 }}>
          <IconLock size={16} />
          입력한 정보는 이 브라우저에만 저장돼요. 실서비스에서는 기관 계정 발급과 담당자 인증을 거쳐요.
        </p>
        <Link href="/" className="small" style={{ textDecoration: "underline", alignSelf: "flex-start" }}>
          ← 개인 사용자 화면으로
        </Link>
      </form>
    </main>
  );
}
