import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false, // Run flows deterministically
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3005',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER === 'true' ? undefined : {
    // Launch Node directly so Playwright can terminate the server process tree reliably on Windows.
    command: `"${process.execPath}" node_modules/next/dist/bin/next start -p 3005`,
    url: 'http://localhost:3005',
    // Reuse a locally running production server for Windows test runs, where
    // Playwright's forced process-tree shutdown can otherwise leave the runner hanging.
    // CI always starts a fresh server built by the pretest:e2e hook.
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
