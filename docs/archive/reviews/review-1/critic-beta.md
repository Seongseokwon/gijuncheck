# 비평 리포트 — beta

독립 감사. 다른 비평가의 산출물은 참조하지 않았다.

## 검토 범위

**읽은 파일 (전문)**
`next.config.mjs`, `playwright.config.ts`, `vitest.config.ts`, `tsconfig.json`, `.gitignore`, `.env.example`, `package.json`,
`src/lib/site.ts`, `src/lib/routes.ts`, `src/lib/metadata.ts`, `src/lib/structured-data.ts`, `src/lib/format.ts`, `src/lib/analytics.ts`,
`src/lib/constants/2026.ts`, `src/lib/constants/property-score-table.ts`,
`src/lib/dependent/{judge,guidance,sources,application}.ts`, `src/lib/premium/regional.ts`,
`src/app/{layout,page,robots,sitemap,not-found}`, `src/app/{privacy,contact,verification-policy}/page.tsx`,
`src/app/health-insurance/{dependent,regional-premium}/page.tsx`, `src/app/health-insurance/guides/pension-impact/page.tsx`,
`src/components/{ui,guide,DependentJudge,RegionalPremiumCalc,VoluntaryComparison,Analytics,TrustSignal}.tsx`,
단위 테스트 6종 + e2e 9종 전문, `docs/03-검증기록.md`, `README.md`.

**실행한 명령**
- `npx vitest run` → 6 files / **136 passed**
- `npx tsc --noEmit` → **exit 0**
- `npx next lint` → **대화형 프롬프트에서 정지** (High-4)
- `npx playwright test --project=desktop-1440 e2e/og-meta.spec.ts e2e/analytics.spec.ts` → **11 passed**
- 빌드 산출물 `out/` 15개 HTML 파싱 → title/description/canonical/robots/heading/JSON-LD 전수 추출
- 재현 스크립트 2건 작성·실행 (판정→보험료 퍼널 URL, 모바일 툴팁 탭 동작) — 결과는 각 항목에 인용

**검토하지 못한 영역 (명시)**
- 실제 프로덕션 도메인(`gijuncheck.kr`)의 응답·색인 상태·Core Web Vitals 실측
- GA4 데이터 스트림 콘솔 설정 (쿼리 파라미터 제외 여부 등)
- 법령 원문 대조. 코드 주석과 `docs/03-검증기록.md`의 자기 기술을 사실로 가정하지 않았고, 검증 **구조**만 평가했다
- 가이드 6편 중 5편의 본문 (1편 정독, 나머지는 빌드 HTML의 구조 지표로만 확인)
- 실제 스크린리더(NVDA/VoiceOver) 동작

## 요약 판단

기술적 완성도는 개인 프로젝트 평균을 크게 웃돈다. 정적 export + 순수 함수 판정, 136개 단위 테스트, 5개 브라우저 프로젝트 e2e, 상수 단일 출처화, 검증 기록 문서화까지 갖췄고 타입체크·테스트·e2e가 실제로 통과한다. 콘텐츠 품질도 AEO 관점에서 상위권이다 — 가이드마다 "한 줄 답변"을 상단에 배치하고 Article+FAQPage+BreadcrumbList JSON-LD와 공식 출처 링크를 붙였다.

**그럼에도 현 상태로 출시하면 안 된다.** 판정기에서 보험료 계산기로 넘어가는 링크가 사용자의 합산소득과 재산세 과세표준을 **URL 쿼리스트링에 그대로 실어 보낸다.** 개인정보처리방침이 "금액은 어떤 형태로도 서버나 분석 도구로 전달되지 않습니다"라고 단정한 바로 그 데이터다. 실측으로 확인했다.

두 번째로, 같은 퍼널이 사용자의 연금소득을 사업소득(반영률 100%)으로 재분류해 **은퇴자에게 최대 2배의 보험료를 경고 없이 확정 표시한다.** 코드베이스가 다섯 군데에서 "이걸 놓치면 연금 수령자 보험료가 2배가 된다"고 경고해 놓고 정작 퍼널이 그 실수를 저지른다.

세 번째로, ESLint가 **설치조차 되어 있지 않다.** `npm run lint`는 비대화형 환경에서 무한 대기한다. `jsx-a11y`·`react-hooks` 규칙 부재와, 아래에서 발견한 접근성 결함 3건이 무관하지 않다.

SEO/AEO는 하위 페이지가 잘 되어 있는 반면 **홈에 JSON-LD가 한 줄도 없고 사이트 전체에 Organization 엔티티 앵커가 없다.** 가장 강한 페이지가 답변엔진에게 익명이다.

---

## 발견 항목

### [Critical-1] 판정→보험료 퍼널이 사용자의 소득·재산 금액을 URL 쿼리스트링으로 전송한다 — 개인정보처리방침 위반

- **근거**
  - `src/components/DependentJudge.tsx:433` — ``href={`${ROUTES.regionalPremium.path}?income=${result.totalIncome}&property=${input.propertyTaxBase}`}``
  - `src/components/RegionalPremiumCalc.tsx:261` — ``href={`${ROUTES.voluntaryContinuation.path}?property=${propertyAmount}`}``
  - 위반 대상 문구: `src/app/privacy/page.tsx:36-40` ("소득, 재산, 나이, 가족관계 등의 값은 이용자의 브라우저 안에서만 처리되며 **서버로 전송되거나 저장되지 않습니다**"), `src/app/privacy/page.tsx:87-89` ("금액은 **어떤 형태로도** 서버나 분석 도구로 전달되지 않습니다"), `src/lib/analytics.ts:5-11`, `src/app/page.tsx:356`, `src/components/DependentJudge.tsx:296`, `src/components/RegionalPremiumCalc.tsx:203`
  - 전송 경로: `src/components/Analytics.tsx:20-35` (GA4 `gtag('config', ...)` — `page_location` 제외 설정 없음), `src/app/layout.tsx:65` (`<SpeedInsights />`)
- **재현 (실측)** — Playwright로 근로소득 99,999,999원 / 과세표준 777,777,777원 입력 후 판정 → CTA 클릭

```
HREF        = /health-insurance/regional-premium/?income=99999999&property=777777777
LANDED URL  = http://127.0.0.1:4173/health-insurance/regional-premium/?income=99999999&property=777777777
```

- **문제**
  1. 쿼리스트링은 HTTP 요청 라인에 포함되어 **호스팅(Vercel) 액세스 로그에 그대로 기록된다.** "정적 사이트라 입력값을 받는 서버가 존재하지 않는다"(`privacy/page.tsx:37-40`)는 서술은 요청 URL에는 적용되지 않는다.
  2. GA4의 자동 `page_view`는 **쿼리스트링을 포함한 전체 URL을 `page_location`으로 전송한다.** 기본 동작이며, 제외하려면 데이터 스트림에서 별도 설정해야 하는데 저장소에 그 흔적이 없다.
  3. 브라우저 히스토리·북마크·URL 공유로 잔존·확산된다.
