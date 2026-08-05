# 비평 리포트 — critic-beta

작성: 2026-08-05 · 대상 커밋: `7be0206` (main, clean)
접근 순서: 경계면(설정·CI·테스트·빌드 산출물) → 실행 검증 → 소비자 관점 정독 → 도메인 정확성

---

## 1. 검토 범위

### 실제로 읽은 파일 (전문)
설정: `package.json`, `next.config.mjs`, `vercel.json`, `vitest.config.ts`, `playwright.config.ts`,
`eslint.config.mjs`, `tsconfig.json`, `.github/workflows/ci.yml`, `.env.example`, `.gitignore`, `tailwind.config.ts`

라이브러리: `src/lib/constants/2026.ts`, `src/lib/constants/property-score-table.ts`,
`src/lib/dependent/judge.ts`, `types.ts`, `guidance.ts`, `sources.ts`, `application.ts`,
`src/lib/premium/regional.ts`, `src/lib/format.ts`, `src/lib/routes.ts`, `src/lib/site.ts`,
`src/lib/metadata.ts`, `src/lib/structured-data.ts`, `src/lib/analytics.ts`, `src/lib/premium-handoff.ts`

컴포넌트/페이지: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/not-found.tsx`,
`src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/privacy/page.tsx`,
`src/app/health-insurance/dependent/page.tsx`, `src/app/verification-policy/page.tsx`(부분),
`src/app/health-insurance/guides/pension-impact/page.tsx`(부분),
`src/components/DependentJudge.tsx`, `RegionalPremiumCalc.tsx`, `VoluntaryComparison.tsx`,
`ui.tsx`, `guide.tsx`, `Analytics.tsx`, `src/app/globals.css`

테스트: `src/lib/premium/regional.test.ts`, `src/lib/dependent/official-cases.test.ts`,
`e2e/og-meta.spec.ts`, `e2e/guide-quality.spec.ts`, `e2e/voluntary-continuation.spec.ts`(부분)

### 실행한 명령
```
npm run lint      → exit 0 (warning 3건)
npx tsc --noEmit  → exit 0 (무출력)
npx vitest run    → 6 files / 136 tests 전부 통과 (786ms)
```
빌드 산출물 `out/` 를 직접 열어 검사: `robots.txt`, `sitemap.xml`, 16개 HTML의
title/description/canonical/robots/h1 개수/JSON-LD 개수, `_next/static` 청크 크기,
`public/og/*.png` 헤더(1200x630, colortype 2, 파일 크기).

외부 대조: 2026년 요율·상한/하한 고시(웹 검색), 별표1 부양요건(NHIS 안내 페이지·언론 보도).

### 검토하지 못한 영역 (명시)
- **E2E 미실행.** 5개 프로젝트 × Playwright 브라우저 설치가 필요해 이번 세션에서 돌리지 않았다.
  E2E 관련 지적은 전부 **소스 정독 기반**이며 실행 결과가 아니다.
- `docs/` 하위 문서 대부분(`03-검증기록.md` 포함) — "공단 모의계산 13건 대조 완료" 주장의
  1차 근거를 확인하지 못했다. 아래 G-4의 사유다.
- 가이드 6편 중 5편의 본문 전문, `DependentEvidenceChecklist.tsx`, `TrustSignal.tsx`,
  `ScenarioIcon.tsx`, `e2e/{pages,links,analytics,keyboard-a11y,dependent-judge,regional-premium}.spec.ts`.
- Core Web Vitals 실측, 실제 색인 상태, Rich Results 검증 결과 — 코드만으로 알 수 없다.
- `reports/review-1/` 과 `reports/critic-alpha.md` — 지시에 따라 열지 않았다.

---

## 2. 요약 판단

기술 파이프라인(lint/typecheck/unit/build)은 **전부 초록**이고, 2026년 요율 상수(7.19%,
0.9448%, 211.5원, 상한 4,591,740원, 하한 20,160원)는 외부 1차 고시와 **전부 일치**한다.
SEO 기본기(페이지별 고유 title/description, canonical 1개, robots 분기, 자동 sitemap,
Article/FAQPage/Breadcrumb JSON-LD)는 이 규모의 개인 프로젝트로서는 상위 수준이고,
그걸 E2E로 잠가둔 것(`e2e/og-meta.spec.ts`)은 드문 성숙도다.

그럼에도 **지금 상태로 출시하면 안 된다.** 이유는 세 가지다.
(1) 결과 화면에 **눈에 보이는 렌더링 버그**가 두 개 있고, 그중 하나는 E2E 테스트가
오히려 잘못된 문자열을 고정시켜 놓았다 — 테스트가 버그를 보호하고 있다.
(2) 피부양자 부양요건 모델이 시행규칙 별표1보다 단순한데, **어디를 단순화했는지 화면에도
코드에도 없다.** 이 사이트는 "근거를 함께 보여준다"를 핵심 가치로 내걸었으므로
이 침묵은 다른 사이트에서보다 훨씬 비싸다.
(3) OG 이미지 14장이 620~770KB(합계 약 9.5MB)로, 배포 산출물 13MB의 73%를 차지한다.

AEO/GEO 관점의 최대 병목은 **홈페이지**다. 최우선 순위(priority 1.0) URL인데 페이지 레벨
구조화 데이터가 0이고, 질문 6개를 나열하면서 답을 한 줄도 싣지 않아 인용 대상이 되지 않는다.

---

## 3. 발견 항목

### [High-1] 재산이 1억 이하일 때 결과 화면에 숫자 "0"이 그대로 찍힌다

- **근거**: `src/components/VoluntaryComparison.tsx:226-227`
  ```tsx
  소득 {won(regional.incomePortion)} + 재산 {won(regional.propertyPortion)}
  {regional.propertyGrade &&
    ` (${regional.propertyGrade}등급)`}
  ```
  `propertyGrade`의 출처: `src/lib/premium/regional.ts:178` → `src/lib/constants/property-score-table.ts:183`
  (`afterDeduction <= 0` 이면 `grade: 0`).
- **문제**: `propertyGrade`는 `number | null` 이고, 기본공제 1억원 이하 구간에서 **0**이 된다.
  JSX에서 `{0 && "..."}` 는 `0`으로 평가되고 React는 숫자 0을 **텍스트로 렌더링한다**
  (`false`/`null`/`undefined` 만 건너뛴다). 결과적으로 화면에 `소득 0원 + 재산 0원0` 이 출력된다.
  이 화면의 기본 상태가 property=0 (`VoluntaryComparison.tsx:45`)이므로, **아무것도 입력하지 않고
  비교 버튼을 누른 대다수 사용자가 첫 화면에서 이걸 본다.**
- **영향**: 금액을 다루는 도구에서 정체불명의 숫자가 붙는 것은 신뢰도에 직접 타격이다.
  같은 값을 다루는 `RegionalPremiumCalc.tsx:227` 은 삼항연산자를 써서 이 문제를 피하고 있어,
  두 컴포넌트가 같은 값을 다르게 다루는 일관성 결함이기도 하다.
- **개선 방향**:
  ```tsx
  {regional.propertyGrade ? ` (${regional.propertyGrade}등급)` : null}
  ```
  근본 대책으로는 `propertyScoreDetail` 이 0 대신 `null` 을 반환하도록 좁히거나
  (`property-score-table.ts:183`), ESLint `react/jsx-no-leaked-render` 를 켜서 재발을 막는다.
- **확신도**: High (React 렌더링 규칙 + 타입 확인 완료)
- **예상 공수**: S

---

### [High-2] "임의계속가입가 월 …" — 조사 오류를 E2E 테스트가 고정하고 있다

- **근거**:
  - 버그: `src/components/VoluntaryComparison.tsx:196-198`
    ```tsx
    {voluntaryWins ? '임의계속가입' : '지역가입자'}가 월{' '}
    {won(Math.abs(result.monthlySaving))} 유리합니다
    ```
  - 테스트가 이를 고정: `e2e/voluntary-continuation.spec.ts:76`
    `await expect(result(page)).toContainText('임의계속가입가 월');`
  - 프로젝트가 이미 만들어 둔 해법: `src/lib/format.ts:138` `josa(word, key)`
  - 그 함수의 주석 원문(`src/lib/format.ts:126-129`):
    "이걸 쓰지 않고 조사를 직접 붙이면 … **기계가 쓴 티가 나고 신뢰도를 깎는다.**"
- **문제**: "임의계속가입"은 받침(ㅂ)으로 끝나므로 올바른 조사는 "이"다. 하드코딩된 "가"는
  한쪽 분기에서만 맞고(지역가입자**가**), 다른 분기에서 틀린다(임의계속가입**가**).
  이 화면의 **결론 문장**, 즉 가장 크게 표시되는 한 줄이다.
- **영향**: 자기 코드베이스가 명시적으로 "신뢰도를 깎는다"고 규정한 실수를 결론 문장에서 저지르고 있다.
  더 나쁜 것은 E2E가 틀린 문자열을 assert 하고 있어서, 누군가 문장을 고치면
  **테스트가 깨지고 "고친 쪽"이 롤백될 가능성이 높다**는 점이다.
- **개선 방향**:
  ```tsx
  import { josa } from '@/lib/format';
  {josa(voluntaryWins ? '임의계속가입' : '지역가입자', '가')} 월 …
  ```
  `e2e/voluntary-continuation.spec.ts:76` 도 함께 수정하고,
  `format.test.ts` 에 `josa('임의계속가입','가') === '임의계속가입이'` 회귀 케이스를 추가한다.
- **확신도**: High
- **예상 공수**: S

---

### [High-3] 부양요건 모델이 별표1보다 단순한데, 그 단순화가 어디에도 고지되지 않는다

- **근거**:
  - 관계는 6종으로만 나뉜다: `src/lib/dependent/types.ts:4-16`.
    특히 `linealDescendant` 의 라벨이 `'직계비속 (자녀·손자녀)'` (`types.ts:21`) 로,
    자녀와 손자녀를 명시적으로 같은 분기에 묶는다.
  - 판정: `src/lib/dependent/judge.ts:104-128` — 직계비속은 `cohabiting` 과 `married` 두 boolean만 본다.
    동거면 무조건 `passed: true` ("동거하는 직계비속은 부양이 인정됩니다").
  - 혼인 상태 입력: `src/components/DependentJudge.tsx:182-191` — 선택지가
    `미혼` / `기혼` 뿐. **이혼·사별 선택지가 없고, 어느 쪽을 고르라는 안내도 없다.**
  - 형제자매 비동거: `judge.ts:152-159` — `!cohabiting` 이면 **무조건 탈락**.
  - 이 사이트가 스스로 링크하는 근거: `src/lib/dependent/sources.ts:44-53` (별표1 원문).
- **문제**: 세 가지 실질 괴리가 있다.
  1. **손자녀·외손자녀**: 별표1은 손·외손에 대해 부모의 부재·부양능력 요건을 별도로 둔다.
     코드에 이 분기가 없어, 부모가 있는 동거 손자녀에게도 "부양이 인정됩니다"를 단정 출력한다.
     (별표1 원문 전문은 PDF 파싱 실패로 직접 인용하지 못했다 → 확신도 Medium, G-1 참조)
  2. **이혼·사별**: 공단·언론 자료상 이혼·사별은 일정 요건에서 미혼으로 간주된다.
     UI에 그 선택지가 없어 사용자가 "기혼"을 고르면 즉시 탈락 판정을 받는다.
     법령 해석과 무관하게 **"어느 쪽을 고를지 알 수 없는 입력"이라는 UX 결함은 코드만으로 확정된다.**
  3. **비동거 형제자매**: 코드가 하드 탈락시킨다. 메시지에 "원칙적으로"라는 완충어가 있으나
     `passed: false` 라 결과는 탈락이고, 예외 경로가 있다는 사실이 사용자에게 전달되지 않는다.
- **영향**: 이 사이트의 유일한 차별점은 "근거와 함께 보여준다"이다. 별표1 원문으로 링크를
  걸어두고 그보다 단순한 모델을 돌리면서 단순화 사실을 말하지 않으면,
  **거짓 안심(false pass)과 거짓 탈락(false fail)을 근거 링크로 포장하는 구조**가 된다.
  `verification-policy` 페이지의 커버리지 표(`src/app/verification-policy/page.tsx:47-52`)도
  커버 범위만 적고 미커버 영역을 밝히지 않는다.
- **개선 방향** (우선순위 순):
  1. `DependentInput.married` 를 `maritalStatus: 'single' | 'married' | 'divorcedOrWidowed'` 로 확장하고,
     세 번째 값은 안내 문구와 함께 "추가 확인 필요"로 분류.
  2. `Relation` 에 `grandchild` 를 분리하거나, `linealDescendant` 선택 시
     "손자녀는 부모의 부양능력 요건이 별도로 적용됩니다 — 공단 확인 필요" 배너를 강제 노출.
  3. 비동거 형제자매는 `passed: false` 대신 `getConfidenceSummary` 의 `verify` 경로로 보내고
     예외 요건을 문장으로 안내.
  4. `verification-policy` 에 **"모델이 다루지 않는 것"** 절을 신설해 위 세 항목을 명시.
     이건 신뢰도를 깎는 게 아니라 올리는 조치다.
- **확신도**: 모델 단순화 사실 자체 **High** / 각 항목의 정확한 법령 문언 **Medium**
- **예상 공수**: M (2~3d)

---

### [High-4] OG 이미지 14장이 620~770KB — 배포 산출물 13MB 중 9.5MB

- **근거**: 측정값 (`ls -l public/og/`, PNG IHDR 파싱)
  ```
  before-business-registration.png  766,953 B   1200x630 colortype 2 (truecolor RGB)
  regional-premium.png              756,665 B
  terms.png                         733,630 B
  contact.png                       729,925 B
  home.png                          624,580 B
  … (총 14장, 평균 약 680KB)
  ```
  `out/` 전체 13MB, `out/_next/static/chunks` 926KB. **이미지가 산출물의 대부분이다.**
  참조: `src/lib/site.ts:60`, `src/lib/routes.ts:36,45,53,…`
- **문제**: 1200×630 텍스트 카드를 24bit truecolor PNG로 저장했다.
  PNG-8(팔레트) 또는 WebP로 저장하면 통상 30~80KB로 떨어진다 — **8~20배 차이**.
  `public/README.md:31-33` 는 스스로 "이미지는 미리 압축해서 넣고, WebP 변환도 직접 해야 합니다"라고
  적어놓고 지키지 않았다.
- **영향**: 카카오톡 공유 미리보기는 대용량 OG 이미지에서 썸네일 생성이 지연·실패하는 사례가 잦다.
  한국 트래픽에서 카톡 공유는 주요 유입 경로다. 부수적으로 Vercel 대역폭 소진이 빨라진다.
  LCP에 직접 영향은 없다(OG 이미지는 페이지에 렌더되지 않음) — 이 점은 구분해 둔다.
- **개선 방향**: `sharp`/`pngquant`/`oxipng` 로 일괄 재인코딩.
  `e2e/og-meta.spec.ts:63-65` 가 이미 OG 이미지를 fetch 하므로 거기에
  `expect(Number(headers['content-length'])).toBeLessThan(200_000)` 한 줄만 더하면 CI가 잠근다.
- **확신도**: High (직접 측정)
- **예상 공수**: S

---

### [High-5] 사용되지 않는 624KB 이미지가 프로덕션 루트에 배포된다

- **근거**: `out/og.png` (624,580 B). `grep -rn "og\.png" src/ | grep -v "/og/"` → **참조 0건**.
  `SITE.ogImage` 는 `/og/home.png` 다 (`src/lib/site.ts:60`).
- **문제**: `public/og.png` 는 `public/og/home.png` 로 옮겨간 뒤 남은 잔재로 보이며,
  아무도 참조하지 않는 채 매 배포마다 624KB가 루트로 나간다.
- **영향**: 대역폭 낭비 + `https://도메인/og.png` 라는 색인 가능한 고아 URL 생성.
- **개선 방향**: `public/og.png` 삭제. 아래 [Medium-6]과 함께 `public/` 루트 정리.
- **확신도**: High
- **예상 공수**: S

---

### [Medium-1] 홈에 페이지 레벨 구조화 데이터가 하나도 없다 — priority 1.0 URL인데

- **근거**:
  - `src/app/page.tsx` 전문에 `<script type="application/ld+json">` 없음
    (`ldJson`/`breadcrumbJsonLd` import 자체가 없다).
  - 빌드 산출물 확인: `out/index.html` 의 JSON-LD는 Organization/WebSite 그래프 하나뿐
    (layout에서 온 것). 반면 `out/health-insurance/dependent/index.html` 등은 2개.
  - sitemap 우선순위 1.0: `src/lib/routes.ts:37`
  - E2E도 홈을 검사하지 않는다: `e2e/guide-quality.spec.ts:63,102` 는 GUIDE_KEYS, TOOL_KEYS 만 순회.
- **문제**: 홈에 FAQPage·ItemList·BreadcrumbList 중 어느 것도 없다.
  특히 홈에는 POPULAR_QUESTIONS 6개(`src/app/page.tsx:71-98`)가 있는데
  **질문만 있고 답이 없다** — 링크만 걸려 있다.
- **영향**: 답변엔진은 페이지 단위로 인용 가능한 청크를 뽑는다. "질문 텍스트 + 링크"는
  답이 없어 인용되지 않고, 홈은 내부 링크를 가장 많이 받는 URL이면서 인용 자산이 0인 상태가 된다.
- **개선 방향**:
  1. POPULAR_QUESTIONS 각 항목에 1~2문장 직답을 추가해 화면에 렌더하고,
     같은 내용으로 FAQPage JSON-LD를 붙인다. 링크는 "자세히 →"로 유지.
  2. 3개 도구를 담은 ItemList + BreadcrumbList 추가.
  3. `e2e/guide-quality.spec.ts` 의 JSON-LD 검사 루프에 `ROUTES.home` 을 포함시킨다.
- **확신도**: High (빌드 산출물로 확인)
- **예상 공수**: M

---

### [Medium-2] 홈과 `/health-insurance/dependent/` 가 동일한 판정기를 렌더한다 — 키워드 자기잠식

- **근거**:
  - `src/app/page.tsx:2` — DependentJudge import
  - `src/app/page.tsx:411` — `<DependentJudge />` (섹션 id="judge")
  - `src/app/health-insurance/dependent/page.tsx:100` — 같은 컴포넌트
  - 두 URL 모두 색인 대상이고 sitemap에 있다(`routes.ts:39,49`), priority 1.0 / 0.9.
  - `out/index.html` 94,531 B vs `out/health-insurance/dependent/index.html` 53,662 B — 홈이 더 크다.
- **문제**: 두 페이지의 **핵심 인터랙티브 콘텐츠가 동일**하다. title/description/canonical은
  분리돼 있어 중복 콘텐츠 페널티 대상은 아니지만, "피부양자 자격" 같은 최상위 질의에서
  구글이 어느 쪽을 띄울지 스스로 정하게 되고 링크 신호가 갈린다.
  내부 링크도 모순적이다 — 헤더/시나리오 카드는 홈 앵커(#judge)로 보내고
  (`layout.tsx:108`, `page.tsx:127,214`), 같은 페이지 안에서 다시
  "전용 페이지에서 이 판정기 열기 →"(`page.tsx:428`)로 내보낸다.
- **영향**: 전용 페이지로 유입을 몰아주려는 SEO 의도와 홈에서 즉시 전환시키려는 CRO 의도가
  충돌한 채 방치돼 있다. 부수적으로 홈이 판정기 클라이언트 번들 전체를 지고 간다.
- **개선 방향**: 둘 중 하나를 고른다.
  (a) 홈에서는 판정기를 빼고 3단계 미리보기 + 전용 페이지 CTA만 남긴다 → 홈은 허브,
      전용 페이지가 랭킹 타깃. 홈 HTML도 40KB 줄어든다.
  (b) 홈에 남기되 전용 페이지를 홈으로 canonical 통합 → 전용 페이지의 고유 FAQ·메타를 잃는다.
  실측 데이터(G-6)가 없으므로 (a)를 권한다.
- **확신도**: Medium (구조는 High, 어느 쪽이 유리한지는 실측 필요)
- **예상 공수**: S~M

---

### [Medium-3] vitest 설정이 `.test.tsx` 를 조용히 무시한다 — 컴포넌트 테스트가 원천 차단

- **근거**: `vitest.config.ts:5-8` — `environment: "node"`, `include: ["src/**/*.test.ts"]`
- **문제**: include 가 `.ts` 만 잡는다. 누군가 `DependentJudge.test.tsx` 를 작성하면
  **에러 없이 그냥 실행되지 않는다.** 통과도 실패도 아닌 침묵이라 알아채기 매우 어렵다.
  `environment: "node"` 라 DOM도 없다. 결과적으로 이 저장소에는 컴포넌트 단위 테스트가
  구조적으로 존재할 수 없고, 실제로 `DependentEvidenceChecklist.test.ts` 만이
  컴포넌트 파일 옆에서 순수 헬퍼를 테스트하는 형태로 우회하고 있다.
