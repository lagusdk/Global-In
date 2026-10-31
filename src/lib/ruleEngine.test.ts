import { describe, expect, it } from "vitest";
import { detectDocType, extractFields, runRules } from "./ruleEngine";
import { SAMPLE_DOCS } from "./samples";

const sample = (id: string) => SAMPLE_DOCS.find((s) => s.id === id)!.text;
const ids = (out: ReturnType<typeof runRules>) => out.findings.map((f) => f.ruleId);

describe("detectDocType", () => {
  it("recognises each sample's type", () => {
    for (const s of SAMPLE_DOCS) expect(detectDocType(s.text), s.id).toBe(s.docType);
  });
});

describe("extractFields", () => {
  it("reads rate, type, hours and pay method from the café contract", () => {
    const e = extractFields(sample("cafe-contract"));
    expect(e).toMatchObject({ hourlyRate: 22, employmentType: "casual", hoursPerWeek: 38, payMethod: "cash" });
  });

  it("reads rent and bond from the share house text", () => {
    const e = extractFields(sample("share-house"));
    expect(e.weeklyRent).toBe(280);
    expect(e.bondAmount).toBe(1120);
  });
});

describe("runRules", () => {
  it("flags the café contract's wage, payslip, cash, trial and flat rate issues", () => {
    const out = runRules(sample("cafe-contract"), { persona: "jobseeker", state: "QLD", docType: "employment_contract" });
    expect(ids(out)).toEqual(expect.arrayContaining(["AU-WAGE-BELOW-MIN", "AU-PAYSLIP", "AU-CASH-PAY", "AU-UNPAID-TRIAL", "AU-FLAT-RATE"]));
    const wage = out.findings.find((f) => f.ruleId === "AU-WAGE-BELOW-MIN")!;
    expect(wage.explanation).toContain("31.19");
    expect(wage.explanation).toContain("9.19");
    expect(wage.quote).toBe("Pay: $22.00 per hour, paid weekly in cash.");
    expect(out.findings[0].level).toBe("risk");
  });

  it("flags a private bond transfer and cites the state's bond authority", () => {
    const out = runRules(sample("share-house"), { persona: "jobseeker", state: "QLD", docType: "lease" });
    const bond = out.findings.find((f) => f.ruleId === "AU-BOND-PRIVATE")!;
    expect(bond.source?.url).toContain("rta.qld.gov.au");
  });

  it("flags student hours over the fortnight limit but not a fair wage", () => {
    const out = runRules(sample("restaurant-student"), { persona: "student", state: "NSW", docType: "employment_contract" });
    expect(ids(out)).toContain("AU-STUDENT-HOURS");
    expect(ids(out)).not.toContain("AU-WAGE-BELOW-MIN");
    expect(ids(out)).not.toContain("AU-SUPER");
  });

  it("does not apply the student hour limit to other personas", () => {
    const out = runRules(sample("restaurant-student"), { persona: "jobseeker", state: "NSW", docType: "employment_contract" });
    expect(ids(out)).not.toContain("AU-STUDENT-HOURS");
  });

  it("flags placement fees and paid sponsorship in the farm ad", () => {
    const out = runRules(sample("farm-ad"), { persona: "jobseeker", state: "QLD", docType: "job_ad" });
    expect(ids(out)).toEqual(expect.arrayContaining(["AU-JOB-FEE", "AU-SPONSOR-PAY", "AU-WAGE-BELOW-MIN"]));
  });

  it("lists missing items in a Korean assignment letter", () => {
    const out = runRules(sample("assignment"), { persona: "worker", state: "VIC", docType: "assignment_letter" });
    expect(ids(out)).toEqual(expect.arrayContaining(["WK-TAX", "WK-PENSION", "WK-INSURANCE", "WK-RETURN"]));
    // 주거는 언급은 됐지만 '별도 협의'뿐이라 따로 짚는다
    const housing = out.findings.find((f) => f.ruleId === "WK-HOUSING")!;
    expect(housing.title).toContain("별도 협의");
    expect(housing.quote).toContain("주거");
  });
});
