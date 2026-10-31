"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IconArrowRight } from "@/components/icons";
import { LevelTag, TopBar, useProfile } from "@/components/ui";
import { scenarioFor } from "@/lib/caseFlow";
import { AU_PAY } from "@/lib/kb/au";
import { CITIES, formatMoney } from "@/lib/kb/countries";
import { JP_PAY } from "@/lib/kb/jp";
import { payBasis, todayIso, type PayBasis } from "@/lib/payBasis";
import { getCase, updateCase, type CaseState } from "@/lib/store";
import type { CityId, Country, EmploymentType } from "@/lib/types";
import { calcStudentHours, calcStudentHoursJp, calcWage, calcWageJp, formatAud } from "@/lib/wage";


/** 근무 날짜에 맞는 최저임금 기준 + 오래된 기준 경고 + 직접 입력 */
function BasisPanel(props: {
  country: Country;
  date: string;
  setDate: (v: string) => void;
  basis: PayBasis;
  override: string;
  setOverride: (v: string) => void;
  adult?: boolean;
  setAdult?: (v: boolean) => void;
}) {
  const { country, date, setDate, basis, override, setOverride } = props;
  const money = (n: number) => formatMoney(n, country);
  const officialUrl =
    country === "JP" ? "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/" : "https://www.fairwork.gov.au/pay-and-wages/minimum-wages";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, alignItems: "end" }}>
        <label className="field">
          근무(예정) 날짜
          <input className="input mono" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ fontSize: 14 }} />
        </label>
        <div className="small" style={{ lineHeight: 1.5, paddingBottom: 6 }}>
          적용 기준 <b>{money(basis.hourly)}</b>
          <br />
          <span className="muted">{basis.from}부터 · {country === "JP" ? "지역 최저임금" : "국가 최저시급"}</span>
        </div>
      </div>
      {(basis.stale || basis.beforeKnown) && (
        <div className="error" role="alert" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span>
            {basis.stale
              ? `이 날짜에는 ${basis.nextRevision} 전후 개정된 새 기준이 적용될 수 있는데, 아직 반영하지 못했어요. 아래는 ${basis.from} 기준으로 계산한 추정치예요.`
              : "이 날짜보다 앞선 기준은 갖고 있지 않아서 가장 오래된 기준으로 계산했어요."}
          </span>
          <label className="field" style={{ color: "#111", fontWeight: 600 }}>
            공식 페이지에서 확인한 최저시급 직접 입력 (선택)
            <input className="input mono" inputMode="decimal" value={override} onChange={(e) => setOverride(e.target.value)} placeholder={String(basis.hourly)} />
          </label>
          <a href={officialUrl} target="_blank" rel="noreferrer" className="small" style={{ textDecoration: "underline" }}>
            {country === "JP" ? "후생노동성 지역별 최저임금 표 열기" : "Fair Work 최저임금 페이지 열기"}
          </a>
        </div>
      )}
      {props.setAdult && (
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, minHeight: 40 }}>
          <input type="checkbox" checked={props.adult} onChange={(e) => props.setAdult!(e.target.checked)} style={{ width: 20, height: 20, accentColor: "#111" }} />
          만 21세 이상이에요
        </label>
      )}
      {props.setAdult && !props.adult && (
        <div className="notice">만 21세 미만은 업종 어워드의 주니어 시급이 적용될 수 있어서 이 계산이 맞지 않을 수 있어요. Fair Work의 Pay Calculator로 꼭 확인하세요.</div>
      )}
    </div>
  );
}

const TYPE_LABEL: Record<Exclude<EmploymentType, "unknown">, string> = { casual: "캐주얼", part_time: "파트타임", full_time: "풀타임" };

