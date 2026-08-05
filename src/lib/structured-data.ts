import { SITE } from '@/lib/site';

export const SITE_ENTITY_IDS = {
  organization: `${SITE.url}#organization`,
  website: `${SITE.url}#website`,
  author: `${SITE.url}#author`,
} as const;

/** 모든 페이지가 공유하는 사이트·운영 주체 엔티티다. */
export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': SITE_ENTITY_IDS.organization,
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        logo: {
          '@type': 'ImageObject',
          '@id': `${SITE.url}#logo`,
          url: new URL('/logo.svg', SITE.url).toString(),
          contentUrl: new URL('/logo.svg', SITE.url).toString(),
        },
        email: SITE.contactEmail,
      },
      {
        '@type': 'WebSite',
        '@id': SITE_ENTITY_IDS.website,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        publisher: { '@id': SITE_ENTITY_IDS.organization },
        inLanguage: 'ko',
      },
    ],
  };
}

/**
 * JSON-LD를 `<script>` 태그에 안전하게 삽입하기 위해 `<`를 이스케이프한다.
 * 값이 전부 저자 통제 상수라 현재 실질 위험은 없지만, 직렬화 지점을
 * 하나로 모아두면 이후 사용자 입력이 섞여도 별도 조치가 필요 없다.
 */
export function ldJson(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

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
