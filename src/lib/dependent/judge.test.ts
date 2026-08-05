/**
 * 피부양자 판정 경계값 테스트
 *
 * 여기 있는 케이스들이 사용자가 실제로 확인하러 오는 지점입니다.
 * "2,000만원 딱 맞으면?", "9억 넘으면?", "만 30세면?"
 * 하나라도 틀리면 사이트 신뢰가 무너집니다.
 */

import { describe, expect, it } from 'vitest';
import {
  countableFinancialIncome,
  emptyInput,
  judgeDependent,
  sumIncome,
  toEok,
  toManwon,
} from './judge';
import type { DependentInput, Relation } from './types';

/** 통과하는 기본 입력을 만들고 일부만 덮어쓴다 */
function make(overrides: Partial<DependentInput> = {}): DependentInput {
  return { ...emptyInput(), ...overrides };
}

function withIncome(
  partial: Partial<DependentInput['income']>,
  overrides: Partial<DependentInput> = {},
): DependentInput {
  return make({
    ...overrides,
    income: { ...emptyInput().income, ...partial },
  });
}

/* ------------------------------------------------------------------ */
describe('기본 동작', () => {
  it('소득·재산이 없는 동거 부모는 자격이 인정된다', () => {
    const r = judgeDependent(make());
    expect(r.eligible).toBe(true);
    expect(r.steps).toHaveLength(3);
    expect(r.year).toBe(2026);
  });

  it('합산소득은 항목을 더한다 (금융소득은 문턱 미달로 제외)', () => {
    expect(
      sumIncome({
        business: 1_000_000,
        wage: 2_000_000,
        pension: 3_000_000,
        financial: 4_000_000, // 1,000만원 이하 → 제외
        other: 5_000_000,
      }),
    ).toBe(11_000_000);
  });

  it('탈락 시 이후 단계는 판정하지 않는다', () => {
    const r = judgeDependent(make({ relation: 'sibling', married: true }));
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('support');
    expect(r.steps).toHaveLength(1); // 소득·재산 단계까지 가지 않는다
  });
});

/* ------------------------------------------------------------------ */
describe('소득요건 — 합산소득 2,000만원 경계', () => {
  it('정확히 2,000만원이면 통과한다', () => {
    const r = judgeDependent(withIncome({ pension: 20_000_000 }));
    expect(r.eligible).toBe(true);
  });

  it('2,000만원 + 1원이면 탈락한다', () => {
    const r = judgeDependent(withIncome({ pension: 20_000_001 }));
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('income');
  });

  it('여러 소득의 합이 2,000만원을 넘으면 탈락한다', () => {
    const r = judgeDependent(
      withIncome({ wage: 15_000_000, other: 5_000_001 }),
    );
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('income');
  });
});

/* ------------------------------------------------------------------ */
describe('소득요건 — 금융소득 1,000만원 문턱', () => {
  it('1,000만원 이하면 합산에서 전액 제외된다', () => {
    expect(countableFinancialIncome(0)).toBe(0);
    expect(countableFinancialIncome(5_000_000)).toBe(0);
    expect(countableFinancialIncome(10_000_000)).toBe(0);
  });

  it('1,000만원 + 1원이면 초과분이 아니라 전액이 합산된다', () => {
    expect(countableFinancialIncome(10_000_001)).toBe(10_000_001);
    expect(countableFinancialIncome(12_000_000)).toBe(12_000_000);
  });

  it('금융소득 900만 + 근로소득 1,500만은 인정된다 (합산 1,500만)', () => {
    // 문턱을 무시하고 더하면 2,400만이 되어 잘못 탈락시킨다
    const r = judgeDependent(
      withIncome({ financial: 9_000_000, wage: 15_000_000 }),
    );
    expect(r.totalIncome).toBe(15_000_000);
    expect(r.eligible).toBe(true);
  });

  it('금융소득 1,100만 + 근로소득 1,500만은 탈락한다 (합산 2,600만)', () => {
    const r = judgeDependent(
      withIncome({ financial: 11_000_000, wage: 15_000_000 }),
    );
    expect(r.totalIncome).toBe(26_000_000);
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('income');
  });

  it('금융소득만 1,200만원이면 합산 1,200만원으로 인정된다', () => {
    // "금융소득 1,000만원 초과 = 즉시 탈락" 은 틀린 설명이다.
    // 전액 합산된 결과가 2,000만원을 넘어야 탈락한다.
    const r = judgeDependent(withIncome({ financial: 12_000_000 }));
    expect(r.totalIncome).toBe(12_000_000);
    expect(r.eligible).toBe(true);
  });

  it('재산 5.4억 초과 구간에서는 금융소득 1,200만원만으로도 탈락한다', () => {
    // 이때 걸리는 1,000만원은 재산요건의 소득 상한이고
    // 금융소득 문턱과는 다른 기준이다.
    const r = judgeDependent(
      withIncome({ financial: 12_000_000 }, { propertyTaxBase: 600_000_000 }),
    );
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('property');
  });
});

