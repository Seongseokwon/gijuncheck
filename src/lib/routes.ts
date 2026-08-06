/**
 * 사이트 경로 레지스트리
 *
 * 경로 문자열을 이 파일에서만 정의한다. 이유가 두 가지다.
 *
 *  1. sitemap 누락 방지. 페이지를 추가하면서 sitemap 등록을 잊는 게 가장 흔한 실수다.
 *     여기에 등록하면 sitemap 이 자동으로 따라온다.
 *  2. 경로 변경 비용. 배포 후에는 URL 변경이 리다이렉트 부채가 되지만,
 *     적어도 코드 안에서는 한 곳만 고치면 되게 한다.
 *
 * 경로 규칙
 *  - 영문 소문자 + 하이픈
 *  - 항상 슬래시로 끝낸다 (next.config 의 trailingSlash: true 와 일치)
 */

export interface RouteEntry {
  path: string;
  /** 내부 링크·목록에 쓰는 표시명 */
  label: string;
  /** 정적 export에 포함할 페이지별 OG 이미지 경로 */
  ogImage?: string;
  /** sitemap priority (0~1) */
  priority: number;
  /** 해당 페이지의 콘텐츠·기준이 실제로 마지막 변경된 날. 배포일과 구분한다. */
  lastModified?: string;
  /** 콘텐츠 성격에 맞춘 검색엔진 재방문 주기 */
  changeFrequency?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  /** 구현 완료 여부. false 면 sitemap 에서 제외되고 허브에서 "준비 중"으로 표시된다 */
  ready: boolean;
  /** 색인 대상이 아닌 페이지 (정책·약관 등) */
  noindex?: boolean;
}

