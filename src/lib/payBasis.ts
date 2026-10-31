import type { CityId, Country } from "./types";

/**
 * 근무 날짜에 적용되는 최저임금 기준.
 * 호주는 매년 7월 1일, 일본은 도도부현별로 매년 10월 전후에 바뀐다.
 * 확인된 개정분만 적고, 근무 날짜가 다음 개정 예정일을 지났으면 stale로 표시해 화면에서 경고한다.
 */

type Entry = { from: string; hourly: number };

const AU_HISTORY: Entry[] = [
  { from: "2024-07-01", hourly: 24.1 },
  { from: "2025-07-01", hourly: 24.95 },
];

const JP_HISTORY: Partial<Record<CityId, Entry[]>> = {
  tokyo: [
    { from: "2024-10-01", hourly: 1163 },
    { from: "2025-10-03", hourly: 1226 },
  ],
  osaka: [
    { from: "2024-10-01", hourly: 1114 },
    { from: "2025-10-16", hourly: 1177 },
  ],
  fukuoka: [
    { from: "2024-10-05", hourly: 992 },
    { from: "2025-11-16", hourly: 1057 },
  ],
};

export type PayBasis = {
  hourly: number;
  /** 이 기준이 시작된 날 */
  from: string;
  /** 근무 날짜가 다음 개정 예정일을 지나 최신 기준이 반영되지 않았을 수 있음 */
  stale: boolean;
  /** 다음 개정 예정일 (대략) */
  nextRevision: string;
  /** 근무 날짜가 확인된 가장 이른 기준보다 앞섬 */
  beforeKnown: boolean;
};

function pick(history: Entry[], date: string, nextRevision: (latestFrom: string) => string): PayBasis {
  const sorted = [...history].sort((a, b) => a.from.localeCompare(b.from));
  const applicable = sorted.filter((e) => e.from <= date);
  const entry = applicable[applicable.length - 1] ?? sorted[0];
  const latest = sorted[sorted.length - 1];
  const next = nextRevision(latest.from);
  return {
    hourly: entry.hourly,
    from: entry.from,
    stale: entry === latest && date >= next,
    nextRevision: next,
    beforeKnown: applicable.length === 0,
  };
}

const plusYear = (from: string, monthDay: string) => `${Number(from.slice(0, 4)) + 1}-${monthDay}`;

export function payBasis(country: Country, date: string, city?: CityId): PayBasis {
  if (country === "JP") {
    const history = JP_HISTORY[city ?? "tokyo"] ?? JP_HISTORY.tokyo!;
    return pick(history, date, (from) => plusYear(from, "10-01"));
  }
  return pick(AU_HISTORY, date, (from) => plusYear(from, "07-01"));
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
