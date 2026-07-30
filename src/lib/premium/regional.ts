/**
 * 지역가입자 보험료 · 임의계속가입 비교
 *
 * 2026년 지역가입자 건강보험료
 *   = (소득월액 × 건강보험료율) + (재산부과점수 × 점수당 금액)
 *   → 상한·하한 적용
 *
 * 소득월액은 소득 종류별 반영률을 먼저 적용한 뒤 12로 나눈다.
 * 근로·연금소득은 50%만 반영한다 — 이걸 놓치면 연금 수령자 보험료가 2배가 된다.
 *
 * 자동차 보험료는 2024년 2월부터 폐지되었으므로 계산하지 않는다.
 *
 * 장기요양보험료 = 건강보험료 × (장기요양보험료율 ÷ 건강보험료율)
 */

import {
  BASIS,
  INCOME_REFLECTION,
  PREMIUM_LIMIT,
  RATE,
  VOLUNTARY_CONTINUATION,
} from '../constants/2026';
import {
  VERIFIED,
  VERIFIED_AGAINST_NHIS,
  propertyScoreDetail,
} from '../constants/property-score-table';
import type { Income } from '../dependent/types';

/* ------------------------------------------------------------------ */
/* 소득월액                                                            */
/* ------------------------------------------------------------------ */

export interface IncomeBase {
  /** 반영률 적용 후 연간 소득 (원) */
  annualReflected: number;
  /** 소득월액 (원) */
  monthly: number;
  /** 반영률 적용 전 연간 합산소득 (원) — 화면에 대비로 보여주면 이해가 쉽다 */
  annualRaw: number;
}

/**
 * 소득 종류별 반영률을 적용한 소득월액
 *
 *  - 이자·배당·사업·기타소득: 100%
 *  - 근로·연금소득: 50%
 */
export function incomeBaseForPremium(income: Income): IncomeBase {
  const full =
    (income.business + income.financial + income.other) * INCOME_REFLECTION.FULL;
  const half = (income.wage + income.pension) * INCOME_REFLECTION.HALF;

  const annualReflected = full + half;
  const annualRaw =
    income.business +
    income.financial +
    income.other +
    income.wage +
    income.pension;

  return { annualReflected, monthly: annualReflected / 12, annualRaw };
}

/* ------------------------------------------------------------------ */
/* 보험료                                                              */
/* ------------------------------------------------------------------ */

export interface PremiumBreakdown {
  /** 소득 기준 보험료 (원/월) */
  incomePortion: number;
  /** 재산 기준 보험료 (원/월) */
  propertyPortion: number;
  /** 적용된 재산 부과점수 */
  propertyScore: number;
  /** 적용된 재산 등급 (1~60). 재산을 반영하지 않는 경우 null */
  propertyGrade: number | null;
  /** 상한·하한 적용 전 건강보험료 (원/월) */
  healthBeforeLimit: number;
  /** 건강보험료 (원/월). 상한·하한 적용 후 */
  health: number;
  /** 상한·하한이 적용되었는지 */
  limitApplied: 'lower' | 'upper' | null;
  /** 장기요양보험료 (원/월) */
  longTermCare: number;
  /** 합계 (원/월) */
  total: number;
  /** 등급표 자체가 검증되었는지 */
  verified: boolean;
  /**
   * 공단 모의계산과 대조 검증까지 완료되었는지.
   * false 인 동안은 UI에 "참고용" 표시를 함께 노출할 것.
   */
  crossChecked: boolean;
  basis: string[];
}

/** 건강보험료에서 장기요양보험료를 산출하는 환산율 */
export function longTermCareRatio(): number {
  return RATE.LONG_TERM_CARE / RATE.HEALTH;
}

function longTermCareOf(health: number): number {
  return Math.round(health * longTermCareRatio());
}

/** 건강보험료에 상한·하한을 적용한다 */
function applyLimit(health: number): {
  health: number;
  limitApplied: 'lower' | 'upper' | null;
} {
  if (health < PREMIUM_LIMIT.LOWER) {
    return { health: PREMIUM_LIMIT.LOWER, limitApplied: 'lower' };
  }
  if (health > PREMIUM_LIMIT.UPPER) {
    return { health: PREMIUM_LIMIT.UPPER, limitApplied: 'upper' };
  }
  return { health, limitApplied: null };
}

/**
 * 지역가입자 월 보험료
 *
 * @param income 연간 소득 내역. 종류별 반영률이 다르므로 항목을 분리해서 받는다.
 * @param propertyAmount 재산금액 합계 (원). 재산세 과세표준 + 전월세평가금액(30%).
 *                       전세·월세 환산은 미지원이므로 환산이 끝난 값을 넣어야 한다.
 */
export function calculateRegionalPremium(
  income: Income,
  propertyAmount: number,
): PremiumBreakdown {
  const base = incomeBaseForPremium(income);
  const incomePortion = Math.round(base.monthly * RATE.HEALTH);

  const property = propertyScoreDetail(propertyAmount);
  const propertyPortion = Math.round(
    property.score * RATE.PROPERTY_POINT_VALUE,
  );

  const healthBeforeLimit = incomePortion + propertyPortion;
  const { health, limitApplied } = applyLimit(healthBeforeLimit);
  const longTermCare = longTermCareOf(health);

  return {
    incomePortion,
    propertyPortion,
    propertyScore: property.score,
    propertyGrade: property.grade,
    healthBeforeLimit,
    health,
    limitApplied,
    longTermCare,
    total: health + longTermCare,
    verified: VERIFIED,
    crossChecked: VERIFIED_AGAINST_NHIS,
    basis: [BASIS.RATE, BASIS.PROPERTY_SCORE, BASIS.PREMIUM_LIMIT],
  };
}

