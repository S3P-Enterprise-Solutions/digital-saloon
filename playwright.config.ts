import { defineConfig, devices } from '@playwright/test'

import { EMULATOR_PORTS } from './scripts/emulator-ports.mjs'

const baseURL = `http://127.0.0.1:${EMULATOR_PORTS.app}`
/** Feature-off suite: `pnpm test:e2e:employee-off` (server without employee management). */
const employeeOff = process.env.E2E_EMPLOYEE_OFF === '1'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      ...(employeeOff
        ? { testMatch: /employeeManagementOff\.spec\.ts/ }
        : { testIgnore: /employeeManagementOff\.spec\.ts/ }),
    },
  ],
  webServer: {
    command: 'node scripts/start-e2e.mjs',
    url: baseURL,
    reuseExistingServer: process.env.E2E_REUSE_SERVER === '1',
    timeout: 300_000,
    // Default SIGKILL orphans the Firestore JVM; start-e2e shuts down on SIGTERM.
    gracefulShutdown: { signal: 'SIGTERM', timeout: 20_000 },
  },
})
