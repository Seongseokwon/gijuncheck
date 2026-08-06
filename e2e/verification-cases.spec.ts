import { test, expect } from '@playwright/test';
import { ROUTES } from '../src/lib/routes';
import {
  summarizeVerificationCases,
  VERIFICATION_CASE_GROUPS,
  VERIFICATION_TIERS,
} from '../src/lib/verification/cases';

/**
 * A안 3-4 "검증 원칙 페이지를 사례 기록표로 승격" 회귀 검사.
 *
 * 이 페이지의 사례 표는 서비스 포지셔닝(좁은 범위 × 최고 검증 깊이)의 실체다.
 * 표가 조용히 사라지거나, 불리한 사례만 빠지거나, 요약 숫자가 표와 어긋나는 것을
 * 배포 전에 잡는다.
 */

const PATH = ROUTES.verificationPolicy.path;
const SUMMARY = summarizeVerificationCases();

test.beforeEach(async ({ page }) => {
  await page.goto(PATH);
});

test('사례 기록 섹션과 묶음별 표가 모두 렌더링된다', async ({ page }) => {
  const cases = page.locator('#cases');
  await expect(cases).toBeVisible();

  // #cases 가 섹션이 아니라 제목 h2 에 붙어 있어도 toBeVisible 은 통과한다.
  // 실제로 그렇게 잘못 붙였다가 다른 테스트 3개가 깨졌으므로, 여기서 범위를 고정한다.
  await expect(cases.locator('table')).toHaveCount(VERIFICATION_CASE_GROUPS.length);

  for (const group of VERIFICATION_CASE_GROUPS) {
    const section = page.locator(`#${group.id}`);
    await expect(section).toBeVisible();
    // 헤더 행을 뺀 데이터 행 수가 데이터와 일치해야 한다.
    await expect(section.locator('tbody tr')).toHaveCount(group.cases.length);
  }
});

test('요약 숫자가 실제 사례 수와 일치한다', async ({ page }) => {
  const cases = page.locator('#cases');
  await expect(cases).toContainText(`${SUMMARY.total}건`);
  await expect(cases).toContainText(`${SUMMARY.matched}건`);
  await expect(cases).toContainText(`${SUMMARY.unknown}건`);
});

test('확인하지 못한 사례를 표에서 빼지 않는다', async ({ page }) => {
  // 이 표의 차별점은 불리한 사례를 남기는 것이다.
  // 미확인 묶음이 사라지면 표는 홍보물이 된다.
  const unverified = VERIFICATION_CASE_GROUPS.find((g) => g.tier === 'unverified');
  expect(unverified).toBeDefined();

  const section = page.locator(`#${unverified!.id}`);
  await expect(section).toBeVisible();
  await expect(section.locator('tbody tr')).toHaveCount(unverified!.cases.length);

  for (const item of unverified!.cases) {
    await expect(section).toContainText(item.id);
  }
});

test('대조 등급 범례가 네 등급을 모두 설명한다', async ({ page }) => {
  const cases = page.locator('#cases');
  for (const tier of Object.values(VERIFICATION_TIERS)) {
    await expect(cases.getByText(tier.label).first()).toBeVisible();
  }
});

test('모든 사례 행이 대조일을 time 요소로 표시한다', async ({ page }) => {
  const times = page.locator('#cases tbody time[datetime]');
  await expect(times).toHaveCount(SUMMARY.total);
});

test('사례 표의 대조 기준 링크는 새 탭 + noopener 로 열린다', async ({ page }) => {
  for (const group of VERIFICATION_CASE_GROUPS) {
    const link = page.locator(`#${group.id}`).getByRole('link', {
      name: new RegExp(group.source.label.slice(0, 12)),
    });
    await expect(link.first()).toHaveAttribute('target', '_blank');
    await expect(link.first()).toHaveAttribute('rel', /noopener/);
  }
});
