# 비평 리포트 — alpha

작성일 2026-08-04 · 대상 커밋 `ad73404` · 독립 표본 (타 critic 산출물 미참조)

## 검토 범위

**전문 또는 대부분을 읽은 파일 (50+)**
`package.json`, `next.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `.gitignore`,
`src/app/layout.tsx`, `src/app/page.tsx`, `src/app/not-found.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/globals.css`,
`src/app/health-insurance/dependent/page.tsx`, `.../voluntary-continuation/page.tsx`, `.../guides/november-reassessment/page.tsx`,
`src/app/privacy/page.tsx`, `src/app/contact/page.tsx`, `src/app/verification-policy/page.tsx`,
`src/lib/site.ts`, `src/lib/routes.ts`, `src/lib/metadata.ts`, `src/lib/structured-data.ts`, `src/lib/analytics.ts`, `src/lib/format.ts`,
`src/lib/dependent/{judge,types,guidance,sources,application}.ts`, `src/lib/premium/regional.ts`,
`src/lib/constants/2026.ts`, `src/lib/constants/property-score-table.ts`,
`src/components/{Analytics,TrackedLink,TrustSignal,DependentJudge,ui,guide,RegionalPremiumCalc,VoluntaryComparison,DependentEvidenceChecklist}.tsx`,
`src/lib/premium/regional.test.ts`, `src/lib/dependent/{official-cases,judge}.test.ts`,
`e2e/{pages,og-meta,guide-quality,analytics,keyboard-a11y,links,helpers}.ts`,
`README.md`, `MEMORY.md`, `docs/03-검증기록.md`, `docs/03-배포-가이드.md`

**실행한 명령**
- `npm run typecheck` → 통과
- `npx vitest run` → 6 파일 / 136 테스트 통과
- `npm run build` → 통과 (20 라우트 SSG, `out/` 생성)
- `npx playwright test --project=desktop-1440` → 89 passed / 12 skipped / 0 failed
- `npm run lint` → **대화형 프롬프트에서 정지 (High-1)**
- 빌드 산출물 직접 검사: `out/**/index.html`, `out/robots.txt`, `out/sitemap.xml`, JSON-LD 파싱, 내부 링크 카운트, 본문 shingle 중복도 측정
- `node_modules/@vercel/speed-insights/dist/index.mjs` 소스 확인

**검토하지 못한 영역 (명시)**
- 가이드 6편 본문의 법률적 정확성 (november-reassessment 외 5편은 구조만 확인)
- `property-score-table.ts`의 60등급 수치 전수 대조 (시행령 별표 4 원문 미조회)
- Playwright WebKit / tablet / mobile 프로젝트 (desktop-1440만 실행)
- 프로덕션 도메인의 실제 응답, 색인 상태, Core Web Vitals 실측
- GA4 콘솔 측 설정
- `docs/` 40여 개 문서 전수

---

## 요약 판단

기술적 완성도는 개인 프로젝트 기준 상위권이다. 타입체크·136개 단위 테스트·89개 E2E가 모두 통과하고, 각 설계 결정의 이유가 코드 주석에 남아 있어 인수인계 비용이 낮다. SEO 표면(canonical / og / sitemap / breadcrumb / FAQPage / noindex 정합성)은 E2E로 회귀 방지까지 걸어둔 드문 수준이다.

그러나 **출시 가능 상태는 아니다.** 이 서비스가 스스로 정의한 유일한 경쟁력이 "신뢰"인데, 그 신뢰를 직접 깨는 결함이 하나 있다. 사용자의 소득·재산 금액이 URL 쿼리스트링에 실려 페이지 이동하고, GA4가 그 URL 전체를 `page_location`으로 수집한다. 개인정보처리방침은 "금액은 어떤 형태로도 서버나 분석 도구로 전달되지 않습니다"라고 단정하고 있고, MEMORY.md 기준 GA4는 이미 프로덕션에 연결되어 있다.

그 다음 문제는 검색 성과에 직결된다. 최고 우선순위 페이지(`/health-insurance/dependent/`, priority 0.9)로 향하는 **홈페이지 내부 링크가 0개**이고, 홈에는 구조화 데이터가 **한 줄도 없다**. `npm run lint`는 실행 자체가 안 되고 CI도 없어서, 현재 품질은 사람이 매번 `npm run verify`를 손으로 돌리는 데 전적으로 의존한다.

---

## 발견 항목

### [Critical-1] 소득·재산 금액이 URL 쿼리로 이동하고 GA4가 그 URL 전체를 수집한다 — 개인정보처리방침 위반

- **근거**
  - `src/components/DependentJudge.tsx:433`
    → `href` 를 템플릿 리터럴로 조립: `ROUTES.regionalPremium.path` + `"?income=" + result.totalIncome + "&property=" + input.propertyTaxBase`
  - `src/components/RegionalPremiumCalc.tsx:261`
    → `href` 를 템플릿 리터럴로 조립: `ROUTES.voluntaryContinuation.path` + `"?property=" + propertyAmount`
  - `src/components/Analytics.tsx:24-35` — `gtag("config", id, { anonymize_ip: true })`. `page_location` 재정의도, 쿼리 제거도 없다. GA4의 기본 `page_view`는 `document.location.href`를 그대로 보낸다.
  - `src/app/privacy/page.tsx:87-90` — "**입력하신 소득·재산 금액과 나이는 전송되지 않습니다.** 수집하는 것은 위와 같은 참·거짓 값과 선택 항목뿐이며, 금액은 **어떤 형태로도** 서버나 분석 도구로 전달되지 않습니다."
  - `src/lib/analytics.ts:5-11` — 같은 제약을 코드 주석으로 재확인.
  - `MEMORY.md` "현재 완료 상태" — "GA4 Production 연결 및 핵심 이벤트 실시간 확인 완료" → 이론이 아니라 **현재 가동 중인 경로**.
- **문제**
  판정기에서 "그러면 보험료는 얼마인가요 →"를 누르면 주소창이 `/health-insurance/regional-premium/?income=52000000&property=740000000` 이 된다. 이 상태로 페이지가 로드되면서 GA4가 `page_location`에 이 URL을 통째로 실어 보낸다. `RegionalPremiumCalc.tsx:67-80`의 `useEffect`는 쿼리를 읽기만 하고 `history.replaceState`로 지우지 않으므로, 값은 주소창·브라우저 히스토리·GA4 보고서에 그대로 남는다. 사용자가 그 링크를 복사해 공유하면 자신의 연소득과 재산 과표를 함께 보낸다.
  이벤트 파라미터를 boolean/enum으로 좁힌 설계(`analytics.ts:57-63`)는 훌륭하지만, 유출 채널이 이벤트가 아니라 **URL**이라 그 방어를 우회한다.
- **테스트가 못 잡는 이유 (별도로 심각)**
  `e2e/analytics.spec.ts:36-39`는 `calls.filter((call) => call[0] === "event")` 로 **`config` 호출을 걸러낸다.** 파일 상단 주석(`:8`)은 "금액·나이·소득·재산 같은 원본 입력값이 페이로드에 섞이면 이 테스트가 실패한다"고 선언하지만, `config`와 `page_location`을 구조적으로 볼 수 없다. **불변식을 지킨다고 주장하지만 지킬 수 없는 테스트**이며, 오히려 잘못된 안심을 준다.
- **영향**
  개인정보처리방침 명시 위반. 소득·재산은 민감 재무정보이고 대상 사용자가 은퇴자다. 신고 한 건으로 서비스의 유일한 자산(신뢰)이 끝난다. 애드센스 심사에서도 방침-실제 불일치는 감점 요인이다.
- **개선 방향**
  1. (최소) `gtag config`에서 URL을 정규화한다 — `page_location: window.location.origin + window.location.pathname`
  2. (권장) 핸드오프를 쿼리에서 `sessionStorage`로 바꾼다. 값이 주소창에 나타나지 않고 공유 사고도 막힌다.
  3. (2를 못 하면) 수신 측 `useEffect`에서 읽은 직후 `history.replaceState(null, "", location.pathname)` 로 즉시 지운다.
  4. `e2e/analytics.spec.ts`에 `config` 호출과 `page_location`을 검사하는 케이스를 추가한다 — `expect(JSON.stringify(configs)).not.toMatch(/income=|property=/)`
- **확신도**: High (코드 경로·문구·GA4 기본동작 모두 파일에서 확인. 유일한 완화 가능성은 GA4 콘솔의 "쿼리 매개변수 제외" 수동 설정인데, 코드와 저장소 어디에도 기록이 없다 → 가설 3 참조)
- **예상 공수**: S (1~3시간)

---

### [High-1] `npm run lint` 가 실행 불가 상태 — ESLint 설정·의존성 없음, `verify`에도 없음, CI도 없음

- **근거**
  - `package.json:14` — `"lint": "next lint"`
  - `package.json:21` — `"verify": "npm run typecheck && npm test && npm run build && npm run test:e2e"` (lint 미포함)
  - devDependencies(`package.json:24-35`)에 `eslint` 없음. 루트에 `.eslintrc*` / `eslint.config.*` 없음 (`ls -a` 확인).
  - 실제 실행 결과: `` `next lint` is deprecated `` → `? How would you like to configure ESLint?` 대화형 프롬프트에서 정지.
  - `.github/` 없음 → CI 파이프라인 부재.
- **문제** 린트가 "있다고 적혀 있으나 한 번도 돈 적이 없는" 상태다. Next.js 15.5에서 `next lint`는 deprecated이고 16에서 제거된다. `verify`에도 없으므로 아무도 실패를 눈치채지 못한다. CI가 없어 `verify` 자체가 사람 손에 달려 있고, MEMORY.md의 검증 기준선은 로컬 1회 실행 스냅샷이다.
- **영향** 미사용 변수, 잘못된 hook 의존성, `jsx-a11y` 위반, `@next/next` 규칙 위반이 전부 무검출로 통과한다. Next 16 업그레이드 시 스크립트가 그냥 죽는다. 리뷰어 없는 1인 프로젝트에서 정적 분석 부재는 회귀 위험을 곧바로 키운다.
- **개선 방향** `npm i -D eslint eslint-config-next` 후 `npx @next/codemod@canary next-lint-to-eslint-cli .` 실행. `"lint": "eslint ."` 로 교체하고 `verify` 맨 앞에 `npm run lint &&` 추가. `.github/workflows/verify.yml`에 `npm ci && npm run verify` 잡을 걸어 push마다 돌린다.
- **확신도**: High
- **예상 공수**: S

---

### [High-2] 홈페이지에서 최우선 타깃 페이지 `/health-insurance/dependent/` 로 가는 내부 링크가 0개

- **근거** — 빌드 산출물에서 `href="/health-insurance/dependent/"` 출현 횟수를 직접 카운트했다.

  | 파일 | 링크 수 |
  |---|---|
  | `out/index.html` (홈) | **0** |
  | `out/health-insurance/guides/property-tax-base/index.html` | 2 |
  | `out/health-insurance/regional-premium/index.html` | 1 |
  | `out/verification-policy/index.html` | 1 |
  | `out/404/index.html` | 1 |

  - 원인: `src/app/page.tsx:253` — `href={key === "dependent" ? "#judge" : tool.path}`
  - `src/app/layout.tsx:102`, `:105`, `:118` — 헤더 데스크톱/모바일 내비와 "내 자격 확인" CTA가 전부 `/#judge`
  - `src/app/page.tsx:98`(hero), `:175`(시나리오 카드 4장) — 전부 `#judge`
  - 한편 `src/lib/routes.ts:40-46` 은 이 경로에 `priority: 0.9`를 부여하고 sitemap에 넣는다.
