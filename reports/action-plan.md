# 최종 판단 및 실행 계획

작성일 2026-08-04 · 대상 커밋 `ad73404` · 입력 `reports/critic-alpha.md`(20항목) + `reports/critic-beta.md`(21항목)
제약 **2주 / 1인 풀타임 (10 영업일)**

---

## 1. 종합 판단

두 감사관이 독립적으로 같은 결론에 도달했다 — 기술적 완성도는 개인 프로젝트 기준 상위권이고(타입체크·136 단위테스트·89 E2E 통과, 상수 단일 출처화, 검증 기록 문서화), SEO 표면과 콘텐츠 청킹은 이미 AEO 상위권이다. 그런데 **이 서비스가 유일하게 내건 자산인 "신뢰"가 걸린 두 지점에서 코드가 스스로 선언한 원칙을 어긴다.** 첫째, 판정기 → 보험료 계산기 퍼널이 사용자의 합산소득과 재산세 과세표준을 URL 쿼리스트링에 실어 보내고 GA4가 그 URL 전체를 `page_location`으로 수집한다. 개인정보처리방침은 "금액은 어떤 형태로도 서버나 분석 도구로 전달되지 않습니다"라고 단정한다. 둘째, 같은 퍼널이 그 합산소득을 전액 사업소득(반영률 100%)으로 재분류해 **은퇴자에게 최대 2배 보험료를 경고 없이 확정 표시한다** — 코드베이스가 다섯 군데에서 "이걸 놓치면 연금 수령자 보험료가 2배가 된다"고 경고해 놓고 정확히 그 실수를 저지르는 경로다. 두 결함이 같은 30줄(`DependentJudge.tsx:433` → `RegionalPremiumCalc.tsx:67-80`)에 몰려 있다.

**출시 불가 — 단, 조건은 명확하고 좁다.** 두 Blocker가 물리적으로 같은 코드 경로이며 합쳐서 0.5~1일이면 해소된다. Phase 0(1.5일)을 통과하는 즉시 **조건부 출시 가능**으로 전환된다. 나머지 전 항목은 출시를 막지 않는다.

> 렌더링 병목은 없다. `next.config.mjs:20` `output: 'export'`로 전 페이지가 정적 HTML이고 본문·FAQ·표가 JS 없이 전부 읽힌다(두 리포트 동의, 빌드 산출물 확인). 따라서 **SEO/AEO 작업의 선행 의존성이 이미 충족되어 있어 메타·JSON-LD 개선이 즉시 유효하다.** 이 프로젝트에서 가장 다행스러운 사실이다.

---

## 2. 두 리포트 대조

`✅ 일치` = 양쪽 독립 지적 / `⚠️ 한쪽만` = 코드 직접 재검증 후 판정 / `⚡ 충돌` = 심각도 불일치

| # | 이슈 | alpha | beta | 판정 | 사유 |
|---|---|---|---|---|---|
| A | 소득·재산 금액이 URL 쿼리로 이동 → GA4 수집 (방침 위반) | Critical-1 | Critical-1 | **채택 (Blocker)** ✅ | `DependentJudge.tsx:433`, `RegionalPremiumCalc.tsx:261` 직접 확인. beta는 Playwright 실측까지 재현 |
| B | 프리필이 합산소득을 `business`로 재분류 → 최대 2배 확정 표시 | **누락** | High-1 | **채택 (Blocker)** ⚠️ | `RegionalPremiumCalc.tsx:74-79` 확인. `setIncome({...emptyIncome, business: inc}); setSubmitted(true)` 분기 없음. 반영률 `2026.ts` FULL 1.0 vs HALF 0.5. **alpha가 놓친 최대 결함** |
| C | ESLint 미설치 · `verify`에 lint 없음 · CI 없음 | High-1 | High-4 | **채택 (High)** ✅ | `package.json:14,19` 확인. devDeps에 eslint 0건 |
| D | 홈·검증원칙 JSON-LD 0건, Organization 앵커 부재 | High-4 | High-3 | **채택 (High)** ✅ | `page.tsx`/`verification-policy/page.tsx` `ld+json` grep 0건. `structured-data.ts`에 헬퍼가 `breadcrumbJsonLd` 하나뿐 |
| E | 404가 canonical을 홈으로 선언 + robots 메타 중복 | High-3 | Medium-8 | **채택 (Medium)** ⚡ | `layout.tsx:18-20` `alternates.canonical: SITE.url` + `not-found.tsx:4-7`이 미덮어씀 확인. **심각도는 beta가 맞다** — `noindex`가 걸려 있어 실제 색인 피해는 제한적. 다만 공수 15분이라 Phase 0으로 당김 |
| F | 툴팁이 `<label>` 안에 있어 터치 기기에서 열리지 않음 | Low-2 (role만) | High-2 (전체) | **채택 (High)** ⚡ | `ui.tsx:50` `<label className="block">`이 `hint`(:58)를 감싼다 확인. **beta가 맞다** — alpha는 `role="img"` ARIA 문제만 보고 기능 결함을 놓쳤다. 한국 트래픽 대다수가 모바일 |
| G | 확인 모달에 포커스 트랩·복원·배경 비활성화 없음 | Medium-4 | Medium-1 | **채택 (Medium)** ✅ | `ui.tsx:321-405`. `aria-modal="true"`(:362) 선언하나 트랩 코드 없음, `autoFocus`(:388)만 존재 |
| H | `crossChecked: true` 하드코딩 + 잘못된 객체의 플래그 참조 | Medium-2 | Medium-2 | **채택 (Medium)** ✅ | `regional.ts:256-257` 무조건 true, `VoluntaryComparison.tsx:199`가 `regional.crossChecked`를 봄 — 이중 우회 확인 |
| I | sitemap `lastmod` · Article `dateModified` 전역 단일 상수 | Medium-5 | Medium-3 | **채택 (Medium)** ✅ | `sitemap.ts:21`, `guide.tsx:74` 둘 다 `SITE.lastVerified` |
| J | React 컴포넌트 단위 테스트 0개 (~1,800줄) | Medium-8 | Medium-6 | **축소 채택** ✅ | `vitest.config.ts` `include: src/**/*.test.ts`(.tsx 제외) 확인. 전면 도입은 2주에 안 들어감 → A/B/F 회귀 테스트만 |
| K | 선언한 웹폰트(Pretendard/Noto Sans KR) 미로드 | Medium-3 | Low-1 | **채택 (Low)** ⚡ | `@font-face`/`next/font` 0건 확인. **심각도는 beta가 맞다** — 폴백이 정상 동작하고 CWV엔 오히려 유리. 주석 정리만 |
| L | OG 이미지 과대(9.2MB) + 고아 `public/og.png`(624KB) | Low-1 | Low-2 | **채택 (Low)** ✅ | `grep og.png src/` 0건, `du public/og` = 9.2M 확인 |
| M | JSON-LD 인라인에 `</script>` 이스케이프 없음 | Low-3 | Low-5 | **채택 (Low)** ✅ | 현재 위험 없음(전부 저자 통제 상수). 헬퍼화로 9곳 중복 제거가 실익 |
| N | `llms.txt` 없음 | SEO표 Low | Low-6 | **기각** ✅ | 3절 참조 |
| O | 홈 → `/health-insurance/dependent/` 내부 링크 0개 | High-2 | **누락** | **채택 (High)** ⚠️ | `page.tsx:98,175,253` 전부 `#judge`, `layout.tsx` 내비도 `/#judge`. `routes.ts:41`이 priority 0.9를 준 페이지로 홈이 링크를 안 보낸다 — 재현됨 |
| P | `/health-insurance/`, `/guides/` 허브 404 | Medium-1 | **누락** | **이번 범위 밖** ⚠️ | `routes.ts`에 두 경로 없음 확인(사실). 다만 허브는 콘텐츠 작성이 따라와 M~L이고, O 수정이 같은 목적(클러스터 연결)을 더 싸게 달성 |
| Q | 보안 헤더 전무 (CSP / Referrer-Policy / nosniff) | Medium-6 | **누락** | **부분 채택** ⚠️ | `vercel.json`/`_headers` 부재, `next.config.mjs`에 `headers()` 없음 확인. **CSP는 기각**(3절), 나머지 3종만 채택 |
| R | "공개 기준 8건 대조 완료" 배지가 자체 fixture 기반 (순환 검증) | Medium-7 | **누락** | **채택 (Medium)** ⚠️ | `official-cases.test.ts:1-7`이 스스로 "공단 결과와 동일하다는 뜻은 아니다"라고 적는데 `dependent/page.tsx:94`는 "대조 완료"로 표시. 반면 `regional-premium/page.tsx:98`의 "공단 모의계산 13건"은 실제 외부 대조 — **같은 컴포넌트·같은 톤이라 구분 불가**. 이 사이트에서 브랜드 손상이 가장 큰 유형 |
| S | `anonymize_ip`는 GA4가 무시하는 UA 파라미터 | Medium-9 | **누락** | **채택 (Low)** ⚠️ | `Analytics.tsx:31-33` 확인. 결과는 우연히 참이나 주석이 거짓 안심을 준다. A와 동일 커밋 |
| T | `<Analytics />`가 `<body>` 밖 | Nit-1 | — | **기각** ⚠️ | React 19가 `<head>`로 호이스팅, 빌드 산출물 정상. alpha 스스로 Nit |
| U | 정책 3종 description 동일 | Nit-2 | SEO표 Medium | **부분 채택** | 정책 3종은 noindex라 무의미 → 기각. **홈 description 폴백은 채택**(beta SEO표) |
| V | `MoneyInput` 15자리 초과 무피드백 | Nit-3 | — | **기각** ⚠️ | 15자리 = 999조. 실사용 도달 불가 |
| W | contact noindex로 E-E-A-T 경로 단절 | — | Medium-5 | **부분 채택** ⚠️ | `routes.ts:140,148,156` noindex 확인. verification-policy(색인 대상)에 Person/AboutPage 추가는 채택, **contact noindex 해제는 이번 범위 밖** |
| X | 화면·마크업에 `<time>` 요소 0개 | — | Medium-4 | **채택 (Low)** ⚠️ | `grep "<time" src/` 0건 확인. I와 같은 커밋이면 한계비용 0 |
| Y | 개인정보처리방침이 GA4 분석 쿠키를 고지하지 않음 | — | Medium-7 | **채택 (Medium)** ⚠️ | `privacy/page.tsx:45-56` 2절 "쿠키 및 광고"가 광고 쿠키만 다룸 확인. GA4는 `_ga` 설정. A와 같은 신뢰 축 |
| Z | `inputCls` 주석이 존재하지 않는 `sm:text-sm`을 설명 | — | Low-3 | **채택 (Nit)** ⚠️ | `ui.tsx:24` 주석 vs `ui.tsx:35-38` 실제 클래스 불일치 확인. 코드가 옳고 주석이 틀렸다 |
| AA | `.pnpm-store/`가 `.gitignore`에 없음 | — | Low-4 | **채택 (Nit)** ⚠️ | `.gitignore` 전문 확인, 미포함 |
| AB | `Callout`의 `warn`/`danger` 톤이 동일 클래스 | — | Nit-1 | **채택 (Nit)** ⚠️ | `guide.tsx:181,183` 완전 동일 확인 |
| AC | 빈 `scripts/` 디렉터리 | — | Nit-2 | **기각** ⚠️ | 빈 디렉터리는 git에 없다. 로컬 아티팩트라 타인 체크아웃엔 미존재 |
| AD | README 테스트 수 불일치 (49 vs 54) | — | Nit-3 | **채택 (Nit)** ⚠️ | 손으로 관리하는 숫자는 반드시 어긋난다 |

