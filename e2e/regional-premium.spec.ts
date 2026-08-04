import { test, expect, type Page } from '@playwright/test';
import { ROUTES } from '../src/lib/routes';
import { PREMIUM_HANDOFF_STORAGE_KEY } from '../src/lib/premium-handoff';
import { fillMoney as fill } from './helpers';

/**
 * P2-1 "지역가입자 보험료 공식 대조" 이후의 공개 화면 QA.
 *
 * 이 계산기는 공단 모의계산 13건 대조를 마치고 공개됐지만(`routes.ts` 의
 * `regionalPremium.ready`), 화면 동작을 고정하는 E2E 가 없었다. 판정기와 달리
 * 여기서 틀리면 사용자가 "얼마 내는지"를 잘못 알고 간다.
 *
 * 기대 금액은 `src/lib/premium/regional.test.ts` 의 공단 모의계산 대조 사례와
 * 같은 값을 쓴다. 단위 테스트는 계산식을, 이 파일은 그 값이 실제 화면까지
 * 도달하는지를 본다. 2026년 요율·등급표가 바뀌면 양쪽을 함께 갱신한다.
 */

const LOWER_LIMIT_TOTAL = '22,800원'; // 소득 0 · 재산 0 → 하한
const BASIC_DEDUCTION = 100_000_000; // 재산 기본공제 1억

test.beforeEach(async ({ page }) => {
  await page.goto(ROUTES.regionalPremium.path);
});

/**
 * 금액 입력 필드.
 *
 * 도움말이 붙은 필드도 입력 라벨과 도움말 버튼을 분리해 접근 가능한 이름을
 * 안정적으로 유지한다. 단순 부분일치를 쓰면 "월세" 가 "전세·월세 보증금"까지
 * 잡을 수 있으므로 필드별 고유한 앞부분을 사용한다.
 */
function moneyField(page: Page, label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return page.getByLabel(new RegExp(`^${escaped}`));
}

async function fillMoney(page: Page, label: string, value: number) {
  await fill(moneyField(page, label), value);
}

async function calculate(page: Page) {
  await page.getByRole('button', { name: '보험료 계산하기' }).click();
}

function result(page: Page) {
  return page.getByRole('status');
}

test('제출 전에는 결과 영역이 렌더링되지 않는다', async ({ page }) => {
  await expect(result(page)).toHaveCount(0);
});

test('소득·재산이 0이어도 하한 보험료가 부과되고 하한 적용 사실을 알려준다', async ({ page }) => {
  await calculate(page);

  await expect(result(page)).toContainText('20,160원'); // 건강보험료 하한
  await expect(result(page)).toContainText('2,640원'); // 장기요양보험료
  await expect(result(page)).toContainText(LOWER_LIMIT_TOTAL);
  await expect(result(page)).toContainText('소득 하한액');
});

test.describe('소득 종류별 반영률 — 근로·연금은 50%', () => {
  /**
   * 이 계산기에서 가장 비싼 실수. 근로·연금을 100%로 반영하면 연금 수령자의
   * 보험료가 2배로 나온다. 주 타깃이 은퇴자이므로 화면 단에서 고정한다.
   */
  test('근로 500만 + 연금 500만(=반영 500만)이 사업소득 500만과 같은 보험료가 된다', async ({
    page,
  }) => {
    await fillMoney(page, '근로소득 (50%)', 5_000_000);
    await fillMoney(page, '공적연금소득 (50%)', 5_000_000);
    await calculate(page);

    await expect(result(page)).toContainText('29,950원'); // 건강보험료
    await expect(result(page)).toContainText('33,880원'); // 합계

    // 같은 화면에서 사업소득 500만원만 넣어도 결과가 같아야 한다
    await page.reload();
    await fillMoney(page, '사업소득 (100%)', 5_000_000);
    await calculate(page);
    await expect(result(page)).toContainText('33,880원');
  });

  test('입력 즉시 합산소득 → 반영 후 금액 → 소득월액을 되읽어준다', async ({ page }) => {
    await fillMoney(page, '공적연금소득 (50%)', 12_000_000);

    const summary = page.getByText('합산소득', { exact: false });
    await expect(summary).toContainText('12,000,000원');
    await expect(summary).toContainText('6,000,000원'); // 50% 반영
    await expect(summary).toContainText('500,000원'); // 소득월액
  });
});

