import type { CityId, Country } from "../types";

export type CountryInfo = {
  label: string;
  /** 현지 언어 */
  lang: "en" | "ja";
  langLabel: string;
  /** 음성 인식·합성 언어 코드 */
  speech: string;
  currency: "AUD" | "JPY";
};

export const COUNTRIES: Record<Country, CountryInfo> = {
  AU: { label: "호주", lang: "en", langLabel: "영어", speech: "en-AU", currency: "AUD" },
  JP: { label: "일본", lang: "ja", langLabel: "일본어", speech: "ja-JP", currency: "JPY" },
};

export type CityInfo = {
  label: string;
  country: Country;
  /** 호주: 주(QLD·NSW·VIC), 일본: 도도부현 */
  region: string;
  /** 탑승권에 표시할 공항 코드 */
  code: string;
};

export const CITIES: Record<CityId, CityInfo> = {
  brisbane: { label: "브리즈번", country: "AU", region: "QLD", code: "BNE" },
  sydney: { label: "시드니", country: "AU", region: "NSW", code: "SYD" },
  melbourne: { label: "멜버른", country: "AU", region: "VIC", code: "MEL" },
  tokyo: { label: "도쿄", country: "JP", region: "東京都", code: "TYO" },
  osaka: { label: "오사카", country: "JP", region: "大阪府", code: "OSA" },
  fukuoka: { label: "후쿠오카", country: "JP", region: "福岡県", code: "FUK" },
};

export function citiesOf(country: Country): CityId[] {
  return (Object.keys(CITIES) as CityId[]).filter((c) => CITIES[c].country === country);
}

export function formatMoney(n: number, country: Country): string {
  if (country === "JP") return `¥${Math.round(n).toLocaleString("ja-JP")}`;
  return `A$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
