import type { DocType, PersonaId } from "./types";

export type SampleDoc = {
  id: string;
  title: string;
  docType: DocType;
  personas: PersonaId[];
  language: string;
  text: string;
};

/** 시연용 예시 서류 (가상의 사업장·인물). */
export const SAMPLE_DOCS: SampleDoc[] = [
  {
    id: "cafe-contract",
    title: "Sunny Café 근로계약서",
    docType: "employment_contract",
    personas: ["jobseeker", "student"],
    language: "영어",
    text: `EMPLOYMENT AGREEMENT — Sunny Café (Brisbane)
1. Employee: Jiwoo Kim
2. Start date: 3 November 2026
3. Position: Casual barista.
4. Pay: $22.00 per hour, paid weekly in cash.
5. No payslips will be issued.
6. Trial period: 2 weeks, unpaid.
7. Hours: around 38 hours per week, including weekends. Flat rate applies on weekends.
8. Rosters are given one week in advance.
9. Either party may end this agreement with one week's notice.`,
  },
  {
    id: "share-house",
    title: "쉐어하우스 렌트 안내 문자",
    docType: "lease",
    personas: ["jobseeker", "student", "worker"],
    language: "영어",
    text: `Room for rent — share house, South Brisbane
Rent: $280 per week, bills included.
Bond: $1,120 (4 weeks). Please transfer the bond to my personal account before moving in, it's easier that way.
No written lease needed, we keep it casual.
Move-in available from 1 November.`,
  },
  {
    id: "restaurant-student",
    title: "레스토랑 아르바이트 제안 (학생)",
    docType: "employment_contract",
    personas: ["student"],
    language: "영어",
    text: `Job offer — Harbour Noodle Bar (Sydney)
Position: Part-time kitchen hand.
Pay: $26.50 per hour, paid fortnightly by bank transfer. Payslips are emailed each pay day.
Hours: 30 hours per week during semester, more during holidays.
Superannuation will be paid into your nominated fund.`,
  },
  {
    id: "farm-ad",
    title: "농장 구인 광고",
    docType: "job_ad",
    personas: ["jobseeker"],
    language: "영어",
    text: `NOW HIRING — Fruit picking, Bundaberg QLD
Start immediately, no experience needed!
Pay: piece rate, about $20 per hour for fast pickers.
A $300 placement fee is required to secure your spot before you start.
Accommodation provided, $200 per week deducted from pay.
2nd year visa sponsorship available for an extra fee.`,
  },
  {
    id: "assignment",
    title: "해외 파견 발령 안내 (국문)",
    docType: "assignment_letter",
    personas: ["worker"],
    language: "한국어",
    text: `해외 파견 발령 안내
성명: 김지우 / 소속: 해외사업팀
파견지: 호주 멜버른 현지 법인
파견 기간: 2027년 1월 1일부터 2년 (필요 시 연장 가능)
급여: 국내 기본급 유지, 해외 근무 수당 월 200만 원 별도 지급
주거: 현지 도착 후 별도 협의
기타 세부 사항은 현지 법인 방침에 따름.`,
  },
];

export function samplesFor(persona: PersonaId): SampleDoc[] {
  return SAMPLE_DOCS.filter((s) => s.personas.includes(persona));
}
