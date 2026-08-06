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
  RURAL_REDUCTION,
  VOLUNTARY_CONTINUATION,
} from '../constants/2026';
import {
  VERIFIED,
  VERIFIED_AGAINST_NHIS,
  propertyScoreDetail,
} from '../constants/property-score-table';
import { EMPTY_PREMIUM_INCOME, type PremiumIncome } from './types';

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
 * 100% 반영되는 소득의 합계 (원, 연간)
 *
 * **소득을 직접 더하지 말고 이 함수를 쓴다.** 지역보험료와 임의계속가입의
 * 보수 외 소득이 같은 정의를 쓰는데 각자 인라인으로 더하고 있어서, 항목을
 * 하나 추가할 때 한쪽만 고치면 조용히 어긋난다. 실제로 분리과세 주택임대소득을
 * 넣을 때 그럴 뻔했다 (`propertyAmountFor()` 를 만든 것과 같은 이유다).
 */
function fullReflectedIncome(income: PremiumIncome): number {
  return (
    income.business + income.financial + income.other + income.housingRental
  );
}

/** 50% 반영되는 소득의 합계 (원, 연간) */
function halfReflectedIncome(income: PremiumIncome): number {
  return income.wage + income.pension;
}

/** 반영률 적용 전 연간 합산소득 (원) */
function rawIncome(income: PremiumIncome): number {
  return fullReflectedIncome(income) + halfReflectedIncome(income);
}

/**
 * 소득 종류별 반영률을 적용한 소득월액
 *
 *  - 이자·배당·사업·기타·분리과세 주택임대소득: 100%
 *  - 근로·연금소득: 50%
 *
 * 지역보험료에서는 사업·이자·배당·기타소득이 모두 100% 반영된다.
 * 공단 모의계산기의 ‘사업소득 등’ 입력란도 사업·이자·배당·기타소득을 합산하도록
 * 안내한다. 연 1,000만원 금융소득 문턱은 피부양자 판정에만 적용한다.
 *
 * **분리과세 주택임대소득도 100%다.** 공단 화면이 별도 칸으로 받길래 반영률이
 * 다를 것을 의심했는데, 2026-08-06 실측 결과 같은 금액을 「사업소득 등」에
 * 넣었을 때와 결과가 완전히 같았다. 칸이 나뉜 이유는 반영률이 아니라 부과
 * 자료의 출처가 달라서다 — 분리과세분은 종합소득 신고 자료에 잡히지 않는다.
 */
export function incomeBaseForPremium(income: PremiumIncome): IncomeBase {
  const full = fullReflectedIncome(income) * INCOME_REFLECTION.FULL;
  const half = halfReflectedIncome(income) * INCOME_REFLECTION.HALF;

  return {
    annualReflected: full + half,
    monthly: (full + half) / 12,
    annualRaw: rawIncome(income),
  };
}

/* ------------------------------------------------------------------ */
/* 보험료                                                              */
/* ------------------------------------------------------------------ */

