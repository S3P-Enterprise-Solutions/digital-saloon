import { defineConfig, devices } from '@playwright/test'

import { EMULATOR_PORTS } from './scripts/emulator-ports.mjs'

const baseURL = `http://127.0.0.1:${EMULATOR_PORTS.app}`
/** Feature-on suite: `pnpm test:e2e:employee` (server with employee management enabled). */
const employeeOn = process.env.E2E_EMPLOYEE_ON === '1'
/** Feature-off only suite: `pnpm test:e2e:employee-off`. */
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
      // Default `pnpm test:e2e` includes `employeeManagementOff.spec.ts` because
      // `scripts/start-e2e.mjs` defaults `EMPLOYEE_MANAGEMENT_ENABLED` to `false`.
      // Keep this in sync if `scripts/start-e2e.mjs` ever changes its default.
      ...(employeeOn
        ? { testMatch: /employeeManagement\.spec\.ts/ }
        : employeeOff
          ? { testMatch: /employeeManagementOff\.spec\.ts/ }
          : { testIgnore: /employeeManagement\.spec\.ts/ }),
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
