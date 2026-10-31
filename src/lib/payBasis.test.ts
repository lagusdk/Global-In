import { describe, expect, it } from "vitest";
import { payBasis } from "./payBasis";
import { calcWage } from "./wage";

describe("payBasis", () => {
  it("picks the Australian rate in force on the work date", () => {
    expect(payBasis("AU", "2025-03-01").hourly).toBe(24.1);
    expect(payBasis("AU", "2025-08-01")).toMatchObject({ hourly: 24.95, from: "2025-07-01", stale: false });
  });

  it("warns when the work date is past the next July revision", () => {
    const b = payBasis("AU", "2026-11-03");
    expect(b.hourly).toBe(24.95);
    expect(b.stale).toBe(true);
    expect(b.nextRevision).toBe("2026-07-01");
  });

  it("uses each prefecture's own revision date in Japan", () => {
    expect(payBasis("JP", "2025-10-10", "tokyo").hourly).toBe(1226);
    expect(payBasis("JP", "2025-10-10", "osaka").hourly).toBe(1114);
    expect(payBasis("JP", "2026-10-31", "tokyo").stale).toBe(true);
  });

  it("feeds the date-specific rate into the wage calculation", () => {
    const r = calcWage({ hours: 38, employmentType: "casual", paidHourly: 22, baseHourly: payBasis("AU", "2025-03-01").hourly });
    expect(r.expectedHourly).toBe(30.13);
  });
});
