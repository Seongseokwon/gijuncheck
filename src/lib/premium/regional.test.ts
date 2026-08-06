import { describe, expect, it } from 'vitest';
import {
  calculateRegionalPremium,
  calculateVoluntaryPremium,
  canApplyVoluntary,
  compareAfterRetirement,
  incomeBaseForPremium,
  longTermCareRatio,
} from './regional';
import {
  INCOME_REFLECTION,
  PREMIUM_LIMIT,
  RATE,
} from '../constants/2026';
import {
  BASIC_DEDUCTION,
  PROPERTY_BRACKETS,
  propertyAmountFor,
  rentEvaluationAmount,
  VERIFIED,
  VERIFIED_AGAINST_NHIS,
  propertyScore,
  propertyScoreDetail,
} from '../constants/property-score-table';
import { EMPTY_PREMIUM_INCOME, type PremiumIncome } from './types';

/** 만원 → 원 */
const man = (n: number) => n * 10_000;
/** 기본공제 후 금액이 정확히 n만원이 되는 재산금액 */
const afterDeduction = (manwon: number) => BASIC_DEDUCTION + man(manwon);

const noIncome: PremiumIncome = EMPTY_PREMIUM_INCOME;
const income = (p: Partial<PremiumIncome>): PremiumIncome => ({
  ...noIncome,
  ...p,
});

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

  it('지역보험료에서는 금융소득도 100% 반영한다', () => {
    const r = incomeBaseForPremium(income({ financial: 9_000_000 }));
    expect(r.annualReflected).toBe(9_000_000);
    expect(r.annualRaw).toBe(9_000_000);
  });

  it('금융소득은 1,000만원 전후와 무관하게 전액 반영한다', () => {
    expect(incomeBaseForPremium(income({ financial: 10_000_000 })).annualReflected).toBe(10_000_000);
    const r = incomeBaseForPremium(income({ financial: 10_000_001 }));
    expect(r.annualReflected).toBe(10_000_001);
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

  /**
   * 농어촌 지역 거주 경감 — 2026-08-06 공단 모의계산 실측으로 확정.
   *
   * 기대값은 전부 공단 화면에서 읽은 숫자다.
   */
  describe('농어촌 지역 거주 경감', () => {
    const rural = { ruralResident: true };

    it('경감을 요청하지 않으면 0원이다', () => {
      const r = calculateRegionalPremium(income({ business: 3_000_000 }), 360_000_000);
      expect(r.ruralReduction).toBe(0);
      expect(r.total).toBe(180_490); // 공단 C10
    });

    it('건강보험료의 22%를 10원 단위로 절사해 경감한다', () => {
      // 공단 실측: 건강 159,530 → 경감 35,090 → 장기 16,350 → 합계 140,790
      const r = calculateRegionalPremium(
        income({ business: 3_000_000 }),
        360_000_000,
        rural,
      );
      expect(r.health).toBe(159_530); // ④는 경감 전 값을 유지한다
      expect(r.ruralReduction).toBe(35_090);
      expect(r.longTermCare).toBe(16_350);
      expect(r.total).toBe(140_790);
    });

    it('장기요양보험료는 경감 후 건강보험료 기준으로 계산한다', () => {
      // 순서를 반대로 하면 장기요양이 20,960원이 되어 과대 계산된다.
      const withRural = calculateRegionalPremium(
        income({ business: 3_000_000 }),
        360_000_000,
        rural,
      );
      const without = calculateRegionalPremium(
        income({ business: 3_000_000 }),
        360_000_000,
      );
      expect(without.longTermCare).toBe(20_960);
      expect(withRural.longTermCare).toBeLessThan(without.longTermCare);
    });

    it('하한액에도 경감이 적용된다', () => {
      // 공단 실측: 소득·재산 0원 → 건강 20,160 → 경감 4,430 → 장기 2,060 → 합계 17,790
      const r = calculateRegionalPremium(noIncome, 0, rural);
      expect(r.health).toBe(PREMIUM_LIMIT.LOWER);
      expect(r.ruralReduction).toBe(4_430);
      expect(r.longTermCare).toBe(2_060);
      expect(r.total).toBe(17_790);
    });

    it('사업소득이 500만원을 넘으면 경감하지 않고 사유를 남긴다', () => {
      const r = calculateRegionalPremium(
        income({ business: 6_000_000 }),
        360_000_000,
        rural,
      );
      expect(r.ruralReduction).toBe(0);
      expect(r.ruralReductionBlockedReason).toContain('농어업인');
    });

    it('사업소득이 넘어도 농어업인 등록자가 있으면 경감한다', () => {
      // 공단 실측(조건 무검사): 건강 175,320 → 경감 38,570 → 장기 17,960 → 합계 154,710
      const r = calculateRegionalPremium(
        income({ business: 6_000_000 }),
        360_000_000,
        { ruralResident: true, registeredFarmer: true },
      );
      expect(r.ruralReduction).toBe(38_570);
      expect(r.longTermCare).toBe(17_960);
      expect(r.total).toBe(154_710);
      expect(r.ruralReductionBlockedReason).toBeUndefined();
    });

    it('사업소득 500만원 경계에서는 경감된다 (이하 조건)', () => {
      const at = calculateRegionalPremium(income({ business: 5_000_000 }), 0, rural);
      const over = calculateRegionalPremium(income({ business: 5_000_001 }), 0, rural);
      expect(at.ruralReduction).toBeGreaterThan(0);
      expect(over.ruralReduction).toBe(0);
    });

    it('읍·면 거주가 아니면 농어업인이어도 경감하지 않는다', () => {
      const r = calculateRegionalPremium(noIncome, 360_000_000, {
        registeredFarmer: true,
      });
      expect(r.ruralReduction).toBe(0);
      expect(r.ruralReductionBlockedReason).toBeUndefined();
    });

    /**
     * 미확인 경계. 경감고시의 "사업소득 500만원"에 분리과세 주택임대소득이
     * 포함되는지 확인하지 못했다 — 공단 모의계산기가 이 조건 자체를 검사하지
     * 않아 실측이 불가능하다. 근거를 확보하기 전까지 현재 동작을 고정해
     * **모르는 채로 조용히 바뀌는 것**을 막는다.
     */
    it('분리과세 주택임대소득은 현재 농어촌 경감 판정에 넣지 않는다 (미확인)', () => {
      const r = calculateRegionalPremium(
        income({ housingRental: 60_000_000 }),
        0,
        rural,
      );
      expect(r.ruralReduction).toBeGreaterThan(0);
      expect(r.ruralReductionBlockedReason).toBeUndefined();
    });
  });

  /**
   * 2026-08-06 공단 모의계산 실측 (C29~C31).
   *
   * 공단 화면이 「분리과세 주택임대소득」을 사업소득과 **별도 칸**으로 받길래
   * 반영률이 다를 것을 의심했다. 실측 결과 같은 금액을 「사업소득 등」에 넣었을
   * 때와 결과가 완전히 같았다. 칸이 나뉜 이유는 반영률이 아니라 부과 자료의
   * 출처가 다르기 때문이다 — 분리과세분은 종합소득 신고 자료에 잡히지 않는다.
   */
  describe('분리과세 주택임대소득 — 공단 대조', () => {
    it('C29·C30 1,000만원은 사업소득 등에 넣은 것과 결과가 같다', () => {
      const asRental = calculateRegionalPremium(
        income({ housingRental: 10_000_000 }),
        0,
      );
      const asBusiness = calculateRegionalPremium(
        income({ business: 10_000_000 }),
        0,
      );

      // 공단 실측: ① 59,916 → ④ 59,910 → ⑤ 7,870 → 합계 67,780
      expect(asRental.incomePortion).toBe(59_916);
      expect(asRental.health).toBe(59_910);
      expect(asRental.longTermCare).toBe(7_870);
      expect(asRental.total).toBe(67_780);
      expect(asRental).toEqual(asBusiness);
    });

    it('C31 2,400만원도 100% 반영된다', () => {
      // 공단 실측: ① 143,800 → ④ 143,800 → ⑤ 18,890 → 합계 162,690
      const r = calculateRegionalPremium(
        income({ housingRental: 24_000_000 }),
        0,
      );
      expect(r.incomePortion).toBe(143_800);
      expect(r.health).toBe(143_800);
      expect(r.longTermCare).toBe(18_890);
      expect(r.total).toBe(162_690);
    });

    it('반영률은 100%이며 근로·연금의 50%와 구분된다', () => {
      const base = incomeBaseForPremium(income({ housingRental: 12_000_000 }));
      expect(base.annualReflected).toBe(12_000_000);
      expect(base.annualRaw).toBe(12_000_000);

      const half = incomeBaseForPremium(income({ pension: 12_000_000 }));
      expect(base.annualReflected).toBeGreaterThan(half.annualReflected);
    });

    it('다른 소득과 합산된다', () => {
      const split = incomeBaseForPremium(
        income({ business: 6_000_000, housingRental: 6_000_000 }),
      );
      const merged = incomeBaseForPremium(income({ business: 12_000_000 }));
      expect(split.annualReflected).toBe(merged.annualReflected);
      expect(split.monthly).toBe(merged.monthly);
    });

    it('임의계속가입의 보수 외 소득에도 합산된다', () => {
      // 보수 외 소득 2,000만원 초과분만 반영되므로 문턱을 넘겨서 본다
      const withRental = calculateVoluntaryPremium(
        3_000_000,
        income({ housingRental: 30_000_000 }),
      );
      const withBusiness = calculateVoluntaryPremium(
        3_000_000,
        income({ business: 30_000_000 }),
      );
      const without = calculateVoluntaryPremium(3_000_000, noIncome);

      expect(withRental.nonWageIncomePortion).toBe(
        withBusiness.nonWageIncomePortion,
      );
      expect(withRental.nonWageIncomePortion).toBeGreaterThan(0);
      expect(withRental.total).toBeGreaterThan(without.total);
    });
  });

  /**
   * 2026-08-06 공단 재대조에서 발견.
   *
   * 공단 화면 ①은 하한·상한을 적용한 값을 표시해 `① + ③ = ④`가 성립한다.
   * 우리는 원값을 그대로 뿌려 "0원 + 139,378원 = 159,530원"처럼 보였다.
   */
  describe('화면 표시용 소득보험료 (incomePortionApplied)', () => {
    it('소득이 0원이어도 하한액으로 표시한다', () => {
      const r = calculateRegionalPremium(noIncome, 360_000_000);
      expect(r.incomePortion).toBe(0);
      expect(r.incomePortionApplied).toBe(PREMIUM_LIMIT.LOWER);
      // 공단 C10 실측: ① 20,160 + ③ 139,378 = ④ 159,530
      expect(r.propertyPortion).toBe(139_378);
      expect(r.health).toBe(159_530);
    });

    it('표시값과 재산보험료의 합이 건강보험료와 맞는다 (상한 제외)', () => {
      const cases: [PremiumIncome, number][] = [
        [noIncome, 0],
        [noIncome, 100_010_000],
        [noIncome, 360_000_000],
        [income({ business: 3_000_000 }), 0],
        [income({ business: 12_000_000 }), 300_000_000],
        [income({ pension: 24_000_000 }), 500_000_000],
      ];
      for (const [i, p] of cases) {
        const r = calculateRegionalPremium(i, p);
        expect(r.limitApplied).not.toBe('upper');
        const sum = r.incomePortionApplied + r.propertyPortion;
        // 공단과 동일하게 10원 단위 절사 후 비교한다
        expect(Math.floor(sum / 10) * 10).toBe(r.health);
      }
    });

    it('소득분이 상한을 넘으면 상한액으로 표시한다', () => {
      const r = calculateRegionalPremium(income({ business: 800_000_000 }), 0);
      expect(r.incomePortion).toBeGreaterThan(PREMIUM_LIMIT.UPPER);
      expect(r.incomePortionApplied).toBe(PREMIUM_LIMIT.UPPER);
    });

    it('하한·상한 사이에서는 원값과 같다', () => {
      const r = calculateRegionalPremium(income({ business: 5_000_000 }), 0);
      expect(r.incomePortionApplied).toBe(r.incomePortion);
      expect(r.incomePortion).toBe(29_958); // 공단 C03 실측
    });
  });

  /**
   * 2026-08-06 공단 모의계산 실측으로 확정한 규칙.
   *
   * 이 규칙은 그전까지 계산기 화면의 체크박스 라벨에만 있었고 테스트가 없었다.
   * 대조 과정에서 드러났으므로 여기서 고정한다.
   */
  describe('전월세 반영 규칙 — 주택·건물 보유 여부', () => {
    const rent = { rentDeposit: 200_000_000, monthlyRent: 0 };

    it('주택·건물을 보유하면 전월세를 반영하지 않는다', () => {
      expect(
        propertyAmountFor({
          taxBase: 200_000_000,
          ...rent,
          ownsHouseOrBuilding: true,
        }),
      ).toBe(200_000_000);
    });

    it('보유 재산이 아무리 적어도 주택·건물이면 전월세가 빠진다', () => {
      // 공단 실측: 주택 1만원 + 전세 2억 → 재산점수 0점
      const amount = propertyAmountFor({
        taxBase: 10_000,
        ...rent,
        ownsHouseOrBuilding: true,
      });
      expect(amount).toBe(10_000);
      expect(propertyScore(amount)).toBe(0);
    });

    it('주택·건물이 없으면 과세표준과 전월세 평가금액을 더한다', () => {
      // 공단 실측: 토지 2억 + 전세 2억 → 재산점수 535점
      const amount = propertyAmountFor({
        taxBase: 200_000_000,
        ...rent,
        ownsHouseOrBuilding: false,
      });
      expect(amount).toBe(260_000_000);
      expect(propertyScore(amount)).toBe(535);
    });

    it('같은 입력이라도 보유 여부에 따라 재산점수가 달라진다 (회귀 방지)', () => {
      // 공단 실측: 주택 2억 + 전세 2억 → 439점 / 토지 2억 + 전세 2억 → 535점
      const owns = propertyScore(
        propertyAmountFor({ taxBase: 200_000_000, ...rent, ownsHouseOrBuilding: true }),
      );
      const rents = propertyScore(
        propertyAmountFor({ taxBase: 200_000_000, ...rent, ownsHouseOrBuilding: false }),
      );
      expect(owns).toBe(439);
      expect(rents).toBe(535);
    });

    it('임차 정보가 없으면 과세표준만 쓴다', () => {
      expect(
        propertyAmountFor({ taxBase: 300_000_000, ownsHouseOrBuilding: false }),
      ).toBe(300_000_000);
    });
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

  it('공단 대표 사례 재대조가 완료된 상태다', () => {
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

  it('직접 대조 전인 참고 계산 상태를 표시한다', () => {
    const r = calculateVoluntaryPremium(4_000_000);
    expect(r.verified).toBe(true);
    expect(r.crossChecked).toBe(false);
    expect(r.assumption).toContain('가중 평균 평가율');
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
    expect(r.notes.ineligibleReason).toContain('12개월 이상');
  });

  it('신청 기한 소급 안내가 항상 포함된다', () => {
    const r = compareAfterRetirement({
      income: noIncome,
      propertyAmount: 0,
      avgMonthlyWage: 3_000_000,
      insuredMonthsInLookback: 24,
    });
    expect(r.notes.general.join(' ')).toContain('납부기한으로부터 2개월');
    expect(r.applyDeadlineRule).toContain('2개월');
    expect(r.maxMonths).toBe(36);
    expect(r.totalSavingAssumption).toContain('11월');
  });

  it('두 제도의 보험료가 같으면 동률로 안내한다', () => {
    const r = compareAfterRetirement({
      income: noIncome,
      propertyAmount: 0,
      avgMonthlyWage: 100_000,
      insuredMonthsInLookback: 24,
    });
    expect(r.recommendation).toBe('tie');
    expect(r.monthlySaving).toBe(0);
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
