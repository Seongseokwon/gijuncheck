# Design Brief

작성 근거: `src/`, `docs/`, `.claude/agents/` 코드·문서 직접 열람 (2026-07-31 기준). Next.js 15 App Router + TypeScript + Tailwind, `output: 'export'` 전 페이지 SSG(서버 런타임 없음).

## A. 확정 사실

### 기능 — 라우트 (`src/lib/routes.ts`)

| 경로 | ready | 구현 파일 |
|---|---|---|
| `/` | true | `src/app/page.tsx` |
| `/health-insurance/dependent/` | true | `DependentJudge.tsx` |
| `/health-insurance/regional-premium/` | true | `RegionalPremiumCalc.tsx` |
| `/health-insurance/voluntary-continuation/` | true | `VoluntaryComparison.tsx` |
| `/health-insurance/guides/*` 6편 | true | `src/app/health-insurance/guides/*/page.tsx` (각 290~342줄) |
| `/national-pension/early-vs-deferred/` | false | 미구현, sitemap 제외 |
| `/employment-insurance/parental-leave-benefit/` | false | 미구현, sitemap 제외 |
| `/privacy/` `/terms/` `/contact/` | true, `noindex:true` | sitemap 제외 |

- 판정기(`DependentJudge.tsx`) 입력 필드: 관계·동거·혼인·장애(4, 형제자매 선택 시 나이 +1) + 소득 5종(사업·근로·연금·금융·기타) + 사업자등록 + 재산세과세표준 = 최대 11개, 단일 카드(`<Card title="대상자 정보">`) 안에 배치. 전부 선택형(Select) 또는 자유 입력이며 HTML `required` 속성 없음(미입력 시 0 처리).
- 보험료 계산기(`RegionalPremiumCalc.tsx`)는 입력을 카드 2개(연간 소득 / 재산)로 분리. 소득 5필드(사업·금융·기타=100%, 근로·연금=50% 반영률 명시) + 재산 1필드.
- 임의계속가입 비교(`VoluntaryComparison.tsx`)는 카드 1개, 필드 6개(보수월액평균·직장가입개월수·재산·연금/사업/금융소득).
- 이동 경로(쿼리스트링): 판정 탈락 → 보험료 계산(`?income=&property=`) → 임의계속가입 비교(`?property=`). 헤더 nav는 `ready` 도구만 노출. 판정기에서 넘긴 소득은 종류 구분 없이 `business`에만 채워짐(주석: "반영률 높은 쪽에 넣어 과소 계산 회피").
- 판정 로직 `src/lib/dependent/judge.ts`(3단: 부양→소득→재산, 순차 조기 종료), 보험료 `src/lib/premium/regional.ts`, 재산점수 60등급표 `src/lib/constants/property-score-table.ts`(221줄), 기준값 전부 `src/lib/constants/2026.ts`. 숫자 리터럴을 로직 파일에 직접 쓰지 않는 구조.
- 저장·전송: `/privacy/` 명시 "입력값은 브라우저에서만 처리, 서버 전송·저장 없음". `src/lib/analytics.ts`가 이벤트 파라미터를 boolean/enum 타입으로 강제(TypeScript 인터페이스로 number 필드 차단), 3개 이벤트(`judge_complete`, `premium_calculate`, `voluntary_compare`)만 존재하며 금액은 포함 안 함. `Analytics.tsx`는 `NEXT_PUBLIC_GA_ID` 환경변수 없으면 스크립트 자체를 렌더링하지 않음(값은 `.env.example`에 비어 있음, 저장소로는 실제 배포 설정 확인 불가). `track()`은 `gtag` 부재 시 조용히 무시 — 수집 실패가 화면에 드러나지 않음.
- `src` 전체에서 adsbygoogle 등 AdSense 관련 코드 0건. 광고 게재는 코드로 구현되어 있지 않음(문서 8장의 광고 배치 계획은 코드 미반영 상태).
- 테스트: `npm test` 실행 결과 3개 파일·114개 통과(`format.test.ts` 17, `judge.test.ts` 48, `regional.test.ts` 49). `docs/02-다음작업-타임라인.md`는 "79개"로 기록 — 문서가 코드보다 낡음(괴리 1).

### 문서-코드 괴리 (요청 2 대응)

