# 비평 리포트 — critic-alpha

작성일 2026-08-05 · 대상 커밋 `7be0206` (main, clean)

## 검토 범위

**전문 정독한 파일**
`next.config.mjs`, `vercel.json`, `vitest.config.ts`, `tsconfig.json`, `eslint.config.mjs`,
`.github/workflows/ci.yml`, `playwright.config.ts`, `.env.example`, `package.json`,
`src/lib/dependent/judge.ts`, `src/lib/dependent/types.ts`, `src/lib/dependent/guidance.ts`,
`src/lib/dependent/sources.ts`, `src/lib/dependent/application.ts`,
`src/lib/constants/2026.ts`, `src/lib/constants/property-score-table.ts`,
`src/lib/premium/regional.ts`, `src/lib/format.ts`, `src/lib/routes.ts`, `src/lib/site.ts`,
`src/lib/metadata.ts`, `src/lib/structured-data.ts`, `src/lib/premium-handoff.ts`, `src/lib/analytics.ts`,
`src/app/layout.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/not-found.tsx`,
`src/app/health-insurance/dependent/page.tsx`, `src/app/health-insurance/guides/pension-impact/page.tsx`,
`src/app/privacy/page.tsx`, `src/app/verification-policy/page.tsx`,
`src/components/DependentJudge.tsx`, `src/components/RegionalPremiumCalc.tsx`,
`src/components/VoluntaryComparison.tsx`, `src/components/ui.tsx`, `src/components/guide.tsx`,
`src/components/Analytics.tsx`, `src/components/TrackedLink.tsx`,
`src/lib/premium/regional.test.ts`, `src/lib/dependent/judge.test.ts`(테스트 목록 전수)

**실행한 명령**
- `npm run typecheck` → 통과 (오류 0)
- `npx vitest run` → 6 files / **136 tests 전부 통과** (0.8s)
- `npm run lint` → **오류 0, 경고 3**
- `npm audit` / `npm audit --omit=dev` → **critical 1, high 5, moderate 3**
- 빌드 산출물 `out/` 전수 파싱 (h1/h2/h3 개수, canonical, robots meta, JSON-LD 블록 수, HTML 크기)
- `out/robots.txt`, `out/sitemap.xml`, `out/health-insurance/dependent/index.html` `<head>` 원문 확인
- 번들·정적자산 크기 측정 (`out/_next/static/chunks`, `public/og/`)
- 외부 확인 1건: 지역가입자 금융소득 부과 기준 (웹 검색, High-1에 출처 표기)

**검토하지 못한 영역 (명시)**
- **E2E 미실행.** `npm run test:e2e` 는 5개 브라우저 프로젝트 × 60여 테스트라 이 세션에서 돌리지 않았다. E2E 관련 지적은 소스 정독 근거만으로 낸 것이다.
- 실제 배포본(gijuncheck.kr) 미접속. Core Web Vitals 실측, 색인 상태, 순위는 확인 불가 → 전부 "가설" 섹션.
- `docs/` 는 주장 대조용으로만 부분 인용했고 전문 정독하지 않았다.
- 디자인 토큰/대비비(`tailwind.config.ts`, `globals.css`)와 접근성 실측은 범위 밖.
- `reports/review-1/` 및 `reports/critic-beta.md` 는 지시대로 열지 않았다.

---

## 요약 판단

기술 기반은 이 규모의 개인 프로젝트로서는 상위권이다. 정적 export가 실제로 동작해 크롤러가 JS 없이 본문을 전부 읽을 수 있고, canonical·sitemap·페이지별 OG·JSON-LD가 코드 레벨에서 자동화돼 있으며, 피부양자 판정 로직은 경계값 테스트 48개로 촘촘히 잠겨 있다. lint/typecheck/unit 전부 초록이고 CI도 붙어 있다.

문제는 **콘텐츠의 정확성 주장이 검증 절차보다 앞서 있다**는 점이다. 가장 큰 것은 지역가입자 보험료 계산기가 금융소득의 연 1,000만원 제외 문턱을 적용하지 않으면서, 화면에서 "이 문턱은 지역보험료에 적용하지 않습니다"라고 **법령과 반대되는 단정을 명시**하고 있다는 것이다(`RegionalPremiumCalc.tsx:108-110`). 이 사이트의 주 타깃이 배당·이자 소득이 있는 은퇴자이고, 이 오류는 금융소득 900만원 사용자에게 실제 22,800원짜리 보험료를 61,000원으로 **약 2.7배 과대 표시**한다. 더 나쁜 것은 "공단 모의계산 13건 대조 완료(`VERIFIED_AGAINST_NHIS = true`)"라는 신뢰 배지가 이 오류를 통과시켰고, 그 오답이 `regional.test.ts:88`, `:282` 에 회귀 테스트로 **고정**돼 있다는 점이다.

출시 가능한가 — **도구 3개 중 피부양자 판정기만 지금 상태로 출시 가능하다.** 지역가입자 보험료 계산기는 High-1을 고치기 전에는 "검증 완료" 배지를 달고 나가면 안 되고, 임의계속가입 비교는 화면 헤드라인의 한국어 조사 오류(High-3)와 `0` 문자열 누출(Medium-4)이 첫인상을 깎는다. SEO 기술 기반은 이미 좋고, 남은 병목은 순위가 아니라 **홈의 인용 가능성**이다.

---

## 발견 항목

### [High-1] 지역가입자 보험료에서 금융소득 1,000만원 제외 문턱을 적용하지 않고, 화면에서 반대로 단언한다

- **근거**
  - 계산: `src/lib/premium/regional.ts:52-71` — `incomeBaseForPremium()` 이 `income.financial` 을 아무 조건 없이 `INCOME_REFLECTION.FULL`(100%)로 합산
  - 주석의 오단정: `src/lib/premium/regional.ts:50` — "금융소득 1,000만원 문턱은 피부양자 자격 판정 기준과 혼동하지 않는다"
  - 화면 문구: `src/components/RegionalPremiumCalc.tsx:108-110` — "연 1,000만원 문턱은 피부양자 자격 판정 기준이므로 지역보험료 계산에는 적용하지 않습니다"
  - 오답을 잠근 테스트: `src/lib/premium/regional.test.ts:88` `it('지역보험료에서는 금융소득 1,000만원 이하도 100% 반영된다')`
  - 오답을 "공단 대조 완료"로 승격시킨 케이스: `src/lib/premium/regional.test.ts:282` `[income({ financial: 9_000_000 }), 0, 0, 0, 53_920, 7_080, 61_000]` / 같은 케이스가 `docs/03-검증기록.md:164` 의 C13
  - 문서의 동일 오단정: `docs/03-검증기록.md:132`
