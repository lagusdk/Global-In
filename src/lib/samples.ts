import type { Country, DocType, PersonaId } from "./types";

export type SampleDoc = {
  id: string;
  title: string;
  docType: DocType;
  country: Country;
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
    country: "AU",
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
    country: "AU",
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
    country: "AU",
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
    country: "AU",
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
    country: "AU",
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

  // ── 일본 ──
  {
    id: "jp-izakaya",
    title: "이자카야 근로조건통지서",
    docType: "employment_contract",
    country: "JP",
    personas: ["jobseeker", "student"],
    language: "일본어",
    text: `労働条件通知書 — 居酒屋さくら（東京都新宿区）
雇用形態：アルバイト
時給：1,100円（研修期間3か月は時給1,000円）
勤務時間：1日9時間、週5日（シフト制）
残業代：なし（時給に含む）
遅刻1回につき罰金1,000円を給与から差し引きます。
制服代5,000円は初回の給与から天引きします。
社会保険：なし`,
  },
  {
    id: "jp-share-house",
    title: "셰어하우스 입주 안내",
    docType: "lease",
    country: "JP",
    personas: ["jobseeker", "student", "worker"],
    language: "일본어",
    text: `シェアハウス入居のご案内（東京都中野区）
家賃：65,000円／月（共益費込み）
敷金：65,000円　礼金：65,000円
退去時のクリーニング費用・修繕費は全額借主負担とし、敷金は返還しません。
入居期間中、パスポートは管理会社で保管します。`,
  },
  {
    id: "jp-konbini",
    title: "편의점 아르바이트 채용 안내 (유학생)",
    docType: "employment_contract",
    country: "JP",
    personas: ["student"],
    language: "일본어",
    text: `アルバイト採用のお知らせ — コンビニ大阪本町店
時給：1,200円（深夜22時以降は25%割増）
勤務：週5日、1日7時間
給与明細はアプリで毎月確認できます。
交通費：全額支給`,
  },
  {
    id: "jp-resort-ad",
    title: "리조트 숙식 구인 광고",
    docType: "job_ad",
    country: "JP",
    personas: ["jobseeker"],
    language: "일본어",
    text: `【急募】ニセコ スキーリゾート 住み込みスタッフ大募集！
時給：1,000円〜　ワーホリ歓迎・経験不問
寮完備！寮費月3万円は給与から天引きします。
登録料5,000円が必要です（初回のみ）。
夜はスナックでの接客も可（時給アップ）。`,
  },
  {
    id: "jp-assignment",
    title: "일본 파견 발령 안내 (국문)",
    docType: "assignment_letter",
    country: "JP",
    personas: ["worker"],
    language: "한국어",
    text: `해외 파견 발령 안내
성명: 김지우 / 소속: 해외영업팀
파견지: 일본 도쿄 지사
파견 기간: 2027년 4월 1일부터 3년
급여: 국내 기본급 유지, 해외 근무 수당 별도
주거: 현지 도착 후 별도 협의
국민연금: 한일 사회보장협정 가입증명서 발급 예정`,
  },
];

export function samplesFor(persona: PersonaId, country: Country = "AU"): SampleDoc[] {
  return SAMPLE_DOCS.filter((s) => s.personas.includes(persona) && s.country === country);
}
