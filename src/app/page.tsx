"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconArrowRight, IconCamera, IconChat, IconCheck, IconLock, IconReceipt, IconSend } from "@/components/icons";
import { getProfile } from "@/lib/store";

/** 첫 화면(랜딩). 기능 소개 후 온보딩으로, 이미 시작한 사람은 홈으로 보낸다. */

const STEPS = [
  { no: "01", verb: "찍고", title: "서류를 찍거나 붙여 넣기", desc: "계약서 · 급여명세서 · 렌트 안내 · 구인 광고. 영어·일본어 그대로 넣으면 돼요.", icon: <IconCamera /> },
  { no: "02", verb: "따지고", title: "위험한 줄에 형광펜", desc: "현지 공식 기준과 맞춰 보고, 무엇이 왜 문제인지 한국어로 풀어 줘요.", icon: <IconCheck /> },
  { no: "03", verb: "계산하고", title: "덜 받은 돈을 숫자로", desc: "근무 날짜의 최저임금·가산 수당으로 추정 차액을 계산해요.", icon: <IconReceipt /> },
  { no: "04", verb: "연습하고", title: "사장님께 말하기 리허설", desc: "AI가 사장·집주인·HR 역할을 맡아요. 현지어로 연습하고 코치가 채점해요.", icon: <IconChat /> },
  { no: "05", verb: "보낸다", title: "바로 보낼 메시지", desc: "현지어 메시지와 한국어 뜻을 함께. 피해를 봤다면 증거 목록과 상담기관까지.", icon: <IconSend /> },
];

const TRUST = [
  { title: "공식 근거 안에서만 판정", desc: "호주 Fair Work, 일본 후생노동성 같은 공식 기관 기준을 담은 지식팩으로만 위험을 판단해요. 근거 없는 AI 의견은 ‘참고’로 낮춰 표시해요." },
  { title: "숫자는 코드가 계산", desc: "AI는 서류에서 숫자를 읽기만 해요. 받아야 할 금액은 공식 기준표로 코드가 계산해서, AI가 숫자를 지어낼 수 없어요." },
  { title: "동의한 제보만, 익명으로", desc: "‘익명으로 알리기’를 직접 누른 것만 모아요. 지역·업종·유형만 보내고, 같은 지역 5건 미만은 표시하지 않아요." },
];

const PERSONAS = [
  { title: "공부하러 가요", sub: "교환학생 · 유학 · 어학연수", point: "알바 계약 · 학생 숙소 · 비자 근무시간 한도" },
  { title: "일하면서 지내요", sub: "워킹홀리데이 · 해외취업 준비", point: "최저임금 미달 · 무급 트라이얼 · 선입금 사기" },
  { title: "회사에서 보내요", sub: "파견 · 주재원 · 현지 법인", point: "주거·세금·연금·보험 ‘별도 협의’ 조항" },
];