- **테스트가 못 잡는 이유** — `e2e/analytics.spec.ts:33-40`의 `events()`는 `gtag('event', ...)` 호출의 **명시적 파라미터만** 수집한다. `page_location`·`page_view`·요청 URL은 검사 범위 밖이다. `e2e/analytics.spec.ts:73,90,101`의 `not.toContain('1234567')` 단언은 안전한 경로만 지키고 실제 유출 경로는 무방비로 둔 채 **거짓 안심을 준다.**
- **영향** — 개인정보처리방침의 명시적 단정과 실제 데이터 흐름이 불일치한다. 이 사이트의 유일한 차별화 자산이 "근거와 한계를 숨기지 않는 신뢰"인데, 그 신뢰가 걸린 지점에서 정책을 어긴다.
- **개선 방향** — 금액을 URL에 싣지 않는다. `sessionStorage` 인계로 바꾼다.

```tsx
// DependentJudge.tsx — 링크 클릭 시
onClick={() => sessionStorage.setItem(
  'gijuncheck:handoff',
  JSON.stringify({ income: input.income, property: input.propertyTaxBase }),
)}
href={ROUTES.regionalPremium.path}   // 쿼리 없음

// RegionalPremiumCalc.tsx — useEffect 안
const raw = sessionStorage.getItem('gijuncheck:handoff');
sessionStorage.removeItem('gijuncheck:handoff');
```

  회귀 방지 단언을 `e2e/analytics.spec.ts`에 추가한다: `expect(page.url()).not.toMatch(/[?&](income|property)=/)`
- **확신도**: **High** (실측 재현 완료)
- **예상 공수**: **S** (<0.5d)

**자기 반박** — "정적 호스팅이라 로그가 없을 수 있다"? Vercel은 액세스 로그를 남기고, `README.md`가 GA4 이벤트 실시간 수신 확인을 적고 있어 프로덕션에 GA_ID가 설정되어 있다. 또한 정책 문구가 "어떤 형태로도"라는 절대 표현이라 GA4 설정 여부와 무관하게 CDN 전송만으로 이미 어긋난다. **지적 유지.**

---

### [High-1] 판정→보험료 프리필이 연금소득을 사업소득으로 재분류해 최대 2배 금액을 경고 없이 확정 표시한다

- **근거**
  - `src/components/RegionalPremiumCalc.tsx:72-79`

```ts
// 판정기는 합산소득만 넘긴다. 종류를 알 수 없으므로 반영률이 높은 쪽에
// 넣어 과소 계산을 피한다. 사용자가 직접 항목을 옮길 수 있다.
const inc = Number(q.get('income'));
if (Number.isFinite(inc) && inc > 0) {
  setIncome({ ...emptyIncome, business: inc });
  setSubmitted(true);          // ← 결과를 즉시 확정 표시
  setFromJudge(true);
}
```

  - 반영률 차이: `src/lib/constants/2026.ts:121-126` (`FULL: 1.0` vs `HALF: 0.5`)
  - `src/components/RegionalPremiumCalc.tsx:207-278` — 결과 블록 어디에도 `fromJudge` 분기 안내가 없다
- **문제** — 판정기의 `result.totalIncome`은 사업·근로·연금·금융·기타의 합이다(`judge.ts:47-55`). 이를 전액 `business`에 넣으면 근로·연금분이 50%→100%로 튀어 소득보험료가 **정확히 2배**가 된다. `setSubmitted(true)`로 결과 섹션이 즉시 렌더되므로, 사용자는 "재분류가 필요한 추정치"가 아니라 **계산이 끝난 금액**으로 읽는다.
- **정합성 문제가 더 아프다** — 이 코드베이스는 같은 실수를 다섯 곳에서 경고한다: `2026.ts:111` ("이걸 100%로 잘못 계산하면 연금 수령자의 보험료가 2배로 나온다"), `regional.ts:9`, `regional.test.ts:104-112` (회귀 방지 테스트), `regional-premium/page.tsx:23-27` (FAQ), `guides/pension-impact/page.tsx:140-153`. 퍼널이 정확히 그 실수를 저지른다. 주 타깃이 은퇴자이므로 **가장 흔한 경로가 가장 크게 틀린다.**
- **영향** — 은퇴자가 실제보다 2배 비싼 보험료를 보고 잘못된 의사결정(임의계속가입 선택, 사업자등록 포기 등)을 한다. 이후 실제 고지액과 다르면 사이트 신뢰가 통째로 무너진다.
- **개선 방향** — 셋 중 하나.
  1. (권장) 종류별 금액을 인계한다. Critical-1의 `sessionStorage` 수정에서 `Income` 객체 전체를 넘기면 재분류 자체가 사라진다.
  2. `setSubmitted(true)`를 제거해 사용자가 항목을 확인한 뒤 직접 계산하게 한다.
  3. 최소한 `fromJudge === true`일 때 결과 상단에 배너 — "판정기에서 넘어온 합산소득을 사업소득(100% 반영)으로 가정했습니다. 근로·연금소득이 포함되어 있다면 해당 칸으로 옮겨 다시 계산하세요. 실제 금액은 최대 절반까지 낮아질 수 있습니다."
- **확신도**: **High** (코드 경로가 분기 없이 단선이고, 반영률 상수 차이가 명시적)
- **예상 공수**: **S** (1번을 Critical-1과 함께 처리하면 합쳐서 0.5d)

**자기 반박** — "주석대로 과소 계산보다 과대 계산이 안전하다"? 방향은 일리 있으나 (a) 화면에 그 가정이 전혀 표시되지 않고, (b) `setSubmitted(true)`로 확정 결과처럼 보이며, (c) 애초에 종류별 금액을 넘기면 가정 자체가 불필요하다. **지적 유지.**

---

### [High-2] 도움말 툴팁이 `<label>` 안에 있어 터치 기기에서 절대 열리지 않는다

- **근거**
  - `src/components/ui.tsx:40-62` — `Field`가 `<label class="block">`으로 라벨과 입력을 통째로 감싸고, `hint`는 그 안의 `<span>`에 들어간다
  - `src/components/ui.tsx:72-101` — `InfoTooltip`은 `<span tabIndex={0} role="img">`이고 툴팁 본문은 `group-hover:opacity-100 group-focus:opacity-100`으로만 노출된다
  - 빌드 산출물 `out/health-insurance/dependent/index.html` — `<label class="block">…<span tabindex="0" role="img" aria-label="도움말: 이자 + 배당 · 1,000만원 이하면 합산 제외" …><span role="tooltip" …>` 중첩 확인
- **재현 (실측, `mobile-375` 프로젝트)** — 도움말 아이콘 탭 시

```
ACTIVE AFTER CLICK = {"tag":"INPUT","role":null,...}
TOOLTIP OPACITY    = 0.0326905
```

  라벨의 기본 동작이 포커스를 `<input>`으로 옮겨 버려 `group-focus`가 성립하지 않고 툴팁이 열리지 않는다.
- **문제** — 터치 기기에는 hover가 없으므로 툴팁의 유일한 노출 경로가 focus인데, 그 focus를 라벨이 탈취한다. `aria-label`이 있어 스크린리더 사용자는 내용을 듣지만 **눈으로 보는 모바일 사용자는 내용에 도달할 방법이 없다.**
- **무엇을 잃는가** — hint가 부가 설명이 아니라 판정을 좌우하는 규칙이다.
  - `DependentJudge.tsx:61` — "이자 + 배당 · 1,000만원 이하면 합산 제외" (금융소득 문턱, 이 도구의 대표 함정)
  - `DependentJudge.tsx:280` — "실거래가·공시가격 아님" (가이드 한 편이 통째로 이 주제)
  - `DependentJudge.tsx:57` — "개인연금은 제외"
  - `RegionalPremiumCalc.tsx:146` — "주택·건물·토지·선박·항공기 과세표준 합계"

  한국 트래픽 대다수가 모바일이므로 **다수 사용자에게 핵심 규칙이 전달되지 않는다.**
