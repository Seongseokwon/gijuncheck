/**
 * 지역가입자 재산보험료부과점수 등급표 (60등급)
 *
 * 근거: 국민건강보험법 시행령 [별표 4] 재산보험료부과점수의 산정방법 (제42조제1항 관련)
 *
 * 검증 상태
 *  - 60등급 구간·점수: 독립된 두 출처에서 전 구간이 일치함을 확인 (2026-07-30)
 *  - 기본공제 1억원: 두 출처 일치
 *  - 공제 후 금액이 0원 이하이면 재산점수 0점으로 확인 (2026-08-03)
 *  - 전세·월세 환산식과 대표 사례를 공단 모의계산으로 확인 (2026-08-03)
 *
 * 금융소득 입력 의미를 수정했으므로 공단 대표 사례는 재대조가 필요하다.
 * 재대조 전까지 결과는 참고용으로만 공개한다.
 */

/**
 * 등급표 자체는 검증되었으므로 true.
 * 다만 이 플래그가 true 인 것이 "공단 대조 검증까지 끝났다"는 뜻은 아니다.
 * 대조 검증은 VERIFIED_AGAINST_NHIS 로 별도 추적한다.
 */
export const VERIFIED = true;

/** 공단 모의계산과의 대조 검증 완료 여부. 금융소득 기준 수정 후 재대조 전이다. */
export const VERIFIED_AGAINST_NHIS = false;

/** 재산 기본공제액 (원) — 과세표준 합계에서 먼저 공제 */
export const BASIC_DEDUCTION = 100_000_000;

/**
 * 공제 후 재산금액이 0원 이하일 때의 처리.
 *
 * 공단 모의계산에서 소득 0·재산 0 및 기본공제 경계 사례를 대조한 결과,
 * 재산보험료부과점수는 0점이다. 1등급(22점)은 공제 후 금액이 0원을
 * 초과할 때부터 적용된다.
 */
export const ZERO_PROPERTY_NOTE =
  '공제 후 재산금액이 0원 이하이면 재산점수 0점 — 공단 모의계산 2026-08-03 확인';

/**
 * 전세·월세 평가금액.
 *
 * ── 공단 공식 문서로 확인된 것 ──────────────────────────────
 *  - 재산 산식 = {재산세 과세표준금액 + 전월세평가금액(30% 적용)} - 기본공제액
 *  - 전/월세금액은 **30%만** 반영
 *  - 건물·토지·선박·항공기는 과세표준액 100% 반영
 *  - **주택·건물을 소유하지 않은 경우에만** 임차주택 보증금·월세가 재산으로 평가된다
 *    (집이 있으면 전월세는 아예 계산에 들어가지 않는다)
 *  - 자동차 보험료는 2024년 2월부터 폐지
 *
 * 공단 2026년 지역보험료 모의계산 도움말의 공식 계산식:
 *   (보증금 + 월세금액 × 40) × 30%
 *
 * 입력값과 반환값은 모두 원 단위다. 주택·건물을 소유하지 않은 경우에만
 * 이 평가금액을 재산세 과세표준 합계에 더한다.
 *
 * ── 공정시장가액비율 (지방세법 시행령 기준) ────────────────
 *  과세표준 = 공시가격 × 공정시장가액비율
 *
 *    1세대 1주택   43~45%  ← 별도 신청 없이 자동 적용, 가격대별 차등
 *    다주택·법인   60%
 *    토지·건축물   70%
 *
 *  주택을 60% 로만 알고 있으면 1주택자의 과세표준을 과대 계산하게 된다.
 *  과세기준일은 6월 1일이고, 그날의 보유 상태가 11월부터 1년간 적용된다.
 *
 *  자세한 설명은 가이드에 있다:
 *  /health-insurance/guides/property-tax-base/
 */
export const RENT_CONVERSION_NOTE =
  '전월세 평가금액 = (보증금 + 월세 × 40) × 30%; 주택·건물 미소유 세대에만 적용';

/** 공단 공식 계산식에 따른 전월세 평가금액 (원). */
export function rentEvaluationAmount(
  deposit: number,
  monthlyRent: number,
): number {
  return Math.round((deposit + monthlyRent * 40) * 0.3);
}

export interface PropertyBracket {
  /** 등급 (1~60) */
  grade: number;
  /**
   * 구간 상한, **만원 단위**. 원 단위로 바꾸지 말 것.
   * 시행령 별표와 숫자를 1:1로 대조할 수 있어야 전사 오류를 잡을 수 있다.
   * 60등급은 Infinity.
   */
  upToManwon: number;
  /** 부과점수 */
  score: number;
}

