import { test, expect, type Page } from '@playwright/test';
import { ROUTES } from '../src/lib/routes';

/**
 * P0-2 "판정기의 관계 유형, 소득 경계, 재산 경계, 오류 메시지, 결과의 근거 링크를 손으로 점검한다"
 * 를 자동화한다.
 *
 * 경계값은 src/lib/constants/2026.ts 를 따른다. 연도가 바뀌어 그 파일의 값이
 * 바뀌면 아래 리터럴도 함께 갱신해야 한다 (파일 자체를 import 하지 않는 이유는
 * playwright 가 tsconfig paths(@/) 를 해석하지 못해서다).
 */
const INCOME_TOTAL_LIMIT = 20_000_000; // INCOME.TOTAL_LIMIT
const PROPERTY_SAFE_LIMIT = 540_000_000; // PROPERTY.SAFE_LIMIT
const PROPERTY_HARD_LIMIT = 900_000_000; // PROPERTY.HARD_LIMIT

test.beforeEach(async ({ page }) => {
  await page.goto(ROUTES.dependent.path);
});

async function selectRelation(page: Page, label: string) {
  await page.getByLabel('가입자와의 관계').selectOption({ label });
}

async function setCohabiting(page: Page, cohabiting: boolean) {
  await page.getByLabel('동거 여부').selectOption({ label: cohabiting ? '동거' : '비동거' });
}

async function submit(page: Page) {
  await page.getByRole('button', { name: '내 자격 판정하기' }).click();
  const dialog = page.getByRole('dialog', { name: '0원 입력 항목을 확인해 주세요' });
  const status = page.getByRole('status');
  await expect
    .poll(async () => {
      if (await dialog.isVisible()) return 'dialog';
      if (await status.isVisible()) return 'status';
      return 'pending';
    })
    .toMatch(/dialog|status/);

  if (await dialog.isVisible()) {
    await dialog.getByRole('button', { name: '확인하고 판정하기' }).click();
  }
}

function result(page: Page) {
  return page.getByRole('status');
}

test.describe('관계 유형별 조건부 입력', () => {
  test('형제자매를 선택하면 나이 입력이 나타난다', async ({ page }) => {
    await expect(page.getByLabel('만 나이')).toHaveCount(0);
    await selectRelation(page, '형제자매');
    await expect(page.getByLabel('만 나이')).toBeVisible();
  });

  test('비동거 직계존속을 선택하면 형제자매 소득 여부 입력이 나타난다', async ({ page }) => {
    await expect(page.getByLabel('대상자와 동거하는 형제자매의 소득')).toHaveCount(0);
    await selectRelation(page, '직계존속 (부모·조부모)');
    await setCohabiting(page, false);
    await expect(page.getByLabel('대상자와 동거하는 형제자매의 소득')).toBeVisible();
  });

  test('배우자를 선택하면 나이·형제자매소득 입력이 모두 없다', async ({ page }) => {
    await selectRelation(page, '배우자');
    await expect(page.getByLabel('만 나이')).toHaveCount(0);
    await expect(page.getByLabel('대상자와 동거하는 형제자매의 소득')).toHaveCount(0);
  });

  test('관계를 바꾸면 관계별로 먼저 확인할 기준이 바뀐다', async ({ page }) => {
    await selectRelation(page, '형제자매');
    await expect(page.getByText('형제자매 관계별로 먼저 확인할 기준')).toBeVisible();
    await expect(page.locator('body')).toContainText('재산 기준도 일반 관계보다 엄격합니다');
  });
});

test.describe('소득요건 경계값 — 합산소득 2,000만원', () => {
  test('정확히 2,000만원이면 소득요건을 통과한다', async ({ page }) => {
    await selectRelation(page, '배우자'); // 부양요건은 항상 통과, 소득요건만 본다
    await page.getByLabel('근로소득').fill(String(INCOME_TOTAL_LIMIT));
    await submit(page);
    await expect(result(page)).toContainText('인정될 것으로 보입니다');
  });

  test('2,000만원을 1원이라도 초과하면 소득요건에서 탈락한다', async ({ page }) => {
    await selectRelation(page, '배우자');
    await page.getByLabel('근로소득').fill(String(INCOME_TOTAL_LIMIT + 1));
    await submit(page);
    await expect(result(page)).toContainText('소득요건에서 탈락할 것으로 보입니다');
    await expect(result(page)).toContainText('초과합니다');
  });
});

