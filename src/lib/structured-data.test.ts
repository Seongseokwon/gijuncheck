import { describe, expect, it } from 'vitest';
import { ldJson, siteJsonLd, SITE_ENTITY_IDS, webApplicationJsonLd } from './structured-data';

describe('구조화 데이터', () => {
  it('사이트 엔티티가 운영자 연락처와 고정 ID를 제공한다', () => {
    const graph = siteJsonLd()['@graph'];
    const organization = graph.find((node) => node['@type'] === 'Organization');
    const website = graph.find((node) => node['@type'] === 'WebSite');

    expect(organization).toMatchObject({
      '@id': SITE_ENTITY_IDS.organization,
      contactPoint: { email: expect.any(String) },
    });
    expect(website).toMatchObject({
      '@id': SITE_ENTITY_IDS.website,
      publisher: { '@id': SITE_ENTITY_IDS.organization },
    });
  });

  it('도구 엔티티가 URL·설명·발행 주체를 연결한다', () => {
    expect(
      webApplicationJsonLd({
        name: '테스트 도구',
        url: '/test/',
        description: '테스트 설명',
      }),
    ).toMatchObject({
      '@type': 'WebApplication',
      url: expect.stringContaining('/test/'),
      description: '테스트 설명',
      provider: { '@id': SITE_ENTITY_IDS.organization },
    });
  });

  it('script 종료 문자열을 JSON-LD 안에서 안전하게 이스케이프한다', () => {
    const serialized = ldJson({ text: '</script><script>alert(1)</script>' });
    expect(serialized).not.toContain('</script>');
    expect(serialized).toContain('\\u003c/script>');
  });
});
