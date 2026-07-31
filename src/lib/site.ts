/**
 * 사이트 전역 상수
 *
 * layout.tsx 에 두면 안 된다. Next.js App Router 는 layout 파일에서
 * 정해진 필드(default, metadata, generateMetadata, viewport 등) 외의
 * export 를 허용하지 않고 빌드가 실패한다.
 */

/**
 * 최종 서비스 도메인 (사대보험.kr 의 퓨니코드).
 * new URL('https://사대보험.kr').hostname 으로 뽑은 값.
 * 도메인을 바꾸면 이 값도 반드시 다시 뽑아서 넣을 것.
 */
const PRODUCTION_URL = 'https://xn--vk1bu2qt3cr52a.kr';

/**
 * 배포 URL 오버라이드.
 *
 * 도메인 연결 전에 Vercel 임시 URL 로 배포할 때 이 값을 지정한다.
 *   NEXT_PUBLIC_SITE_URL=https://sabohum-xxxx.vercel.app
 *
 * 오버라이드가 있으면 "아직 최종 도메인이 아니다"로 판단해 색인을 차단한다.
 * 임시 URL 이 색인되면 두 가지 문제가 생긴다.
 *   1. canonical 이 아직 없는 도메인을 가리켜 색인이 꼬인다
 *   2. 나중에 본 도메인으로 옮길 때 리다이렉트 부채가 된다
 */
const override = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE = {
  /** 화면·메타데이터에 쓰는 공식 서비스명 */
  name: '기준체크',

  url: override || PRODUCTION_URL,

  /**
   * 검색엔진 색인 허용 여부.
   * 최종 도메인으로 배포될 때만 true.
   *
   * false 인 동안에는
   *   - robots.txt 가 전체 차단
   *   - 모든 페이지 메타에 noindex
   *   - 화면 상단에 테스트 배포 배너 표시
   * 이 상태에서는 서치콘솔·서치어드바이저에 등록하지 말 것.
   */
  indexable: !override,

  description:
    '기준체크는 건강보험 피부양자 자격을 관계·소득·재산 기준으로 확인하고 근거를 함께 보여주는 민간 정보 서비스입니다.',

  /**
   * SNS 수집기는 이미지 URL을 길게 캐시한다. OG 이미지를 교체할 때 이 값도
   * 바꾸면 새 주소로 다시 수집한다. (예: 20260731-2)
   */
  ogImage: '/og.png?v=20260731-1',

  /** 기준 연도 — 화면 하단과 판정 결과에 표시 */
  baseYear: 2026,

  /** 요건·요율을 마지막으로 확인한 날 */
  lastVerified: '2026-07-30',

  contactEmail: 'devswseong@gmail.com',
} as const;
