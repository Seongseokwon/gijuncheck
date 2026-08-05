import { test, expect, type Page } from '@playwright/test';
import { ROUTES } from '../src/lib/routes';
import { fillMoney } from './helpers';

/**
 * GA4 이벤트는 측정 ID가 없는 로컬 빌드에서도 검사할 수 있도록 gtag 할당을
 * 감시한다. 실제 네트워크 요청을 보내지 않고, 이벤트 이름과 허용된 범주값만 본다.
 * 금액·나이·소득·재산 같은 원본 입력값이 페이로드에 섞이면 이 테스트가 실패한다.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const calls: unknown[][] = [];
    let implementation: (...args: unknown[]) => void = () => undefined;
    const wrapped = (...args: unknown[]) => {
      calls.push(args);
      return implementation(...args);
    };

    Object.defineProperty(window, 'gtag', {
      configurable: true,
      get: () => wrapped,
      set: (next: unknown) => {
        if (typeof next === 'function') implementation = next as (...args: unknown[]) => void;
      },
    });
    Object.defineProperty(window, '__qaGtagCalls', {
      configurable: true,
      value: calls,
    });
  });
});

async function calls(page: Page) {
  return page.evaluate(() => {
    const calls = ((window as unknown as { __qaGtagCalls?: unknown[][] }).__qaGtagCalls ?? []);
    return calls.map((call) => ({
      command: call[0],
      name: call[1],
      params: call[2] as Record<string, unknown>,
    }));
  });
}

async function events(page: Page) {
  return (await calls(page)).filter((call) => call.command === 'event');
}

test('GA4 config는 page_location에 쿼리 없이 pathname만 전달한다', async ({ page }) => {
  await page.goto('/?income=123456789&property=987654321');

  const config = (await calls(page)).find((call) => call.command === 'config');
  test.skip(!config, 'GA4 측정 ID가 없는 환경에서는 config가 생성되지 않는다');

  expect(config?.params.page_location).toBe(`${new URL(page.url()).origin}/`);
  expect(JSON.stringify(config?.params)).not.toMatch(/income=|property=|123456789|987654321/);
});

test('홈 CTA가 home_cta_click 범주값만 기록한다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '피부양자 등록 전 기준 확인하기' }).click();

  const matching = (await events(page)).filter((event) => event.name === 'home_cta_click');
  expect(matching).toHaveLength(1);
  expect(matching[0].params).toEqual({ location: 'hero' });
});

test('피부양자 판정 이벤트는 결과 범주만 기록하고 원본 입력값을 보내지 않는다', async ({
  page,
}) => {
  await page.goto(ROUTES.dependent.path);
  await page.getByLabel('가입자와의 관계').selectOption({ label: '배우자' });
  await fillMoney(page.getByLabel('근로소득'), 1234567);
  await page.getByRole('button', { name: '내 자격 판정하기' }).click();

  const captured = await events(page);
  const start = captured.find((event) => event.name === 'judge_start');
  const complete = captured.find((event) => event.name === 'judge_complete');
  expect(start?.params).toEqual({ entry: 'dependent_judge' });
  expect(complete?.params).toEqual(
    expect.objectContaining({
      eligible: true,
      relation: 'spouse',
      business_registered: false,
    }),
  );
  expect(JSON.stringify(complete?.params)).not.toContain('1234567');
  expect(complete?.params).not.toHaveProperty('income');
  expect(complete?.params).not.toHaveProperty('property');
});

test('지역보험료 계산 이벤트는 금액 대신 유무·상하한·진입경로만 기록한다', async ({ page }) => {
  await page.goto(ROUTES.regionalPremium.path);
  await fillMoney(page.getByLabel(/^재산세 과세표준 합계/), 123456789);
  await page.getByRole('button', { name: '보험료 계산하기' }).click();

  const matching = (await events(page)).filter((event) => event.name === 'premium_calculate');
  expect(matching).toHaveLength(1);
  expect(matching[0].params).toEqual({
    has_property: true,
    limit_applied: expect.any(String),
    from_judge: false,
  });
  expect(JSON.stringify(matching[0].params)).not.toContain('123456789');
});

test('임의계속가입 이벤트는 추천 결과 범주만 기록한다', async ({ page }) => {
  await page.goto(ROUTES.voluntaryContinuation.path);
  await fillMoney(page.getByLabel(/^재산금액 합계/), 234567890);
  await page.getByRole('button', { name: '어느 쪽이 유리한지 비교하기' }).click();

  const matching = (await events(page)).filter((event) => event.name === 'voluntary_compare');
  expect(matching).toHaveLength(1);
  expect(matching[0].params).toEqual({ recommendation: expect.any(String) });
  expect(JSON.stringify(matching[0].params)).not.toContain('234567890');
});