function WageCalculator({ c }: { c: CaseState }) {
  const ex = c.analysis?.extracted;
  const [hours, setHours] = useState(String(ex?.hoursPerWeek ?? 38));
  const [rate, setRate] = useState(String(ex?.hourlyRate ?? 22));
  const [type, setType] = useState<Exclude<EmploymentType, "unknown">>(ex?.employmentType && ex.employmentType !== "unknown" ? ex.employmentType : "casual");
  const [date, setDate] = useState(todayIso());
  const [override, setOverride] = useState("");
  const [adult, setAdult] = useState(true);
  const basis = payBasis("AU", date);
  const base = Number(override) > 0 ? Number(override) : basis.hourly;
  const basisFrom = Number(override) > 0 ? "직접 입력" : basis.from;
  const before = c.stage === "before";

  const result = useMemo(() => {
    const h = Number(hours);
    const r = Number(rate);
    if (!(h > 0) || !(r >= 0) || h > 168) return null;
    return calcWage({ hours: h, employmentType: type, paidHourly: r, baseHourly: base, basisFrom });
  }, [hours, rate, type, base, basisFrom]);

  useEffect(() => {
    if (result) updateCase({ wage: { ...result, hours: Number(hours), paidHourly: Number(rate) } });
  }, [result, hours, rate]);

  return (
    <>
      <h1 className="display h1">
        {result && result.shortfall > 0 ? (
          <>
            {before ? "이 조건대로면 주마다" : "입력한 조건이라면 이번 주"}
            <br />
            <span className="hl">A${formatAud(result.shortfall)}</span>를
            <br />
            {before ? "적게 받게 돼요 (추정)" : "덜 받았을 수 있어요 (추정)"}
          </>
        ) : (
          <>
            받은 돈이
            <br />
            <span className="hl">기준에 맞는지</span> 볼게요
          </>
        )}
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        <label className="field">
          주 근무시간
          <input className="input mono" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
        </label>
        <label className="field">
          받은 시급 A$
          <input className="input mono" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
        </label>
        <label className="field">
          고용 형태
          <select className="input" value={type} onChange={(e) => setType(e.target.value as typeof type)} style={{ padding: "0 6px" }}>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      {result ? (
        <div className="mono" style={{ background: "#f4f4f2", borderRadius: 4, padding: "16px 18px", fontSize: 13, display: "flex", flexDirection: "column", gap: 9 }} aria-label="급여 대조표">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="h2" style={{ fontSize: 14 }}>급여 대조표</span>
            <span className="small muted">
              {hours}h · {TYPE_LABEL[type].toUpperCase()}
            </span>
          </div>
          <div style={{ borderTop: "1.5px dashed #111" }} />
          {result.lines.map((l) => (
            <div key={l.label} style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{l.label}</span>
              <span>
                {l.sign ? `${l.sign} ` : ""}
                {formatAud(l.amount)}
              </span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
            <span>받아야 할 시급</span>
            <span>{formatAud(result.expectedHourly)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>× {hours}시간</span>
            <span>{formatAud(result.expectedTotal)}</span>
          </div>
          <div style={{ borderTop: "1.5px dashed #111" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>받은 금액 ({formatAud(Number(rate))} × {hours})</span>
            <span>− {formatAud(result.paidTotal)}</span>
          </div>
          <div style={{ borderTop: "3px double #111" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontWeight: 600 }}>
            <span>차액</span>
            <span style={{ fontSize: 20, color: result.shortfall > 0 ? "#c42b1c" : "#1f7a4d" }}>{formatAud(result.shortfall)}</span>
          </div>
          <span className="small muted">
            입력 조건에 따른 추정 차액 · 만 21세 이상 · 국가 최저시급 {result.effectiveFrom} 기준 · 업종 어워드·주말·야간 가산 미반영 (실제로는 다를 수 있어요)
          </span>
        </div>
      ) : (
        <div className="error">근무시간과 시급을 숫자로 넣어 주세요.</div>
      )}

      <BasisPanel country="AU" date={date} setDate={setDate} basis={basis} override={override} setOverride={setOverride} adult={adult} setAdult={setAdult} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="h2" style={{ fontSize: 14 }}>이렇게 계산해요</span>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 24px minmax(0,1fr)", alignItems: "center", gap: 4 }}>
          <div className="box" style={{ borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
            <span className="small muted">AI</span>
            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>서류에서 숫자만 읽기</span>
          </div>
          <IconArrowRight />
          <div style={{ borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 2, background: "#111", color: "#fff" }}>
            <span className="small" style={{ color: "#d3d3cf" }}>코드</span>
            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>공식 기준표로 정확히 계산</span>
          </div>
        </div>
      </div>
    </>
  );
}

function HoursCalculator() {
  const [w1, setW1] = useState("26");
  const [w2, setW2] = useState("30");
  const [inSession, setInSession] = useState(true);
  const r = calcStudentHours(Number(w1) || 0, Number(w2) || 0, inSession);
  return (
    <>
      <h1 className="display h1">
        {r.over > 0 ? (
          <>
            이대로면 2주에
            <br />
            <span className="hl">{r.over}시간 초과</span>예요
          </>
        ) : (
          <>
            학생비자 근로시간,
            <br />
            <span className="hl">한도 안이에요</span>
          </>
        )}
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        <label className="field">
          1주차 시간
          <input className="input mono" inputMode="decimal" value={w1} onChange={(e) => setW1(e.target.value)} />
        </label>
        <label className="field">
          2주차 시간 (예정 포함)
          <input className="input mono" inputMode="decimal" value={w2} onChange={(e) => setW2(e.target.value)} />
        </label>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, minHeight: 44 }}>
        <input type="checkbox" checked={inSession} onChange={(e) => setInSession(e.target.checked)} style={{ width: 20, height: 20, accentColor: "#111" }} />
        지금은 학기 중이에요 (방학이면 제한 없음)
      </label>
      <div className="card-wash mono" style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>2주 합계</span>
          <span>{r.total}h</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>학기 중 한도</span>
          <span>{inSession ? `${r.limit}h` : "없음"}</span>
        </div>
        <div style={{ height: 10, background: "#dadad6", borderRadius: 2, overflow: "hidden" }} aria-hidden="true">
          <div style={{ height: 10, width: `${Math.min(100, (r.total / r.limit) * 100)}%`, background: r.over > 0 ? "#c42b1c" : "#111" }} />
        </div>
        <span className="small muted">근거 · 호주 내무부 학생비자(500) 조건, 2주 {AU_PAY.studentFortnightLimit}시간</span>
      </div>
      {r.over > 0 && (
        <div className="notice">
          초과 근무는 학생 본인의 비자 조건 위반이 될 수 있어요. 2주차에 {Math.max(0, r.limit - (Number(w1) || 0))}시간까지만 일하겠다고 말하는 연습을 해 보세요.
        </div>
      )}
    </>
  );
}

function WorkerChecklist({ c, country }: { c: CaseState; country: Country }) {
  const wk = c.analysis?.findings.filter((f) => f.ruleId?.startsWith("WK-")) ?? [];
  const items = [
    ["WK-HOUSING", "주거 지원 금액 · 기간 · 보증금 부담"],
    ["WK-TAX", "세금 거주자 여부 · 원천징수 국가 · 세금 보전"],
    ["WK-PENSION", country === "JP" ? "국민연금 가입증명서 (한일 사회보장협정 · 연금만 대상)" : "국민연금 가입증명서 (한-호 사회보장협정)"],
    ["WK-INSURANCE", country === "JP" ? "일본 건강보험 가입 · 가족 피부양자 등록" : "본인·가족 의료보험 보장 범위"],
    ["WK-RETURN", "파견 기간 · 연장 · 귀임 후 처우"],
  ];
  return (
    <>
      <h1 className="display h1">
        출국 전에
        <br />
        <span className="hl">서면으로 받을 것</span>
      </h1>
      <section>
        <div className="section-head">
          <span className="h2">파견 조건 체크리스트</span>
          <span className="small faint">{c.analysis ? "발령서 대조 결과" : "발령서를 확인하면 자동 표시"}</span>
        </div>
        {items.map(([id, label]) => {
          const f = wk.find((x) => x.ruleId === id);
          return (
            <div key={id} className="row">
              {c.analysis ? f ? <LevelTag level={f.level}>{f.title.includes("별도 협의") ? "모호" : "없음"}</LevelTag> : <span className="tag-ok">있음</span> : <span className="tag-info">확인</span>}
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{label}</span>
            </div>
          );
        })}
      </section>
      {!c.analysis && (
        <Link href="/scan" className="btn outline block">
          파견 발령서 확인하기
        </Link>
      )}
    </>
  );
}

/** 일본: 지역 최저임금 + 주 40시간 초과 25% 할증 */
function WageCalculatorJp({ c, city }: { c: CaseState; city: CityId }) {
  const ex = c.analysis?.extracted;
  const [hours, setHours] = useState(String(ex?.hoursPerWeek ?? 45));
  const [rate, setRate] = useState(String(ex?.hourlyRate ?? 1100));
  const [date, setDate] = useState(todayIso());
  const [override, setOverride] = useState("");
  const basis = payBasis("JP", date, city);
  const min = Number(override) > 0 ? Number(override) : basis.hourly;
  const basisFrom = Number(override) > 0 ? "직접 입력" : basis.from;
  const before = c.stage === "before";

  const result = useMemo(() => {
    const h = Number(hours);
    const r = Number(rate);
    if (!(h > 0) || !(r >= 0) || h > 168) return null;
    return calcWageJp({ hours: h, paidHourly: r, city, minHourly: min, basisFrom });
  }, [hours, rate, city, min, basisFrom]);

  useEffect(() => {
    if (result) updateCase({ wage: { ...result, hours: Number(hours), paidHourly: Number(rate) } });
  }, [result, hours, rate]);

  const h = Number(hours);
  const regular = Math.min(h, JP_PAY.legalWeeklyHours);
  const overtime = Math.max(0, h - JP_PAY.legalWeeklyHours);

  return (
    <>
      <h1 className="display h1">
        {result && result.shortfall > 0 ? (
          <>
            {before ? "이 조건대로면 주마다" : "입력한 조건이라면 이번 주"}
            <br />
            <span className="hl">{formatMoney(result.shortfall, "JP")}</span>를
            <br />
            {before ? "적게 받게 돼요 (추정)" : "덜 받았을 수 있어요 (추정)"}
          </>
        ) : (
          <>
            받은 돈이
            <br />
            <span className="hl">기준에 맞는지</span> 볼게요
          </>
        )}
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        <label className="field">
          주 근무시간
          <input className="input mono" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
        </label>
        <label className="field">
          받은 시급 (엔)
          <input className="input mono" inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value)} />
        </label>
      </div>

      {result ? (
        <div className="mono" style={{ background: "#f4f4f2", borderRadius: 4, padding: "16px 18px", fontSize: 13, display: "flex", flexDirection: "column", gap: 9 }} aria-label="급여 대조표">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="h2" style={{ fontSize: 14 }}>급여 대조표</span>
            <span className="small muted">
              {CITIES[city].region} · {hours}h
            </span>
          </div>
          <div style={{ borderTop: "1.5px dashed #111" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>지역 최저임금</span>
            <span>{formatMoney(min, "JP")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
            <span>받아야 할 시급</span>
            <span>{formatMoney(result.expectedHourly, "JP")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>× {regular}시간 (주 40시간까지)</span>
            <span>{formatMoney(result.expectedHourly * regular, "JP")}</span>
          </div>
          {overtime > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>+ {overtime}시간 × 125% (잔업)</span>
              <span>{formatMoney(result.expectedTotal - result.expectedHourly * regular, "JP")}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
            <span>받아야 할 금액</span>
            <span>{formatMoney(result.expectedTotal, "JP")}</span>
          </div>
          <div style={{ borderTop: "1.5px dashed #111" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              받은 금액 ({Number(rate).toLocaleString("ja-JP")} × {hours})
            </span>
            <span>− {formatMoney(result.paidTotal, "JP")}</span>
          </div>
          <div style={{ borderTop: "3px double #111" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontWeight: 600 }}>
            <span>차액</span>
            <span style={{ fontSize: 20, color: result.shortfall > 0 ? "#c42b1c" : "#1f7a4d" }}>{formatMoney(result.shortfall, "JP")}</span>
          </div>
          <span className="small muted">입력 조건에 따른 추정 차액 · 지역 최저임금 {result.effectiveFrom} 기준 · 심야(22~5시)·휴일 할증 미반영</span>
        </div>
      ) : (
        <div className="error">근무시간과 시급을 숫자로 넣어 주세요.</div>
      )}
      <BasisPanel country="JP" date={date} setDate={setDate} basis={basis} override={override} setOverride={setOverride} />
      <div className="notice">AI는 서류에서 숫자만 읽고, 계산은 후생노동성 최저임금표와 노동기준법 할증률로 코드가 해요.</div>
    </>
  );
}

/** 일본 유학생: 주 28시간 (장기 방학 중 하루 8시간) */
function HoursCalculatorJp() {
  const [week, setWeek] = useState("35");
  const [vacation, setVacation] = useState(false);
  const r = calcStudentHoursJp(Number(week) || 0, vacation);
  return (
    <>
      <h1 className="display h1">
        {r.over > 0 ? (
          <>
            이대로면 이번 주
            <br />
            <span className="hl">{r.over}시간 초과</span>예요
          </>
        ) : (
          <>
            유학생 근무시간,
            <br />
            <span className="hl">한도 안이에요</span>
          </>
        )}
      </h1>
      <label className="field" style={{ maxWidth: 260 }}>
        이번 주 근무시간 (알바 전부 합쳐서)
        <input className="input mono" inputMode="decimal" value={week} onChange={(e) => setWeek(e.target.value)} />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, minHeight: 44 }}>
        <input type="checkbox" checked={vacation} onChange={(e) => setVacation(e.target.checked)} style={{ width: 20, height: 20, accentColor: "#111" }} />
        지금은 학교 장기 방학 중이에요 (하루 8시간까지)
      </label>
      <div className="card-wash mono" style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>이번 주 합계</span>
          <span>{r.total}h</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>한도</span>
          <span>{r.limit}h</span>
        </div>
        <div style={{ height: 10, background: "#dadad6", borderRadius: 2, overflow: "hidden" }} aria-hidden="true">
          <div style={{ height: 10, width: `${Math.min(100, (r.total / r.limit) * 100)}%`, background: r.over > 0 ? "#c42b1c" : "#111" }} />
        </div>
        <span className="small muted">근거 · 출입국재류관리청 자격외활동 허가 (주 {JP_PAY.studentWeeklyLimit}시간, 어느 요일부터 세든 7일 기준)</span>
      </div>
      {r.over > 0 && <div className="notice">초과 근무는 학생 본인의 비자 문제가 될 수 있어요. {r.limit}시간까지만 일하겠다고 말하는 연습을 해 보세요.</div>}
    </>
  );
}

export default function Pay() {
  const profile = useProfile();
  const [c, setC] = useState<CaseState | null>(null);
  useEffect(() => setC(getCase()), []);
  if (!profile || !c) return <main className="phone" />;

  const country: Country = profile.country ?? "AU";
  const jp = country === "JP";
  const kind = profile.persona === "student" ? "hours" : profile.persona === "worker" ? "none" : "wage";
  const scenarioId =
    kind === "hours" ? (jp ? "jp-student-hours" : "student-hours") : kind === "none" ? (jp ? "jp-hr-package" : "hr-package") : scenarioFor(profile.persona, c.analysis, country);
  const go = () => updateCase({ scenarioId, rehearsal: undefined });

  return (
    <main className="phone">
      <div className="screen with-actions" style={{ gap: 16 }}>
        <TopBar title={kind === "hours" ? "근로시간 확인" : kind === "none" ? "파견 체크리스트" : "급여 확인"} back={c.analysis ? "/result" : "/home"} />
        {kind === "wage" && (jp ? <WageCalculatorJp c={c} city={profile.city} /> : <WageCalculator c={c} />)}
        {kind === "hours" && (jp ? <HoursCalculatorJp /> : <HoursCalculator />)}
        {kind === "none" && <WorkerChecklist c={c} country={country} />}
      </div>
      <div className="actions">
        <Link href="/send" className="btn outline" onClick={() => updateCase({ scenarioId })}>
          바로 메시지
        </Link>
        <Link href="/rehearse" className="btn grow" onClick={go}>
          {kind === "none" ? "HR에 말하기 연습" : kind === "hours" ? "매니저에게 말하기 연습" : "사장님께 말하기 연습"}
        </Link>
      </div>
    </main>
  );
}