- **부수 결함** (같은 컴포넌트)
  - `ui.tsx:79` — `typeof children === 'string' ? children : '입력 도움말'`. `hint` 타입이 `ReactNode`(`ui.tsx:44`)이므로 JSX를 넘기면 접근성 이름이 "도움말: 입력 도움말"로 붕괴한다
  - `ui.tsx:84` — 이미지가 아닌 대화형 요소에 `role="img"`. `tabIndex=0`과 결합해 역할과 동작이 어긋난다
  - WCAG 2.1 SC 1.4.13 — hover/focus로 뜨는 콘텐츠는 dismissible해야 하는데 Esc 처리가 없다
- **개선 방향** — hint를 `<label>` 밖으로 뺀다. `Field`를 `htmlFor`/`id` 명시 방식으로 바꾸고, 트리거를 `<button type="button" aria-describedby={tipId}>`로 교체해 클릭 토글 + Esc 닫기를 붙인다.

```tsx
export function Field({ label, hint, children }) {
  const id = useId();
  return (
    <div className="block">
      <span className="flex …">
        <label htmlFor={id}>{label}</label>
        {hint && <InfoTooltip>{hint}</InfoTooltip>}   {/* label 바깥 */}
      </span>
      <div className="mt-1">{cloneElement(children, { id })}</div>
    </div>
  );
}
```

- **확신도**: **High** (실측 재현 완료)
- **예상 공수**: **M** (1-3d — `Field` 시그니처 변경으로 3개 도구 전부 회귀 확인 필요)

**자기 반박** — "`aria-label`이 있으니 접근성은 충족된다"? 스크린리더는 충족하지만 **시각 사용자의 터치 경로**가 완전히 막혀 있다. e2e 5개 프로젝트(모바일 2개 포함) 어디에도 툴팁 노출 검증이 없어 아무도 눈치채지 못했다. **지적 유지.**

---

### [High-3] 홈에 구조화 데이터가 한 줄도 없고, 사이트 어디에도 Organization 엔티티 앵커가 없다

- **근거**
  - `src/app/page.tsx:74-395` — 395줄 전체에 `ld+json` 없음. 빌드 산출물 `out/index.html` 파싱 결과 `jsonld: []`
  - 같은 상태인 색인 대상 페이지: `out/verification-policy/index.html` → `jsonld: []` (sitemap 등재, priority 0.5, `author.url`의 목적지)
  - `src/lib/structured-data.ts:12-22` — 공용 헬퍼는 `breadcrumbJsonLd` **하나뿐**
  - `src/components/guide.tsx:59-63` — `publisher`가 Article 안에 인라인으로만 존재하고 `logo`·`sameAs`·`@id`가 없다
  - `src/app/health-insurance/dependent/page.tsx:52-57` — `WebApplication`에 `url`·`description`·`provider` 없음
- **문제**
  1. 홈은 sitemap priority 1.0(`routes.ts:33`)이자 모든 BreadcrumbList의 1번 항목인데, 답변엔진에게 기계 판독 가능한 정체성을 전혀 제공하지 않는다.
  2. 사이트 전역 `Organization`/`WebSite` 노드가 없다. 각 Article의 인라인 `publisher`는 `@id`가 없어 **서로 같은 주체로 결합되지 않는다.**
  3. Google Article 권장 속성인 `publisher.logo`가 빠져 있다. `public/logo.svg`는 존재하는데 스키마에 연결되지 않았다.
  4. `author`는 `{'@type':'Person', url:'/verification-policy/'}`(`guide.tsx:54-58`)인데 **그 URL이 가리키는 페이지에 저자 마크업이 없다.** E-E-A-T 체인이 끊긴 링크로 끝난다.
- **영향** — GEO에서 인용은 "이 주장을 누가 했는가"를 기계가 확정할 수 있을 때 유리하다. 콘텐츠는 이미 인용 가능한 수준(정의문·수치·출처 링크)인데 엔티티가 익명이라 그 품질이 귀속되지 않는다.
- **개선 방향** — `structured-data.ts`에 전역 노드를 추가하고 홈·검증원칙에 삽입한다.

```ts
export const ORG_ID = `${SITE.url}/#organization`;

