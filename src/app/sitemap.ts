import type { MetadataRoute } from 'next';
import { indexableRoutes } from '@/lib/routes';
import { SITE } from '@/lib/site';

/**
 * 경로는 src/lib/routes.ts 의 레지스트리에서 자동으로 가져온다.
 * 페이지를 추가할 때 sitemap 을 따로 손댈 필요가 없다 —
 * ROUTES 에 등록하고 ready: true 로 바꾸면 여기에 반영된다.
 *
 * 경로가 전부 ASCII 이므로 인코딩 처리가 필요 없다.
 * canonical 과 sitemap 이 같은 문자열을 쓰게 되어 불일치가 생기지 않는다.
 */
// output: 'export' 에서는 메타데이터 라우트에 이 선언이 없으면 빌드가 실패한다.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return indexableRoutes().map((route) => ({
    url: new URL(route.path, SITE.url).toString(),
    // 빌드 시각을 넣으면 내용이 바뀌지 않아도 매 배포마다 lastmod가 변한다.
    // 실제 기준 확인일을 운영자가 갱신해 검색엔진에 안정적인 신선도 신호를 준다.
    lastModified: SITE.lastVerified,
    changeFrequency: 'monthly',
    priority: route.priority,
  }));
}
