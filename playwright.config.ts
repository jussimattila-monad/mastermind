/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

// E2E_BASE_URL points the tests at a deployed app (production or a PR preview);
// without it they run against the dev server, which is started if it isn't running.
const target = process.env.E2E_BASE_URL;
// Tests navigate relative to the base URL ('./'), which keeps its path only with a trailing slash.
const baseURL = target ? target.replace(/\/?$/, '/') : 'http://localhost:9000/';

export default defineConfig({
  testDir: 'e2e',
  // Not *.test.ts or *.spec.ts, so Vitest leaves these files alone.
  testMatch: '*.e2e.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: target ? undefined : {
    command: 'npm start',
    url: baseURL,
    reuseExistingServer: true,
    env: { CI: '1' },
  },
});
