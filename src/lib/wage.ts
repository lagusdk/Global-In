import { AU_PAY } from "./kb/au";
import { JP_PAY, jpMinHourly } from "./kb/jp";
import type { CityId, Country, EmploymentType } from "./types";

/** 금액을 센트 단위로 반올림한다. 부동소수점 오차를 피하려고 정수 센트로 계산한다. */
export function roundCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function minimumHourly(type: EmploymentType): number {
  const base = AU_PAY.nationalMinimumHourly;
  return roundCents(type === "casual" ? base * (1 + AU_PAY.casualLoading) : base);
}

export type WageInput = {
  hours: number;
  employmentType: EmploymentType;
  /** 시급으로 받았으면 시급, 총액으로 받았으면 paidTotal을 쓴다 */
  paidHourly?: number;
  paidTotal?: number;
};

export type WageLine = { label: string; amount: number; sign?: "+" | "-" };

export type WageResult = {
  country: Country;
  baseHourly: number;
  loading: number;
  expectedHourly: number;
  expectedTotal: number;
  paidTotal: number;
  shortfall: number;
  lines: WageLine[];
  effectiveFrom: string;
};

export function calcWage(input: WageInput): WageResult {
  if (!(input.hours > 0)) throw new Error("근무 시간은 0보다 커야 해요");
  const paidTotal =
    input.paidTotal !== undefined ? roundCents(input.paidTotal) : roundCents((input.paidHourly ?? 0) * input.hours);

  const baseHourly = AU_PAY.nationalMinimumHourly;
  const expectedHourly = minimumHourly(input.employmentType);
  const loading = roundCents(expectedHourly - baseHourly);
  const expectedTotal = roundCents(expectedHourly * input.hours);
  const shortfall = Math.max(0, roundCents(expectedTotal - paidTotal));

  const lines: WageLine[] = [{ label: "국가 최저시급", amount: baseHourly }];
  if (loading > 0) lines.push({ label: "캐주얼 가산 25%", amount: loading, sign: "+" });

  return {
    country: "AU",
    baseHourly,
    loading,
    expectedHourly,
    expectedTotal,
    paidTotal,
    shortfall,
    lines,
    effectiveFrom: AU_PAY.effectiveFrom,
  };
}

export type StudentHoursResult = {
  total: number;
  limit: number;
  over: number;
  inSession: boolean;
};

/** 학생비자: 학기 중 2주(fortnight) 합산 48시간 제한. 방학 중에는 제한이 없다. */
export function calcStudentHours(week1: number, week2: number, inSession = true): StudentHoursResult {
  const total = roundCents(Math.max(0, week1) + Math.max(0, week2));
  const limit = AU_PAY.studentFortnightLimit;
  return { total, limit, over: inSession ? Math.max(0, roundCents(total - limit)) : 0, inSession };
}

/**
 * 일본: 받아야 할 시급 = max(받은 시급, 지역 최저임금).
 * 주 40시간을 넘는 시간은 25% 할증. (심야·휴일 할증은 근무 시간대를 몰라 반영하지 않는다.)
 */
export function calcWageJp(input: { hours: number; paidHourly: number; city: CityId }): WageResult {
  if (!(input.hours > 0)) throw new Error("근무 시간은 0보다 커야 해요");
  const minHourly = jpMinHourly(input.city);
  const baseHourly = Math.max(input.paidHourly, minHourly);
  const regular = Math.min(input.hours, JP_PAY.legalWeeklyHours);
  const overtime = Math.max(0, input.hours - JP_PAY.legalWeeklyHours);
  const overtimeHourly = Math.ceil(baseHourly * (1 + JP_PAY.overtimePremium));
  const expectedTotal = Math.round(baseHourly * regular + overtimeHourly * overtime);
  const paidTotal = Math.round(input.paidHourly * input.hours);
  const lines: WageLine[] = [{ label: `지역 최저임금 (${input.city === "tokyo" ? "도쿄" : input.city === "osaka" ? "오사카" : "후쿠오카"})`, amount: minHourly }];
  if (overtime > 0) lines.push({ label: `주 40시간 초과 ${overtime}시간 × 125%`, amount: overtimeHourly });
  return {
    country: "JP",
    baseHourly: minHourly,
    loading: overtime > 0 ? overtimeHourly - baseHourly : 0,
    expectedHourly: baseHourly,
    expectedTotal,
    paidTotal,
    shortfall: Math.max(0, expectedTotal - paidTotal),
    lines,
    effectiveFrom: JP_PAY.effectiveFrom,
  };
}

/** 일본 유학생 자격외활동: 주 28시간. 장기 방학 중에는 하루 8시간(주 40시간)까지. */
export function calcStudentHoursJp(weekHours: number, longVacation = false): StudentHoursResult {
  const limit = longVacation ? JP_PAY.legalWeeklyHours : JP_PAY.studentWeeklyLimit;
  const total = roundCents(Math.max(0, weekHours));
  return { total, limit, over: Math.max(0, roundCents(total - limit)), inSession: !longVacation };
}

export function formatAud(n: number): string {
  return n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