- **문제**
  지역가입자 보험료 부과대상 소득에서 이자·배당(금융)소득은 **연 1,000만원 이하이면 전액 제외**되고, 초과하면 초과분이 아니라 전액이 합산된다. 연 1,000만원 이하 금융소득은 분리과세 구간이라 부과자료로 넘어오지 않는다. 이 규칙은 피부양자 자격 판정과 **별개 제도지만 문턱 자체는 지역보험료에도 존재한다.** 코드는 문턱이 없는 것으로 구현했고, UI는 그것을 사용자에게 사실로 고지한다.

  같은 저장소의 `src/lib/dependent/judge.ts:35-37` 은 피부양자 판정에서 이 문턱을 정확히 구현해 두었다. 즉 규칙을 몰라서가 아니라 "지역보험료에는 없다"고 잘못 결론 낸 것이다.

  **"공단 13건 대조 완료" 배지가 이 오류를 못 잡은 이유**가 중요하다. 공단 모의계산 입력란은 이미 "부과대상 연간 소득금액"을 받으므로, 900만원을 직접 넣으면 공단도 61,000원을 낸다. 대조는 **산식**을 검증했지 **입력 의미(어떤 금액을 넣어야 하는가)** 를 검증하지 않았다. 그런데 기준체크의 입력란은 `금융소득 (100%) / 이자 + 배당`(`RegionalPremiumCalc.tsx:40-44, 115`)이라 사용자는 원천 금액을 그대로 넣는다. 대조 방법론의 구멍이다.
- **영향**
  - 금융소득 900만원·타 소득 0인 은퇴자: 실제 하한 20,160 + 장기요양 2,640 = **22,800원** → 사이트 표시 **61,000원 (약 2.7배 과대)**
  - 이 사이트의 핵심 차별점이 "근거를 함께 보여준다"인데, 그 근거 문구 자체가 틀렸다. 사용자가 공단 고지서와 대조하는 순간 신뢰가 붕괴된다.
  - `VERIFIED_AGAINST_NHIS = true`(`property-score-table.ts:25`)라서 `ReferenceOnlyNotice` 경고가 렌더되지 않는다(`ui.tsx:542-543`) → **경고 없이** 잘못된 금액이 확정값처럼 보인다.
  - `compareAfterRetirement()` 를 통해 임의계속가입 비교 결과까지 오염된다(`regional.ts:315`).
- **개선 방향**
  1. `2026.ts` 에 지역보험료용 문턱 상수를 별도로 둔다(피부양자용과 이름을 분리해 혼동을 막는다):
     ```ts
     export const REGIONAL_INCOME = {
       /** 지역가입자 부과대상 금융소득 문턱. 이하면 전액 제외, 초과하면 전액 합산 */
       FINANCIAL_INCLUSION_THRESHOLD: 10_000_000,
     } as const;
     ```
  2. `incomeBaseForPremium()` 에 반영:
     ```ts
     const countableFinancial =
       income.financial > REGIONAL_INCOME.FINANCIAL_INCLUSION_THRESHOLD ? income.financial : 0;
     const full = (income.business + countableFinancial + income.other) * INCOME_REFLECTION.FULL;
     ```
  3. `RegionalPremiumCalc.tsx:108-110` 문구를 반대로 고치고, 금융소득 필드 hint를 `이자 + 배당 · 연 1,000만원 이하면 부과 제외` 로 변경.
  4. `regional.test.ts:88` 을 반대 단언으로 뒤집고, C13(`:282`)을 `[income({ financial: 9_000_000 }), 0, 0, 0, 20_160, 2_640, 22_800]` 로 수정. 별도로 `financial: 10_000_001` → 전액 합산 케이스를 추가한다.
  5. `docs/03-검증기록.md:132, 164` 정정하고, **대조 항목에 "입력 의미(공단 입력란이 요구하는 금액의 정의)"를 명시적으로 추가**한다. 산식만 맞추는 대조는 이 오류 계열을 영원히 못 잡는다.
- **확신도**
  - "코드/UI가 문턱을 적용하지 않는다" — **High** (코드 직접 확인)
  - "지역보험료에도 1,000만원 문턱이 적용된다" — **Medium-High** (웹 출처 다수 일치, 단 시행령 원문 직접 대조는 못 함)
  출처: https://www.retireguide.co.kr/blog/financial-income-health-insurance , https://kbthink.com/main/economy/expert-column/tax-column/2024/tax-column-241217.html
- **예상 공수** S (코드 30분 + 시행령 별표 원문 대조 반나절)

---

### [High-2] 연도 전환 설계가 문서상으로만 존재한다 — `rules.ts` / `RULES_BY_YEAR` 는 없고 18개 파일이 2026을 직접 import

- **근거**
  - `src/lib/constants/2026.ts:4-8` — "새 연도가 시작되면 이 파일을 복사해 2027.ts를 만들고, **rules.ts 의 RULES_BY_YEAR 에 등록하세요**"
  - `find src -name "rules*"` → **결과 없음**
  - `grep -rl "constants/2026" src` → **18개 파일**이 `../constants/2026` 또는 `@/lib/constants/2026` 을 직접 import
  - `src/lib/dependent/judge.ts:337, 343, 349, 352` — `year: YEAR` 를 2026 상수에서 직접 읽음
  - 진실의 출처 이중화: `src/lib/site.ts:63` `baseYear: 2026` 이 별도로 또 존재
- **문제**
  이 사이트의 존재 이유는 "매년 바뀌는 기준을 정확히 알려주는 것"이다. 그런데 연도 전환 메커니즘이 없다. 안내된 절차("2027.ts를 만들고 등록")는 등록할 곳이 없어 **실행 불가능한 지시**다. 실제로 2027년을 지원하려면 18개 파일의 import 경로를 일괄 치환해야 하고, 그 순간 2026년 기준으로 작성된 가이드 본문·JSON-LD·판정 결과 표기가 전부 어긋난다.
- **영향**
  2026년 12월 말에 "내년 기준 반영"이 대공사가 된다. 11월 재산정 트래픽 피크(`routes.ts:113` 가 직접 노린다고 명시)를 겨냥한 사이트인데, 그 직후 연도 전환에서 무너진다. 기준이 틀린 채로 방치되면 High-1보다 넓은 범위의 신뢰 손상이다.
- **개선 방향**
  지금 당장 다연도를 지원할 필요는 없다. 다만 **거짓말하는 주석을 지우거나, 최소 진입점 하나를 만든다.**
  ```ts
  // src/lib/constants/index.ts
  import * as Y2026 from './2026';
  export const CURRENT_YEAR = 2026 as const;
  export * from './2026';   // 연도 추가 시 이 파일만 바꾼다
  ```
  18개 파일의 import를 `@/lib/constants` 로 바꾸면 전환 비용이 1파일로 줄어든다. 병행해서 `SITE.baseYear` 를 `CURRENT_YEAR` 참조로 대체하고, `2026.ts:4-8` 의 실행 불가 지시를 실제 절차로 교체한다.
- **확신도** High (`rules.ts` 부재와 18개 직접 import를 명령으로 확인)
- **예상 공수** M

---

### [High-3] 임의계속가입 비교의 **결론 헤드라인**에 한국어 조사 오류가 있고, 무승부 시 "0원 유리합니다"가 출력된다

- **근거**
  - `src/components/VoluntaryComparison.tsx:196-200`
    ```tsx
    {voluntaryWins ? '임의계속가입' : '지역가입자'}가 월{' '}
    {won(Math.abs(result.monthlySaving))} 유리합니다
    ```
  - `src/lib/premium/regional.ts:357` — `recommendation: monthlySaving > 0 ? 'voluntary' : 'regional'` (0이면 `regional`)
  - 이 프로젝트는 이 문제를 위한 헬퍼를 이미 갖고 있다: `src/lib/format.ts:138-141` `josa()`, 그리고 `format.ts:129` 는 "이걸 쓰지 않고 조사를 직접 붙이면 **기계가 쓴 티가 나고 신뢰도를 깎는다**"고 스스로 적어 두었다.