export interface PremiumBreakdown {
  /** 소득 기준 보험료 (원/월). 하한·상한 적용 **전** 원값 */
  incomePortion: number;
  /**
   * 화면에 표시할 소득보험료 (원/월). 하한·상한을 적용한 값.
   *
   * ## 왜 두 값이 따로 있는가 — 2026-08-06 공단 재대조
   *
   * 공단 모의계산 화면은 ① 소득월액보험료 칸에 **하한·상한을 적용한 값**을 넣는다.
   * 소득이 0원이어도 20,160원으로 표시되고, 소득분이 상한을 넘으면 4,591,740원으로
   * 잘려서 표시된다. 그래야 화면의 `① + ③ = ④`가 성립한다.
   *
   * 우리는 `incomePortion` 에 원값을 담고 그대로 화면에 뿌리고 있었다. 그래서
   * 재산만 있는 세대의 화면이 **`0원 + 139,378원 = 159,530원`** 처럼 산수가 맞지
   * 않게 보였다. 최종 금액은 맞았지만, 근거를 보여주는 것이 이 서비스의 존재
   * 이유인데 표에서 덧셈이 안 맞는 것은 그 자체로 결함이다.
   *
   * C01~C25 23건에서 `clamp(원값, 하한, 상한)` 이 공단 ① 표시값과 전부 일치했다.
   */
  incomePortionApplied: number;
  /** 임의계속가입자에게 별도로 더해지는 보수 외 소득월액보험료 (원/월) */
  nonWageIncomePortion?: number;
  /** 재산 기준 보험료 (원/월) */
  propertyPortion: number;
  /** 적용된 재산 부과점수 */
  propertyScore: number;
  /** 적용된 재산 등급 (0 또는 1~60). 재산을 반영하지 않는 경우 null */
  propertyGrade: number | null;
  /** 상한·하한 적용 전 건강보험료 (원/월) */
  healthBeforeLimit: number;
  /** 건강보험료 (원/월). 상한·하한 적용 후 */
  health: number;
  /** 상한·하한이 적용되었는지 */
  limitApplied: 'lower' | 'upper' | null;
  /**
   * 농어촌 지역 거주 경감액 (원/월). 적용되지 않으면 0.
   * 공단 화면의 ⑥ 항목에 해당한다.
   */
  ruralReduction: number;
  /**
   * 농어촌 경감을 요청했지만 **적용하지 않은 사유**.
   * 적용했거나 요청하지 않았으면 undefined.
   *
   * 공단 모의계산기는 이 조건을 검사하지 않고 무조건 22%를 적용한다.
   * 우리는 제도 기준으로 판정하므로 결과가 갈릴 수 있고, 그 사실을 화면에 밝힌다.
   */
  ruralReductionBlockedReason?: string;
  /** 장기요양보험료 (원/월). **경감 후 건강보험료** 기준으로 계산한다 */
  longTermCare: number;
  /** 합계 (원/월). 건강보험료 - 경감액 + 장기요양보험료 */
  total: number;
  /** 등급표 자체가 검증되었는지 */
  verified: boolean;
  /**
   * 공단 모의계산과 대조 검증까지 완료되었는지.
   * false 인 동안은 UI에 "참고용" 표시를 함께 노출할 것.
   */
  crossChecked: boolean;
  /** 직접 대조가 끝나지 않은 계산의 적용 가정 */
  assumption?: string;
  basis: string[];
}

/** 건강보험료에서 장기요양보험료를 산출하는 환산율 */
export function longTermCareRatio(): number {
  return RATE.LONG_TERM_CARE / RATE.HEALTH;
}

function longTermCareOf(health: number): number {
  return roundPremiumUnit(health * longTermCareRatio());
}

/** 공단 모의계산처럼 건강보험료·장기요양보험료를 10원 단위로 절사한다. */
function roundPremiumUnit(amount: number): number {
  return Math.floor(amount / 10) * 10;
}

/**
 * 공단 화면 ① 소득월액보험료 표시값.
 *
 * 계산에는 쓰지 않는다. 표시 전용이다 — 하한은 재산보험료를 더한 뒤 총액에
 * 적용되므로, 이 값을 그대로 더하면 이중 적용된다.
 */
function displayedIncomePortion(raw: number): number {
  return Math.min(Math.max(raw, PREMIUM_LIMIT.LOWER), PREMIUM_LIMIT.UPPER);
}

/** 소득보험료 하한과 전체 건강보험료 상한을 적용한다. */
function applyLimit(health: number, propertyPortion = 0): {
  health: number;
  limitApplied: 'lower' | 'upper' | null;
} {
  // 공단 계산기는 소득보험료 하한을 먼저 적용하고 재산보험료를 더한다.
  // 따라서 재산이 있는 경우 하한은 총액에 덮어쓰지 않는다.
  const healthWithIncomeFloor = Math.max(
    health,
    PREMIUM_LIMIT.LOWER + propertyPortion,
  );
  if (healthWithIncomeFloor > PREMIUM_LIMIT.UPPER) {
    return { health: PREMIUM_LIMIT.UPPER, limitApplied: 'upper' };
  }
  if (health < PREMIUM_LIMIT.LOWER + propertyPortion) {
    return {
      health: roundPremiumUnit(healthWithIncomeFloor),
      limitApplied: 'lower',
    };
  }
  return { health: roundPremiumUnit(healthWithIncomeFloor), limitApplied: null };
}

