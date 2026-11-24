import { expect, test } from '@playwright/test'

import { addCalendarDays, germanDate, mondayOfWeek } from './calendarDates'
import { findFutureDemoReservation, getReservationStatus } from './firestoreAdmin'
import { signInAsDemo } from './helpers'

test.describe('admin reservations with seeded weeks @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsDemo(page)
  })

  test('reservation list includes appointments after the current week', async ({ page }) => {
    const nextTuesday = addCalendarDays(mondayOfWeek(1), 1)
    await page.goto('/admin/reservations')
    await expect(page.getByRole('heading', { name: 'Termine', exact: true })).toBeVisible()
    await expect(
      page
        .getByRole('row')
        .filter({ hasText: germanDate(nextTuesday) })
        .first(),
    ).toBeVisible()
  })

  test('admin completes and cancels seeded appointments', async ({ page }) => {
    const toComplete = await findFutureDemoReservation('CONFIRMED')
    await page.goto(`/admin/reservations/${toComplete.id}`)
    await expect(page.getByText(`${toComplete.firstName} ${toComplete.lastName}`)).toBeVisible()
    await page.getByRole('button', { name: 'Als erledigt markieren' }).click()
    await expect.poll(async () => getReservationStatus(toComplete.id)).toBe('COMPLETED')
    await expect(page.getByText('Erledigt')).toBeVisible()

    const toCancel = await findFutureDemoReservation('CONFIRMED')
    await page.goto(`/admin/reservations/${toCancel.id}`)
    await page.getByRole('button', { name: 'Stornieren' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Ja, stornieren' }).click()
    await expect.poll(async () => getReservationStatus(toCancel.id)).toBe('CANCELLED')
    await expect(page.getByText('Storniert')).toBeVisible()
  })
})