- **문제**
  1. `voluntaryWins === true` 일 때 화면에 **"임의계속가입가 월 12,340원 유리합니다"** 가 출력된다. 받침 있는 '입' 뒤에는 '이'가 와야 한다. 이 문장은 결과 화면에서 **가장 크고(text-xl font-extrabold) 가장 먼저 읽히는 한 줄**이다.
  2. `monthlySaving === 0` 이면 `recommendation` 이 `'regional'` 이 되어 **"지역가입자가 월 0원 유리합니다"** 라는 자기모순 문장이 나온다. 두 제도가 같은 금액인 경우는 하한 적용 구간에서 실제로 발생한다(양쪽 모두 `PREMIUM_LIMIT.LOWER` 로 바닥을 치면 정확히 동률).
- **영향**
  법령 기반 신뢰를 파는 사이트에서, 도구의 결론 한 줄이 문법 오류다. 은퇴자 대상 서비스에서 "성의 없다"는 인상은 이탈로 직결된다. 0원 케이스는 사용자가 판단할 수 없는 답을 준다.
- **개선 방향**
  ```tsx
  import { josa } from '@/lib/format';
  {recommendation === 'tie' ? (
    <>두 제도의 월 보험료가 {won(regional.total)}으로 같습니다</>
  ) : (
    <>{josa(voluntaryWins ? '임의계속가입' : '지역가입자', '이')} 월{' '}
      {won(Math.abs(result.monthlySaving))} 유리합니다</>
  )}
  ```
  `Recommendation` 타입(`regional.ts:283`)에 `'tie'` 를 추가하고 `monthlySaving === 0` 을 분기한다. 동시에 `regional.test.ts` 에 동률 케이스를 추가한다.
- **확신도** High (문자열 연결과 분기 조건 모두 코드에서 직접 확인)
- **예상 공수** S

---

### [High-4] "36개월 총 X원 절약" 이라는 확정 금액이 검증 불가한 가정 위에 서 있다

- **근거**
  - `src/lib/premium/regional.ts:359` — `totalSaving: monthlySaving * VOLUNTARY_CONTINUATION.MAX_MONTHS`
  - `src/components/VoluntaryComparison.tsx:262-268` — "최대 36개월 유지하면 총 **{won(result.totalSaving)}** 절약됩니다."
  - 반례가 될 사실이 같은 저장소 안에 있다: `src/lib/routes.ts:111-119` — 라우트 라벨 "11월 건강보험 자격 일괄 재산정이란" + 전용 가이드 페이지
- **문제**
  임의계속가입 보수월액보험료는 퇴직 시점 보수 기준으로 36개월 고정에 가깝지만, **지역가입자 보험료는 매년 11월 소득·재산 자료로 재산정된다.** 따라서 `monthlySaving` 은 36개월 내내 상수가 아니다. 그런데 코드는 단순 곱으로 **단일 확정 금액**을 만들어 굵은 글씨로 제시한다. 요율 변경(매년), 재산 과표 변경(매년 6/1 기준일), 소득 변동이 모두 무시된다.

  프로젝트 자체가 이 사실을 알고 있다 — 11월 재산정 전용 가이드를 써 놓았다. 그런데 계산기는 그걸 반영하지 않는다. 내부 정합성 결함이다.
- **영향**
  "총 4,440,000원 절약" 같은 구체적 숫자는 인용되기 쉽고 기억에 남는다. 그리고 틀렸을 때 가장 크게 문제가 된다. 임의계속가입은 **신청하면 되돌리기 어려운 선택**이라 잘못된 총액이 실제 의사결정을 왜곡한다.
- **개선 방향**
  - 문구를 조건부로 바꾼다: "현재 조건이 유지된다고 가정하면 36개월 총 약 X원" + "지역가입자 보험료는 매년 11월 재산정되므로 실제 차액은 달라집니다" 를 같은 블록에 배치.
  - 해당 문장에서 11월 재산정 가이드로 링크를 건다(내부 링크 자산도 늘어난다).
  - `ComparisonResult` 에 `totalSavingAssumption: string` 필드를 추가해 가정을 데이터로 들고 다니게 한다. 지금은 UI에만 있어 다른 화면에 재사용하면 가정이 사라진다.
- **확신도** High (단순 곱 연산과 화면 문구 모두 확인. "11월 재산정" 사실은 같은 저장소 가이드가 근거)
- **예상 공수** S

---

### [Medium-1] 표시용 요율이 상수에서 오지 않고 문자열로 하드코딩되어 있다 — 계산과 표시가 갈라질 수 있다

- **근거**
  - `src/components/RegionalPremiumCalc.tsx:219` — ``hint={`소득월액 × 7.19%`}``
  - `src/components/RegionalPremiumCalc.tsx:228` — `` `${result.propertyGrade}등급 ${result.propertyScore}점 × 211.5원` ``
  - `src/components/RegionalPremiumCalc.tsx:236` — `hint="건강보험료 × 13.14%"`
  - `src/app/health-insurance/regional-premium/page.tsx:9` — `const TITLE = '지역가입자 보험료 계산 — 2026년 요율 7.19% 반영'`
  - `src/app/health-insurance/guides/before-business-registration/page.tsx:215, 217` — 산식과 13.14% 하드코딩
  - 이 규칙을 명시적으로 금지한 곳: `src/lib/constants/2026.ts:7` — "**코드 어디에도 숫자를 직접 쓰지 마세요.**"
  - 이미 준비된 헬퍼가 놀고 있다: `src/lib/format.ts:69-71` `toPercent()`, `format.ts:29-31` `wonExact()`
- **문제**
  요율은 매년 바뀐다. `RATE.HEALTH` 를 0.0719 → 0.0733 으로 고치면 **계산 결과는 바뀌지만 화면의 "× 7.19%" 설명은 그대로 남는다.** 사용자는 7.19%로 안내받고 다른 숫자를 받는다. 타입 체커도 테스트도 못 잡는다 — 문자열이기 때문이다.

  `211.5원` 은 특히 아이러니하다. `format.ts:17` 이 "점수당 금액 211.5원을 `won()` 으로 찍으면 212원이 되어 사실이 틀어진다"며 `wonExact()` 를 만들어 뒀는데, 정작 호출부는 `wonExact(RATE.PROPERTY_POINT_VALUE)` 가 아니라 리터럴 `211.5원` 을 쓴다.
- **영향**
  연도 전환 시 조용히 틀린 설명이 남는다. High-2(연도 전환 설계 부재)와 결합하면 발견까지 오래 걸린다. `<title>` 에까지 요율이 박혀 있어(`regional-premium/page.tsx:9`) 검색 결과 스니펫과 실제 계산이 어긋나는 것도 가능하다.
