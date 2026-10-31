import { RULES_BY_ID } from "./kb";
import type { Finding, Level } from "./types";

/** 국가별 규칙 엔진이 함께 쓰는 도구들 */

const LEVEL_ORDER: Record<Level, number> = { risk: 0, caution: 1, info: 2 };

export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}

/** 매칭된 위치가 들어 있는 문장(줄)을 원문 인용으로 돌려준다. */
export function quoteAround(text: string, index: number): string {
  // 문장 끝은 마침표 뒤에 공백·줄바꿈·끝이 올 때, 또는 일본어 마침표(。)로 본다 ($22.00 같은 소수점에서 자르지 않도록).
  const start = Math.max(text.lastIndexOf("\n", index), text.lastIndexOf(". ", index) + 1, text.lastIndexOf("。", index - 1) + 1, 0);
  const sentenceEnd = /\.(?=\s|$)|。|\n/g;
  sentenceEnd.lastIndex = index;
  const m = sentenceEnd.exec(text);
  const end = m ? (m[0] === "\n" ? m.index : m.index + 1) : text.length;
  const q = text.slice(start, end).trim().replace(/\s+/g, " ");
  return q.length > 180 ? q.slice(0, 177) + "…" : q;
}

export function find(text: string, re: RegExp): { index: number; match: RegExpExecArray } | null {
  const m = re.exec(text);
  return m ? { index: m.index, match: m } : null;
}

export function fromRule(ruleId: string, extra: Partial<Finding> = {}): Finding {
  const r = RULES_BY_ID[ruleId];
  return {
    ruleId,
    level: r.level,
    title: r.title,
    explanation: r.explain,
    korea: r.korea,
    action: r.action,
    source: { ...r.source },
    scope: r.scope,
    origin: "rule",
    ...extra,
  };
}

/** 받침 유무에 따라 '이'/'가'를 고른다. */
export function subjectParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return "이";
  return code % 28 === 0 ? "가" : "이";
}

export function dedupe(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter((f) => {
    const key = f.ruleId ?? f.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 파견 발령서 체크리스트 — 빠졌거나 '별도 협의'로만 적힌 항목을 찾는다 (영문·국문·일문).
 * overrides로 국가별 설명·근거를 바꿀 수 있다.
 */
export function assignmentChecks(text: string, overrides: Partial<Record<string, Partial<Finding>>> = {}): Finding[] {
  const t = text.toLowerCase();
  const checks: [string, RegExp, string][] = [
    ["WK-HOUSING", /housing|accommodation|rent allowance|주거|주택|숙소|임차|住宅|社宅/, "주거 지원"],
    ["WK-TAX", /\btax|withholding|equali[sz]ation|세금|원천징수|소득세|税/, "세금 처리"],
    ["WK-PENSION", /pension|social security|certificate of coverage|국민연금|사회보장|年金/, "연금 처리"],
    ["WK-INSURANCE", /insurance|medical|health cover|보험|의료|保険/, "의료보험"],
    ["WK-RETURN", /repatriation|return to korea|end of (?:the )?assignment|귀임|복귀|귀국|帰任/, "귀임 조건"],
  ];
  const vague = /별도\s*협의|추후\s*(?:협의|결정)|to be (?:discussed|confirmed|agreed)|\btbd\b|\btbc\b|別途協議/;
  const out: Finding[] = [];
  for (const [id, re, label] of checks) {
    const hit = find(t, re);
    if (!hit) {
      out.push(fromRule(id, overrides[id]));
      continue;
    }
    const line = quoteAround(text, hit.index);
    if (vague.test(line.toLowerCase())) out.push(fromRule(id, { ...overrides[id], title: `${label}${subjectParticle(label)} '별도 협의'로만 적혀 있어요`, quote: line }));
  }
  return out;
}
