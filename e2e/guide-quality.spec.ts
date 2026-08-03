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

    const officialSourceLinks = page.locator(
      'article a[target="_blank"][href*="law.go.kr"], ' +
        'article a[target="_blank"][href*="nhis.or.kr"], ' +
        'article a[target="_blank"][href*="gov.kr"], ' +
        'article a[target="_blank"][href*="nts.go.kr"]',
    );
    expect(
      await officialSourceLinks.count(),
      `${route.path} 공식 출처 링크`,
    ).toBeGreaterThan(0);

    const internalLinks = page.locator('article a[href^="/health-insurance/"]');
    expect(await internalLinks.count(), `${route.path} 내부 링크`).toBeGreaterThan(0);
  });
}

/**
 * 검색 유입이 많은 대표 가이드는 모바일에서 표·목록·출처 블록까지 한 번 더 본다.
 * 6편 전체를 모든 뷰포트에서 반복하지 않고, 레이아웃이 긴 두 편을 대표 샘플로 고정한다.
 */
const MOBILE_GUIDE_KEYS = ['guidePropertyTaxBase', 'guideLosingEligibility'] as const;

for (const key of MOBILE_GUIDE_KEYS) {
  const route = ROUTES[key];

  test(`${route.path} — 모바일 대표 가이드 렌더링`, async ({ page, isMobile }) => {
    test.skip(!isMobile, '모바일 프로젝트에서만 의미 있는 검사');
    await page.goto(route.path);

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      scrollWidth,
      `${route.path} 모바일 가로 스크롤 발생 (${scrollWidth} > ${clientWidth})`,
    ).toBeLessThanOrEqual(clientWidth + 1);

    await expect(page.locator('article h1')).toBeVisible();
    await expect(page.getByText('근거 · 출처', { exact: true })).toBeVisible();
    expect(await page.locator('article a[target="_blank"]').count()).toBeGreaterThan(0);
  });
}

test('모바일 FAQ 해시 진입 시 sticky header에 가리지 않는다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '모바일 프로젝트에서만 의미 있는 검사');
  await page.goto(`${ROUTES.guidePensionImpact.path}#faq-1`);

  const measurements = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('body > header');
    const target = document.getElementById('faq-1');
    return {
      headerHeight: header?.offsetHeight ?? 0,
      targetTop: target?.getBoundingClientRect().top ?? -1,
    };
  });

  expect(measurements.headerHeight).toBeGreaterThan(0);
  expect(measurements.targetTop).toBeGreaterThanOrEqual(measurements.headerHeight);
});

test('모바일 홈에 가로 스크롤이 없다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '모바일 프로젝트에서만 의미 있는 검사');
  await page.goto(ROUTES.home.path);

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
});

test('FAQ 해시 대상에 :target 강조가 적용된다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '모바일 프로젝트에서만 의미 있는 검사');
  await page.goto(`${ROUTES.guidePensionImpact.path}#faq-1`);

  const colors = await page.evaluate(() => ({
    target: getComputedStyle(document.getElementById('faq-1')!).backgroundColor,
    normal: getComputedStyle(document.getElementById('faq-2')!).backgroundColor,
  }));

  expect(colors.target).not.toBe(colors.normal);
});
