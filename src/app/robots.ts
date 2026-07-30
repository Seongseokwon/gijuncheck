import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

// output: 'export' 에서는 메타데이터 라우트에 이 선언이 없으면 빌드가 실패한다.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  // 최종 도메인이 아니면 전체 차단.
  // 임시 URL 이 색인되면 canonical 불일치와 리다이렉트 부채가 생긴다.
  if (!SITE.indexable) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: new URL('/sitemap.xml', SITE.url).toString(),
  };
}