export function organizationJsonLd() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    url: SITE.url,
    logo: { '@type': 'ImageObject', url: new URL('/logo.svg', SITE.url).toString() },
    description: SITE.description,
    email: SITE.contactEmail,
    contactPoint: { '@type': 'ContactPoint', email: SITE.contactEmail, contactType: 'customer support' },
  };
}
```

  기존 `guide.tsx:59-63`의 인라인 publisher는 `{ '@id': ORG_ID }` 참조로 바꾼다. 홈에는 `WebSite` + `Organization` + 대표 `FAQPage`를 넣는다 — `page.tsx:40-70`의 `POPULAR_QUESTIONS`가 이미 질문 6개를 갖고 있다.
- **확신도**: **High** (빌드 산출물 전수 확인)
- **예상 공수**: **S** (<0.5d)

**자기 반박** — "publisher가 각 Article에 이미 있으니 충분하다"? `@id` 없는 인라인 Organization은 페이지마다 별개 엔티티로 파싱될 수 있고, `logo`가 없어 Google Article 권장 요건도 미충족이다. 무엇보다 홈과 검증원칙에는 그마저도 없다. **지적 유지 (High).**

---

### [High-4] ESLint가 설치조차 되어 있지 않고 `npm run lint`는 비대화형 환경에서 무한 대기한다

- **근거**
  - `package.json:12` — `"lint": "next lint"`
  - 실행 결과:

```
`next lint` is deprecated and will be removed in Next.js 16.
? How would you like to configure ESLint?
❯  Strict (recommended)
```

  → 대화형 프롬프트에서 정지. **비대화형 환경에서는 영원히 멈춘다.**
  - 저장소에 `.eslintrc*` / `eslint.config.*` 없음, `node_modules`에 eslint 패키지 0개
  - `package.json:18` — `"verify": "typecheck && test && build && test:e2e"` — **lint가 빠져 있어 이 결함이 드러난 적이 없다**
  - `.github/` 없음 — CI 자체가 없다
- **문제**
  1. 존재하지 않는 검사를 존재하는 것처럼 광고한다. 향후 CI를 붙이면 이 단계에서 파이프라인이 타임아웃까지 매달린다.
  2. `eslint-plugin-jsx-a11y` 부재로 High-2(라벨 안 대화형 요소), Medium-1(포커스 트랩 없는 모달), `role="img"` 오용이 자동 검출되지 않았다.
  3. `eslint-plugin-react-hooks` 부재로 `exhaustive-deps` 경고가 없다. `RegionalPremiumCalc.tsx:67-80`, `VoluntaryComparison.tsx:51-55`의 `useEffect(…, [])`, `ui.tsx:338-351`의 `[onCancel]`은 현재 우연히 맞지만 회귀를 잡아줄 장치가 없다.
- **개선 방향**

```bash
npm i -D eslint @eslint/js typescript-eslint eslint-config-next eslint-plugin-jsx-a11y
```

  `eslint.config.mjs`(flat config)에 `next/core-web-vitals` + `jsx-a11y/recommended`를 켜고, 스크립트를 `"lint": "eslint ."`로 바꾼 뒤 `verify` 체인 맨 앞에 넣는다. 이어서 `.github/workflows/ci.yml`로 `npm run verify`를 자동화한다.
- **확신도**: **High** (직접 실행으로 확인)
- **예상 공수**: **S** (<0.5d, 초기 위반 수정 포함 시 M)

**자기 반박** — "타입체크 + 136개 단위 테스트 + 5프로젝트 e2e면 린트는 사치"? 커버리지 논거는 일리 있으나 (a) 없는 스크립트를 있다고 선언한 것 자체가 결함이고, (b) 이번 감사에서 나온 접근성 결함 3건이 전부 `jsx-a11y` 기본 규칙 범위다. **지적 유지.**

---

### [Medium-1] 확인 모달에 포커스 트랩·포커스 복원·배경 비활성화가 없다

- **근거** — `src/components/ui.tsx:321-405`
  - `338-351` — Esc 처리와 `body.overflow` 잠금만 있다
  - `355-404` — `createPortal(…, document.body)`로 `<body>` 끝에 붙는데 **배경 콘텐츠에 `inert`/`aria-hidden`을 걸지 않는다**
  - `388` — `autoFocus`로 진입 포커스는 주지만 **닫힐 때 트리거 버튼(`SubmitButton`)으로 되돌리지 않는다**
  - Tab 순환을 가두는 코드 없음, 배경(`356-359`) 클릭 닫기 없음
- **문제** — Tab을 누르면 포커스가 모달 밖 헤더 네비게이션·폼 필드로 빠져나간다. 사용자는 보이지 않는(스크롤 잠긴) 요소를 조작하게 된다. 닫은 뒤 포커스가 `<body>`에 남아 키보드 사용자는 처음부터 다시 Tab 해야 한다. WCAG 2.4.3 위반.
- **테스트 공백** — `e2e/keyboard-a11y.spec.ts`(77줄)가 있으나 모달 포커스 순환을 검증하지 않는다. `e2e/analytics.spec.ts:58-60`은 모달을 열고 버튼을 누르기만 한다.
- **개선 방향** — 트리거 ref 저장 후 언마운트 시 `.focus()` 복원, `keydown`에서 Tab/Shift+Tab을 첫·마지막 포커서블 사이로 순환, 배경 래퍼에 `inert` 부여. 또는 네이티브 `<dialog showModal()>`로 교체하면 트랩·Esc·배경 비활성화가 브라우저 기본 동작으로 해결된다.
- **확신도**: **High** (해당 로직 부재가 명확)
- **예상 공수**: **S**

### [Medium-2] `crossChecked: true` 하드코딩 + 잘못된 필드 참조로, 공단 대조를 안 한 계산에 면책 배너가 뜨지 않는다

- **근거**
  - `src/lib/premium/regional.ts:256-257` — `calculateVoluntaryPremium`이 `verified: true, crossChecked: true`를 **무조건** 반환
  - `src/lib/premium/regional.ts:100-104` — `crossChecked`의 정의: "**공단 모의계산과 대조 검증까지** 완료되었는지. false 인 동안은 UI에 참고용 표시를 함께 노출할 것"
  - `src/components/ui.tsx:411-420` — `ReferenceOnlyNotice` 문구: "국민건강보험공단 모의계산과의 대조 검증이 아직 완료되지 않았습니다"
  - `src/components/VoluntaryComparison.tsx:199` — `<ReferenceOnlyNotice crossChecked={regional.crossChecked} />` — **임의계속가입 결과인데 지역가입자 쪽 플래그를 본다**
  - 반대 사실: `docs/03-검증기록.md` — "임의계속가입은 공단 로그인 모의계산의 결과를 직접 복제한 것이 **아니라** 참고 비교다". 대조 표 V01~V07의 열 이름이 "**기준체크** 건강보험료"이고 공단 결과 열이 없다
  - `src/lib/premium/regional.test.ts:359-363` — 이 하드코딩을 그대로 단언해 잘못된 상태를 회귀 테스트로 고정한다
- **문제** — 두 겹의 결함이다. (a) `crossChecked`를 `verified`(등급표 검증)와 혼동한 주석(`regional.ts:255`)으로 무조건 true를 반환하고, (b) 설령 false로 고쳐도 `VoluntaryComparison.tsx:199`가 다른 객체의 플래그를 보므로 배너가 뜨지 않는다. **프로젝트가 스스로 만든 안전장치가 두 번 우회된다.**
- **완화 요소** — `voluntary-continuation/page.tsx:95`의 `TrustSignal`이 "법령·공단 산식 기반 참고 비교"라는 페이지 수준 고지를 표시한다(`e2e/pages.spec.ts`가 검증). 그래서 Critical이 아니라 Medium이다.
- **개선 방향** — `calculateVoluntaryPremium`의 `crossChecked`를 `false`로 되돌리고(문서의 자기 기술과 일치), `VoluntaryComparison.tsx:199`를 `voluntary?.crossChecked ?? regional.crossChecked`로 고친다. `regional.test.ts:359-363`도 함께 수정한다. 혹은 두 플래그의 의미를 타입 수준에서 분리한다.
- **확신도**: **High**
- **예상 공수**: **S**

### [Medium-3] sitemap lastmod와 Article dateModified가 전 페이지 동일한 전역 상수다 — 신선도 신호가 거짓말을 한다

- **근거**
  - `src/app/sitemap.ts:21` — `lastModified: SITE.lastVerified` (경로별 분기 없음)
  - `src/components/guide.tsx:65` — `dateModified: SITE.lastVerified` (가이드 6편 공통)
  - `src/lib/site.ts:62` — `lastVerified: '2026-08-03'` 단일 값
  - 빌드 산출물 `out/sitemap.xml` — 11개 URL 전부 `<lastmod>2026-08-03</lastmod>`
  - `e2e/og-meta.spec.ts:148-160` — 이 동일성을 **의도된 사양으로 고정**한다 (`toEqual(new Set([SITE.lastVerified]))`)
- **문제** — 빌드 시각 대신 실제 확인일을 쓰겠다는 의도(`sitemap.ts:19-20`)는 옳다. 그러나 페이지 단위가 아니라 사이트 단위 값이라, 가이드 한 편만 고쳐도 `lastVerified`를 올리는 순간 **나머지 10개 URL이 전부 변경됨으로 신고된다.** 반대로 올리지 않으면 실제로 바뀐 페이지가 갱신 신호를 못 받는다. 어느 쪽이든 부정확하고, 반복되면 검색엔진이 lastmod를 무시하게 된다.
- **개선 방향** — `RouteEntry`에 `lastModified?: string`을 추가해 페이지별로 관리하고, sitemap은 `route.lastModified ?? SITE.lastVerified`로 폴백한다. `guideJsonLd`에도 `modified` 인자를 추가한다. `e2e/og-meta.spec.ts:148-160`은 "모두 동일" 대신 "ISO 날짜 형식 + 오늘 이하"로 단언을 완화한다.
- **확신도**: **High**
- **예상 공수**: **S**

### [Medium-4] 화면·마크업 어디에도 time 요소가 없다 — 최신성 신호가 기계 판독 불가

- **근거**
  - 빌드 산출물 15개 HTML 전수 파싱 결과 `<time>` 태그 **0개**
  - `src/components/guide.tsx:335-342` — "기준 · 2026년 · 발행 … · 최종 확인 …" 전부 일반 텍스트
  - `src/components/TrustSignal.tsx:28-30`, `src/app/layout.tsx:133`, `src/app/privacy/page.tsx:118` — 모두 일반 텍스트
- **문제** — 날짜가 JSON-LD에만 존재하고 본문에는 마크업 없는 문자열로만 있다. AEO/GEO에서 최신성은 인용 선택의 핵심 요인인데, 크롤러가 본문에서 날짜를 확정하려면 자연어 파싱에 의존해야 한다. 마크업과 화면 양쪽에 있는 편이 안전하다.
- **개선 방향** — 한 줄 수정. `최종 확인 <time dateTime={SITE.lastVerified}>{SITE.lastVerified}</time>`. Medium-3의 페이지별 날짜와 함께 처리하면 일관된다.
- **확신도**: **High** (산출물 전수 확인). 다만 "고치면 인용률이 오른다"는 **인과는 미검증** — 구조 결함으로만 제기한다.
- **예상 공수**: **S**

### [Medium-5] 엔티티·E-E-A-T 경로가 색인 차단으로 끊겨 있다

- **근거**
  - `src/lib/routes.ts:169-192` — `privacy`, `terms`, `contact` 모두 `noindex: true`
  - `src/app/contact/page.tsx:8` — `robots: { index: false, follow: true }`
  - 빌드 산출물: `out/contact/index.html` → robots `noindex, follow`, `jsonld: []`
  - `out/verification-policy/index.html` → 색인 대상인데 `jsonld: []`
  - `src/components/guide.tsx:54-58` — `author.url`이 `/verification-policy/`를 가리킨다
- **문제** — 운영 주체·연락처·개인정보 처리 방침이 전부 색인 대상에서 빠져 있다. 색인 예산 절약이라는 의도(`privacy/page.tsx:8`)는 이해되지만, **개인 운영 민간 서비스가 공적 제도를 해설하는** 이 프로젝트에서 E-E-A-T 신호는 색인 예산보다 비싸다. 그리고 `author.url`의 목적지에도 저자 마크업이 없어(High-3) 기계가 저자를 추적하는 경로가 두 번 끊긴다.
- **개선 방향** — `contact`의 noindex를 해제하고 `ContactPage` + `Organization.contactPoint`를 넣는다. `/verification-policy/`에 `AboutPage` + `Organization`(High-3의 ORG_ID 참조) + `Person`을 추가한다. `privacy`/`terms`는 noindex 유지가 합리적이다.
- **확신도**: **Medium** (색인 정책은 의도적 선택이므로 "틀렸다"가 아니라 "목표와 상충한다"는 지적)
- **예상 공수**: **S**

### [Medium-6] React 컴포넌트에 단위 테스트가 0개다 — 약 1,800줄이 e2e에만 의존한다

- **근거**
  - `vitest.config.ts:5-6` — `environment: 'node'`, `include: ['src/**/*.test.ts']` (**`.tsx` 제외**)
  - 테스트 없는 컴포넌트: `ui.tsx`(451줄), `DependentJudge.tsx`(444), `guide.tsx`(342), `VoluntaryComparison.tsx`(297), `RegionalPremiumCalc.tsx`(281), `DependentEvidenceChecklist.tsx`(253) — **합계 약 1,800줄**
  - 예외인 `DependentEvidenceChecklist.test.ts`는 컴포넌트가 아니라 순수 함수 `buildEvidenceChecklist`만 검사한다
  - `@testing-library/react`·`jsdom` 미설치
- **문제** — 이번 감사에서 나온 High-2(툴팁), Medium-1(모달)이 전부 컴포넌트 레이어 결함이다. e2e 5개 프로젝트가 있지만 상호작용 상태 조합을 다 돌기엔 느리고 비싸서 커버되지 않은 분기가 많다. 예: `RegionalPremiumCalc.tsx:67-80`의 쿼리 프리필 분기(High-1의 진원지)는 `e2e/regional-premium.spec.ts:148` 한 줄만 스쳐 지나간다.
- **개선 방향** — 전면 도입은 과하다. `vitest.config.ts`에 jsdom 환경 프로젝트를 추가하고 include에 `.tsx`를 넣은 뒤, **상태 로직이 있는 3개**(`RegionalPremiumCalc` 프리필, `ZeroValueConfirmModal` 포커스, `InfoTooltip` 노출)만 먼저 덮는다.
- **확신도**: **High** (설정과 파일 목록으로 확정)
- **예상 공수**: **M**

### [Medium-7] 개인정보처리방침이 GA4 쿠키를 고지하지 않는다

- **근거**
  - `src/app/privacy/page.tsx:43-56` — 2절 제목이 "쿠키 및 광고"인데 본문은 **광고 쿠키만** 다룬다: "현재 기준체크에는 광고 코드가 설치되어 있지 않아 광고 쿠키를 사용하지 않습니다"
  - `src/components/Analytics.tsx:20-35` — GA4는 `_ga` 등 퍼스트파티 쿠키를 설정한다
  - 3절(`58-91`)은 GA4의 **수집 항목**을 설명하지만 **쿠키 설정 사실**은 언급하지 않는다
- **문제** — 개인정보 보호법 제30조제1항제7호는 "개인정보 자동 수집 장치의 설치·운영 및 그 거부에 관한 사항"을 처리방침에 명시하도록 한다. 현 문구는 "광고 쿠키를 사용하지 않는다"만 말해 **분석 쿠키는 사용한다**는 사실이 독자에게 전달되지 않는다. 브라우저 거부 안내(`52-55`)가 있어 완전 누락은 아니지만 서술이 오해를 부른다.
- **개선 방향** — 2절에 한 문장 추가. "접속 통계를 위해 Google Analytics 4가 `_ga` 등의 분석 쿠키를 이용자 브라우저에 저장합니다. 광고 쿠키는 사용하지 않습니다." 3절과 상호 참조를 맞춘다.
- **확신도**: **Medium** (사실 불일치는 High, 법적 판단은 전문가 확인 필요)
- **예상 공수**: **S**

### [Medium-8] 404 페이지의 canonical이 홈을 가리키고 robots 메타가 중복된다

- **근거** — 빌드 산출물 `out/404/index.html`, `out/404.html`

```
canonical: ['https://gijuncheck.kr/']
robots:    ['noindex', 'noindex, follow']     <- 2개
```

  - 원인: `src/app/layout.tsx:18-20`의 `alternates: { canonical: SITE.url }`을 `not-found.tsx`가 덮어쓰지 않는다(`src/app/not-found.tsx:4-7`은 title과 robots만 지정). robots 중복은 layout(`layout.tsx:44-46`)과 not-found(`not-found.tsx:6`)가 각각 방출한 결과
- **문제** — 존재하지 않는 URL이 홈을 canonical로 선언하면 크롤러가 잘못된 URL을 홈의 변형으로 취급할 여지가 생긴다. 정적 export라 404 상태 코드가 호스트 설정에 의존하는데 이 조합이 겹치면 색인이 꼬인다.
- **개선 방향** — `not-found.tsx`의 metadata에 `alternates: { canonical: null }`을 넣거나, 루트 layout에서 `alternates.canonical`을 제거한다. `metadata.ts:41`이 이미 페이지별로 설정하므로 layout 기본값은 불필요하다.
- **확신도**: **High** (산출물 확인)
- **예상 공수**: **S**

### [Low-1] 선언한 웹폰트가 로드되지 않아 대다수 사용자가 폴백 폰트를 본다

- **근거** — `src/app/globals.css:35-37`이 `font-family: Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", Inter, system-ui, …`를 선언하지만, 전체 소스에서 `@font-face` / `next/font` / 폰트 CDN link **검색 결과 0건** (`grep -rn "Pretendard|@font-face|next/font" src/`은 이 한 줄만 반환)
- **문제** — Pretendard도 Noto Sans KR도 로컬 설치 가능성이 낮다. macOS/iOS는 Apple SD Gothic Neo로, Windows/Android는 system-ui(맑은 고딕/Roboto)로 떨어진다. **디자인 의도가 주요 사용자층에서 구현되지 않는다.** 역설적으로 CWV에는 유리하다(웹폰트 다운로드·FOIT 없음). 그래서 Low다.
- **개선 방향** — 의도적이면 주석으로 "웹폰트를 싣지 않고 시스템 폰트로 간다"를 명시해 다음 사람이 헷갈리지 않게 한다. 의도가 아니면 `next/font/local`로 Pretendard subset을 `display: swap`과 함께 싣는다(정적 export에서도 동작).
- **확신도**: **High** (사실), **Low** (어느 쪽이 의도인지)
- **예상 공수**: **S**

