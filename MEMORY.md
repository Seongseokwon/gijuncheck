# 기준체크 작업 인계 메모

최종 갱신: 2026-08-04

이 파일은 다른 세션에서 기준체크 작업을 이어갈 때 먼저 읽는 현재 상태 메모다. 법령·보험료율·공단 안내는 변경될 수 있으므로, 실제 기준을 수정할 때는 반드시 공식 출처와 `docs/03-검증기록.md`를 함께 확인한다.

## 프로젝트 한눈에 보기

- 서비스: 기준체크 — 건강보험 피부양자 자격과 퇴직 후 보험료 선택을 확인하는 민간 참고 도구
- Production: `https://gijuncheck.kr`
- 임시 Vercel 주소: 최종 도메인으로 리다이렉트되도록 설정됨
- 기술: Next.js 15 App Router, TypeScript, Tailwind, `output: 'export'`, 정적 SSG
- Node: `>=20.9.0`
- 주요 경로 레지스트리: `src/lib/routes.ts`
- 공식 출처·기준 수치: `src/lib/constants/2026.ts`, `src/lib/dependent/sources.ts`, 관련 가이드

## 현재 완료 상태

- P0 공개 기반·출처·책임 범위 완료
- P1 검색 등록·색인 요청, GA4 연결, 가이드 품질, 피부양자 차별화, 증빙·신청 체크리스트 완료
- P2-1 지역보험료 계산기 공단 모의계산 13건 재대조 완료(2026-08-05). 공단 입력 구조와 일치하도록 지역보험료 금융소득은 전액 반영하고 `VERIFIED_AGAINST_NHIS = true`로 갱신했다.
- P2-2 임의계속가입 비교의 현행 법령·공단 안내·보험료 고시·대표 사례 대조 완료
- Google Search Console과 네이버 서치어드바이저 등록·sitemap 제출·핵심 4개 URL 수집/색인 요청 완료. 2026-08-05 GSC 실측 결과 공개·색인 대상 11개는 전부 색인되었고, 정책 3개는 의도한 `noindex` 제외, 준비 중 2개는 `ready: false`로 sitemap·공개 허브에서 제외된 상태다. 네이버 결과는 확인 중
- GA4 Production 연결 및 핵심 이벤트 실시간 확인 완료
- `@vercel/speed-insights`를 `src/app/layout.tsx`에 추가하고 Production 배포 완료. 실제 데이터 누적은 Vercel에서 운영 확인 필요
- 0원 입력 항목 확인 모달 추가 완료. 0원은 오류로 막지 않고, 입력 수정 또는 확인 후 판정 진행
- 0원 모달은 `createPortal`로 `document.body`에 렌더링하며 `fixed inset-0`, `z-[100]`, 중앙 정렬, `backdrop-blur-sm`을 사용한다. 최신 배포 후 헤더까지 backdrop이 덮이고 모달이 중앙에 표시되는 것을 사용자 확인
- 세 도구 상단에 기준연도·최종 확인일·검증 범위를 표시하는 `TrustSignal`을 추가했고, 피부양자 결과 상단에서 확인 자료·공단 문의 질문으로 바로 이동할 수 있게 했다.
- 모바일 주요 메뉴, FAQ 앵커, 홈 인기 질문 링크, 문맥 부자연스러운 안내 문구 정비 완료
- 2026-08-04 SEO P0: 페이지별 canonical과 `og:url`이 자기 URL을 사용하도록 metadata 공통
  생성 함수를 추가했다. 가이드는 OG type `article`, 도구·검증·정책 페이지는 `website`로
  구분하며 title·description·Twitter metadata도 페이지별로 생성한다.
- 2026-08-04 SEO P0: `src/app/sitemap.ts`의 빌드 시각 기반 `lastmod`를 제거하고
  경로별 실제 콘텐츠·기준 변경일을 `ROUTES[*].lastModified`로 관리하도록 안정화했다.
  페이지 내용이나 기준이 바뀐 경로의 날짜만 `src/lib/routes.ts`에서 갱신한다.
