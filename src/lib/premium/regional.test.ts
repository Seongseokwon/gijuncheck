import { describe, expect, it } from 'vitest';
import {
  calculateRegionalPremium,
  calculateVoluntaryPremium,
  canApplyVoluntary,
  compareAfterRetirement,
  incomeBaseForPremium,
  longTermCareRatio,
} from './regional';
import { INCOME_REFLECTION, PREMIUM_LIMIT, RATE } from '../constants/2026';
import {
  BASIC_DEDUCTION,
  PROPERTY_BRACKETS,
  rentEvaluationAmount,
  VERIFIED,
  VERIFIED_AGAINST_NHIS,
  propertyScore,
  propertyScoreDetail,
} from '../constants/property-score-table';
import type { Income } from '../dependent/types';

/** 만원 → 원 */
const man = (n: number) => n * 10_000;
/** 기본공제 후 금액이 정확히 n만원이 되는 재산금액 */
const afterDeduction = (manwon: number) => BASIC_DEDUCTION + man(manwon);

const noIncome: Income = {
  business: 0,
  wage: 0,
  pension: 0,
  financial: 0,
  other: 0,
};
const income = (p: Partial<Income>): Income => ({ ...noIncome, ...p });

describe('요율·한도', () => {
  it('2026년 건강보험료율은 7.19%다', () => {
    expect(RATE.HEALTH).toBeCloseTo(0.0719, 6);
  });

  it('2026년 장기요양보험료율은 0.9448%다', () => {
    expect(RATE.LONG_TERM_CARE).toBeCloseTo(0.009448, 8);
  });

  it('재산점수당 금액은 211.5원이다', () => {
    expect(RATE.PROPERTY_POINT_VALUE).toBe(211.5);
  });

  it('장기요양 환산율은 약 13.14%다', () => {
    expect(longTermCareRatio()).toBeCloseTo(0.1314, 4);
  });

  it('2026년 지역가입자 보험료 하한·상한', () => {
    expect(PREMIUM_LIMIT.LOWER).toBe(20_160);
    expect(PREMIUM_LIMIT.UPPER).toBe(4_591_740);
  });
});

/* ------------------------------------------------------------------ */
describe('소득 종류별 반영률 — 가장 조심해야 하는 지점', () => {
  it('이자·배당·사업·기타소득은 100% 반영된다', () => {
    expect(INCOME_REFLECTION.FULL).toBe(1.0);
    const r = incomeBaseForPremium(income({ business: 12_000_000 }));
    expect(r.annualReflected).toBe(12_000_000);
  });

  it('근로소득은 50%만 반영된다', () => {
    expect(INCOME_REFLECTION.HALF).toBe(0.5);
    const r = incomeBaseForPremium(income({ wage: 12_000_000 }));
    expect(r.annualReflected).toBe(6_000_000);
  });

  it('연금소득은 50%만 반영된다 — 은퇴자 시나리오', () => {
    const r = incomeBaseForPremium(income({ pension: 20_000_000 }));
    expect(r.annualReflected).toBe(10_000_000);
    expect(r.annualRaw).toBe(20_000_000);
  });

  it('종류가 섞이면 각각의 반영률이 따로 적용된다', () => {
    const r = incomeBaseForPremium(
      income({ pension: 20_000_000, financial: 12_000_000 }),
    );
    // 연금 2,000만 × 50% + 금융 1,200만 × 100% = 2,200만
    expect(r.annualReflected).toBe(22_000_000);
    expect(r.annualRaw).toBe(32_000_000);
  });

  it('지역보험료에서는 금융소득 1,000만원 이하도 100% 반영된다', () => {
    const r = incomeBaseForPremium(income({ financial: 9_000_000 }));
    expect(r.annualReflected).toBe(9_000_000);
    expect(r.annualRaw).toBe(9_000_000);
  });

  it('금융소득이 1,000만원을 넘어도 전액 반영된다', () => {
    const r = incomeBaseForPremium(income({ financial: 11_000_000 }));
    expect(r.annualReflected).toBe(11_000_000);
  });

  it('소득월액은 반영 후 금액을 12로 나눈 값이다', () => {
    const r = incomeBaseForPremium(income({ pension: 24_000_000 }));
    expect(r.monthly).toBe(1_000_000); // 2,400만 × 50% ÷ 12
  });

  it('연금소득을 100%로 잘못 계산하면 보험료가 2배가 된다 (회귀 방지)', () => {
    const correct = calculateRegionalPremium(
      income({ pension: 24_000_000 }),
      0,
    );
    const wrong = calculateRegionalPremium(income({ business: 24_000_000 }), 0);
    // 같은 금액이라도 사업소득(100%)은 연금(50%)의 2배가 나와야 한다
    expect(wrong.incomePortion).toBe(correct.incomePortion * 2);
  });
});

