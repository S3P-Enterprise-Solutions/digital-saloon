import assert from 'node:assert/strict'
import test from 'node:test'

test('resolveServiceIds prefers serviceIds array and keeps order/dedupe', async () => {
  const { resolveServiceIds } = await import('./lib/booking/createReservation.js')

  assert.deepEqual(resolveServiceIds({ serviceIds: ['a', 'b'] }), {
    serviceId: 'a',
    serviceIds: ['a', 'b'],
  })
  assert.deepEqual(resolveServiceIds({ serviceIds: ['a', ' a ', 'b', 'a'] }), {
    serviceId: 'a',
    serviceIds: ['a', 'b'],
  })
})

test('resolveServiceIds falls back to single serviceId', async () => {
  const { resolveServiceIds } = await import('./lib/booking/createReservation.js')

  assert.deepEqual(resolveServiceIds({ serviceId: 'x' }), {
    serviceId: 'x',
    serviceIds: ['x'],
  })
})
