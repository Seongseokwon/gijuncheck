/**
 * 보험료 계산 전용 소득 타입
 *
 * ## 왜 `Income` 을 그대로 쓰지 않는가
 *
 * 분리과세 주택임대소득은 **지역보험료 전용 항목**이다. 피부양자 판정에서는
 * 같은 이름의 소득이 완전히 다르게 작동한다 — 주택임대소득이 있으면
 * 사업자등록 여부와 무관하게 피부양자가 될 수 없다(`docs/03-검증기록.md`).
 * 즉 "합산소득에 더한다"가 아니라 "있으면 탈락"이다.
 *
 * 이 필드를 `src/lib/dependent/types.ts` 의 `Income` 에 넣으면 피부양자
 * 판정 코드에서 소득요건 합산 대상으로 오인될 수 있다. 두 제도를 섞지 않기
 * 위해 보험료 계층에만 필드를 둔다.
 */

import type { Income } from '../dependent/types';

export interface PremiumIncome extends Income {
  /**
   * 분리과세 주택임대소득 (원, 연간)
   *
   * 공단 모의계산 화면의 「분리과세 주택임대소득」 칸에 대응한다.
   * 도움말은 "해당 귀속년도에 발생한 전체 금액을 입력해주세요"이고,
   * 상위 섹션 제목이 「소득금액(연소득 기준)」이므로 총수입금액이 아니라
   * **소득금액**(총수입 − 필요경비 − 기본공제)을 넣는다.
   *
   * **반영률 100%** — 2026-08-06 공단 모의계산 실측으로 확인했다.
   * 같은 금액을 「사업소득 등」 칸에 넣었을 때와 결과가 완전히 동일하다.
   * 상세는 `docs/03-검증기록.md` C29~C31.
   */
  housingRental: number;
}

/** 모든 항목이 0인 보험료 계산용 소득 */
export const EMPTY_PREMIUM_INCOME: PremiumIncome = {
  business: 0,
  wage: 0,
  pension: 0,
  financial: 0,
  other: 0,
  housingRental: 0,
};

/**
 * `Income`(피부양자 판정용)을 보험료 계산용으로 올린다.
 *
 * 판정기 → 지역보험료 핸드오프처럼 분리과세 주택임대소득 정보가 없는
 * 경로에서 쓴다. **없는 값을 0으로 채우는 지점을 여기 한 곳으로 모은다** —
 * 호출처마다 `?? 0` 을 흩뿌리면 나중에 반영률이 바뀔 때 놓치는 곳이 생긴다.
 */
export function toPremiumIncome(
  income: Income,
  housingRental = 0,
): PremiumIncome {
  return { ...income, housingRental };
}