### 대조 통계

- **일치(양쪽 독립 지적): 13건** — A, C, D, E, F, G, H, I, J, K, L, M, N
- **한쪽만: 15건** — alpha 단독 8(B 제외 O,P,Q,R,S,T,U,V) · beta 단독 8(B,W,X,Y,Z,AA,AB,AC)
- **심각도 충돌: 3건** — E(alpha High↔beta Medium, **beta 승**), F(alpha Low↔beta High, **beta 승**), K(alpha Medium↔beta Low, **beta 승**)
- **채택 24건 / 부분 채택 3건 / 기각 4건 / 이번 범위 밖 5건**

### 불일치가 몰린 영역 = 리뷰 난도가 가장 높은 지점

**`src/components/` 상호작용 레이어(`ui.tsx`, `RegionalPremiumCalc.tsx`)다.** 두 감사관 모두 이 파일들을 "전문 읽음"으로 보고했는데도 판정이 갈렸다 — alpha는 정적 분석 위주라 B(소득 재분류)를 통째로 놓치고 F를 Low로 오판했고, beta는 Playwright로 실제 브라우저에서 재현해 둘 다 잡았다. 반대로 beta는 빌드 산출물의 링크 그래프를 카운트하지 않아 O(홈 내부 링크 0)를 놓쳤다. **이 코드베이스에서 "읽어서" 잡히는 결함과 "돌려서" 잡히는 결함이 명확히 갈린다는 뜻이고, 그래서 J(컴포넌트 테스트 부재)와 C(린트 부재)가 단순 위생 문제가 아니라 실제 결함 3건의 직접 원인이다.**

> 참고: 두 리포트가 `src/components/guide.tsx`의 author/publisher를 각각 `:54-58`/`:59-63`으로 인용했으나 실제는 `:63-67`/`:68-72`다. 양쪽 모두 동일하게 9줄 어긋났다 — 사실 판정에는 영향 없으나 인용 줄번호를 그대로 믿고 편집하면 안 된다.

---

## 3. 기각 항목과 사유

| 항목 | 분류 | 사유 |
|---|---|---|
| **N. llms.txt** | 비용 대비 가치 없음 | 아직 표준이 아니고 채택률이 제한적이다. 결정적으로 **효과를 측정할 수단이 없다** — Search Console에도 Rich Results Test에도 잡히지 않고, AI 답변 인용은 귀속 추적이 불가능하다. 측정할 수 없는 개선은 계획에 넣지 않는다는 원칙에 따라 기각. 두 리포트 모두 Low로 평가한 것과도 일치한다. |
| **Q(CSP 부분)** | 맥락상 실효 없음 | JSON-LD를 9곳에서 `dangerouslySetInnerHTML`로 인라인 주입하는데 정적 export라 nonce를 발급할 수 없다. `script-src`에 `unsafe-inline`이 강제되는 CSP는 XSS 방어력이 거의 없으면서 GA/Speed Insights 도메인 관리 비용만 남긴다. **`unsafe-inline` CSP는 보안 스캐너 점수용 장식이다.** 나머지 3종(Referrer-Policy / X-Content-Type-Options / HSTS)은 부작용 0에 3줄이라 채택. |
| **T. `<Analytics />`가 `<body>` 밖** | 틀린 지적(실질) | React 19가 `<script>`를 `<head>`로 호이스팅해 빌드·런타임 모두 정상이며 `out/index.html`에서 확인된다. alpha 스스로 Nit으로 분류. 주석 한 줄이 필요하다는 주장은 타당하나 우선순위가 없다. |
| **U(정책 3종 description)** | 맥락상 불필요 | `privacy`/`terms`/`contact`가 전부 `noindex`(`routes.ts:140,148,156`)라 검색 영향이 0이다. 공유 미리보기 문구 중복은 실사용 시나리오가 없다. 반면 **홈**의 description 폴백은 색인 대상이므로 채택. |
| **V. MoneyInput 15자리 무피드백** | 비용 대비 가치 없음 | 15자리는 999조원이다. 건강보험료 계산에서 도달 불가능한 값이고, 도달했다면 그 입력 자체가 무의미하다. |
| **AC. 빈 `scripts/`** | 틀린 지적 | 빈 디렉터리는 git이 추적하지 않으므로 타인의 체크아웃에는 존재하지 않는다. 로컬 아티팩트를 저장소 결함으로 보고한 것. |