test.describe('재산 기본공제 1억 경계', () => {
  test('과세표준이 기본공제 이하면 재산보험료가 0원이고 그 이유를 보여준다', async ({ page }) => {
    await fillMoney(page, '재산세 과세표준 합계', BASIC_DEDUCTION);
    await calculate(page);

    await expect(result(page)).toContainText('기본공제 후 0원 → 재산점수 0점');
    await expect(result(page)).toContainText(LOWER_LIMIT_TOTAL);
  });

  test('기본공제를 1만원이라도 넘으면 재산보험료가 붙는다', async ({ page }) => {
    await fillMoney(page, '재산세 과세표준 합계', BASIC_DEDUCTION + 10_000);
    await calculate(page);

    await expect(result(page)).toContainText('4,653원'); // 재산보험료
    await expect(result(page)).toContainText('28,070원'); // 합계
  });
});

test('상한을 넘는 소득이면 상한 보험료가 적용되고 계산값을 함께 보여준다', async ({ page }) => {
  await fillMoney(page, '사업소득 (100%)', 800_000_000);
  await calculate(page);

  await expect(result(page)).toContainText('4,591,740원'); // 상한
  await expect(result(page)).toContainText('상한 보험료');
  await expect(result(page)).toContainText('5,195,110원'); // 합계
});

test.describe('임차 전월세 환산', () => {
  test('임차 체크 전에는 보증금·월세 입력이 없다', async ({ page }) => {
    await expect(moneyField(page, '전세·월세 보증금')).toHaveCount(0);
    await expect(moneyField(page, '월세')).toHaveCount(0);
  });

  test('임차를 체크하면 (보증금 + 월세 × 40) × 30% 평가금액이 재산에 더해진다', async ({
    page,
  }) => {
    await page.getByLabel('주택·건물을 소유하지 않고 임차 중입니다').check();

    await fillMoney(page, '전세·월세 보증금', 400_000_000);
    await fillMoney(page, '월세', 500_000);

    // (4억 + 50만 × 40) × 30% = 1억 2,600만
    await expect(page.getByText('현재 평가금액은', { exact: false })).toContainText(
      '126,000,000원',
    );

    await calculate(page);
    await expect(result(page)).toContainText('30,879원'); // 재산보험료
    await expect(result(page)).toContainText('57,730원'); // 합계
  });
});

test('판정기에서 넘어온 소득·재산이 다시 입력하지 않아도 채워지고 바로 계산된다', async ({
  page,
}) => {
  const handoff = {
    version: 1,
    source: 'dependent-judge',
    income: {
      business: 0,
      wage: 12_000_000,
      pension: 30_000_000,
      financial: 0,
      other: 0,
    },
    propertyTaxBase: 200_000_000,
  };
  await page.addInitScript(
    ({ key, value }) => sessionStorage.setItem(key, JSON.stringify(value)),
    { key: PREMIUM_HANDOFF_STORAGE_KEY, value: handoff },
  );
  await page.goto(ROUTES.regionalPremium.path);

  // 판정기의 소득 종류별 금액을 그대로 전달해 반영률을 보존한다.
  await expect(moneyField(page, '사업소득 (100%)')).toHaveValue('');
  await expect(moneyField(page, '근로소득 (50%)')).toHaveValue('12,000,000');
  await expect(moneyField(page, '공적연금소득 (50%)')).toHaveValue('30,000,000');
  await expect(moneyField(page, '재산세 과세표준 합계')).toHaveValue('200,000,000');
  expect(new URL(page.url()).search).toBe('');

  // 다시 계산 버튼을 누르지 않아도 결과가 보여야 한다
  await expect(result(page)).toBeVisible();
});

test('공식 대조가 끝난 계산기이므로 "참고용" 미검증 배지를 띄우지 않는다', async ({ page }) => {
  await calculate(page);

  await expect(result(page)).toBeVisible();
  await expect(page.getByText('대조 검증이 아직 완료되지 않았습니다')).toHaveCount(0);
});

