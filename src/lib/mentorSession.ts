"use client";

import type { Country } from "./types";

/**
 * 서포터즈 신청 정보. 신청서 id와 token만 이 기기(localStorage)에 저장한다.
 * 심사 상태와 답변 권한은 서버(관리기관 승인)가 정한다.
 */
export type MentorSession = { id: string; token: string; nickname: string; country: Country };

const KEY = "gi.mentorApp";

export function getMentor(): MentorSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MentorSession) : null;
  } catch {
    return null;
  }
}

export function setMentor(m: MentorSession) {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* 저장이 막힌 브라우저 */
  }
}

export function clearMentor() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** 활동 인증서 기준 답변 수 */
export const CERT_GOAL = 20;