### [Low-2] 정적 자산 무게 — 고아 파일 1개 포함 약 9.9MB

- **근거**
  - `public/og.png` — 624,580 bytes. `src/` 전체에서 참조 **0건** (`SITE.ogImage`는 `/og/home.png`, `site.ts:57`). `public/og/home.png`와 크기가 정확히 동일한 중복본
  - `public/og/*.png` 13개 — 개당 622KB~767KB, 합계 약 9.3MB
- **문제** — OG 이미지는 페이지 렌더 경로에 없으므로 CWV에 직접 영향은 없다. 다만 배포 아티팩트가 커지고, 카카오톡 등 일부 스크래퍼는 큰 이미지에서 미리보기 생성이 느려지거나 실패한다. 1200x630 PNG가 700KB면 압축이 전혀 안 된 상태다.
- **개선 방향** — `public/og.png` 삭제(`e2e/og-meta.spec.ts:50-67`이 13개 전부 200을 확인하므로 회귀는 즉시 잡힌다). 나머지는 pngquant/oxipng로 재압축하거나 WebP로 교체 — 개당 100~150KB로 떨어진다.
- **확신도**: **High**
- **예상 공수**: **S**

### [Low-3] 주석이 코드보다 앞서가 있다 — inputCls의 반응형 폰트 크기

