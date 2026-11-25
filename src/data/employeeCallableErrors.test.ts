import { describe, expect, it } from 'vitest'

import {
  employeeCallableFailureOf,
  normalizeCallableErrorMessage,
  translateEmployeeCallableError,
} from './employeeCallableErrors'

describe('employeeCallableErrors', () => {
  it('strips firebase status suffixes', () => {
    expect(normalizeCallableErrorMessage('firstName is invalid. [400]')).toBe(
      'firstName is invalid.',
    )
    expect(
      normalizeCallableErrorMessage('Valid email is required. (functions/invalid-argument)'),
    ).toBe('Valid email is required.')
  })

  it('maps firstName invalid messages', () => {
    expect(employeeCallableFailureOf(new Error('firstName is invalid. [400]'))).toBe(
      'firstNameInvalid',
    )
    expect(
      employeeCallableFailureOf(new Error('First name is required (max 80 characters).')),
    ).toBe('firstNameInvalid')
  })

  it('maps lastName, email, password, and already-exists', () => {
    expect(employeeCallableFailureOf(new Error('lastName is required.'))).toBe('lastNameInvalid')
    expect(employeeCallableFailureOf(new Error('Valid email is required.'))).toBe('emailInvalid')
    expect(employeeCallableFailureOf(new Error('Password must be at least 8 characters.'))).toBe(
      'passwordTooShort',
    )
    expect(
      employeeCallableFailureOf({
        code: 'functions/already-exists',
        message: 'email already exists',
      }),
    ).toBe('alreadyExists')
  })

  it('translates via i18n key', () => {
    const t = (key: string) => (key === 'admin.employeesError.firstNameInvalid' ? 'DE' : key)
    expect(translateEmployeeCallableError(new Error('firstName is invalid. [400]'), t)).toBe('DE')
  })
})
