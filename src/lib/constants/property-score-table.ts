/**
 * 지역가입자 재산보험료부과점수 등급표
 *
 * ⚠️⚠️ 미검증 — 실제 서비스에 공개하기 전에 반드시 교체해야 합니다. ⚠️⚠️
 *
 * 아래 표는 구조를 잡기 위한 **근사값**입니다. 실제 고시표는 60등급이며
 * 국민건강보험공단 고시 원문을 확인해 그대로 입력해야 합니다.
 *
 * 확인해야 할 것:
 *  1. 60등급 구간별 과세표준 경계값과 점수
 *  2. 재산 기본공제액 (2024년부터 1억원 공제 도입)
 *  3. 자동차 점수 산정 방식 (배기량·차령·가액 기준, 4천만원 이상 차량만 부과)
 *
 * 출처를 확인할 곳:
 *  - 국민건강보험공단 > 보험료 > 지역보험료 산정방법
 *  - 국민건강보험법 시행령 별표 4 (보험료부과점수의 산정방법)
 *
 * VERIFIED 를 true 로 바꾸기 전까지 보험료 계산 결과는 UI에 노출하지 마세요.
 * calculateRegionalPremium() 이 verified: false 를 반환하므로
 * 화면에서 이 플래그를 확인해 차단할 수 있습니다.
 */

export const VERIFIED = false;

/** 재산 기본공제액 (원) — 과세표준에서 먼저 공제 */
export const BASIC_DEDUCTION = 100_000_000;

export interface PropertyBracket {
  /** 구간 상한 (원). 마지막 구간은 Infinity */
  upTo: number;
  /** 부과점수 */
  score: number;
}

/**
 * TODO(verify): 공단 고시 60등급표로 전면 교체
 * 현재는 구조 확인용 근사 구간표입니다.
 */
export const PROPERTY_BRACKETS: PropertyBracket[] = [
  { upTo: 0, score: 0 },
  { upTo: 45_000_000, score: 22 },
  { upTo: 90_000_000, score: 68 },
  { upTo: 135_000_000, score: 121 },
  { upTo: 180_000_000, score: 174 },
  { upTo: 225_000_000, score: 227 },
  { upTo: 270_000_000, score: 280 },
  { upTo: 360_000_000, score: 340 },
  { upTo: 450_000_000, score: 400 },
  { upTo: 540_000_000, score: 460 },
  { upTo: 720_000_000, score: 550 },
  { upTo: 900_000_000, score: 650 },
  { upTo: 1_200_000_000, score: 780 },
  { upTo: Infinity, score: 1_200 },
];

/**
 * 재산세 과세표준 → 부과점수
 * 기본공제를 적용한 뒤 구간표에서 점수를 찾는다.
 */
export function propertyScore(propertyTaxBase: number): number {
  const taxable = Math.max(0, propertyTaxBase - BASIC_DEDUCTION);
  for (const bracket of PROPERTY_BRACKETS) {
    if (taxable <= bracket.upTo) return bracket.score;
  }
  return PROPERTY_BRACKETS[PROPERTY_BRACKETS.length - 1].score;
}
