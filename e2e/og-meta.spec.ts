import { test, expect } from '@playwright/test';
import { ROUTES, indexableRoutes, ogImageForPath, type RouteEntry } from '../src/lib/routes';
import { SITE } from '../src/lib/site';

/*
 * `Object.values(ROUTES)` 는 유니온 타입이라 noindex 를 선언하지 않은 항목에서
 * 그 속성이 사라진다(routes.ts 말미의 주석과 같은 이유). RouteEntry[] 로 받아
 * 옵셔널 속성으로 다룬다.
 */
const ALL_ROUTES: RouteEntry[] = Object.values(ROUTES);

/**
 * P0-2 "실제 프로덕션 URL의 OG 이미지·title·description을 확인한다" 의 로컬에서
 * 가능한 부분만 검증한다.
 *
 * 여기서 확인하는 것: canonical·og:url·og:image 가 gijuncheck.kr 절대경로로
 * 빌드됐는지, title/description 이 비어있지 않은지.
 * 여기서 확인하지 못하는 것: OG 이미지가 실제로 200을 반환하는지, 카카오·트위터
 * 공유 미리보기가 실제로 어떻게 보이는지 — 이건 도메인이 살아있는 실제
 * 프로덕션에서 손으로 확인해야 한다 (04-실행-우선순위.md P0-2).
 */

