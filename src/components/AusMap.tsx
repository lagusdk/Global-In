import type { CitySignal } from "@/lib/signals";

/**
 * 호주 윤곽 (주요 해안 지점 경위도를 x=(경도-112)*14, y=(-위도-9)*14 로 투영해 단순화).
 */
const MAINLAND =
  "M208.6,68.6 L226.8,82.6 L246.4,84 L256.2,58.8 L263.2,47.6 L287,35 L336,42 L347.2,44.8 L329,81.2 L350,98 L385,119 L403.2,119 L413,84 L414.4,49 L427,23.8 L441,70 L464.8,91 L473.2,110.6 L487.2,144.2 L520.8,169.4 L539,201.6 L564.2,222.6 L576.8,226.8 L575.4,259 L582.4,274.4 L575.4,298.2 L557.2,334.6 L548.8,348.6 L541.8,365.4 L530.6,399 L481.6,421.4 L460.6,410.2 L441,417.2 L414.4,410.2 L399,406 L385,385 L371,362.6 L350,366.8 L361.2,329 L334.6,359.8 L310.8,334.6 L303.8,323.4 L266,315 L236.6,317.8 L138.6,348.6 L82.6,364 L43.4,355.6 L51.8,322 L36.4,277.2 L21,238 L22.4,222.6 L29.4,179.2 L92.4,158.2 L142.8,126 L162.4,112 L182,84 Z";
const TASMANIA = "M457.8,443.8 L508.2,446.6 L508.2,464.8 L502.6,478.8 L488.6,484.4 L464.8,466.2 Z";

export function AusMap({ cities, highlight }: { cities: CitySignal[]; highlight?: string[] }) {
  const visible = cities.filter((c) => !c.hidden);
  const top = [...visible].sort((a, b) => b.count - a.count).slice(0, 5);
  const label = `호주 지도 위 도시별 위험 신호. ${top.map((c) => `${c.label} ${c.count}건`).join(", ")}.`;
  return (
    <svg role="img" aria-label={label} viewBox="0 0 600 500" style={{ width: "100%", height: "auto", maxHeight: 520, display: "block" }}>
      <path d={MAINLAND} fill="#f4f4f2" stroke="#111" strokeWidth={1.4} strokeLinejoin="round" />
      <path d={TASMANIA} fill="#f4f4f2" stroke="#111" strokeWidth={1.4} strokeLinejoin="round" />
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
              <circle
                cx={c.x}
                cy={c.y}
                r={r}
                fill={hot ? "#c42b1c" : mid ? "#e38a80" : "#c42b1c"}
                fillOpacity={hot || mid ? 1 : 0.25}
                stroke={hot ? "none" : "#c42b1c"}
                strokeWidth={1.5}
              />
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
