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
  StepResult,
} from './types';

/** 억 단위로 읽기 쉽게 변환 — 540000000 → "5.4억원" */
export function toEok(won: number): string {
  const eok = won / 100_000_000;
  return `${Number.isInteger(eok) ? eok : eok.toFixed(1)}억원`;
}

/** 만원 단위 — 20000000 → "2,000만원" */
export function toManwon(won: number): string {
  return `${(won / 10_000).toLocaleString('ko-KR')}만원`;
}

/** 합산소득. 사적연금은 합산 대상이 아니므로 income.pension 에는 공적연금만 넣는다. */
export function sumIncome(income: Income): number {
  return (
    income.business +
    income.wage +
    income.pension +
    income.financial +
    income.other
  );
}

/* ------------------------------------------------------------------ */
/* 1단 — 부양요건                                                      */
/* ------------------------------------------------------------------ */

function judgeSupport(input: DependentInput): StepResult {
  const { relation, cohabiting, age, married, disabled } = input;
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

function judgeIncome(input: DependentInput, total: number): StepResult {
  const { businessRegistered, disabled, income } = input;
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
          `(입력: ${toManwon(income.business)})`,
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
          `(입력: ${toManwon(income.business)})`,
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
          )} 이하여야 합니다. (입력: ${toManwon(income.business)})`,
        basis,
      };
    }
  }

  if (total > INCOME.TOTAL_LIMIT) {
    return {
      step,
      passed: false,
      message:
        `합산소득이 연 ${toManwon(INCOME.TOTAL_LIMIT)}를 초과합니다. ` +
        `(입력 합계: ${toManwon(total)}) 1원만 초과해도 탈락합니다.`,
      basis,
    };
  }

  return {
    step,
    passed: true,
    message:
      `합산소득 ${toManwon(total)}으로 연 ${toManwon(
        INCOME.TOTAL_LIMIT,
      )} 이하이며, 사업소득 요건도 충족합니다.`,
    basis,
  };
}

/* ------------------------------------------------------------------ */
/* 3단 — 재산요건                                                      */
/* ------------------------------------------------------------------ */

function judgeProperty(input: DependentInput, total: number): StepResult {
  const { relation, propertyTaxBase } = input;
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
          `형제자매는 재산세 과세표준이 ${toEok(
            PROPERTY.SIBLING_LIMIT,
          )} 이하여야 합니다. (입력: ${toEok(p)})`,
        basis,
      };
    }
    return {
      step,
      passed: true,
      message: `재산세 과세표준 ${toEok(p)}으로 형제자매 기준 ${toEok(
        PROPERTY.SIBLING_LIMIT,
      )} 이하입니다.`,
      basis,
    };
  }

  if (p <= PROPERTY.SAFE_LIMIT) {
    return {
      step,
      passed: true,
      message: `재산세 과세표준 ${toEok(p)}으로 ${toEok(
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
          `재산세 과세표준이 ${toEok(PROPERTY.SAFE_LIMIT)} 초과 ${toEok(
            PROPERTY.HARD_LIMIT,
          )} 이하 구간이지만, ` +
          `연소득이 ${toManwon(
            INCOME.MID_PROPERTY_INCOME_LIMIT,
          )} 이하이므로 인정됩니다.`,
        basis,
      };
    }
    return {
      step,
      passed: false,
      message:
        `재산세 과세표준이 ${toEok(PROPERTY.SAFE_LIMIT)} 초과 ${toEok(
          PROPERTY.HARD_LIMIT,
        )} 이하 구간에서는 ` +
        `연소득이 ${toManwon(
          INCOME.MID_PROPERTY_INCOME_LIMIT,
        )} 이하여야 합니다. (입력 소득: ${toManwon(total)})`,
      basis,
    };
  }

  return {
    step,
    passed: false,
    message:
      `재산세 과세표준이 ${toEok(
        PROPERTY.HARD_LIMIT,
      )}를 초과하면 소득이 없어도 탈락합니다. (입력: ${toEok(p)})`,
    basis,
  };
}

/* ------------------------------------------------------------------ */
/* 최종 판정                                                            */
/* ------------------------------------------------------------------ */

export function judgeDependent(input: DependentInput): JudgeResult {
  const totalIncome = sumIncome(input.income);
  const steps: StepResult[] = [];

  const support = judgeSupport(input);
  steps.push(support);
  if (!support.passed) {
    return { eligible: false, totalIncome, steps, failedAt: 'support', year: YEAR };
  }

  const incomeResult = judgeIncome(input, totalIncome);
  steps.push(incomeResult);
  if (!incomeResult.passed) {
    return { eligible: false, totalIncome, steps, failedAt: 'income', year: YEAR };
  }

  const property = judgeProperty(input, totalIncome);
  steps.push(property);
  if (!property.passed) {
    return { eligible: false, totalIncome, steps, failedAt: 'property', year: YEAR };
  }

  return { eligible: true, totalIncome, steps, year: YEAR };
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
  };
}

export { RATE };