- **문제**
  사이트에서 가장 권위가 높은 페이지(홈)가 두 번째로 중요한 페이지로 링크를 하나도 보내지 않는다. 대신 홈이 `DependentJudge`를 직접 렌더링해서(`page.tsx:362`) **같은 도구를 두 URL에서 제공**한다. 두 페이지의 `h1`도 같은 키워드를 노린다 — 홈 "피부양자 자격, 혼자 판단하기 어렵다면"(`page.tsx:85-89`) vs 전용 페이지 "피부양자 자격판정"(`dependent/page.tsx:88`). 본문 shingle 중복도는 4.5%로 낮아 중복 콘텐츠 판정 위험은 작지만, **링크 자산과 검색 의도가 두 URL로 쪼개진다.**
  전용 페이지에만 있는 자산(FAQPage JSON-LD 4문항, WebApplication, TrustSignal, 증빙 체크리스트)이 홈에는 없는데, 정작 유입은 홈으로 몰릴 구조다.
- **영향** `/health-insurance/dependent/` 의 색인·순위 성장이 구조적으로 느려진다. 11월 피크(`routes.ts:102` 주석)를 겨냥한 전략에서 가장 아까운 손실이다.
- **개선 방향** 둘 중 하나를 고른다 (섞지 말 것).
  - **A안 (권장)** 홈은 랜딩만 한다. `page.tsx:362`의 `<DependentJudge />`를 제거하고 `#judge` 앵커를 전부 `ROUTES.dependent.path`로 바꾼다. 홈 `h1`은 서비스 전체를 설명하는 문장으로 바꿔 키워드 충돌을 없앤다.
  - **B안** 홈에 도구를 유지하되, 전용 페이지로 향하는 명시적 링크("자세한 판정 기준과 FAQ 보기")를 최소 2곳(도구 카드·판정 결과 하단)에 넣는다.
  - 어느 쪽이든 `e2e/links.spec.ts`에 "홈은 모든 `ready` 도구 경로로 최소 1개 링크를 가진다" 회귀 테스트를 추가한다.
