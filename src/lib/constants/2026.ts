/**
 * 2026년 건강보험 피부양자 인정기준 및 보험료율
 *
 * ⚠️ 이 파일의 모든 값은 매년 변경됩니다.
 *    새 연도가 시작되면 이 파일을 복사해 2027.ts를 만들고,
 *    rules.ts 의 RULES_BY_YEAR 에 등록하세요.
 *    코드 어디에도 숫자를 직접 쓰지 마세요.
 *
 * 최종 확인: 2026-07-30
 * 근거:
 *  - 국민건강보험법 시행규칙 별표 1   (부양요건)
 *  - 국민건강보험법 시행규칙 별표 1의2 (소득·재산요건)
 *  - 국민건강보험공단 2026년도 보험료율 인상 안내
 *  - 보건복지부 2026년도 장기요양보험료율 고시 (0.9448%)
 */

export const YEAR = 2026 as const;

/** 소득요건 (원, 연간) */
export const INCOME = {
  /** 합산소득 상한 — 초과 시 탈락. 2,000만 1원도 탈락 */
  TOTAL_LIMIT: 20_000_000,

  /** 사업자등록이 없는 경우 허용되는 사업소득 상한 */
  BUSINESS_LIMIT_UNREGISTERED: 5_000_000,

  /**
   * 사업자등록이 있는 경우 허용되는 사업소득 상한.
   * 원칙적으로 0원 — 1원이라도 발생하면 탈락.
   */
  BUSINESS_LIMIT_REGISTERED: 0,

  /**
   * 장애인·국가유공상이자·보훈보상대상자 특례.
   * 사업자등록 여부와 무관하게 이 금액 이하면 인정.
   */
  BUSINESS_LIMIT_DISABLED: 5_000_000,

  /** 재산 과표 5.4억 초과 구간에서 요구되는 소득 상한 */
  MID_PROPERTY_INCOME_LIMIT: 10_000_000,
} as const;

/** 재산요건 — 재산세 "과세표준" 기준 (실거래가·공시가격 아님) */
export const PROPERTY = {
  /** 이 금액 이하면 소득요건만 보면 됨 */
  SAFE_LIMIT: 540_000_000,

  /** 이 금액 초과 시 소득이 0원이어도 탈락 */
  HARD_LIMIT: 900_000_000,

  /** 형제자매 전용 상한 — 일반보다 엄격 */
  SIBLING_LIMIT: 180_000_000,
} as const;

/** 형제자매 부양요건 연령 */
export const SIBLING_AGE = {
  /** 만 30세 미만이면 인정 가능 */
  YOUNG_UNDER: 30,
  /** 만 65세 이상이면 인정 가능 */
  OLD_FROM: 65,
} as const;

/** 보험료율 */
export const RATE = {
  /** 건강보험료율 7.19% (2025년 7.09% → 0.1%p 인상) */
  HEALTH: 0.0719,

  /** 장기요양보험료율 0.9448% */
  LONG_TERM_CARE: 0.009448,

  /** 지역가입자 재산보험료부과점수당 금액 (원) */
  PROPERTY_POINT_VALUE: 211.5,
} as const;

/** 임의계속가입 */
export const VOLUNTARY_CONTINUATION = {
  /** 퇴직 전 18개월 중 직장가입 통산 필요 개월 */
  REQUIRED_MONTHS: 12,
  /** 판단 대상 기간 (개월) */
  LOOKBACK_MONTHS: 18,
  /** 최대 유지 가능 기간 (개월) */
  MAX_MONTHS: 36,
  /** 자격 취득 신고 기한 (일) — 이내 신고 시 퇴사일로 소급 */
  APPLY_DEADLINE_DAYS: 90,
} as const;

/** 결과 화면에 표시할 근거 문구 */
export const BASIS = {
  SUPPORT: '국민건강보험법 시행규칙 별표 1 (부양요건)',
  INCOME: '국민건강보험법 시행규칙 별표 1의2 (소득요건)',
  PROPERTY: '국민건강보험법 시행규칙 별표 1의2 (재산요건)',
  RATE: '국민건강보험공단 2026년도 보험료율 고시',
} as const;

export const DISCLAIMER =
  '본 판정은 모의 결과이며 법적 효력이 없습니다. ' +
  '최종 확인은 국민건강보험공단(1577-1000)에 문의하시기 바랍니다. 기준: 2026년.';