export default function Landing() {
  const [started, setStarted] = useState(false);
  useEffect(() => setStarted(Boolean(getProfile())), []);
  const startHref = started ? "/home" : "/onboarding";
  const startLabel = started ? "이어서 하기" : "무료로 시작하기";

  return (
    <div className="lp">
      <header className="lp-header">
        <div className="lp-inner lp-header-row">
          <Link href="/" className="lp-brand" aria-label="Global-In 처음으로">
            <img src="/icon.svg" alt="" width={30} height={30} />
            <span className="wordmark">Global-In</span>
          </Link>
          <nav className="lp-nav">
            <a href="#how">기능</a>
            <a href="#trust">신뢰</a>
            <Link href="/org/login">기관용</Link>
            <Link href={startHref} className="btn sm">
              {started ? "이어서 하기" : "시작하기"}
            </Link>
          </nav>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-inner lp-hero-grid">
          <div className="lp-hero-copy">
            <div className="lp-chips">
              <span className="tag-dark">호주</span>
              <span className="tag-dark">일본</span>
              <span className="tag-info">학생 · 워홀 · 파견</span>
            </div>
            <h1 className="display lp-h1">
              서명하기 전에,
              <br />
              <span className="hl">한 번 찍어보세요</span>
            </h1>
            <p className="lp-lead">
              해외로 나가는 청년을 위한 AI 정착 내비게이션.
              <br />
              현지 계약서를 공식 기준에 맞춰 <b>한국어로</b> 풀어 주고, 받을 돈을 계산하고, 말할 용기까지 연습시켜 드려요.
            </p>
            <div className="lp-cta">
              <Link href={startHref} className="btn">
                {startLabel}
                <IconArrowRight color="#fff" />
              </Link>
              <a href="#how" className="btn outline">
                어떻게 도와주나요?
              </a>
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              회원가입 없음 · 입력한 정보는 내 기기에만 저장돼요
            </p>
          </div>

          <figure className="lp-doc" aria-label="서류 확인 예시">
            <div className="lp-doc-paper">
              <div className="lp-doc-head">
                <span className="mono small">EMPLOYMENT AGREEMENT</span>
                <span className="stamp-risk">위험 3</span>
              </div>
              <p className="lp-doc-line">
                <span className="num-dot">1</span>
                <span>
                  Hourly rate: <mark className="mark">A$22.00 flat, all hours</mark>
                </span>
              </p>
              <p className="lp-doc-line">
                <span className="num-dot">2</span>
                <span>
                  <mark className="mark">Trial shift (unpaid): 2 days</mark>
                </span>
              </p>
              <p className="lp-doc-line">
                <span className="num-dot">3</span>
                <span>
                  Wages paid <mark className="mark">in cash, no payslip</mark>
                </span>
              </p>
              <p className="lp-doc-line faint">Superannuation as required by law.</p>
            </div>
            <div className="lp-doc-note">
              <span className="small" style={{ fontWeight: 700 }}>
                한국으로 치면
              </span>
              <span className="body" style={{ fontSize: 14 }}>
                명세서 없이 최저시급보다 적게 주는 현금 알바예요.
              </span>
              <span className="lp-doc-sum">
                <span className="small muted">이번 주 추정 차액</span>
                <span className="display" style={{ fontSize: 26, color: "var(--risk)" }}>
                  − A$349
                </span>
              </span>
              <span className="small faint">근거: Fair Work Ombudsman · 예시 화면</span>
            </div>
          </figure>
        </div>
      </section>

      <section className="lp-problem">
        <div className="lp-inner">
          <p className="lp-quote">
            “번역은 되는데 이해가 안 되고,
            <br />
            뭘 물어야 할지조차 모르는 채로 서명해요.”
          </p>
          <div className="lp-facts">
            <div>
              <span className="kpi-num">
                41,984<small>명</small>
              </span>
              <span className="small muted">2025년 워킹홀리데이 사증 발급</span>
            </div>
            <div>
              <span className="kpi-num">
                224<small>명</small>
              </span>
              <span className="small muted">2025년 워홀 중 사건·사고 피해 국민</span>
            </div>
            <div>
              <span className="kpi-num">
                2,500<small>명+</small>
              </span>
              <span className="small muted">호주 농장 노동 조사로 임금을 돌려받은 노동자 (FWO Harvest Trail)</span>
            </div>
          </div>
          <p className="small faint" style={{ margin: 0 }}>
            출처: 외교부·재외동포청 국회 제출자료(언론 인용, 2026.10), 호주 Fair Work Ombudsman Harvest Trail Inquiry(2018)
          </p>
        </div>
      </section>

      <section id="how" className="lp-section">
        <div className="lp-inner">
          <div className="lp-section-head">
            <span className="mono small muted">HOW IT WORKS</span>
            <h2 className="display lp-h2">
              찍고 → 따지고 → 계산하고 → <span className="hl">연습하고 → 보낸다</span>
            </h2>
          </div>
          <ol className="lp-steps">
            {STEPS.map((s) => (
              <li key={s.no} className="lp-step">
                <div className="lp-step-top">
                  <span className="mono small muted">{s.no}</span>
                  <span className="lp-step-icon">{s.icon}</span>
                </div>
                <span className="lp-step-verb">{s.verb}</span>
                <span className="lp-step-title">{s.title}</span>
                <span className="body" style={{ fontSize: 13 }}>
                  {s.desc}
                </span>
              </li>
            ))}
          </ol>
          <div className="lp-also">
            <div className="card-wash">
              <span className="lp-step-title">알린다 — 다음 사람을 위한 경고</span>
              <span className="body" style={{ fontSize: 13 }}>
                동의한 제보가 모여 같은 지역 청년의 홈 화면에 ‘내 주변 경고’로 떠요.
              </span>
            </div>
            <div className="card-wash">
              <span className="lp-step-title">물어본다 — 청년 서포터즈 질문함</span>
              <span className="body" style={{ fontSize: 13 }}>
                관리기관이 승인한 청년 서포터즈가 익명 질문에 직접 답해요. 48시간 답이 없으면 AI가 공식 근거로 먼저 답해요.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="trust" className="lp-section lp-dark">
        <div className="lp-inner">
          <div className="lp-section-head">
            <span className="mono small" style={{ color: "#bdbdb8" }}>
              TRUST
            </span>
            <h2 className="display lp-h2">AI를 믿을 수 있게 만든 세 가지</h2>
          </div>
          <div className="lp-trust">
            {TRUST.map((t, i) => (
              <div key={t.title} className="lp-trust-item">
                <span className="lp-trust-no">{i + 1}</span>
                <span className="lp-step-title" style={{ color: "#fff" }}>
                  {t.title}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.65, color: "#d6d6d2" }}>{t.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-inner">
          <div className="lp-section-head">
            <span className="mono small muted">FOR YOU</span>
            <h2 className="display lp-h2">목적에 맞춰 확인할 것이 달라져요</h2>
          </div>
          <div className="lp-personas">
            {PERSONAS.map((p) => (
              <div key={p.title} className="box lp-persona">
                <span className="lp-step-title" style={{ fontSize: 18 }}>
                  {p.title}
                </span>
                <span className="small muted">{p.sub}</span>
                <span className="lp-persona-point">
                  <span className="small faint">주로 보는 것</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{p.point}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-wash">
        <div className="lp-inner lp-two">
          <Link href="/org/login" className="lp-entry box">
            <span className="mono small muted">FOR ORGANIZATIONS</span>
            <span className="lp-step-title" style={{ fontSize: 19 }}>
              대학 국제처 · 청년 지원기관 · 기업 HR · 재외공관
            </span>
            <span className="body" style={{ fontSize: 14 }}>
              모인 위험 신호를 지도와 추이로 보고, 출국 전 오리엔테이션 자료와 파견자 체크리스트를 바로 만들어요.
            </span>
            <span className="lp-entry-go">
              기관 대시보드 보기 <IconArrowRight />
            </span>
          </Link>
          <Link href="/mentor/apply" className="lp-entry box">
            <span className="mono small muted">FOR SUPPORTERS</span>
            <span className="lp-step-title" style={{ fontSize: 19 }}>
              만 19~34세 청년 서포터즈
            </span>
            <span className="body" style={{ fontSize: 14 }}>
              외국어·법학 공부와 해외 경험을 실제 고민 해결에 써 보세요. 증빙 확인 후 관리기관 승인을 거쳐 답변할 수 있어요.
            </span>
            <span className="lp-entry-go">
              서포터즈 신청하기 <IconArrowRight />
            </span>
          </Link>
        </div>
      </section>

      <section className="lp-final">
        <div className="lp-inner lp-final-inner">
          <h2 className="display lp-h2" style={{ textAlign: "center" }}>
            첫 계약서, <span className="hl">혼자 읽지 마세요</span>
          </h2>
          <Link href={startHref} className="btn" style={{ minWidth: 240 }}>
            {startLabel}
            <IconArrowRight color="#fff" />
          </Link>
          <span className="small muted" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
            <IconLock size={14} /> 회원가입 없이, 내 기기에만 저장
          </span>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-inner lp-footer-row">
          <span className="small faint">
            Global-In은 법률 자문이 아니라 확인을 돕는 도구예요. 중요한 결정 전에는 공식 기관에 확인하세요.
          </span>
          <span className="small faint">
            2026 AI 라이프 솔루션 챌린지 ·{" "}
            <a href="https://github.com/lagusdk/Global-In" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
              GitHub
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
