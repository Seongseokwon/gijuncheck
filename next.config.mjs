/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * 전 페이지 정적 발행. 판정·계산은 클라이언트 순수 함수로 수행하므로
   * 서버 런타임이 필요 없다. 무료 호스팅으로 충분하고 LCP도 유리하다.
   *
   * 이 설정 때문에 생기는 제약 3가지 — 잊으면 다시 헤맨다.
   *
   *  1. `next start` 를 쓸 수 없다. 빌드 결과인 out/ 을 정적 서버로 띄운다.
   *     → npm run preview  (serve out)
   *
   *  2. robots.ts / sitemap.ts 같은 메타데이터 라우트에는
   *     `export const dynamic = 'force-static'` 이 반드시 있어야 한다.
   *     없으면 "Collecting page data" 단계에서 빌드가 실패한다.
   *
   *  3. 서버 기능(Route Handler의 동적 응답, ISR, 미들웨어, next/image 최적화)을
   *     쓸 수 없다. 필요해지면 output: 'export' 를 걷어내야 한다.
   */
  output: 'export',

  /** out/ 에 디렉터리 + index.html 로 떨어지게 한다. routes.ts 의 경로도 슬래시로 끝난다. */
  trailingSlash: true,

  /** 정적 내보내기에서는 이미지 최적화 서버가 없으므로 필수 */
  images: { unoptimized: true },
};

export default nextConfig;
