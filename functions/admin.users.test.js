import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertEmployeeManagementFeatureEnabled,
  buildEmployeeSalonDocument,
  buildEmployeeUserDocument,
  buildStaffOverviewResponse,
  validateEmployeeAccountInput,
} from './lib/admin/users.js'

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

test('assertEmployeeManagementFeatureEnabled rejects when flag is off', () => {
  withEnv({ EMPLOYEE_MANAGEMENT_ENABLED: 'false', BRAND: 'kimm' }, () => {
    assert.throws(
      () => assertEmployeeManagementFeatureEnabled(),
      (error) => {
        assert.equal(error.code, 'failed-precondition')
        return true
      },
    )
  })
})

test('assertEmployeeManagementFeatureEnabled allows when flag is on', () => {
  withEnv({ EMPLOYEE_MANAGEMENT_ENABLED: 'true' }, () => {
    assert.doesNotThrow(() => assertEmployeeManagementFeatureEnabled())
  })
})

test('validateEmployeeAccountInput builds displayName from first and last name', () => {
  const input = validateEmployeeAccountInput({
    email: 'stylist@example.com',
    password: 'password1',
    firstName: 'Jane',
    lastName: 'Doe',
  })
  assert.equal(input.displayName, 'Jane Doe')
  assert.equal(input.email, 'stylist@example.com')
})

test('validateEmployeeAccountInput rejects displayName-only payload', () => {
  assert.throws(
    () =>
      validateEmployeeAccountInput({
        email: 'x@y.com',
        password: 'password1',
        displayName: 'Only Display',
      }),
    (error) => {
      assert.equal(error.code, 'invalid-argument')
      return true
    },
  )
})

test('buildEmployeeUserDocument sets role employee without primary admin fields', () => {
  const createdAt = '2026-11-24T12:00:00.000Z'
  const doc = buildEmployeeUserDocument({
    email: 'stylist@example.com',
    displayName: 'Jane Doe',
    createdAt,
  })
  assert.deepEqual(doc, {
    email: 'stylist@example.com',
    displayName: 'Jane Doe',
    role: 'employee',
    createdAt,
  })
  assert.equal(doc.role, 'employee')
  assert.ok(!('isPrimaryAdmin' in doc))
})

test('buildEmployeeSalonDocument includes bookability and auth mirror defaults', () => {
  const createdAt = '2026-11-24T12:00:00.000Z'
  const doc = buildEmployeeSalonDocument({
    email: 'stylist@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    displayName: 'Jane Doe',
    createdAt,
  })
  assert.equal(doc.active, true)
  assert.equal(doc.authDisabled, false)
  assert.deepEqual(doc.serviceIds, [])
  assert.equal(doc.updatedAt, createdAt)
})

test('buildStaffOverviewResponse reports primary admin without mutating staff list', () => {
  const staff = [
    {
      uid: 'a1',
      email: 'owner@example.com',
      displayName: 'Owner',
      isPrimaryAdmin: true,
      createdAt: '2026-11-24T12:00:00.000Z',
    },
    {
      uid: 'a2',
      email: 'admin2@example.com',
      displayName: 'Admin Two',
      isPrimaryAdmin: false,
      createdAt: '2026-11-24T12:00:00.000Z',
    },
  ]
  const overview = buildStaffOverviewResponse(staff)
  assert.equal(overview.hasPrimaryAdmin, true)
  assert.deepEqual(overview.staff, staff)
})

test('buildStaffOverviewResponse handles no primary admin', () => {
  const overview = buildStaffOverviewResponse([
    {
      uid: 'a2',
      email: 'admin2@example.com',
      displayName: 'Admin Two',
      isPrimaryAdmin: false,
      createdAt: '2026-11-24T12:00:00.000Z',
    },
  ])
  assert.equal(overview.hasPrimaryAdmin, false)
})

test('admin role fixture stays admin when building employee docs separately', () => {
  const createdAt = '2026-11-24T12:00:00.000Z'
  const adminFixture = {
    email: 'owner@example.com',
    displayName: 'Owner',
    role: 'admin',
    isPrimaryAdmin: true,
    createdAt,
  }
  const employeeUser = buildEmployeeUserDocument({
    email: 'stylist@example.com',
    displayName: 'Jane Doe',
    createdAt,
  })
  assert.equal(adminFixture.role, 'admin')
  assert.equal(employeeUser.role, 'employee')
})