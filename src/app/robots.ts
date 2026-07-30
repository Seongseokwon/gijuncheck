import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

// output: 'export' 에서는 메타데이터 라우트에 이 선언이 없으면 빌드가 실패한다.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: new URL('/sitemap.xml', SITE.url).toString(),
  };
}