/**
 * 임의계속가입 월 보험료
 *
 * 퇴직 전 12개월 보수월액 평균을 기준으로 하고 재산은 반영하지 않는다.
 * 직장가입자와 동일하게 보험료의 절반을 본인이 부담한다.
 *
 * @param avgMonthlyWage 퇴직 전 12개월 보수월액 평균 (원)
 */
export function calculateVoluntaryPremium(
  avgMonthlyWage: number,
): PremiumBreakdown {
  const full = avgMonthlyWage * RATE.HEALTH;
  const beforeLimit = Math.round(full / 2); // 본인 부담 50%
  const { health, limitApplied } = applyLimit(beforeLimit);
  const longTermCare = longTermCareOf(health);

  return {
    incomePortion: health,
    propertyPortion: 0,
    propertyScore: 0,
    propertyGrade: null, // 재산을 반영하지 않으므로 등급 개념이 없다
    healthBeforeLimit: beforeLimit,
    health,
    limitApplied,
    longTermCare,
    total: health + longTermCare,
    // 재산점수표에 의존하지 않으므로 등급표 검증 상태와 무관하다
    verified: true,
    crossChecked: true,
    basis: [BASIS.RATE, BASIS.PREMIUM_LIMIT],
  };
}

/* ------------------------------------------------------------------ */
/* 임의계속가입 비교                                                    */
/* ------------------------------------------------------------------ */

export interface EligibilityForVoluntary {
  /** 퇴직 전 18개월 중 직장가입 통산 개월 수 */
  insuredMonthsInLookback: number;
}

/** 임의계속가입 신청 자격 */
export function canApplyVoluntary({
  insuredMonthsInLookback,
}: EligibilityForVoluntary): boolean {
  return insuredMonthsInLookback >= VOLUNTARY_CONTINUATION.REQUIRED_MONTHS;
}

export type Recommendation = 'voluntary' | 'regional' | 'notEligible';

export interface ComparisonResult {
  regional: PremiumBreakdown;
  voluntary: PremiumBreakdown | null;
  /** 더 유리한 쪽 */
  recommendation: Recommendation;
  /** 월 절약액 (원). 임의계속가입이 유리한 경우에만 양수 */
  monthlySaving: number;
  /** 최대 유지 기간 동안의 총 절약액 (원) */
  totalSaving: number;
  /** 최대 유지 개월 */
  maxMonths: number;
  /** 신고 기한 (일) */
  applyDeadlineDays: number;
  notes: string[];
}

/**
 * 지역가입자 vs 임의계속가입 비교
 *
 * 재산이 많고 퇴직 전 보수가 낮았을수록 임의계속가입이 유리하다.
 */
export function compareAfterRetirement(params: {
  income: Income;
  propertyAmount: number;
  avgMonthlyWage: number;
  insuredMonthsInLookback: number;
}): ComparisonResult {
  const regional = calculateRegionalPremium(
    params.income,
    params.propertyAmount,
  );

  const eligible = canApplyVoluntary({
    insuredMonthsInLookback: params.insuredMonthsInLookback,
  });

  const notes: string[] = [
    `임의계속가입은 퇴직 후 ${VOLUNTARY_CONTINUATION.APPLY_DEADLINE_DAYS}일 이내에 신고하면 퇴사일로 소급 인정됩니다.`,
    `최대 ${VOLUNTARY_CONTINUATION.MAX_MONTHS}개월까지 직장가입자 자격을 유지할 수 있습니다.`,
    '임의계속가입자는 재산이 보험료에 반영되지 않고, 피부양자를 등재할 수 있습니다.',
  ];

  if (!eligible) {
    notes.unshift(
      `임의계속가입은 퇴직 전 ${VOLUNTARY_CONTINUATION.LOOKBACK_MONTHS}개월 중 ` +
        `직장가입 기간이 통산 ${VOLUNTARY_CONTINUATION.REQUIRED_MONTHS}개월 이상이어야 신청할 수 있습니다. ` +
        `(입력: ${params.insuredMonthsInLookback}개월)`,
    );
    return {
      regional,
      voluntary: null,
      recommendation: 'notEligible',
      monthlySaving: 0,
      totalSaving: 0,
      maxMonths: VOLUNTARY_CONTINUATION.MAX_MONTHS,
      applyDeadlineDays: VOLUNTARY_CONTINUATION.APPLY_DEADLINE_DAYS,
      notes,
    };
  }

  const voluntary = calculateVoluntaryPremium(params.avgMonthlyWage);
  const monthlySaving = regional.total - voluntary.total;

  return {
    regional,
    voluntary,
    recommendation: monthlySaving > 0 ? 'voluntary' : 'regional',
    monthlySaving,
    totalSaving: monthlySaving * VOLUNTARY_CONTINUATION.MAX_MONTHS,
    maxMonths: VOLUNTARY_CONTINUATION.MAX_MONTHS,
    applyDeadlineDays: VOLUNTARY_CONTINUATION.APPLY_DEADLINE_DAYS,
    notes,
  };
}
