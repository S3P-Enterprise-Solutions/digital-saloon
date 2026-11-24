import { describe, expect, it } from 'vitest'

import { staffLoginDestination } from './staffLoginRedirect'

describe('staffLoginDestination', () => {
  it('honours redirect when safe', () => {
    expect(staffLoginDestination({ redirect: '/employee/hours', isOperator: false })).toBe(
      '/employee/hours',
    )
  })

  it('rejects protocol-relative open redirects', () => {
    expect(staffLoginDestination({ redirect: '//evil.com', isOperator: false, role: 'admin' })).toBe(
      '/admin',
    )
    expect(
      staffLoginDestination({ redirect: '//evil.com', isOperator: false, role: 'employee' }),
    ).toBe('/employee')
  })

  it('sends operators to admin', () => {
    expect(staffLoginDestination({ isOperator: true, role: 'employee' })).toBe('/admin')
  })

  it('sends employees to employee area', () => {
    expect(staffLoginDestination({ isOperator: false, role: 'employee' })).toBe('/employee')
  })

  it('sends admins to admin by default', () => {
    expect(staffLoginDestination({ isOperator: false, role: 'admin' })).toBe('/admin')
  })
})
