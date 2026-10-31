"use client";

import { useEffect, useState } from "react";
import type { AnalysisResult, ChatTurn, CoachFeedback, Profile } from "./types";
import type { WageResult } from "./wage";

/** 이 기기(localStorage)에만 저장하는 상태. 서버로 보내지 않는다. */

export type Stage = "before" | "working" | "harmed";

export type CaseState = {
  analysis?: AnalysisResult & { text?: string };
  wage?: WageResult & { hours: number; paidHourly?: number };
  scenarioId?: string;
  rehearsal?: { turns: (ChatTurn & { coach?: CoachFeedback; translated?: string })[] };
  shared?: boolean;
  /** 지금 상황: 서명 전 · 일하는 중 · 이미 피해를 봄 */
  stage?: Stage;
  doneTodos?: string[];
};

const KEYS = { profile: "gi.profile", case: "gi.case" } as const;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장이 막힌 브라우저에서도 화면은 동작하게 둔다 */
  }
}

export const getProfile = () => read<Profile>(KEYS.profile);
export const setProfile = (p: Profile) => write(KEYS.profile, p);
export const getCase = () => read<CaseState>(KEYS.case) ?? {};
export function updateCase(patch: Partial<CaseState>): CaseState {
  const next = { ...getCase(), ...patch };
  write(KEYS.case, next);
  return next;
}
export function resetAll() {
  try {
    localStorage.removeItem(KEYS.profile);
    localStorage.removeItem(KEYS.case);
  } catch {
    /* noop */
  }
}

/** 첫 렌더는 null(서버와 동일), 마운트 후 저장값을 읽는다. */
export function useStored<T>(reader: () => T): [T | null, (v: T) => void] {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => setValue(reader()), [reader]);
  return [value, setValue];
}

export function daysSince(date: string): number {
  const start = new Date(`${date}T00:00:00`);
  const diff = Date.now() - start.getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}