/* ------------------------------------------------------------------ */
describe('소득요건 — 사업소득 특례', () => {
  it('사업자등록이 있고 사업소득이 0원이면 통과한다', () => {
    const r = judgeDependent(
      withIncome({ business: 0 }, { businessRegistered: true }),
    );
    expect(r.eligible).toBe(true);
  });

  it('사업자등록이 있고 사업소득이 1원이라도 있으면 탈락한다', () => {
    const r = judgeDependent(
      withIncome({ business: 1 }, { businessRegistered: true }),
    );
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('income');
  });

  it('사업자등록이 없으면 사업소득 500만원까지 통과한다', () => {
    const r = judgeDependent(
      withIncome({ business: 5_000_000 }, { businessRegistered: false }),
    );
    expect(r.eligible).toBe(true);
  });

  it('사업자등록이 없어도 사업소득 500만원 + 1원이면 탈락한다', () => {
    const r = judgeDependent(
      withIncome({ business: 5_000_001 }, { businessRegistered: false }),
    );
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('income');
  });

  it('장애인은 사업자등록이 있어도 사업소득 500만원까지 통과한다', () => {
    const r = judgeDependent(
      withIncome(
        { business: 5_000_000 },
        { businessRegistered: true, disabled: true },
      ),
    );
    expect(r.eligible).toBe(true);
  });

  it('장애인도 사업소득 500만원을 넘으면 탈락한다', () => {
    const r = judgeDependent(
      withIncome(
        { business: 5_000_001 },
        { businessRegistered: true, disabled: true },
      ),
    );
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('income');
  });

  it('사업소득 특례는 합산소득 판정보다 먼저 적용된다', () => {
    // 합산소득은 2,000만원 이하지만 사업자등록자의 사업소득이 있는 경우
    const r = judgeDependent(
      withIncome({ business: 1_000_000 }, { businessRegistered: true }),
    );
    expect(r.eligible).toBe(false);
    expect(r.steps[1].message).toContain('사업자등록');
  });
});

/* ------------------------------------------------------------------ */
describe('재산요건 — 과세표준 구간 경계', () => {
  it('과표 5.4억 정확히면 소득과 무관하게 통과한다', () => {
    const r = judgeDependent(
      withIncome({ pension: 20_000_000 }, { propertyTaxBase: 540_000_000 }),
    );
    expect(r.eligible).toBe(true);
  });

  it('과표 5.4억 + 1원이고 소득 1,000만원이면 통과한다', () => {
    const r = judgeDependent(
      withIncome({ pension: 10_000_000 }, { propertyTaxBase: 540_000_001 }),
    );
    expect(r.eligible).toBe(true);
  });

  it('과표 5.4억 + 1원이고 소득 1,000만원 + 1원이면 탈락한다', () => {
    const r = judgeDependent(
      withIncome({ pension: 10_000_001 }, { propertyTaxBase: 540_000_001 }),
    );
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('property');
  });

  it('과표 9억 정확히고 소득 1,000만원이면 통과한다', () => {
    const r = judgeDependent(
      withIncome({ pension: 10_000_000 }, { propertyTaxBase: 900_000_000 }),
    );
    expect(r.eligible).toBe(true);
  });

  it('과표 9억 + 1원이면 소득이 0원이어도 탈락한다', () => {
    const r = judgeDependent(make({ propertyTaxBase: 900_000_001 }));
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('property');
    expect(r.steps[2].message).toContain('소득이 없어도');
  });
});

