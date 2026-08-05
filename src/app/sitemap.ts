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
    // 공통 배포일이 아니라 각 경로의 실제 콘텐츠·기준 변경일을 사용한다.
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