- **근거**
  - `src/components/ui.tsx:21-24` — "모바일에서는 16px(text-base), 넓은 화면에서만 14px(text-sm) 로 되돌린다"
  - `src/app/globals.css:96-99` — "components/ui.tsx 의 inputCls 에서 `text-base sm:text-sm` 으로 처리한다"
  - 실제 코드 `src/components/ui.tsx:35-38` — `'… text-base text-slate-900 …'` — **`sm:text-sm`이 없다**
  - 빌드 산출물에서도 확인: `class="… px-3.5 py-2.5 text-base text-slate-900 …"`
- **문제** — 두 파일의 주석이 존재하지 않는 클래스를 사실처럼 설명한다. 실제 동작(모든 폭에서 16px)은 iOS 자동확대 방지 목적을 오히려 더 잘 달성하므로 **코드가 옳고 주석이 틀렸다.** 다만 6개월 뒤 이 주석을 믿고 `sm:text-sm`을 "복원"하면 원래 문제가 재발한다.
- **개선 방향** — 두 주석을 실제 동작에 맞게 고친다. "모든 폭에서 16px을 유지한다 — iOS 자동확대를 막기 위한 것이며 데스크톱에서 14px로 줄이지 않는다."
- **확신도**: **High**
- **예상 공수**: **S**

### [Low-4] `.pnpm-store/`가 `.gitignore`에 없다

- **근거** — `git status`가 `?? .pnpm-store/`를 미추적으로 보고. `.gitignore`(전 12줄)에 해당 항목 없음. `package-lock.json`이 있는 npm 프로젝트인데 pnpm 스토어가 생겼다.
- **문제** — `git add -A` 한 번이면 패키지 스토어 전체가 커밋된다. 되돌리려면 히스토리 재작성이 필요하다.
- **개선 방향** — `.gitignore`에 `.pnpm-store/` 추가.
- **확신도**: **High**
- **예상 공수**: **S**

### [Low-5] JSON-LD 주입에 `</script>` 이스케이프가 없다

- **근거** — `src/app/health-insurance/guides/pension-impact/page.tsx:98-111`, `src/app/health-insurance/dependent/page.tsx`, `regional-premium/page.tsx:82-85` 등 6개 파일 동일 패턴: `dangerouslySetInnerHTML={{ __html: JSON.stringify(...) }}`
- **문제** — 현재 주입값은 전부 저장소 내 상수(FAQ·제목·설명)이므로 **실제 위험은 없다.** 다만 어느 문자열에든 `</script>`가 들어가면 스크립트 블록이 조기 종료되어 HTML이 깨진다. 향후 외부 데이터를 넣으면 XSS 경로가 된다. 이 패턴이 6개 파일에 복제되어 관성이 붙었다.
- **개선 방향** — `structured-data.ts`에 직렬화 헬퍼를 두고 전 페이지가 쓰게 한다: `export const ldJson = (d: unknown) => JSON.stringify(d).replace(/</g, '\u003c');`
- **확신도**: **High** (패턴), **Low** (현재 악용 가능성 없음)
- **예상 공수**: **S**

### [Low-6] `llms.txt`가 없다

- **근거** — `public/`에 `robots.txt`(생성물)와 `logo.svg`, `og/` 뿐. `llms.txt` 없음.
- **문제** — 아직 표준이 아니고 채택률도 제한적이라 없다고 손해가 크지 않다. 다만 이 사이트는 콘텐츠가 이미 "질문 → 직답 → 근거" 구조로 정리되어 있어 비용 대비 효과가 좋은 편이다.
- **개선 방향** — 도구 3개 + 가이드 6편의 URL과 한 줄 요약을 담은 정적 `public/llms.txt`를 추가한다. `ROUTES`에서 생성하면 유지비가 0이다.
- **확신도**: **High** (부재), **Low** (효과)
- **예상 공수**: **S**

### [Nit-1] `Callout`의 warn과 danger 톤이 완전히 동일한 클래스다
`src/components/guide.tsx:172-174` — `warn`과 `danger`가 둘 다 `'border-amber-200 bg-amber-50 text-amber-900'`. 구분이 코드에만 있고 화면에는 없다. 하나로 합치거나 실제로 다르게 만든다.

### [Nit-2] `scripts/` 디렉터리가 비어 있다
`ls scripts/` → 항목 0개, `git ls-files scripts/` → 0개. 빈 디렉터리는 커밋되지 않으므로 다른 사람 체크아웃에는 존재하지 않는다. 삭제한다.

