/**
 * 사이트 전역 상수
 *
 * layout.tsx 에 두면 안 된다. Next.js App Router 는 layout 파일에서
 * 정해진 필드(default, metadata, generateMetadata, viewport 등) 외의
 * export 를 허용하지 않고 빌드가 실패한다.
 */

export const SITE = {
  name: '사대보험',

  /**
   * 사대보험.kr 의 퓨니코드.
   * new URL('https://사대보험.kr').hostname 으로 뽑은 값.
   * 도메인을 바꾸면 이 값도 반드시 다시 뽑아서 넣을 것.
   */
  url: 'https://xn--vk1bu2qt3cr52a.kr',

  description:
    '소득이 바뀔 때 내 사회보험이 어떻게 바뀌는지 판정해주는 도구. 건강보험 피부양자 자격, 지역가입자 보험료, 임의계속가입 비교.',

  /** 기준 연도 — 화면 하단과 판정 결과에 표시 */
  baseYear: 2026,

  /** 요건·요율을 마지막으로 확인한 날 */
  lastVerified: '2026-07-30',
} as const;
