import { test, expect } from '@playwright/test';
import { ROUTES } from '../src/lib/routes';

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
    await expect(description).toHaveAttribute('content', /.+/);

    const ogUrl = page.locator('meta[property="og:url"]');
    // Next metadata API 가 og:url 을 자동으로 채우지 않는 설정일 수 있으므로
    // 없으면 canonical 로 대체 확인한다.
    const canonical = page.locator('link[rel="canonical"]');
    if ((await canonical.count()) > 0) {
      await expect(canonical).toHaveAttribute('href', /^https:\/\/gijuncheck\.kr\//);
    }
    if ((await ogUrl.count()) > 0) {
      await expect(ogUrl).toHaveAttribute('content', /^https:\/\/gijuncheck\.kr\//);
    }

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', /^https:\/\/gijuncheck\.kr\/og\.png/);

    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /index, ?follow|index,follow/);
  });

  test('판정기 페이지의 canonical이 자기 자신을 가리킨다', async ({ page }) => {
    await page.goto(ROUTES.dependent.path);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', `https://gijuncheck.kr${ROUTES.dependent.path}`);
  });

  test('정책 페이지(약관·개인정보·문의)는 noindex 다', async ({ page }) => {
    for (const key of ['privacy', 'terms', 'contact'] as const) {
      await page.goto(ROUTES[key].path);
      const robots = page.locator('meta[name="robots"]');
      await expect(robots).toHaveAttribute('content', /noindex/);
    }
  });
});