### [Nit-3] README의 테스트 수가 실제와 다르다
`README.md` "보험료 계산 · 재산 60등급표 · 반영률 · 상한하한 | **테스트 49개** 통과" vs 실측 `src/lib/premium/regional.test.ts` **54 tests**. 판정 로직 48개는 정확하다. 숫자를 손으로 관리하면 반드시 어긋난다 — 빼거나 총계(136)만 남긴다.

---

## SEO / AEO / GEO 진단

**노출 대상 프로젝트다.** 공개 도메인(`gijuncheck.kr`)에 배포되는 검색 유입 중심 정보 서비스이며, `README.md`가 11월 검색 피크 역산을 전략으로 명시한다.

**접근 순서**: 소스의 의도를 읽기 전에 `out/`의 15개 HTML을 파싱해 사실을 먼저 확정하고, 거기서 원인을 역추적했다.

| 항목 | 상태 | 근거 | 심각도 |
|---|---|---|---|
| 크롤러가 JS 없이 본문 접근 | ✅ | `next.config.mjs:20` `output: 'export'`. `out/index.html` 79,907바이트, `out/health-insurance/guides/pension-impact/index.html` 51,952바이트에 본문·FAQ·표가 전부 정적 포함. GPTBot·ClaudeBot 등 JS 미실행 크롤러도 전문 수집 가능 | — |
| 페이지별 고유 title | ✅ | 15개 HTML 전수 확인, 전부 고유. `metadata.ts:31` + `layout.tsx:15` 템플릿 | — |
| 페이지별 고유 description | ⚠️ | 도구·가이드 9개는 고유(50~197자). **홈·404·contact·privacy·terms 5개가 `SITE.description` 동일 문자열(64자)** — `site.ts:59`, `metadata.ts:34` 폴백. 홈이 폴백을 쓰는 건 손해 | Medium |
| canonical | ⚠️ | 색인 대상 11개는 자기 URL로 정확(`metadata.ts:41`). **404가 홈을 가리킴** (Medium-8) | Medium |
| sitemap | ⚠️ | `sitemap.ts`가 `routes.ts`에서 자동 생성 — 신규 페이지 자동 반영, `e2e/og-meta.spec.ts:133-146`이 레지스트리와 산출물을 대조. **단 lastmod 11개 전부 동일** (Medium-3) | Medium |
| robots | ✅ | `out/robots.txt` = `User-Agent: *` / `Allow: /` / `Sitemap: https://gijuncheck.kr/sitemap.xml`. `robots.ts:10-12`의 임시배포 자동 차단 장치가 잘 설계됨 | — |
| noindex 프로덕션 유출 | ✅ | 실수 없음. 도구·가이드 9개 전부 `index, follow`. noindex는 privacy/terms/contact/404로 의도된 것만 | — |
| 구조화 데이터 (JSON-LD) | ❌ | 가이드 6편 Article+WebPage+Person+Organization+Breadcrumb+FAQPage 완비, 도구 3개 WebApplication+Breadcrumb+FAQPage. **홈·검증원칙 0개, 전역 Organization 앵커 없음, publisher.logo 없음** (High-3) | High |
| 스키마 ↔ 본문 일치 | ✅ | `pension-impact` JSON-LD의 FAQ 4문항이 화면 `FaqSection`(`guide.tsx:259-277`)과 동일 `FAQ` 상수에서 생성 — 구조적으로 불일치 불가 | — |
| 시맨틱 헤딩 구조 | ✅ | 15개 전부 h1 정확히 1개. h4 사용 0 — 건너뜀 없음. `<main>` 1개(`layout.tsx:124`), article/nav/section 적절 | — |
| 이미지 alt / width·height | ⚠️ | 렌더 이미지는 로고 1개뿐이고 `alt="" aria-hidden`(장식용, 올바름). **width/height 속성 없음** — `layout.tsx:94`. Tailwind `h-9 w-9`가 CSS로 잡고 CSS는 렌더 블로킹이라 실제 CLS 영향은 미미 | Low |
| 인용 가능한 콘텐츠 청킹 | ✅ | 가이드마다 `GuideHeader`가 "한 줄 답변"을 h1 직후 배치(`guide.tsx:110-113`). 문단이 자립적이고 표·목록이 발췌 가능. **AEO 관점 이 사이트의 최대 강점** | — |
| 질문형 구조 + 직답 | ✅ | 가이드 6편 전부 `FaqSection`(`guide.tsx:259-277`) 보유. 홈 `POPULAR_QUESTIONS` 6개가 실제 질문 문장으로 딥링크(`page.tsx:40-70`). `:target` 강조까지 e2e 검증 | — |
| 정의 문장 | ✅ | "공적연금은 피부양자 자격 판정에서 총연금액 전액이 합산됩니다" 같은 단정문이 상수에서 생성되어 일관 유지 | — |
| 근거·출처 | ✅ | `SourceList`(`guide.tsx:284-304`)가 law.go.kr / nhis.or.kr / nts.go.kr 원문 링크. `e2e/guide-quality.spec.ts:29-38`이 공식 도메인 링크 존재를 강제 | — |
| 저자·최신성 신호 | ⚠️ | JSON-LD에 datePublished(페이지별)/dateModified(전역) + author.Person 존재. **화면·마크업에 time 요소 0개**(Medium-4), author.url 목적지에 저자 마크업 없음(High-3), dateModified 전역 공유(Medium-3) | Medium |
| 엔티티 명확성 (E-E-A-T) | ❌ | Organization `@id`/`logo`/`sameAs`/`contactPoint` 전무. contact 페이지 noindex(Medium-5). 저자는 실명 아닌 "기준체크 운영자" | High |
| AI 크롤러 접근 정책 | ✅ | `robots.ts:15`가 `User-Agent: *` + `Allow: /`. GPTBot·ClaudeBot·PerplexityBot·Google-Extended·CCBot **차단 없음** — 노출 의도와 일치 | — |
| llms.txt | ⚠️ | 없음 (Low-6). 표준 아님 — Minor 이하로만 취급 | Low |
| 페이지네이션 / 무한스크롤 은닉 | ✅ | 해당 없음. 전 콘텐츠가 단일 정적 문서에 포함 | — |
| Open Graph / Twitter Card | ✅ | `metadata.ts:43-62`가 페이지별 절대 URL + 전용 이미지 13종. `e2e/og-meta.spec.ts:50-67`이 200 응답·MIME·1:1 매핑까지 검증. 파일 크기만 과대(Low-2) | — |
| hreflang | — | 단일 언어(`<html lang="ko">`). 해당 없음 | — |

### 가장 큰 병목 한 가지

**홈과 검증원칙 페이지의 구조화 데이터 공백, 그리고 그로 인한 사이트 전역 Organization 엔티티의 부재다.**

이 사이트는 답변엔진이 좋아하는 조건을 이미 거의 다 갖췄다 — JS 없이 읽히는 전문, 헤딩 직후의 한 줄 답변, 자립적 문단, 법령 원문 링크, 구체적 수치와 날짜. 그런데 정작 "이 답을 누가 했는가"를 기계가 확정할 수 있는 노드가 사이트 전체에 하나도 없다. 답변엔진은 인용 후보를 고를 때 콘텐츠 품질과 함께 출처의 식별 가능성을 본다. 지금은 우수한 콘텐츠가 익명으로 떠 있다.

