/**
 * 국민건강보험공단 공개 안내 기준 대표 사례 재현 대조.
 *
 * 2026-08-03 공단 공개 안내와 시행규칙의 관계·소득·재산 조건을 같은 입력에
 * 적용한 fixture다. 공단 로그인 모의계산 또는 실제 처리 결과와 동일하다는
 * 뜻은 아니며, 그 결과를 확보하면 docs/03-검증기록.md에 별도로 기록한다.
 */

import { describe, expect, it } from 'vitest';
import { emptyInput, judgeDependent } from './judge';
import type { DependentInput, JudgeStep } from './types';

type CaseInput = Omit<Partial<DependentInput>, 'income'> & {
  income?: Partial<DependentInput['income']>;
};

type Case = {
  name: string;
  input: CaseInput;
  eligible: boolean;
  failedAt?: JudgeStep;
};

const CASES: Case[] = [
  {
    name: '동거 부모·무소득·무재산',
    input: { relation: 'linealAscendant', cohabiting: true },
    eligible: true,
  },
  {
    name: '배우자·합산소득 2,000만원 경계',
    input: { income: { pension: 20_000_000 } },
    eligible: true,
  },
  {
    name: '사업자등록·사업소득 1원',
    input: { businessRegistered: true, income: { business: 1 } },
    eligible: false,
    failedAt: 'income',
  },
  {
    name: '재산 5.4억원 초과·소득 1,000만원',
    input: {
      propertyTaxBase: 540_000_001,
      income: { pension: 10_000_000 },
    },
    eligible: true,
  },
  {
    name: '재산 9억원 초과·소득 0원',
    input: { propertyTaxBase: 900_000_001 },
    eligible: false,
    failedAt: 'property',
  },
  {
    name: '형제자매·재산 1.8억원 초과',
    input: {
      relation: 'sibling',
      age: 29,
      cohabiting: true,
      propertyTaxBase: 180_000_001,
    },
    eligible: false,
    failedAt: 'property',
  },
  {
    name: '형제자매·만 30세 연령 경계',
    input: { relation: 'sibling', age: 30, cohabiting: true },
    eligible: false,
    failedAt: 'support',
  },
  {
    name: '비동거·기혼 직계비속',
    input: {
      relation: 'linealDescendant',
      cohabiting: false,
      married: true,
    },
    eligible: false,
    failedAt: 'support',
  },
];

function make(input: CaseInput): DependentInput {
  return {
    ...emptyInput(),
    ...input,
    income: { ...emptyInput().income, ...input.income },
  };
}

describe('공단 공개 기준 대표 사례 재현', () => {
  for (const c of CASES) {
    it(c.name, () => {
      const result = judgeDependent(make(c.input));
      expect(result.eligible).toBe(c.eligible);
      if (c.failedAt) expect(result.failedAt).toBe(c.failedAt);
    });
  }
});
