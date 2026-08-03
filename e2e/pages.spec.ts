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

test('모바일에서도 주요 메뉴가 노출되어 핵심 페이지에 접근할 수 있다', async ({ page, isMobile }) => {
  test.skip(!isMobile, '모바일 프로젝트에서만 의미 있는 검사');
  await page.goto('/');

  const mobileNav = page.getByRole('navigation', { name: '모바일 주요 메뉴' });
  await expect(mobileNav).toBeVisible();
  await expect(mobileNav.getByRole('link', { name: '가이드' })).toHaveAttribute('href', '/#guides');
  await expect(mobileNav.getByRole('link', { name: '이용 방법' })).toHaveAttribute('href', '/#journey');
  await expect(mobileNav.getByRole('link', { name: '피부양자 판정' })).toHaveAttribute('href', '/#judge');
  await expect(mobileNav.getByRole('link', { name: '검증 원칙' })).toHaveAttribute(
    'href',
    ROUTES.verificationPolicy.path,
  );
});

test('홈 — 검증된 보험료 도구는 모두 접근 가능하다', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.locator(`#journey a[href="${ROUTES.regionalPremium.path}"]`),
  ).toHaveCount(1);
  await expect(
    page.locator(`#journey a[href="${ROUTES.voluntaryContinuation.path}"]`),
  ).toHaveCount(1);
  await expect(page.getByText('공단 대조 미완료')).toHaveCount(0);
  const disabledCards = page.locator('[aria-disabled="true"]');
  await expect(disabledCards).toHaveCount(0);
});

test('임의계속가입 비교 — 자격 충족 시 보험료와 신청기한을 보여준다', async ({ page }) => {
  await page.goto(ROUTES.voluntaryContinuation.path);
  await page.getByLabel(/^퇴직 전 12개월 보수월액 평균/).fill('4000000');
  await page.getByLabel(/^퇴직 전 18개월 중 직장가입 개월수/).fill('12');
  await page.getByRole('button', { name: '어느 쪽이 유리한지 비교하기' }).click();

  await expect(page.getByRole('status')).toContainText('임의계속가입');
  await expect(page.getByRole('status')).toContainText('보수월액보험료 50% 경감');
  await expect(page.getByRole('status')).toContainText('납부기한으로부터 2개월');
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
