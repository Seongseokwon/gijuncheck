import { test, expect } from '@playwright/test';
import { ROUTES } from '../src/lib/routes';
import { fillMoney } from './helpers';

/**
 * P0-2 "키보드만으로 폼 입력·툴팁·결과까지 이동하고,
 * 모바일 입력 글자 크기가 16px 이상인지 확인한다"
 */

test('키보드만으로 관계 선택 → 소득 입력 → 제출 → 결과 근거 링크까지 이동할 수 있다', async ({ page }) => {
  await page.goto(ROUTES.dependent.path);

  const relationSelect = page.getByLabel('가입자와의 관계');
  await relationSelect.focus();
  await expect(relationSelect).toBeFocused();
  await relationSelect.selectOption({ label: '배우자' });

  const wageInput = page.getByLabel('근로소득');
  await wageInput.focus();
  await expect(wageInput).toBeFocused();
  await page.keyboard.type('12000000');
  await expect(wageInput).toHaveValue('12,000,000');

  const submitButton = page.getByRole('button', { name: '내 자격 판정하기' });
  await submitButton.focus();
  await expect(submitButton).toBeFocused();
  await page.keyboard.press('Enter');

  const zeroValueDialog = page.getByRole('dialog', { name: '0원 입력 항목을 확인해 주세요' });
  await expect(zeroValueDialog).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');

  const result = page.getByRole('status');
  await expect(result).toBeVisible();

  // 결과 안의 근거 링크까지 Tab 만으로 도달 가능해야 한다 (mouse 이벤트 없이)
  const firstBasisLink = result.getByRole('link').first();
  await firstBasisLink.focus();
  await expect(firstBasisLink).toBeFocused();
});

test('0원 확인 모달은 포커스를 가두고 닫힌 뒤 제출 버튼으로 복원한다', async ({ page }) => {
  await page.goto(ROUTES.dependent.path);

  const submitButton = page.getByRole('button', { name: '내 자격 판정하기' });
  await submitButton.focus();
  await submitButton.click();

  const dialog = page.getByRole('dialog', { name: '0원 입력 항목을 확인해 주세요' });
  const editButton = dialog.getByRole('button', { name: '입력 수정하기' });
  const confirmButton = dialog.getByRole('button', { name: '확인하고 판정하기' });

  await expect(editButton).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(confirmButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(editButton).toBeFocused();
  await page.keyboard.press('Escape');

  await expect(dialog).toHaveCount(0);
  await expect(submitButton).toBeFocused();
});

test('소득 입력 도움말 툴팁은 Tab 포커스만으로 스크린리더가 읽을 수 있다', async ({ page }) => {
  await page.goto(ROUTES.dependent.path);

  // '공적연금소득' Field 의 InfoTooltip — 마우스 hover 없이 focus 만으로 접근
  const tooltip = page.getByRole('button', { name: /도움말: 개인연금은 제외/ });
  await tooltip.focus();
  await expect(tooltip).toBeFocused();
  await expect(tooltip).toHaveAttribute('aria-label', '도움말: 개인연금은 제외');
  await tooltip.click();
  await expect(tooltip).toHaveAttribute('aria-expanded', 'true');
  await expect(tooltip.getByRole('tooltip')).toHaveClass(/opacity-100/);
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveAttribute('aria-expanded', 'false');
});

test('도움말이 있는 필드도 데스크톱에서 같은 행에 정렬된다', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', '데스크톱 그리드 정렬 검사');

  const cases = [
    {
      path: ROUTES.dependent.path,
      rows: [
        ['사업소득', '근로소득', '공적연금소득'],
        ['금융소득', '기타소득'],
        ['사업자등록', '재산세 과세표준'],
      ],
    },
    {
      path: ROUTES.regionalPremium.path,
      rows: [
        ['사업소득 (100%)', '금융소득 (100%)', '기타소득 (100%)'],
        ['근로소득 (50%)', '공적연금소득 (50%)'],
      ],
    },
    {
      path: ROUTES.voluntaryContinuation.path,
      rows: [
        ['근로소득 (50%)', '연금소득 (50%)', '사업소득 (100%)'],
        ['금융소득 (100%)', '기타소득 (100%)'],
      ],
    },
  ] as const;

  for (const { path, rows } of cases) {
    await page.goto(path);

    for (const row of rows) {
      const boxes = await Promise.all(
        row.map(async (label) => {
          const box = await page.getByLabel(label).boundingBox();
          expect(box, `${label} 입력 필드 위치`).not.toBeNull();
          return box;
        }),
      );
      expect(new Set(boxes.map((box) => Math.round(box!.y))).size, `${row.join(', ')} 행 정렬`).toBe(1);
    }
  }
});

test('탈락 시 이어지는 CTA가 금액을 URL에 노출하지 않고 지역보험료 계산으로 연결된다', async ({ page }) => {
  await page.goto(ROUTES.dependent.path);
  await page.getByLabel('가입자와의 관계').selectOption({ label: '배우자' });
  await fillMoney(page.getByLabel('근로소득'), 30000000); // 소득요건 초과로 탈락시킴
  await page.getByRole('button', { name: '내 자격 판정하기' }).click();
  await page.getByRole('dialog', { name: '0원 입력 항목을 확인해 주세요' })
    .getByRole('button', { name: '확인하고 판정하기' })
    .click();

  await expect(page.getByRole('status')).toContainText('탈락할 것으로 보입니다');
  const link = page.getByRole('link', { name: /보험료는 얼마인가요/ });
  await expect(link).toHaveAttribute('href', ROUTES.regionalPremium.path);
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${ROUTES.regionalPremium.path.replaceAll('/', '\\/')}$`));
  await expect(page.getByLabel('근로소득 (50%)')).toHaveValue('30,000,000');
  expect(new URL(page.url()).search).toBe('');
});

test.describe('모바일 입력 글자 크기', () => {
  test('금액 입력 필드가 375px 폭에서 16px 이상이다 (iOS 자동확대 방지)', async ({ page, isMobile }) => {
    test.skip(!isMobile, '모바일 프로젝트에서만 의미 있는 검사');
    await page.goto(ROUTES.dependent.path);
    const input = page.getByLabel('근로소득');
    const fontSize = await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize, '모바일 입력 글자 크기').toBeGreaterThanOrEqual(16);
  });
});
