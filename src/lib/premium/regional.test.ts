import { describe, expect, it } from 'vitest';
import {
  calculateRegionalPremium,
  calculateVoluntaryPremium,
  canApplyVoluntary,
  compareAfterRetirement,
  longTermCareRatio,
} from './regional';
import { RATE } from '../constants/2026';
import {
  BASIC_DEDUCTION,
  PROPERTY_BRACKETS,
  VERIFIED,
  VERIFIED_AGAINST_NHIS,
  propertyScore,
  propertyScoreDetail,
} from '../constants/property-score-table';

/** 만원 → 원 */
const man = (n: number) => n * 10_000;
/** 기본공제 후 금액이 정확히 n만원이 되는 재산금액 */
const afterDeduction = (manwon: number) => BASIC_DEDUCTION + man(manwon);

describe('요율', () => {
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
});

/* ------------------------------------------------------------------ */
describe('재산점수 등급표 구조', () => {
  it('60등급이다', () => {
    expect(PROPERTY_BRACKETS).toHaveLength(60);
  });

  it('등급 번호가 1부터 60까지 순서대로다', () => {
    PROPERTY_BRACKETS.forEach((b, i) => expect(b.grade).toBe(i + 1));
  });

  it('구간 상한이 단조증가한다', () => {
    for (let i = 1; i < PROPERTY_BRACKETS.length; i++) {
      expect(PROPERTY_BRACKETS[i].upToManwon).toBeGreaterThan(
        PROPERTY_BRACKETS[i - 1].upToManwon,
      );
    }
  });

  it('점수가 단조증가한다', () => {
    for (let i = 1; i < PROPERTY_BRACKETS.length; i++) {
      expect(PROPERTY_BRACKETS[i].score).toBeGreaterThan(
        PROPERTY_BRACKETS[i - 1].score,
      );
    }
  });

  it('마지막 등급은 상한이 없다', () => {
    expect(PROPERTY_BRACKETS[59].upToManwon).toBe(Infinity);
    expect(PROPERTY_BRACKETS[59].score).toBe(2_341);
  });

  it('1등급은 450만원 이하 22점이다', () => {
    expect(PROPERTY_BRACKETS[0]).toEqual({
      grade: 1,
      upToManwon: 450,
      score: 22,
    });
  });
});

