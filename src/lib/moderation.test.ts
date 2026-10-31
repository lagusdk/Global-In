import { describe, expect, it } from "vitest";
import { moderateOffline } from "./moderation";

describe("moderateOffline", () => {
  it("allows a normal question, even a critical one", () => {
    expect(moderateOffline("사장님이 시급을 너무 적게 줘요. 최저임금 위반 아닌가요?").ok).toBe(true);
  });

  it("blocks profanity", () => {
    expect(moderateOffline("이 사장 진짜 씨발 같아요").ok).toBe(false);
  });

  it("blocks phone numbers and emails", () => {
    expect(moderateOffline("연락 주세요 010-1234-5678").ok).toBe(false);
    expect(moderateOffline("메일은 abc@test.com 이에요").ok).toBe(false);
  });

  it("does not mistake money or hours for a phone number", () => {
    expect(moderateOffline("주 38시간 일하고 시급 $22, 총 836달러 받았어요").ok).toBe(true);
    expect(moderateOffline("보증금 1,120달러를 현금으로 달래요").ok).toBe(true);
  });
});
