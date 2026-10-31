import { AU_PAY } from "./kb/au";
import type { EmploymentType } from "./types";

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

export function formatAud(n: number): string {
  return n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
