/**
 * 사이트 전역 상수
 *
 * layout.tsx 에 두면 안 된다. Next.js App Router 는 layout 파일에서
 * 정해진 필드(default, metadata, generateMetadata, viewport 등) 외의
 * export 를 허용하지 않고 빌드가 실패한다.
 */

/**
 * 최종 서비스 도메인.
 * 도메인을 바꾸면 이 값도 반드시 다시 넣을 것.
 */
const PRODUCTION_URL = 'https://gijuncheck.kr';

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

  /** 서비스 운영 주체 — 공단 등 공공기관으로 오인되지 않도록 명시한다. */
  operatorName: '기준체크 운영자(개인 운영)',

  /** Article 구조화 데이터에 표시할 콘텐츠 작성 주체명 */
  authorName: '기준체크 운영자',

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

  /** 홈 검색 결과에만 사용하는 페이지 고유 설명 */
  homeDescription:
    '피부양자 자격부터 지역가입자 보험료와 임의계속가입 비교까지, 퇴직 전후 건강보험 선택에 필요한 세 가지 도구를 한곳에서 확인하세요.',

  /** 홈의 정적 OG 이미지. 하위 페이지는 `ROUTES`의 전용 이미지를 사용한다. */
  ogImage: '/og/home.png',

  /** 기준 연도 — 화면 하단과 판정 결과에 표시 */
  baseYear: 2026,

  /** 요건·요율을 마지막으로 확인한 날 */
  lastVerified: '2026-08-03',

  contactEmail: 'devswseong@gmail.com',

  /**
   * 브랜드 엔티티를 외부에서 식별할 수 있는 공개 URL 목록.
   *
   * schema.org `sameAs`는 검색·AI가 "기준체크"라는 이름을 실제 주체와
   * 연결(엔티티 해소)하는 데 쓰는 앵커다. 항목이 없으면 동명이의와
   * 구분할 근거가 없어 브랜드 인용이 잘 붙지 않는다.
   *
   * 반드시 실재하고 접근 가능한 URL만 넣는다. 없는 프로필을 적으면
   * 구조화 데이터가 사실과 어긋나 오히려 신뢰 신호를 깎는다.
   * 채널이 늘어나면(네이버 블로그·유튜브·링크드인 등) 여기에 추가한다.
   */
  sameAs: ['https://github.com/Seongseokwon/gijuncheck'],

  /** 저자·조직이 다루는 주제 영역. 엔티티의 전문 분야를 명시한다. */
  knowsAbout: [
    '국민건강보험 피부양자 자격',
    '건강보험 지역가입자 보험료',
    '임의계속가입',
  ],
} as const;
