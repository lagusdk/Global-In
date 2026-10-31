import type { CitySignal } from "@/lib/signals";
import type { Country } from "@/lib/types";

/**
 * 호주: 주요 해안 지점 경위도를 x=(경도-112)*14, y=(-위도-9)*14 로 투영해 단순화.
 * 일본: x=(경도-128)*30+20, y=(46-위도)*30+10. 오키나와는 오른쪽 아래 상자에 따로 그린다.
 */
const OUTLINES: Record<Country, { viewBox: string; paths: string[]; inset?: { x: number; y: number; w: number; h: number; label: string } }> = {
  AU: {
    viewBox: "0 0 600 500",
    paths: [
      "M208.6,68.6 L226.8,82.6 L246.4,84 L256.2,58.8 L263.2,47.6 L287,35 L336,42 L347.2,44.8 L329,81.2 L350,98 L385,119 L403.2,119 L413,84 L414.4,49 L427,23.8 L441,70 L464.8,91 L473.2,110.6 L487.2,144.2 L520.8,169.4 L539,201.6 L564.2,222.6 L576.8,226.8 L575.4,259 L582.4,274.4 L575.4,298.2 L557.2,334.6 L548.8,348.6 L541.8,365.4 L530.6,399 L481.6,421.4 L460.6,410.2 L441,417.2 L414.4,410.2 L399,406 L385,385 L371,362.6 L350,366.8 L361.2,329 L334.6,359.8 L310.8,334.6 L303.8,323.4 L266,315 L236.6,317.8 L138.6,348.6 L82.6,364 L43.4,355.6 L51.8,322 L36.4,277.2 L21,238 L22.4,222.6 L29.4,179.2 L92.4,158.2 L142.8,126 L162.4,112 L182,84 Z",
      "M457.8,443.8 L508.2,446.6 L508.2,464.8 L502.6,478.8 L488.6,484.4 L464.8,466.2 Z",
    ],
  },
  JP: {
    viewBox: "0 0 600 520",
    paths: [
      // 홋카이도
      "M380,148 L377,112 L416,94 L428,28 L455,52 L497,67 L539,61 L548,91 L512,103 L479,130 L431,112 L407,115 L410,136 Z",
      // 혼슈
      "M389,154 L425,148 L422,172 L440,205 L425,241 L410,244 L410,280 L398,301 L407,319 L392,337 L374,343 L368,331 L353,337 L344,352 L329,352 L290,352 L284,340 L287,361 L260,385 L233,373 L242,352 L218,349 L197,355 L155,361 L107,370 L122,358 L143,340 L170,325 L206,322 L239,322 L260,319 L281,292 L287,268 L299,265 L290,283 L326,280 L350,253 L368,232 L377,202 L380,172 Z",
      // 시코쿠
      "M152,388 L167,406 L170,409 L206,394 L221,376 L218,364 L200,359 L170,367 L161,376 Z",
      // 규슈
      "M107,373 L131,382 L137,403 L125,433 L113,451 L101,460 L86,451 L86,430 L95,412 L77,409 L71,394 L80,385 L92,382 Z",
      // 오키나와 (상자 안)
      "M500,482 L512,472 L528,458 L546,442 L554,448 L540,464 L522,478 L506,490 Z",
    ],
    inset: { x: 470, y: 420, w: 110, h: 86, label: "오키나와" },
  },
};

export function CountryMap({ country, cities, highlight }: { country: Country; cities: CitySignal[]; highlight?: string[] }) {
  const o = OUTLINES[country];
  const visible = cities.filter((c) => !c.hidden);
  const top = [...visible].sort((a, b) => b.count - a.count).slice(0, 5);
  const label = `${country === "JP" ? "일본" : "호주"} 지도 위 도시별 위험 신호. ${top.map((c) => `${c.label} ${c.count}건`).join(", ")}.`;
  return (
    <svg role="img" aria-label={label} viewBox={o.viewBox} style={{ width: "100%", height: "auto", maxHeight: 520, display: "block" }}>
      {o.inset && <rect x={o.inset.x} y={o.inset.y} width={o.inset.w} height={o.inset.h} fill="none" stroke="#9a9a96" strokeWidth={1.2} strokeDasharray="4 4" rx={6} />}
      {o.paths.map((d, i) => (
        <path key={i} d={d} fill="#f4f4f2" stroke="#111" strokeWidth={1.4} strokeLinejoin="round" />
      ))}
      <g fontFamily="IBM Plex Sans KR, sans-serif" fontSize={12} fontWeight={600} fill="#111">
        {visible.map((c) => {
          const r = 3 + Math.sqrt(c.count) * 1.9;
          const hot = c.count >= 30;
          const mid = c.count >= 15;
          const ring = highlight?.includes(c.id);
          const tx = c.labelSide === "left" ? c.x - r - 6 : c.labelSide === "right" ? c.x + r + 6 : c.x;
          const ty = c.labelSide === "top" ? c.y - r - 7 : c.y + 4;
          return (
            <g key={c.id}>
              {ring && <circle cx={c.x} cy={c.y} r={r + 5} fill="none" stroke="#111" strokeWidth={1.5} strokeDasharray="3 3" />}
              <circle cx={c.x} cy={c.y} r={r} fill={hot ? "#c42b1c" : mid ? "#e38a80" : "#c42b1c"} fillOpacity={hot || mid ? 1 : 0.25} stroke={hot ? "none" : "#c42b1c"} strokeWidth={1.5} />
              <text x={tx} y={ty} textAnchor={c.labelSide === "left" ? "end" : c.labelSide === "top" ? "middle" : "start"}>
                {c.label} {c.count}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
