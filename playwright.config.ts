import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/Project-Study/',
    trace: 'on-first-retry',
    channel: 'chrome',
  },
  projects: [
    {
      name: 'desktop-1366',
      use: {
        viewport: { width: 1366, height: 800 },
      },
    },
    {
      name: 'mobile-375',
      use: {
        viewport: { width: 375, height: 740 },
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173',
    url: 'http://localhost:4173/Project-Study/',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
