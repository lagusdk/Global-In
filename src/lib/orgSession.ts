"use client";

import type { OrgId } from "./brief";
import type { CityId, Country } from "./types";

/**
 * 기관 데모 로그인. 실제 인증 없이 이 기기(localStorage)에만 저장한다.
 * 실서비스에서는 기관 계정 발급·SSO로 바꿔야 한다.
 */
export type OrgSession = {
  org: OrgId;
  /** 대시보드에서 먼저 볼 국가 */
  country?: Country;
  name: string;
  manager: string;
  /** 도시별 소속 인원 (대학: 학생, 기업: 파견 직원) */
  members: Partial<Record<CityId, number>>;
  /** 출국 예정 인원 */
  departing: number;
  at: string;
};

const KEY = "gi.org";

export function getOrgSession(): OrgSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OrgSession) : null;
  } catch {
    return null;
  }
}

export function setOrgSession(s: OrgSession) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* 저장이 막힌 브라우저에서도 이번 화면은 동작하게 둔다 */
  }
}

export function clearOrgSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

export const ORG_TYPES: { id: OrgId; label: string; sub: string; memberLabel?: string; example: Omit<OrgSession, "at"> }[] = [
  {
    id: "uni",
    label: "대학 국제처",
    sub: "교환학생·유학생 출국 전 교육과 체류 관리",
    memberLabel: "체류 학생",
    example: { org: "uni", name: "한국대학교 국제처", manager: "김담당", members: { brisbane: 6, sydney: 7, melbourne: 4, tokyo: 9, osaka: 5, fukuoka: 3 }, departing: 15 },
  },
  {
    id: "youth",
    label: "청년·고용 지원기관",
    sub: "워홀·해외취업 준비 청년 교육과 상담",
    example: { org: "youth", name: "OO시 청년센터", manager: "이담당", members: {}, departing: 40 },
  },
  {
    id: "hr",
    label: "기업 HR",
    sub: "해외 파견 직원 정착 지원",
    memberLabel: "파견 직원",
    example: { org: "hr", name: "(주)한빛솔루션 인사팀", manager: "박담당", members: { sydney: 2, melbourne: 4, tokyo: 5, osaka: 2 }, departing: 3 },
  },
  {
    id: "gov",
    label: "재외공관·공공기관",
    sub: "재외국민 안전 공지와 현지 협력",
    example: { org: "gov", name: "재외공관 (예시)", manager: "최담당", members: {}, departing: 0 },
  },
];
