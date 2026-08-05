import { expect, type Locator } from '@playwright/test';

/**
 * 금액 입력 필드에 값을 넣고, React 상태에 실제로 들어갔는지 확인한다.
 *
 * `MoneyInput` 은 상태값을 콤마 포맷으로 다시 그린다. 즉 입력칸에 콤마가
 * 보인다는 건 곧 React 가 그 값을 받아 다시 그렸다는 뜻이고, 숫자만 남아
 * 있다면 입력이 React 까지 가지 않은 것이다.
 *
 * 후자가 실제로 일어난다 — `goto` 는 load 까지만 기다리므로 하이드레이션이
 * 끝나기 전에 fill 이 실행될 수 있고, 그러면 input 이벤트를 받을 핸들러가 아직
 * 없어서 값이 조용히 버려진다. WebKit 이 Chromium 보다 느려 특히 자주 걸린다.
 * 사람 손으로는 닿기 어려운 속도지만 자동화에서는 흔하므로, 포맷이 보일
 * 때까지 다시 입력한다.
 */
export async function fillMoney(input: Locator, value: number) {
  const formatted = value.toLocaleString('ko-KR');

  await expect(async () => {
    // WebKit의 text input은 fill()만으로 React의 input 이벤트가 반영되지
    // 않는 경우가 있다. 실제 키 입력 경로를 사용하면 Safari에서도 포맷터가
    // 실행되어 상태값과 화면값이 함께 갱신된다.
    await input.fill('');
    await input.pressSequentially(String(value));
    await expect(input).toHaveValue(formatted, { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
}
