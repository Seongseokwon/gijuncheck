import { SITE } from '@/lib/site';

export interface BreadcrumbItem {
  name: string;
  path?: string;
}

/**
 * 실제 사이트 탐색 경로를 BreadcrumbList JSON-LD로 표현한다.
 * 마지막 항목은 현재 페이지이므로 item을 생략해도 Google 규칙에 맞는다.
 */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, path }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      ...(path ? { item: new URL(path, SITE.url).toString() } : {}),
    })),
  };
}