/* ------------------------------------------------------------------ */
describe('재산점수 등급표 구조', () => {
  it('60등급이다', () => {
    expect(PROPERTY_BRACKETS).toHaveLength(60);
  });

  it('등급 번호가 1부터 60까지 순서대로다', () => {
    PROPERTY_BRACKETS.forEach((b, i) => expect(b.grade).toBe(i + 1));
  });

  it('구간 상한과 점수가 모두 단조증가한다', () => {
    for (let i = 1; i < PROPERTY_BRACKETS.length; i++) {
      expect(PROPERTY_BRACKETS[i].upToManwon).toBeGreaterThan(
        PROPERTY_BRACKETS[i - 1].upToManwon,
      );
      expect(PROPERTY_BRACKETS[i].score).toBeGreaterThan(
        PROPERTY_BRACKETS[i - 1].score,
      );
    }
  });

  it('1등급은 450만원 이하 22점, 60등급은 상한 없이 2,341점', () => {
    expect(PROPERTY_BRACKETS[0]).toEqual({
      grade: 1,
      upToManwon: 450,
      score: 22,
    });
    expect(PROPERTY_BRACKETS[59].upToManwon).toBe(Infinity);
    expect(PROPERTY_BRACKETS[59].score).toBe(2_341);
  });
});

/* ------------------------------------------------------------------ */
describe('재산점수 산정', () => {
  it('기본공제는 1억원이다', () => {
    expect(BASIC_DEDUCTION).toBe(100_000_000);
  });

  it('재산이 기본공제 이하이면 재산점수 0점이다', () => {
    for (const amount of [0, man(5_000), BASIC_DEDUCTION]) {
      const r = propertyScoreDetail(amount);
      expect(r.grade).toBe(0);
      expect(r.score).toBe(0);
      expect(r.taxableAfterDeduction).toBe(0);
    }
  });

  it('전월세 평가금액은 (보증금 + 월세×40)×30%다', () => {
    expect(rentEvaluationAmount(400_000_000, 500_000)).toBe(126_000_000);
  });

  it('모든 등급 경계에서 등급이 정확히 전환된다', () => {
    for (let i = 0; i < PROPERTY_BRACKETS.length - 1; i++) {
      const b = PROPERTY_BRACKETS[i];
      const at = afterDeduction(b.upToManwon);
      expect(propertyScoreDetail(at).grade).toBe(b.grade);
      expect(propertyScoreDetail(at + 1).grade).toBe(b.grade + 1);
    }
  });

  it('60등급 상한을 넘어도 60등급으로 처리된다', () => {
    const r = propertyScoreDetail(afterDeduction(1_000_000));
    expect(r.grade).toBe(60);
    expect(r.score).toBe(2_341);
  });

  it('공개된 계산 예시와 일치한다 — 재산 3억6천만원 → 27등급 659점', () => {
    const r = propertyScoreDetail(360_000_000);
    expect(r.taxableAfterDeduction).toBe(260_000_000);
    expect(r.grade).toBe(27);
    expect(r.score).toBe(659);
  });

  it('propertyScore 는 점수만 반환한다', () => {
    expect(propertyScore(360_000_000)).toBe(659);
  });
});

