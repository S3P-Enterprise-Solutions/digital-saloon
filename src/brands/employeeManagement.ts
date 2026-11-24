import { getActiveBrandModule } from './active'

/**
 * Employee Management is a brand compile-time flag (`features.employeeManagement`).
 * Keep in sync with Functions `isEmployeeManagementEnabled()` / brand map.
 * E2E may force both sides on via `VITE_EMPLOYEE_MANAGEMENT_ENABLED` and
 * `EMPLOYEE_MANAGEMENT_ENABLED` in `scripts/start-e2e.mjs` without enabling a brand.
 */
export function isEmployeeManagementEnabled(): boolean {
  const raw = import.meta.env.VITE_EMPLOYEE_MANAGEMENT_ENABLED
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase()
    if (normalized === 'true' || normalized === '1') return true
    if (normalized === 'false' || normalized === '0') return false
  }
  return getActiveBrandModule().features.employeeManagement === true
}