test.describe('사업자등록 특례', () => {
  test('사업자등록이 있으면 사업소득 1원만 있어도 탈락한다', async ({ page }) => {
    await selectRelation(page, '배우자');
    await page.getByLabel('사업자등록').selectOption({ label: '있음' });
    await page.getByLabel('사업소득').fill('1');
    await submit(page);
    await expect(result(page)).toContainText('소득요건에서 탈락할 것으로 보입니다');
    await expect(result(page)).toContainText('사업자등록이 있는 경우 사업소득이 발생하면');
  });

  test('사업자등록이 없으면 사업소득 500만원까지는 통과한다', async ({ page }) => {
    await selectRelation(page, '배우자');
    await page.getByLabel('사업자등록').selectOption({ label: '없음' });
    await page.getByLabel('사업소득').fill('5000000');
    await submit(page);
    await expect(result(page)).toContainText('인정될 것으로 보입니다');
  });
});

test.describe('재산요건 경계값', () => {
  test(`재산세 과세표준 ${PROPERTY_SAFE_LIMIT.toLocaleString()}원(5.4억)이면 통과한다`, async ({ page }) => {
    await selectRelation(page, '배우자');
    await page.getByLabel('재산세 과세표준').fill(String(PROPERTY_SAFE_LIMIT));
    await submit(page);
    await expect(result(page)).toContainText('인정될 것으로 보입니다');
  });

  test(`재산세 과세표준이 ${PROPERTY_HARD_LIMIT.toLocaleString()}원(9억)을 초과하면 소득이 없어도 탈락한다`, async ({ page }) => {
    await selectRelation(page, '배우자');
    await page.getByLabel('재산세 과세표준').fill(String(PROPERTY_HARD_LIMIT + 1));
    await submit(page);
    await expect(result(page)).toContainText('재산요건에서 탈락할 것으로 보입니다');
    await expect(result(page)).toContainText('소득이 없어도 탈락합니다');
  });
});

test('결과의 근거 링크는 새 탭으로 열리고 공식 법령·공단 원문을 가리킨다', async ({ page }) => {
  await selectRelation(page, '배우자');
  await submit(page);

  const basisLinks = result(page).locator('ol a');
  const count = await basisLinks.count();
  expect(count, '판정 결과에 근거 링크가 최소 1개 있어야 한다').toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const link = basisLinks.nth(i);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    const href = await link.getAttribute('href');
    expect(href, '근거 링크 href').toMatch(/^https:\/\/(www\.law\.go\.kr|www\.nhis\.or\.kr)\//);
  }
});

test('결과별 신청 준비 체크리스트와 공단 문의 질문을 보여준다', async ({ page }) => {
  await selectRelation(page, '배우자');
  await page.getByLabel('사업자등록').selectOption({ label: '있음' });
  await page.getByLabel('사업소득').fill('1');
  await submit(page);

  await expect(result(page).locator('#evidence-checklist-title')).toBeVisible();
  await expect(result(page)).toContainText('사업자등록 상태와 사업소득 금액을 먼저 확인하세요');
  await expect(result(page)).toContainText('소득자료 반영연도와 사업소득 인정액을 어떻게 확인하나요?');
  await expect(result(page).getByRole('link', { name: /홈택스 확인/ })).toHaveAttribute('href', 'https://www.hometax.go.kr/');
  await expect(result(page).getByRole('link', { name: /취득·상실 신고서/ })).toHaveAttribute('href', /nhis\.or\.kr/);
});

test('결과 화면에 입력값 요약(합산소득·재산세 과세표준)이 결론과 같은 화면에 보인다', async ({ page }) => {
  await selectRelation(page, '배우자');
  await page.getByLabel('근로소득').fill('12000000');
  await page.getByLabel('재산세 과세표준').fill('100000000');
  await submit(page);
  await expect(result(page)).toContainText('1,200만원');
});

