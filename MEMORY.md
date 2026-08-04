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
- P2-1 지역보험료 계산기 공식 모의계산 13건 대조 완료
- P2-2 임의계속가입 비교의 현행 법령·공단 안내·보험료 고시·대표 사례 대조 완료
- Google Search Console과 네이버 서치어드바이저 등록·sitemap 제출·핵심 4개 URL 수집/색인 요청 완료. 실제 색인 완료 여부는 대기 중
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
- 2026-08-04 코드 비평 결과와 2주 실행계획을 `reports/critic-alpha.md`,
  `reports/critic-beta.md`, `reports/action-plan.md`에 기록하고, 재사용 가능한 비평
  에이전트 정의를 `.claude/agents/`에 추가했다. 이 리포트들은 감사 당시의 스냅샷이므로
  현재 코드 상태와 대조해 다음 작업을 선택한다.

## 검증 기준선

최근 `npm run verify` 결과:

- `npm run typecheck`: 통과
- `npm test`: 6개 파일, 136개 통과
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
- 실행 순서: `docs/02-다음작업-타임라인.md`, `docs/04-실행-우선순위.md`
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

## 작업 규칙

- `ready: false` 기능은 홈 메뉴·sitemap·검색 색인 대상에 공개하지 않는다.
- 경로 문자열을 새로 직접 쓰지 말고 `ROUTES`에서 가져온다.
- 제도 변경은 공식 출처 확인 → 상수/코드 → 화면 문구 → 단위/E2E 테스트 → 검증기록 → 배포 순서로 처리한다.
- 계산 결과는 공단의 개별 심사·고지액이 아닌 참고 결과로 표현한다.
- `docs/07-질문검색-설계.md`의 검색 엔진·LLM·검색 인덱스·동의어 사전·`/search?q=` 페이지를 만들지 않는 범위를 유지한다.
- 가이드 운영은 `docs/08-가이드-운영-런북.md`의 주간 색인·출처 점검, 월간 질문 분석, 제도 변경 순서를 따른다.
- 문구 수정 시 “퇴직 후 90일” 같은 낡은 고정 일수 안내가 다시 들어가지 않는지 확인한다. 현재 임의계속가입 신청기한은 최초 지역보험료 납부기한부터 2개월 규칙으로 표시한다.

## 아직 남은 운영 작업

1. Google Search Console과 네이버 서치어드바이저에서 요청한 URL의 색인 상태·제외 사유·선택 canonical을 1주 단위로 확인한다.
2. 임시 Vercel 주소가 검색 결과에 남아 있지 않은지 확인한다.
3. Vercel Speed Insights에서 Core Web Vitals 데이터가 누적되는지 확인하고 GA4와 역할을 분리한다.
4. 실제 스크린리더로 판정 입력·결과·근거 링크를 한 번 점검한다.
5. 국민건강보험공단 로그인 모의계산은 2026-08-03 부모·배우자 관계 조회 결과를 부분 확인했다. 로그인 사용자의 현재 자료를 조회하는 방식이라 D01·D02 합성 경계값의 공식 대조로 승격하지 않았고, 임의 금액 입력이 필요한 D03·D04는 미확인 상태다. 임의입력 가능한 공단 경로 또는 실제 처리 결과를 확보하면 `docs/03-검증기록.md`의 D01~D04 표를 추가 갱신한다.
6. 최신 Production 배포 후 페이지별 OG 이미지 14개가 200으로 열리는지와 카카오·SNS 공유
   미리보기 캐시를 확인한다.
7. 4단계 GEO·AEO 변경을 배포한 뒤 Rich Results Test·Search Console·PageSpeed 결과를
   날짜·URL과 함께 `docs/06-QA-전수점검.md`에 기록한다.
8. GitHub Actions가 아직 없으므로 `npm run verify`를 push/PR마다 실행하는 CI를 추가한다.

## 작업 시작 순서

1. `git status --short`로 기존 변경을 먼저 확인한다.
2. 이 파일과 `docs/04-실행-우선순위.md`, `docs/06-QA-전수점검.md`의 현재 상태를 읽는다.
3. 관련 코드와 테스트를 함께 확인하고, 변경 후 `npm run verify`를 실행한다.
4. 공식 기준이 바뀐 경우 `docs/03-검증기록.md`에 확인일·출처·대조 결과를 남긴다.
5. 운영 상태가 바뀌면 이 파일과 실행 타임라인을 함께 갱신한다.