- **영향**: [High-1](숫자 0 렌더링)과 [High-2](조사 오류)가 **둘 다 렌더링 결과 버그**라는 게
  우연이 아니다. 렌더링을 검증할 유일한 층이 느린 5-프로젝트 Playwright뿐이고,
  그마저 toContainText 부분 일치라 이런 결함을 통과시킨다.
- **개선 방향**: include 를 `src/**/*.test.{ts,tsx}` 로 넓히고
  environmentMatchGlobs 로 `.test.tsx` 만 jsdom 을 쓰게 한다. `@testing-library/react` 도입.
  세 결과 컴포넌트의 스냅샷 한 장씩만 있어도 위 두 버그는 즉시 잡혔다.
- **확신도**: High
- **예상 공수**: M

---

### [Medium-4] 임의계속가입 보수 외 소득의 반영률 배분식에 근거가 없다

- **근거**: `src/lib/premium/regional.ts:218-231`
  초과분(연 소득 − 2,000만원)에 "전체 소득 대비 가중평균 반영률"을 곱하는 방식이다.
  테스트가 이 결과를 고정: `src/lib/premium/regional.test.ts:386-394`
  (사업 3,000만 + 연금 1,000만 → 초과분 2,000만 × 0.875 = 1,750만)
- **문제**: 시행령의 소득월액 산식은 (연간 보수외소득 − 2,000만원) ÷ 12 × 소득평가율 인데,
  **소득 종류가 섞였을 때 평가율을 어떻게 적용하는지가 조문상 일의적이지 않다.**
  다른 유력한 해석은 "평가율을 먼저 적용해 보수외소득을 산정한 뒤 2,000만원을 뺀다"이고,
  같은 입력에서 1,750만 vs 1,500만 (약 17% 차이)로 갈린다.
  이 파일의 다른 모든 상수·산식에는 근거 조항 주석이 빠짐없이 달려 있는데
  (`2026.ts:107-126`, `property-score-table.ts:40-71`), **이 배분식만 주석이 없다.**
  `crossChecked: false`(`regional.ts:257`)로 화면에 참고용 배지가 뜨는 점은 인정한다(`ui.tsx:542-551`).