### 이번 범위 밖 (기각 아님 — 7절 참조)
P(허브 페이지), W(contact noindex 해제), J 전면 도입, K 웹폰트 self-host, 컴포넌트 테스트 스위트 확장

---

## 4. 검색·응답엔진 노출 판정

**해당됨.** 공개 도메인(`gijuncheck.kr`)의 검색 유입 중심 정보 서비스이며 `routes.ts:102` 주석과 README가 11월 검색 피크 역산을 전략으로 명시한다. B2B/사내도구가 아니므로 SEO 항목을 일괄 기각하는 판단은 여기서는 틀렸다.

**두 리포트 SEO 표를 항목별로 대조해 하나의 상태값으로 확정한다.** 상태가 갈린 3건은 빌드 산출물과 소스로 직접 확인했다.

| 항목 | alpha | beta | **확정** | 조치 | 공수 | 효과 발현 | SEO/AEO | 검증 방법 |
|---|---|---|---|---|---|---|---|---|
| 크롤러 JS 없이 본문 접근 | ✅ | ✅ | **✅** | 없음 — `output: 'export'`로 이미 충족. **모든 하위 SEO 작업의 선행 조건이 이미 참** | — | — | 둘 다 | `curl -s <url> \| grep "<h1"` |
| 페이지별 고유 title | ✅ | ✅ | **✅** | 없음 | — | — | SEO | 산출물 15개 title 유니크 카운트 |
| 페이지별 고유 description | ⚠️(정책 3종) | ⚠️(홈 포함 5개) | **⚠️** | **홈에 고유 description 부여**. 정책 3종은 noindex라 방치 | S(10분) | 수 주 | SEO | `curl \| grep 'name="description"'` |
| canonical | ⚠️ High | ⚠️ Medium | **⚠️ Medium** | `layout.tsx:18-20` `alternates` 제거 + 홈에 `createPageMetadata` 명시 | S(15분) | 수 주 | SEO | `curl out/404/index.html \| grep canonical` → 0건 |
| robots 메타 중복(404) | 지적 | 지적 | **⚠️** | `not-found.tsx`가 layout robots를 덮어쓰게 정리 | S | 즉시 | SEO | 산출물 `robots` meta 카운트 = 1 |
| sitemap 자동 생성 | ✅ | ✅ | **✅** | 없음 — `routes.ts` 파생 구조가 이 프로젝트 최고 설계 | — | — | SEO | `e2e/og-meta.spec.ts:133-146` |
| sitemap `lastmod` 페이지별 | ⚠️ | ⚠️ | **⚠️** | `RouteEntry.lastModified?` 추가 + 폴백. `guideJsonLd`의 `dateModified`도 연동 | S | 수 주 | SEO | `sitemap.xml`의 lastmod 값이 2종 이상 |
| 구조화 데이터 (JSON-LD) | ❌ High | ❌ High | **❌ High** | `organizationJsonLd()`/`websiteJsonLd()` 신설(`@id` 보유) → 홈 `@graph` 삽입 → guide `publisher`를 `{"@id"}` 참조로 교체 | M(0.75d) | 수 주~수 개월 | **둘 다** | Rich Results Test + Schema Markup Validator에서 Organization/WebSite 인식 |
| 엔티티 명확성 (E-E-A-T) | ⚠️ High | ❌ High | **❌ High** | verification-policy에 `AboutPage`+`Person` JSON-LD **및 화면상 운영자 소개 한 문단** | S | 수 개월 | **AEO 우선** | `curl verification-policy \| grep ld+json`, Schema Validator |
| `publisher.logo` 누락 | 지적 | 지적 | **❌** | `public/logo.svg`를 `ImageObject`로 연결 | S | 수 주 | SEO | Rich Results Test Article 경고 소멸 |
| 홈 내부 링크 → dependent | ❌ High | **미검출** | **❌ High** | `page.tsx:98,175,253` + `layout.tsx` 내비의 `#judge`를 실경로 링크로. **B안(홈 도구 유지 + 명시 링크 2곳) 권장** | M(0.5d) | 수 주 | SEO | 빌드 산출물 `href="/health-insurance/dependent/"` 카운트 ≥ 2 (E2E 고정) |
| 시맨틱 헤딩 구조 | ✅ | ✅ | **✅** | 없음 | — | — | 둘 다 | 산출물 h1 카운트 = 1 |
| 인용 가능한 청킹 / 한 줄 답변 | ✅ | ✅ | **✅** | 없음 — **이 사이트의 최대 강점** | — | — | **AEO 전용** | `guide.tsx:110-113` + `e2e/guide-quality.spec.ts` |
| 스키마 ↔ 본문 일치 | ✅ | ✅ | **✅** | 없음 — 동일 상수에서 생성되어 구조적으로 불일치 불가 | — | — | AEO | 기존 E2E |
| 근거·출처 링크 | (미평가) | ✅ | **✅** | 없음 | — | — | AEO | `e2e/guide-quality.spec.ts:29-38` |
| 최신성 신호 (`<time>`) | 미지적 | ⚠️ | **⚠️** | `guide.tsx:335-342` 등에 `<time dateTime>` 부여 | S | 수 개월 | **AEO 우선** | 산출물 `<time>` 카운트 > 0 |
| AI 크롤러 접근 정책 | ✅ | ✅ | **✅** | 없음 — GPTBot·ClaudeBot·PerplexityBot·Google-Extended·CCBot 전부 미차단. 노출 의도와 일치 | — | — | **AEO 전용** | `out/robots.txt` |
| OG / Twitter Card | (Low만) | ✅ | **✅** | 이미지 재압축만(L) | S | 즉시 | SEO | `e2e/og-meta.spec.ts:50-67` |
| 이미지 alt / width·height | ⚠️ Low | ⚠️ Low | **⚠️ Low** | 로고에 width/height. CSS가 잡고 있어 실제 CLS 영향 미미 | S | 즉시 | SEO | Lighthouse CLS |
| 토픽 허브 (`/guides/`) | ❌ Medium | 미지적 | **⚠️** | **이번 범위 밖** — O 수정이 같은 목적을 더 싸게 달성 | M~L | 수 개월 | SEO | — |
| contact noindex | 미지적 | ⚠️ Medium | **⚠️** | **이번 범위 밖** — 색인 정책 변경은 효과 검증에 수 개월 | S | 수 개월 | AEO | Search Console 색인 상태 |
| llms.txt | ⚠️ Low | ⚠️ Low | **기각** | 측정 수단 없음 (3절) | — | — | AEO | — |
| 페이지네이션 은닉 | 해당없음 | 해당없음 | **—** | — | — | — | — | — |
| hreflang | 미평가 | 해당없음 | **—** | 단일 언어 | — | — | — | — |