- **확신도**: High (링크 수는 빌드 산출물에서 직접 카운트). 어느 안이 옳은지는 제품 판단이라 Medium.
- **예상 공수**: M

---

### [High-3] 404 페이지가 canonical·og:url 을 홈으로 선언한다 (soft-404 유발)

- **근거**
  - `src/app/not-found.tsx:4-7` — `metadata`에 `title`과 `robots`만 있고 `alternates.canonical`이 없다.
  - `src/app/layout.tsx:18-20` — `alternates: { canonical: SITE.url }` → 하위 페이지가 덮어쓰지 않으면 그대로 상속된다.
  - 빌드 산출물 `out/404.html` 및 `out/404/index.html`:
    - `<link rel="canonical" href="https://gijuncheck.kr/"/>`
    - `<meta property="og:url" content="https://gijuncheck.kr/"/>`
    - `<meta name="robots" content="noindex"/>` 와 `<meta name="robots" content="noindex, follow"/>` 가 **둘 다** 출력됨
- **문제**
  404 응답이 "나는 홈페이지의 정규 URL 사본이다"라고 선언한다. `noindex`와 `canonical→홈`은 서로 모순되는 신호이고, 구글은 이런 조합에서 canonical을 우선 해석하는 경우가 있다. 결과적으로 존재하지 않는 임의 URL이 홈의 변형으로 처리되어 soft-404로 잡힐 수 있다. `robots` 메타가 두 개 출력되는 것도 파서에 따라 해석이 갈린다.
  구조적 원인은 `layout.tsx:18`에서 **레이아웃 레벨에 절대 canonical을 박아둔 것**이다. `metadata.ts:33`의 `createPageMetadata`를 쓰지 않는 모든 페이지가 자동으로 홈을 canonical로 갖게 된다 — 지금은 홈과 404뿐이지만, 새 페이지를 추가하며 `createPageMetadata`를 빠뜨리면 조용히 같은 함정에 빠진다.
- **영향** 색인 예산 낭비, Search Console "대체 페이지(적절한 표준 태그 있음)" 오탐 누적. 페이지가 늘수록 재현 확률이 올라간다.
- **개선 방향**
  1. `layout.tsx:18-20`의 `alternates`를 제거하고, 홈에도 `createPageMetadata({ ..., path: ROUTES.home.path })`를 명시적으로 쓴다.
  2. `not-found.tsx:4-7`에서 canonical이 나오지 않도록 한다.
  3. `e2e/og-meta.spec.ts`에 "존재하지 않는 경로는 canonical을 갖지 않는다" 케이스를 추가한다. 현재 이 파일(`:70`)은 `ready` 경로만 순회해서 404를 보지 않는다.
- **확신도**: High
- **예상 공수**: S

---

### [High-4] 홈페이지에 구조화 데이터가 전혀 없고, Organization 엔티티가 사이트 어디에도 제대로 정의되지 않는다

- **근거**
  - 빌드 산출물의 `application/ld+json` 개수:

    | 페이지 | JSON-LD |
    |---|---|
    | `out/index.html` (홈) | **0** |
    | `out/verification-policy/index.html` (Article author.url 이 가리키는 곳) | **0** |
    | `out/privacy` / `terms` / `contact` | 0 |
    | `out/health-insurance/**` (도구 3 + 가이드 6) | 1 스크립트 안에 `@graph` 3노드 |

  - `src/app/page.tsx` 전체 395줄에 `ld+json` 없음.
  - `src/components/guide.tsx:59-63` — 유일한 Organization 정의가 `{ "@type": "Organization", name: SITE.name, url: SITE.url }` 뿐. `logo`, `sameAs`, `contactPoint`, `@id` 없음.
  - `src/components/guide.tsx:54-58` — `author: { "@type": "Person", name: "기준체크 운영자", url: "/verification-policy/" }`. 그런데 그 페이지에는 `Person` JSON-LD도, 화면상 저자 이름·이력도 없다.
  - `src/lib/site.ts:33,36` — `operatorName: "기준체크 운영자(개인 운영)"`, `authorName: "기준체크 운영자"`
- **문제**
  홈은 검색엔진과 답변엔진이 "이 사이트는 무엇이고 누가 운영하는가"를 확정하는 앵커 페이지다. 여기에 `Organization`(또는 `WebSite`) 노드가 없으면 나머지 페이지의 `publisher` 문자열이 어떤 엔티티에도 결합되지 않는다. `@id`로 노드를 상호 참조하지 않아 `@graph`가 사실상 독립 노드 3개의 나열이다.
  건강보험·재무는 전형적인 YMYL 주제다. 답변엔진이 인용 여부를 결정할 때 저자·조직 신원이 결정적인데, 지금은 "기준체크 운영자"라는 익명 문자열이 실체 없는 URL을 가리킨다.
- **영향** 브랜드 검색 시 Knowledge Panel / 사이트링크 형성 지연. AI 답변엔진의 인용 후보에서 탈락 확률 상승. Article 스키마의 `author`가 사실상 빈 신호라 E-E-A-T 가점이 없다.
- **개선 방향**
  1. `src/app/page.tsx`에 `@graph` 추가 — `Organization`(`@id: {SITE.url}#org`, `name`, `url`, `logo`, `email`, `sameAs`) + `WebSite`(`@id: {SITE.url}#website`, `publisher: {"@id": ...#org}`) + 도구 3개 `ItemList`.
  2. `guide.tsx:59-63`의 `publisher`를 `{"@id": ...#org}` 참조로 바꿔 노드를 결합한다.
  3. `/verification-policy/`에 `Person` + `AboutPage` JSON-LD를 넣고, **화면에도** 운영자 소개(무엇을 근거로 검증하는 사람인지, 연락처)를 한 문단 노출한다. 실명이 부담되면 최소한 `contactPoint`와 운영 이력이라도 붙인다.
  4. 도구 페이지의 `WebApplication`에 `url`, `description`, `provider` 추가 (현재 `dependent/page.tsx:52-58`은 `name`/`applicationCategory`/`operatingSystem`/`offers`뿐).
- **확신도**: High (JSON-LD 부재는 산출물에서 확인). 순위 영향의 크기는 Medium.
- **예상 공수**: M

---