`structured-data.ts`에 `@id`를 가진 Organization 하나를 추가하고(약 30줄), 홈에 WebSite+Organization+FAQPage를, 검증원칙에 AboutPage+Person을 붙이고, 가이드 6편의 인라인 publisher를 `@id` 참조로 바꾸면 — 반나절 작업으로 11개 색인 페이지가 하나의 식별된 발행 주체로 결합된다. Medium-3(페이지별 lastmod)과 Medium-4(time 요소)를 함께 처리하면 최신성 신호까지 정합해진다. **투입 대비 효과가 이 리포트의 다른 어떤 항목보다 크다.**

---

## 가설 — 근거 부족, 추가 확인 필요

각 항목에 **무엇을 보면 판정 가능한지**를 함께 적는다.

1. **`applyLimit`의 하한 적용 순서가 법령과 맞는가**
   `src/lib/premium/regional.ts:123-143`은 하한(20,160원)을 **소득보험료에만** 적용하고 재산보험료를 그 위에 더한다(`healthWithIncomeFloor = max(health, LOWER + propertyPortion)`). 반면 「월별 건강보험료액의 상한과 하한에 관한 고시」는 통상 **월별 보험료액 총액**에 하한을 건다고 읽힌다. 재산 1억 1만원·소득 0원 사례에서 이 차이는 20,160원 vs 24,810원으로 갈린다.
   → `docs/03-검증기록.md`의 C05가 이 값을 24,810원(총액 28,070원)으로 기록해 구현과 일치하지만, **그 기록의 공단 열과 기준체크 열이 같은 값이고 원본 캡처가 저장소에 없다.** 판정하려면: 공단 모의계산 화면 캡처 또는 실제 고지서 1건. `regional.test.ts:266-301`의 13개 기대값은 구현 출력과 구조적으로 구별 불가하므로 이 오류 유형을 검출할 수 없다.

2. **`calculateVoluntaryPremium`이 지역가입자 하한을 쓰는 것이 맞는가**
   `regional.ts:233`이 `PREMIUM_LIMIT.LOWER`(`2026.ts:102`, 주석에 "지역가입자")를 직장가입자 성격인 임의계속가입 계산에 적용한다. 상한은 `REMUNERATION_PREMIUM_UPPER`(9,183,480원)로 직장용을 따로 쓰면서 하한만 지역용을 공유한다.
   → `docs/03-검증기록.md`가 고시의 하한을 20,160원 단일값으로 기록하고 있어 문제없을 가능성이 높다. 판정하려면: 2026년 고시 원문의 직장가입자 하한 조항.

3. **`judgeSupport`의 비동거 직계비속 분기가 실제 규칙과 일치하는가**
   `judge.ts:104-128`은 비동거 직계비속을 **미혼이기만 하면 부양 인정**한다. 공단 안내에는 "미혼인 비동거 직계비속으로서 부모가 없거나 부모가 요건을 충족하지 못하는 경우" 같은 추가 조건이 있다는 서술을 본 기억이 있으나 확인하지 못했다. 만약 그렇다면 이 분기는 **탈락해야 할 사람을 인정으로 판정**한다.
   → 판정하려면: 국민건강보험법 시행규칙 별표 1의 직계비속 항목 원문. `official-cases.test.ts:66-74`는 "비동거·기혼"만 다루고 "비동거·미혼·부모 생존" 조합이 없어 현 테스트로는 판별 불가.

4. **Core Web Vitals 실측**
   홈의 초기 JS는 `379`(174KB) + `67b`(173KB) + `746`(31KB) + framework(190KB) + main-app 등 비압축 합계 약 600KB이고, `polyfills`(113KB)는 `noModule`로 최신 브라우저에서 제외된다(빌드 산출물에서 `noModule` 1건 확인). gzip 후 추정 180~200KB는 정적 사이트로서 무난하지만 **추정이다.**
   → 판정하려면: 프로덕션 도메인의 PageSpeed Insights 필드 데이터 또는 `@vercel/speed-insights`(`layout.tsx:65`)에 누적된 실측치. `README.md`가 이미 미완 과제로 적고 있다.

5. **GA4 데이터 스트림의 쿼리 파라미터 제외 설정 여부**
   Critical-1의 GA4 경로가 실제 유출로 이어지는지는 콘솔 설정에 달렸고 코드로는 알 수 없다. **단, 호스팅 액세스 로그 경로는 설정과 무관하게 성립하므로 Critical-1 자체는 확정이다.**
   → 판정하려면: GA4 관리 > 데이터 스트림 > 태그 설정 > "URL 쿼리 매개변수 제외" 목록.

6. **실제 색인 상태**
   `README.md`가 색인 신청 완료·처리 대기로 기록. canonical·sitemap·robots는 코드상 정합하나 실제 선택된 canonical과 제외 사유는 코드로 알 수 없다.
   → 판정하려면: Search Console 페이지 색인 생성 보고서, 네이버 서치어드바이저 수집 현황.

---

## 유지할 것

- `src/lib/routes.ts` 경로 레지스트리 — sitemap·OG·noindex·허브 노출이 한 파일에서 파생되고 `e2e/og-meta.spec.ts:133-146`이 레지스트리와 산출물의 일치를 강제한다. 이 프로젝트에서 가장 잘 설계된 부분이다.
- `src/lib/site.ts:32` + `robots.ts:10-12` — 임시 도메인 배포 시 색인을 자동 차단하고 화면에 배너를 띄우는 장치. 스테이징 설정 유출이라는 흔한 Blocker를 구조적으로 봉쇄했다.
- `src/lib/analytics.ts:57-63` — `EventMap` 타입이 숫자 필드 자체를 컴파일 단계에서 금지한다. 정책을 문서가 아니라 타입으로 강제한 좋은 예다(다만 Critical-1의 URL 경로는 이 방어선 밖이다).
- `src/lib/constants/2026.ts` — 모든 기준값이 근거 조항 주석과 함께 한 곳에 있고 `judge.ts:7`이 "숫자 리터럴을 쓰지 않는다"를 규칙으로 선언한다.
- `docs/03-검증기록.md` — "출처 매핑 / 자동 테스트 / 공식 대조"를 분리한 상태 정의와, D03·D04를 "미확인(임의 입력 불가)"으로 남긴 정직성.
- `e2e/` 스위트 — 5개 브라우저 프로젝트, 사이트 전체 링크 크롤, 앵커 id 실존 확인, 가로 스크롤 검사, OG 이미지 200 응답 확인. 개인 프로젝트에서 보기 드문 밀도다.
- `next.config.mjs:5-18`과 README의 "놓치기 쉬운 함정 3개" — 실제로 밟은 실수를 재발 방지 지식으로 남겼다.
- `src/components/DependentJudge.tsx:312-318` — 인정/탈락을 색이 아니라 기호와 텍스트로만 구분한 결정. 법적 리스크 비평을 코드로 반영했다.
- `src/components/ui.tsx:104-115` — `type="number"`를 쓰지 않는 이유 3가지를 명시하고 `inputMode="numeric"` + 콤마 표시 + 한글 단위 되읽기로 대체한 판단. 금액 오입력을 실제로 줄인다.