| 문서 주장 | 코드 확인 결과 |
|---|---|
| 01장: URL을 한글 경로로 설계(`/건강보험/피부양자-자격판정/`) | `routes.ts` 전체 영문 경로. `02-다음작업-타임라인.md`가 "한글 경로 canonical 불일치 — 해결(영문 전환)"로 자체 정정. 01·02 문서가 서로 모순, 최신 상태는 코드와 02가 일치 |
| 02장: "지역가입자 보험료 페이지: 로직만 있고 페이지 없음", "임의계속가입 페이지: 로직만 있고 페이지 없음" | 두 페이지 모두 존재하고 `ready:true`, sitemap에 포함됨. 문서가 현재 코드 상태보다 과거 시점 |
| 01장 리스크표: "재산점수 등급표 부정확 → 고시 원문 확인 전까지 보험료 페이지 미공개" | `VERIFIED_AGAINST_NHIS = false`(공단 대조 미완료) 상태에서 `regionalPremium.ready = true`로 이미 공개됨. `ReferenceOnlyNotice` 배지로 완화만 하고 비공개 원칙은 적용되지 않음 |
| 01장: "본 판정은 모의 결과이며..." 면책 문구를 반드시 넣을 고정 문구로 지정 | 실제로는 두 군데에 서로 다른 문자열로 존재. `constants/2026.ts`의 `DISCLAIMER`(도구 3개가 import)와 `layout.tsx` 푸터(하드코딩 별도 문장, import 없음)가 표현이 다름 |
| 02장: "테스트 79개 통과해야 함" | 현재 114개 |
| 03장(디자인 제안): 서술은 전부 의견·제안이며 검증 가능한 사실 주장 없음. 색상 `#17324D` 등은 `design-preview/index.html`에만 구현, `src/` 앱에는 미반영 | `src/app/globals.css`, `tailwind.config.ts`는 커스텀 팔레트 없음(`extend: {}`), 실제 앱은 Tailwind 기본 slate/emerald/rose/amber 사용 |

### 선결 결정 (런치 공개 범위)

- 지역보험료 계산기(`RegionalPremiumCalc.tsx` / `/health-insurance/regional-premium/`): 공단 대조 완료(`VERIFIED_AGAINST_NHIS = true`) 전까지 비공개. 현재 `routes.ts`는 `ready: true` — 이 결정에 따라 `ready: false`로 전환 필요(코드 변경은 미실행, 결정만 기록).
- 임의계속가입 비교(`VoluntaryComparison.tsx` / `/health-insurance/voluntary-continuation/`): 동일한 미검증 재산점수·전월세 환산 수치(B-1, B-2)를 내부적으로 사용하므로 함께 비공개.
- 피부양자 판정(`DependentJudge.tsx` / `/health-insurance/dependent/`): `src/lib/dependent/judge.ts`의 import를 확인한 결과 `../constants/2026`(BASIS·INCOME·PROPERTY·RATE·SIBLING_AGE·YEAR), `./types`, `../format` 3곳뿐이며 `property-score-table.ts`(B-1의 미검증 60등급 A안이 있는 파일)를 참조하지 않는다. 재산요건 판정은 `PROPERTY.SAFE_LIMIT`(5.4억 단순 문턱값) 하나만 쓰고 60등급 부과점수와는 무관하다. 따라서 공개 유지.
- 국민연금·고용보험(`/national-pension/early-vs-deferred/`, `/employment-insurance/parental-leave-benefit/`): `routes.ts`상 `ready:false`, sitemap 제외. 로드맵에는 포함되어 있으나 착수 시점 미정.
- 런치 공개 범위: 피부양자 판정 1개 + 가이드 6편. (지역보험료 계산기·임의계속가입 비교는 비공개 전환, 국민연금·고용보험은 미착수)

### 시각 체계 현재값 (Tailwind 기본 팔레트, `tailwind.config.ts`에 커스텀 확장 없음)