- **개선 방향**
  ```tsx
  import { toPercent, wonExact } from '@/lib/format';
  hint={`소득월액 × ${toPercent(RATE.HEALTH)}`}
  `${result.propertyGrade}등급 ${result.propertyScore}점 × ${wonExact(RATE.PROPERTY_POINT_VALUE)}`
  hint={`건강보험료 × ${toPercent(longTermCareRatio())}`}
  ```
  `<title>` 도 템플릿 리터럴로 바꾼다. 추가로 **소스에 요율 리터럴이 남아 있으면 실패하는 lint 규칙 또는 테스트**를 두는 것이 가장 확실하다(`no-restricted-syntax` 정규식 또는 vitest 소스 grep).
- **확신도** High
- **예상 공수** S

---

### [Medium-2] 모든 가이드의 `dateModified` 가 전역 단일 상수라, 한 글만 고쳐도 7개 글의 최신성 신호가 함께 움직인다

- **근거**
  - `src/components/guide.tsx:71` — `dateModified: toIsoDateTime(SITE.lastVerified)`
  - `src/lib/site.ts:66` — `lastVerified: '2026-08-03'` (사이트 전역 단일 값)
  - 반면 sitemap은 경로별 값을 쓴다: `src/app/sitemap.ts:20` → `route.lastModified`, `src/lib/routes.ts:25` 주석 "해당 페이지의 콘텐츠·기준이 실제로 마지막 변경된 날. **배포일과 구분한다**"
  - 이미 불일치가 발생해 있다: `ROUTES.home.lastModified = '2026-08-04'`(`routes.ts:38`), `ROUTES.dependent.lastModified = '2026-08-04'`(`routes.ts:48`) vs `SITE.lastVerified = '2026-08-03'`
  - 각 가이드는 `PUBLISHED` 를 또 따로 갖는다: 예 `guides/pension-impact/page.tsx:24` `const PUBLISHED = '2026-07-30'`
  - 화면 표시도 전역값을 쓴다: `src/components/guide.tsx:346` `<time dateTime={SITE.lastVerified}>`
- **문제**
  "이 문서가 언제 바뀌었나"에 대한 진실의 출처가 **세 곳**이다 — `SITE.lastVerified`(JSON-LD dateModified + 화면), `ROUTES[key].lastModified`(sitemap lastmod), 각 페이지의 `PUBLISHED`(datePublished). 지금 이미 두 개가 다르다(08-03 vs 08-04).

  구조적으로 더 나쁜 것은 `SITE.lastVerified` 를 한 번 올리면 **손대지 않은 6개 글의 `dateModified` 가 전부 함께 점프한다**는 점이다. 전 페이지가 항상 같은 날짜로 갱신되는 패턴은 최신성 신호로서의 가치가 0에 수렴하고, 답변엔진도 최신성을 인용 판단에 쓴다.
- **영향**
  최신성 신호 무효화. sitemap lastmod와 JSON-LD dateModified가 어긋나 크롤러에 상충 신호를 준다. 실제 색인 영향은 실측 없이 단정 불가(가설 섹션 참조).
- **개선 방향**
  `guideJsonLd()` 가 경로 기준으로 `ROUTES` 에서 날짜를 끌어오게 하고, 진실의 출처를 `ROUTES` 하나로 줄인다.
  ```ts
  const route = ALL_ROUTES.find(r => r.path === path);
  dateModified: toIsoDateTime(route?.lastModified ?? published),
  datePublished: toIsoDateTime(published),
  ```
  `GuideFooter` 도 같은 값을 쓰게 해 **화면과 마크업을 일치**시킨다. `SITE.lastVerified` 는 "요율 상수를 마지막으로 확인한 날"이라는 원래 의미로만 남기고 전역 푸터에서만 쓴다.
- **확신도** High (날짜 불일치를 코드에서 직접 대조)
- **예상 공수** S

---

### [Medium-3] 0원 확인 모달이 사실상 모든 제출에서 뜬다 — 안전장치가 상시 마찰로 변했다

- **근거**
  - `src/components/DependentJudge.tsx:111-116`
    ```tsx
    const zeroValueFields = [
      ...INCOME_FIELDS.filter((field) => input.income[field.key] === 0).map(f => f.label),
      ...(input.propertyTaxBase === 0 ? ['재산세 과세표준'] : []),
    ];
    ```
  - `DependentJudge.tsx:131-138` — `zeroValueFields.length > 0` 이면 무조건 모달
  - `INCOME_FIELDS` 는 5개(`DependentJudge.tsx:51-65`), 초기값은 전부 0(`judge.ts:363`)
- **문제**
  전형적인 사용자는 소득이 1~2종류다. 공적연금만 있는 은퇴자는 나머지 4개가 0이고 재산도 0이면 5개 → **판정 버튼을 누를 때마다 모달**이 뜬다. 소득이 전혀 없는 부모를 등록하려는 사용자(사이트의 대표 시나리오, `page.tsx:47` "부모님을 피부양자로 등록하고 싶어요")는 6개 전부가 0이라 100% 모달을 본다.

  "0원 입력 항목을 확인해 주세요"라는 경고가 정상 상태에서 항상 뜨면 사용자는 읽지 않고 "확인하고 판정하기"를 누른다(alert fatigue). 즉 이 장치는 **막고 싶었던 진짜 오입력 케이스에서도 무시된다.**

  구현 자체는 훌륭하다(포커스 트랩, Escape, `aria-modal`, 형제 `aria-hidden`, 포커스 복원 — `ui.tsx:405-480`). 아까운 만큼 트리거 조건이 문제다.
- **영향** 판정 완료율 하락(주요 전환 지표) + 경고의 신호 가치 소실.
- **개선 방향**
  "0이면 경고"가 아니라 "**아무것도 입력하지 않았으면 경고**"로 바꾼다.
  ```ts
  const nothingEntered =
    INCOME_FIELDS.every(f => input.income[f.key] === 0) && input.propertyTaxBase === 0;
  ```
  또는 필드별 `touched` 를 추적해 **한 번도 만지지 않은 채 0인 필드만** 대상으로 한다. 전자가 훨씬 싸고 대부분의 가치를 준다. `e2e/dependent-judge.spec.ts:208, 228` 도 함께 수정해야 한다.
- **확신도** High (트리거 조건과 초기값 모두 확인)
- **예상 공수** S

---

### [Medium-4] `{propertyGrade && ...}` 가 재산 0원일 때 화면에 `0` 을 그대로 출력한다

- **근거**
  - `src/components/VoluntaryComparison.tsx:226-228` — `{regional.propertyGrade && \` (${regional.propertyGrade}등급)\`}`
  - `regional.propertyGrade` 의 출처: `src/lib/premium/regional.ts:177` → `property.grade`
  - 0이 되는 경로: `src/lib/constants/property-score-table.ts:182-183` — 기본공제 후 0 이하이면 `{ score: 0, grade: 0, ... }`
  - 기본값이 0: `src/components/VoluntaryComparison.tsx:45` `useState(0)`
- **문제**
  React에서 `{0 && '문자열'}` 은 `0` 으로 평가되고, React는 숫자 `0` 을 **텍스트로 렌더링한다**(`null`/`false` 와 달리 생략되지 않는다). 재산 입력이 0이거나 기본공제 1억 이하이면 화면에 `소득 20,160원 + 재산 0원0` 이 출력된다. **아무것도 입력하지 않고 비교 버튼을 누르면 바로 재현**된다.

  타입이 `number | null`(`regional.ts:86`)이라 `null` 만 고려하고 `0` 을 놓친 전형적 사례다.