test('결과 화면에 확신 수준을 표시한다', async ({ page }) => {
  await selectRelation(page, '배우자');
  await submit(page);
  await expect(result(page)).toContainText('기준상 가능성이 높음');

  await page.getByRole('textbox', { name: /재산세 과세표준/ }).fill(String(PROPERTY_SAFE_LIMIT));
  await submit(page);
  await expect(result(page)).toContainText('추가 확인 필요');
});

test('제출 전에는 결과 영역이 렌더링되지 않는다', async ({ page }) => {
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('0원 입력 항목이 있으면 확인 후 판정을 진행한다', async ({ page }) => {
  await selectRelation(page, '배우자');
  await page.getByRole('button', { name: '내 자격 판정하기' }).click();

  const dialog = page.getByRole('dialog', { name: '0원 입력 항목을 확인해 주세요' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('사업소득 · 0원');
  await expect(page.getByRole('status')).toHaveCount(0);

  await dialog.getByRole('button', { name: '입력 수정하기' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveCount(0);

  await page.getByRole('button', { name: '내 자격 판정하기' }).click();
  await page.getByRole('dialog', { name: '0원 입력 항목을 확인해 주세요' })
    .getByRole('button', { name: '확인하고 판정하기' })
    .click();
  await expect(page.getByRole('status')).toBeVisible();
});

test('0원 확인 모달은 화면 중앙에 전체 backdrop과 함께 표시된다', async ({ page }) => {
  await selectRelation(page, '배우자');
  await page.getByRole('button', { name: '내 자격 판정하기' }).click();

  const backdrop = page.getByTestId('zero-value-modal-backdrop');
  const dialog = page.getByRole('dialog', { name: '0원 입력 항목을 확인해 주세요' });
  await expect(backdrop).toBeVisible();
  await expect(dialog).toBeVisible();

  const viewport = page.viewportSize();
  const backdropBox = await backdrop.boundingBox();
  const dialogBox = await dialog.boundingBox();
  expect(viewport).not.toBeNull();
  expect(backdropBox).not.toBeNull();
  expect(dialogBox).not.toBeNull();

  expect(backdropBox?.x).toBe(0);
  expect(backdropBox?.y).toBe(0);
  expect(backdropBox?.width).toBe(viewport?.width);
  expect(backdropBox?.height).toBe(viewport?.height);
  expect(Math.abs((dialogBox!.x + dialogBox!.width / 2) - viewport!.width / 2)).toBeLessThanOrEqual(1);
  expect(Math.abs((dialogBox!.y + dialogBox!.height / 2) - viewport!.height / 2)).toBeLessThanOrEqual(1);

  await expect(backdrop).toHaveCSS('backdrop-filter', 'blur(4px)');
});

test('결과 화면도 뷰포트 폭을 넘어 가로 스크롤을 만들지 않는다', async ({ page }) => {
  await selectRelation(page, '형제자매'); // 필드 수가 가장 많은 관계 — 오버플로가 가장 잘 드러남
  await setCohabiting(page, true);
  await page.getByLabel('만 나이').fill('40');
  await submit(page);
  await expect(result(page)).toBeVisible();

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `결과 화면이 뷰포트(${clientWidth}px)보다 넓게 렌더링됨`).toBeLessThanOrEqual(
    clientWidth + 1,
  );
});

test('모바일 결과 카드의 제목과 내용이 우측에서 잘리지 않는다', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, '모바일 프로젝트에서만 의미 있는 검사');

  await selectRelation(page, '배우자');
  await submit(page);
  const status = result(page);
  const viewport = page.viewportSize();
  const statusBox = await status.boundingBox();
  const headingBox = await status.locator('p').first().boundingBox();

  expect(viewport).not.toBeNull();
  expect(statusBox).not.toBeNull();
  expect(headingBox).not.toBeNull();
  expect(statusBox!.x + statusBox!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(headingBox!.x + headingBox!.width).toBeLessThanOrEqual(
    statusBox!.x + statusBox!.width + 1,
  );
});