### [Medium-1] `/health-insurance/`, `/health-insurance/guides/` 가 404 — 토픽 허브가 없다

- **근거** `out/health-insurance/` 와 `out/health-insurance/guides/` 에 `index.html`이 없다(하위 디렉터리만 존재). `src/lib/routes.ts:30-161`의 `ROUTES` 어디에도 이 두 경로가 없다.
- **문제** URL을 잘라 올라가는 사용자와 크롤러가 404를 만난다. 6편의 가이드를 묶는 허브가 없어 토픽 클러스터의 중심 노드가 비어 있고, 가이드 간 링크가 개별 `RelatedList`(`guide.tsx:307`)에만 의존한다.
- **영향** 클러스터 권위가 분산된다. 가이드가 10편을 넘어가면 링크 그래프가 더 얕아진다.
- **개선 방향** `/health-insurance/guides/` 에 가이드 6편 목록 + `CollectionPage` / `ItemList` JSON-LD를 가진 허브 페이지를 만들고 `ROUTES`에 등록한다(sitemap 자동 반영). 최소 대안은 두 경로를 301 리다이렉트하는 것인데, 정적 export라 `vercel.json`이 필요하다(Medium-6 참조).
- **확신도**: High / **예상 공수**: S~M

---

### [Medium-2] 임의계속가입 계산의 검증 플래그가 하드코딩 true 라 "참고용" 고지가 절대 뜨지 않는다

- **근거**
  - `src/lib/premium/regional.ts:255-257` — 주석 "재산점수표에 의존하지 않으므로 등급표 검증 상태와 무관하다" 아래에 `verified: true, crossChecked: true` 를 상수로 반환.
  - `src/components/ui.tsx:411-420` — `ReferenceOnlyNotice`는 `crossChecked === true`면 `null`을 반환한다.
  - `src/components/VoluntaryComparison.tsx:199` — `<ReferenceOnlyNotice crossChecked={regional.crossChecked} />` → 임의계속가입 화면인데 **지역가입자 결과의 플래그**를 본다.
  - `docs/03-검증기록.md` 임의계속가입 절 — "공단 로그인 모의계산의 결과를 직접 복제한 것이 아니라, 현행 법령·공단 공식 안내·보험료 고시를 동일한 입력에 적용한 참고 비교다."
  - `src/lib/premium/regional.test.ts:359-363` — 이 하드코딩을 그대로 재확인하는 테스트("검증 플래그가 모두 true 다").
- **문제** 문서는 "공단 대조가 아니다"라고 기록하는데, 코드는 `crossChecked: true`로 선언해 그 사실을 알리는 UI를 스스로 껐다. 게다가 두 계산의 플래그가 배선상 뒤바뀌어 있어, 나중에 임의계속가입 산식 검증을 되돌리더라도 화면은 변하지 않는다. `verification-policy` 페이지가 내건 "04. 검증 상태를 숨기지 않습니다"(`verification-policy/page.tsx:62`) 원칙과 정면으로 어긋난다.
  다만 페이지 상단 `TrustSignal`(`voluntary-continuation/page.tsx:97-98`)이 "법령·공단 산식 기반 참고 비교 / 개인별 공단 고지액을 그대로 복제한 계산은 아닙니다"로 별도 고지하고 있어 완전한 은폐는 아니다. 그래서 Critical이 아니라 Medium이다.
- **영향** 검증 상태 배선을 신뢰할 수 없다. 상태가 바뀌어도 UI가 따라오지 않는다.
- **개선 방향** `calculateVoluntaryPremium`이 `crossChecked: false`(또는 별도 상태값)를 정직하게 반환하게 하고, `VoluntaryComparison.tsx:199`를 `voluntary?.crossChecked ?? regional.crossChecked` 로 바로잡는다. `regional.test.ts:359-363`은 구현 재확인이 아니라 "임의계속가입은 공단 대조 전이므로 false"를 단정하도록 바꾼다.
- **확신도**: High (배선 오류는 코드에서 명확). "false가 맞다"는 판단은 Medium. / **예상 공수**: S

---

### [Medium-3] 지정한 본문 폰트(Pretendard / Noto Sans KR)가 어디에서도 로드되지 않는다

- **근거**
  - `src/app/globals.css:34-39` — `body` 의 `font-family` 가 Pretendard → Noto Sans KR → Apple SD Gothic Neo → Inter → system-ui 순.
  - 저장소·빌드 산출물 전체에서 `@font-face` 0건, `fonts.googleapis.com` 0건, `next/font` import 0건. `out/index.html` `<head>`에 폰트 preload/link 없음(CSS 1개 + JS 청크뿐).
- **문제** Pretendard와 Noto Sans KR은 웹폰트로 배포하지 않으면 대부분의 사용자 기기에 없다. 실제 렌더링은 iOS에서 Apple SD Gothic Neo, Android/Windows에서 system-ui로 떨어진다. 즉 **디자인 문서(ADR-002)와 `design-preview/index3.html`이 전제한 타이포그래피가 프로덕션에 존재하지 않는다.** `tracking-[-.055em]`(`page.tsx:85`) 같은 미세 자간 조정은 폰트가 다르면 의도와 다르게 보인다.
- **영향** 기기별 렌더링 편차. 디자인 리뷰 결과와 실제 화면의 불일치. (역설적으로 CWV에는 유리하다 — 웹폰트 요청이 0이다.)
- **개선 방향** 둘 중 하나로 정하고 문서화한다.
  - 시스템 폰트가 의도였다면 `globals.css:35`에서 Pretendard·Noto Sans KR을 지우고 ADR에 "웹폰트 미사용" 결정을 남긴다.
  - Pretendard를 쓸 것이라면 `next/font/local`로 한글 subset woff2를 self-host하고 `font-display: swap` + preload를 건다.
- **확신도**: High (부재 사실). 어느 쪽이 옳은지는 의도 확인 필요. / **예상 공수**: S

---

### [Medium-4] 0원 확인 모달에 포커스 트랩이 없다

- **근거** `src/components/ui.tsx:321-405`
  - `:338-351` — Escape 키 처리와 `body` 스크롤 잠금만 있다.
  - `:388` — `autoFocus`로 첫 진입 포커스만 처리.
  - 배경 콘텐츠에 `inert` / `aria-hidden` 적용 없음. Tab 순환 가둠 없음. 닫은 뒤 트리거로 포커스 복귀 없음.
  - `e2e/keyboard-a11y.spec.ts:29-32` — Tab 1회 + Enter만 검증해서 트랩 부재를 잡지 못한다.
