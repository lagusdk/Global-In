import { randomUUID } from "node:crypto";
import { db } from "./db";
import type { Country, PersonaId, Report } from "./types";

/**
 * 위험 신호 집계. 실제 서비스에서는 사용자가 '익명으로 알리기'를 누른 제보만 DB에 쌓인다.
 * 데모에서는 아래 샘플 데이터 + 서버 메모리에 쌓인 제보를 합쳐서 보여 준다.
 */

export const K_THRESHOLD = 5;

export type MapCity = { id: string; label: string; country: Country; x: number; y: number; labelSide: "left" | "right" | "top" };

/** 지도 SVG(600×500, 경위도 → 14px/도 투영) 위 도시 좌표 */
export const MAP_CITIES: MapCity[] = [
  { id: "darwin", label: "다윈", country: "AU", x: 263, y: 60, labelSide: "right" },
  { id: "broome", label: "브룸", country: "AU", x: 152, y: 130, labelSide: "right" },
  { id: "cairns", label: "케언즈", country: "AU", x: 462, y: 118, labelSide: "left" },
  { id: "alice", label: "앨리스스프링스", country: "AU", x: 307, y: 206, labelSide: "right" },
  { id: "bundaberg", label: "번다버그", country: "AU", x: 550, y: 226, labelSide: "left" },
  { id: "brisbane", label: "브리즈번", country: "AU", x: 563, y: 264, labelSide: "left" },
  { id: "perth", label: "퍼스", country: "AU", x: 64, y: 322, labelSide: "right" },
  { id: "adelaide", label: "애들레이드", country: "AU", x: 372, y: 354, labelSide: "left" },
  { id: "mildura", label: "밀두라", country: "AU", x: 423, y: 352, labelSide: "top" },
  { id: "sydney", label: "시드니", country: "AU", x: 538, y: 346, labelSide: "left" },
  { id: "melbourne", label: "멜버른", country: "AU", x: 460, y: 400, labelSide: "left" },
  { id: "hobart", label: "호바트", country: "AU", x: 490, y: 468, labelSide: "right" },
  // 일본 지도 SVG(600×520, x=(경도-128)*30+20, y=(46-위도)*30+10). 오키나와는 오른쪽 아래 상자 안에 따로 그린다.
  { id: "sapporo", label: "삿포로", country: "JP", x: 420, y: 98, labelSide: "right" },
  { id: "niseko", label: "니세코", country: "JP", x: 400, y: 106, labelSide: "left" },
  { id: "sendai", label: "센다이", country: "JP", x: 406, y: 242, labelSide: "right" },
  { id: "tokyo", label: "도쿄", country: "JP", x: 371, y: 319, labelSide: "right" },
  { id: "nagoya", label: "나고야", country: "JP", x: 287, y: 336, labelSide: "top" },
  { id: "kyoto", label: "교토", country: "JP", x: 254, y: 336, labelSide: "top" },
  { id: "osaka", label: "오사카", country: "JP", x: 244, y: 352, labelSide: "left" },
  { id: "hiroshima", label: "히로시마", country: "JP", x: 155, y: 357, labelSide: "top" },
  { id: "fukuoka", label: "후쿠오카", country: "JP", x: 92, y: 382, labelSide: "left" },
  { id: "naha", label: "오키나와", country: "JP", x: 524, y: 466, labelSide: "left" },
];

const COUNTRY_OF: Record<string, Country> = Object.fromEntries(MAP_CITIES.map((c) => [c.id, c.country]));

export type SeedRow = { city: string; industry: string; issue: string; persona: PersonaId; count: number; prev: number; /** 사용자가 실제로 보낸 제보 */ live?: boolean };

