import { expect, type Page } from '@playwright/test'

import { selectServiceDateAndTime } from './bookingHelpers'
import {
  copySalonOpeningHoursToEmployee,
  getEmployeeUidByEmail,
} from './firestoreAdmin'
import { demoAccount, signInAsDemo, signOutAsDemo } from './helpers'

export const e2eEmployeeAccount = {
  email: 'e2e.stylist@salonflow.local',
  password: 'EmployeeE2e!2026',
  firstName: 'E2E',
  lastName: 'Stylist',
  displayName: 'E2E Stylist',
} as const

export async function openAdminEmployees(page: Page): Promise<void> {
  await signInAsDemo(page)
  await page.goto('/admin/settings')
  await page.getByRole('button', { name: 'Mitarbeiter*innen' }).click()
  await expect(page).toHaveURL(/\/admin\/employees/)
  await expect(page.getByRole('heading', { name: 'Mitarbeiter*innen' })).toBeVisible()
}

export async function createEmployeeAccount(page: Page): Promise<void> {
  const { email, password, firstName, lastName, displayName } = e2eEmployeeAccount
  const createSection = page.locator('form').filter({
    has: page.getByRole('button', { name: 'Mitarbeiter-Konto erstellen' }),
  })
  await createSection.getByLabel('Vorname').fill(firstName)
  await createSection.getByLabel('Nachname').fill(lastName)
  await createSection.getByLabel('E-Mail').fill(email)
  await createSection.getByLabel('Passwort').fill(password)
  await createSection.getByRole('button', { name: 'Mitarbeiter-Konto erstellen' }).click()
  await expect(page.getByText('Mitarbeiter-Konto wurde erstellt.')).toBeVisible()
  await page.getByRole('button', { name: displayName }).click()
}

/** Assigns Herrenhaarschnitt and copies Tuesday hours to all open weekdays. */
export async function makeEmployeeBookable(page: Page): Promise<void> {
  const { displayName } = e2eEmployeeAccount
  const haircutRow = page
    .getByText('Herrenhaarschnitt / Taglio uomo')
    .locator('xpath=ancestor::div[1]')
  const haircutSwitch = haircutRow.getByRole('switch', { name: displayName })
  if (!(await haircutSwitch.isChecked())) {
    await haircutSwitch.click()
  }
  await expect(haircutSwitch).toBeChecked({ timeout: 15_000 })

  const uid = await getEmployeeUidByEmail(e2eEmployeeAccount.email)
  if (!uid) {
    throw new Error(`Employee doc not found for ${e2eEmployeeAccount.email}`)
  }
  await copySalonOpeningHoursToEmployee(uid)

  await expect(
    page
      .getByRole('heading', { name: 'Öffentliche Buchbarkeits-Projektion' })
      .locator('..')
      .getByText(displayName),
  ).toBeVisible({ timeout: 20_000 })
}

export async function setEmployeeBookable(page: Page, on: boolean): Promise<void> {
  const toggle = page.getByRole('switch', { name: /Buchbar|Nicht buchbar/ })
  if ((await toggle.isChecked()) !== on) {
    await toggle.click()
  }
}

export async function setEmployeeAuth(page: Page, enabled: boolean): Promise<void> {
  const toggle = page.getByRole('switch', { name: /Login aktiv|Login deaktiviert/ })
  if ((await toggle.isChecked()) !== enabled) {
    await toggle.click()
  }
}

export async function expandEmployee(page: Page): Promise<void> {
  await page.getByRole('button', { name: e2eEmployeeAccount.displayName }).click()
}

export async function signInAsEmployee(page: Page): Promise<void> {
  await signOutAsDemo(page)
  await page.goto('/login')
  await page.getByLabel('E-Mail').fill(e2eEmployeeAccount.email)
  await page.getByLabel('Passwort').fill(e2eEmployeeAccount.password)
  await page.getByRole('button', { name: 'Als Admin anmelden' }).click()
  await expect(page).toHaveURL(/\/employee/)
  await expect(page.getByRole('heading', { name: 'Mitarbeiter-Bereich' })).toBeVisible()
}

export async function signInAsAdminFresh(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('E-Mail').fill(demoAccount.email)
  await page.getByLabel('Passwort').fill(demoAccount.password)
  await page.getByRole('button', { name: 'Als Admin anmelden' }).click()
  await expect(page).toHaveURL(/\/admin/)
}

export async function bookWithEmployee(page: Page, employeeName: string): Promise<void> {
  await page.goto('/book')
  await expect(page.getByRole('heading', { name: 'Termin buchen' })).toBeVisible()
  const serviceSection = page.locator('[aria-labelledby="step-service"]')
  await serviceSection.getByRole('button', { name: /Herrenhaarschnitt/ }).first().click()
  await page.getByRole('button', { name: 'Weiter zur Terminauswahl' }).click()
  await expect(page.getByRole('heading', { name: /Datum wählen/ })).toBeVisible()
  await expect(page.getByRole('button', { name: employeeName })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: employeeName }).click()
  await selectServiceDateAndTime(page, { skipServiceStep: true })
}