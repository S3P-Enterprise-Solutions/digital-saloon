import { getActiveBrandModule } from './active'

/**
 * Employee Management is a brand compile-time flag.
 * E2E may force it on via `VITE_EMPLOYEE_MANAGEMENT_ENABLED=true` without enabling a brand.
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