- **영향**: 이 도구의 결론(월 N원 유리)은 두 금액의 **차이**라,
  한쪽만 17% 틀리면 유불리 결론 자체가 뒤집힐 수 있다.
- **개선 방향**:
  1. 시행령 제41조 및 공단 소득월액보험료 산정 예시로 해석을 확정하고 `regional.ts:218` 위에 근거 주석.
  2. 확정 전까지 `VoluntaryComparison.tsx:252-256` 의 "보수 외 소득보험료 추가" 줄에 근사 계산임을 표기.
  3. 두 해석의 차이를 테스트로 명시해 다음 사람이 헤매지 않게 한다.
- **확신도**: Medium (배분식이 무근거라는 사실은 High, 어느 해석이 옳은지는 미확정)
- **예상 공수**: S(표기) + M(법령 확정)

---

### [Medium-5] 보안 응답 헤더에 CSP / X-Frame-Options / Permissions-Policy 가 없다

- **근거**: `vercel.json:1-15` — 설정된 헤더는
  Referrer-Policy, X-Content-Type-Options, Strict-Transport-Security 3개뿐.
- **문제**:
  - **X-Frame-Options / frame-ancestors 부재** → 임의의 사이트가 이 판정기를 iframe으로 감싸
    "공단 공식 도구"인 척 재포장할 수 있다. 이 프로젝트는 `layout.tsx:77-79` 에
    "공단의 공식 판정 화면이 아닙니다" 상시 배너를 두고 `docs/design-debate/02-critique-legal.md`
    까지 만들어가며 **공공기관 오인 리스크를 최우선으로 관리해 왔다.**
    그런데 오인을 만드는 가장 쉬운 기술적 경로가 열려 있다.
  - **CSP 부재** → 외부 스크립트가 GA4와 Vercel Speed Insights 둘뿐이라
    CSP 도입 난이도가 가장 낮은 형태인데도 적용하지 않았다.