- 2026-08-04 SEO P1: 가이드 Article JSON-LD에 `author`·`publisher`·`image`를 추가하고,
  가이드 6편과 도구 3개에 `BreadcrumbList`를 추가했다. FAQPage는 화면에 실제 표시되는
  FAQ를 설명하는 보조 데이터로 유지하며 일반 사이트의 FAQ 리치 결과 노출을 전제로 하지 않는다.
- 2026-08-04 SEO P2: 홈·도구·가이드·검증·정책 14개 페이지에 전용 정적 OG PNG를 추가했다.
  `src/lib/routes.ts`가 이미지 경로를 관리하고 `src/lib/metadata.ts`와 가이드 Article image가
  같은 경로를 사용한다. `public/logo.svg`는 기존 `public/og.png`의 둥근 맞물림 로고 스타일을
  기준으로 헤더·favicon·OG 카드에 통일 적용했다. 홈을 포함한 14개 OG 카드는 ImageGen으로
  각각 생성해 `public/og/`와 `public/og.png`에 1200×630으로 저장했다.
- 2026-08-04 저비용 SEO 3단계 완료: 홈 고유 description, 404 canonical 제거, 공개·정책
  페이지 canonical 자기 URL 회귀 검사, 경로별 sitemap `lastModified`, 가이드 발행일·최종
  확인일 `<time dateTime>`을 반영했다. 관련 구현은 `src/app/page.tsx`, `src/app/not-found.tsx`,
  `src/app/sitemap.ts`, `src/lib/routes.ts`, `src/components/guide.tsx`와
  `e2e/og-meta.spec.ts`, `e2e/guide-quality.spec.ts`에 있다.
- 2026-08-04 GEO·AEO 엔티티 보강 4단계 코드 작업 완료: `src/app/layout.tsx`에서 공통
  `Organization`·`WebSite` JSON-LD를 제공하고, 가이드 Article publisher를
  `https://gijuncheck.kr#organization`으로 연결했다. `verification-policy`에는
  `AboutPage`·운영자 `Person`을 추가했으며, 홈에는 피부양자 전용 페이지 명시 링크를 추가했다.
  로컬 타입 검사·빌드·관련 E2E는 통과했고, Production 배포 후 Rich Results Test·Search
  Console·PageSpeed 결과 기록은 아직 작성하지 않았다.
- 2026-08-04 품질·유지보수 정리: ESLint 9와 Next.js 접근성 규칙을 `eslint.config.mjs`에
  추가하고 `npm run verify`의 첫 단계로 `npm run lint`를 연결했다. lint는 오류 0개·경고
  3개로 통과한다. 공통 헤더 내부 링크는 `next/link`로 전환했고, 임의계속가입 가이드의
  문장부호를 정리했다.
- 2026-08-04 코드 비평 결과와 2주 실행계획을 기록하고, 재사용 가능한 비평 에이전트 정의를
  `.claude/agents/`에 추가했다. **2026-08-05 정리로 리포트는
  `docs/archive/reviews/review-1/`(1차)·`review-2/`(2차)로 이동했다.**
  감사 당시의 스냅샷이므로 현재 코드 상태와 대조해 다음 작업을 선택한다.
- 2026-08-05 `action-plan.md` 1-F 후반부: `.github/workflows/ci.yml`을 추가해 push/PR마다
  lint → typecheck → 단위테스트 → build → Playwright(chromium·webkit) 순으로 `npm run verify`에
  해당하는 단계를 실행한다. 실패 시 `playwright-report`를 아티팩트로 업로드한다.