/* ------------------------------------------------------------------ */
describe('검증 플래그', () => {
  it('등급표는 검증 완료 상태다', () => {
    expect(VERIFIED).toBe(true);
  });

  it('공단 대조 검증이 완료됐다', () => {
    expect(VERIFIED_AGAINST_NHIS).toBe(true);
  });

  it('보험료 결과에 두 플래그가 모두 실려 나온다', () => {
    const r = calculateRegionalPremium(noIncome, 0);
    expect(r.verified).toBe(true);
    expect(r.crossChecked).toBe(true);
  });

  it('근거 조항이 배열로 실려 나온다', () => {
    const r = calculateRegionalPremium(noIncome, 0);
    expect(r.basis.length).toBeGreaterThanOrEqual(3);
    expect(r.basis.join(' ')).toContain('별표 4');
  });
});

/* ------------------------------------------------------------------ */
describe('지역가입자 보험료', () => {
  it('소득 부분은 소득월액 × 7.19%다', () => {
    // 사업소득 1억2천만(100% 반영) → 소득월액 1천만 × 7.19% = 719,000
    const r = calculateRegionalPremium(income({ business: 120_000_000 }), 0);
    expect(r.incomePortion).toBe(719_000);
  });

  it('재산 부분은 점수 × 211.5원이다', () => {
    const r = calculateRegionalPremium(noIncome, 360_000_000);
    expect(r.propertyScore).toBe(659);
    expect(r.propertyPortion).toBe(Math.floor(659 * 211.5));
  });

  it('재산이 없으면 재산보험료는 0원이다', () => {
    const r = calculateRegionalPremium(noIncome, 0);
    expect(r.propertyScore).toBe(0);
    expect(r.propertyPortion).toBe(0);
  });

  it('상한·하한 적용 전 건강보험료는 소득분 + 재산분이다', () => {
    const r = calculateRegionalPremium(
      income({ business: 60_000_000 }),
      400_000_000,
    );
    expect(r.healthBeforeLimit).toBe(r.incomePortion + r.propertyPortion);
  });

  it('합계는 건강보험료 + 장기요양보험료다', () => {
    const r = calculateRegionalPremium(
      income({ business: 60_000_000 }),
      400_000_000,
    );
    expect(r.total).toBe(r.health + r.longTermCare);
    expect(r.longTermCare).toBe(
      Math.floor((r.health * longTermCareRatio()) / 10) * 10,
    );
  });

  it('자동차는 계산하지 않는다 (2024년 2월 폐지)', () => {
    // 소득·재산만으로 건강보험료가 완전히 설명되어야 한다
    const r = calculateRegionalPremium(
      income({ business: 60_000_000 }),
      400_000_000,
    );
    expect(r.healthBeforeLimit).toBe(r.incomePortion + r.propertyPortion);
  });
});

/* ------------------------------------------------------------------ */
describe('국민건강보험공단 모의계산 대표 사례 — 2026-08-03', () => {
  it('공단 계산기와 13개 대표 사례가 일치한다', () => {
    const cases = [
      [noIncome, 0, 0, 0, 20_160, 2_640, 22_800],
      [income({ business: 3_000_000 }), 0, 0, 0, 20_160, 2_640, 22_800],
      [income({ business: 5_000_000 }), 0, 0, 0, 29_950, 3_930, 33_880],
      [noIncome, 100_000_000, 0, 0, 20_160, 2_640, 22_800],
      [noIncome, 100_010_000, 22, 4_653, 24_810, 3_260, 28_070],
      [noIncome, 104_500_000, 22, 4_653, 24_810, 3_260, 28_070],
      [noIncome, 104_510_000, 44, 9_306, 29_460, 3_870, 33_330],
      [income({ wage: 5_000_000, pension: 5_000_000 }), 0, 0, 0, 29_950, 3_930, 33_880],
      [income({ business: 5_000_000, wage: 5_000_000 }), 0, 0, 0, 44_930, 5_900, 50_830],
      [noIncome, 360_000_000, 659, 139_378, 159_530, 20_960, 180_490],
      [income({ business: 800_000_000 }), 0, 0, 0, 4_591_740, 603_370, 5_195_110],
      [noIncome, rentEvaluationAmount(400_000_000, 500_000), 146, 30_879, 51_030, 6_700, 57_730],
      [income({ financial: 9_000_000 }), 0, 0, 0, 53_920, 7_080, 61_000],
    ] as const;

    for (const [caseIncome, property, score, propertyPart, health, longTermCare, total] of cases) {
      const result = calculateRegionalPremium(caseIncome, property);
      expect({
        propertyScore: result.propertyScore,
        propertyPortion: result.propertyPortion,
        health: result.health,
        longTermCare: result.longTermCare,
        total: result.total,
      }).toEqual({
        propertyScore: score,
        propertyPortion: propertyPart,
        health,
        longTermCare,
        total,
      });
    }
  });
});

