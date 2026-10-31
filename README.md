# Global-In

> 서명하기 전에, 한 번 찍어보세요.

해외로 나가는 국내 청년(학생 · 워홀/구직 · 파견 직장인)을 위한 AI 정착 내비게이션.
2026 AI 라이프 솔루션 챌린지 출품작 — 「AI 라이프 아이디어 챌린지」 수상 후보작 **글로벌-인(Global-In)** 구현.

- 테스트 URL: https://global-in.vercel.app
- 기관용 대시보드: https://global-in.vercel.app/org (데모 로그인 — 아무 값이나 입력)
- 지원 국가: 🇦🇺 호주 · 🇯🇵 일본 (국가 팩 구조라 추가 가능)

## 무엇을 하나요

| 단계 | 화면 | 하는 일 |
|---|---|---|
| 시작 | `/onboarding` | 대상(학생 · 취준생 · 직장인)과 국가(호주 · 일본) · 도시 · 도착일 선택 |
| 찍고 | `/scan` → `/result` | 계약서·렌트 안내·구인 광고·파견 발령서를 사진/텍스트로 넣으면 위험 조항을 형광펜으로 짚고, **한국 기준과 비교해** 설명하고, 공식 근거 링크를 붙인다 (영어·일본어·한국어 원문) |
| 따지고 | `/pay` | 대상·국가별 계산기 — 급여 대조(호주: 최저임금+캐주얼 25%, 일본: 도도부현 최저임금+주 40시간 초과 25%), 학생 근로시간(호주 2주 48시간, 일본 주 28시간), 파견 조건 체크리스트 |
| 연습하고 | `/rehearse` | AI가 사장·집주인·HR 역할을 **현지어(영어/일본어)로** 맡아 버티고, 코치가 표현·근거를 채점하고 압박 발언을 짚는다. 한국어로 말하면 현지어로 바꿔 준다 |
| 보낸다 | `/send` | 계산된 숫자 그대로 현지어/한국어 메시지 초안 + 국가별 도움 기관 |
| 알린다 | `/share` | **사용자가 고른 항목만** 익명으로 제보 → 같은 지역 사람에게 경고, 기관 대시보드에 집계 |
| 물어본다 | `/ask` | **멘토 질문함** — 익명으로 질문, 🔒을 걸면 멘토만 열람. AI가 질문을 요약·분류하고 관련 근거를 붙여 멘토에게 전달 |
| 멘토 | `/mentor/login` → `/mentor` | **멘토 서포터즈**(외국어·법학 전공 대학생) — AI 요약·근거·답변 초안을 보고 검토해서 답변. 활동 인증서까지 진행도 표시 (데모 로그인) |
| 알림 | 홈 상단 종 | 최근 서류 위험, 내 주변 경고, 다음 할 일 |
| 기관 | `/org/login` → `/org` | 대학 국제처 · 청년·고용 지원기관 · 기업 HR · 재외공관 보기, 호주/일본 지도, 소속 인원 반영, 교육 자료 자동 생성 |

## 설계 원칙

- **규칙 엔진 + LLM 이중 구조** — `ruleEngine.ts`(호주) · `ruleEngineJp.ts`(일본)가 정규식으로 위험 후보를 먼저 찾고, LLM은 지식팩(`src/lib/kb/`) 규칙 id에 근거해서만 판정한다. 근거 없는 AI 판정은 '주의' 이하로 낮추고 "공식 근거 없음"으로 표시한다.
- **숫자는 코드가 계산** — 최저임금·가산·차액은 `src/lib/wage.ts`에서 계산한다. AI는 서류에서 숫자를 읽기만 한다.
- **오프라인에서도 동작** — API 키가 없거나 모든 모델이 실패하면 규칙 엔진·템플릿·대본으로 답한다.
- **모델 예비 전환** — 용도별 모델 목록을 앞에서부터 시도하고, 단종(410)·오류·시간 초과면 다음 모델로 넘어간다.
- **동의 기반 · 최소 수집** — 제보는 사용자가 버튼을 누를 때만, 지역·업종·어려움 유형만. 5건 미만 지역은 표시하지 않는다(k-익명성).
- **AI + 사람** — 멘토 질문함에서 AI는 요약·분류·근거 연결·초안까지만 하고, 답변은 멘토가 검토해서 올린다. 잠긴 질문은 질문자 기기의 토큰과 멘토 화면에서만 내용이 보인다.
- **팩 구조** — 대상(`personas.ts`)·국가(`kb/countries.ts`, `kb/au.ts`, `kb/jp.ts`)·리허설 상황(`scenarios.ts`)·예시 서류(`samples.ts`)를 추가하는 것만으로 확장된다.

## 실행

```bash
npm install
npm run dev                  # http://localhost:3000
```

`.env` 파일을 만들고 아래 '환경 변수' 표의 값을 넣는다 (키가 없으면 오프라인 모드).

```bash
npm test          # 규칙 엔진(호주·일본)·급여 계산 단위 테스트
npm run build     # 프로덕션 빌드
```

### 환경 변수

