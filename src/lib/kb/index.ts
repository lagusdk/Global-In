import type { Country, Rule } from "../types";
import { AU_RULES } from "./au";
import { JP_RULES } from "./jp";

/** 국가별 지식팩을 한곳에서 꺼낸다. 국가를 추가할 때는 여기에 팩을 등록한다. */
export const RULES: Record<Country, Rule[]> = { AU: AU_RULES, JP: JP_RULES };

export const RULES_BY_ID: Record<string, Rule> = Object.fromEntries([...AU_RULES, ...JP_RULES].map((r) => [r.id, r]));

export function rulesFor(country: Country): Rule[] {
  return RULES[country];
}
