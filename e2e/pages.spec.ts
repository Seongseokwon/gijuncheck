import { test, expect } from '@playwright/test';
import { ROUTES } from '../src/lib/routes';

/**
 * P0-2 "데스크톱·모바일·태블릿 폭에서 홈·판정기·결과·가이드·검증 원칙을 확인한다".
 * playwright.config.ts 의 3개 프로젝트(desktop-1440/tablet-768/mobile-375)가
 * 이 파일을 각각 실행한다.
 */

const PAGES = Object.values(ROUTES).filter((r) => r.ready);

for (const route of PAGES) {
  test(`${route.path} — 레이아웃 깨짐·가로 스크롤 없이 로드된다`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const response = await page.goto(route.path);
    expect(response?.status(), `${route.path} HTTP 상태`).toBeLessThan(400);

    // 본문이 뷰포트 폭을 넘어 가로 스크롤을 만들면 안 된다 (모바일에서 가장 흔한 결함)
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      scrollWidth,
      `${route.path} 가 뷰포트(${clientWidth}px)보다 넓게 렌더링됨 (scrollWidth=${scrollWidth}px)`,
    ).toBeLessThanOrEqual(clientWidth + 1); // 서브픽셀 반올림 여유 1px

    expect(consoleErrors, `${route.path} 콘솔 에러: ${consoleErrors.join(' | ')}`).toEqual([]);
  });
}

test('홈 — 상단 CTA(피부양자 등록 전 기준 확인하기)가 판정 섹션으로 스크롤된다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '피부양자 등록 전 기준 확인하기' }).click();
  await expect(page.locator('#judge')).toBeInViewport();
});

test('홈 — 준비 중인 도구(지역보험료·임의계속가입)는 클릭 불가능한 카드로만 노출된다', async ({ page }) => {
  await page.goto('/');
  // regionalPremium·voluntaryContinuation 두 카드 모두 "공단 대조 미완료" 배지가 붙어야 한다.
  // ready:false 인 도구가 실수로 클릭 가능한 <a> 로 노출되면 안 된다 (04-실행-우선순위.md 안전 규칙 3).
  await expect(page.getByText('공단 대조 미완료')).toHaveCount(2);
  const disabledCards = page.locator('[aria-disabled="true"]');
  await expect(disabledCards).toHaveCount(2);
  for (const card of await disabledCards.all()) {
    await expect(card.locator('a')).toHaveCount(0);
  }
});

test('검증 원칙 페이지가 정상 로드된다', async ({ page }) => {
  await page.goto(ROUTES.verificationPolicy.path);
  await expect(page.locator('h1')).toBeVisible();
});

test('정책 페이지(개인정보·이용약관·문의)가 모두 정상 로드된다', async ({ page }) => {
  for (const key of ['privacy', 'terms', 'contact'] as const) {
    const res = await page.goto(ROUTES[key].path);
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toBeVisible();
  }
});