export interface RegionalPremiumOptions {
  /** 군·도농복합시의 읍·면지역에 거주하는가 */
  ruralResident?: boolean;
  /** 세대에 농어업인으로 등록된 가입자가 있는가 */
  registeredFarmer?: boolean;
}

/**
 * 농어촌 경감 판정.
 *
 * 제도 기준으로 본다 — 읍·면 거주 + 사업소득 500만원 이하,
 * 초과 시에는 농어업인 등록자가 있어야 한다.
 * 공단 모의계산기는 이 조건을 검사하지 않는다(2026-08-06 실측).
 *
 * **미확인 한계:** 여기서 말하는 "사업소득"에 분리과세 주택임대소득이 포함되는지
 * 확인하지 못했다. 소득세법상 부동산임대업은 사업소득이므로 포함될 여지가 있으나,
 * 공단 모의계산기가 이 조건 자체를 검사하지 않아 실측으로 확인할 수 없다.
 * **근거 없이 정하지 않는다** — 지금은 `income.business` 만 비교한다.
 * 경감고시 원문이나 공단 해석을 확보하면 이 함수와 `docs/03-검증기록.md` 를 함께 고친다.
 */
function judgeRuralReduction(
  income: PremiumIncome,
  { ruralResident, registeredFarmer }: RegionalPremiumOptions,
): { eligible: boolean; blockedReason?: string } {
  if (!ruralResident) return { eligible: false };
  if (
    income.business > RURAL_REDUCTION.BUSINESS_INCOME_LIMIT &&
    !registeredFarmer
  ) {
    return {
      eligible: false,
      blockedReason: `사업소득이 ${RURAL_REDUCTION.BUSINESS_INCOME_LIMIT.toLocaleString('ko-KR')}원을 넘어 농어촌 경감을 적용하지 않았습니다. 농어업인으로 등록된 가입자가 세대에 있으면 경감 대상입니다.`,
    };
  }
  return { eligible: true };
}

/**
 * 지역가입자 월 보험료
 *
 * @param income 연간 소득 내역. 종류별 반영률이 다르므로 항목을 분리해서 받는다.
 * @param propertyAmount 재산금액 합계 (원). 재산세 과세표준 + 전월세평가금액.
 *                       전월세평가금액은 propertyAmountFor()로 계산한다.
 * @param options 농어촌 경감 판정에 필요한 세대 정보.
 */