- **영향**: 클릭재킹·리브랜딩 사칭. 소득·재산을 입력하는 폼이므로 피싱 페이지에 얹히면 피해가 실재한다.
- **개선 방향**: `vercel.json` 에 다음을 추가한다.
  - X-Frame-Options: DENY
  - Permissions-Policy: camera, microphone, geolocation 전부 빈 허용목록
  - Content-Security-Policy: default-src 는 자기 출처, script-src 에 googletagmanager 와
    va.vercel-scripts 허용, connect-src 에 google-analytics 와 vitals.vercel-insights 허용,
    frame-ancestors 는 none, base-uri 는 자기 출처, form-action 은 none
  Next 인라인 부트스트랩과 JSON-LD 때문에 script-src 에 인라인 허용이 불가피하고
  정적 export 라 nonce 를 쓸 수 없다는 점은 주석으로 남길 것.
- **확신도**: High (헤더 부재는 파일로 확인) / 실제 악용 가능성 Medium
- **예상 공수**: S

---

### [Medium-6] 내부 개발 문서가 프로덕션 루트에 공개된다

- **근거**: `out/README.md` 존재 (973 B). 원본은 `public/README.md`.
  내용: 배포 구조 설명, 검색엔진 소유 확인 파일 명명 규칙, 애드센스 ads.txt 운영 계획 등.