- **영향** 기본 경로에서 즉시 보이는 시각적 결함. "정확함"을 파는 사이트에서 숫자 옆에 정체불명의 `0` 이 붙는 건 나쁘게 보인다.
- **개선 방향**
  ```tsx
  {regional.propertyGrade ? ` (${regional.propertyGrade}등급)` : null}
  ```
  저장소 전체에서 `{number && JSX}` 패턴을 grep해 같은 계열을 정리하고, `@typescript-eslint/strict-boolean-expressions` 도입을 검토한다.
- **확신도** High (React 렌더링 semantics + 0이 되는 경로를 코드로 확인)
- **예상 공수** S

---

### [Medium-5] 피부양자 판정에 손자녀 특칙과 부부 합산 요건이 없는데, UI는 손자녀를 지원한다고 표시한다

- **근거**
  - `src/lib/dependent/types.ts:150` — `/** 직계비속 — 자녀, 손자녀 */ | 'linealDescendant'`
  - `src/lib/dependent/types.ts:162` — `linealDescendant: '직계비속 (자녀·손자녀)'` ← 드롭다운에 그대로 노출(`DependentJudge.tsx:153-156`)
  - `src/lib/dependent/judge.ts:104-128` — `linealDescendant` 분기는 동거/미혼만 본다. 손자녀 여부를 구분하는 입력 자체가 없다.
  - `src/lib/dependent/types.ts:182-203` — `DependentInput` 에 부부 동시 판정 필드 없음
  - `src/lib/dependent/judge.ts:330-353` — `judgeDependent()` 는 항상 1인 단독 판정
- **문제**
  1. **손자녀·외손자녀**는 직계비속 일반과 다른 부양요건을 갖는다(부모가 모두 없거나, 부모가 있어도 부양할 수 없는 사유가 있는 경우 등). 코드는 자녀와 완전히 동일하게 처리하면서, 드롭다운 라벨은 "직계비속 (자녀·손자녀)"라고 명시해 **손자녀 케이스를 적극적으로 유입시킨다.**
  2. **피부양자가 부부인 경우** 소득·재산 요건을 부부 모두가 충족해야 한다는 규정이 있다. 예: 아버지가 요건을 충족해도 어머니의 소득이 기준을 넘으면 아버지도 등재되지 않는다. 사이트의 대표 시나리오가 정확히 "부모님을 피부양자로 등록"(`page.tsx:47`)인데 이 케이스가 모델에 없다.
- **영향**
  두 경우 모두 **실제로는 탈락인데 사이트는 인정으로 표시**하는 방향의 오류다. 사용자는 신청했다가 반려되고, 그 사이 지역보험료가 소급 부과될 수 있다(사이트 자신이 `guides/losing-eligibility` 에서 소급 부과 위험을 설명한다). 거짓 음성보다 나쁜 거짓 양성이다.
- **개선 방향**
  단기(정직한 축소):
  - `RELATION_LABEL.linealDescendant` 를 `'직계비속 (자녀)'` 로 좁힌다. 지원하지 않는 것을 지원하는 것처럼 보이지 않게 한다.
  - `RELATION_GUIDANCE.linealDescendant.checks`(`guidance.ts:257`)에 "손자녀·외손자녀는 별도 요건이 적용되므로 공단 확인이 필요합니다" 추가.
  - `getConfidenceSummary()`(`guidance.ts:303`)에 부부 합산 요건 안내를 `verify` 사유로 추가.

  중기: `relation: 'grandchild'` 를 별도 값으로 분리하고, `spouseAlsoApplying?: { income: Income; propertyTaxBase: number }` 를 선택 입력으로 받아 부부 동시 판정을 지원한다.
- **확신도**
  - "코드에 두 규칙이 없다" — **High**
  - "두 규칙이 현행 시행규칙에 존재한다" — **Medium** (별표 1 원문 직접 대조 필요. 대조 전에도 UI 축소만 적용하면 손해가 없다)
- **예상 공수** 단기 S / 중기 L

---

### [Medium-6] 의존성 취약점 critical 1 · high 5, 그리고 CI에 감사 게이트가 없다

- **근거**
  - `npm audit` → `9 vulnerabilities (3 moderate, 5 high, 1 critical)`
    - critical: `vitest` (← `@vitest/mocker`, "Vitest UI server 리스닝 시 임의 파일 읽기·실행", `vite`, `vite-node`)
    - high: `postcss`(XSS via Unescaped `</style>`, 임의 파일 읽기), `sharp`(libvips CVE-2026-33327/33328/35590/35591), `vite`(Path Traversal, launch-editor NTLMv2 해시 유출), `fast-uri`, `next`(postcss·sharp 경유)
  - `npm audit --omit=dev` → `3 high` 잔존 (`next` → `postcss` / `sharp`)
  - `.github/workflows/ci.yml:1-46` — lint / typecheck / test / build / e2e 는 있으나 **`npm audit` 단계 없음**
  - `package.json:37` — `"next": "^15.1.0"`, 수정에는 next 16 메이저 업그레이드 필요
- **문제**
  런타임 노출은 실제로 낮다 — `output: 'export'`(`next.config.mjs:20`)라 서버가 없고 `sharp`/`postcss` 는 빌드 타임에만 돈다. 하지만:
  1. **CI가 이 상태를 통과시킨다.** 게이트가 없으니 앞으로 진짜 런타임 취약점이 들어와도 자동 통과한다.
  2. `postcss` 의 "attacker-controlled sourceMappingURL로 임의 `.map` 파일 읽기"는 CI 러너에서 실행되는 빌드 체인 안에 있다.
  3. `vitest` critical은 UI 서버를 안 켜므로 실제 위험이 낮지만, **아무도 그 판단을 기록하지 않았다.** 다음 사람은 처음부터 다시 조사해야 한다.
- **영향** 현시점 사고 확률은 낮으나 관측되지 않는 상태로 방치된다. 애드센스 승인·도메인 신뢰도 관점에서도 감사 이력 부재는 불리하다.
- **개선 방향**
  ```yaml
  - name: Audit (production deps)
    run: npm audit --omit=dev --audit-level=high
  - name: Audit (all, report only)
    run: npm audit || true
  ```
  `next` 16 업그레이드를 별도 브랜치에서 시도한다(정적 export + App Router라 마이그레이션 비용이 낮은 편). 억제 결정은 `docs/` 에 사유와 재검토일을 기록한다("vitest UI 미사용 — 2026-11 재검토"). `.github/dependabot.yml` 도 5줄이면 붙는다.
- **확신도** High (명령 출력)
- **예상 공수** S (게이트) / M (next 16)

---

### [Medium-7] 보안 응답 헤더에 CSP와 `frame-ancestors` 가 없다

- **근거**
  - `vercel.json:1-15` — `Referrer-Policy`, `X-Content-Type-Options`, `Strict-Transport-Security` 3종만
  - 인라인 스크립트 주입 지점: `src/app/layout.tsx:67-70`, `src/app/health-insurance/dependent/page.tsx:80-83`, `src/components/guide.tsx` 를 쓰는 가이드 6종, `src/app/verification-policy/page.tsx:71-74` (모두 `dangerouslySetInnerHTML`)
  - GA 인라인 스크립트: `src/components/Analytics.tsx:24-35`
  - 완화 장치는 있다: `src/lib/structured-data.ts:46-48` `ldJson()` 이 `<` 를 `\u003c` 로 이스케이프