### 저비용 고효과 → Phase 0으로 당김

심각도가 Minor여도 **분 단위 공수에 색인 신호가 직접 정리되는 것**들이다.

1. **404 canonical 제거** (15분) — `layout.tsx:18-20` 3줄 삭제. soft-404 오탐 경로가 사라진다.
2. **홈 description 고유화** (10분) — 색인 대상 최상위 페이지가 폴백 문자열을 쓰고 있다.
3. **고아 `public/og.png` 삭제** (2분) — 624KB 죽은 파일. `e2e/og-meta.spec.ts:50-67`이 회귀를 즉시 잡는다.

### 선행 의존 (반드시 이 순서)

```
[이미 충족] 크롤러 본문 접근 (output: 'export')
      │
      ├─> canonical/robots 정리 (E) ──┐
      │                                ├─> 색인 정확도 확보 ──> 재크롤 요청
      └─> 내부 링크 복구 (O) ─────────┘                            │
                                                                    v
                       Organization @id 앵커 (D) ──> 구조화 데이터 인식 ──> 인용 후보 진입
                                  ^                                          ^
                                  └── time/lastmod 최신성 (I, X) ────────────┘
```

**핵심 판정: 렌더링 병목이 없으므로 D(구조화 데이터)를 뒤로 미룰 이유가 없다.** 다만 D의 효과는 크롤러가 페이지를 다시 방문해야 발현되므로, 재크롤을 앞당기는 E와 O를 같은 배포에 묶거나 먼저 내보내는 것이 이득이다. **D를 배포하고 2주 내 순위가 안 움직인다고 롤백하면 안 된다** — 엔티티 결합의 효과 발현은 `수 개월` 단위다.

---

## 5. 실행 타임라인

**가정: 1인 풀타임 10 영업일. 실작업 7.5d + 버퍼 2.5d(배포·검증·예상 밖 회귀).** 1인 프로젝트에서 버퍼 25%는 낙관이 아니라 최소치다.

---

### Phase 0 — 지혈 + 저비용 SEO (예상 1.5일)

> **출시 차단 해제가 목적이다.** 이 Phase가 끝나면 조건부 출시 가능 상태가 된다.

- [ ] **0-A. 금액 핸드오프를 URL → `sessionStorage`로 교체** — 근거 `src/components/DependentJudge.tsx:433`, `src/components/RegionalPremiumCalc.tsx:261`, `src/components/RegionalPremiumCalc.tsx:67-80` — 공수 **M (0.5d)**
  - 송신: `DependentJudge.tsx:433`의 `href`에서 쿼리 제거, `onClick`에서 `sessionStorage.setItem('gijuncheck:handoff', JSON.stringify(...))`
  - **소득 합계가 아니라 `Income` 객체 전체를 넘긴다** — 이것이 0-B를 동시에 해소한다
  - 수신: `RegionalPremiumCalc.tsx:67-80` `useEffect`에서 읽고 즉시 `removeItem`
  - `RegionalPremiumCalc.tsx:261` → `VoluntaryComparison.tsx:51-56` 경로도 동일 처리
  - **완료 기준**: 판정기 → 계산기 → 임의계속가입 전 구간에서 `page.url()`이 `/[?&](income|property)=/`에 매치되지 않는다
- [ ] **0-B. 소득 재분류 제거 (0-A에 포함)** — 근거 `src/components/RegionalPremiumCalc.tsx:74-79` — 공수 **S (0-A와 합산)**
  - 종류별 금액을 그대로 인계하므로 `{...emptyIncome, business: inc}` 분기 자체가 삭제된다
  - **`setSubmitted(true)`는 유지하되**, 인계 데이터가 종류별로 정확하므로 확정 표시가 정당해진다
  - **완료 기준**: 판정기에서 연금소득 3,000만원 입력 후 CTA 경유한 결과 금액 == 계산기에 연금 3,000만원 직접 입력한 결과 금액 (단위 테스트로 고정)
- [ ] **0-C. GA4 config 정리** — 근거 `src/components/Analytics.tsx:31-33` — 공수 **S (15분)**
  - `anonymize_ip` 제거(GA4가 무시하는 UA 파라미터, 주석이 거짓 안심을 준다)
  - `page_location: window.location.origin + window.location.pathname` 명시 — **0-A와 이중 방어**
  - **완료 기준**: config 객체에 `anonymize_ip` 없음, `page_location` 존재
- [ ] **0-D. 유출 회귀 테스트 추가** — 근거 `e2e/analytics.spec.ts:33-40`(현재 `event`만 필터해 `config`를 못 본다) — 공수 **S (0.25d)**
  - `expect(page.url()).not.toMatch(/[?&](income|property)=/)`
  - `expect(JSON.stringify(configCalls)).not.toMatch(/income=|property=/)`
  - **완료 기준**: 0-A를 되돌리면 이 테스트가 실패한다 (직접 확인할 것)
- [ ] **0-E. 404 canonical + robots 중복 제거** — 근거 `src/app/layout.tsx:18-20`, `src/app/not-found.tsx:4-7` — 공수 **S (15분)**
  - `layout.tsx`의 `alternates` 블록 삭제 → 홈은 `createPageMetadata({ path: ROUTES.home.path })` 명시
  - **완료 기준**: `out/404/index.html`에 `rel="canonical"` 0건, `name="robots"` 정확히 1건
- [ ] **0-F. 홈 description 고유화** — 근거 `src/lib/metadata.ts:34` 폴백, `src/lib/site.ts:59` — 공수 **S (10분)**
  - **완료 기준**: 홈 description ≠ `SITE.description`
- [ ] **0-G. 잡동사니 묶음** — 공수 **S (0.25d, 합계)**
  - `public/og.png` 삭제 (`grep og.png src/` 0건 확인 완료) — 근거 L
  - `.gitignore`에 `.pnpm-store/` 추가 — 근거 AA
  - `ui.tsx:21-24` + `globals.css:96-99` 주석을 실제 동작("모든 폭 16px 유지")에 맞게 수정 — 근거 Z
  - `guide.tsx:181,183` `warn`/`danger` 톤 통합 또는 실제 차등화 — 근거 AB
  - README 테스트 수 표기 제거(총계 136만 유지) — 근거 AD
  - `globals.css:35`에서 Pretendard/Noto Sans KR 제거 + "웹폰트 미사용" 결정 주석 — 근거 K
  - **완료 기준**: `npm run verify` 통과, `git status` 깨끗

**Phase 0 종료 조건**
> ① 사이트의 **어떤 경로로도** 사용자 금액이 URL·GA4·호스팅 로그에 기록되지 않는다 (E2E로 고정). ② 판정기 경유 계산 결과가 직접 입력 결과와 **정확히 일치**한다. ③ 404가 홈을 canonical로 선언하지 않는다. ④ 개인정보처리방침의 "어떤 형태로도 전달되지 않습니다"가 **코드로 참이 된다.**
> **→ 이 시점에서 출시 불가 → 조건부 출시로 전환. 배포한다.**

---

### Phase 1 — 신뢰 배선 + 접근성 + 자동화 (예상 3.5일)

> **"검증 상태를 숨기지 않는다"는 포지셔닝을 코드와 일치시키고, 다시 깨지지 않게 자동화한다.**