export function calculateRegionalPremium(
  income: PremiumIncome,
  propertyAmount: number,
  options: RegionalPremiumOptions = {},
): PremiumBreakdown {
  const base = incomeBaseForPremium(income);
  // 공단 모의계산은 구성 보험료를 원 단위에서 절사한 뒤 합산한다.
  const incomePortion = Math.floor(base.monthly * RATE.HEALTH);

  const property = propertyScoreDetail(propertyAmount);
  const propertyPortion = Math.floor(
    property.score * RATE.PROPERTY_POINT_VALUE,
  );

  const healthBeforeLimit = incomePortion + propertyPortion;
  const { health, limitApplied } = applyLimit(
    healthBeforeLimit,
    propertyPortion,
  );

  // 경감은 건강보험료를 깎지 않고 별도 항목으로 뺀다.
  // 장기요양은 **경감 후** 금액 기준이다 — 순서를 바꾸면 장기요양이 과대 계산된다.
  const rural = judgeRuralReduction(income, options);
  const ruralReduction = rural.eligible
    ? roundPremiumUnit(health * RURAL_REDUCTION.RATE)
    : 0;
  const longTermCare = longTermCareOf(health - ruralReduction);

  return {
    incomePortion,
    incomePortionApplied: displayedIncomePortion(incomePortion),
    nonWageIncomePortion: 0,
    propertyPortion,
    propertyScore: property.score,
    propertyGrade: property.grade,
    healthBeforeLimit,
    health,
    limitApplied,
    ruralReduction,
    ruralReductionBlockedReason: rural.blockedReason,
    longTermCare,
    total: health - ruralReduction + longTermCare,
    verified: VERIFIED,
    crossChecked: VERIFIED_AGAINST_NHIS,
    basis: [
      BASIS.RATE,
      BASIS.PROPERTY_SCORE,
      BASIS.PREMIUM_LIMIT,
      ...(ruralReduction > 0 ? [BASIS.RURAL_REDUCTION] : []),
    ],
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
  income: PremiumIncome = EMPTY_PREMIUM_INCOME,
): PremiumBreakdown {
  const fullWagePremium = Math.min(
    avgMonthlyWage * RATE.HEALTH,
    VOLUNTARY_CONTINUATION.REMUNERATION_PREMIUM_UPPER,
  );
  const wagePremium = Math.floor(fullWagePremium / 2); // 보수월액보험료 50% 경감
  // 지역보험료와 같은 합산 함수를 쓴다. 인라인으로 더하면 항목이 늘 때 한쪽만 고치게 된다.
  const annualIncome = rawIncome(income);
  const excessIncome = Math.max(
    0,
    annualIncome - VOLUNTARY_CONTINUATION.NON_WAGE_INCOME_THRESHOLD,
  );
  const fullIncome = fullReflectedIncome(income);
  const halfIncome = halfReflectedIncome(income);
  const reflectedExcessIncome =
    annualIncome > 0
      ? excessIncome * ((fullIncome + halfIncome * INCOME_REFLECTION.HALF) / annualIncome)
      : 0;
  const nonWagePremium = Math.min(
    Math.floor((reflectedExcessIncome / 12) * RATE.HEALTH),
    VOLUNTARY_CONTINUATION.NON_WAGE_PREMIUM_UPPER,
  );
  const beforeLimit = wagePremium + nonWagePremium;
  const healthBeforeFloor = Math.max(beforeLimit, PREMIUM_LIMIT.LOWER);
  const health = roundPremiumUnit(healthBeforeFloor);
  const limitApplied =
    healthBeforeFloor > beforeLimit
      ? 'lower'
      : fullWagePremium === VOLUNTARY_CONTINUATION.REMUNERATION_PREMIUM_UPPER ||
          nonWagePremium === VOLUNTARY_CONTINUATION.NON_WAGE_PREMIUM_UPPER
        ? 'upper'
        : null;
  const longTermCare = longTermCareOf(health);

  return {
    incomePortion: wagePremium,
    // 임의계속은 보수월액보험료 자체에 이미 경감·상한이 반영돼 있고
    // 재산보험료가 없어 표시용 보정이 필요 없다.
    incomePortionApplied: wagePremium,
    // 임의계속가입자는 직장가입자 자격을 유지하므로 지역가입자 농어촌 경감 대상이 아니다.
    ruralReduction: 0,
    nonWageIncomePortion: nonWagePremium,
    propertyPortion: 0,
    propertyScore: 0,
    propertyGrade: null, // 재산을 반영하지 않으므로 등급 개념이 없다
    healthBeforeLimit: beforeLimit,
    health,
    limitApplied,
    longTermCare,
    total: health + longTermCare,
    // 법령·공단 산식 기반 참고 계산이며 공단 모의계산 직접 대조 전이다.
    verified: true,
    crossChecked: false,
    assumption:
      '보수 외 소득이 여러 종류인 경우 초과분에 가중 평균 평가율을 적용한 참고 계산입니다. 분리과세 주택임대소득은 지역보험료와 같은 100% 반영으로 계산했으나 임의계속가입 보험료는 공단 모의계산 직접 대조 전입니다. 실제 산정은 공단 자료와 소득별 적용 방식에 따라 달라질 수 있습니다.',
    basis: [
      BASIS.RATE,
      BASIS.PREMIUM_LIMIT,
      BASIS.VOLUNTARY_CONTINUATION,
      BASIS.NON_WAGE_INCOME,
    ],
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

export type Recommendation = 'voluntary' | 'regional' | 'tie' | 'notEligible';

export interface ComparisonNotes {
  /** 자격 미달일 때 표시할 사유 */
  ineligibleReason?: string;
  /** 자격과 관계없이 표시할 일반 안내 */
  general: string[];
}

export interface ComparisonResult {
  regional: PremiumBreakdown;
  voluntary: PremiumBreakdown | null;
  /** 더 유리한 쪽 */
  recommendation: Recommendation;
  /** 월 절약액 (원). 임의계속가입이 유리한 경우에만 양수 */
  monthlySaving: number;
  /** 최대 유지 기간 동안의 총 절약액 (원) */
  totalSaving: number;
  /** 보험료가 유지된다는 가정 아래 산출한 총액의 한계 */
  totalSavingAssumption: string;
  /** 최대 유지 개월 */
  maxMonths: number;
  /**
   * 신청 기한 안내 문구.
   * 고정 일수가 아니라 "최초 고지 납부기한 + 2개월"이라 숫자로 못 박지 않는다.
   */
  applyDeadlineRule: string;
  notes: ComparisonNotes;
}

/**
 * 지역가입자 vs 임의계속가입 비교
 *
 * 재산이 많고 퇴직 전 보수가 낮았을수록 임의계속가입이 유리하다.
 */
export function compareAfterRetirement(params: {
  income: PremiumIncome;
  propertyAmount: number;
  avgMonthlyWage: number;
  insuredMonthsInLookback: number;
  /** 지역가입자 쪽에만 적용되는 농어촌 경감 조건 */
  regionalOptions?: RegionalPremiumOptions;
}): ComparisonResult {
  const regional = calculateRegionalPremium(
    params.income,
    params.propertyAmount,
    params.regionalOptions,
  );

  const eligible = canApplyVoluntary({
    insuredMonthsInLookback: params.insuredMonthsInLookback,
  });

  const notes: ComparisonNotes = {
    general: [
      `임의계속가입은 ${VOLUNTARY_CONTINUATION.APPLY_DEADLINE_RULE} 신청하면 퇴사일로 소급 인정됩니다.`,
      `최대 ${VOLUNTARY_CONTINUATION.MAX_MONTHS}개월까지 직장가입자 자격을 유지할 수 있습니다.`,
      '임의계속가입자는 재산이 보험료에 반영되지 않고, 피부양자를 등재할 수 있습니다.',
    ],
  };

  if (!eligible) {
    notes.ineligibleReason =
      `임의계속가입은 퇴직 전 ${VOLUNTARY_CONTINUATION.LOOKBACK_MONTHS}개월 중 ` +
        `직장가입 기간이 통산 ${VOLUNTARY_CONTINUATION.REQUIRED_MONTHS}개월 이상이어야 신청할 수 있습니다. ` +
        `(입력: ${params.insuredMonthsInLookback}개월)`;
    return {
      regional,
      voluntary: null,
      recommendation: 'notEligible',
      monthlySaving: 0,
      totalSaving: 0,
      totalSavingAssumption:
        '임의계속가입 보험료 비교가 성립하지 않아 총 절약액을 계산하지 않습니다.',
      maxMonths: VOLUNTARY_CONTINUATION.MAX_MONTHS,
      applyDeadlineRule: VOLUNTARY_CONTINUATION.APPLY_DEADLINE_RULE,
      notes,
    };
  }

  const voluntary = calculateVoluntaryPremium(
    params.avgMonthlyWage,
    params.income,
  );
  const monthlySaving = regional.total - voluntary.total;

  return {
    regional,
    voluntary,
    recommendation:
      monthlySaving > 0
        ? 'voluntary'
        : monthlySaving < 0
          ? 'regional'
          : 'tie',
    monthlySaving,
    totalSaving: monthlySaving * VOLUNTARY_CONTINUATION.MAX_MONTHS,
    totalSavingAssumption:
      `현재 입력 조건과 보험료가 ${VOLUNTARY_CONTINUATION.MAX_MONTHS}개월 동안 유지된다고 가정한 단순 추정액입니다. 지역가입자 보험료는 매년 11월 소득·재산 자료가 재산정되므로 실제 차액은 달라질 수 있습니다.`,
    maxMonths: VOLUNTARY_CONTINUATION.MAX_MONTHS,
    applyDeadlineRule: VOLUNTARY_CONTINUATION.APPLY_DEADLINE_RULE,
    notes,
  };
}