- **문제** `aria-modal="true"`(`:362`)를 선언했으므로 보조기술은 배경이 차단되었다고 기대하지만, 실제 키보드 포커스는 확인 버튼 다음 Tab에서 뒤쪽 헤더·본문으로 빠져나간다. 스크린리더 사용자가 모달 밖으로 나간 뒤 돌아올 방법이 없다.
- **영향** WCAG 2.1 2.4.3 위반. 주 사용자층이 고령층이라 접근성 결함의 실제 비용이 크다.
- **개선 방향** 네이티브 `<dialog showModal()>`로 교체하면 트랩·Escape·backdrop이 브라우저 기본 동작으로 해결된다(Safari 15.4+, 대상 브라우저 충족). 유지한다면 첫/마지막 포커스 가능 요소 사이에서 Tab/Shift+Tab을 되돌리고, 닫힘 후 트리거로 `focus()`를 복귀시킨다.
- **확신도**: High / **예상 공수**: S

---

### [Medium-5] sitemap `lastmod` 가 전 페이지 동일한 수동 상수 — 개별 갱신 신호가 없다

- **근거** `src/app/sitemap.ts:21`(`lastModified: SITE.lastVerified`), `src/lib/site.ts:62`(`lastVerified: 2026-08-03`), `out/sitemap.xml`(11개 URL 전부 동일), `e2e/og-meta.spec.ts:148-158`("모든 lastmod가 하나여야 한다"를 테스트로 고정).
- **문제** 빌드 시각 대신 확인일을 쓴 결정 자체는 옳다(`sitemap.ts:19-20` 주석의 근거는 타당). 그러나 **페이지 단위 갱신 이력이 없다.** 가이드 1편만 고쳐도 11개 URL의 lastmod가 전부 바뀌고, 반대로 상수를 갱신하지 않으면 실제 수정이 있어도 신호가 안 나간다. 실제로 `f292bec` 이후 5개 커밋이 콘텐츠를 바꿨지만 lastmod는 2026-08-03에 고정돼 있다.
  `guide.tsx:64-65`가 `datePublished`는 페이지별, `dateModified`는 전역으로 쓰는 것도 같은 문제다.
- **영향** 크롤 우선순위 신호가 무뎌진다. 11월 피크 직전 가이드 갱신 시 재크롤을 유도할 지렛대가 없다.
- **개선 방향** `RouteEntry`에 `lastVerified?: string`를 추가해 페이지별로 관리하고 미지정 시 `SITE.lastVerified`로 폴백한다. `guide.tsx`의 `dateModified`도 같은 값을 쓰게 한다. `og-meta.spec.ts:156`의 단정은 "모든 값이 ISO date이고 `SITE.lastVerified` 이하"로 완화한다.
- **확신도**: High / **예상 공수**: S

---

### [Medium-6] 보안 헤더가 전무하다 (CSP / Referrer-Policy / X-Content-Type-Options)

- **근거**
  - 저장소에 `vercel.json`, `_headers`, `netlify.toml` 없음 (`find -maxdepth 2` 확인).
  - `next.config.mjs` 전체 30줄에 `headers()` 없음 (정적 export에서는 애초에 동작하지 않는다).
  - 외부 스크립트 2종을 로드한다: `src/components/Analytics.tsx:21`(googletagmanager.com), `src/app/layout.tsx:65`(`@vercel/speed-insights` → `/_vercel/speed-insights/script.js`).
  - `dangerouslySetInnerHTML` 인라인 스크립트 9곳: `dependent/page.tsx:82`, `regional-premium/page.tsx:84`, `voluntary-continuation/page.tsx:80`, 가이드 6편.
- **문제** 제3자 스크립트를 실행하면서 CSP가 없다. GA 계정 탈취나 CDN 공급망 사고 시 완화 장치가 하나도 없다. 정적 사이트라 서버 측 공격면은 작지만, 이 사이트는 사용자가 재무정보를 입력하는 폼을 띄운다. Referrer-Policy도 명시되지 않아 브라우저 기본값(strict-origin-when-cross-origin)에 의존한다 — 그 기본값 덕에 Critical-1의 쿼리스트링이 외부 링크로 새지는 않지만, 명시적 방어는 아니다.
- **영향** 공급망 공격에 대한 심층방어 0. 보안 스캐너·애드센스 심사에서 감점.
- **개선 방향** 루트에 `vercel.json`을 추가한다 (Medium-1의 리다이렉트도 여기서 처리 가능).
  - Content-Security-Policy: default-src 는 self, script-src 에 googletagmanager.com 과 va.vercel-scripts.com 허용, connect-src 에 google-analytics.com 과 vitals.vercel-insights.com 허용, frame-ancestors 는 none, base-uri 는 self
  - Referrer-Policy: strict-origin-when-cross-origin
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  - JSON-LD 인라인 스크립트 때문에 unsafe-inline 없이 가려면 nonce가 필요한데 정적 export에서는 불가능하다 — 이 한계를 주석으로 남길 것.
- **확신도**: High (부재 사실). 실제 위험도는 Medium. / **예상 공수**: S

---

### [Medium-7] "공개 기준 8건 대조 완료" 배지가 자체 작성 fixture에 기반한다 (순환 검증)

- **근거**
  - `src/app/health-insurance/dependent/page.tsx:93-96` — `<TrustSignal status="공개 기준 8건 대조 완료" ... />`
  - `src/lib/dependent/official-cases.test.ts:1-7`(파일 자체 주석) — "공단 공개 안내와 시행규칙의 관계·소득·재산 조건을 **같은 입력에 적용한 fixture**다. 공단 로그인 모의계산 또는 실제 처리 결과와 동일하다는 뜻은 아니며..."
  - `official-cases.test.ts:24-82` — 8개 케이스의 기대값이 전부 `judge.ts`가 구현한 규칙을 그대로 옮긴 것이다. 외부 출처에서 가져온 정답이 아니다.
- **문제** 이건 **검증이 아니라 명세의 재기술**이다. `judge.ts`의 규칙이 틀렸다면 이 테스트도 함께 틀린다. 그런데 UI 배지는 "대조 완료"라고 말하고, 사용자는 이걸 외부 대조로 읽는다. `regional-premium`의 "공단 모의계산 13건 대조 완료"는 `docs/03-검증기록.md`에 공단 계산기의 실제 출력값(C01~C13)이 표로 기록돼 있어 성격이 완전히 다른데, UI에서는 같은 컴포넌트·같은 톤으로 표시되어 구분이 안 된다.
- **영향** 신뢰 신호의 인플레이션. "우리는 검증 상태를 숨기지 않는다"는 포지셔닝의 근간을 약화시킨다. 이 사이트에서는 다른 어떤 결함보다 브랜드 손상이 크다.
- **개선 방향** 문구를 사실에 맞춘다 — 예: "시행규칙 기준 8건 자체 재현". `TrustSignal.tsx:8`에 이미 존재하나 미사용인 `tone="reference"`를 적용해 공단 대조가 끝난 지역보험료와 시각적으로 구분한다. 진짜 대조를 원한다면 공단 피부양자 모의확인 결과 8건을 `docs/03-검증기록.md`에 남긴 뒤 문구를 되돌린다.
- **확신도**: High (테스트 파일 스스로 인정) / **예상 공수**: S

