/**
 * Feature-off suite: run with
 * `pnpm test:e2e:employee-off`
 * so start-e2e does not force employee management on.
 *
 * Guards salons (kimm / hairboutique) where `features.employeeManagement` is false.
 */
import { expect, test } from '@playwright/test'

import { selectServiceDateAndTime } from './bookingHelpers'
import { signInAsDemo, signOutAsDemo } from './helpers'

test.describe('employee management disabled', () => {
  test('settings has no Mitarbeiter*innen entry', async ({ page }) => {
    await signInAsDemo(page)
    await page.goto('/admin/settings')
    await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mitarbeiter*innen' })).toHaveCount(0)
    await signOutAsDemo(page)
  })

  test('/admin/employees redirects back to settings', async ({ page }) => {
    await signInAsDemo(page)
    await page.goto('/admin/employees')
    await expect(page).toHaveURL(/\/admin\/settings/)
    await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible()
    await signOutAsDemo(page)
  })

  test('/employee is not a staff area', async ({ page }) => {
    await page.goto('/employee')
    await expect(page.getByRole('heading', { name: 'Mitarbeiter-Bereich' })).toHaveCount(0)
    await expect(page).not.toHaveURL(/\/employee\/hours/)
  })

  test('online booking still works without a stylist step', async ({ page }) => {
    await page.goto('/book')
    await selectServiceDateAndTime(page)
    await expect(page.getByRole('heading', { name: 'Stylist*in auswählen' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /Kontaktdaten/ })).toBeVisible()

    await page.getByLabel('Vorname').fill('Ohne')
    await page.getByLabel('Nachname').fill('Feature')
    await page.getByLabel('Telefon').fill('+43 660 9998877')
    await page.getByLabel('E-Mail-Adresse').fill('ohne-feature@example.com')
    await page.getByLabel(/Datenschutzhinweise/).check()
    await page.getByRole('button', { name: 'Termin verbindlich anfragen' }).click()
    await expect(page).toHaveURL(/\/booking\/confirmed/)
  })
})
