import assert from 'node:assert/strict'
import test from 'node:test'

import {
  filterReservationsForEmployee,
  toEmployeeReservationProjection,
} from './lib/admin/employees.js'

test('toEmployeeReservationProjection omits sensitive fields', () => {
  const row = toEmployeeReservationProjection('r1', {
    firstName: 'Anna',
    lastName: 'Muster',
    phone: '+431',
    email: 'a@example.com',
    serviceName: 'Schnitt',
    startAt: '2026-11-24T10:00:00.000Z',
    endAt: '2026-11-24T11:00:00.000Z',
    status: 'CONFIRMED',
    notes: 'Kurz',
    managementTokenHash: 'secret',
    internalNote: 'nope',
    employeeId: 'emp-1',
  })
  assert.equal(row.id, 'r1')
  assert.ok(!('managementTokenHash' in row))
  assert.ok(!('internalNote' in row))
})

test('filterReservationsForEmployee returns only matching employeeId', () => {
  const mine = filterReservationsForEmployee('emp-a', [
    { id: '1', data: { employeeId: 'emp-a', startAt: '2026-11-25T10:00:00.000Z' } },
    { id: '2', data: { employeeId: 'emp-b', startAt: '2026-11-24T10:00:00.000Z' } },
    { id: '3', data: { employeeId: 'emp-a', startAt: '2026-11-24T09:00:00.000Z' } },
  ])
  assert.deepEqual(
    mine.map((row) => row.id),
    ['3', '1'],
  )
})