---

### [Medium-8] 핵심 UI 컴포넌트 4종(총 1,473줄)에 단위 테스트가 0개 — E2E 단일 의존

- **근거**
  - `vitest.config.ts:4-6` — `environment: node`, `include: src/**/*.test.ts` (`.tsx` 미포함)
  - `src/**/*.test.ts` 6개 중 컴포넌트 대상은 `DependentEvidenceChecklist.test.ts` 하나뿐이고, 이것도 순수 함수 `buildEvidenceChecklist`만 검사한다.
  - 테스트 없는 파일: `DependentJudge.tsx`(444줄), `ui.tsx`(451줄), `VoluntaryComparison.tsx`(297줄), `RegionalPremiumCalc.tsx`(281줄)
  - 이 컴포넌트들에 실제 분기 로직이 있다: `DependentJudge.tsx:104-115`(`needsStepConfirmation`, `zeroValueFields`), `RegionalPremiumCalc.tsx:67-80`(쿼리 파싱), `VoluntaryComparison.tsx:51-56`(쿼리 파싱)
- **문제** README 규칙 2("로직을 UI에 넣지 않는다")가 이 지점에서 지켜지지 않았고, 그 결과 테스트가 없는 로직이 생겼다. 유일한 안전망인 E2E는 5개 브라우저 프로젝트 300여 케이스라 개발 중 피드백 루프에 쓰기 어렵다.
- **영향** 경계 조건 회귀가 잡히지 않는다. `RegionalPremiumCalc.tsx:70`의 `Number.isFinite(p) && p > 0`는 상한 검사가 없어 `?property=1e30`이 그대로 계산에 들어간다(클라이언트 순수 함수라 보안 문제는 아니지만, 60등급 표를 넘는 값이 화면에 표시된다).
- **개선 방향**
  1. `needsStepConfirmation`, `zeroValueFields`, 쿼리 파싱을 `lib/`의 순수 함수로 추출한다 (README 규칙 2 준수).
  2. `vitest.config.ts`를 jsdom 환경 + `src/**/*.test.{ts,tsx}` 로 바꾸고 `@testing-library/react`로 도구별 렌더 스모크 테스트를 최소 3개 추가한다.
  3. 쿼리 파서에 상·하한 클램프를 넣는다.
- **확신도**: High / **예상 공수**: M

---

### [Medium-9] `anonymize_ip` 는 GA4가 무시하는 UA 시절 파라미터인데, 개인정보처리방침이 이를 근거로 삼는다

- **근거** `src/components/Analytics.tsx:30-33`(`anonymize_ip: true` + "IP 익명화" 주석), `src/app/privacy/page.tsx:69-70`("IP 주소는 익명화되어 처리됩니다").
- **문제** GA4는 IP 익명화를 **항상 자동으로** 수행하며 `anonymize_ip`는 Universal Analytics 전용 파라미터라 무시된다. privacy 문구의 내용 자체는 참이지만, 코드의 근거는 no-op이다. 주석이 사실과 다른 안심을 준다.
- **영향** 낮다(결과가 우연히 맞다). 다만 "코드가 방침을 강제한다"는 이 프로젝트의 설계 원칙(`analytics.ts:5-11`)이 여기서는 성립하지 않는다.
- **개선 방향** `anonymize_ip`를 제거하고 주석을 "GA4는 IP 익명화가 기본 동작"으로 바꾼다. Critical-1의 `page_location` 정규화를 같은 커밋에 넣으면 이 config 블록이 실제로 방침을 강제하게 된다.
- **확신도**: High / **예상 공수**: S (Critical-1과 동일 커밋)

---

### [Low-1] OG 이미지 14장이 각 620~770KB, 미참조 `public/og.png`(624KB)가 남아 있다

- **근거** `ls -la public/og/` → 총 9.4MB, 최대 `before-business-registration.png` 766,953B. `public/og.png`(624,580B)는 `grep -rn "og.png" src/` 결과 **참조 0건** — `layout.tsx:29`는 `SITE.ogImage = /og/home.png`(`site.ts:56`)를 쓴다.
- **문제** 1200×630 소셜 카드는 보통 100~200KB로 충분하다. 배포 용량 9.4MB 중 상당수가 낭비이고, `og.png`는 죽은 파일이다. 카카오톡 인앱 브라우저 등 느린 환경에서 미리보기 로딩이 지연될 수 있다.
- **개선 방향** PNG-8 또는 quality 80 재인코딩(대략 1/5). `public/og.png` 삭제. `scripts/`에 최적화 스텝 추가.
- **확신도**: High / **공수**: S

### [Low-2] `InfoTooltip` 이 포커스 가능한 요소에 `role="img"` 를 쓴다

- **근거** `src/components/ui.tsx:82-99` — `tabIndex={0}` + `role="img"` + `aria-label` 인 `<span>` 안에 `role="tooltip"` 자식을 둔다. `:79` 에서 `children`이 문자열이 아니면 레이블이 "입력 도움말"로 떨어진다.
- **문제** `role="img"`는 자식을 프레젠테이션으로 취급하므로 안쪽 `role="tooltip"` 내용이 접근성 트리에 노출되지 않는다. 지금은 `aria-label`에 본문을 복제해서 동작하지만, `children`이 JSX가 되는 순간 조용히 무의미한 레이블이 된다. 포커스 가능한 요소에 img 롤은 ARIA 스펙상 부적절하다.
- **개선 방향** `<button type="button" aria-describedby={id}>` + `<span id={id} role="tooltip">`로 바꾼다. 레이블 복제가 사라지고 `children`이 JSX여도 안전해진다.
- **확신도**: High / **공수**: S

### [Low-3] JSON-LD를 `JSON.stringify` 결과 그대로 인라인 주입한다

- **근거** `dependent/page.tsx:82`, `regional-premium/page.tsx:84`, `voluntary-continuation/page.tsx:80`, 가이드 6편 — 모두 `dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}`
- **문제** 현재 데이터는 전부 저자 통제 하의 정적 문자열이라 실제 XSS는 없다. 다만 어떤 문자열에 `</script>`가 들어가면 스크립트 블록이 조기 종료된다. 향후 외부 입력이 스키마에 들어가면 곧바로 취약점이 된다.
- **개선 방향** 공통 `<JsonLd data={...}/>` 컴포넌트를 만들고 `<` 를 유니코드 이스케이프로 치환한다. 9곳의 중복도 함께 제거된다.
- **확신도**: High(패턴) / Low(현재 위험) / **공수**: S

