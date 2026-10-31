# Global-In

> 서명하기 전에, 한 번 찍어보세요.

해외로 나가는 국내 청년(학생 · 워홀/구직 · 파견 직장인)을 위한 AI 정착 내비게이션.
2026 AI 라이프 솔루션 챌린지 출품작 — 「AI 라이프 아이디어 챌린지」 수상 후보작 **글로벌-인(Global-In)** 구현.

## 무엇을 하나요

| 단계 | 화면 | 하는 일 |
|---|---|---|
| 찍고 | `/scan` → `/result` | 계약서·렌트 문자·구인 광고·파견 발령서를 사진/텍스트로 넣으면 위험 조항을 형광펜으로 짚고, **한국 기준과 비교해** 설명하고, 공식 근거 링크를 붙인다 |
| 따지고 | `/pay` | 대상별 계산기 — 취준생: 급여 대조(덜 받은 금액), 학생: 학생비자 2주 48시간, 직장인: 파견 조건 체크리스트 |
| 연습하고 | `/rehearse` | AI가 사장·집주인·HR 역할을 맡아 버티고, 코치가 표현·근거를 채점하고 압박 발언을 짚어 준다 |
| 보낸다 | `/send` | 계산된 숫자 그대로 영어/한국어 메시지 초안 + 도움 기관 안내 |
| 알린다 | `/share` | **사용자가 고른 항목만** 익명으로 제보 → 같은 지역 사람에게 경고, 기관 대시보드에 집계 |
| 기관 | `/org` | 대학 국제처 · 청년·고용 지원기관 · 기업 HR · 재외공관 보기, 호주 지도, 교육 자료 자동 생성 |

## 설계 원칙

- **규칙 엔진 + LLM 이중 구조** — `src/lib/ruleEngine.ts`가 정규식으로 위험 후보를 먼저 찾고, LLM은 지식팩(`src/lib/kb/au.ts`) 규칙 id에 근거해서만 판정한다. 근거 없는 AI 판정은 '주의' 이하로 낮추고 "공식 근거 없음"으로 표시한다.
- **숫자는 코드가 계산** — 최저임금·가산·차액은 `src/lib/wage.ts`에서 계산한다. AI는 서류에서 숫자를 읽기만 한다.
- **오프라인에서도 동작** — API 키가 없거나 LLM이 실패하면 규칙 엔진·템플릿으로 답한다. 시연이 끊기지 않는다.
- **동의 기반 · 최소 수집** — 제보는 사용자가 버튼을 누를 때만, 지역·업종·어려움 유형만. 5건 미만 지역은 표시하지 않는다(k-익명성).
- **확장 구조** — 대상(`personas.ts`)과 국가(`kb/*.ts`)는 팩으로 분리되어 있어 추가만 하면 된다.

## 실행

```bash
npm install
cp .env.example .env.local   # NVIDIA_API_KEY 입력 (없으면 오프라인 모드)
npm run dev                  # http://localhost:3000
```

```bash
npm test          # 규칙 엔진·급여 계산 단위 테스트
npm run build     # 프로덕션 빌드
```

### 환경 변수

| 이름 | 설명 |
|---|---|
| `NVIDIA_API_KEY` | [NVIDIA Build](https://build.nvidia.com) API 키. 비우면 오프라인 모드 |
| `NVIDIA_BASE_URL` | 기본값 `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_TEXT_MODEL` | 분석·리허설·메시지용 텍스트 모델 |
| `NVIDIA_VISION_MODEL` | 서류 사진 판독용 비전 모델 |
| `FORCE_OFFLINE` | `1`이면 키가 있어도 LLM을 부르지 않음 |

`/api/health`에서 현재 모드와 모델을 확인할 수 있다.

> **API 키 만료일: 2027-04-30** — NVIDIA Build 키가 이 날짜에 만료된다. 만료 전에 새 키를 발급받아 로컬 `.env`와 Vercel 환경 변수(`NVIDIA_API_KEY`)를 함께 바꿔야 한다. 만료돼도 앱은 오프라인 모드(규칙 엔진)로 계속 동작한다.

## 배포

- 테스트 URL: https://global-in.vercel.app
- Vercel이 `main` 브랜치 푸시마다 자동 배포한다. API 키는 Vercel 프로젝트 **Settings → Environment Variables**에 넣는다 (`.env`는 커밋하지 않는다).

## 구조

```
src/
  app/                 화면(App Router)과 API 라우트
    api/analyze        서류 분석 (비전 판독 → 규칙 엔진 → LLM 근거 판정 → 병합)
    api/rehearse       역할극 + 코치
    api/message        메시지 초안
    api/signals        익명 제보 수집·집계
    api/brief          기관용 교육 자료 생성
  lib/
    kb/au.ts           호주 지식팩 (규칙·근거 링크·기준 금액)
    ruleEngine.ts      위험 조항 탐지
    wage.ts            급여·근로시간 계산
    analyze.ts         분석 파이프라인
    personas.ts        대상별 팩 (학생 · 취준생 · 직장인)
    scenarios.ts       리허설 상황
    signals.ts         제보 집계 (샘플 데이터 포함)
```

## 데이터와 한계

- 기준 금액은 `AU_PAY.effectiveFrom`(2025-07-01) 값이다. 호주 최저임금은 매년 7월 1일 바뀌므로 배포 전 [Fair Work Ombudsman](https://www.fairwork.gov.au/pay-and-wages/minimum-wages)에서 확인해 갱신해야 한다.
- 업종별 어워드(Award) 시급·주말/야간 가산은 아직 반영하지 않아 실제 받아야 할 금액보다 적게 계산될 수 있다(보수적 추정).
- 대시보드 수치는 **샘플 데이터**에 이번 세션의 실제 제보를 더한 것이다. 제보는 서버 메모리에만 저장된다.
- 예시 서류의 사업장·인물은 가상이다.
- 법률 자문이 아니라 확인을 돕는 도구다.