| 항목 | 값 | 위치 |
|---|---|---|
| 배경(본문) | bg-slate-50 `#f8fafc` | `layout.tsx` body |
| 배경(카드/헤더/푸터) | bg-white `#ffffff` | `ui.tsx` Card, `layout.tsx` header/footer |
| 기본 텍스트 | text-slate-900 `#0f172a` | 전역 |
| 보조 텍스트 | text-slate-600 `#475569` | 설명문 |
| 힌트/근거 텍스트 | text-slate-500 `#64748b` | Field hint, 근거 조항 |
| 저채도 텍스트 | text-slate-400 `#94a3b8` | placeholder, "준비 중" 배지, 일부 hint |
| 성공 | bg-emerald-50 `#ecfdf5` / 아이콘 bg-emerald-500 `#10b981` | 판정 결과(자격 인정) |
| 탈락 | bg-rose-50 `#fff1f2` / 아이콘 bg-rose-500 `#f43f5e` | 판정 결과(탈락) |
| 참고용 배지 | bg-amber-50 테두리 amber-200 텍스트 amber-900 | `ReferenceOnlyNotice` |
| 버튼 | bg-slate-900 텍스트 white, hover slate-800 | `SubmitButton` |
| 본문 크기 | text-sm(14px/20px) 대다수 | 라벨·설명·본문 전반 |
| 보조 크기 | text-xs(12px/16px) | 힌트·근거·면책·푸터 |
| 제목 크기 | text-2xl(24px) h1 / text-lg(18px) 결과 헤드라인 / Card 제목 text-base(16px) | `page.tsx`, `guide.tsx`, `ui.tsx` |
| 입력 글자 크기 | 모바일 text-base(16px) → sm 이상 text-sm(14px) | `inputCls`, iOS 자동확대 방지 목적 명시 |
| 콘텐츠 최대폭 | max-w-3xl = 768px | `layout.tsx` |
| Breakpoint | sm(640px)만 실사용. lg:grid-cols-3 1곳(소득 5필드 그리드) | `DependentJudge.tsx` |
| Radius | rounded-md(6px) 인풋/버튼, rounded-lg(8px) 카드 | `ui.tsx` |
| 폰트 | 외부 웹폰트 미로드. system-ui 중심 스택 사용 | `src/app/globals.css`, ADR-003 |
| iOS 대응 | color-scheme: light 강제, select 화살표 직접 그림, number spinner 제거 | `globals.css` |

### 대비 기준선 (`docs/design-debate/tools/contrast.py` 계산, sRGB WCAG 공식)

| 조합 | 대비 | 본문 AA(4.5) | 큰글씨 AA(3.0) |
|---|---:|---|---|
| slate-900 on slate-50 (본문 기본) | 17.06:1 | AAA | AAA |
| slate-900 on white (카드 제목) | 17.85:1 | AAA | AAA |
| slate-600 on white (보조 설명) | 7.58:1 | AAA | AAA |
| slate-500 on white (힌트/근거 조항) | 4.76:1 | AA | AAA |
| slate-400 on white (placeholder, "준비 중", 일부 hint) | 2.56:1 | 실패 | 실패 |
| white on slate-900 (버튼) | 17.85:1 | AAA | AAA |
| slate-700 on emerald-50 (성공 본문) | 9.83:1 | AAA | AAA |
| slate-900 on emerald-50 (성공 제목) | 16.95:1 | AAA | AAA |
| slate-700 on rose-50 (탈락 본문) | 9.43:1 | AAA | AAA |
| slate-900 on rose-50 (탈락 제목) | 16.25:1 | AAA | AAA |
| amber-900 on amber-50 (참고용 배지) | 8.75:1 | AAA | AAA |
| amber-900 on amber-100 (테스트배포 배너) | 8.15:1 | AAA | AAA |
| white on emerald-500 (체크 아이콘, aria-hidden + sr-only 텍스트 병기) | 2.54:1 | 실패 | 실패 |
| white on rose-500 (X 아이콘, aria-hidden + sr-only 텍스트 병기) | 3.67:1 | 실패 | AA |
| slate-500 on slate-50 (푸터) | 4.55:1 | AA | AAA |
| slate-300 border on white (인풋 테두리, 비텍스트 3:1 기준) | 1.48:1 | 실패(3:1 미만) | 해당없음 |

굵게 표시가 필요한 항목: slate-400/white 조합(placeholder·비활성 라벨·일부 hint)이 본문·큰글씨 기준 모두 실패. 두 아이콘 색상은 aria-hidden 처리되어 텍스트 대체수단(sr-only)이 있으나, 시각적으로만 상태를 구분하려는 사용자에게는 대비가 낮다.

### 갱신 표면 (법령·요율 개정 시 손댈 지점)