/* ------------------------------------------------------------------ */
describe('재산요건 — 형제자매 1.8억 기준', () => {
  const sibling = (overrides: Partial<DependentInput> = {}) =>
    make({ relation: 'sibling', age: 25, cohabiting: true, ...overrides });

  it('형제자매는 과표 1.8억 정확히면 통과한다', () => {
    const r = judgeDependent(sibling({ propertyTaxBase: 180_000_000 }));
    expect(r.eligible).toBe(true);
  });

  it('형제자매는 과표 1.8억 + 1원이면 탈락한다', () => {
    const r = judgeDependent(sibling({ propertyTaxBase: 180_000_001 }));
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('property');
  });

  it('일반 관계라면 통과하는 3억도 형제자매는 탈락한다', () => {
    expect(
      judgeDependent(make({ propertyTaxBase: 300_000_000 })).eligible,
    ).toBe(true);
    expect(
      judgeDependent(sibling({ propertyTaxBase: 300_000_000 })).eligible,
    ).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
describe('부양요건 — 형제자매 연령·혼인·동거', () => {
  const sibling = (overrides: Partial<DependentInput> = {}) =>
    make({ relation: 'sibling', cohabiting: true, married: false, ...overrides });

  it('만 29세 미혼 동거는 통과한다', () => {
    expect(judgeDependent(sibling({ age: 29 })).eligible).toBe(true);
  });

  it('만 30세는 탈락한다 (30세 미만이어야 함)', () => {
    const r = judgeDependent(sibling({ age: 30 }));
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('support');
  });

  it('만 64세는 탈락한다', () => {
    expect(judgeDependent(sibling({ age: 64 })).eligible).toBe(false);
  });

  it('만 65세는 통과한다', () => {
    expect(judgeDependent(sibling({ age: 65 })).eligible).toBe(true);
  });

  it('만 40세라도 장애인이면 통과한다', () => {
    expect(
      judgeDependent(sibling({ age: 40, disabled: true })).eligible,
    ).toBe(true);
  });

  it('연령 요건을 충족해도 기혼이면 탈락한다', () => {
    const r = judgeDependent(sibling({ age: 25, married: true }));
    expect(r.eligible).toBe(false);
    expect(r.steps[0].message).toContain('미혼');
  });

  it('연령·혼인 요건을 충족해도 비동거면 탈락한다', () => {
    const r = judgeDependent(sibling({ age: 25, cohabiting: false }));
    expect(r.eligible).toBe(false);
    expect(r.steps[0].message).toContain('동거');
  });
});

/* ------------------------------------------------------------------ */
describe('부양요건 — 관계별', () => {
  it('배우자는 비동거여도 통과한다', () => {
    expect(
      judgeDependent(make({ relation: 'spouse', cohabiting: false })).eligible,
    ).toBe(true);
  });

  it('비동거 직계존속은 동거 형제자매에게 소득이 있으면 탈락한다', () => {
    const r = judgeDependent(
      make({
        relation: 'linealAscendant',
        cohabiting: false,
        cohabitingSiblingHasIncome: true,
      }),
    );
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('support');
  });

  it('비동거 직계존속은 동거 형제자매에게 소득이 없으면 통과한다', () => {
    const r = judgeDependent(
      make({
        relation: 'linealAscendant',
        cohabiting: false,
        cohabitingSiblingHasIncome: false,
      }),
    );
    expect(r.eligible).toBe(true);
  });

  it('비동거 직계비속은 기혼이면 탈락한다', () => {
    const r = judgeDependent(
      make({ relation: 'linealDescendant', cohabiting: false, married: true }),
    );
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('support');
  });

  it('비동거 직계비속은 미혼이면 통과한다', () => {
    expect(
      judgeDependent(
        make({
          relation: 'linealDescendant',
          cohabiting: false,
          married: false,
        }),
      ).eligible,
    ).toBe(true);
  });

  it('이혼·사별 상태는 현재 혼인 상태가 아닌 것으로 우선 판정한다', () => {
    const r = judgeDependent(
      make({
        relation: 'linealDescendant',
        cohabiting: false,
        maritalStatus: 'divorcedOrWidowed',
        married: false,
      }),
    );
    expect(r.eligible).toBe(true);
  });

  it('동거 직계비속은 기혼이어도 부양요건을 통과한다', () => {
    const r = judgeDependent(
      make({ relation: 'linealDescendant', cohabiting: true, married: true }),
    );
    expect(r.steps[0].passed).toBe(true);
  });

  it('배우자의 직계존속은 직계존속과 동일하게 판정된다', () => {
    const pairs: Array<[Relation, Relation]> = [
      ['linealAscendant', 'spouseAscendant'],
      ['linealDescendant', 'spouseDescendant'],
    ];
    for (const [a, b] of pairs) {
      const base = { cohabiting: false, married: true } as const;
      expect(judgeDependent(make({ relation: a, ...base })).eligible).toBe(
        judgeDependent(make({ relation: b, ...base })).eligible,
      );
    }
  });
});

/* ------------------------------------------------------------------ */
describe('기혼 피부양자 — 배우자 동반 요건', () => {
  const marriedDependent = (spouseOverrides: Partial<NonNullable<DependentInput['spouse']>> = {}) =>
    make({
      relation: 'linealDescendant',
      cohabiting: true,
      married: true,
      maritalStatus: 'married',
      spouse: {
        ...emptyInput().spouse!,
        ...spouseOverrides,
        income: {
          ...emptyInput().spouse!.income,
          ...(spouseOverrides.income ?? {}),
        },
      },
    });

  it('대상자와 배우자가 각각 소득·재산 기준 이하면 통과한다', () => {
    const r = judgeDependent(
      marriedDependent({ income: { ...emptyInput().spouse!.income, pension: 20_000_000 } }),
    );
    expect(r.eligible).toBe(true);
    expect(r.spouseTotalIncome).toBe(20_000_000);
    expect(r.steps[1].message).toContain('배우자도 소득요건을 충족');
  });

  it('배우자 합산소득이 2,000만원을 1원 초과하면 소득요건에서 탈락한다', () => {
    const r = judgeDependent(
      marriedDependent({ income: { ...emptyInput().spouse!.income, pension: 20_000_001 } }),
    );
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('income');
    expect(r.steps[1].message).toContain('배우자');
  });

  it('배우자 재산세 과세표준이 9억원을 넘으면 재산요건에서 탈락한다', () => {
    const r = judgeDependent(
      marriedDependent({ propertyTaxBase: 900_000_001 }),
    );
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('property');
    expect(r.steps[2].message).toContain('배우자');
  });
});

/* ------------------------------------------------------------------ */
describe('결과에 근거가 포함된다', () => {
  it('모든 단계에 근거 조항이 붙는다', () => {
    const r = judgeDependent(make());
    for (const step of r.steps) {
      expect(step.basis).toContain('국민건강보험법 시행규칙');
    }
  });

  it('탈락 사유에 입력값이 표시된다', () => {
    const r = judgeDependent(withIncome({ pension: 25_000_000 }));
    expect(r.steps[1].message).toContain('2,500만원');
  });
});

/* ------------------------------------------------------------------ */
describe('표시 형식 헬퍼', () => {
  it('toEok', () => {
    expect(toEok(540_000_000)).toBe('5.4억원');
    expect(toEok(900_000_000)).toBe('9억원');
    expect(toEok(180_000_000)).toBe('1.8억원');
  });

  it('toManwon', () => {
    expect(toManwon(20_000_000)).toBe('2,000만원');
    expect(toManwon(5_000_000)).toBe('500만원');
  });
});

/* ------------------------------------------------------------------ */
describe('실제 시나리오', () => {
  it('시나리오 B — 프리랜서가 사업자등록을 하면 탈락한다', () => {
    const income = { business: 3_000_000 };
    const before = judgeDependent(
      withIncome(income, { businessRegistered: false }),
    );
    const after = judgeDependent(
      withIncome(income, { businessRegistered: true }),
    );

    expect(before.eligible).toBe(true); // 등록 전: 500만원 이하라 유지
    expect(after.eligible).toBe(false); // 등록 후: 1원이라도 있으면 탈락
  });

  it('시나리오 D — 연금 개시로 합산소득이 넘으면 탈락한다', () => {
    const before = judgeDependent(withIncome({ pension: 0 }));
    const after = judgeDependent(withIncome({ pension: 24_000_000 }));

    expect(before.eligible).toBe(true);
    expect(after.eligible).toBe(false);
    expect(after.failedAt).toBe('income');
  });

  it('시나리오 — 소득은 적지만 집이 비싼 은퇴자는 재산요건에서 탈락한다', () => {
    const r = judgeDependent(
      withIncome({ pension: 12_000_000 }, { propertyTaxBase: 700_000_000 }),
    );
    expect(r.eligible).toBe(false);
    expect(r.failedAt).toBe('property');
    expect(r.steps[0].passed).toBe(true); // 부양요건은 통과
    expect(r.steps[1].passed).toBe(true); // 소득요건도 통과
  });
});
