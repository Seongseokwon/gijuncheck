/**
 * 지역가입자 보험료 · 임의계속가입 비교
 *
 * 지역보험료(월) = (소득월액 × 건강보험료율) + (재산부과점수 × 점수당 금액)
 * 장기요양보험료 = 건강보험료 × (장기요양보험료율 ÷ 건강보험료율)
 */

import { RATE, VOLUNTARY_CONTINUATION, BASIS } from '../constants/2026';
import {
  VERIFIED,
  VERIFIED_AGAINST_NHIS,
  propertyScoreDetail,
} from '../constants/property-score-table';

export interface PremiumBreakdown {
  /** 소득 기준 보험료 (원/월) */
  incomePortion: number;
  /** 재산 기준 보험료 (원/월) */
  propertyPortion: number;
  /** 적용된 재산 부과점수 */
  propertyScore: number;
  /** 적용된 재산 등급 (1~60). 재산 계산이 없는 경우 null */
  propertyGrade: number | null;
  /** 건강보험료 (원/월) */
  health: number;
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
  basis: string;
}

/** 건강보험료에서 장기요양보험료를 산출하는 환산율 */
export function longTermCareRatio(): number {
  return RATE.LONG_TERM_CARE / RATE.HEALTH;
}

function longTermCareOf(health: number): number {
  return Math.round(health * longTermCareRatio());
}

/**
 * 지역가입자 월 보험료
 *
 * @param annualIncome 연간 합산소득 (원)
 * @param propertyAmount 재산금액 합계 (원). 재산세 과세표준 기준.
 *                       전세·월세는 환산이 끝난 값으로 넣어야 한다.
 */
export function calculateRegionalPremium(
  annualIncome: number,
  propertyAmount: number,
): PremiumBreakdown {
  const monthlyIncome = annualIncome / 12;
  const incomePortion = Math.round(monthlyIncome * RATE.HEALTH);

  const property = propertyScoreDetail(propertyAmount);
  const propertyPortion = Math.round(
    property.score * RATE.PROPERTY_POINT_VALUE,
  );

  const health = incomePortion + propertyPortion;
  const longTermCare = longTermCareOf(health);

  return {
    incomePortion,
    propertyPortion,
    propertyScore: property.score,
    propertyGrade: property.grade,
    health,
    longTermCare,
    total: health + longTermCare,
    verified: VERIFIED,
    crossChecked: VERIFIED_AGAINST_NHIS,
    basis: BASIS.RATE,
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
  const health = Math.round(full / 2); // 본인 부담 50%
  const longTermCare = longTermCareOf(health);

  return {
    incomePortion: health,
    propertyPortion: 0,
    propertyScore: 0,
    propertyGrade: null, // 재산을 반영하지 않으므로 등급 개념이 없다
    health,
    longTermCare,
    total: health + longTermCare,
    // 재산점수표에 의존하지 않으므로 등급표 검증 상태와 무관하다
    verified: true,
    crossChecked: true,
    basis: BASIS.RATE,
  };
}

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
  annualIncome: number;
  propertyAmount: number;
  avgMonthlyWage: number;
  insuredMonthsInLookback: number;
}): ComparisonResult {
  const regional = calculateRegionalPremium(
    params.annualIncome,
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