| 유형 | 개수 | 비고 |
|---|---:|---|
| `src/lib/constants/` 상수 파일 내 연도·금액 리터럴 | 2개 파일(`2026.ts`, `property-score-table.ts`) | 설계상 단일 진입점 |
| 가이드 페이지(`guides/*/page.tsx`) 화면 문구에 박힌 숫자(연도·만원·요율 등) | 34건 (grep, 6개 파일 합산) | 상수 미참조 하드코딩 다수 포함 |
| 도구 페이지·컴포넌트(3개 도구 페이지 + 3개 컴포넌트 + ui.tsx) 화면 문구 중 숫자 포함 파일 | 7개 파일에서 매치 | 대다수는 toManwon·toEok로 상수에서 파생되지만 힌트 문장("연 1,000만원 이하면 제외", "500만원까지" 등)은 상수와 별개로 텍스트로 직접 기술된 경우가 섞여 있음 |
| 면책 문구 정의 지점 | 2곳, 문자열 불일치(`constants/2026.ts` DISCLAIMER, `layout.tsx` 푸터 하드코딩) | 위 "문서-코드 괴리" 표 참조 |

## B. 미검증 전제

| # | 전제 | 코드상 근거 | 참이 아닐 경우의 파급 |
|---|---|---|---|
| 1 | 재산 과세표준이 공제 후 0원 이하일 때 부과점수는 1등급 22점(0점이 아님) | `property-score-table.ts`의 `ZERO_PROPERTY_NOTE`: "A안 적용 — 공단 대조로 확정 필요" | 무재산 저소득층(주 타깃인 은퇴자 포함) 보험료가 실제보다 부풀려질 수 있음 |
| 2 | 전월세 보증금·월세 환산 없이 "환산 완료된 재산금액"을 사용자가 직접 계산해 입력할 수 있다 | `RENT_CONVERSION_NOTE`, `RegionalPremiumCalc.tsx` 힌트 텍스트로만 안내, 계산 보조 UI 없음 | 무주택 세입자(임의계속가입 비교 대상과 겹침)의 오입력 가능성 |
| 3 | 지역보험료 계산 결과를 `crossChecked:false` 상태에서도 배지로 완화하며 공개해도 된다 | `ReferenceOnlyNotice`, `VERIFIED_AGAINST_NHIS = false`인데 `routes.ts`에서 `ready:true` | 공단 실제 고지액과 차이 발생 시 신뢰 손상. 01장이 "치명" 리스크로 명시한 상황과 직접 충돌 |
| 4 | 판정기 입력을 한 화면(최대 11필드)에 두는 것이 이탈을 줄인다 | `DependentJudge.tsx` 주석 "위저드로 쪼개면 이탈한다" — 근거 데이터는 코드 내 없음, 이벤트도 완료 시점만 수집(중도 이탈률 미수집) | 실측 없이 채택된 구조. 실제로는 이탈이 더 클 수도 있음 |
| 5 | 40~60대가 주 사용자다 | 코드에 연령 타깃팅 로직·문구 없음. 글자 크기(text-sm 14px 위주)·터치 타깃 크기에 대한 연령 특화 처리 흔적 없음 | 실제 사용자층이 다르면 글자 크기·정보 밀도 결정 근거 자체가 무효화됨 |
| 6 | 11월에 트래픽 피크가 발생한다 | 코드·문서 모두 과거 실측 데이터 없음(신규 사이트, 미배포) | 유입 설계와 콘텐츠 캘린더 전체가 검증되지 않은 계절성 가정에 의존 |
| 7 | "판정"이라는 표현이 사용자에게 "계산"보다 신뢰를 준다 | `page.tsx` 카피에 반영("자격이 되는지 판정") — 실측 데이터 없음 | 차별화 전략의 근거가 문서 주장일 뿐, 코드로는 검증되지 않음 |

## C. 쟁점 (2축)