### [Nit-1] `<Analytics />` 가 `<html>` 직하위, `<body>` 밖에 있다

- **근거** `src/app/layout.tsx:62-64` — `<html lang="ko">` 바로 아래 `<Analytics />`, 그 다음 `<body>`.
- React 19가 `<script>`를 `<head>`로 호이스팅해 빌드·동작 모두 문제없다(`out/index.html`에서 확인). 다만 소스만 봐서는 유효하지 않은 HTML 구조로 보이고, 다음 사람이 여기를 만지다 깨뜨리기 쉽다. `<body>` 안 최상단으로 옮기고 이유를 주석에 남길 것.

### [Nit-2] 정책 3개 페이지의 `description` 이 전부 동일하다

- **근거** `src/lib/metadata.ts:28` — `const summary = description || SITE.description;` / `privacy/page.tsx:5-10`, `terms`, `contact`가 `description`을 넘기지 않는다. 결과적으로 `out/privacy|terms|contact/index.html`의 description이 동일하다. 세 페이지 모두 noindex라 색인 영향은 없지만 공유 미리보기 문구가 겹친다. 한 줄씩 넣으면 끝난다.

### [Nit-3] `MoneyInput` 이 15자리 초과 입력을 아무 피드백 없이 무시한다

- **근거** `src/components/ui.tsx:140-141` — `if (digits.length > 15) return;` 사용자는 키를 눌렀는데 아무 일도 안 일어나는 경험을 한다. 마지막 유효 값으로 잘라 반영하거나 안내 문구를 띄울 것.

---

## SEO / AEO / GEO 진단

**해당 여부**: 해당됨. 검색 유입을 1차 성장 채널로 설계한 공개 웹사이트다(`docs/01-상세기획서.md`에 SEO 설계 항목, `routes.ts:100-107`에 11월 피크 전략 주석).

| 항목 | 상태 | 근거 | 심각도 |
|---|---|---|---|
| 크롤러가 JS 없이 본문 접근 | 정상 | `next.config.mjs:22` output export + `out/**/index.html`에 h1·본문·FAQ가 전부 HTML로 존재. Suspense bailout 1건은 SpeedInsights 전용 hidden 블록이라 본문과 무관 | — |
| 페이지별 고유 title/description | 정상(공개) / 주의(정책 3종) | `src/lib/metadata.ts:19-57`, 각 page.tsx의 TITLE/DESCRIPTION. 정책 3종만 `SITE.description` 공유 → Nit-2 | Low |
| canonical | 주의 | 공개 페이지는 자기 URL 정확(`out/**` 확인, `e2e/og-meta.spec.ts:69-91`이 회귀 방지). **404가 홈을 canonical로 선언** → High-3 | High |
| sitemap / robots | 주의 | `src/app/sitemap.ts` + `routes.ts:177` 자동 생성으로 누락 위험 없음. `out/robots.txt` Allow + sitemap 지정 정상. **lastmod가 전 페이지 동일 수동 상수** → Medium-5 | Medium |
| 구조화 데이터 (JSON-LD) | 주의 | 도구 3 · 가이드 6에 Article + BreadcrumbList + FAQPage(+WebApplication) 완비. **홈·검증원칙 페이지는 0건**, Organization에 logo/sameAs/@id 없음 → High-4 | High |
| 시맨틱 헤딩 구조 | 정상 | 전 페이지 h1 정확히 1개(빌드 산출물 카운트). `<main>`(`layout.tsx:124`), `<article>`, aria-label 붙은 `<nav>` 2종. h1→h2→h3 건너뜀 없음 | — |
| 인용 가능한 콘텐츠 청킹 | 정상 | `guide.tsx:110-113`의 "한 줄 답변"이 각 가이드 최상단에 단정문을 배치. FAQ가 질문형 헤딩 + 직답 구조(`guide.tsx:259-277`). `guideJsonLd`의 answer text가 화면 문구와 동일 문자열이라 스키마-본문 불일치 없음 | — |
| 저자·최신성 신호 | 주의 | datePublished/dateModified가 마크업(`guide.tsx:64-65`)과 화면(`guide.tsx:335-341`) 양쪽에 존재 — 좋다. 그러나 저자가 익명 문자열이고 그 URL(`/verification-policy/`)에 Person 스키마도 저자 소개도 없다 → High-4 | High |
| AI 크롤러 접근 정책 | 정상 | `out/robots.txt`가 `User-Agent: *` / `Allow: /`. GPTBot·ClaudeBot·PerplexityBot·Google-Extended·CCBot 어느 것도 차단하지 않는다. 노출을 원하는 의도와 일치 | — |
| 내부 링크 구조 | 결함 | 홈에서 `/health-insurance/dependent/` 로 가는 링크 0개(빌드 산출물 카운트). `/health-insurance/`·`/health-insurance/guides/` 허브 404 → High-2, Medium-1 | High |
| llms.txt | 주의 | 없음. 아직 표준이 아니고 채택률도 제한적이라 우선순위 낮음 | Low |
| 이미지 alt / 크기 | 주의 | 콘텐츠 이미지가 없어 alt 이슈 없음. `layout.tsx:94`의 로고 img에 width/height 속성 없음(Tailwind 클래스로만 지정) → 미세 CLS 여지 | Low |
| 번들 / 블로킹 리소스 | 정상 | First Load JS 102~116KB, 웹폰트 요청 0건, 렌더 블로킹 스크립트 없음(전부 async). 정적 export라 TTFB 유리 | — |
| 페이지네이션 / 무한스크롤 | 해당 없음 | 전 콘텐츠가 단일 문서에 있다 | — |

### 가장 큰 병목 한 가지

**홈페이지가 사이트의 링크 그래프와 엔티티 그래프의 중심이 아니다.** 홈은 `/health-insurance/dependent/`로 링크를 0개 보내면서 같은 도구를 직접 렌더링해 검색 의도를 나눠 갖고, 동시에 구조화 데이터가 한 줄도 없어 "이 사이트는 무엇이고 누가 운영하는가"를 기계가 확정할 앵커가 존재하지 않는다.

이 한 가지만 고치면 — 홈에 Organization + WebSite `@graph`를 넣고 `@id`로 각 페이지의 publisher를 결합하며, 홈의 모든 `#judge` CTA를 전용 페이지 경로로 돌리면 — 최고 우선순위 페이지가 사이트에서 가장 권위 있는 페이지의 링크를 받기 시작하고, 이미 잘 만들어둔 Article/FAQPage 스키마가 실체 있는 발행자 엔티티에 붙는다. 11월 피크까지 순위를 만들어야 하는 일정에서, 콘텐츠를 한 편도 더 쓰지 않고 얻을 수 있는 가장 큰 개선이다.