/* ------------------------------------------------------------------ */
describe('재산점수 산정', () => {
  it('기본공제는 1억원이다', () => {
    expect(BASIC_DEDUCTION).toBe(100_000_000);
  });

  it('재산이 기본공제 이하면 1등급 22점이다', () => {
    for (const amount of [0, man(5_000), BASIC_DEDUCTION]) {
      const r = propertyScoreDetail(amount);
      expect(r.grade).toBe(1);
      expect(r.score).toBe(22);
      expect(r.taxableAfterDeduction).toBe(0);
    }
  });

  it('공제 후 450만원 정확히는 1등급이다', () => {
    expect(propertyScoreDetail(afterDeduction(450)).grade).toBe(1);
  });

  it('공제 후 450만원 + 1원은 2등급이다', () => {
    const r = propertyScoreDetail(afterDeduction(450) + 1);
    expect(r.grade).toBe(2);
    expect(r.score).toBe(44);
  });

  it('모든 등급 경계에서 등급이 정확히 전환된다', () => {
    // 상한값에서는 해당 등급, 상한 + 1원에서는 다음 등급
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
    // 아파트 공시가 5억(과표 3억) + 전세 2억(30% 반영 6천만) = 3억6천만
    // 1억 공제 → 2억6천만 → 27등급 (25,300만 초과 28,100만 이하)
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

  it('공단 대조 검증은 아직 미완료다', () => {
    // Week 3 에서 공단 모의계산 10케이스 대조 후 true 로 바꾸고
    // 이 기대값도 함께 수정할 것. 이 테스트가 실패하면 그 작업이 끝났다는 뜻.
    expect(VERIFIED_AGAINST_NHIS).toBe(false);
  });

  it('보험료 결과에 두 플래그가 모두 실려 나온다', () => {
    const r = calculateRegionalPremium(0, 0);
    expect(r.verified).toBe(true);
    expect(r.crossChecked).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
describe('지역가입자 보험료', () => {
  it('소득 부분은 소득월액 × 7.19%다', () => {
    // 연 1억2천만 → 월 1천만 × 7.19% = 719,000
    expect(calculateRegionalPremium(120_000_000, 0).incomePortion).toBe(719_000);
  });

  it('재산 부분은 점수 × 211.5원이다', () => {
    const r = calculateRegionalPremium(0, 360_000_000);
    expect(r.propertyScore).toBe(659);
    expect(r.propertyPortion).toBe(Math.round(659 * 211.5));
  });

  it('재산이 없어도 1등급 22점만큼은 부과된다', () => {
    const r = calculateRegionalPremium(0, 0);
    expect(r.propertyScore).toBe(22);
    expect(r.propertyPortion).toBe(Math.round(22 * 211.5));
  });

  it('재산이 많아지면 재산 부분이 증가한다', () => {
    const low = calculateRegionalPremium(0, 300_000_000);
    const high = calculateRegionalPremium(0, 800_000_000);
    expect(high.propertyPortion).toBeGreaterThan(low.propertyPortion);
    expect(high.propertyGrade!).toBeGreaterThan(low.propertyGrade!);
  });

  it('건강보험료는 소득분 + 재산분이다', () => {
    const r = calculateRegionalPremium(60_000_000, 400_000_000);
    expect(r.health).toBe(r.incomePortion + r.propertyPortion);
  });

  it('합계는 건강보험료 + 장기요양보험료다', () => {
    const r = calculateRegionalPremium(60_000_000, 400_000_000);
    expect(r.total).toBe(r.health + r.longTermCare);
    expect(r.longTermCare).toBe(Math.round(r.health * longTermCareRatio()));
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

  it('재산점수표에 의존하지 않으므로 검증 플래그가 모두 true 다', () => {
    const r = calculateVoluntaryPremium(4_000_000);
    expect(r.verified).toBe(true);
    expect(r.crossChecked).toBe(true);
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
      annualIncome: 0,
      propertyAmount: 900_000_000,
      avgMonthlyWage: 2_500_000,
      insuredMonthsInLookback: 24,
    });
    expect(r.recommendation).toBe('voluntary');
    expect(r.monthlySaving).toBeGreaterThan(0);
  });

  it('36개월 총 절약액을 계산한다', () => {
    const r = compareAfterRetirement({
      annualIncome: 0,
      propertyAmount: 900_000_000,
      avgMonthlyWage: 2_500_000,
      insuredMonthsInLookback: 24,
    });
    expect(r.totalSaving).toBe(r.monthlySaving * 36);
  });

  it('재산이 거의 없고 퇴직 전 보수가 높으면 지역가입자가 유리하다', () => {
    const r = compareAfterRetirement({
      annualIncome: 0,
      propertyAmount: 0,
      avgMonthlyWage: 9_000_000,
      insuredMonthsInLookback: 24,
    });
    expect(r.recommendation).toBe('regional');
    expect(r.monthlySaving).toBeLessThanOrEqual(0);
  });

  it('가입 기간이 부족하면 notEligible 이고 voluntary 는 null 이다', () => {
    const r = compareAfterRetirement({
      annualIncome: 0,
      propertyAmount: 900_000_000,
      avgMonthlyWage: 2_000_000,
      insuredMonthsInLookback: 6,
    });
    expect(r.recommendation).toBe('notEligible');
    expect(r.voluntary).toBeNull();
    expect(r.totalSaving).toBe(0);
    expect(r.notes[0]).toContain('12개월 이상');
  });

  it('90일 소급 안내가 항상 포함된다', () => {
    const r = compareAfterRetirement({
      annualIncome: 0,
      propertyAmount: 0,
      avgMonthlyWage: 3_000_000,
      insuredMonthsInLookback: 24,
    });
    expect(r.notes.join(' ')).toContain('90일');
    expect(r.applyDeadlineDays).toBe(90);
    expect(r.maxMonths).toBe(36);
  });
});