| 이름 | 설명 |
|---|---|
| `NVIDIA_API_KEY` | [NVIDIA Build](https://build.nvidia.com) API 키. 비우면 오프라인 모드 |
| `NVIDIA_BASE_URL` | 기본값 `https://integrate.api.nvidia.com/v1` |
| `NVIDIA_TEXT_MODEL` | 분석·메시지·교육 자료용 모델 (쉼표로 여러 개 = 앞에서부터 시도) |
| `NVIDIA_FAST_MODEL` | 리허설 대화용 빠른 모델 |
| `NVIDIA_VISION_MODEL` | 서류 사진 판독용 비전 모델 |
| `FORCE_OFFLINE` | `1`이면 키가 있어도 LLM을 부르지 않음 |

모델 환경 변수는 비워 두면 코드 기본값(`src/lib/llm.ts`의 `MODELS`)을 쓴다. 2026-10-31 비교 결과 기본값은 아래와 같다. Nemotron 계열은 내부 추론(thinking)을 끄고 호출한다(켜면 3~7배 느려지고 빈 답이 오기도 함).

| 용도 | 기본 모델 순서 |
|---|---|
| 분석·메시지 | `nvidia/nemotron-3.5-super-vl-120b-a12b` → `nvidia/nemotron-3-ultra-550b-a55b` → `openai/gpt-oss-20b` |
| 리허설 | `nvidia/nemotron-3.5-bolt-e4b` → `nvidia/nemotron-3-ultra-550b-a55b` |
| 사진 판독 | `nvidia/nemotron-3.5-super-vl-120b-a12b` → `meta/llama-3.2-90b-vision-instruct` |

`/api/health`에서 현재 모드·모델·기준일을 확인할 수 있다.

> **API 키 만료일: 2027-04-30** — NVIDIA Build 키가 이 날짜에 만료된다. 만료 전에 새 키를 발급받아 로컬 `.env`와 Vercel 환경 변수(`NVIDIA_API_KEY`)를 함께 바꿔야 한다. 만료돼도 앱은 오프라인 모드(규칙 엔진)로 계속 동작한다.

## 배포

- 테스트 URL: https://global-in.vercel.app
- Vercel이 `main` 브랜치 푸시마다 자동 배포한다. API 키는 Vercel 프로젝트 **Settings → Environment Variables**에 넣는다 (`.env`는 커밋하지 않는다).
- 앱 아이콘: `src/lib/brandIcon.ts` 한 곳에서 관리 (탭 아이콘 `icon.svg`, iPhone `apple-icon`, 매니페스트 `/icon-512`).

## 구조

```
src/
  app/                   화면(App Router)과 API 라우트
    api/analyze          서류 분석 (비전 판독 → 규칙 엔진 → LLM 근거 판정 → 병합)
    api/rehearse         역할극 + 코치 (현지어)
    api/message          메시지 초안 (현지어 + 한국어)
    api/signals          익명 제보 수집·집계 (?country=AU|JP)
    api/brief            기관용 교육 자료 생성
    api/questions        멘토 질문함 (등록·목록·멘토 답변, AI 분류)
    org/login, org       기관 데모 로그인 · 대시보드
    ask, mentor          멘토 질문함 · 멘토 서포터즈
  components/            CountryMap(호주·일본 지도), Notifications, 공통 UI
  lib/
    kb/countries.ts      국가·도시·통화
    kb/au.ts, kb/jp.ts   국가별 지식팩 (규칙·근거 링크·기준 금액)
    kb/index.ts          국가 팩 등록
    ruleEngine.ts        호주 규칙 + 국가 분기 / ruleEngineJp.ts 일본 규칙 / ruleUtil.ts 공용
    wage.ts              급여·근로시간 계산 (호주·일본)
    analyze.ts           분석 파이프라인
    llm.ts               NVIDIA 클라이언트 (모델 예비 전환, thinking 끄기)
    personas.ts          대상별 팩 (국가별 비자·할 일)
    scenarios.ts         리허설 상황 (호주 영어 · 일본 일본어)
    signals.ts           제보 집계 (샘플 데이터 포함)
    questions.ts         질문 저장·AI 분류(요약·근거·긴급·초안)·공개 범위
```

## 데이터와 한계

- **학습시키지 않는다.** 사전학습된 LLM을 API로 쓰고, 판정 근거는 직접 정리한 지식팩(공식 기관 링크 포함)으로 고정한다.
- 기준 금액: 호주 `AU_PAY.effectiveFrom`(2025-07-01), 일본 `JP_PAY.effectiveFrom`(2025년 10월 개정분). 매년 바뀌므로 배포 전 [Fair Work Ombudsman](https://www.fairwork.gov.au/pay-and-wages/minimum-wages) · [후생노동성](https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/)에서 확인해 갱신해야 한다.
- 업종별 어워드(호주)·심야/휴일 할증(일본)은 아직 반영하지 않아 실제 받아야 할 금액보다 적게 계산될 수 있다(보수적 추정).
- 대시보드 수치는 **샘플 데이터**에 이번 세션의 실제 제보를 더한 것이다. 제보·질문은 서버 메모리에만 저장된다(서버 재시작 시 예시만 남음). 기관·멘토 로그인은 인증 없는 데모다.
- 예시 서류의 사업장·인물은 가상이다.
- 법률 자문이 아니라 확인을 돕는 도구다.