---

## 가설 — 근거 부족, 추가 확인 필요

1. **임의계속가입 보수 외 소득 산식의 정확성**
   `src/lib/premium/regional.ts:218-231`은 2,000만원 초과분에 소득 종류별 **가중평균 반영률**을 곱한다(`excessIncome × (fullIncome + halfIncome×0.5) / annualIncome`). `docs/03-검증기록.md`가 시행규칙 제44조를 근거로 "초과분을 소득별 비율로 배분하고 근로·연금 50%"라고 기록하고 있어 의도적 해석으로 보인다. 다만 대안 해석(평가율을 각 소득에 먼저 적용한 뒤 2,000만원을 공제)을 쓰면 프로젝트 자체 테스트(`regional.test.ts:386-394`)의 기대값이 17,500,000원 대신 15,000,000원이 되어 보수외 보험료가 약 17% 달라진다.
   **판정 방법**: 시행규칙 제44조 원문 + 공단 모의계산 1건 대조. 확인 전까지는 `crossChecked: false`가 정직하다(Medium-2와 연결).

2. **Vercel Speed Insights 페이로드에 쿼리스트링이 포함되는가**
   `node_modules/@vercel/speed-insights/dist/index.mjs`는 원격 스크립트(`/_vercel/speed-insights/script.js`)를 주입할 뿐이라 수집 필드를 코드로 확인할 수 없다. `href`를 그대로 보낸다면 Critical-1의 유출 경로가 하나 더 늘어난다.
   **판정 방법**: 프로덕션에서 `vitals.vercel-insights.com` 요청 본문을 DevTools Network 탭에서 1회 확인. (`beforeSend` 옵션으로 URL을 잘라낼 수 있다.)

3. **GA4 데이터 스트림에 "쿼리 매개변수 제외" 설정이 되어 있는가**
   되어 있다면 Critical-1의 GA 유출은 완화된다(주소창·히스토리·공유 유출은 그대로 남는다).
   **판정 방법**: GA4 콘솔 → 데이터 스트림 → 태그 설정 구성 → URL 쿼리 매개변수 제외 목록에 income, property 존재 여부. **어느 쪽이든 코드로 강제하지 않는 방어는 설정 변경 한 번에 무너지므로 Critical-1의 수정은 그대로 필요하다.**

4. **Core Web Vitals 실측값**
   번들 102~116KB / 웹폰트 0 / 정적 export라는 조건은 유리하지만, LCP는 실제 폴백 폰트 렌더링과 히어로 레이아웃에 좌우된다. `docs/03-배포-가이드.md`가 PageSpeed Insights 확인 절차를 명시하고 있으니 그 결과 기록 여부를 확인할 것. 코드만으로는 판정 불가.

5. **`propertyScoreDetail` 60등급표의 원문 일치**
   `property-score-table.ts:94-153`(60행)을 시행령 별표 4와 1:1 대조하지 않았다. 테스트(`regional.test.ts:116-145`)는 단조증가·개수·양끝 값만 본다. 공단 모의계산 13건 통과가 간접 증거이나 그 13건이 건드리는 등급은 0/1/2/6/27/60 정도라 전 구간을 덮지 않는다.
   **판정 방법**: 별표 4 원문과 스크립트 대조.

6. **`/health-insurance/dependent/` 와 홈의 실제 색인 상태**
   MEMORY.md는 "핵심 4개 URL 수집/색인 요청 완료, 실제 색인 완료 여부는 대기 중"이라 기록한다.
   **판정 방법**: Search Console URL 검사로 어느 쪽이 대표 URL로 선택됐는지 확인. High-2의 실제 피해 규모가 정량화된다.

7. **`judgeIncome` 의 장애인 특례 분기가 사업자등록 케이스를 삼키는가**
   `src/lib/dependent/judge.ts:183-218`은 `disabled`가 true면 `businessRegistered` 검사를 아예 건너뛴다. 시행규칙 특례("사업자등록 여부와 무관하게 사업소득 500만원 이하")를 따른 것으로 보이며 `2026.ts:33-37` 주석도 그렇게 적고 있다. 다만 이 조합(`disabled && businessRegistered && business > 0 && <= 500만`)을 검증하는 테스트가 `judge.test.ts`에 있는지 전수 확인하지 못했다.
   **판정 방법**: `judge.test.ts` 전문 확인 + 공단 안내 원문 대조.

---

## 유지할 것

- `src/lib/routes.ts` 경로 레지스트리 — sitemap·OG·내부 링크·E2E가 모두 한 소스를 보므로 페이지 추가 시 누락이 구조적으로 불가능하다. 이 프로젝트에서 가장 잘 설계된 부분이다.
- `src/lib/analytics.ts:57-63`의 `EventMap` 타입 — 숫자 필드를 애초에 넣을 수 없게 타입으로 강제했다. (유출 경로가 URL이라 우회됐지만 설계 의도는 옳다.)
- `src/lib/constants/2026.ts` — 숫자 리터럴을 전부 상수로 밀어넣고, 각 값에 근거 법령과 "이걸 틀리면 무슨 일이 나는지"를 주석으로 남겼다.
- `e2e/og-meta.spec.ts:108-131` — `ready` 플래그와 실제 robots 메타의 정합성을 대조하는 테스트. 사람이 가장 자주 잊는 실수를 정확히 겨냥했다.
- `e2e/helpers.ts:16-28` `fillMoney` — 하이드레이션 경합을 재시도로 흡수하고 그 이유를 주석으로 남겨, flaky 테스트를 sleep이 아닌 조건으로 해결했다.
- `next.config.mjs:1-21` — output export가 만드는 제약 3가지를 미래의 자신을 위해 명시적으로 기록한 주석.
- `src/components/ui.tsx:103-152` `MoneyInput` — type=number를 쓰지 않은 이유 3가지와 한글 단위 되읽기. 은퇴자 대상 도구에서 오입력을 실제로 줄이는 설계다.
- `src/lib/format.ts:85-141` `josa()` — 조사 자동 처리. 사소해 보이지만 기계가 쓴 티를 없애 신뢰도를 지킨다.
- `src/lib/premium/regional.test.ts:266-301` — 공단 모의계산 13건의 입력·기대값을 코드에 고정하고 `docs/03-검증기록.md`에 원출처를 남긴 것. 이 프로젝트에서 유일하게 진짜 외부 대조인 검증이며, 다른 도구들도 이 수준을 목표로 삼아야 한다.
