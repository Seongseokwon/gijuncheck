import { test, expect, type Page } from '@playwright/test';
import { ROUTES } from '../src/lib/routes';

/**
 * P2-2 "임의계속가입 비교 공개" 화면 QA.
 *
 * 이 화면의 위험은 두 가지다.
 *  1. 신청기한을 "퇴직 후 90일"로 안내하는 것. 낡은 기준이고, 이걸 믿으면
 *     사용자가 기한을 놓쳐 지역보험료를 그대로 부담한다.
 *  2. "무조건 임의계속이 싸다"는 인상. 재산·보수 조건에 따라 뒤집힌다.
 *
 * 금액 자체의 정확성은 `src/lib/premium/regional.test.ts` 가 본다.
 * 여기서는 조건에 따라 결론과 안내가 바뀌는지를 화면에서 확인한다.
 */

const MONTHS_FIELD = '퇴직 전 18개월 중 직장가입 개월수';

test.beforeEach(async ({ page }) => {
  await page.goto(ROUTES.voluntaryContinuation.path);
});

function field(page: Page, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return page.getByLabel(new RegExp(`^${escaped}`));
}

async function fill(page: Page, label: string, value: number) {
  await field(page, label).fill(String(value));
}

async function compare(page: Page) {
  await page.getByRole('button', { name: '어느 쪽이 유리한지 비교하기' }).click();
}

function result(page: Page) {
  return page.getByRole('status');
}

test('제출 전에는 결과 영역이 렌더링되지 않는다', async ({ page }) => {
  await expect(result(page)).toHaveCount(0);
});

test('직장가입 기간이 12개월 미만이면 신청 불가로 안내하고 지역보험료만 보여준다', async ({
  page,
}) => {
  await fill(page, MONTHS_FIELD, 11);
  await compare(page);

  await expect(result(page)).toContainText('임의계속가입을 신청할 수 없습니다');
  await expect(result(page)).toContainText('지역가입자 보험료');
  await expect(result(page)).not.toContainText('유리합니다');
});

test('12개월을 채우면 두 선택지를 금액으로 비교한다', async ({ page }) => {
  await fill(page, MONTHS_FIELD, 12);
  await compare(page);

  await expect(result(page)).toContainText('유리합니다');
  await expect(result(page)).toContainText('지역가입자');
  await expect(result(page)).toContainText('임의계속가입');
});

test.describe('결론은 조건에 따라 뒤집힌다', () => {
  /**
   * "임의계속가입이 항상 싸다"는 오해를 화면이 만들지 않는지 본다.
   * 임의계속가입 보험료에는 재산이 반영되지 않으므로, 재산이 커질수록
   * 임의계속가입 쪽이 유리해져야 한다.
   */
  test('재산이 많으면 임의계속가입이 유리하다고 결론 낸다', async ({ page }) => {
    await fill(page, '재산금액 합계', 900_000_000);
    await compare(page);

    await expect(result(page)).toContainText('임의계속가입가 월');
    await expect(result(page)).toContainText('재산 미반영');
  });

  test('재산이 없고 퇴직 전 보수가 높으면 지역가입자가 유리하다고 결론 낸다', async ({
    page,
  }) => {
    await fill(page, '퇴직 전 12개월 보수월액 평균', 12_000_000);
    await compare(page);

    await expect(result(page)).toContainText('지역가입자가 월');
  });
});

test('신청기한을 "퇴직 후 90일"로 안내하지 않는다', async ({ page }) => {
  await compare(page);

  // 실제 기한은 최초 지역보험료 고지의 납부기한부터 2개월이다
  await expect(result(page)).toContainText('납부기한');
  await expect(result(page)).toContainText('2개월');
  await expect(result(page)).toContainText('소급 인정');
  await expect(result(page)).not.toContainText('퇴직 후 90일');
});

test('보수 외 소득이 연 2,000만원을 넘으면 추가 보험료가 있다는 것을 알려준다', async ({
  page,
}) => {
  await fill(page, '사업소득 (100%)', 30_000_000);
  await compare(page);

  // 금액의 정확성은 단위 테스트가 본다. 여기서는 존재 여부만 고정한다.
  await expect(result(page)).toContainText('보수 외 소득보험료 추가');
});

test('보수 외 소득이 기준 이하이면 추가 보험료 줄을 띄우지 않는다', async ({ page }) => {
  await fill(page, '사업소득 (100%)', 10_000_000);
  await compare(page);

  await expect(result(page)).toBeVisible();
  await expect(result(page)).not.toContainText('보수 외 소득보험료 추가');
});

test('지역보험료 계산기에서 넘어온 재산금액이 다시 입력하지 않아도 채워진다', async ({
  page,
}) => {
  await page.goto(`${ROUTES.voluntaryContinuation.path}?property=300000000`);
  await expect(field(page, '재산금액 합계')).toHaveValue('300,000,000');
});

test('공식 대조 상태에 맞는 고지를 보여주고 면책·비저장 안내가 함께 있다', async ({ page }) => {
  await expect(page.getByText('입력값은 브라우저 안에서만 계산되며 저장되지 않습니다')).toBeVisible();

  await compare(page);

  await expect(result(page)).toContainText('법적 효력이 없습니다');
  await expect(result(page)).toContainText('1577-1000');
});

test('결과가 나온 뒤에도 가로 스크롤을 만들지 않는다', async ({ page }) => {
  await fill(page, '재산금액 합계', 900_000_000);
  await fill(page, '사업소득 (100%)', 50_000_000);
  await compare(page);

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `결과 표시 후 가로 스크롤 발생 (${scrollWidth} > ${clientWidth})`)
    .toBeLessThanOrEqual(clientWidth + 1);
});
