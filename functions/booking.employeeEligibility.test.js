import assert from 'node:assert/strict'
import test from 'node:test'

import { buildDemoReservations } from './lib/admin/demoReservations.js'
import {
  coversRequestedServices,
  isBookingCandidateRecord,
  isEmployeeAllowedForServices,
  resolveEmployeeIdsToCheck,
} from './lib/booking/employeeBooking.js'

test('isBookingCandidateRecord requires active, auth enabled, not removed', () => {
  assert.equal(isBookingCandidateRecord({ active: true, authDisabled: false }), true)
  assert.equal(isBookingCandidateRecord({ active: false, authDisabled: false }), false)
  assert.equal(isBookingCandidateRecord({ active: true, authDisabled: true }), false)
  assert.equal(
    isBookingCandidateRecord({ active: true, authDisabled: false, removedAt: '2026-01-01' }),
    false,
  )
})

test('coversRequestedServices defaults empty employee serviceIds to all services', () => {
  assert.equal(coversRequestedServices([], ['a', 'b']), true)
  assert.equal(coversRequestedServices(['a', 'b', 'c'], ['a', 'b']), true)
  assert.equal(coversRequestedServices(['a'], ['a', 'b']), false)
})

test('isEmployeeAllowedForServices allows any employee when service has no restriction', () => {
  assert.equal(isEmployeeAllowedForServices('e1', [undefined, []]), true)
  assert.equal(isEmployeeAllowedForServices('e1', [['e1', 'e2'], []]), true)
  assert.equal(isEmployeeAllowedForServices('e1', [['e2']]), false)
})

test('resolveEmployeeIdsToCheck flag off uses salon-only', () => {
  const result = resolveEmployeeIdsToCheck({
    featureEnabled: false,
    candidates: [{ id: 'e1', displayName: 'E', serviceIds: ['haircut'] }],
    requestedEmployeeId: null,
  })
  assert.deepEqual(result, { ok: true, employeeIds: [null] })
})

test('resolveEmployeeIdsToCheck falls back to salon-only when no bookable employees exist', () => {
  const result = resolveEmployeeIdsToCheck({
    featureEnabled: true,
    candidates: [],
    requestedEmployeeId: null,
    hasAnyBookableEmployee: false,
  })
  assert.deepEqual(result, { ok: true, employeeIds: [null] })
})

test('resolveEmployeeIdsToCheck flag on with bookable employees but no eligible candidates is unavailable', () => {
  const result = resolveEmployeeIdsToCheck({
    featureEnabled: true,
    candidates: [],
    requestedEmployeeId: null,
    hasAnyBookableEmployee: true,
  })
  assert.deepEqual(result, { ok: true, employeeIds: [] })
})

test('resolveEmployeeIdsToCheck requested employee must be eligible', () => {
  const result = resolveEmployeeIdsToCheck({
    featureEnabled: true,
    candidates: [{ id: 'e1', displayName: 'E', serviceIds: ['haircut'] }],
    requestedEmployeeId: 'missing',
  })
  assert.deepEqual(result, { ok: false, code: 'NOT_FOUND' })
})

test('buildDemoReservations avoids long fallback services, leaves gaps, and assigns employees', () => {
  const entries = buildDemoReservations({
    now: new Date('2026-11-28T09:00:00.000Z'),
    timeZone: 'Europe/Vienna',
    services: [
      { id: 'svc-short', nameDe: 'Kurz', nameIt: 'Corto', durationMinutes: 30, priceCents: 2000 },
      {
        id: 'svc-long',
        nameDe: 'Balayage',
        nameIt: 'Balayage',
        durationMinutes: 240,
        priceCents: 20000,
      },
    ],
    employees: [
      { id: 'emp-1', displayName: 'Elisabeth' },
      { id: 'emp-2', displayName: 'Eleonora' },
    ],
  })
  assert.ok(entries.length > 0 && entries.length < 80)
  for (const entry of entries) {
    assert.equal(entry.data.serviceId, 'svc-short')
    assert.ok(entry.data.employeeId === 'emp-1' || entry.data.employeeId === 'emp-2')
  }
})
