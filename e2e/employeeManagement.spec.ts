/**
 * Employee management E2E — enabled via `VITE_EMPLOYEE_MANAGEMENT_ENABLED` /
 * `EMPLOYEE_MANAGEMENT_ENABLED` in `scripts/start-e2e.mjs` (kimm brand flag stays off).
 *
 * Serial: later tests reuse the stylist created in the first test.
 */
import { expect, test } from '@playwright/test'

import { selectServiceDateAndTime } from './bookingHelpers'
import {
  addEmployeeAbsence,
  bookWithEmployee,
  createEmployeeAccount,
  e2eEmployeeAccount,
  expectNoStylistStep,
  makeEmployeeBookable,
  openAccessDialog,
  openAccountDialog,
  openAdminEmployees,
  setEmployeeAuth,
  setEmployeeBookable,
  signInAsAdminFresh,
  signInAsEmployee,
} from './employeeHelpers'
import { todayYmdInTimeZone } from '../src/data/calendarMath'
import { addCalendarDays } from './calendarDates'
import { enableEmployeeAuth, getEmployeeUidByEmail } from './firestoreAdmin'
import { signInAsDemo, signOutAsDemo, signOutCurrentUser } from './helpers'

test.describe.configure({ mode: 'serial' })

test.describe('employee management', () => {
  test('settings shows employee nav; create stylist; Beliebig booking still works', async ({
    page,
  }) => {
    await signInAsDemo(page)
    await page.goto('/admin/settings')
    await expect(page.getByRole('button', { name: 'Mitarbeiter*innen' })).toBeVisible()
    await signOutAsDemo(page)

    await openAdminEmployees(page)
    await createEmployeeAccount(page)
    await makeEmployeeBookable(page)
    await signOutAsDemo(page)

    // Feature-on: only services offered by a bookable employee yield slots.
    await page.goto('/book')
    const serviceSection = page.locator('[aria-labelledby="step-service"]')
    await serviceSection
      .getByRole('button', { name: /Herrenhaarschnitt/ })
      .first()
      .click()
    await page.getByRole('button', { name: 'Weiter zur Terminauswahl' }).click()
    await selectServiceDateAndTime(page, { skipServiceStep: true })
    await expect(page.getByRole('heading', { name: /Kontaktdaten/ })).toBeVisible()
  })

  test('employee logs in to /employee area', async ({ page }) => {
    await openAdminEmployees(page)
    await signInAsEmployee(page)
    await expect(page.getByRole('button', { name: 'Arbeitszeiten' })).toBeVisible()
    await signOutCurrentUser(page)
  })

  test('customer can book a specific stylist', async ({ page }) => {
    await bookWithEmployee(page, e2eEmployeeAccount.displayName)
    await page.getByLabel('Vorname').fill('Kundin')
    await page.getByLabel('Nachname').fill('Mit Stylist')
    await page.getByLabel('Telefon').fill('+43 660 1234567')
    await page.getByLabel('E-Mail-Adresse').fill('kunde-stylist@example.com')
    await page.getByLabel(/Datenschutzhinweise/).check()
    await page.getByRole('button', { name: 'Termin verbindlich anfragen' }).click()
    await expect(page).toHaveURL(/\/booking\/confirmed/)
  })

  test('duplicate employee email shows an error in the access dialog', async ({ page }) => {
    await openAdminEmployees(page)
    await openAccessDialog(page)
    const dialog = page.getByRole('dialog', { name: 'Zugang verwalten' })
    const createForm = dialog.locator('form').filter({
      has: page.getByRole('button', { name: 'Mitarbeiter-Konto erstellen' }),
    })
    await createForm.getByLabel('Vorname').fill('Dup')
    await createForm.getByLabel('Nachname').fill('likat')
    await createForm.getByLabel('E-Mail').fill(e2eEmployeeAccount.email)
    await createForm.getByLabel('Passwort').fill('AnotherPass!2026')
    await createForm.getByRole('button', { name: 'Mitarbeiter-Konto erstellen' }).click()
    await expect(createForm.getByRole('alert')).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('bookable off removes stylist from the booking picker', async ({ page }) => {
    await openAdminEmployees(page)
    await setEmployeeBookable(page, false)
    await signOutAsDemo(page)
    await expectNoStylistStep(page)
  })

  test('auth-disable blocks login even if the profile stays assigned', async ({ page }) => {
    await openAdminEmployees(page)
    await setEmployeeAuth(page, false)
    await signOutAsDemo(page)

    await page.goto('/login')
    await page.getByLabel('E-Mail').fill(e2eEmployeeAccount.email)
    await page.getByLabel('Passwort').fill(e2eEmployeeAccount.password)
    await page.getByRole('button', { name: 'Als Admin anmelden' }).click()
    await expect(page).not.toHaveURL(/\/employee/)
    await expect(page).not.toHaveURL(/\/admin/)
  })

  test('account dialog can rename the stylist; accordion shows the new name', async ({ page }) => {
    const uid = await getEmployeeUidByEmail(e2eEmployeeAccount.email)
    if (!uid) throw new Error('missing employee uid')
    await enableEmployeeAuth(uid)

    await openAdminEmployees(page)
    await openAccountDialog(page)
    const dialog = page.getByRole('dialog', { name: /Konto/ })
    const nameForm = dialog.locator('form').filter({
      has: page.getByRole('button', { name: 'Speichern' }),
    })
    await nameForm.getByLabel('Vorname').fill('E2E')
    await nameForm.getByLabel('Nachname').fill('Renamed')
    await nameForm.getByRole('button', { name: 'Speichern' }).click()
    await page.keyboard.press('Escape')

    await expect(page.getByRole('button', { name: /E2E Renamed/ })).toBeVisible({
      timeout: 15_000,
    })

    // Restore canonical name for later assertions / booking.
    await openAccountDialog(page)
    const restore = page.getByRole('dialog', { name: /Konto/ })
    const restoreForm = restore.locator('form').filter({
      has: page.getByRole('button', { name: 'Speichern' }),
    })
    await restoreForm.getByLabel('Nachname').fill(e2eEmployeeAccount.lastName)
    await restoreForm.getByRole('button', { name: 'Speichern' }).click()
    await page.keyboard.press('Escape')
    await expect(
      page.getByRole('button', { name: new RegExp(e2eEmployeeAccount.displayName) }),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('personal absence is listed as ganztags abwesend', async ({ page }) => {
    const uid = await getEmployeeUidByEmail(e2eEmployeeAccount.email)
    if (!uid) throw new Error('missing employee uid')
    await enableEmployeeAuth(uid)

    await openAdminEmployees(page)
    await setEmployeeBookable(page, true)

    const today = todayYmdInTimeZone('Europe/Vienna')
    const start = addCalendarDays(today, 14)
    const end = addCalendarDays(today, 15)
    await addEmployeeAbsence(page, { startDate: start, endDate: end })
    await expect(page.getByText('Ganztags abwesend').first()).toBeVisible()
    await expect(page.getByText('Ganztags geschlossen')).toHaveCount(0)
  })

  test('direct /employee URL requires a staff login', async ({ page }) => {
    await page.goto('/employee')
    await expect(page).not.toHaveURL(/\/employee\/hours/)
  })
})
