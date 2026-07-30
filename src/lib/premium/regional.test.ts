import { describe, expect, it } from 'vitest';
import {
  calculateRegionalPremium,
  calculateVoluntaryPremium,
  canApplyVoluntary,
  compareAfterRetirement,
  longTermCareRatio,
} from './regional';
import { RATE } from '../constants/2026';
import { VERIFIED } from '../constants/property-score-table';

describe('요율', () => {
  it('2026년 건강보험료율은 7.19%다', () => {
    expect(RATE.HEALTH).toBeCloseTo(0.0719, 6);
  });

  it('2026년 장기요양보험료율은 0.9448%다', () => {
    expect(RATE.LONG_TERM_CARE).toBeCloseTo(0.009448, 8);
  });

  it('장기요양 환산율은 약 13.14%다', () => {
    expect(longTermCareRatio()).toBeCloseTo(0.1314, 4);
  });
});

describe('지역가입자 보험료', () => {
  it('소득 부분은 소득월액 × 7.19%다', () => {
    const r = calculateRegionalPremium(120_000_000, 0);
    // 소득월액 1,000만원 × 7.19% = 719,000원
    expect(r.incomePortion).toBe(719_000);
  });

  it('재산이 기본공제 이하면 재산 부분이 0원이다', () => {
    const r = calculateRegionalPremium(0, 50_000_000);
    expect(r.propertyPortion).toBe(0);
  });

  it('재산이 많아지면 재산 부분이 증가한다', () => {
    const low = calculateRegionalPremium(0, 300_000_000);
    const high = calculateRegionalPremium(0, 800_000_000);
    expect(high.propertyPortion).toBeGreaterThan(low.propertyPortion);
  });

  it('합계는 건강보험료 + 장기요양보험료다', () => {
    const r = calculateRegionalPremium(60_000_000, 400_000_000);
    expect(r.total).toBe(r.health + r.longTermCare);
    expect(r.health).toBe(r.incomePortion + r.propertyPortion);
  });

  it('재산점수표가 미검증이므로 verified 는 false 다', () => {
    // 이 테스트는 등급표를 확정하면 실패한다.
    // 그때 VERIFIED 를 true 로 바꾸고 이 기대값도 함께 바꿀 것.
    expect(VERIFIED).toBe(false);
    expect(calculateRegionalPremium(0, 0).verified).toBe(false);
  });
});

describe('임의계속가입 보험료', () => {
  it('보수월액 × 7.19% 의 절반을 본인이 부담한다', () => {
    const r = calculateVoluntaryPremium(4_000_000);
    // 400만원 × 7.19% = 287,600원 → 본인 부담 143,800원
    expect(r.health).toBe(143_800);
  });

  it('재산은 반영되지 않는다', () => {
    expect(calculateVoluntaryPremium(4_000_000).propertyPortion).toBe(0);
  });

  it('재산점수표에 의존하지 않으므로 verified 는 true 다', () => {
    expect(calculateVoluntaryPremium(4_000_000).verified).toBe(true);
  });
});

describe('임의계속가입 신청 자격', () => {
  it('11개월이면 신청할 수 없다', () => {
    expect(canApplyVoluntary({ insuredMonthsInLookback: 11 })).toBe(false);
  });

  it('12개월이면 신청할 수 있다', () => {
    expect(canApplyVoluntary({ insuredMonthsInLookback: 12 })).toBe(true);
  });
});

describe('퇴직 후 비교', () => {
  it('재산이 많고 퇴직 전 보수가 낮으면 임의계속가입이 유리하다', () => {
    const r = compareAfterRetirement({
      annualIncome: 0,
      propertyTaxBase: 900_000_000,
      avgMonthlyWage: 2_500_000,
      insuredMonthsInLookback: 24,
    });
    expect(r.recommendation).toBe('voluntary');
    expect(r.monthlySaving).toBeGreaterThan(0);
  });

  it('재산이 거의 없고 퇴직 전 보수가 높으면 지역가입자가 유리하다', () => {
    const r = compareAfterRetirement({
      annualIncome: 0,
      propertyTaxBase: 0,
      avgMonthlyWage: 9_000_000,
      insuredMonthsInLookback: 24,
    });
    expect(r.recommendation).toBe('regional');
    expect(r.monthlySaving).toBeLessThanOrEqual(0);
  });

  it('가입 기간이 부족하면 notEligible 이고 voluntary 는 null 이다', () => {
    const r = compareAfterRetirement({
      annualIncome: 0,
      propertyTaxBase: 900_000_000,
      avgMonthlyWage: 2_000_000,
      insuredMonthsInLookback: 6,
    });
    expect(r.recommendation).toBe('notEligible');
    expect(r.voluntary).toBeNull();
    expect(r.notes[0]).toContain('12개월 이상');
  });

  it('90일 소급 안내가 항상 포함된다', () => {
    const r = compareAfterRetirement({
      annualIncome: 0,
      propertyTaxBase: 0,
      avgMonthlyWage: 3_000_000,
      insuredMonthsInLookback: 24,
    });
    expect(r.notes.join(' ')).toContain('90일');
    expect(r.applyDeadlineDays).toBe(90);
    expect(r.maxMonths).toBe(36);
  });
});
