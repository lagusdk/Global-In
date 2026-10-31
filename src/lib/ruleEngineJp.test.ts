import { describe, expect, it } from "vitest";
import { detectDocType, runRules } from "./ruleEngine";
import { extractFieldsJp } from "./ruleEngineJp";
import { SAMPLE_DOCS } from "./samples";

const sample = (id: string) => SAMPLE_DOCS.find((s) => s.id === id)!.text;
const ids = (out: ReturnType<typeof runRules>) => out.findings.map((f) => f.ruleId);

describe("Japan doc type detection", () => {
  it("recognises each Japanese sample's type", () => {
    for (const s of SAMPLE_DOCS.filter((d) => d.country === "JP")) expect(detectDocType(s.text), s.id).toBe(s.docType);
  });
});

describe("extractFieldsJp", () => {
  it("reads hourly rate and weekly hours from 1日9時間・週5日", () => {
    const e = extractFieldsJp(sample("jp-izakaya"));
    expect(e.hourlyRate).toBe(1100);
    expect(e.hoursPerWeek).toBe(45);
  });
});

describe("runRules (Japan)", () => {
  it("flags the izakaya contract: wage, no overtime, fine, deduction, no insurance", () => {
    const out = runRules(sample("jp-izakaya"), { country: "JP", persona: "jobseeker", region: "tokyo", docType: "employment_contract" });
    expect(ids(out)).toEqual(expect.arrayContaining(["JP-WAGE-BELOW-MIN", "JP-OVERTIME", "JP-PENALTY", "JP-DEDUCTION", "JP-SOCIAL-INS"]));
    const wage = out.findings.find((f) => f.ruleId === "JP-WAGE-BELOW-MIN")!;
    expect(wage.explanation).toContain("1,226");
    expect(wage.explanation).toContain("126");
    expect(out.findings.find((f) => f.ruleId === "JP-OVERTIME")!.level).toBe("risk");
  });

  it("uses each prefecture's minimum wage", () => {
    const text = "雇用契約書\n時給：1,190円\n週20時間";
    const tokyo = runRules(text, { country: "JP", persona: "jobseeker", region: "tokyo", docType: "employment_contract" });
    const osaka = runRules(text, { country: "JP", persona: "jobseeker", region: "osaka", docType: "employment_contract" });
    expect(ids(tokyo)).toContain("JP-WAGE-BELOW-MIN");
    expect(ids(osaka)).not.toContain("JP-WAGE-BELOW-MIN");
  });

  it("flags restoration clause, reikin and passport keeping in the share house notice", () => {
    const out = runRules(sample("jp-share-house"), { country: "JP", persona: "student", region: "tokyo", docType: "lease" });
    expect(ids(out)).toEqual(expect.arrayContaining(["JP-RESTORATION", "JP-REIKIN", "JP-PASSPORT"]));
  });

  it("flags the 28-hour student limit only for students", () => {
    const student = runRules(sample("jp-konbini"), { country: "JP", persona: "student", region: "osaka", docType: "employment_contract" });
    const other = runRules(sample("jp-konbini"), { country: "JP", persona: "jobseeker", region: "osaka", docType: "employment_contract" });
    expect(ids(student)).toContain("JP-STUDENT-28H");
    expect(ids(other)).not.toContain("JP-STUDENT-28H");
    // 심야 25% 할증이 적혀 있으므로 잔업 경고는 내지 않는다
    expect(ids(student)).not.toContain("JP-OVERTIME");
  });

  it("flags fees, deductions and prohibited entertainment work in the resort ad", () => {
    const out = runRules(sample("jp-resort-ad"), { country: "JP", persona: "jobseeker", region: "tokyo", docType: "job_ad" });
    expect(ids(out)).toEqual(expect.arrayContaining(["JP-JOB-FEE", "JP-DEDUCTION", "JP-ENTERTAINMENT", "JP-WAGE-BELOW-MIN"]));
  });

  it("explains the Korea–Japan pension-only agreement for assignment letters", () => {
    const out = runRules(sample("jp-assignment"), { country: "JP", persona: "worker", region: "tokyo", docType: "assignment_letter" });
    expect(ids(out)).toEqual(expect.arrayContaining(["WK-HOUSING", "WK-TAX", "WK-INSURANCE", "WK-RETURN"]));
    expect(ids(out)).not.toContain("WK-PENSION");
    expect(out.findings.find((f) => f.ruleId === "WK-INSURANCE")!.explanation).toContain("일본");
  });
});
