"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getProfile } from "@/lib/store";
import type { Level, PersonaId, Profile } from "@/lib/types";
import { IconBack, IconChat, IconDoc, IconHome, IconReceipt } from "./icons";

export function TopBar({ title, back, right }: { title?: string; back?: string; right?: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="topbar">
      {back !== undefined && (
        <button className="icon-btn back" aria-label="뒤로" onClick={() => (back ? router.push(back) : router.back())}>
          <IconBack />
        </button>
      )}
      <span className="title">{title}</span>
      {right}
    </div>
  );
}

const THIRD_TAB: Record<PersonaId, string> = { jobseeker: "급여", student: "근로시간", worker: "체크리스트" };

export function TabBar({ persona }: { persona?: PersonaId }) {
  const path = usePathname();
  const tabs = [
    { href: "/home", label: "홈", icon: <IconHome /> },
    { href: "/scan", label: "서류 체크", icon: <IconDoc /> },
    { href: "/pay", label: THIRD_TAB[persona ?? "jobseeker"], icon: <IconReceipt /> },
    { href: "/rehearse", label: "리허설", icon: <IconChat /> },
  ];
  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={path.startsWith(t.href) ? "on" : ""} aria-current={path.startsWith(t.href) ? "page" : undefined}>
          {t.icon}
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export function LevelTag({ level, children }: { level: Level; children?: React.ReactNode }) {
  if (level === "risk") return <span className="stamp-risk">{children ?? "위험"}</span>;
  if (level === "caution") return <span className="tag-caution">{children ?? "주의"}</span>;
  return <span className="tag-info">{children ?? "확인"}</span>;
}

/** 프로필이 없으면 온보딩으로 보낸다. 마운트 전에는 null. */
export function useProfile(): Profile | null {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    const p = getProfile();
    if (!p) router.replace("/onboarding");
    else setProfile(p);
  }, [router]);
  return profile;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }} role="status">
      <span className="spinner" aria-hidden="true" />
      {label}
    </span>
  );
}

export function ModeBadge({ mode }: { mode?: "ai" | "offline" }) {
  if (!mode) return null;
  return (
    <span className="mono small faint" title={mode === "ai" ? "NVIDIA 모델 + 규칙 엔진" : "규칙 엔진만 사용 (API 키 없음)"}>
      {mode === "ai" ? "AI + 규칙 엔진" : "오프라인 · 규칙 엔진"}
    </span>
  );
}