export const ROUTES = {
  home: {
    path: '/',
    label: '홈',
    ogImage: '/og/home.png',
    priority: 1,
    lastModified: '2026-08-04',
    changeFrequency: 'weekly',
    ready: true,
  },

  // ---- 건강보험 ----
  dependent: {
    path: '/health-insurance/dependent/',
    label: '피부양자 자격판정',
    ogImage: '/og/dependent.png',
    priority: 0.9,
    lastModified: '2026-08-04',
    changeFrequency: 'monthly',
    ready: true,
  },
  regionalPremium: {
    path: '/health-insurance/regional-premium/',
    label: '지역가입자 보험료 계산',
    ogImage: '/og/regional-premium.png',
    priority: 0.9,
    lastModified: '2026-08-05',
    changeFrequency: 'monthly',
    /** 2026-08-05 공단 모의계산 대표 사례 13건 재대조 완료 */
    ready: true,
  },
  voluntaryContinuation: {
    path: '/health-insurance/voluntary-continuation/',
    label: '임의계속가입 비교',
    ogImage: '/og/voluntary-continuation.png',
    priority: 0.8,
    lastModified: '2026-08-03',
    changeFrequency: 'monthly',
    /** 2026-08-03 법령·공단 산식·대표 사례 대조 완료 */
    ready: true,
  },

  // ---- 건강보험 가이드 ----
  guidePropertyTaxBase: {
    path: '/health-insurance/guides/property-tax-base/',
    label: '재산세 과세표준 확인하는 방법',
    ogImage: '/og/property-tax-base.png',
    priority: 0.7,
    lastModified: '2026-08-03',
    changeFrequency: 'monthly',
    ready: true,
  },
  guideBusinessRegistration: {
    path: '/health-insurance/guides/before-business-registration/',
    label: '사업자등록 전에 반드시 계산해야 하는 것',
    ogImage: '/og/before-business-registration.png',
    priority: 0.7,
    lastModified: '2026-08-03',
    changeFrequency: 'monthly',
    ready: true,
  },
  guideLosingEligibility: {
    path: '/health-insurance/guides/losing-eligibility/',
    label: '피부양자 자격상실 시점과 소급 부과',
    ogImage: '/og/losing-eligibility.png',
    priority: 0.7,
    lastModified: '2026-08-03',
    changeFrequency: 'monthly',
    ready: true,
  },
  guideVoluntaryContinuation: {
    path: '/health-insurance/guides/when-voluntary-continuation-wins/',
    label: '임의계속가입이 유리한 경우',
    ogImage: '/og/when-voluntary-continuation-wins.png',
    priority: 0.7,
    lastModified: '2026-08-03',
    changeFrequency: 'monthly',
    ready: true,
  },
  guidePensionImpact: {
    path: '/health-insurance/guides/pension-impact/',
    label: '연금 수령이 피부양자 자격에 미치는 영향',
    ogImage: '/og/pension-impact.png',
    priority: 0.7,
    // 2026-08-06 사적연금 제외의 실제 근거(부과 자료 범위) 절 추가
    lastModified: '2026-08-06',
    changeFrequency: 'monthly',
    ready: true,
  },
  guideNovemberReassessment: {
    path: '/health-insurance/guides/november-reassessment/',
    // 11월 피크를 겨냥한 글. 검색량이 몰리는 시기 전에 순위를 만들어둬야 한다.
    label: '11월 건강보험 자격 일괄 재산정이란',
    ogImage: '/og/november-reassessment.png',
    priority: 0.8,
    lastModified: '2026-08-03',
    changeFrequency: 'weekly',
    ready: true,
  },

  verificationPolicy: {
    path: '/verification-policy/',
    label: '검증 원칙',
    ogImage: '/og/verification-policy.png',
    priority: 0.5,
    // 2026-08-06 대조 사례 기록표 공개
    lastModified: '2026-08-06',
    changeFrequency: 'yearly',
    ready: true,
  },

  // ---- 국민연금 ----
  pensionEarlyVsDeferred: {
    path: '/national-pension/early-vs-deferred/',
    label: '조기수령 vs 연기수령 비교',
    priority: 0.8,
    ready: false,
  },

  // ---- 고용보험 ----
  parentalLeaveBenefit: {
    path: '/employment-insurance/parental-leave-benefit/',
    label: '육아휴직급여 계산',
    priority: 0.8,
    ready: false,
  },

  // ---- 정책 (색인 제외) ----
  privacy: {
    path: '/privacy/',
    label: '개인정보처리방침',
    ogImage: '/og/privacy.png',
    priority: 0.1,
    lastModified: '2026-08-04',
    ready: true,
    noindex: true,
  },
  terms: {
    path: '/terms/',
    label: '이용약관',
    ogImage: '/og/terms.png',
    priority: 0.1,
    lastModified: '2026-07-31',
    ready: true,
    noindex: true,
  },
  contact: {
    path: '/contact/',
    label: '문의',
    ogImage: '/og/contact.png',
    priority: 0.1,
    lastModified: '2026-07-31',
    ready: true,
    noindex: true,
  },
  // as const 를 붙이지 않는다. 붙이면 ready 가 리터럴 true/false 로 좁혀져서
  // `route.ready ? A : B` 분기가 정적으로 죽고, noindex 를 선언하지 않은 항목의
  // 타입에서 noindex 속성 자체가 사라져 순회 시 타입 오류가 난다.
} satisfies Record<string, RouteEntry>;

export type RouteKey = keyof typeof ROUTES;

/**
 * 전체 경로 목록.
 * RouteEntry[] 로 명시해야 noindex 미선언 항목도 옵셔널 속성으로 다뤄진다.
 */
const ALL_ROUTES: readonly RouteEntry[] = Object.values(ROUTES);

/** 경로에 맞는 정적 OG 이미지. 미등록 경로는 홈 카드를 기본값으로 쓴다. */
export function ogImageForPath(path: string): string {
  return ALL_ROUTES.find((route) => route.path === path)?.ogImage || '/og/home.png';
}

/** sitemap 에 넣을 경로 — 구현 완료 + 색인 대상만 */
export function indexableRoutes(): RouteEntry[] {
  return ALL_ROUTES.filter((r) => r.ready && !r.noindex);
}

/** 허브에 표시할 도구 목록 */
export const TOOL_KEYS = [
  'dependent',
  'regionalPremium',
  'voluntaryContinuation',
] as const satisfies readonly RouteKey[];

/** 푸터에 표시할 정책 페이지 */
export const POLICY_KEYS = ['privacy', 'terms', 'contact'] as const satisfies
  readonly RouteKey[];

/** 도구 페이지 하단 "함께 읽기"에 넣을 가이드 */
export const GUIDE_KEYS = [
  'guidePropertyTaxBase',
  'guideBusinessRegistration',
  'guideLosingEligibility',
  'guideVoluntaryContinuation',
  'guidePensionImpact',
  'guideNovemberReassessment',
] as const satisfies readonly RouteKey[];
