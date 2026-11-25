import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { EMULATOR_PORTS, PROJECT_ID } from './emulator-ports.mjs'
import { waitForEmulators } from './lib/emulator-wait.mjs'
import { DEV_APP_PORTS, ensurePortsAvailable, resolveForceFreePorts } from './lib/free-port.mjs'
import { createProcessSupervisor, localBin } from './lib/process-tree.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const skipBuild = process.env.E2E_SKIP_BUILD === 'true'
const forceFreePorts = resolveForceFreePorts()
const supervisor = createProcessSupervisor({
  label: 'e2e',
  ports: DEV_APP_PORTS,
  shutdownTimeoutMs: 15_000,
})

function buildFunctions() {
  if (skipBuild) {
    console.log('[e2e] Skipping functions build (E2E_SKIP_BUILD=true)')
    return
  }

  console.log('[e2e] Building functions…')
  execFileSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['--prefix', join(root, 'functions'), 'run', 'build'],
    {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    },
  )
}

async function main() {
  buildFunctions()

  console.log('[e2e] Checking ports…')
  await ensurePortsAvailable(DEV_APP_PORTS, { force: forceFreePorts })

  // Default OFF to match the kimm brand module (standard + feature-off E2E suites).
  // Set EMPLOYEE_MANAGEMENT_ENABLED=true (via `pnpm test:e2e:employee`) for employeeManagement.spec.ts.
  const employeeManagementEnabled =
    process.env.EMPLOYEE_MANAGEMENT_ENABLED?.trim().toLowerCase() === 'true' ? 'true' : 'false'

  const e2eFunctionsEnv = {
    BRAND: 'kimm',
    SALON_ID: 'pilot',
    EMPLOYEE_MANAGEMENT_ENABLED: employeeManagementEnabled,
  }

  console.log('[e2e] Starting Firebase emulators…')
  supervisor.spawn(
    localBin('firebase'),
    ['emulators:start', '--only', 'auth,firestore,storage,functions', '--project', PROJECT_ID],
    { critical: true, env: e2eFunctionsEnv },
  )

  await waitForEmulators({ waitForUi: false })

  console.log('[e2e] Seeding emulator…')
  execFileSync(process.execPath, [join(root, 'scripts/seed-emulator.mjs')], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })

  console.log('[e2e] Starting Vite…')
  supervisor.spawn(
    localBin('vite'),
    ['--port', String(EMULATOR_PORTS.app), '--host', '127.0.0.1'],
    {
      env: {
        VITE_USE_FIREBASE_EMULATORS: 'true',
        VITE_BRAND: 'kimm',
        VITE_SALON_ID: 'pilot',
        // Opt-in for employee E2E without enabling it on the kimm brand module.
        // Set VITE_EMPLOYEE_MANAGEMENT_ENABLED=true for the feature-on suite.
        VITE_EMPLOYEE_MANAGEMENT_ENABLED:
          process.env.VITE_EMPLOYEE_MANAGEMENT_ENABLED?.trim().toLowerCase() === 'true'
            ? 'true'
            : employeeManagementEnabled,
      },
      critical: true,
    },
  )

  console.log(`[e2e] Ready at http://127.0.0.1:${EMULATOR_PORTS.app}`)
}

main().catch((error) => {
  console.error('[e2e] Failed to start environment:', error)
  void supervisor.shutdown(1)
})
