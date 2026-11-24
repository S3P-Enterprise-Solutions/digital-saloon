/**
 * Employee management E2E — enabled via `VITE_EMPLOYEE_MANAGEMENT_ENABLED` /
 * `EMPLOYEE_MANAGEMENT_ENABLED` in `scripts/start-e2e.mjs` (kimm brand flag stays off).
 */
import { expect, test } from '@playwright/test'

import {
  bookWithEmployee,
  createEmployeeAccount,
  e2eEmployeeAccount,
  expandEmployee,
  makeEmployeeBookable,
  openAdminEmployees,
  setEmployeeAuth,
  setEmployeeBookable,
  signInAsAdminFresh,
  signInAsEmployee,
} from './employeeHelpers'
import { selectServiceDateAndTime } from './bookingHelpers'
import { signInAsDemo, signOutAsDemo, signOutCurrentUser } from './helpers'

test.describe.configure({ mode: 'serial' })

test.describe('employee management', () => {
  test('settings shows employee nav; booking works with Beliebig', async ({ page }) => {
    await signInAsDemo(page)
    await page.goto('/admin/settings')
    await expect(page.getByRole('button', { name: 'Mitarbeiter*innen' })).toBeVisible()
    await signOutAsDemo(page)

    await openAdminEmployees(page)
    await createEmployeeAccount(page)
    await makeEmployeeBookable(page)
    await signOutAsDemo(page)

    await page.goto('/book')
    await selectServiceDateAndTime(page)
    await expect(page.getByRole('heading', { name: /Kontaktdaten/ })).toBeVisible()
  })

  test('employee logs in to /employee', async ({ page }) => {
    await openAdminEmployees(page)
    await signInAsEmployee(page)
    await expect(page.getByRole('button', { name: 'Arbeitszeiten' })).toBeVisible()
    await signOutCurrentUser(page)
  })

  test('customer books a specific stylist', async ({ page }) => {
    await bookWithEmployee(page, e2eEmployeeAccount.displayName)
    await page.getByLabel('Vorname').fill('Kundin')
    await page.getByLabel('Nachname').fill('Mit Stylist')
    await page.getByLabel('Telefon').fill('+43 660 1234567')
    await page.getByLabel('E-Mail-Adresse').fill('kunde-stylist@example.com')
    await page.getByLabel(/Datenschutzhinweise/).check()
    await page.getByRole('button', { name: 'Termin verbindlich anfragen' }).click()
    await expect(page).toHaveURL(/\/booking\/confirmed/)
  })

  test('bookable off hides stylist picker', async ({ page }) => {
    await openAdminEmployees(page)
    await expandEmployee(page)
    await setEmployeeBookable(page, false)
    await expect(
      page
        .getByRole('heading', { name: 'Öffentliche Buchbarkeits-Projektion' })
        .locator('..'),
    ).not.toContainText(e2eEmployeeAccount.displayName, { timeout: 15_000 })
    await signOutAsDemo(page)
    await page.goto('/book')
    await page.reload()

    await page.goto('/book')
    const serviceSection = page.locator('[aria-labelledby="step-service"]')
    await serviceSection.getByRole('button', { name: /Herrenhaarschnitt/ }).first().click()
    await page.getByRole('button', { name: 'Weiter zur Terminauswahl' }).click()
    await expect(page.getByRole('heading', { name: 'Stylist*in auswählen' })).toHaveCount(0)
  })

  test('auth-disable blocks login; bookable on does not restore it', async ({ page }) => {
    await openAdminEmployees(page)
    await expandEmployee(page)
    await setEmployeeBookable(page, true)
    await setEmployeeAuth(page, false)
    await signOutAsDemo(page)

    await page.goto('/login')
    await page.getByLabel('E-Mail').fill(e2eEmployeeAccount.email)
    await page.getByLabel('Passwort').fill(e2eEmployeeAccount.password)
    await page.getByRole('button', { name: 'Als Admin anmelden' }).click()
    await expect(page).not.toHaveURL(/\/employee/)

    await signInAsAdminFresh(page)
    await page.goto('/admin/employees')
    await expandEmployee(page)
    await setEmployeeBookable(page, true)
    await signOutAsDemo(page)

    await page.goto('/login')
    await page.getByLabel('E-Mail').fill(e2eEmployeeAccount.email)
    await page.getByLabel('Passwort').fill(e2eEmployeeAccount.password)
    await page.getByRole('button', { name: 'Als Admin anmelden' }).click()
    await expect(page).not.toHaveURL(/\/employee/)
  })
})