### 축 1: 최적화 시점 — T0(도구 1개) ↔ T+N(4영역)
- T0: 런치 공개 범위(피부양자 판정 1개 + 가이드 6편, 위 "선결 결정" 참조)에 자원을 집중해 완성도를 끌어올린다. 지역보험료·임의계속가입은 비공개 상태로 검증만 진행하고, 국민연금·고용보험은 손대지 않는다.
- T+N: 로드맵상의 4개 영역(건강보험 내 도구들 + 국민연금 + 고용보험)을 전제로 지금부터 정보구조·컴포넌트·네비게이션을 확장 가능하게 설계한다.
- 하위 결정으로 강등된 구 축1(입력 정보 밀도) — 단일 화면 고밀도 ↔ 구역·단계 분리 저밀도: 필드당 글자 크기(라벨 text-sm, 힌트 text-xs이며 그 중 slate-400 조합은 대비 2.56:1로 실패), 그리드 열 수(sm:grid-cols-2 ~ lg:grid-cols-3), 목표 연령 가정(B-5)이 여기 종속된다. 세 도구가 이미 서로 다른 밀도 전략(판정기 카드1개/최대11필드, 보험료 계산기 카드2개/6필드, 비교 도구 카드1개/6필드)을 쓰고 있다는 사실 관계는 유지된다. T0을 택하면 이 하위 결정은 판정기 1개 화면에만 적용하면 되고, T+N을 택하면 4개 영역에 걸쳐 지금 하나의 밀도 전략을 확정해야 한다는 점에서 두 축은 서로 얽혀 있다.

### 축 2: 확신 표현 — 답을 주는 도구 ↔ 근거를 보여주는 참고자료
- "답을 주는 도구": 결과를 "인정됩니다/탈락합니다"처럼 확정형으로 제시한다. 사용자가 원하는 것은 계산 과정이 아니라 결론이라는 전제.
- "근거를 보여주는 참고자료": 결론보다 근거 조항·계산 과정을 앞세우고, 결과는 헤징 표현("~로 보입니다")으로 참고용임을 명시한다.
- 현재 상태: 판정기 헤드라인은 이미 헤징("인정될 것으로 보입니다")과 단정("인정됩니다")이 화면 단계별로 혼재해 있다(면책 문구 소스 이원화는 A장 "문서-코드 괴리" 참조). 이 축을 어느 방향으로 정하든 문구 정리가 필요하다.
- 구 축2(미검증 결과의 공개 시점)는 이 쟁점에서 종료: crossChecked:false 상태에서 공개할지 여부는 더 이상 열린 쟁점이 아니라 위 "선결 결정"에서 비공개로 이미 확정됐다. 다만 확신 표현 축은 "비공개 도구가 검증을 마치고 재공개될 때 어떤 어조로 결과를 줄 것인가"라는 형태로는 여전히 유효하다.

## D. 누락 리스크

| # | 리스크 | 왜 지금까지 안 다뤄졌는가 | 심각도 |
|---|---|---|---|
| 1 | 법령·요율 갱신이 "매년 1월 사람이 상수 파일을 손으로 복사"하는 절차에 전적으로 의존하며, 코드에는 연도 만료 경고·CI 체크 같은 자동화가 없음 | 문서(01·02장)는 "구조가 잡혀 있으니 유지보수가 쉽다"는 정성적 서술만 하고, 자동 알림 메커니즘의 존재 여부는 검증하지 않음 | 운영 지속가능성 |
| 2 | 유입이 검색엔진 색인 단일 경로에 전적으로 의존(OG 이미지 1장만 존재, 공유 버튼·소셜 카피 기능 코드 없음). "11월 피크" 가정도 B-6처럼 미검증 | 문서가 SEO 타임라인 서술에 집중하느라 대체 유입 채널을 다루지 않음 | 유입 경로 가정 |
| 3 | 서비스명 '사대보험'과 도메인(사대보험.kr의 퓨니코드 `xn--vk1bu2qt3cr52a.kr`)이 실제로 구매·연결되었는지는 코드로 확인 불가. `SITE.indexable`은 환경변수 오버라이드 부재 여부로만 "최종 도메인"을 추정 | 도메인 구매는 코드 밖의 행위라 저장소 분석 범위를 벗어남 | 서비스명·도메인 |
| 4 | 검증되지 않은 두 수치(재산 0원일 때 22점 대 0점, 전월세 환산 공식)가 이미 공개된 계산 페이지를 통해 실사용자 입력에 적용되는 구조. `ReferenceOnlyNotice`는 crossChecked 불리언 하나로만 리스크를 표시하며 어느 항목이 미검증인지 항목별로 구분해 보여주지 않음 | 01장은 "미검증이면 비공개"를 원칙으로 제시했는데 코드가 그 원칙보다 앞서 나가 있고, 이 간극 자체가 문서에서 논의되지 않음 | 정량 검증 없이 정해진 수치 |
| 5 | 수익화 코드(광고 게재)가 저장소에 전혀 없음. AdSense 관련 매치 0건. 애드센스 승인·배치는 전부 문서 계획 단계이고, GA4 이벤트도 환경변수 부재 시 조용히 비활성화되어 실패가 화면에 드러나지 않음 | 01장 8절이 광고 "전략"만 상세히 다루고, 그 전략을 실행할 코드가 실제로 존재하는지는 다루지 않음 | 수익구조 |
| 6 | 판정 완료 이벤트는 있으나 폼 중도 이탈·필드별 재입력·소요 시간 등 UX 마찰 지표가 전혀 수집되지 않음(이벤트 3종 모두 "완료" 시점에만 발생) | 01·02장이 "완료 이벤트" 설계만 언급, 이탈 지표는 논의되지 않음 | 데이터 기반 의사결정의 공백 |
| 7 | 법적 면책 문구가 2곳(상수 파일과 layout 푸터)에서 서로 다른 문자열로 존재. 향후 한쪽만 수정하면 조용히 불일치가 발생하는 구조 | 각 파일 작성 시점이 달라 발생한 것으로 보이며, 지금까지 문자열 대조 리뷰가 없었음(A장 표 참조) | 법적 리스크·유지보수 |

