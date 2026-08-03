import { test, expect } from '@playwright/test';
import { GUIDE_KEYS, ROUTES } from '../src/lib/routes';

/**
 * P1-3 가이드 품질 표면을 고정한다.
 * 본문 내용의 법률적 정확성은 공식 출처 대조로 확인하고,
 * 여기서는 검색 유입 후 필요한 답변·근거·다음 행동의 UI가 빠지지 않는지 검사한다.
 */
for (const key of GUIDE_KEYS) {
  const route = ROUTES[key];

  test(`${route.path} — 독립 유입 품질 표면`, async ({ page }) => {
    await page.goto(route.path);

    await expect(page.locator('article h1')).toBeVisible();
    await expect(page.getByText('한 줄 답변', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: '자주 묻는 질문' })).toBeVisible();
    await expect(page.getByText('함께 읽기', { exact: true })).toBeVisible();
    await expect(page.getByText('근거 · 출처', { exact: true })).toBeVisible();

    const sourceLinks = page.locator('article a[target="_blank"]');
    expect(await sourceLinks.count(), `${route.path} 출처 링크`).toBeGreaterThan(0);

    const internalLinks = page.locator('article a[href^="/health-insurance/"]');
    expect(await internalLinks.count(), `${route.path} 내부 링크`).toBeGreaterThan(0);
  });
}
