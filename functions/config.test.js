import assert from 'node:assert/strict'
import test from 'node:test'

import { getBrandKey, isEmployeeManagementEnabled } from './lib/config.js'

function withEnv(overrides, fn) {
  const previous = {}
  for (const key of Object.keys(overrides)) {
    previous[key] = process.env[key]
    const value = overrides[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
  try {
    fn()
  } finally {
    for (const key of Object.keys(overrides)) {
      if (previous[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = previous[key]
      }
    }
  }
}

test('isEmployeeManagementEnabled respects EMPLOYEE_MANAGEMENT_ENABLED=true', () => {
  withEnv({ EMPLOYEE_MANAGEMENT_ENABLED: 'true', BRAND: 'salon1500' }, () => {
    assert.equal(isEmployeeManagementEnabled(), true)
  })
})

test('isEmployeeManagementEnabled respects EMPLOYEE_MANAGEMENT_ENABLED=false', () => {
  withEnv({ EMPLOYEE_MANAGEMENT_ENABLED: 'false', BRAND: 'kimm' }, () => {
    assert.equal(isEmployeeManagementEnabled(), false)
  })
})

test('isEmployeeManagementEnabled is false for hairboutique when env unset', () => {
  withEnv(
    {
      EMPLOYEE_MANAGEMENT_ENABLED: undefined,
      BRAND: 'hairboutique',
      SALON_ID: undefined,
    },
    () => {
      assert.equal(getBrandKey(), 'hairboutique')
      assert.equal(isEmployeeManagementEnabled(), false)
    },
  )
})

test('isEmployeeManagementEnabled is false for kimm when env unset', () => {
  withEnv(
    {
      EMPLOYEE_MANAGEMENT_ENABLED: undefined,
      BRAND: 'kimm',
      SALON_ID: 'pilot',
    },
    () => {
      assert.equal(getBrandKey(), 'kimm')
      assert.equal(isEmployeeManagementEnabled(), false)
    },
  )
})