import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./active', () => ({
  getActiveBrandModule: vi.fn(() => ({
    features: { employeeManagement: false },
  })),
}))

import { getActiveBrandModule } from './active'
import { isEmployeeManagementEnabled } from './employeeManagement'

describe('isEmployeeManagementEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.mocked(getActiveBrandModule).mockReturnValue({
      features: { employeeManagement: false },
    } as ReturnType<typeof getActiveBrandModule>)
  })

  it('is false when brand flag is off and env unset', () => {
    expect(isEmployeeManagementEnabled()).toBe(false)
  })

  it('follows brand flag when env unset', () => {
    vi.mocked(getActiveBrandModule).mockReturnValue({
      features: { employeeManagement: true },
    } as ReturnType<typeof getActiveBrandModule>)
    expect(isEmployeeManagementEnabled()).toBe(true)
  })

  it('env true overrides brand false', () => {
    vi.stubEnv('VITE_EMPLOYEE_MANAGEMENT_ENABLED', 'true')
    expect(isEmployeeManagementEnabled()).toBe(true)
  })

  it('env false overrides brand true', () => {
    vi.mocked(getActiveBrandModule).mockReturnValue({
      features: { employeeManagement: true },
    } as ReturnType<typeof getActiveBrandModule>)
    vi.stubEnv('VITE_EMPLOYEE_MANAGEMENT_ENABLED', 'false')
    expect(isEmployeeManagementEnabled()).toBe(false)
  })
})