## E. 다음 단계 전달 금지 항목

(앵커링 유발 — 제안 에이전트에게 그대로 넘기지 말 것)

- `03-디자인-방향-제안.md`의 콘셉트명 "생활 행정 내비게이터", 디자인 키워드(정확한·차분한·친절한·근거가 보이는·과장하지 않는), 색상 값(#17324D, #087E8B, #F5F8FA, #16865C, #B7791F, #C2414B). 이 값들은 코드가 아니라 `design-preview/index.html`이라는 별도 정적 목업에서만 실재하며 실제 앱(`src/`)에는 반영되어 있지 않음
- "공공기관보다 쉽고 보험사보다 신뢰감 있게" 류의 포지셔닝 문구 일체
- `01-상세기획서.md`의 "판정 대 계산" 차별화 슬로건 문구 그대로
- `00-주제-리서치.md`의 "차익거래 지점" 등 사업적 수사

---

## [codex 피드백]

이 Brief는 코드·기존 문서의 스냅샷으로는 유용하지만, 이후 경쟁 재조사와 공식 자료 대조에서 추가 정정이 필요해졌다. 다른 AI는 아래 내용을 공통 전제로 사용한다.

### 추가로 확인된 사실

- 피부양자 판정 도구와 3단 건강보험 비교 서비스가 이미 존재한다. 복수의 민간 서비스에서 판정 또는 자격별 비교 기능이 확인됐다. 따라서 `판정 도구 부재`와 `3단 흐름의 독점성`은 제품 전제가 아니다.
- 민간 경쟁 도구 일부는 `2026년 최신`을 표시하면서 과거 요율·재산공제·장기요양보험료율을 혼용한다. 시장의 빈틈은 기능 부재보다 **검산 투명성과 최신성**에 있다.
- 기존 기획의 임의계속가입 `"퇴직 후 90일"` 안내는 잘못됐다. 2026년 기준 신청기한은 최초 지역보험료 납부기한에서 2개월이 지나기 이전까지다.
- `00-주제-리서치.md`와 `01-상세기획서.md` 끝의 `[codex 피드백]`이 초기 기획 정정사항을 담고 있으므로 함께 읽어야 한다.

### 실행 결정 권고

- T0 범위를 피부양자 판정 1개와 가이드 6편으로 유지한다.
- 최종 디자인은 A/B/C 중 하나를 통째로 채택하지 않는다. 권장 조합은 `A의 좁은 런치 범위 + B의 단계별 결과 구조 + C의 근거·검증 메타데이터`다.
- 사용자에게는 빠른 결론을 먼저 보여주되 같은 시야에 입력 요약, 기준연도, 단계별 근거, 마지막 검토일, 공단 최종심사 고지를 둔다.
- 지역보험료·임의계속가입은 `VERIFIED_AGAINST_NHIS = true`와 대표 사례 대조표 공개 전까지 모든 경로에서 비활성으로 유지한다.
- 다음 디자인 토론보다 정확성 대조표, 검증 이력 데이터 구조, 만료 경고 자동화를 우선한다.