- **문제**
  `X-Frame-Options` 도 `CSP: frame-ancestors` 도 없어 **임의의 사이트가 iframe으로 감쌀 수 있다.** 이 사이트는 "공단 공식 화면이 아님"을 상시 고지하는 배너까지 둘 정도로 공공기관 오인 리스크를 신경 쓰는데(`layout.tsx:77-79`), 정작 제3자가 프레임으로 감싸 자기 사이트인 척하는 것은 막지 않는다. 고지 배너를 프레임 밖으로 잘라내는 것도 가능하다.

  CSP 부재 자체는 정적 사이트라 위험도가 낮고 `ldJson()` 이스케이프도 잘 돼 있다. 다만 `object-src 'none'`, `base-uri 'self'` 같은 저비용·고효과 지시어까지 빠져 있는 건 아깝다.
- **영향** 클릭재킹 / 브랜드 사칭 프레이밍. 개인 운영 서비스가 공공기관으로 오인되면 법적 리스크로 번질 수 있다는 것은 이 저장소 자신의 판단이다(`layout.tsx:73-76`).
- **개선 방향** `vercel.json` 에 추가(정적 export라 nonce 불가 → 스크립트는 `'unsafe-inline'` 감수, 나머지를 조인다):
  ```json
  { "key": "Content-Security-Policy",
    "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://www.google-analytics.com https://vitals.vercel-insights.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'none'" },
  { "key": "X-Frame-Options", "value": "DENY" },
  { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
  ```
  `@vercel/speed-insights`(`layout.tsx:3`)와 GA의 실제 요청 도메인을 배포 후 콘솔로 확정할 것. `e2e/` 에 CSP 위반 콘솔 에러 감지 테스트를 하나 추가하면 회귀를 막는다.
- **확신도** High (헤더 목록 직접 확인)
- **예상 공수** S

---

### [Low-1] 내부 개발 문서가 프로덕션 URL로 공개된다 — `/README.md`

- **근거** `public/README.md` 존재 → 빌드 후 `out/README.md` 로 복사됨(산출물 확인). 내용은 검색엔진 소유 확인 파일 배치 규칙, 애드센스 `ads.txt` 계획, `next/image` 미최적화 등 내부 운영 메모. 이 파일 자신이 규칙을 적어 두었다 — "이 폴더의 파일은 빌드 시 `out/` 루트로 그대로 복사됩니다".
- **문제** `https://gijuncheck.kr/README.md` 로 누구나 접근 가능. 시크릿은 없으나 공개할 이유가 없는 운영 정보다. sitemap에 없어 색인 가능성은 낮지만 크롤러에 발견될 수 있다.
- **개선 방향** `public/README.md` → `docs/public-folder-guide.md` 로 이동. `public/` 에는 실제 서빙할 파일만 둔다.
- **확신도** High
- **예상 공수** S

---

### [Low-2] `public/og.png`(624KB)는 아무도 참조하지 않는 중복 자산이고, OG 이미지 14장 합계가 9.4MB다

- **근거**
  - `public/og.png` 624,580 bytes ≡ `public/og/home.png` 624,580 bytes
  - 참조는 `/og/home.png` 뿐: `src/lib/site.ts:60`, 폴백도 `src/lib/routes.ts:189`
  - `grep` 상 `'/og.png'` 참조 없음
  - `public/og/` 14장 각 622KB~767KB, 합계 약 9.4MB
- **문제** 배포마다 624KB 데드 자산이 올라간다. OG 이미지 개당 700KB는 1200×630 PNG로서 과하고, 미리보기 지연은 공유 유입 CTR에 직접 영향을 준다. `next/image` 최적화가 없는 환경(`next.config.mjs:25`)이라 사전 압축이 유일한 수단인데 안 돼 있다.
- **개선 방향** `public/og.png` 삭제. 14장을 pngquant 등으로 재생성해 개당 150KB 이하를 목표로 한다(`scripts/` 에 압축 스크립트 추가). OG는 WebP 지원이 플랫폼별로 갈리므로 PNG 유지 + 압축이 안전하다.
- **확신도** High
- **예상 공수** S

---

### [Low-3] `notes.slice(1)` 이 배열 순서에 암묵적으로 결합돼 있다

- **근거**
  - `src/components/VoluntaryComparison.tsx:284` — `{result.notes.slice(1).map(...)}`
  - `src/lib/premium/regional.ts:324-328` — `notes[0]`=신청 기한, `[1]`=36개월, `[2]`=재산 미반영
  - `src/lib/premium/regional.ts:331` — `notEligible` 경로에서만 `notes.unshift(...)`
  - `src/components/VoluntaryComparison.tsx:184` — `notEligible` 분기는 `notes[0]` 을 렌더
- **문제** 같은 `notes[0]` 이 분기에 따라 전혀 다른 의미다. 자격 있음이면 "신청 기한 안내"(전용 박스에서 이미 보여줘서 버리는 것), 자격 없음이면 "왜 신청 불가"(반드시 보여줘야 하는 것). `regional.ts:324` 배열 순서를 누가 바꾸면 UI가 조용히 엉뚱한 문장을 지운다. 타입도 테스트도 못 잡는다.
- **개선 방향** `interface ComparisonNotes { ineligibleReason?: string; general: string[] }` 로 구조화하고 `slice(1)` 을 없앤다.
- **확신도** High
- **예상 공수** S

---

### [Low-4] CI에 중복 실행 취소·브라우저 캐시·기준값 노후 알림이 없다

- **근거** `.github/workflows/ci.yml` 전문 — `concurrency` 블록 없음, `:38` `npx playwright install --with-deps chromium webkit` 캐시 없음, `on:`(`:3-7`)에 `schedule` 없음
- **문제** 5개 브라우저 프로젝트 × 60여 테스트 + 매 실행 브라우저 재설치라 CI 시간이 길고, 연속 push마다 이전 실행이 계속 돈다. 더 중요한 건 **기준값 노후를 감시하는 장치가 없다**는 점이다. `2026.ts:9` "최종 확인 2026-07-30", `site.ts:66` "2026-08-03" 인데 6개월이 지나도 아무도 알려주지 않는다. 연 단위로 값이 바뀌는 사이트에서 이건 운영 공백이다.
- **개선 방향**
  ```yaml
  concurrency: { group: "${{ github.workflow }}-${{ github.ref }}", cancel-in-progress: true }
  # + actions/cache 로 ~/.cache/ms-playwright
  # + 별도 워크플로: on.schedule(매월 1일) → SITE.lastVerified 가 N일 이상 지났으면 이슈 자동 생성
  ```
  PR에서는 chromium 1개만, main push에서만 5개 프로젝트 전체를 도는 절충도 유효하다.
- **확신도** High
- **예상 공수** S

---

### [Low-5] 홈이 판정 도구 전체를 클라이언트로 싣는데, 본문 텍스트는 2,745자뿐이다

