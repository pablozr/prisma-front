import { defineConfig, devices } from '@playwright/test'

/**
 * Deterministic E2E setup for the PRISMA frontend.
 *
 * The whole backend surface is intercepted with `page.route` in `e2e/support/mock-api.ts`,
 * so the suite never needs a real API, proxy or OAuth provider.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'npm start -- --port 4200',
    url: 'http://localhost:4200',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI
  }
})