export const SEED: SeedRow[] = [
  { city: "bundaberg", industry: "농장", issue: "성과급 단가 최저보장 미달", persona: "jobseeker", count: 21, prev: 14 },
  { city: "bundaberg", industry: "농장", issue: "선입금·알선비 요구", persona: "jobseeker", count: 19, prev: 13 },
  { city: "bundaberg", industry: "농장", issue: "숙소비 과다 공제", persona: "jobseeker", count: 18, prev: 12 },
  { city: "mildura", industry: "농장", issue: "숙소비 과다 공제", persona: "jobseeker", count: 11, prev: 8 },
  { city: "mildura", industry: "농장", issue: "성과급 단가 최저보장 미달", persona: "jobseeker", count: 30, prev: 25 },
  { city: "brisbane", industry: "카페·요식", issue: "현금 지급 · 명세서 없음", persona: "jobseeker", count: 17, prev: 14 },
  { city: "brisbane", industry: "카페·요식", issue: "최저임금 미달", persona: "jobseeker", count: 12, prev: 11 },
  { city: "brisbane", industry: "쉐어하우스", issue: "bond 개인계좌 송금 요구", persona: "student", count: 8, prev: 7 },
  { city: "sydney", industry: "쉐어하우스", issue: "bond 개인계좌 송금 요구", persona: "student", count: 14, prev: 12 },
  { city: "sydney", industry: "요식업", issue: "학기 중 근로시간 초과 유도", persona: "student", count: 11, prev: 10 },
  { city: "sydney", industry: "요식업", issue: "최저임금 미달", persona: "student", count: 8, prev: 8 },
  { city: "melbourne", industry: "청소", issue: "ABN(개인사업자) 계약 강요", persona: "jobseeker", count: 9, prev: 9 },
  { city: "melbourne", industry: "요식업", issue: "학기 중 근로시간 초과 유도", persona: "student", count: 9, prev: 8 },
  { city: "melbourne", industry: "사무·전문직", issue: "파견 조건 '별도 협의'", persona: "worker", count: 6, prev: 4 },
  { city: "melbourne", industry: "카페·요식", issue: "최저임금 미달", persona: "jobseeker", count: 5, prev: 5 },
  { city: "cairns", industry: "관광·숙박", issue: "무급 트라이얼", persona: "jobseeker", count: 12, prev: 10 },
  { city: "cairns", industry: "관광·숙박", issue: "현금 지급 · 명세서 없음", persona: "jobseeker", count: 10, prev: 9 },
  { city: "perth", industry: "광산 지원", issue: "고정 시급(가산 없음)", persona: "jobseeker", count: 10, prev: 9 },
  { city: "perth", industry: "사무·전문직", issue: "파견 조건 '별도 협의'", persona: "worker", count: 8, prev: 7 },
  { city: "adelaide", industry: "와이너리", issue: "성과급 단가 최저보장 미달", persona: "jobseeker", count: 12, prev: 12 },
  { city: "darwin", industry: "관광·숙박", issue: "무급 트라이얼", persona: "jobseeker", count: 9, prev: 8 },
  { city: "broome", industry: "관광·숙박", issue: "현금 지급 · 명세서 없음", persona: "jobseeker", count: 5, prev: 5 },
  { city: "hobart", industry: "농장", issue: "숙소비 과다 공제", persona: "jobseeker", count: 6, prev: 6 },
  { city: "alice", industry: "관광·숙박", issue: "무급 트라이얼", persona: "jobseeker", count: 3, prev: 3 },
  // ── 일본 (샘플) ──
  { city: "tokyo", industry: "음식점", issue: "최저임금 미달", persona: "jobseeker", count: 16, prev: 13 },
  { city: "tokyo", industry: "음식점", issue: "잔업수당 미지급", persona: "jobseeker", count: 14, prev: 12 },
  { city: "tokyo", industry: "음식점", issue: "벌금·위약금 조항", persona: "jobseeker", count: 6, prev: 5 },
  { city: "tokyo", industry: "편의점", issue: "주 28시간 초과 유도", persona: "student", count: 12, prev: 10 },
  { city: "tokyo", industry: "셰어하우스", issue: "퇴거 비용 과다 청구", persona: "student", count: 9, prev: 8 },
  { city: "tokyo", industry: "사무·전문직", issue: "파견 조건 '별도 협의'", persona: "worker", count: 6, prev: 5 },
  { city: "osaka", industry: "음식점", issue: "잔업수당 미지급", persona: "jobseeker", count: 10, prev: 9 },
  { city: "osaka", industry: "편의점", issue: "주 28시간 초과 유도", persona: "student", count: 8, prev: 6 },
  { city: "osaka", industry: "사무·전문직", issue: "파견 조건 '별도 협의'", persona: "worker", count: 5, prev: 5 },
  { city: "kyoto", industry: "숙박", issue: "무급 연수", persona: "jobseeker", count: 8, prev: 7 },
  { city: "niseko", industry: "스키 리조트", issue: "제복·기숙사비 과다 공제", persona: "jobseeker", count: 15, prev: 8 },
  { city: "niseko", industry: "스키 리조트", issue: "비자 금지 업종 권유", persona: "jobseeker", count: 6, prev: 3 },
  { city: "naha", industry: "리조트", issue: "제복·기숙사비 과다 공제", persona: "jobseeker", count: 7, prev: 6 },
  { city: "fukuoka", industry: "음식점", issue: "최저임금 미달", persona: "jobseeker", count: 6, prev: 6 },
  { city: "fukuoka", industry: "편의점", issue: "주 28시간 초과 유도", persona: "student", count: 5, prev: 4 },
  { city: "sapporo", industry: "음식점", issue: "잔업수당 미지급", persona: "jobseeker", count: 5, prev: 5 },
  { city: "nagoya", industry: "제조", issue: "여권·재류카드 보관 요구", persona: "jobseeker", count: 5, prev: 4 },
  { city: "sendai", industry: "음식점", issue: "최저임금 미달", persona: "jobseeker", count: 3, prev: 3 },
  { city: "hiroshima", industry: "음식점", issue: "잔업수당 미지급", persona: "jobseeker", count: 4, prev: 4 },
];