- [ ] **1-A. `crossChecked` 배선 정정** — 근거 `src/lib/premium/regional.ts:256-257`, `src/components/VoluntaryComparison.tsx:199`, `src/components/ui.tsx:411` — 공수 **S (0.25d)**
  - `calculateVoluntaryPremium`이 `crossChecked: false` 반환 (`docs/03-검증기록.md`의 자기 기술과 일치)
  - `VoluntaryComparison.tsx:199` → `voluntary?.crossChecked ?? regional.crossChecked`
  - `regional.test.ts:359-363`을 "구현 재확인"이 아니라 "임의계속가입은 공단 대조 전이므로 false" 단정으로 교체
  - **완료 기준**: 임의계속가입 화면에 `ReferenceOnlyNotice` 배너가 실제로 뜬다 (E2E로 확인)
- [ ] **1-B. TrustSignal 문구를 사실에 맞춤** — 근거 `src/app/health-insurance/dependent/page.tsx:94`, `src/lib/dependent/official-cases.test.ts:1-7` — 공수 **S (0.25d)**
  - "공개 기준 8건 대조 완료" → "시행규칙 기준 8건 자체 재현"
  - `TrustSignal.tsx:8`의 미사용 `tone="reference"` 적용 → **진짜 외부 대조인 `regional-premium/page.tsx:98`("공단 모의계산 13건")과 시각적으로 구분**
  - **완료 기준**: 두 배지가 화면에서 서로 다른 톤으로 보이고, `e2e/pages.spec.ts`가 문구를 고정
- [ ] **1-C. 개인정보처리방침에 GA4 분석 쿠키 고지** — 근거 `src/app/privacy/page.tsx:45-56` — 공수 **S (0.25d)**
  - 2절에 한 문장: "접속 통계를 위해 Google Analytics 4가 `_ga` 등의 분석 쿠키를 이용자 브라우저에 저장합니다. 광고 쿠키는 사용하지 않습니다."
  - **완료 기준**: 2절 본문에 "분석 쿠키" 문자열 존재. 3절과 상호 참조 정합
- [ ] **1-D. 툴팁을 `<label>` 밖으로 + 트리거를 `<button>`으로** — 근거 `src/components/ui.tsx:40-62`(Field), `src/components/ui.tsx:72-101`(InfoTooltip) — 공수 **M (1.5d)**
  - `Field`를 `htmlFor`/`useId` 방식으로 전환, `hint`를 `<label>` 바깥 형제로 이동
  - `<span tabIndex role="img">` → `<button type="button" aria-describedby={tipId}>`, 클릭 토글 + Esc 닫기(WCAG 1.4.13)
  - `ui.tsx:79`의 `typeof children === 'string'` 폴백 제거 (`aria-describedby`가 대체)
  - **3개 도구 전부 회귀 확인 필요** — 시그니처 변경 범위가 넓다
  - E2E `mobile-375` 프로젝트에 "도움말 탭 → 툴팁 opacity > 0.9" 케이스 추가
  - **완료 기준**: `mobile-375`/`mobile-390`에서 도움말 아이콘 탭 시 툴팁이 열린다. 데스크톱 hover/focus 동작 회귀 없음
- [ ] **1-E. 확인 모달을 네이티브 `<dialog showModal()>`로 교체** — 근거 `src/components/ui.tsx:321-405` — 공수 **S~M (0.5d)**
  - 포커스 트랩·Esc·배경 비활성화·backdrop이 브라우저 기본 동작으로 해결된다 (Safari 15.4+, 대상 브라우저 충족)
  - 닫힘 시 트리거로 포커스 복원
  - `e2e/keyboard-a11y.spec.ts`에 "모달 열림 상태에서 Tab 5회 → 포커스가 모달 밖으로 나가지 않는다" 추가
  - **완료 기준**: 위 E2E 통과. WCAG 2.4.3 충족
- [ ] **1-F. ESLint 도입 + `verify` 체인 + CI** — 근거 `package.json:14,19`, `.github/` 부재 — 공수 **M (0.75d)**
  - `npm i -D eslint @eslint/js typescript-eslint eslint-config-next eslint-plugin-jsx-a11y`
  - `eslint.config.mjs`(flat) — `next/core-web-vitals` + `jsx-a11y/recommended` + `react-hooks`
  - `"lint": "eslint ."`, `verify` **맨 앞**에 `npm run lint &&`
  - `.github/workflows/ci.yml` — push마다 `npm ci && npm run verify`
  - **1-D/1-E 이후에 한다** — 먼저 하면 이미 고칠 예정인 a11y 위반이 대량으로 쏟아져 노이즈가 된다
  - **완료 기준**: `npm run verify` exit 0 (lint 포함), GitHub Actions 녹색 뱃지 1회 확인
- [ ] **1-G. 축소 컴포넌트 테스트 3종** — 근거 `vitest.config.ts:5-6`(`.tsx` 제외) — 공수 **S (0.5d)**
  - jsdom 환경 프로젝트 추가 + `include`에 `.tsx`
  - ① `RegionalPremiumCalc` sessionStorage 프리필(0-B 회귀) ② `ZeroValueConfirmModal` 포커스 트랩(1-E) ③ `InfoTooltip` 노출(1-D)
  - **전면 도입은 하지 않는다** — 이번 감사에서 실제로 결함이 나온 3곳만
  - **완료 기준**: `npx vitest run` 139+ 통과

**Phase 1 종료 조건**
> ① UI가 표시하는 검증 상태가 `docs/03-검증기록.md`의 실제 상태와 **한 글자도 어긋나지 않는다.** ② 모바일에서 판정을 좌우하는 hint 4종(금융소득 1,000만원 문턱 등)에 손가락으로 도달할 수 있다. ③ `npm run verify`가 lint를 포함해 통과하고 push마다 CI가 돈다 — **사람 손에 의존하던 품질 게이트가 자동화된다.**

---

### Phase 2 — 검색·응답엔진 노출 (예상 2.5일)

> **효과 발현이 `수 주`~`수 개월`이므로 가능한 한 빨리 배포하는 것이 목적이다.** 이 Phase는 배포 시점이 곧 타이머 시작이다.

- [ ] **2-A. Organization / WebSite 엔티티 앵커 신설** — 근거 `src/lib/structured-data.ts`(헬퍼가 `breadcrumbJsonLd` 하나뿐), `src/app/page.tsx`(ld+json 0건) — 공수 **M (0.75d)** — 효과 **수 주~수 개월** — **SEO+AEO 둘 다**
  - `structured-data.ts`에 `ORG_ID = \`${SITE.url}#organization\``, `organizationJsonLd()`(`@id`/`logo`(`public/logo.svg`)/`email`/`contactPoint`), `websiteJsonLd()`(`publisher: {'@id': ORG_ID}`)
  - 홈에 `@graph` 삽입 — Organization + WebSite + 도구 3개 `ItemList` + `POPULAR_QUESTIONS`(`page.tsx:40-70`) 기반 `FAQPage`
  - `guide.tsx:68-72`의 인라인 publisher를 `{'@id': ORG_ID}` 참조로 교체 → **11개 색인 페이지가 하나의 발행 주체로 결합**
  - `dependent/page.tsx:52-57` `WebApplication`에 `url`/`description`/`provider` 추가
  - **검증**: Rich Results Test + Schema Markup Validator에서 Organization·WebSite 인식, Article `publisher.logo` 경고 소멸
