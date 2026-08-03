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
      // iPhone 계열 프리셋은 webkit 엔진을 요구한다. chromium만 설치했으므로
      // Chromium 기반 모바일 기기(Pixel 5)로 375px 폭 요건을 대신 검증한다.
      use: { ...devices['Pixel 5'], viewport: { width: 375, height: 812 } },
    },
  ],
});
