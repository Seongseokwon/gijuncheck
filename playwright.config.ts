import { defineConfig, devices } from '@playwright/test';

/**
 * P0-2 공개 전 전수 QA 용 E2E 설정.
 *
 * 정적 export(out/) 를 대상으로 한다. `npm run build` 로 만든 out/ 을
 * serve 로 띄우고 그 위에서 테스트한다 — dev 서버(next dev)와는 번들링
 * 결과가 달라 실제 배포 산출물을 봐야 의미가 있다. 기본값은 항상 새 서버를
 * 띄워 방금 만든 out/을 사용한다. 기존 서버 재사용이 꼭 필요하면
 * `REUSE_E2E_SERVER=true`를 명시한다.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],

  // WebKit 프로젝트가 붙으면서 같은 시간에 도는 브라우저가 늘었다. 느린 엔진이
  // 경합에 밀려 나는 시간 초과를 실패로 오해하지 않도록 기본값보다 여유를 둔다.
  timeout: 45_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },

  webServer: {
    command: 'npx serve out -l 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: process.env.REUSE_E2E_SERVER === 'true',
    timeout: 30_000,
  },

  projects: [
    {
      name: 'desktop-1440',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet-768',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'mobile-375',
      // Android 계열(Chromium) 모바일에서의 375px 폭 검증.
      use: { ...devices['Pixel 5'], viewport: { width: 375, height: 812 } },
    },
    {
      name: 'desktop-safari-1440',
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-safari-375',
      // iOS Safari 는 실제 webkit 엔진에서만 의미가 있다 — 입력 자동확대(16px
      // 미만 확대), -webkit- 전용 스타일, 스크롤/뷰포트 동작이 Chromium 모바일
      // 에뮬레이션과 다르다. 폭은 다른 모바일 프로젝트와 같은 375px 로 맞춘다.
      use: { ...devices['iPhone 13'], viewport: { width: 375, height: 812 } },
    },
  ],
});
