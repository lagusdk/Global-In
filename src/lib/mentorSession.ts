"use client";

import type { Country } from "./types";

/**
 * 멘토 서포터즈 데모 로그인. 인증 없이 이 기기(localStorage)에만 저장한다.
 * 실서비스에서는 재학·전공 증빙 확인 후 계정을 발급한다.
 */
export type MentorSession = {
  name: string;
  major: string;
  country: Country;
  experience?: string;
  answered: number;
  at: string;
};

const KEY = "gi.mentor";

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
