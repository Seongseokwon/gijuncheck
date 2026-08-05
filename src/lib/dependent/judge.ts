/**
 * 건강보험 피부양자 자격 판정
 *
 * 부양요건 → 소득요건 → 재산요건 을 순차 판정한다.
 * 어느 한 단계에서 탈락하면 그 단계까지의 결과만 반환한다.
 *
 * 이 파일에는 숫자 리터럴을 쓰지 않는다. 모든 기준은 constants 에서 가져온다.
 */

import {
  BASIS,
  INCOME,
  PROPERTY,
  RATE,
  SIBLING_AGE,
  YEAR,
} from '../constants/2026';
import type {
  DependentInput,
  Income,
  JudgeResult,
  SpouseDetails,
  StepResult,
} from './types';
import { josa, toEok, toManwon } from '../format';

// 기존 import 경로를 깨지 않기 위해 재수출한다.
export { toEok, toManwon };

/**
 * 합산소득에 반영되는 금융소득.
 *
 * 1,000만원 이하면 전액 제외, 초과하면 전액 합산한다.
 * 초과분만 더하는 것이 아니라는 점이 함정이다.
 */
export function countableFinancialIncome(financial: number): number {
  return financial > INCOME.FINANCIAL_INCLUSION_THRESHOLD ? financial : 0;
}

/**
 * 피부양자 소득요건 판정용 합산소득.
 *
 * - 공적연금은 **총연금액 전액**을 합산한다. 연금소득공제를 적용하지 않는다.
 *   (보험료 계산에서는 50%만 반영하지만 자격 판정은 다르다.)
 * - 사적연금(연금저축·IRP)은 합산 대상이 아니므로 income.pension 에 넣지 않는다.
 * - 금융소득은 1,000만원 문턱을 넘을 때만 전액 합산한다.
 */
export function sumIncome(income: Income): number {
  return (
    income.business +
    income.wage +
    income.pension +
    countableFinancialIncome(income.financial) +
    income.other
  );
}

function isMarried(input: DependentInput): boolean {
  return (
    input.maritalStatus === 'married' ||
    (input.maritalStatus === undefined && input.married)
  );
}

function needsSpouseCheck(input: DependentInput): boolean {
  return isMarried(input) && input.relation !== 'spouse';
}

/* ------------------------------------------------------------------ */
/* 1단 — 부양요건                                                      */
/* ------------------------------------------------------------------ */

function judgeSupport(input: DependentInput): StepResult {
  const { relation, cohabiting, age, disabled } = input;
  const married = isMarried(input);
  const basis = BASIS.SUPPORT;
  const step = 'support' as const;

  switch (relation) {
    case 'spouse':
      return {
        step,
        passed: true,
        message: '배우자는 동거 여부와 무관하게 부양이 인정됩니다.',
        basis,
      };

    case 'linealAscendant':
    case 'spouseAscendant': {
      if (cohabiting) {
        return {
          step,
          passed: true,
          message: '동거하는 직계존속은 부양이 인정됩니다.',
          basis,
        };
      }
      if (input.cohabitingSiblingHasIncome === true) {
        return {
          step,
          passed: false,
          message:
            '비동거 직계존속입니다. 대상자와 동거하는 다른 형제자매에게 소득이 있어 ' +
            '그 형제자매가 부양하는 것으로 봅니다.',
          basis,
        };
      }
      return {
        step,
        passed: true,
        message:
          '비동거 직계존속이지만, 대상자와 동거하며 소득이 있는 형제자매가 없어 부양이 인정됩니다.',
        basis,
      };
    }

    case 'linealDescendant':
    case 'spouseDescendant': {
      if (cohabiting) {
        return {
          step,
          passed: true,
          message: '동거하는 직계비속은 부양이 인정됩니다.',
          basis,
        };
      }
      if (married) {
        return {
          step,
          passed: false,
          message: '비동거 직계비속은 미혼인 경우에만 부양이 인정됩니다.',
          basis,
        };
      }
      return {
        step,
        passed: true,
        message: '비동거 직계비속이지만 미혼이므로 부양이 인정됩니다.',
        basis,
      };
    }

    case 'sibling': {
      if (married) {
        return {
          step,
          passed: false,
          message: '형제자매는 미혼인 경우에만 부양이 인정됩니다.',
          basis,
        };
      }
      const ageOk =
        age < SIBLING_AGE.YOUNG_UNDER || age >= SIBLING_AGE.OLD_FROM;
      if (!ageOk && !disabled) {
        return {
          step,
          passed: false,
          message:
            `형제자매는 만 ${SIBLING_AGE.YOUNG_UNDER}세 미만 또는 ` +
            `만 ${SIBLING_AGE.OLD_FROM}세 이상이거나 장애인인 경우에만 부양이 인정됩니다. ` +
            `(입력: 만 ${age}세)`,
          basis,
        };
      }
      if (!cohabiting) {
        return {
          step,
          passed: false,
          message: '형제자매는 원칙적으로 동거하는 경우에만 부양이 인정됩니다.',
          basis,
        };
      }
      return {
        step,
        passed: true,
        message: disabled
          ? '장애인인 미혼 형제자매로서 동거하므로 부양이 인정됩니다.'
          : `만 ${age}세 미혼 형제자매로서 동거하므로 부양이 인정됩니다.`,
        basis,
      };
    }
  }
}