- [ ] **2-B. verification-policy에 저자 엔티티 + 화면 소개** — 근거 `src/components/guide.tsx:63-67`(`author.url`이 이 페이지를 가리킴), 해당 페이지 ld+json 0건 — 공수 **S (0.5d)** — 효과 **수 개월** — **AEO 우선**
  - `AboutPage` + `Person`(ORG_ID 참조) JSON-LD
  - **화면에도** 운영자 소개 한 문단 — 무엇을 근거로 검증하는지, 연락처. 실명이 부담되면 최소 `contactPoint`와 운영 이력
  - **검증**: `curl .../verification-policy/ | grep 'ld+json'` ≥ 1, Schema Validator 통과. **E-E-A-T 체인의 끊긴 링크가 이어진다**
- [ ] **2-C. 홈 → dependent 내부 링크 복구 (B안)** — 근거 `src/app/page.tsx:98,175,253`, `src/app/layout.tsx`(내비 `/#judge`), `src/lib/routes.ts:41`(priority 0.9) — 공수 **M (0.5d)** — 효과 **수 주** — **SEO**
  - **B안 채택 사유**: A안(홈에서 도구 제거)은 홈 전환율에 직접 타격이고 2주 안에 효과를 되돌릴 수단이 없다. **되돌릴 수 없는 제품 변경을 검증 없이 하지 않는다.** B안은 링크만 추가하므로 리스크가 0에 가깝다.
  - 도구 카드(`page.tsx:253`)를 `#judge` 대신 실경로로 — 또는 카드 내 "자세한 판정 기준과 FAQ 보기" 보조 링크
  - 판정 결과 하단에 전용 페이지 링크 1개 추가
  - `e2e/links.spec.ts`에 "홈은 모든 `ready` 도구 경로로 최소 1개 링크를 가진다" 회귀 테스트
  - **검증**: `out/index.html`의 `href="/health-insurance/dependent/"` 카운트 ≥ 2 (현재 0)
- [ ] **2-D. 페이지별 `lastModified` + `<time>` 요소** — 근거 `src/app/sitemap.ts:21`, `src/components/guide.tsx:74`, `<time>` 0건 — 공수 **S (0.5d)** — 효과 **수 주(lastmod) / 수 개월(time)** — **SEO+AEO**
  - `RouteEntry`에 `lastModified?: string` → sitemap은 `route.lastModified ?? SITE.lastVerified`
  - `guideJsonLd`에 `modified` 인자 추가
  - `guide.tsx:335-342` 등 날짜 표기를 `<time dateTime={...}>`로
  - `e2e/og-meta.spec.ts:148-160`의 "전부 동일" 단정을 "ISO 날짜 + 오늘 이하"로 완화
  - **검증**: `out/sitemap.xml`의 lastmod 값이 2종 이상, 산출물 `<time>` 카운트 > 0
- [ ] **2-E. JSON-LD 직렬화 헬퍼 + 보안 헤더** — 근거 `dangerouslySetInnerHTML` 9곳, `vercel.json` 부재 — 공수 **S (0.5d)** — 효과 **즉시**
  - `structured-data.ts`에 `ldJson = (d) => JSON.stringify(d).replace(/</g, '\\u003c')` → 9곳 교체
  - `vercel.json`에 `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` — **CSP는 넣지 않는다**(3절 사유를 주석으로 명시)
  - **검증**: `curl -I <url>`에 3개 헤더 존재
- [ ] **2-F. 배포 + 색인 재요청 + 실측 기록** — 공수 **S (0.5d)** — 효과 **수 주 후 관측**
  - Search Console: 홈 + 도구 3 + verification-policy URL 검사 → 색인 재요청
  - Rich Results Test로 홈·가이드 1편·도구 1개 확인 결과를 `docs/03-검증기록.md`에 캡처 기록
  - PageSpeed Insights 1회 실행 → 결과 기록 (가설 H-8 판정에 사용)
  - **검증**: Search Console "URL이 Google에 등록되어 있음" + 색인 요청 접수 화면

**Phase 2 종료 조건**
> ① Rich Results Test에서 홈이 Organization + WebSite로 인식된다. ② 11개 색인 페이지의 `publisher`가 **단일 `@id`로 결합**된다. ③ 홈에서 최우선 페이지로 가는 링크가 존재하고 E2E가 회귀를 막는다. ④ Search Console 재크롤 요청이 접수되었다.
> **주의: 이 시점의 순위·인용 변화는 0이 정상이다. 2~8주 후 Search Console 색인 상태와 노출수로 판단하고, 그 전에 롤백하지 않는다.**

---

### 버퍼 (2.5일)

1-D(`Field` 시그니처 변경)의 회귀 범위와 1-F(ESLint 초기 위반) 규모가 가장 불확실하다. 버퍼가 남으면 7절의 P(허브 페이지)를 당긴다.

---

## 6. 의존성

```
Phase 0
  0-A(핸드오프) ──> 0-B(재분류 제거, 0-A에 흡수) ──> 0-D(회귀 E2E) ──┐
  0-C(GA4 config) ─────────────────────────────────────────────────┤
  0-E(404 canonical) ──────────────────────────────────────────────┼──> [배포 #1: 출시 차단 해제]
  0-F(홈 description) ─────────────────────────────────────────────┤
  0-G(잡동사니) ───────────────────────────────────────────────────┘

Phase 1
  1-A(crossChecked) ─┐
  1-B(TrustSignal)  ─┼──> [신뢰 배선 정합]
  1-C(쿠키 고지)     ─┘
  1-D(툴팁) ──┐
  1-E(모달) ──┼──> 1-F(ESLint/CI) ──> [배포 #2: 자동화된 품질 게이트]
              └──> 1-G(컴포넌트 테스트 3종)
                      ^
  0-B ────────────────┘   (프리필 회귀 테스트는 0-B 구현에 의존)

Phase 2
  2-A(Organization @id) ──> 2-B(Person/AboutPage)   [2-B는 ORG_ID 참조라 2-A 선행 필수]
  2-A ────────────────────> 2-D(dateModified 연동)   [guideJsonLd 동시 수정이라 충돌 방지]
  2-C(내부 링크) ─── 독립 ───┐
  2-E(ldJson/헤더) ── 독립 ──┼──> 2-F(배포 + 색인 재요청) ──> [수 주 후 관측]
  2-A, 2-B, 2-D ────────────┘
```

**병렬 가능 (컨텍스트 스위칭 비용을 감수한다면)**
- Phase 0 내부: `0-E` / `0-F` / `0-G`는 `0-A`와 파일이 겹치지 않는다 → 0-A 대기 중 처리 가능
- Phase 1 내부: `1-A`/`1-B`/`1-C`(신뢰 문구 3종)는 `1-D`/`1-E`(컴포넌트)와 완전 독립
- Phase 2 내부: `2-C`(링크)와 `2-E`(헤더)는 `2-A`~`2-D`(JSON-LD)와 독립

**직렬 강제 (순서를 바꾸면 손해)**
- `1-D`, `1-E` → `1-F`: ESLint를 먼저 켜면 곧 고칠 a11y 위반이 대량 검출되어 노이즈만 생긴다
- `2-A` → `2-B`, `2-D`: `ORG_ID`와 `guideJsonLd` 시그니처가 선행 정의되어야 한다
- `0-B` → `1-G`: 프리필 회귀 테스트는 새 구현을 대상으로 써야 한다

---

## 7. 이번 범위에서 제외

2주 1인 예산에 안 들어간다. **기각이 아니라 연기다** — 다음 사이클 첫 후보.

