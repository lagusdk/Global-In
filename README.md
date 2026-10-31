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
| 시작 | `/onboarding` | 체류 목적(학생 · 취준생 · 직장인)과 **비자를 따로** 고르고, 국가(호주 · 일본) · 도시 · 도착일 선택 |
| 찍고 | `/scan` → `/result` | **지금 상황(서명 전 · 일하는 중 · 이미 피해)**을 고르고 계약서·렌트 안내·구인 광고·파견 발령서를 넣으면, 위험 조항을 형광펜으로 짚고 **현지 근로·주거 기준을 한국어로** 설명한다. 근거 링크 옆에 **적용 조건(대상·기준일)** 표시. 업로드 직전에 전송·보관·가림 안내 |
| 따지고 | `/pay` | 대상·국가별 계산기 — 급여 대조(호주: 최저임금+캐주얼 25%, 일본: 도도부현 최저임금+주 40시간 초과 25%)는 **근무 날짜에 맞는 기준**으로 계산하고, 기준이 오래됐으면 경고 + 최신 시급 직접 입력. 결과는 "입력 조건에 따른 추정 차액". 학생 근로시간(호주 2주 48시간, 일본 주 28시간), 파견 조건 체크리스트 |
| 연습하고 | `/rehearse` | AI가 사장·집주인·HR 역할을 **현지어(영어/일본어)로** 맡아 버티고, 코치가 표현·근거를 채점하고 압박 발언을 짚는다. 한국어로 말하면 현지어로 바꿔 준다. **급여 계산에서 확정한 숫자와 상황**을 이어받아 모범 문장이 바뀐다 |
| 보낸다 | `/send` | 상황별로 달라진다 — 서명 전: **수정 요청 문장**, 일하는 중: 정산 요청, 이미 피해: **증거 체크리스트 + 상담용 요약**. 국가별 도움 기관(호주는 워킹홀리데이 인포센터 임금체불 안내 포함) |
| 알린다 | `/share` | **사용자가 고른 항목만** 익명으로 제보 → 같은 지역 사람에게 경고, 기관 대시보드에 집계 |
| 물어본다 | `/ask` | **질문함** — 익명으로 질문, 🔒을 걸면 승인된 서포터즈만 열람. 욕설·개인정보는 등록 전에 걸러진다. **48시간 안에 서포터즈 답변이 없으면 AI가 지식팩 근거로 대신 답하고 'AI 답변'으로 표시** |
| 서포터즈 | `/mentor/apply` → `/mentor` | **서포터즈 신청** — 만 19~34세 청년이면 누구나(대학생 한정 아님). 증빙(재학·졸업·재직증명서) 제출 → 관리기관 승인 후에만 답변. 답변은 서포터즈가 직접 쓴다. 활동 인증서까지 진행도 표시 |
| 관리기관 | `/admin` | 서포터즈 신청 심사 (나이·상태·분야·증빙 확인 → 승인/반려 사유) — 데모: 인증 없음 |
| 알림 | 홈 상단 종 | 최근 서류 위험, 내 주변 경고, 다음 할 일 |
| 기관 | `/org/login` → `/org` | 대학 국제처 · 청년·고용 지원기관 · 기업 HR · 재외공관 보기, 호주/일본 지도, 소속 인원 반영, 교육 자료 자동 생성 |

## 설계 원칙