- **근거**
  - `src/app/page.tsx:2` — `import DependentJudge from '@/components/DependentJudge'` (452줄 `'use client'` 컴포넌트)
  - `out/index.html` 83KB, 스크립트/태그 제거 후 순수 텍스트 **2,745자**
  - `out/index.html` 헤딩 구성: h1=1, h2=6, **h3=18**
  - 동반 청크: `ui.tsx`(582줄) + `DependentEvidenceChecklist.tsx`(253줄) + `guidance.ts` + `judge.ts` 가 전부 홈 번들로 들어온다
- **문제**
  1. **성능** — 홈은 자연 유입이 처음 닿는 페이지인데, 스크롤 한참 아래(`#judge`)에 있는 폼의 하이드레이션 비용을 초기부터 낸다. (실제 LCP/INP 영향은 실측 필요 → 가설 섹션)
  2. **콘텐츠 깊이** — 최상위 권위 페이지의 본문이 2,745자다. h3 18개 대부분이 카드 제목(`SCENARIOS`, `GUIDE_*`, `POPULAR_QUESTIONS` — `page.tsx:44-101`)이라 **헤딩은 많은데 그 아래 답이 없다.**
- **개선 방향** 도구 지연 로드(`next/dynamic`) + 홈에 "피부양자란 무엇인가 / 2026년 기준 요약" 자립 문단 추가(AEO 섹션 참조). 두 조치가 같은 방향으로 작동한다.
- **확신도** 코드·산출물 사실은 High / 성능 영향 크기는 Low (실측 없음)
- **예상 공수** M

---

### [Nit-1] `MoneyInput` 이 16자리 이상 입력을 조용히 무시한다
`src/components/ui.tsx:189` — `if (digits.length > 15) return;` 입력이 반영되지 않는데 피드백이 없어 사용자는 고장으로 인식한다. 15자리로 잘라 반영하거나 최소한 시각 피드백을 준다.

### [Nit-2] `calculateRegionalPremium()` 이 의미 없는 `nonWageIncomePortion: 0` 을 반환한다
`src/lib/premium/regional.ts:174` — 지역가입자에는 "보수 외 소득월액보험료" 개념이 없다. 두 계산기가 `PremiumBreakdown` 타입을 억지로 공유하며 생긴 잔재다. 생략(`undefined`)해야 타입이 진실을 말한다.

### [Nit-3] `sitemap.ts` 가 전 경로에 `changeFrequency: 'monthly'` 를 고정한다
`src/app/sitemap.ts:21` — Google은 `changefreq` 를 사실상 무시한다. 유지 비용은 0이지만 "관리하고 있다"는 착각을 준다. 제거하거나 실제 갱신 주기를 반영한다.

---

## SEO / AEO / GEO 진단

**해당 여부: 해당됨.** `gijuncheck.kr` 로 공개 배포되는 한국어 정보 사이트이며, 검색 유입이 사업 모델의 전제다(`src/components/guide.tsx:7-8` — "애드센스 승인 요건이면서 도구 페이지의 낮은 RPM을 방어하는 장치").

| 항목 | 상태 | 근거 | 심각도 |
|---|---|---|---|
| 크롤러가 JS 없이 본문 접근 | ✅ | `next.config.mjs:20` `output: 'export'` · `out/*/index.html` 에 본문·FAQ·표가 완전히 인라인(가이드 52~58KB, 판정기 45KB) | — |
| 페이지별 고유 title/description | ✅ | `src/lib/metadata.ts:19-57` · 산출물 확인 `<title>피부양자 자격판정 — … \| 기준체크</title>`. 상수에서 금액을 주입해 본문과 동기화 | — |
| canonical | ✅ | `metadata.ts:33` · 15개 HTML 중 13개가 자기 절대 URL, 404만 의도적 제외(`not-found.tsx:6` `canonical: null`) | — |
| sitemap / robots | ✅ | `sitemap.ts` 가 `routes.ts` 레지스트리에서 자동 생성 → 신규 페이지 자동 반영. `ready:false` 2건·`noindex:true` 3건이 정확히 제외돼 11 URL 출력. `robots.txt` 에 sitemap 절대경로 포함 | — |
| noindex 유출 | ✅ | `site.ts:50` `indexable: !override` — 임시 URL이면 전체 차단, 본 도메인이면 개방. 산출물에서 `index, follow` 확인 | — |
| 구조화 데이터 (JSON-LD) | ⚠️ | Organization+WebSite(`structured-data.ts:10-39`), 가이드 Article+Breadcrumb+FAQPage(`guide.tsx:40-88`), 판정기 WebApplication+FAQ(`dependent/page.tsx:49-72`), AboutPage+Person(`verification-policy/page.tsx:17-44`). **홈만 사이트 그래프 2블록뿐** — FAQ/HowTo 없음. `Organization.sameAs` 부재 | Medium |
| 시맨틱 헤딩 구조 | ✅ | 15개 HTML **전부 h1 정확히 1개**. `<main>`(`layout.tsx:130`), `<article>`, `<nav aria-label>`, `<section aria-labelledby>` 일관 사용 | — |
| 인용 가능한 콘텐츠 청킹 | ⚠️ | 가이드는 우수 — `GuideHeader` 가 "한 줄 답변" 블록을 h1 직후에 강제(`guide.tsx:116-119`), FAQ는 `<dt>/<dd>` + 개별 앵커(`guide.tsx:273`). **홈은 반대** — `POPULAR_QUESTIONS`(`page.tsx:71-101`) 6개가 질문만 던지고 답은 다른 페이지 링크로 넘긴다 | Medium |
| 저자·최신성 신호 | ⚠️ | Person/Organization 엔티티 존재, `/verification-policy` 로 검증 방법론 공개(E-E-A-T 강점). 다만 `dateModified` 가 전 가이드 공통 상수(**Medium-2**), `sameAs`·실명·소속 없음 | Medium |
| AI 크롤러 접근 정책 | ✅ | `out/robots.txt` = `User-Agent: * / Allow: /`. GPTBot·ClaudeBot·PerplexityBot·Google-Extended·CCBot **차단 없음** → 노출 의도와 일치 | — |
| `llms.txt` | ❌ | `public/` 에 없음. 표준 아님·채택률 제한적이므로 Minor 이하 | Low |
| OG / Twitter Card | ⚠️ | 페이지별 전용 이미지 14장 + `summary_large_image` 완비(`metadata.ts:34-55`). 개당 700KB(**Low-2**), `og:image:alt` 에 description 전문을 그대로 넣어 과도하게 길다(`metadata.ts:46`) | Low |
| 이미지 alt / 크기 | ⚠️ | 로고는 장식이라 `alt="" aria-hidden` 이 정확(`layout.tsx:100`). 단 `width`/`height` 속성 없이 Tailwind 클래스만 사용 — CSS가 렌더 블로킹이라 실질 CLS는 낮으나 명시가 안전 | Low |
| 내부 링크 | ✅ | `ToolCta`/`RelatedList`/`GUIDE_KEYS`(`routes.ts:209`)로 도구↔가이드 양방향 동선. `e2e/links.spec.ts:56` 이 전체 크롤로 404를 막고 있음 | — |

### 가장 큰 병목 한 가지