- 2026-08-05 `action-plan.md` Phase 2 마무리:
  - 2-C 홈 내부 링크: `src/app/page.tsx`의 `#judge` 섹션 사이드바에 피부양자 전용 페이지
    (`/health-insurance/dependent/`) 실경로 링크를 추가했다. 도구 카드는 기존 `#judge` 스크롤
    동작을 유지해 전환 리스크를 만들지 않았다(action-plan B안). `e2e/links.spec.ts`에 홈이
    이 경로로 실경로 링크를 2개 이상 갖는지 확인하는 회귀 테스트를 추가했다.
  - 2-E JSON-LD 이스케이프: `src/lib/structured-data.ts`에 `ldJson()` 헬퍼(꺾쇠괄호 여는
    문자를 유니코드 이스케이프로 치환)를 추가하고 `dangerouslySetInnerHTML`을 쓰는 곳
    전부를 `JSON.stringify` 대신 이 헬퍼로 교체했다.
    **2026-08-06 정정: 실제 개수는 11곳이 아니라 12곳이다**(레이아웃·**홈**·도구 3개·
    검증 원칙·가이드 6편). 기존 기록에서 홈이 누락돼 있었다. 12곳 전부 `ldJson()` 경유를 확인했다.
  - 2-E 보안 헤더: `output: 'export'`라 `next.config.mjs`의 `headers()`를 쓸 수 없어
    `vercel.json`의 Vercel 엣지 설정으로 대체했다.

    > **2026-08-06 정정.** 이 문단은 원래 "CSP는 의도적으로 넣지 않았다"고 적혀 있었으나
    > **실제 `vercel.json`에는 CSP가 있다.** 문서가 코드보다 낡았던 경우다
    > (`VERIFIED_AGAINST_NHIS` 때와 같은 종류의 드리프트). 아래는 실제 파일 기준이다.

    현재 `vercel.json`이 모든 경로(`/(.*)`)에 보내는 헤더 6개:

    | 헤더 | 값 요약 |
    |---|---|
    | `Referrer-Policy` | `strict-origin-when-cross-origin` |
    | `X-Content-Type-Options` | `nosniff` |
    | `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
    | `Content-Security-Policy` | 아래 주의사항 참조 |
    | `X-Frame-Options` | `DENY` |
    | `Permissions-Policy` | `camera=() microphone=() geolocation=()` |

    **CSP에서 주의할 것 세 가지.**

    1. `script-src`에 `'unsafe-inline'`이 들어 있다. JSON-LD를 `dangerouslySetInnerHTML`로
       **12곳**(레이아웃·홈·도구 3개·검증 원칙·가이드 6편)에 인라인 주입하는 구조상
       불가피하다. **XSS 방어력은 제한적이라고 봐야 한다.**
       12곳 전부 `src/lib/structured-data.ts`의 `ldJson()`을 경유하는 것을 2026-08-06 확인했다.
    2. 허용된 외부 출처는 GTM·Vercel 스크립트, GA4·Vercel Insights 연결에 더해
       **2026-08-06부터 애드센스 출처가 선반영되어 있다.** 애드센스 스크립트를 아직
       넣지 않았지만 CSP만 미리 열어 둔 상태다(붙일 때 조용히 차단되는 사고를 막기 위함).
       - `script-src` 추가: `pagead2.googlesyndication.com`, `partner.googleadservices.com`,
         `tpc.googlesyndication.com`, `googleads.g.doubleclick.net`, `adservice.google.com`
       - `connect-src` 추가: `pagead2.googlesyndication.com`, `googleads.g.doubleclick.net`,
         `ep1.adtrafficquality.google`, `ep2.adtrafficquality.google`
       - `frame-src` 신설: `'self'`, `googleads.g.doubleclick.net`,
         `tpc.googlesyndication.com`, `www.google.com`
         (기존에는 `frame-src`가 없어 `default-src 'self'`로 폴백됐다. 지시어를 새로
         만들었으므로 `'self'`를 명시해 동일 출처 iframe 회귀를 막았다.)
       - `img-src`는 이미 `https:`라 추가 불필요.
       **아직 열려 있지 않은 것:** `form-action`은 여전히 `'none'`이다(아래 3번).
       또 다른 외부 스크립트를 붙일 때는 같은 절차를 반복한다.
    3. **`form-action 'none'`이 있다.** 지금은 폼이 없어 무해하지만, 문의 폼 등
       어떤 형태든 form 제출을 붙이는 순간 차단된다. 채널 확장을 검토할 때 함께 본다.

    **HSTS 부작용:** `preload`가 있어 한 번 https를 방문한 브라우저는 서버에 묻지 않고
    http를 https로 올린다. **리다이렉트 동작을 브라우저로 검증할 수 없다**는 뜻이다.
    반드시 `curl -I`로 확인한다 (`docs/08` 색인 절차 함정 ②).
  - 로컬 `npm run lint`·`npm run typecheck`·`npm test`(최신 실행 146개)·`npm run build`·
    `npx playwright test --project=desktop-1440`(관련 스펙 40개) 전부 통과 확인.
    Phase 2 2-F(배포 후 Rich Results Test·Search Console 재크롤 기록)는 아직 남아 있다.

## 검증 기준선

최근 `npm run verify` 결과:

- `npm run typecheck`: 통과
- `npm test`: 7개 파일, 146개 통과
- `npm run build`: 통과
- 페이지별 OG metadata·sitemap E2E: 6개 통과, 12개 의도적 스킵
- 구조화 데이터 E2E: 1개 통과, 2개 의도적 스킵
- `npx playwright test`: 300개 중 261개 통과, 39개 스킵, 0개 실패

0원 모달 관련 E2E는 `e2e/dependent-judge.spec.ts`에 있다. 모달 표시 순서, 수정/확인 동작, 전체 viewport backdrop, 중앙 정렬, blur를 확인한다. Vercel Speed Insights 요청은 `e2e/pages.spec.ts`에서 로컬 모킹한다.

## 중요한 코드 위치

- 공통 레이아웃·canonical·OG·robots·네이버 소유확인·GA4·Speed Insights: `src/app/layout.tsx`
- 페이지별 OG metadata 생성: `src/lib/metadata.ts`
- 페이지별 OG 경로: `src/lib/routes.ts`; 정적 카드·사이트 로고: `public/og/`, `public/logo.svg`
- sitemap 생성과 안정적인 `lastmod`: `src/app/sitemap.ts`, `src/lib/routes.ts`의 경로별 `lastModified`
- 구조화 데이터: `src/lib/structured-data.ts`, `src/app/layout.tsx`, `src/components/guide.tsx`,
  `src/app/verification-policy/page.tsx`
- 품질 게이트: `eslint.config.mjs`, `package.json`의 `lint`·`verify` 스크립트
- 0원 확인 모달: `src/components/ui.tsx`의 `ZeroValueConfirmModal`
- 판정 제출 흐름: `src/components/DependentJudge.tsx`
- 이벤트 이름·허용 파라미터: `src/lib/analytics.ts`
- 공개 여부와 sitemap 대상: `src/lib/routes.ts`
- 지역보험료 산식: `src/lib/premium/regional.ts`
- 피부양자 판정 산식: `src/lib/dependent/judge.ts`
- 공식 대조 사례와 운영 상태: `docs/03-검증기록.md`
- **현재 전략·실행 순서: `docs/09-A안-90일-실행계획.md`** (단일 출처)
- 운영 루틴·완료 이력: `docs/02-다음작업-타임라인.md` / 경쟁 포지셔닝: `docs/04-실행-우선순위.md`
- 경쟁 분석 원본: `reports/기준체크_경쟁분석_리포트.md`
- 시점 기록(현재 기준 아님): `docs/archive/README.md`
- 자동 QA와 외부 수동 확인: `docs/06-QA-전수점검.md`

## 분석·개인정보 원칙

- GA4 이벤트에는 원본 소득·재산·나이·개인 입력값을 넣지 않는다.
- 집계용 이벤트만 허용한다: `home_cta_click`, `judge_start`, `judge_complete`, `premium_calculate`, `voluntary_compare`.
- 판정 입력값은 브라우저에서만 처리하고 서버·분석 도구로 전송하지 않는다. 도구 간 이동 때만
  같은 탭 `sessionStorage`를 잠시 사용하고 수신 직후 삭제한다.
- 정책 문구와 실제 코드가 달라지면 코드·개인정보처리방침·검증기록을 함께 갱신한다.

## 2026-08-04 1단계 핫픽스

- 판정기 → 지역보험료 → 임의계속가입 퍼널의 금액을 URL 쿼리가 아닌
  `src/lib/premium-handoff.ts`의 같은 탭 `sessionStorage`로 일시 전달한다.
- 판정기의 소득 종류별 `Income` 객체를 그대로 보존해 연금·근로소득이 사업소득으로
  재분류되지 않도록 했다. 수신 페이지는 핸드오프를 즉시 삭제한다.
- GA4 `page_location`은 pathname만 전달한다. 개인정보처리방침·README·QA 문구와 핵심
  핸드오프 E2E를 함께 갱신했다. GA4 config 테스트는 로컬 측정 ID 미설정으로 스킵한다.

## 2026-08-04 2단계 신뢰·접근성 보강

- 임의계속가입 비교의 `crossChecked`를 직접 공단 모의계산 대조 전 상태로 정정하고,
  피부양자 `TrustSignal`도 공단 공개 안내·시행규칙 기준의 자체 재현임을 명시한다.
- 개인정보처리방침에 GA4 분석 쿠키(`_ga` 등) 고지를 추가했다. 입력값 비전송 원칙과
  분석 쿠키 고지를 분리해 설명한다.
- `InfoTooltip`을 실제 버튼으로 바꾸고 입력 라벨·설명과 연결했다. 모바일 44px 터치 타깃,
  `aria-expanded`·Escape 닫기·설명 연결을 적용했다.
- `ZeroValueConfirmModal`에 포커스 트랩, Escape 닫기, 닫힌 뒤 제출 버튼 포커스 복원,
  배경 형제 `aria-hidden` 처리를 적용했다. 관련 단위·Playwright 회귀 검사를 추가했다.

## 2026-08-05 최우선 작업 1·2 완료

- 지역보험료 공단 모의계산 C01~C13을 새 화면에서 재대조했다. C01~C12는 기존 기대값과 일치했고, C13은 공단이 금융소득을 별도 입력받지 않고 ‘사업소득 등’에 합산하도록 안내하므로 900만원 입력 결과 61,000원으로 확인했다. 지역보험료는 금융소득 문턱을 적용하지 않도록 수정하고 검증 플래그를 `true`로 갱신했다.
- 기혼 피부양자의 배우자 소득·사업자등록·장애 특례·재산세 과세표준을 조건부 입력받고, 대상자와 배우자의 요건을 각각 판정하도록 구현했다. 배우자 소득 2,000만원 경계·재산 9억원 초과 경계 단위/E2E 테스트와 검증기록을 추가했다. 법적 모델은 ‘부부 소득 단순 합산’이 아니라 대상자와 배우자 각각의 요건 확인이다.

## 작업 규칙

- `ready: false` 기능은 홈 메뉴·sitemap·검색 색인 대상에 공개하지 않는다.
- 경로 문자열을 새로 직접 쓰지 말고 `ROUTES`에서 가져온다.
- 제도 변경은 공식 출처 확인 → 상수/코드 → 화면 문구 → 단위/E2E 테스트 → 검증기록 → 배포 순서로 처리한다.
- 계산 결과는 공단의 개별 심사·고지액이 아닌 참고 결과로 표현한다.
- `docs/07-질문검색-설계.md`의 검색 엔진·LLM·검색 인덱스·동의어 사전·`/search?q=` 페이지를 만들지 않는 범위를 유지한다.
- **90일(2026-08-05 ~ 11-03) 동안 신규 계산기를 추가하지 않는다.** A안 채택 결과이며
  이유는 `docs/09-A안-90일-실행계획.md` 1장에 있다. 국민연금 조기·연기수령, 육아휴직급여는
  B안에 해당하며 채택하지 않았다.
- 경쟁사 화면을 요건 구현의 근거로 삼지 않는다. 반드시 법령 원문·공단 안내로 확인한다.
- 가이드 운영은 `docs/08-가이드-운영-런북.md`의 주간 색인·출처 점검, 월간 질문 분석, 제도 변경 순서를 따른다.
- 문구 수정 시 “퇴직 후 90일” 같은 낡은 고정 일수 안내가 다시 들어가지 않는지 확인한다. 현재 임의계속가입 신청기한은 최초 지역보험료 납부기한부터 2개월 규칙으로 표시한다.

## 2026-08-06 대조 사례 기록표 공개 (A안 3-4 완료)

- `/verification-policy/`에 「대조 사례 기록」 섹션을 추가했다. **0–30일 구간이 이걸로 끝난다.**
- **화면의 단일 출처는 `src/lib/verification/cases.ts`다.** `docs/03-검증기록.md`의 사례를
  옮긴 것이며, 두 곳이 어긋나면 문서를 기준으로 코드를 고친다.
- 공개 35건: 공단 모의계산 직접 대조 13 · 공단 안내 재현 11 · 법령 산식 자체 재현 9 · **미확인 2**.
- **대조 등급(`VerificationTier`)을 4단계로 나눴다.** 계획에 없던 추가다.
  한 표에 다 넣으면 공단과 직접 대조한 13건과 법령 산식을 스스로 재현한 9건이
  같은 무게로 보인다. 후자를 전자처럼 보이게 하는 것은 이 서비스가 파는 신뢰를 깎는다.
- **미확인 사례(D03·D04)를 화면에서 빼지 않는다.** 불리한 행을 지우면 검증 기록이 아니라
  홍보물이 된다. `e2e/verification-cases.spec.ts`가 이 묶음의 존재를 회귀 검사한다.
- 요약 숫자는 하드코딩하지 않고 `summarizeVerificationCases()`가 계산한다.
  사례를 추가할 때 요약을 같이 못 고쳐서 **검증 페이지의 숫자가 틀리는** 사고를 막는다.
- 관련 파일: `src/lib/verification/cases.ts`, `cases.test.ts`,
  `src/app/verification-policy/page.tsx`, `e2e/verification-cases.spec.ts`,
  `src/lib/routes.ts`(`lastModified` → 2026-08-06).

## 2026-08-06 애드센스 신청 시점 결정

- `vercel.json` CSP에 애드센스 출처를 **선반영**했다. 스크립트는 아직 넣지 않았다.
- **8월은 신청하지 않는다.** 콘텐츠 보완(09 문서 3-4 사례 기록표)과 계산 신뢰도
  (4-2 사적연금 기준 재확인, 4-3 대조 사례 확대)에 집중한다.
- **신청 기본값은 9월 초.** 콘텐츠가 예상보다 빨리 쌓이면 8월 중 앞당길 수 있으나,
  **신청~심사 종료 기간에는 사이트 구조를 크게 바꾸지 않는다**는 제약을 감수할 때만 앞당긴다.
- 승인되어도 자동광고는 켜지 않는다. **신청과 게재는 별개**이며 게재는 90일 구간 끝까지 미룬다.
- 상세와 앞당김·미룸 조건은 `docs/09-A안-90일-실행계획.md` 5-1.

## 아직 남은 운영 작업

> **2026-08-05**: 아래 1~7번 중 A안에 포함된 항목은 `docs/09-A안-90일-실행계획.md`가
> 진행 상황의 단일 출처다. 여기서는 중복 관리하지 않는다.

0. **완료(2026-08-05):** 지역보험료 금융소득 재대조 및 `VERIFIED_AGAINST_NHIS = true` 갱신.
0-1. **완료(2026-08-05):** 배우자 동반 판정 구현. 배우자 소득·재산을 대상자와 별도로 확인한다.
1. **[A안 3-1 · 첫 항목]** Google Search Console과 네이버 서치어드바이저에서 요청한 URL의 색인 상태·제외 사유·선택 canonical을 1주 단위로 확인한다.
   **2026-08-05 GSC 전체 라우트 점검:** 공개·색인 대상 11개는 모두 색인되었고, 정책 3개는 의도한 `noindex`로 제외되었으며, 준비 중 2개는 `ready: false`로 공개·사이트맵에서 제외된 상태다.
   **2026-08-06 Google 실측: 색인 대상 11개 전부 색인 확인.** A안 중단 조건 1번 해제.
   남은 관찰은 홈이 http·https 두 URL로 잡혀 있는 것 하나이며, **2026-08-06 진단 완료 — 설정 결함은 없다.**
   canonical(절대 https)·http 절대링크 0건·`curl -I` 결과 308 Permanent Redirect 모두 정상이고,
   원인은 2026-08-03 도메인 연결 직후의 낡은 크롤 스냅샷이다. **남은 조치는 GSC에서 http URL에 색인 생성 요청 → 2주 뒤 통합 확인.**
   **측정 함정:** `vercel.json`의 HSTS preload 때문에 브라우저 접속으로는 리다이렉트를 검증할 수 없다. 반드시 `curl -I` 로 본다.
   상세는 `docs/06-QA-전수점검.md`의 「Q4-1. 색인 실측」. 네이버는 미측정.
   **측정 함정:** `site:` 결과는 10개에서 잘린다. `num` 파라미터가 무시되므로 반드시 2페이지 이상 확인한다.
2. **완료(2026-08-05):** 임시 주소 `https://sabohum.vercel.app`은 `https://gijuncheck.kr`로 리다이렉트되며, `site:sabohum.vercel.app` 공개 검색 결과도 없어 검색 결과 잔존을 확인하지 못했다.
3. [Vercel Speed Insights Production 대시보드](https://vercel.com/seokwon-s-projects/sabohum/speed-insights)를 첫 확인 지점으로 삼아 Core Web Vitals 데이터가 누적되는지 확인하고 GA4와 역할을 분리한다. (2026-08-05 링크 확인)
3-1. 내부 테스트 트래픽을 구분·제외하는 방식을 정한다. (`docs/04` P1-2에서 이관)
3-2. 상표·사업자명·도메인 소유 정보를 다시 확인한다. 검색 결과가 없다는 것만으로
   권리 없음을 단정하지 않는다. (`docs/04` P0-1에서 이관)
4. 실제 스크린리더로 판정 입력·결과·근거 링크를 한 번 점검한다.
5. 국민건강보험공단 로그인 모의계산은 2026-08-03 부모·배우자 관계 조회 결과를 부분 확인했다. 로그인 사용자의 현재 자료를 조회하는 방식이라 D01·D02 합성 경계값의 공식 대조로 승격하지 않았고, 임의 금액 입력이 필요한 D03·D04는 미확인 상태다. 임의입력 가능한 공단 경로 또는 실제 처리 결과를 확보하면 `docs/03-검증기록.md`의 D01~D04 표를 추가 갱신한다.
6. **완료(2026-08-05):** 최신 Production에서 페이지별 OG 이미지 14개가 모두
   `200 image/png`으로 응답하고 파일 크기도 0이 아님을 확인했으며, 카카오·트위터
   공유 미리보기도 확인했다.
7. 4단계 GEO·AEO 변경과 2026-08-05 Phase 2 마무리(홈 내부 링크, JSON-LD 이스케이프, 보안
   헤더)를 배포한 뒤 Rich Results Test·Search Console·PageSpeed 결과를 날짜·URL과 함께
   `docs/06-QA-전수점검.md`에 기록한다. `vercel.json`의 보안 헤더는 `curl -I`로 실제
   응답에 반영됐는지 배포 후 확인한다.
8. ~~GitHub Actions CI 추가~~ — 2026-08-05 `.github/workflows/ci.yml` 추가로 완료
   (lint → typecheck → test → build → Playwright). 남은 것은 CI가 실제로 초록불로 도는지
   GitHub Actions 탭에서 1회 확인하는 것뿐이다.

> **이 목록의 범위** (2026-08-05 정리): 여기에는 **A안에 속하지 않는 운영 잡무만** 둔다.
> 전략 작업은 `docs/09-A안-90일-실행계획.md`가 소유한다. 1번 색인 확인은 A안 3-1과
> 같은 작업이므로 **진행 상황은 09에서만 갱신**하고 여기서는 참조만 한다.

## 2026-08-05 경쟁 분석 · 문서 정리

- 5개사(건보계산기·세금핏·유리지갑·공단·기준체크) 경쟁 분석을 수행하고
  `reports/기준체크_경쟁분석_리포트.md`·`_대시보드.html`에 기록했다.
- **채택 전략: A안(판정 정밀도 심화).** 실행 계획의 단일 출처는
  `docs/09-A안-90일-실행계획.md`다. **90일 동안 신규 계산기를 만들지 않는다.**
- 조사로 뒤집힌 전제 두 가지:
  1. **세금핏은 배우자 동반(부부 합산) 판정을 제공하고 우리는 못 한다.**
     `/verification-policy/`가 이 요건을 "별도 자료 확인 필요"로 비워 둔 자리다.
  2. **사적연금 합산 여부에서 세금핏과 기준이 충돌한다.** 세금핏은 "공적+사적 모두 포함",
     우리는 "개인연금 제외". 둘 중 하나는 틀렸고 판정 결과를 바꾼다.
     **우리 입장부터 시행규칙 별표 1의2 원문으로 재확인해야 한다.**
- 실행 순서가 바뀐 이유: 반론 테스트에서 가장 위험한 시나리오는 경쟁사가 우리를 따라오는
  것이 아니라 **아무것도 안 하는 것**으로 나왔다. 그들은 유입이 있고 우리는 색인조차
  미확인이다. 그래서 **색인 실측이 A안의 첫 항목**이다(09 문서 3-1).
- 문서 정리: 시점 스냅샷을 `docs/archive/`로 이동했다
  (`00-주제-리서치`, `03-디자인-방향-제안`, `05-P1-5-체크리스트-보완`,
  `design-debate/` 라운드 11편, `reviews/review-1`·`review-2`).
  `docs/design-debate/tools/contrast.py`는 에이전트가 참조하므로 **원위치에 남겼다.**
  아카이브 사용 규칙은 `docs/archive/README.md`.
- **문서 오류 정정**: `VERIFIED_AGAINST_NHIS`가 코드에서 `false`인데 README·MEMORY·
  타임라인·실행우선순위 4곳이 "13건 대조 완료 / true"로 적혀 있었다. 전부 정정했다.

## 작업 시작 순서

1. `git status --short`로 기존 변경을 먼저 확인한다.
2. 이 파일과 `docs/09-A안-90일-실행계획.md`(현재 전략), `docs/04-실행-우선순위.md`,
   `docs/06-QA-전수점검.md`의 현재 상태를 읽는다. `docs/archive/`는 현재 기준이 아니다.
3. 관련 코드와 테스트를 함께 확인하고, 변경 후 `npm run verify`를 실행한다.
4. 공식 기준이 바뀐 경우 `docs/03-검증기록.md`에 확인일·출처·대조 결과를 남긴다.
5. 운영 상태가 바뀌면 이 파일과 실행 타임라인을 함께 갱신한다.