- **문제**: `public/` 의 모든 파일이 배포 루트로 복사된다는 사실을 그 README 자신이 설명하면서,
  정작 자기가 그 대상이 된다. 도메인 루트의 `/README.md` 로 누구나 열람 가능하고,
  `robots.txt` 가 전체 Allow 라 색인도 가능하다.
- **영향**: 심각한 시크릿 유출은 없다(내용 확인함). 인프라·수익화 계획 노출 + 색인 가능한 비콘텐츠 URL 증가.
- **개선 방향**: `public/README.md` 를 `docs/` 로 이동, `public/og.png` 삭제([High-5]),
  E2E에 "out 루트에 .md 파일이 없다" 검사 1줄 추가.
- **확신도**: High
- **예상 공수**: S

---

### [Medium-7] 가이드 JSON-LD의 dateModified 가 경로별 변경일을 무시하고 전역 상수를 쓴다

- **근거**:
  - `src/components/guide.tsx:71` — dateModified 를 `SITE.lastVerified` 에서 가져온다
  - `src/lib/site.ts:66` — lastVerified 는 전역 1개 값 (2026-08-03)
  - 반면 sitemap 은 경로별 값을 쓴다: `src/app/sitemap.ts:20` + `routes.ts:38,48,56,…`
  - 현재 `out/sitemap.xml` 의 lastmod 는 2026-08-04(홈·dependent)와 2026-08-03(그 외)으로 갈린다.
- **문제**: 같은 URL에 대해 **sitemap lastmod 와 Article dateModified 가 서로 다른 소스를
  참조한다.** 지금은 가이드 6편이 모두 08-03이라 우연히 일치하지만, 가이드 한 편만 고치고
  `routes.ts` 의 lastModified 를 올리면 즉시 갈린다. 반대로 아무 가이드도 안 고치고
  `SITE.lastVerified` 만 올리면 **6편 전부의 dateModified 가 가짜로 갱신된다.**
- **영향**: 최신성 신호는 AEO/GEO 인용 선택에 직접 쓰인다. 불일치·허위 갱신은 신뢰 하락 요인이다.
- **개선 방향**: guideJsonLd 가 routeKey 를 받아 `ROUTES[key].lastModified` 를 쓰게 하고,
  `SITE.lastVerified` 는 화면 표기(기준 확인일)로만 쓴다. 두 개념을 분리한다.
  `e2e/guide-quality.spec.ts:91-97` 의 assert 도 경로별 값으로 바꾼다.
- **확신도**: High (코드 경로 확인)
- **예상 공수**: S

---

### [Medium-8] 판정에서 가장 많이 틀리는 정보가 툴팁 뒤에만 있다

- **근거**:
  - `src/components/ui.tsx:49-84` Field — hint 는 오직 InfoTooltip 으로만 렌더된다.
    본문으로 노출되는 경로가 없다.
  - `src/components/DependentJudge.tsx:281` — 재산세 과세표준 필드의 hint 는 "실거래가·공시가격 아님"
  - `src/components/DependentJudge.tsx:62` — 금융소득 hint 는 "이자 + 배당 · 1,000만원 이하면 합산 제외"
  - 툴팁 본문은 기본 opacity-0 이고 hover/focus/tap 시에만 보인다 (`ui.tsx:130-136`).
  - 이 사이트 자신의 평가(`src/app/page.tsx:66`):
    "공시가격과 재산세 과세표준은 다릅니다. **판정에서 가장 많이 틀리는 지점**입니다."
- **문제**: 스스로 "가장 많이 틀리는 지점"이라고 규정한 구분을, 18px 아이콘을 눌러야만
  볼 수 있게 숨겼다. 모바일에서는 탭이 필요하고 툴팁의 존재 자체를 알기 어렵다.
  aria-label 에는 들어가므로 스크린리더 사용자가 오히려 유리한 역전 상황이다.
- **영향**: 공시가격(예: 10억)을 과세표준 칸에 넣으면 판정이 통째로 뒤집힌다.
  잘못된 입력 → 잘못된 결론 → 사용자는 도구가 틀렸다고 판단한다.
- **개선 방향**: Field 에 상시 노출용 prop 을 추가하고, 최소한 "재산세 과세표준"과
  "금융소득 1,000만원 문턱" 두 개는 인풋 하단 상시 텍스트로 바꾼다.
  guidePropertyTaxBase 가이드로 가는 인라인 링크도 함께 둔다.