**홈이 "피부양자 자격" 이라는 최상위 질의에 대해 아무 답도 하지 않는다.** 가장 많은 링크와 권위를 받을 페이지의 본문이 2,745자뿐이고, `POPULAR_QUESTIONS` 6개(`page.tsx:71-101`)는 질문을 헤딩으로 쓰고도 답을 **다른 페이지로 보내는 링크**로만 채워 놓았다. 답변엔진은 링크를 따라가지 않고 그 자리의 텍스트를 인용하므로, 지금 구조에서 홈은 인용 대상이 될 수 없다.

각 인기 질문 아래에 **자립적인 2~3문장 직답**과 "X는 ~이다" 형태의 정의문을 배치하고(예: "피부양자는 직장가입자에게 생계를 의존해 보험료를 따로 내지 않는 가족이다. 2026년 기준 합산소득 연 2,000만원 이하, 재산세 과세표준 5.4억원 이하가 핵심 요건이다."), 그 뒤에 상세 링크를 두는 순서로 뒤집는 것만으로 홈이 인용 후보가 된다. 여기에 홈 `FAQPage` JSON-LD를 추가하면(가이드는 이미 하고 있다 — `guide.tsx:78-85`) 사이트에서 가장 강한 페이지가 가장 약한 페이지에서 벗어난다. 이 변경은 Low-5의 콘텐츠 깊이 문제도 동시에 해결한다.

---

## 가설 — 근거 부족, 추가 확인 필요

1. **Core Web Vitals 실측** — 홈이 `DependentJudge`+`ui.tsx`(합계 약 1,000줄 클라이언트 코드)를 싣고 `main`/`framework` 청크가 각각 122KB/190KB다. 하지만 LCP/INP/CLS 실측값은 코드로 알 수 없다. **판정 방법**: `@vercel/speed-insights` 가 이미 붙어 있으므로(`layout.tsx:71`) 배포 후 2주 실데이터, 또는 PSI 필드 데이터. Low-5의 지연 로드 제안은 실측 후 착수할 것.

2. **`PREMIUM_LIMIT.LOWER = 20,160원`(`2026.ts:102`)의 출처** — 2025년 지역가입자 하한이 19,780원이므로 값 자체는 그럴듯하다. 그러나 「월별 건강보험료액의 상한과 하한에 관한 고시」 2026년 개정본 원문을 대조하지 못했다. **판정 방법**: 보건복지부 고시 원문 확인. `RATE.LONG_TERM_CARE = 0.009448`, `REMUNERATION_PREMIUM_UPPER = 9,183,480` 도 같은 상태다.

3. **`calculateVoluntaryPremium()` 의 혼합소득 안분 근사(`regional.ts:218-231`)** — 코드는 `(연간소득 − 2,000만) × (전체 대비 반영 후 비율)` 로 계산한다. 공단 안내식 `{(연간 보수외소득 − 2,000만) ÷ 12} × 소득평가율 × 보험료율` 을 따른 것으로 보이나, **소득 종류가 섞였을 때 "소득평가율"이 무엇인지**가 안내에 명시돼 있지 않다. 종류별 평가율을 먼저 적용한 뒤 2,000만을 빼는 해석이라면 결과가 달라진다(연금 3,000만 단독 시 코드는 월 약 29,955원, 대안 해석은 0원). **판정 방법**: 시행령 제41조 원문 + 공단 로그인 모의계산 혼합소득 케이스 대조. 코드 주석에 근사임을 명시하지도 않았다. 사용자 영향이 크므로 High-1 다음 우선순위.

4. **`ZeroValueConfirmModal` 의 `aria-hidden` 조작과 `role="status"` 결과 영역의 충돌 여부**(`ui.tsx:452-463`) — 모달이 `document.body` 직계 자식 전체에 `aria-hidden="true"` 를 건다. 판정 결과가 이미 렌더된 상태에서 재제출하면 `aria-live` 영역이 숨겨진 채 갱신되어 스크린리더가 결과를 놓칠 수 있다. **판정 방법**: NVDA/VoiceOver 실기기 검증. `e2e/keyboard-a11y.spec.ts:43` 은 포커스 트랩만 보고 있어 이 케이스를 다루지 않는다.

5. **`propertyScoreDetail()` 의 부동소수점 경계**(`property-score-table.ts:186`) — `afterDeduction / 10_000` 후 `manwon <= bracket.upToManwon` 비교다. 경계 금액이 만원 정수배라 실무상 문제없어 보이고 `regional.test.ts:166` 이 전 경계를 검사하지만, 1원 단위 입력이 가능한 UI(`MoneyInput`)에서 `450.0001` 같은 값이 나올 수 있다. **판정 방법**: `Math.floor(afterDeduction / 10_000)` 로 바꿨을 때 기존 테스트가 깨지는지 확인. 실제 부과는 만원 단위 절사일 가능성이 높다.

6. **`SITE.indexable` 오작동 리스크** — `site.ts:26,50` 은 `NEXT_PUBLIC_SITE_URL` 이 **존재하면** 색인을 막는다. Vercel에서 이 변수를 본 도메인 값으로 설정해두면(자연스러운 실수) 프로덕션 전체가 `noindex` 가 된다. **판정 방법**: Vercel 프로젝트 환경변수 실제 상태 확인. `indexable: !override || override === PRODUCTION_URL` 로 방어하는 편이 안전하다.

---

## 유지할 것

- 정적 export를 실제로 관철해 크롤러·답변엔진이 JS 없이 본문 전체를 읽을 수 있다 — AEO/GEO의 전제를 이미 통과했다.
- `routes.ts` 단일 레지스트리에서 sitemap·OG 이미지·내부 링크·`noindex` 가 자동 파생된다. "페이지 추가하고 sitemap 잊기" 사고가 구조적으로 불가능하다.
- 피부양자 판정 경계값 테스트 48개(`judge.test.ts`)가 2,000만원 ±1원, 5.4억/9억 ±1원, 만 30세/65세를 전부 잠그고 있다.
- 분석 이벤트가 타입으로 `boolean`/`enum` 만 허용해 금액 유출을 컴파일 타임에 차단한다(`analytics.ts:95-101`). 개인정보처리방침의 약속과 코드가 일치한다.
- 도구 간 값 전달에 URL이 아니라 sessionStorage를 쓰고 1회 소비 후 즉시 삭제하며 스키마 검증까지 한다(`premium-handoff.ts:192-246`).
- `/verification-policy` 로 검증 방법론을 공개하고 `VERIFIED` / `VERIFIED_AGAINST_NHIS` 를 코드 플래그로 분리해 UI 경고와 연동한 설계 — E-E-A-T 자산이다. High-1은 이 설계의 결함이 아니라 실행의 결함이다.
- `josa()`(`format.ts:138`)와 `toKoreanAmount()`(`format.ts:41`) — 한국어 도구가 신경 써야 할 지점을 정확히 짚었다. 호출부에서 빠뜨린 곳만 채우면 된다.
- `ZeroValueConfirmModal` 의 접근성 구현(포커스 트랩·복원·Escape·형제 `aria-hidden`) 수준이 높다. 트리거 조건만 고치면 된다.
- 주석이 "왜"를 설명한다 — `next.config.mjs:6-19` 의 제약 3가지, `ui.tsx:29-43` 의 iOS 확대·대비비 근거, `2026.ts:52-54` 의 두 1,000만원 구분 경고. 인수인계 비용을 실제로 낮춘다.
