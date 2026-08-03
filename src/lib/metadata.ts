import type { Metadata } from 'next';
import { SITE } from '@/lib/site';

type OpenGraphKind = 'website' | 'article';

interface PageMetadataOptions {
  title: string;
  description?: string;
  path: string;
  type?: OpenGraphKind;
  robots?: Metadata['robots'];
}

/**
 * 페이지 canonical과 공유 메타데이터가 같은 절대 URL을 사용하도록 묶는다.
 * 레이아웃의 기본 OG URL은 홈을 가리키므로, 하위 페이지는 이 함수를 사용해야 한다.
 */
export function createPageMetadata({
  title,
  description,
  path,
  type = 'website',
  robots,
}: PageMetadataOptions): Metadata {
  const url = new URL(path, SITE.url).toString();
  const image = new URL(SITE.ogImage, SITE.url).toString();
  const summary = description || SITE.description;

  return {
    title,
    description: summary,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE.name,
      locale: 'ko_KR',
      url,
      title,
      description: summary,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: summary,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: summary,
      images: [image],
    },
    ...(robots ? { robots } : {}),
  };
}