- **확신도**: High (렌더 경로 확인) / UX 영향 크기는 Medium
- **예상 공수**: S

---

### [Low-1] Pretendard 를 지정만 하고 로드하지 않는다

- **근거**: `src/app/globals.css:35-36` — font-family 첫 순위가 Pretendard, 이어서
  Noto Sans KR, Apple SD Gothic Neo, Inter, system-ui.
  `@font-face` 선언 없음(globals.css 전문 확인), next/font 미사용(참조 0건),
  `public/` 에 폰트 파일 없음.
- **문제**: Pretendard·Noto Sans KR·Inter 모두 웹폰트를 싣지 않으므로
  로컬에 설치된 사용자(개발자·디자이너)에게만 적용된다.
  일반 Windows 사용자는 system-ui(맑은 고딕/Segoe UI), Android는 Roboto/Noto,
  iOS/macOS만 Apple SD Gothic Neo로 떨어진다. **개발자 화면과 사용자 화면의 글꼴이 다르다.**
  ADR-002 기반 자간 조정(`page.tsx:114` 의 tracking 값 등)은 Pretendard 메트릭 전제이므로
  맑은 고딕에서는 의도와 다르게 보인다.
- **영향**: 웹폰트를 안 싣는 것 자체는 CWV에 유리하다(FOUT/CLS 없음). 문제는
  **의도한 디자인이 대다수 사용자에게 전달되지 않는다는 것을 아무도 모른다**는 점이다.
- **개선 방향**: 둘 중 하나를 **의식적으로** 고른다.
  (a) next/font/local 로 Pretendard 한글 subset 을 font-display swap 으로 로드.
  (b) Pretendard 를 지우고 system-ui 우선으로 재설계하고 그 결정을 ADR에 기록.
- **확신도**: High (파일로 확인) / 어느 쪽이 옳은지는 디자인 판단
- **예상 공수**: S

---

### [Low-2] CI가 프로젝트의 시간 의존성을 전혀 감시하지 않는다

- **근거**: `.github/workflows/ci.yml:3-7` — 트리거는 push / pull_request 뿐. schedule 없음.
  코드는 연도에 강하게 묶여 있다: `src/lib/constants/2026.ts`(파일명부터),
  `SITE.baseYear: 2026`, `SITE.lastVerified: 2026-08-03`, DISCLAIMER 의 "기준: 2026년".
  `2026.ts:4-7` 주석은 "새 연도가 시작되면 이 파일을 복사해 2027.ts를 만들고
  rules.ts 의 RULES_BY_YEAR 에 등록하세요"라고 하는데,
  **`rules.ts` 도 RULES_BY_YEAR 도 저장소에 존재하지 않는다** (grep 확인).
  주석이 존재하지 않는 구조를 지시하고 있다.
- **문제**: 커밋이 없으면 CI가 돌지 않으므로 2027-01-01에 사이트가 조용히 낡는다.
  화면 어디에도 "이 기준이 오래됐을 수 있다"는 동적 경고가 없다.
- **영향**: 연말 이후 잘못된 요율로 계산 결과를 계속 제공한다.
  이 도메인에서는 틀린 값보다 **틀린 줄 모르는 상태**가 더 위험하다.
- **개선 방향**:
  1. CI에 주간 schedule 트리거 추가 + `SITE.lastVerified` 가 180일 이상 지났으면 실패하는 단위 테스트 1개.
  2. `2026.ts:4-7` 주석에서 존재하지 않는 rules.ts / RULES_BY_YEAR 언급을 제거하거나
     실제로 그 구조를 만든다. 지금은 주석이 거짓말을 하고 있다.
- **확신도**: High
- **예상 공수**: S

---

### [Low-3] premium-handoff / structured-data 에 단위 테스트가 없다

- **근거**: `src/lib/premium-handoff.ts`(87줄), `src/lib/structured-data.ts`(69줄),
  `src/lib/routes.ts`(216줄), `src/lib/metadata.ts`(58줄) — 대응 `*.test.ts` 없음.
  테스트 파일은 judge / guidance / official-cases / format / regional / EvidenceChecklist 6개뿐이다.
- **문제**:
  - `premium-handoff.ts` 는 이 저장소에서 **유일하게 외부 저장소(sessionStorage)에서
    데이터를 파싱하는 지점**이다. 검증 로직은 잘 짜여 있으나 회귀 테스트가 없어
    Income 필드가 하나 늘면 조용히 통과하게 된다.
  - `structured-data.ts:46-48` 의 `<` 이스케이프는 **XSS 방어 지점**인데 테스트가 없다.
    현재 입력이 전부 저자 상수라 실위험은 낮지만, 주석(`structured-data.ts:41-45`)이
    "이후 사용자 입력이 섞여도 별도 조치가 필요 없다"고 선언한 이상 그 계약은 테스트로 잠가야 한다.
- **개선 방향**: ldJson 이 스크립트 종료 태그를 문자 그대로 남기지 않는지,
  consumePremiumHandoff 가 손상된 JSON·버전 불일치·음수·NaN 에서 null 을 돌려주고
  키를 지우는지 — 각 3~5줄짜리 테스트면 충분하다.
- **확신도**: High
- **예상 공수**: S

---

### [Low-4] 커밋된 .pyc 바이너리

- **근거**: `git ls-files` 결과에 `.claude/agents/__pycache__/contrast.cpython-312.pyc` 포함.
  `.gitignore:1-16` 에 `__pycache__` / `*.pyc` 항목 없음.
- **문제**: 컴파일 산출물이 버전 관리에 들어가 있다. 원본 `contrast.py` 는
  `.claude/agents/` 와 `docs/design-debate/tools/` 두 곳에 중복 존재한다.
- **개선 방향**: `.gitignore` 에 `__pycache__/`, `*.pyc` 추가 + `git rm --cached`.
  contrast.py 중복도 한쪽으로 정리.
- **확신도**: High
- **예상 공수**: S

---

### [Nit-1] MoneyInput 이 16자리 이상 입력을 아무 피드백 없이 삼킨다
`src/components/ui.tsx:189` — 15자리 초과 시 값도 안 바뀌고 안내도 없어
입력란이 고장난 것처럼 보인다. maxLength 로 막거나 짧은 안내를 띄우는 편이 낫다.