| 항목 | 출처 | 왜 이번엔 안 하는가 | 재개 조건 |
|---|---|---|---|
| **`/health-insurance/guides/` 토픽 허브 신설** | alpha Medium-1 | 페이지 자체는 반나절이지만 허브 콘텐츠(6편 요약·클러스터 설명)를 쓰는 비용이 붙어 M~L. **2-C(내부 링크)가 클러스터 연결이라는 같은 목적을 1/3 비용으로 달성**하므로 우선순위가 밀린다 | 가이드가 10편을 넘어갈 때. 또는 Phase 2 버퍼가 남을 때 |
| **`/health-insurance/` 301 리다이렉트** | alpha Medium-1 | 정적 export라 `vercel.json` redirects가 필요. 2-E에서 `vercel.json`을 만들므로 **한계비용이 낮아진다** — 버퍼가 남으면 2-E에 끼워 넣을 것 | 2-E 작업 중 여유 시 |
| **contact 페이지 noindex 해제 + ContactPage 스키마** | beta Medium-5 | 색인 정책 변경은 효과 검증에 수 개월이 걸리고, 2-A/2-B로 Organization `contactPoint`가 이미 확보되므로 **엔티티 신호의 대부분을 색인 없이 얻는다.** 한계 이득이 작다 | 2-A 배포 후 8주 시점의 Search Console 엔티티 인식 상태를 보고 판단 |
| **컴포넌트 테스트 전면 도입 (~1,800줄)** | alpha Medium-8 / beta Medium-6 | 1-G에서 실제 결함이 나온 3곳만 덮는다. 나머지는 E2E 89케이스가 커버 중이고, 전면 도입은 1인 프로젝트에서 유지비가 이득을 넘는다 | 결함이 컴포넌트 레이어에서 2건 더 나올 때 |
| **웹폰트 self-host (Pretendard subset)** | alpha Medium-3 / beta Low-1 | 0-G에서 **"웹폰트 미사용" 결정을 명시**하는 것으로 종결한다. 실제 self-host는 CWV를 나쁘게 만들고(현재 웹폰트 요청 0건) 디자인 이득이 검증되지 않았다 | 디자인 리뷰에서 폴백 렌더링이 문제로 확인될 때 |
| **CSP 도입** | alpha Medium-6 | 3절 기각 사유 참조. `unsafe-inline`이 강제되는 CSP는 장식이다 | JSON-LD 주입을 빌드 타임 정적 파일로 분리하거나, `output: 'export'`를 걷어낼 때 |
| **llms.txt** | alpha SEO표 / beta Low-6 | 3절 기각 사유 참조 (측정 불가) | 표준화되고 Search Console급 측정 수단이 생길 때 |
| **OG 이미지 재압축 (13장, 9.2MB)** | alpha Low-1 / beta Low-2 | 고아 `og.png` 삭제(0-G)만 하고 재압축은 미룬다. 렌더 경로 밖이라 CWV 영향 0이고, 13장 재인코딩 + 품질 육안 확인에 반나절이 든다 | 카카오톡 미리보기 실패가 실제로 보고될 때 |
| **로고 width/height 속성** | 양쪽 SEO표 Low | CSS(`h-9 w-9`)가 렌더 블로킹으로 먼저 잡으므로 실제 CLS 영향이 측정 한계 이하 | Lighthouse CLS가 0.1을 넘을 때 |

---

## 8. 가설 — 실행 항목 아님 (판정 후 별도 처리)

> **이 절의 항목은 코드만으로 판정할 수 없다. 위 타임라인과 섞지 않는다.** alpha 7건 + beta 6건 = 13건에서 중복 3건을 제거해 **10건**이다.
> **⛔ 표시 항목은 법령 원문 확인 전까지 코드를 수정하지 않는다.** 두 감사관 모두 "구현이 틀렸다"가 아니라 "확인하지 못했다"고 적었다. 근거 없는 수정은 현재 통과 중인 136개 테스트의 기대값을 훼손할 뿐이다.

| # | 가설 | 출처 | 무엇을 확인하면 판정되는가 | 확인 비용 | 처리 |
|---|---|---|---|---|---|
| **H-1** ⛔ | **보수 외 소득 안분 산식** — `regional.ts:218-231`이 2,000만원 초과분에 소득 종류별 **가중평균 반영률**을 곱한다. 대안 해석(평가율 선적용 후 2,000만원 공제)을 쓰면 `regional.test.ts:386-394` 기대값이 17,500,000 → 15,000,000으로 바뀌고 **보수외 보험료가 약 17% 달라진다** | alpha 가설1 | ① 국민건강보험법 시행규칙 **제44조 원문**(law.go.kr) ② 공단 모의계산 1건(보수외 소득 있는 케이스) 대조 | 0.5d (법령 열람 + 공단 계산 1회) | **⛔ 코드 수정 금지.** 확인 전까지 `crossChecked: false`(1-A)가 정직한 상태다 — 1-A가 이 가설의 임시 방어책 역할을 한다 |
| **H-2** ⛔ | **`applyLimit` 하한 적용 순서** — `regional.ts:123-143`이 하한(20,160원)을 **소득보험료에만** 적용하고 재산보험료를 그 위에 더한다. 고시는 **월별 총액**에 하한을 건다고 읽힌다. 재산 1억·소득 0원에서 20,160 vs 24,810으로 갈린다 | beta 가설1 | 「월별 건강보험료액의 상한과 하한에 관한 고시」 2026년판 원문. 또는 공단 모의계산 화면 캡처 1건(저소득·재산 보유 케이스) | 0.25d | **⛔ 코드 수정 금지.** `docs/03-검증기록.md` C05가 구현과 일치하나 **공단 열과 기준체크 열이 같은 값이고 원본 캡처가 저장소에 없다** — 순환 검증 가능성 |
| **H-3** ⛔ | **임의계속가입에 지역가입자 하한 적용** — `regional.ts:233`이 `PREMIUM_LIMIT.LOWER`(주석에 "지역가입자")를 직장 성격 계산에 쓴다. 상한은 직장용을 따로 쓰면서 하한만 공유 | beta 가설2 | 2026년 고시 원문의 **직장가입자 하한 조항**. 단일값이면 문제 없음 | 0.25d (H-2와 동일 문서) | **⛔ H-2와 묶어서 처리** |
| **H-4** ⛔ | **`judgeSupport` 비동거 직계비속 분기** — `judge.ts:104-128`이 **미혼이기만 하면 부양 인정**한다. 공단 안내에 "부모가 없거나 요건 미충족" 추가 조건이 있다면 **탈락자를 인정으로 판정**한다 | beta 가설3 | 국민건강보험법 시행규칙 **별표 1**의 직계비속 항목 원문. `official-cases.test.ts:66-74`는 "비동거·기혼"만 다뤄 판별 불가 | 0.25d | **⛔ 코드 수정 금지.** 다만 **가장 위험한 방향의 오류**(거짓 인정)이므로 H-1보다 먼저 확인할 것 |
| **H-5** ⛔ | **`propertyScoreDetail` 60등급표 원문 일치** — `property-score-table.ts:94-153` 60행을 시행령 별표 4와 1:1 대조하지 않았다. 테스트는 단조증가·개수·양끝만 본다. 공단 13건이 건드리는 등급은 0/1/2/6/27/60 정도 | alpha 가설5 | 시행령 별표 4 원문과 스크립트 대조 (60행 diff) | 0.5d | **⛔ 코드 수정 금지.** 대조 스크립트를 짜서 `docs/`에 결과 기록 |
| **H-6** | **`judgeIncome` 장애인 특례가 사업자등록 케이스를 삼키는가** — `judge.ts:183-218`이 `disabled === true`면 `businessRegistered` 검사를 건너뛴다 | alpha 가설7 | `judge.test.ts` 전문에서 `disabled && businessRegistered && 0 < business ≤ 500만` 조합 테스트 존재 여부 확인 + 공단 안내 원문 | **0.1d (테스트 파일 grep — 가장 싸다)** | **먼저 처리.** 테스트가 없으면 추가만 하면 되고, 코드 변경은 원문 확인 후 |
| **H-7** | **GA4 데이터 스트림의 쿼리 파라미터 제외 설정** | alpha 가설3 = beta 가설5 | GA4 관리 > 데이터 스트림 > 태그 설정 > "URL 쿼리 매개변수 제외" | 0.1d | **⚠️ Phase 0(0-A)으로 무효화된다.** URL에 금액이 실리지 않으므로 콘솔 설정과 무관해진다. **확인할 필요 없음 — 다만 설정에 의존하는 방어를 코드로 대체했다는 사실을 `docs/`에 기록할 것** |
| **H-8** | **Vercel Speed Insights 페이로드에 쿼리스트링 포함 여부** | alpha 가설2 | 프로덕션 DevTools Network에서 `vitals.vercel-insights.com` 요청 본문 1회 확인 | 0.1d | **⚠️ Phase 0(0-A)으로 무효화된다.** 같은 이유 — URL에 금액이 없으면 무엇을 보내든 유출이 아니다 |
| **H-9** | **Core Web Vitals 실측** — 번들 102~116KB / 웹폰트 0 / 정적 export는 유리하나 **추정이다** | alpha 가설4 = beta 가설4 | PageSpeed Insights 필드 데이터 또는 `layout.tsx:65` SpeedInsights 누적치 | 0.1d | **2-F에 포함** (배포 후 1회 실행·기록) |
| **H-10** | **실제 색인 상태 및 선택된 대표 URL** — MEMORY.md는 "색인 요청 완료, 결과 대기" | alpha 가설6 = beta 가설6 | Search Console URL 검사 + 네이버 서치어드바이저 수집 현황 | 0.2d | **2-F에 포함.** 2-C(내부 링크)의 실제 피해 규모가 여기서 정량화된다 |