/* ------------------------------------------------------------------ */
/* 2단 — 소득요건                                                      */
/* ------------------------------------------------------------------ */

function judgeIncomeForPerson(
  income: Income,
  businessRegistered: boolean,
  disabled: boolean,
  total: number,
  subject: string,
): StepResult {
  const basis = BASIS.INCOME;
  const step = 'income' as const;

  // 사업소득 특례를 합산소득보다 먼저 본다.
  // 사업자등록이 있으면 사업소득 1원만 있어도 탈락하기 때문.
  if (disabled) {
    if (income.business > INCOME.BUSINESS_LIMIT_DISABLED) {
      return {
        step,
        passed: false,
        message:
          `장애인·국가유공상이자는 사업자등록 여부와 무관하게 사업소득이 ` +
          `${toManwon(INCOME.BUSINESS_LIMIT_DISABLED)} 이하여야 합니다. ` +
          `(${subject} 입력: ${toManwon(income.business)})`,
        basis,
      };
    }
  } else if (businessRegistered) {
    if (income.business > INCOME.BUSINESS_LIMIT_REGISTERED) {
      return {
        step,
        passed: false,
        message:
          '사업자등록이 있는 경우 사업소득이 발생하면 금액과 무관하게 탈락합니다. ' +
          `(${subject} 입력: ${toManwon(income.business)})`,
        basis,
      };
    }
  } else {
    if (income.business > INCOME.BUSINESS_LIMIT_UNREGISTERED) {
      return {
        step,
        passed: false,
        message:
          `사업자등록이 없는 경우 사업소득이 연 ${toManwon(
            INCOME.BUSINESS_LIMIT_UNREGISTERED,
          )} 이하여야 합니다. (${subject} 입력: ${toManwon(income.business)})`,
        basis,
      };
    }
  }

  if (total > INCOME.TOTAL_LIMIT) {
    return {
      step,
      passed: false,
      message:
        `합산소득이 연 ${josa(toManwon(INCOME.TOTAL_LIMIT), '을')} 초과합니다. ` +
        `(${subject} 합계: ${toManwon(total)}) 1원만 초과해도 탈락합니다.`,
      basis,
    };
  }

  return {
    step,
    passed: true,
    message:
      `합산소득 ${toManwon(total)}으로 연 ${toManwon(
        INCOME.TOTAL_LIMIT,
      )} 이하이며 ${subject}의 사업소득 요건도 충족합니다.`,
    basis,
  };
}

function judgeIncome(input: DependentInput, total: number): StepResult {
  const primary = judgeIncomeForPerson(
    input.income,
    input.businessRegistered,
    input.disabled,
    total,
    '대상자',
  );
  if (!primary.passed) return primary;

  if (!needsSpouseCheck(input)) return primary;

  const spouse = input.spouse;
  if (!spouse) {
    return {
      step: 'income',
      passed: false,
      message: '기혼 피부양자의 배우자 소득·사업자등록 자료가 입력되지 않았습니다.',
      basis: BASIS.INCOME,
    };
  }

  const spouseTotal = sumIncome(spouse.income);
  const spouseResult = judgeIncomeForPerson(
    spouse.income,
    spouse.businessRegistered,
    spouse.disabled,
    spouseTotal,
    '배우자',
  );
  if (!spouseResult.passed) {
    return {
      ...spouseResult,
      message: `대상자는 소득요건을 충족했지만 ${spouseResult.message}`,
    };
  }

  return {
    ...primary,
    message: `${primary.message} 배우자도 소득요건을 충족합니다 (${toManwon(spouseTotal)}).`,
  };
}

/* ------------------------------------------------------------------ */
/* 3단 — 재산요건                                                      */
/* ------------------------------------------------------------------ */