### [Nit-2] 404.html 에 robots 메타가 2개
`out/404.html` 에 noindex 메타가 두 번 들어간다. Next 기본값과 `not-found.tsx:7` 선언이
겹친 것으로, 동작상 무해하지만 지저분하다.

### [Nit-3] 남은 lint warning 3건
`e2e/links.spec.ts:105` 미사용 baseURL, `postcss.config.mjs:1` anonymous default export,
`src/app/layout.tsx:100` img 사용. 세 번째는 정적 export 라 의도된 것이니
eslint-disable 주석 + 사유로 정리하면 warning 0을 유지할 수 있다.

---

## 4. SEO / AEO / GEO 진단

**공개 노출 프로젝트다** — gijuncheck.kr 도메인, sitemap/robots/OG/JSON-LD가 모두 구현되어 있고
검색 유입이 사업 모델(애드센스)의 전제다. 따라서 전 항목 검토 대상.

### 렌더링 — 전제 확인 (가장 먼저 봤다)

빌드 산출물 `out/` 을 직접 열어 확인했다.

| 확인 | 결과 |
|---|---|
| `next.config.mjs:19` | output: export — **전 페이지 SSG**, 서버 런타임 없음 |
| `out/index.html` | 94,531 B, JS 실행 없이 본문·h1·FAQ 텍스트 모두 포함 |
| `out/health-insurance/guides/*/index.html` | 67~76 KB, 가이드 본문 전문 포함 |
| h1 개수 | **16개 HTML 전부 정확히 1개** |
| CSR-only 라우트 | 없음 |

**결론: AEO/GEO의 가장 흔한 Blocker(CSR로 본문이 안 보임)는 이 프로젝트에 없다.**
GPTBot·ClaudeBot·PerplexityBot 등 JS를 실행하지 않는 크롤러도 본문 전체를 읽는다.
단, **판정·계산 결과 화면은 클라이언트 상호작용 후에만 생성**되므로 크롤러가 볼 수 없다 —
도구 사이트의 본질적 한계이고, FAQ·가이드가 그 공백을 메우는 설계로 이미 대응돼 있다.

### 진단 표

| 항목 | 상태 | 근거 | 심각도 |
|---|---|---|---|
| 크롤러가 JS 없이 본문 접근 | 정상 | `next.config.mjs:19`, `out/*.html` 직접 확인 (본문·h1 전부 포함) | — |
| 페이지별 고유 title/description | 정상 | `src/lib/metadata.ts:19-58`, 산출물 16개 전부 상이 | — |
| canonical | 정상 | `metadata.ts:33`, `layout.tsx:20-22`. 전 페이지 1개, 절대 URL, trailingSlash 일치. `e2e/og-meta.spec.ts:77-84` 가 잠금 | — |
| sitemap / robots | 정상 | `sitemap.ts` 가 `indexableRoutes()` 로 자동 생성 → 페이지 추가 시 누락 불가. `e2e/og-meta.spec.ts:150-178` 이 일치성+lastmod 검증 | — |
| noindex 프로덕션 유출 | 정상 | `site.ts:50` indexable 분기. 산출물 확인: 도구·가이드 index/follow, 정책 3종 noindex/follow — 의도대로 | — |
| 시맨틱 헤딩 구조 | 정상 | h1 = 페이지당 1개(16/16). main(`layout.tsx:130`), article, nav aria-label 2종 사용 | — |
| 이미지 alt / CLS | 주의 | 로고 `alt=""` + aria-hidden(`layout.tsx:100`) — 장식용이므로 올바름. 단 width/height 속성 없이 클래스로만 크기 지정 → CSS 로드 전 CLS 여지. img 1개뿐이라 영향은 작다 | Low |
| Open Graph / Twitter Card | 주의 | 태그 완비(`metadata.ts:34-55`), 페이지별 전용 이미지 14장. **그러나 장당 620~770KB** → [High-4] | High |
| 구조화 데이터 — 가이드 | 정상 | `guide.tsx:40-88` Article + BreadcrumbList + FAQPage. author/publisher id 연결, 날짜 ISO 8601 | — |
| 구조화 데이터 — 도구 3종 | 주의 | WebApplication + Breadcrumb + FAQPage 있음(`dependent/page.tsx:49-72`). 단 WebApplication 에 @id·url·isPartOf 가 없어 페이지와 미연결. 날짜 신호 0 | Medium |
| 구조화 데이터 — 홈 | 결함 | `out/index.html` 의 JSON-LD 는 layout 의 Organization/WebSite 뿐. priority 1.0 URL 에 페이지 레벨 스키마 0 → [Medium-1] | Medium |
| 인용 가능한 콘텐츠 청킹 | 혼재 | 가이드는 우수: GuideHeader 의 "한 줄 답변"(`guide.tsx:116-119`)이 자립 직답, FAQ 답변이 문맥 없이도 완결(`pension-impact/page.tsx:54-80`). **홈만 질문 6개에 답 0개**(`page.tsx:71-98`) | Medium |
| 정의 문장 | 정상 | `site.ts:52` "기준체크는 … 민간 정보 서비스입니다", 가이드 ANSWER 상수가 전부 단정문 | — |
| 근거·출처 | 정상 | SourceList(`guide.tsx:290-310`) + DEPENDENT_SOURCES(law.go.kr·nhis.or.kr 직링크). `e2e/guide-quality.spec.ts:26-35` 가 공식 출처 링크 존재를 강제 | — |
| 최신성 신호 | 주의 | 가이드는 화면 time 태그 2개 + JSON-LD 양쪽 모두 있음(`guide.tsx:341-349`). **도구 3종·홈에는 날짜 신호 전무.** sitemap lastmod 와 JSON-LD dateModified 가 다른 소스 → [Medium-7] | Medium |
| 엔티티 명확성 (E-E-A-T) | 주의 | Organization + Person(`verification-policy/page.tsx:32-39`) + worksFor 연결까지 구현. **sameAs 0개, address 없음, 저자 자격·경력 정보 없음.** YMYL 주제에서 가장 약한 고리 | Medium |
| AI 크롤러 접근 정책 | 정상 | `out/robots.txt` 는 전체 Allow. GPTBot·ClaudeBot·PerplexityBot·CCBot·Google-Extended **전부 허용**. 노출 의도와 모순 없음 | — |
| llms.txt | 주의 | `out/` 루트에 없음. 아직 표준이 아니고 채택률도 제한적이므로 Low 이하 | Low |
| 페이지네이션/무한스크롤 은폐 | 정상 | 해당 없음. 전 콘텐츠가 단일 HTML에 있다 | — |
| 내부 링크 구조 | 주의 | 도구↔가이드 양방향 링크 충실. 단 홈/전용 판정기 중복으로 앵커와 실경로가 뒤섞임 → [Medium-2] | Medium |