- **규칙 엔진 + LLM 이중 구조** — `ruleEngine.ts`(호주) · `ruleEngineJp.ts`(일본)가 정규식으로 위험 후보를 먼저 찾고, LLM은 지식팩(`src/lib/kb/`) 규칙 id에 근거해서만 판정한다. 근거 없는 AI 판정은 '주의' 이하로 낮추고 "공식 근거 없음"으로 표시한다.
- **숫자는 코드가 계산** — 최저임금·가산·차액은 `src/lib/wage.ts`에서 계산한다. AI는 서류에서 숫자를 읽기만 한다.
- **오프라인에서도 동작** — API 키가 없거나 모든 모델이 실패하면 규칙 엔진·템플릿·대본으로 답한다.
- **모델 예비 전환** — 용도별 모델 목록을 앞에서부터 시도하고, 단종(410)·오류·시간 초과면 다음 모델로 넘어간다.
- **동의 기반 · 최소 수집** — 제보는 사용자가 버튼을 누를 때만, 지역·업종·어려움 유형만. 5건 미만 지역은 표시하지 않는다(k-익명성).
- **AI는 필요한 곳에만** — 질문함 답변은 서포터즈(사람)가 직접 쓴다. AI는 욕설·개인정보 필터와 '48시간 무응답 시 근거 기반 대체 답변'에만 쓴다. 잠긴 질문은 질문자 기기의 토큰과 승인된 서포터즈 화면에서만 내용이 보인다.
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
| `FIREBASE_PROJECT_ID` · `FIREBASE_CLIENT_EMAIL` · `FIREBASE_PRIVATE_KEY` | Firebase **서비스 계정 키**(서버용). 셋 다 있으면 질문·제보·신청서를 Firestore에 저장, 없으면 서버 메모리. 웹 설정값(apiKey 등)은 쓰지 않는다. 키에 따옴표·`
` 문자열이 섞이거나 줄바꿈이 빠져도 코드가 PEM으로 정리한다. Firestore 호출이 실패하면 메모리로 넘어가고(5분 뒤 재시도) `/api/health`의 `storage`·`storageError`로 확인 |

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
    api/questions        질문함 (등록·목록·서포터즈 답변, 필터, 48시간 AI 대체 답변)
    api/mentors          서포터즈 신청 · 본인 심사 상태
    api/admin/applications  관리기관 심사 (목록·승인·반려)
    org/login, org       기관 데모 로그인 · 대시보드
    ask, mentor, admin   질문함 · 서포터즈 신청/답변 · 관리기관 심사
  components/            CountryMap(호주·일본 지도), Notifications, 공통 UI
  lib/
    kb/countries.ts      국가·도시·통화
    kb/au.ts, kb/jp.ts   국가별 지식팩 (규칙·근거 링크·기준 금액)
    kb/index.ts          국가 팩 등록
    ruleEngine.ts        호주 규칙 + 국가 분기 / ruleEngineJp.ts 일본 규칙 / ruleUtil.ts 공용
    wage.ts              급여·근로시간 계산 (호주·일본)
    payBasis.ts          근무 날짜별 최저임금 기준 이력 · 오래된 기준 감지
    stageMessages.ts     서명 전 수정 요청 · 피해 발생 상담용 요약 템플릿
    db.ts                저장소 (Firebase 키가 있으면 Firestore, 없으면 메모리) — 질문·제보·신청서
    moderation.ts        질문·답변 욕설·개인정보 필터
    analyze.ts           분석 파이프라인
    llm.ts               NVIDIA 클라이언트 (모델 예비 전환, thinking 끄기)
    personas.ts          대상별 팩 (국가별 비자·할 일)
    scenarios.ts         리허설 상황 (호주 영어 · 일본 일본어)
    signals.ts           제보 집계 (샘플 데이터 포함)
    questions.ts         질문 저장·공개 범위·48시간 AI 대체 답변
    applications.ts      서포터즈 신청·나이(19~34)·증빙·승인 / applicationShared.ts 화면 공용 타입
```

## 데이터와 한계

- **학습시키지 않는다.** 사전학습된 LLM을 API로 쓰고, 판정 근거는 직접 정리한 지식팩(공식 기관 링크 포함)으로 고정한다.
- 기준 금액: `payBasis.ts`에 확인된 개정 이력(호주 2024·2025년 7월, 일본 도쿄·오사카·후쿠오카 2024·2025년 개정)만 있다. 근무 날짜가 다음 개정 예정일을 지나면 화면에서 경고하고 공식 값을 직접 입력받는다. 매년 바뀌므로 배포 전 [Fair Work Ombudsman](https://www.fairwork.gov.au/pay-and-wages/minimum-wages) · [후생노동성](https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/)에서 확인해 갱신해야 한다.
- 업종별 어워드(호주)·심야/휴일 할증(일본)은 아직 반영하지 않아 실제 받아야 할 금액보다 적게 계산될 수 있다(보수적 추정).
- 대시보드 수치는 **샘플 데이터**에 이번 세션의 실제 제보를 더한 것이다. 제보·질문·신청서는 Firebase 키가 있으면 Firestore에, 없으면 서버 메모리에 저장된다. 기관 로그인·관리기관 심사 화면은 인증 없는 데모이고, 데모에서는 증빙 파일 자체를 저장하지 않고 이름만 기록한다.
- 예시 서류의 사업장·인물은 가상이다.
- 법률 자문이 아니라 확인을 돕는 도구다.