function judgePropertyForPerson(
  relation: DependentInput['relation'],
  propertyTaxBase: number,
  total: number,
  subject: string,
): StepResult {
  const basis = BASIS.PROPERTY;
  const step = 'property' as const;
  const p = propertyTaxBase;

  // 형제자매는 별도의 더 엄격한 기준을 적용한다.
  if (relation === 'sibling') {
    if (p > PROPERTY.SIBLING_LIMIT) {
      return {
        step,
        passed: false,
        message:
          `${subject}의 재산세 과세표준이 ${toEok(
            PROPERTY.SIBLING_LIMIT,
          )} 이하여야 합니다. (${subject} 입력: ${toEok(p)})`,
        basis,
      };
    }
    return {
      step,
      passed: true,
      message: `${subject}의 재산세 과세표준 ${toEok(p)}으로 형제자매 기준 ${toEok(
        PROPERTY.SIBLING_LIMIT,
      )} 이하입니다.`,
      basis,
    };
  }

  if (p <= PROPERTY.SAFE_LIMIT) {
    return {
      step,
      passed: true,
      message: `${subject}의 재산세 과세표준 ${toEok(p)}으로 ${toEok(
        PROPERTY.SAFE_LIMIT,
      )} 이하입니다.`,
      basis,
    };
  }

  if (p <= PROPERTY.HARD_LIMIT) {
    if (total <= INCOME.MID_PROPERTY_INCOME_LIMIT) {
      return {
        step,
        passed: true,
        message:
          `${subject}의 재산세 과세표준이 ${toEok(PROPERTY.SAFE_LIMIT)} 초과 ${toEok(
            PROPERTY.HARD_LIMIT,
          )} 이하 구간이지만, ` +
          `${subject}의 연소득이 ${toManwon(
            INCOME.MID_PROPERTY_INCOME_LIMIT,
          )} 이하이므로 인정됩니다.`,
        basis,
      };
    }
    return {
      step,
      passed: false,
      message:
        `${subject}의 재산세 과세표준이 ${toEok(PROPERTY.SAFE_LIMIT)} 초과 ${toEok(
          PROPERTY.HARD_LIMIT,
        )} 이하 구간에서는 ` +
        `${subject}의 연소득이 ${toManwon(
          INCOME.MID_PROPERTY_INCOME_LIMIT,
        )} 이하여야 합니다. (${subject} 소득: ${toManwon(total)})`,
      basis,
    };
  }

  return {
    step,
    passed: false,
    message:
      `${subject}의 재산세 과세표준이 ${toEok(
        PROPERTY.HARD_LIMIT,
      )}을 초과하면 소득이 없어도 탈락합니다. (${subject} 입력: ${toEok(p)})`,
    basis,
  };
}

function judgeProperty(input: DependentInput, total: number): StepResult {
  const primary = judgePropertyForPerson(
    input.relation,
    input.propertyTaxBase,
    total,
    '대상자',
  );
  if (!primary.passed) return primary;

  if (!needsSpouseCheck(input)) return primary;

  const spouse = input.spouse;
  if (!spouse) {
    return {
      step: 'property',
      passed: false,
      message: '기혼 피부양자의 배우자 재산세 과세표준 자료가 입력되지 않았습니다.',
      basis: BASIS.PROPERTY,
    };
  }

  const spouseResult = judgePropertyForPerson(
    'spouse',
    spouse.propertyTaxBase,
    sumIncome(spouse.income),
    '배우자',
  );
  if (!spouseResult.passed) {
    return {
      ...spouseResult,
      message: `대상자는 재산요건을 충족했지만 ${spouseResult.message}`,
    };
  }

  return {
    ...primary,
    message: `${primary.message} 배우자도 재산요건을 충족합니다 (${toEok(spouse.propertyTaxBase)}).`,
  };
}

/* ------------------------------------------------------------------ */
/* 최종 판정                                                            */
/* ------------------------------------------------------------------ */

export function judgeDependent(input: DependentInput): JudgeResult {
  const totalIncome = sumIncome(input.income);
  const spouseTotalIncome = needsSpouseCheck(input) && input.spouse
    ? sumIncome(input.spouse.income)
    : undefined;
  const steps: StepResult[] = [];

  const support = judgeSupport(input);
  steps.push(support);
  if (!support.passed) {
    return { eligible: false, totalIncome, spouseTotalIncome, steps, failedAt: 'support', year: YEAR };
  }

  const incomeResult = judgeIncome(input, totalIncome);
  steps.push(incomeResult);
  if (!incomeResult.passed) {
    return { eligible: false, totalIncome, spouseTotalIncome, steps, failedAt: 'income', year: YEAR };
  }

  const property = judgeProperty(input, totalIncome);
  steps.push(property);
  if (!property.passed) {
    return { eligible: false, totalIncome, spouseTotalIncome, steps, failedAt: 'property', year: YEAR };
  }

  return { eligible: true, totalIncome, spouseTotalIncome, steps, year: YEAR };
}

export function emptySpouseDetails(): SpouseDetails {
  return {
    income: { business: 0, wage: 0, pension: 0, financial: 0, other: 0 },
    businessRegistered: false,
    disabled: false,
    propertyTaxBase: 0,
  };
}

/** 빈 입력값 — 폼 초기화용 */
export function emptyInput(): DependentInput {
  return {
    relation: 'linealAscendant',
    cohabiting: true,
    age: 65,
    married: false,
    disabled: false,
    income: { business: 0, wage: 0, pension: 0, financial: 0, other: 0 },
    businessRegistered: false,
    propertyTaxBase: 0,
    cohabitingSiblingHasIncome: false,
    spouse: emptySpouseDetails(),
  };
}

export { RATE };