### 가장 큰 병목 한 가지

**홈페이지가 인용 자산이 0인 상태로 사이트 최상위 링크 신호를 독점하고 있다.**
홈은 priority 1.0에 내부 링크가 가장 많이 모이는 URL인데, 페이지 레벨 JSON-LD가 없고,
"자주 찾는 질문" 6개를 **답 없이 링크로만** 제시하며(`src/app/page.tsx:71-98`), 날짜 신호도 없다.
답변엔진은 질문 텍스트만 있고 답이 없는 블록을 인용하지 않는다.

각 질문 아래 2~3문장 직답을 넣고 그대로 FAQPage JSON-LD로 마크업하면(공수 반나절),
이미 잘 만들어진 가이드 6편의 신호가 홈을 경유해 연결되고, 홈 자체가
"피부양자 소득 기준", "재산세 과세표준 확인법" 같은 고빈도 질의에서 직접 인용 후보가 된다.
렌더링·canonical·sitemap 같은 어려운 전제가 이미 다 갖춰져 있어 투자 대비 효과가 현재 가장 크다.

---

## 5. 가설 — 근거 부족, 추가 확인 필요

| # | 가설 | 무엇을 보면 판정되는가 |
|---|---|---|
| G-1 | 손자녀·외손자녀에 부모 부양능력 요건이 별도로 존재하고 현 모델이 이를 누락한다 ([High-3]-1) | 시행규칙 **별표1 원문 텍스트**. law.go.kr PDF 파싱에 실패했으므로 텍스트본 확보 필요 |
| G-2 | 이혼·사별이 미혼으로 간주되는 정확한 요건(관계별·생계곤란 조건) | 별표1 원문 + 공단 업무처리기준. 언론 보도(2017, 형제자매 한정)만으로는 직계비속까지 일반화 불가 |
| G-3 | 임의계속 보수 외 소득의 반영률 적용 순서 ([Medium-4]) | 시행령 제41조 원문 + 공단 소득월액보험료 산정 예시 1건. 혼합 소득 예시가 있으면 즉시 확정 |
| G-4 | "공단 모의계산 13건 대조 완료" 주장(`property-score-table.ts:25`, `routes.ts:57`)의 실재성 | `docs/03-검증기록.md` 의 P2-1 기록. 이번에 읽지 않았다. 입력값·공단 출력 캡처가 있으면 확정 |
| G-5 | 지역가입자 하한(20,160원)을 임의계속 보험료에도 적용하는 것이 맞는가 (`regional.ts:233`) | 2026 고시의 직장가입자 보수월액보험료 **하한** 값. 지역과 같으면 무해, 다르면 버그 |
| G-6 | 홈 vs 전용 판정기 페이지 중 어느 쪽이 랭킹 타깃이어야 하는가 ([Medium-2]) | Search Console 의 두 URL별 노출·클릭·평균순위. 코드로는 판정 불가 |
| G-7 | LCP/INP/CLS 실측값 | Vercel Speed Insights 대시보드 또는 CrUX. 청크 926KB·본문 이미지 미사용이라 양호할 것으로 **추정**하나 확인 전이다 |
| G-8 | E2E 5개 프로젝트가 실제로 초록인지 | `npm run test:e2e` 실행. 이번 세션에서 돌리지 않았다. `test-results/` 존재로 보아 최근 실행 흔적은 있음 |
| G-9 | Vercel Speed Insights 가 Vercel 외 호스팅에서도 동작하는지 | 배포 대상 확인. `vercel.json` 이 있으므로 Vercel 전제로 보이나, 아니라면 매 페이지 404 요청이 발생한다 |

---

## 6. 유지할 것

- 2026년 요율 상수 5종(7.19% / 0.9448% / 211.5원 / 상한 4,591,740 / 하한 20,160)이 외부 1차 고시와 전부 일치한다 — `src/lib/constants/2026.ts`.
- `applyLimit`(`regional.ts:123-143`)이 "소득 하한 먼저, 재산은 그 위에 가산"이라는 공단 부과 구조를 정확히 구현했다. 총액에 하한을 덮어쓰는 흔한 오구현을 피했다.
- 근로·연금 50% 반영률 회귀 테스트(`regional.test.ts:104-112`)가 "연금 수령자 보험료 2배" 사고를 정면으로 막는다.
- `routes.ts` 단일 레지스트리 → sitemap 자동 생성. "페이지 추가하고 sitemap 잊기"라는 최빈 실수를 구조적으로 제거했다.
- `e2e/og-meta.spec.ts` 가 canonical·og:url·robots·sitemap 일치를 코드로 잠갔다. 이 수준의 SEO 회귀 방어는 드물다.
- `analytics.ts` 의 EventMap 타입이 숫자 파라미터 전송을 **타입 레벨에서** 차단한다 — 개인정보처리방침의 약속을 문서가 아니라 컴파일러가 지킨다.
- `premium-handoff.ts` 가 sessionStorage 값을 버전·형태·부호까지 검증하고 읽는 즉시 삭제한다.
- 개인정보처리방침이 GA4 미설정 상태까지 분기해 정확히 기술한다(`privacy/page.tsx:69-95`) — 빌드 시점 환경변수에 따라 문구가 자동으로 맞춰진다.
- 주석이 "무엇"이 아니라 **"왜"와 "이걸 어기면 무슨 사고가 나는지"**를 적는다(`2026.ts:42-59`, `ui.tsx:145-157`, `next.config.mjs:7-17`). 6개월 뒤 유지보수자에게 실제로 도움이 되는 드문 종류의 주석이다.
- 판정 결과에서 색(emerald/rose)을 배제하고 기호+텍스트로만 결론을 전달한 결정(`DependentJudge.tsx:313-319`) — 법적 리스크와 접근성을 동시에 잡았다.
