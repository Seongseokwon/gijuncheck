/**
 * 이벤트 수집
 *
 * ⚠️ 절대 지켜야 하는 제약
 *
 * 개인정보처리방침에 입력값은 서버나 분석 도구로 전송되지 않는다고 명시했다.
 * 소득·재산 금액이나 나이를 이벤트로 보내면
 * 그 약속을 깨는 것이다.
 *
 * 그래서 이벤트 파라미터는 **boolean 과 enum 만** 허용한다.
 * 아래 EventMap 의 타입이 그걸 강제한다. 숫자 필드를 추가하지 말 것.
 *
 * 무엇을 알고 싶은가
 *  - 사람들이 판정에서 어느 요건에 걸리는가 → 다음 가이드 주제가 정해진다
 *  - 판정 후 보험료 계산으로 넘어가는가 → 퍼널이 작동하는지
 *  - 어느 도구가 실제로 쓰이는가
 */

import type { JudgeStep, Relation } from './dependent/types';

/* ------------------------------------------------------------------ */

/** 판정 결과 요약. 금액은 담지 않는다 */
export interface JudgeCompleteParams {
  eligible: boolean;
  /** 탈락한 단계. 통과했으면 없음 */
  failed_at?: JudgeStep;
  relation: Relation;
  business_registered: boolean;
}

export interface HomeCtaClickParams {
  location: 'hero' | 'scenario' | 'tool';
}

export interface JudgeStartParams {
  entry: 'dependent_judge';
}

export interface PremiumCalculateParams {
  /** 재산을 입력했는지 (금액이 아니라 유무만) */
  has_property: boolean;
  /** 상한·하한이 적용됐는지 */
  limit_applied: 'lower' | 'upper' | 'none';
  /** 판정기에서 넘어왔는지 */
  from_judge: boolean;
}

export interface VoluntaryCompareParams {
  recommendation: 'voluntary' | 'regional' | 'tie' | 'notEligible';
}

/**
 * 허용된 이벤트 목록.
 * 여기에 없는 이벤트는 보낼 수 없고, 파라미터에 number 를 넣을 수 없다.
 */
export interface EventMap {
  home_cta_click: HomeCtaClickParams;
  judge_start: JudgeStartParams;
  judge_complete: JudgeCompleteParams;
  premium_calculate: PremiumCalculateParams;
  voluntary_compare: VoluntaryCompareParams;
}

/* ------------------------------------------------------------------ */

type GtagFn = (
  command: 'event' | 'config' | 'js',
  target: string | Date,
  params?: Record<string, unknown>,
) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

/**
 * 이벤트 전송.
 *
 * gtag 가 없으면 (측정 ID 미설정, 광고차단, SSR) 조용히 넘어간다.
 * 수집이 안 된다고 도구가 깨지면 안 된다.
 */
export function track<K extends keyof EventMap>(
  event: K,
  params: EventMap[K],
): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;

  try {
    // 이벤트 파라미터 인터페이스에는 인덱스 시그니처가 없으므로
    // unknown 을 거쳐 변환한다. 타입을 느슨하게 만들지 않기 위한 것이다.
    window.gtag('event', event, params as unknown as Record<string, unknown>);
  } catch {
    // 수집 실패가 사용자 경험에 영향을 주면 안 된다
  }
}
