import { describe, expect, it } from "vitest";
import { calcStudentHours, calcWage, minimumHourly } from "./wage";

describe("minimumHourly", () => {
  it("adds 25% casual loading and rounds to cents", () => {
    expect(minimumHourly("casual")).toBe(31.19);
    expect(minimumHourly("part_time")).toBe(24.95);
  });
});

describe("calcWage", () => {
  it("matches the demo scenario: casual, 38h at $22 cash", () => {
    const r = calcWage({ hours: 38, employmentType: "casual", paidHourly: 22 });
    expect(r.expectedTotal).toBe(1185.22);
    expect(r.paidTotal).toBe(836);
    expect(r.shortfall).toBe(349.22);
  });

  it("uses paidTotal when given", () => {
    const r = calcWage({ hours: 10, employmentType: "full_time", paidTotal: 200 });
    expect(r.expectedTotal).toBe(249.5);
    expect(r.shortfall).toBe(49.5);
  });

  it("never reports a negative shortfall", () => {
    const r = calcWage({ hours: 10, employmentType: "casual", paidHourly: 40 });
    expect(r.shortfall).toBe(0);
  });

  it("rejects zero hours", () => {
    expect(() => calcWage({ hours: 0, employmentType: "casual", paidHourly: 22 })).toThrow();
  });
});

describe("calcStudentHours", () => {
  it("flags hours over 48 per fortnight during session", () => {
    expect(calcStudentHours(30, 25).over).toBe(7);
    expect(calcStudentHours(24, 24).over).toBe(0);
  });

  it("has no limit outside session", () => {
    expect(calcStudentHours(40, 40, false).over).toBe(0);
  });
});