/* ------------------------------------------------------------------ */
describe('보험료 상한·하한', () => {
  it('소득·재산이 없으면 하한액이 적용된다', () => {
    const r = calculateRegionalPremium(noIncome, 0);
    expect(r.healthBeforeLimit).toBeLessThan(PREMIUM_LIMIT.LOWER);
    expect(r.health).toBe(PREMIUM_LIMIT.LOWER);
    expect(r.limitApplied).toBe('lower');
  });

  it('소득이 극단적으로 높으면 상한액이 적용된다', () => {
    const r = calculateRegionalPremium(
      income({ business: 100_000_000_000 }),
      0,
    );
    expect(r.healthBeforeLimit).toBeGreaterThan(PREMIUM_LIMIT.UPPER);
    expect(r.health).toBe(PREMIUM_LIMIT.UPPER);
    expect(r.limitApplied).toBe('upper');
  });

  it('중간 구간에서는 한도가 적용되지 않는다', () => {
    const r = calculateRegionalPremium(
      income({ business: 60_000_000 }),
      400_000_000,
    );
    expect(r.limitApplied).toBeNull();
    expect(r.health).toBe(Math.floor(r.healthBeforeLimit / 10) * 10);
  });

  it('장기요양보험료는 한도 적용 후 건강보험료에서 환산된다', () => {
    const r = calculateRegionalPremium(noIncome, 0);
    expect(r.longTermCare).toBe(
      Math.floor((PREMIUM_LIMIT.LOWER * longTermCareRatio()) / 10) * 10,
    );
  });
});

/* ------------------------------------------------------------------ */
describe('임의계속가입 보험료', () => {
  it('보수월액 × 7.19% 의 절반을 본인이 부담한다', () => {
    // 400만원 × 7.19% = 287,600 → 본인 부담 143,800
    expect(calculateVoluntaryPremium(4_000_000).health).toBe(143_800);
  });

  it('재산은 반영되지 않는다', () => {
    const r = calculateVoluntaryPremium(4_000_000);
    expect(r.propertyPortion).toBe(0);
    expect(r.propertyScore).toBe(0);
    expect(r.propertyGrade).toBeNull();
  });

  it('하한액이 적용된다', () => {
    const r = calculateVoluntaryPremium(100_000);
    expect(r.health).toBe(PREMIUM_LIMIT.LOWER);
    expect(r.limitApplied).toBe('lower');
  });

  it('재산점수표에 의존하지 않으므로 검증 플래그가 모두 true 다', () => {
    const r = calculateVoluntaryPremium(4_000_000);
    expect(r.verified).toBe(true);
    expect(r.crossChecked).toBe(true);
  });

  it('보수 외 소득이 연 2,000만원 이하면 추가 보험료가 없다', () => {
    const r = calculateVoluntaryPremium(
      4_000_000,
      income({ business: 20_000_000 }),
    );
    expect(r.nonWageIncomePortion).toBe(0);
    expect(r.health).toBe(143_800);
  });

  it('보수 외 소득 초과분은 종류별 반영률을 적용해 추가한다', () => {
    const r = calculateVoluntaryPremium(
      4_000_000,
      income({ business: 30_000_000 }),
    );
    expect(r.nonWageIncomePortion).toBe(
      Math.floor((10_000_000 / 12) * RATE.HEALTH),
    );
    expect(r.healthBeforeLimit).toBe(143_800 + r.nonWageIncomePortion!);
    expect(r.health).toBe(Math.floor(r.healthBeforeLimit / 10) * 10);
  });

  it('근로·연금소득은 보수 외 소득 추가분에서 50%만 반영한다', () => {
    const r = calculateVoluntaryPremium(
      4_000_000,
      income({ business: 30_000_000, pension: 10_000_000 }),
    );
    expect(r.nonWageIncomePortion).toBe(
      Math.floor((17_500_000 / 12) * RATE.HEALTH),
    );
  });

  it('보수월액·보수 외 소득 보험료는 각각의 직장가입자 상한을 적용한다', () => {
    const r = calculateVoluntaryPremium(
      200_000_000,
      income({ business: 1_000_000_000 }),
    );
    expect(r.health).toBe(9_183_480);
    expect(r.limitApplied).toBe('upper');
  });
});

