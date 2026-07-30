/** @type {import('next').NextConfig} */
const nextConfig = {
  // 전 페이지 정적 발행. 판정·계산은 클라이언트에서 수행하므로 서버 런타임이 필요 없다.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