test('결과에 근거와 면책, 입력값 비전송 고지가 함께 있다', async ({ page }) => {
  await expect(page.getByText('입력값은 브라우저 안에서만 계산되며 서버로 전송되지 않습니다')).toBeVisible();

  await calculate(page);

  await expect(result(page)).toContainText('근거 ·');
  await expect(result(page)).toContainText('법적 효력이 없습니다');
  await expect(result(page)).toContainText('1577-1000');
});

test('공식 대조가 끝난 임의계속가입 CTA가 재산금액을 들고 이어진다', async ({ page }) => {
  test.skip(!ROUTES.voluntaryContinuation.ready, '임의계속가입 공개 전에는 적용하지 않는다');
  await fillMoney(page, '재산세 과세표준 합계', 200_000_000);
  await calculate(page);

  const cta = result(page).locator(`a[href^="${ROUTES.voluntaryContinuation.path}"]`);
  await expect(cta).toHaveCount(1);
  // 다시 타이핑하게 만들지만 금액을 URL에 노출하지 않는다.
  await expect(cta).toHaveAttribute('href', ROUTES.voluntaryContinuation.path);
  await cta.click();
  await expect(page).toHaveURL(new RegExp(`${ROUTES.voluntaryContinuation.path.replaceAll('/', '\\/')}$`));
  await expect(page.getByLabel(/^재산금액 합계/)).toHaveValue('200,000,000');
  expect(new URL(page.url()).search).toBe('');
});

test('임의계속가입이 미검증 상태로 되돌아가면 CTA를 숨긴다', async ({ page }) => {
  test.skip(ROUTES.voluntaryContinuation.ready, '현재는 공개 상태의 CTA를 위 테스트로 검증한다');
  await calculate(page);

  await expect(result(page)).toBeVisible();
  await expect(
    result(page).locator(`a[href^="${ROUTES.voluntaryContinuation.path}"]`),
  ).toHaveCount(0);
});

test('결과가 나온 뒤에도 가로 스크롤을 만들지 않는다', async ({ page }) => {
  await fillMoney(page, '사업소득 (100%)', 800_000_000);
  await fillMoney(page, '재산세 과세표준 합계', 900_000_000);
  await calculate(page);

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `결과 표시 후 가로 스크롤 발생 (${scrollWidth} > ${clientWidth})`)
    .toBeLessThanOrEqual(clientWidth + 1);
});

test('모바일 결과 행에서 금액이 줄바꿈되거나 카드 밖으로 밀리지 않는다', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, '모바일 프로젝트에서만 의미 있는 검사');

  await fillMoney(page, '사업소득 (100%)', 800_000_000);
  await calculate(page);

  const resultCard = result(page);
  const total = resultCard.getByText('5,195,110원', { exact: true });
  const cardBox = await resultCard.boundingBox();
  const totalBox = await total.boundingBox();

  expect(cardBox).not.toBeNull();
  expect(totalBox).not.toBeNull();
  expect(totalBox!.x + totalBox!.width).toBeLessThanOrEqual(
    cardBox!.x + cardBox!.width + 1,
  );
  expect(await total.evaluate((element) => getComputedStyle(element).whiteSpace)).toBe(
    'nowrap',
  );
});

test('키보드만으로 소득 입력 → 계산 → 결과까지 도달한다', async ({ page }) => {
  await moneyField(page, '사업소득 (100%)').focus();
  await page.keyboard.type('5000000');

  const button = page.getByRole('button', { name: '보험료 계산하기' });
  await button.focus();
  await expect(button).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(result(page)).toBeVisible();
  await expect(result(page)).toContainText('33,880원');
});

test('모바일에서 금액 입력 글자 크기가 16px 이상이다 (iOS 자동확대 방지)', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, '모바일 프로젝트에서만 의미 있는 검사');

  const fontSize = await moneyField(page, '재산세 과세표준 합계').evaluate((el) =>
    parseFloat(getComputedStyle(el).fontSize),
  );

  expect(fontSize).toBeGreaterThanOrEqual(16);
});