/* ------------------------------------------------------------------ */
describe('임의계속가입 신청 자격', () => {
  it('11개월이면 신청할 수 없다', () => {
    expect(canApplyVoluntary({ insuredMonthsInLookback: 11 })).toBe(false);
  });

  it('12개월이면 신청할 수 있다', () => {
    expect(canApplyVoluntary({ insuredMonthsInLookback: 12 })).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
describe('퇴직 후 비교', () => {
  it('재산이 많고 퇴직 전 보수가 낮으면 임의계속가입이 유리하다', () => {
    const r = compareAfterRetirement({
      income: noIncome,
      propertyAmount: 900_000_000,
      avgMonthlyWage: 2_500_000,
      insuredMonthsInLookback: 24,
    });
    expect(r.recommendation).toBe('voluntary');
    expect(r.monthlySaving).toBeGreaterThan(0);
    expect(r.totalSaving).toBe(r.monthlySaving * 36);
  });

  it('재산이 거의 없고 퇴직 전 보수가 높으면 지역가입자가 유리하다', () => {
    const r = compareAfterRetirement({
      income: noIncome,
      propertyAmount: 0,
      avgMonthlyWage: 9_000_000,
      insuredMonthsInLookback: 24,
    });
    expect(r.recommendation).toBe('regional');
    expect(r.monthlySaving).toBeLessThanOrEqual(0);
  });

  it('가입 기간이 부족하면 notEligible 이고 voluntary 는 null 이다', () => {
    const r = compareAfterRetirement({
      income: noIncome,
      propertyAmount: 900_000_000,
      avgMonthlyWage: 2_000_000,
      insuredMonthsInLookback: 6,
    });
    expect(r.recommendation).toBe('notEligible');
    expect(r.voluntary).toBeNull();
    expect(r.totalSaving).toBe(0);
    expect(r.notes[0]).toContain('12개월 이상');
  });

  it('신청기한 소급 안내가 항상 포함된다', () => {
    const r = compareAfterRetirement({
      income: noIncome,
      propertyAmount: 0,
      avgMonthlyWage: 3_000_000,
      insuredMonthsInLookback: 24,
    });
    expect(r.notes.join(' ')).toContain('납부기한으로부터 2개월');
    expect(r.applyDeadlineRule).toContain('2개월');
    expect(r.maxMonths).toBe(36);
  });

  it('연금 수령 은퇴자 시나리오 — 반영률이 비교 결과에 반영된다', () => {
    const withPension = compareAfterRetirement({
      income: income({ pension: 24_000_000 }),
      propertyAmount: 300_000_000,
      avgMonthlyWage: 4_000_000,
      insuredMonthsInLookback: 24,
    });
    const withBusiness = compareAfterRetirement({
      income: income({ business: 24_000_000 }),
      propertyAmount: 300_000_000,
      avgMonthlyWage: 4_000_000,
      insuredMonthsInLookback: 24,
    });
    // 같은 금액이라도 연금소득은 50% 반영이므로 지역보험료가 더 낮다
    expect(withPension.regional.total).toBeLessThan(
      withBusiness.regional.total,
    );
  });
});