/** 실제 제보는 저장소(Firestore 또는 메모리)에 쌓는다. */
export async function addReport(r: Report) {
  await (await db()).put("reports", randomUUID(), r);
}

async function liveReports(): Promise<Report[]> {
  return (await db()).list<Report>("reports");
}

export type CitySignal = { id: string; label: string; country: Country; x: number; y: number; labelSide: MapCity["labelSide"]; count: number; hidden: boolean };
export type IssueSignal = { issue: string; count: number };
export type PatternRow = { city: string; cityLabel: string; industry: string; issue: string; count: number; change: number };

export type SignalSummary = {
  total: number;
  cities: CitySignal[];
  topIssues: IssueSignal[];
  patterns: PatternRow[];
  byPersona: Record<PersonaId, number>;
  liveReports: number;
};

async function rows(persona?: PersonaId, country?: Country): Promise<SeedRow[]> {
  const live: SeedRow[] = (await liveReports()).flatMap((r) =>
    r.issues.map((issue) => ({ city: r.city, industry: r.industry ?? "기타", issue, persona: r.persona ?? "jobseeker", count: 1, prev: 0, live: true })),
  );
  return [...SEED, ...live].filter((r) => (!persona || r.persona === persona) && (!country || COUNTRY_OF[r.city] === country));
}

export async function summarize(persona?: PersonaId, country: Country = "AU"): Promise<SignalSummary> {
  const data = await rows(persona, country);
  const total = data.reduce((s, r) => s + r.count, 0);

  const cityTotals = new Map<string, number>();
  for (const r of data) cityTotals.set(r.city, (cityTotals.get(r.city) ?? 0) + r.count);
  const cities: CitySignal[] = MAP_CITIES.filter((c) => c.country === country).map((c) => {
    const count = cityTotals.get(c.id) ?? 0;
    return { ...c, count, hidden: count < K_THRESHOLD };
  });

  const issueTotals = new Map<string, number>();
  for (const r of data) issueTotals.set(r.issue, (issueTotals.get(r.issue) ?? 0) + r.count);
  const topIssues = [...issueTotals.entries()]
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const groups = new Map<string, PatternRow & { prev: number }>();
  for (const r of data) {
    const key = `${r.city}|${r.industry}|${r.issue}`;
    const g = groups.get(key) ?? { city: r.city, cityLabel: MAP_CITIES.find((c) => c.id === r.city)?.label ?? r.city, industry: r.industry, issue: r.issue, count: 0, prev: 0, change: 0 };
    g.count += r.count;
    g.prev += r.prev;
    groups.set(key, g);
  }
  const patterns = [...groups.values()]
    .filter((g) => g.count >= K_THRESHOLD)
    .map((g) => ({ city: g.city, cityLabel: g.cityLabel, industry: g.industry, issue: g.issue, count: g.count, change: g.prev ? Math.round(((g.count - g.prev) / g.prev) * 100) : 100 }))
    .sort((a, b) => b.change - a.change)
    .slice(0, 6);

  const byPersona = { student: 0, jobseeker: 0, worker: 0 } as Record<PersonaId, number>;
  for (const r of await rows(undefined, country)) byPersona[r.persona] += r.count;

  return { total, cities, topIssues, patterns, byPersona, liveReports: data.filter((r) => r.live).length };
}

/** 홈의 '내 주변 경고' 카드: 같은 도시·업종의 제보 수. 업종 제보가 적으면 도시 전체로 넓힌다. */
export async function nearbyWarning(city: string, industry: string): Promise<{ count: number; sample: number; live: number; issues: string[]; scope: string } | null> {
  const pick = (data: SeedRow[], scope: string) => {
    const count = data.reduce((s, r) => s + r.count, 0);
    if (count < K_THRESHOLD) return null;
    const live = data.filter((r) => r.live).reduce((s, r) => s + r.count, 0);
    return { count, sample: count - live, live, scope, issues: [...new Set([...data].sort((a, b) => b.count - a.count).map((r) => r.issue))].slice(0, 2) };
  };
  const inCity = (await rows()).filter((r) => r.city === city);
  return pick(inCity.filter((r) => r.industry === industry), industry) ?? pick(inCity, "전체 업종");
}