**가설 처리 순서 권고**: H-6(0.1d, 가장 싸고 위험 방향이 나쁨) → H-4(거짓 인정 위험) → H-2+H-3(같은 문서) → H-1 → H-5. **총 1.9일** — 2주 타임라인에는 넣지 않는다. Phase 2 완료 후 별도 세션에서 법령 원문을 한 번에 열람하는 것이 효율적이다.

---

## 9. 리스크와 가정

### 세운 가정

1. **인원 1명 풀타임, 10 영업일.** 실작업 7.5d + 버퍼 2.5d. 1인 프로젝트에서 리뷰어가 없으므로 자기 검증 시간을 각 항목 공수에 이미 포함시켰다.
2. **프로덕션 배포는 Vercel.** `.gitignore`의 `.vercel`과 `@vercel/speed-insights` 사용에서 추론. 2-E의 `vercel.json`이 이 가정에 의존한다 — 다른 호스팅이면 `_headers`/`netlify.toml`로 대체해야 한다.
3. **GA4는 이미 프로덕션에서 가동 중이다.** MEMORY.md "GA4 Production 연결 및 핵심 이벤트 실시간 확인 완료" 기록에 근거. **이 가정이 참이므로 0-A가 이론적 위험이 아니라 진행 중인 유출이다.** 거짓이라면 심각도는 Critical → High로 내려가지만 수정 필요성은 동일하다.
4. **`docs/03-검증기록.md`의 공단 모의계산 13건(C01~C13)은 실제 외부 대조다.** beta가 H-2에서 "공단 열과 기준체크 열이 같은 값이고 원본 캡처가 없다"고 의심했다 — **이 가정이 깨지면 프로젝트의 유일한 진짜 외부 검증이 사라지고 1-B의 TrustSignal 정정 범위가 `regional-premium`까지 확대된다.**
5. **11월 검색 피크가 여전히 유효한 목표다.** 오늘이 8월 4일이므로 Phase 2 배포 후 색인·엔티티 인식에 약 3개월이 남는다 — **빠듯하지만 가능한 창이다.** 이것이 Phase 2를 2주 안에 밀어 넣은 이유다.

### 계획이 깨질 수 있는 지점

| 리스크 | 확률 | 영향 | 완화 |
|---|---|---|---|
| **1-D(`Field` 시그니처 변경)의 회귀 범위가 예상 초과** | 중 | 1.5d → 3d | 3개 도구 전부가 `Field`를 쓴다. **`Field`를 바꾸지 말고 `hint`만 형제로 빼는 최소 변경으로 축소**하는 폴백 안을 준비. 버퍼 2.5d의 1순위 소비처 |
| **1-F ESLint 초기 위반이 수백 건** | 중 | 0.75d → 2d | `jsx-a11y`를 처음부터 `error`로 켜지 말 것. **1차는 `warn`으로 도입해 CI를 녹색으로 만들고**, 위반 정리는 이번 범위 밖으로 넘긴다. "린트가 돈다"는 상태 확보가 목적이다 |
| **0-A `sessionStorage` 핸드오프가 iOS Safari 프라이빗 모드에서 실패** | 저 | 퍼널 단절 | `try/catch` + 실패 시 프리필 없이 계산기만 여는 graceful degradation. **쿼리스트링으로 되돌리지 말 것** — 그게 원래 결함이다 |
| **H-1/H-2/H-4가 실제 오류로 판명** | 중 | 계산 결과 변경 → 신뢰 타격 | 이번 2주에 **손대지 않는 것**이 완화책이다. 1-A(`crossChecked: false`)가 "아직 대조 전"이라는 정직한 상태를 UI에 노출하므로, 나중에 값이 바뀌어도 "숨겼다"는 비난을 받지 않는다 |
| **2-A~2-D의 효과가 2주 내 관측되지 않음** | **높음 (거의 확실)** | 조급한 롤백 | **의도된 결과다.** 색인·재크롤에 수 주, 엔티티 결합 인식에 수 개월이 걸린다. Phase 2 종료 조건을 "순위 상승"이 아니라 **"Rich Results Test 통과 + 색인 요청 접수"** 같은 즉시 관측 가능한 조건으로 정의한 이유다. **최소 8주 관측 후 판단** |
| **`docs/03-검증기록.md`가 순환 검증으로 판명 (가정 4 붕괴)** | 저~중 | 1-B 범위 확대, 브랜드 리스크 | H-2 확인 시 함께 검토. 공단 모의계산 원본 캡처를 저장소에 남기는 습관을 지금 시작할 것 |

### 미확인 영역 (이번 감사의 사각지대 — 두 리포트 공통)

- 가이드 6편 본문의 **법률적 정확성** (alpha 1편, beta 1편만 정독)
- 프로덕션 도메인의 실제 응답·색인 상태·CWV 실측 (H-9, H-10)
- 실제 스크린리더(NVDA/VoiceOver) 동작 — 1-D/1-E는 코드·자동화 테스트 수준까지만 검증된다
- Playwright WebKit/tablet 프로젝트 (alpha는 desktop-1440만 실행)
- `docs/` 40여 개 문서 전수

**이 사각지대는 2주 안에 해소되지 않는다.** 가이드 본문의 법률적 정확성은 이 서비스의 핵심 리스크인데 두 감사관 모두 확인하지 못했다 — **다음 사이클의 1순위 항목으로 명시해 둔다.**
