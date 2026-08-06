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
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: SITE.contactEmail,
          availableLanguage: ['ko'],
        },
        // 엔티티 해소용 외부 앵커. 비어 있으면 필드 자체를 내보내지 않는다.
        ...(SITE.sameAs.length > 0 ? { sameAs: [...SITE.sameAs] } : {}),
        knowsAbout: [...SITE.knowsAbout],
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

/** `YYYY-MM-DD` 를 KST 기준 ISO 8601 로 바꾼다. */
function toIsoDateTime(date: string): string {
  return `${date}T00:00:00+09:00`;
}

/**
 * 도구 페이지가 공통 발행 주체와 연결되는 WebApplication 엔티티다.
 *
 * WebApplication 은 CreativeWork 의 하위 타입이라 author·dateModified 를 가진다.
 * 이 도구들은 매년 바뀌는 요율·기준 금액을 담고 있으므로, 화면에 보이는
 * "최종 확인" 날짜와 같은 값을 구조화 데이터에도 넣어야 한다.
 * 넣지 않으면 검색·AI 쪽에서 이 페이지가 언제 기준 갱신되었는지 알 수 없다.
 */
export function webApplicationJsonLd({
  name,
  url,
  description,
  dateModified,
}: {
  name: string;
  url: string;
  description: string;
  /** 해당 도구의 기준·요율을 마지막으로 확인한 날 (`YYYY-MM-DD`) */
  dateModified?: string;
}) {
  const absoluteUrl = new URL(url, SITE.url).toString();
  const modified = dateModified ?? SITE.lastVerified;
  return {
    '@type': 'WebApplication',
    '@id': `${absoluteUrl}#application`,
    name,
    url: absoluteUrl,
    description,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    provider: { '@id': SITE_ENTITY_IDS.organization },
    publisher: { '@id': SITE_ENTITY_IDS.organization },
    author: authorJsonLd(),
    dateModified: toIsoDateTime(modified),
    inLanguage: 'ko',
    isPartOf: { '@id': SITE_ENTITY_IDS.website },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
  };
}

/**
 * 콘텐츠 작성 주체 Person 엔티티.
 *
 * `@id` 로 전 페이지가 같은 노드를 참조하므로, 어느 페이지에서 정의하든
 * 하나의 인물로 병합된다. 검증 원칙 페이지가 이 인물의 상세 설명을 갖는다.
 */
export function authorJsonLd() {
  return {
    '@type': 'Person' as const,
    '@id': SITE_ENTITY_IDS.author,
    name: SITE.authorName,
    url: new URL('/verification-policy/', SITE.url).toString(),
    knowsAbout: [...SITE.knowsAbout],
  };
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