export const PROPERTY_BRACKETS: readonly PropertyBracket[] = [
  { grade: 1, upToManwon: 450, score: 22 },
  { grade: 2, upToManwon: 900, score: 44 },
  { grade: 3, upToManwon: 1_350, score: 66 },
  { grade: 4, upToManwon: 1_800, score: 97 },
  { grade: 5, upToManwon: 2_250, score: 122 },
  { grade: 6, upToManwon: 2_700, score: 146 },
  { grade: 7, upToManwon: 3_150, score: 171 },
  { grade: 8, upToManwon: 3_600, score: 195 },
  { grade: 9, upToManwon: 4_050, score: 219 },
  { grade: 10, upToManwon: 4_500, score: 244 },
  { grade: 11, upToManwon: 5_020, score: 268 },
  { grade: 12, upToManwon: 5_590, score: 294 },
  { grade: 13, upToManwon: 6_220, score: 320 },
  { grade: 14, upToManwon: 6_930, score: 344 },
  { grade: 15, upToManwon: 7_710, score: 365 },
  { grade: 16, upToManwon: 8_590, score: 386 },
  { grade: 17, upToManwon: 9_570, score: 412 },
  { grade: 18, upToManwon: 10_700, score: 439 },
  { grade: 19, upToManwon: 11_900, score: 465 },
  { grade: 20, upToManwon: 13_300, score: 490 },
  { grade: 21, upToManwon: 14_800, score: 516 },
  { grade: 22, upToManwon: 16_400, score: 535 },
  { grade: 23, upToManwon: 18_300, score: 559 },
  { grade: 24, upToManwon: 20_400, score: 586 },
  { grade: 25, upToManwon: 22_700, score: 611 },
  { grade: 26, upToManwon: 25_300, score: 637 },
  { grade: 27, upToManwon: 28_100, score: 659 },
  { grade: 28, upToManwon: 31_300, score: 681 },
  { grade: 29, upToManwon: 34_900, score: 706 },
  { grade: 30, upToManwon: 38_800, score: 731 },
  { grade: 31, upToManwon: 43_200, score: 757 },
  { grade: 32, upToManwon: 48_100, score: 785 },
  { grade: 33, upToManwon: 53_600, score: 812 },
  { grade: 34, upToManwon: 59_700, score: 841 },
  { grade: 35, upToManwon: 66_500, score: 881 },
  { grade: 36, upToManwon: 74_000, score: 921 },
  { grade: 37, upToManwon: 82_400, score: 961 },
  { grade: 38, upToManwon: 91_800, score: 1_001 },
  { grade: 39, upToManwon: 103_000, score: 1_041 },
  { grade: 40, upToManwon: 114_000, score: 1_091 },
  { grade: 41, upToManwon: 127_000, score: 1_141 },
  { grade: 42, upToManwon: 142_000, score: 1_191 },
  { grade: 43, upToManwon: 158_000, score: 1_241 },
  { grade: 44, upToManwon: 176_000, score: 1_291 },
  { grade: 45, upToManwon: 196_000, score: 1_341 },
  { grade: 46, upToManwon: 218_000, score: 1_391 },
  { grade: 47, upToManwon: 242_000, score: 1_451 },
  { grade: 48, upToManwon: 270_000, score: 1_511 },
  { grade: 49, upToManwon: 300_000, score: 1_571 },
  { grade: 50, upToManwon: 330_000, score: 1_641 },
  { grade: 51, upToManwon: 363_000, score: 1_711 },
  { grade: 52, upToManwon: 399_300, score: 1_781 },
  { grade: 53, upToManwon: 439_230, score: 1_851 },
  { grade: 54, upToManwon: 483_153, score: 1_921 },
  { grade: 55, upToManwon: 531_468, score: 1_991 },
  { grade: 56, upToManwon: 584_615, score: 2_061 },
  { grade: 57, upToManwon: 643_077, score: 2_131 },
  { grade: 58, upToManwon: 707_385, score: 2_201 },
  { grade: 59, upToManwon: 778_124, score: 2_271 },
  { grade: 60, upToManwon: Infinity, score: 2_341 },
] as const;

/** 공제 후 금액이 0원 이하일 때의 점수. ZERO_PROPERTY_NOTE 참조 */
export function zeroPropertyScore(): number {
  return 0;
}

export interface PropertyScoreResult {
  /** 부과점수 */
  score: number;
  /** 적용 등급 (1~60) */
  grade: number;
  /** 기본공제 적용 후 재산금액 (원) */
  taxableAfterDeduction: number;
}

/**
 * 재산금액 → 부과점수
 *
 * @param propertyAmount 재산금액 합계 (원). 재산세 과세표준 기준.
 *                       전세·월세는 환산이 끝난 값으로 넣어야 한다 (RENT_CONVERSION_NOTE).
 */
export function propertyScoreDetail(
  propertyAmount: number,
): PropertyScoreResult {
  const afterDeduction = propertyAmount - BASIC_DEDUCTION;

  if (afterDeduction <= 0) {
    return { score: zeroPropertyScore(), grade: 0, taxableAfterDeduction: 0 };
  }

  const manwon = afterDeduction / 10_000;
  for (const bracket of PROPERTY_BRACKETS) {
    if (manwon <= bracket.upToManwon) {
      return {
        score: bracket.score,
        grade: bracket.grade,
        taxableAfterDeduction: afterDeduction,
      };
    }
  }

  // 도달 불가 — 마지막 구간이 Infinity. 방어적으로만 둔다.
  const last = PROPERTY_BRACKETS[PROPERTY_BRACKETS.length - 1];
  return {
    score: last.score,
    grade: last.grade,
    taxableAfterDeduction: afterDeduction,
  };
}

/** 점수만 필요한 경우 */
export function propertyScore(propertyAmount: number): number {
  return propertyScoreDetail(propertyAmount).score;
}