test.describe('OG/canonical 메타데이터', () => {
  test.beforeEach(({ }, testInfo) => {
    // 뷰포트와 무관한 <head> 검사이므로 한 프로젝트에서만 실행한다
    test.skip(testInfo.project.name !== 'desktop-1440', '메타데이터는 뷰포트 무관, 1회만 검사');
  });

  test('홈의 canonical·OG·title·description이 gijuncheck.kr 절대경로로 채워져 있다', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/기준체크/);

    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', SITE.homeDescription);

    const ogDescription = page.locator('meta[property="og:description"]');
    await expect(ogDescription).toHaveAttribute('content', SITE.homeDescription);

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', 'https://gijuncheck.kr/');

    const ogUrl = page.locator('meta[property="og:url"]');
    await expect(ogUrl).toHaveAttribute('content', 'https://gijuncheck.kr/');

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', 'https://gijuncheck.kr/og/home.png');

    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });

  test('준비된 페이지마다 해당 페이지 전용 OG 이미지를 사용한다', async ({ page }) => {
    const readyRoutes = ALL_ROUTES.filter((entry) => entry.ready);
    const images = new Set<string>();

    for (const route of readyRoutes) {
      await page.goto(route.path);
      const expectedImage = new URL(ogImageForPath(route.path), SITE.url).toString();
      const ogImage = page.locator('meta[property="og:image"]');

      await expect(ogImage, `${route.path} OG image`).toHaveAttribute('content', expectedImage);
      const imageResponse = await page.request.get(new URL(expectedImage).pathname);
      expect(imageResponse.status(), `${route.path} OG image status`).toBe(200);
      expect(imageResponse.headers()['content-type'], `${route.path} OG image type`).toContain('image/png');
      images.add(expectedImage);
    }

    expect(images.size).toBe(readyRoutes.length);
  });

  test('공개·정책 페이지의 canonical과 og:url이 같은 자기 URL을 가리킨다', async ({ page }) => {
    for (const route of ALL_ROUTES.filter((entry) => entry.ready)) {
      await page.goto(route.path);
      const expectedUrl = `https://gijuncheck.kr${route.path}`;

      await expect(
        page.locator('link[rel="canonical"]'),
        `${route.path} canonical 개수`,
      ).toHaveCount(1);
      await expect(
        page.locator('link[rel="canonical"]'),
        `${route.path} canonical`,
      ).toHaveAttribute('href', expectedUrl);
      await expect(
        page.locator('meta[property="og:url"]'),
        `${route.path} og:url`,
      ).toHaveAttribute('content', expectedUrl);
      await expect(
        page.locator('meta[property="og:title"]'),
        `${route.path} og:title`,
      ).toHaveAttribute('content', /.+/);
      await expect(
        page.locator('meta[property="og:description"]'),
        `${route.path} og:description`,
      ).toHaveAttribute('content', /.+/);
    }
  });

  test('404 페이지는 홈 canonical을 물려받지 않는다', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist/');

    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle('페이지를 찾을 수 없습니다 | 기준체크');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    const noindexRobots = page.locator('meta[name="robots"][content*="noindex"]');
    await expect(noindexRobots).toHaveCount(1);
  });

  test('정책 페이지(약관·개인정보·문의)는 noindex 다', async ({ page }) => {
    for (const key of ['privacy', 'terms', 'contact'] as const) {
      await page.goto(ROUTES[key].path);
      const robots = page.locator('meta[name="robots"]');
      await expect(robots).toHaveAttribute('content', /noindex/);
    }
  });

  /**
   * 공개 상태(`ready`)와 색인 상태(`robots`)가 어긋나면 두 방향 모두 손해다.
   *  - 공개했는데 noindex 로 남으면 검색에 영원히 안 잡힌다.
   *  - 대조 전인데 index 면 검증 안 된 계산 결과가 검색에 노출된다.
   * P2-1·P2-2 처럼 `ready` 를 뒤집을 때 페이지의 `robots` 를 같이 고치는 걸
   * 잊기 쉬우므로 레지스트리와 실제 메타 태그를 대조한다.
   */
  test('공개된 도구는 색인 가능하고, 비공개 도구는 noindex 다', async ({ page }) => {
    for (const route of ALL_ROUTES) {
      if (route.noindex) continue; // 정책 페이지는 위 테스트가 본다

      const res = await page.goto(route.path);
      if (!route.ready) {
        // 아직 공개하지 않은 도구는 페이지가 없거나, 있어도 색인되면 안 된다
        if ((res?.status() ?? 404) >= 400) continue;
        await expect(
          page.locator('meta[name="robots"]'),
          `${route.path} 는 ready:false 인데 색인 허용 상태다`,
        ).toHaveAttribute('content', /noindex/);
        continue;
      }

      const robots = page.locator('meta[name="robots"]');
      if ((await robots.count()) === 0) continue; // 기본값(색인 허용)

      await expect(
        robots,
        `${route.path} 는 공개(ready:true)인데 noindex 로 막혀 있다`,
      ).not.toHaveAttribute('content', /noindex/);
    }
  });

  test('sitemap 은 공개·색인 대상 경로와 정확히 일치한다', async ({ page }) => {
    const res = await page.goto('/sitemap.xml');
    const xml = await res!.text();
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => new URL(m[1]).pathname)
      .sort();

    // sitemap 생성과 같은 함수를 쓴다 — 규칙이 아니라 결과가 어긋나는지를 본다
    const expected = indexableRoutes()
      .map((r) => r.path)
      .sort();

    expect(paths).toEqual(expected);
  });

  test('sitemap 의 lastmod 는 빌드 시각이 아닌 경로별 실제 변경일을 사용한다', async ({ page }) => {
    const res = await page.goto('/sitemap.xml');
    const xml = await res!.text();
    const entries = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map(
      (match) => [new URL(match[1]).pathname, match[2]] as const,
    );
    const expected = indexableRoutes().map(
      (route) => [route.path, route.lastModified] as const,
    );

    expect(entries).toEqual(expected);
    expect(entries.every(([, value]) => /^\d{4}-\d{2}-\d{2}$/.test(value))).toBe(true);
    expect(new Set(entries.map(([, value]) => value)).size).toBeGreaterThan(1);
  });

  test('sitemap 의 changefreq 는 경로별 콘텐츠 주기를 반영한다', async ({ page }) => {
    const res = await page.goto('/sitemap.xml');
    const xml = await res!.text();
    const entries = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>[^<]+<\/lastmod>\s*<changefreq>([^<]+)<\/changefreq>/g)].map(
      (match) => [new URL(match[1]).pathname, match[2]] as const,
    );
    const expected = indexableRoutes().map(
      (route) => [route.path, route.changeFrequency] as const,
    );

    expect(entries).toEqual(expected);
    expect(new Set(entries.map(([, value]) => value)).size).toBeGreaterThan(1);
  });
});
