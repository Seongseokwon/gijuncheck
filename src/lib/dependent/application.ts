/**
 * 피부양자 자격 취득 신고 시점에 관한 현행 시행규칙 기준.
 *
 * 연도별 판정금액과 달리 법령의 신고 시점 규정은 2026년 상수 파일에
 * 섞지 않고, 신청 안내에서 재사용할 불변 정책값으로 관리한다.
 */
export const DEPENDENT_APPLICATION = {
  /** 자격변동일로 소급 인정되는 신고 구간 */
  RETROACTIVE_DAYS: 90,
} as const;
