import { expect, type Page } from '@playwright/test'

import { selectServiceDateAndTime } from './bookingHelpers'
import {
  ensureEmployeeReadyForHaircutBooking,
  getEmployeeDoc,
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

export async function openAccessDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Zugang' }).click()
  await expect(page.getByRole('dialog', { name: 'Zugang verwalten' })).toBeVisible()
}

export async function createEmployeeAccount(page: Page): Promise<void> {
  const { email, password, firstName, lastName } = e2eEmployeeAccount
  await openAccessDialog(page)
  const dialog = page.getByRole('dialog', { name: 'Zugang verwalten' })
  const createForm = dialog.locator('form').filter({
    has: page.getByRole('button', { name: 'Mitarbeiter-Konto erstellen' }),
  })
  await createForm.getByLabel('Vorname').fill(firstName)
  await createForm.getByLabel('Nachname').fill(lastName)
  await createForm.getByLabel('E-Mail').fill(email)
  await createForm.getByLabel('Passwort').fill(password)
  await createForm.getByRole('button', { name: 'Mitarbeiter-Konto erstellen' }).click()
  await expect(createForm.getByText('Mitarbeiter-Konto wurde erstellt.')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expandEmployee(page)
}

/** Assigns Herrenhaarschnitt via multi-select; Firestore ensures hours + bookable state. */
export async function makeEmployeeBookable(page: Page): Promise<void> {
  await expandEmployee(page)

  const services = page.getByLabel('Dienste')
  await services.click()
  const haircut = page.getByRole('option', { name: /Herrenhaarschnitt/ })
  await expect(haircut).toBeVisible()
  const selected = await haircut.getAttribute('aria-selected')
  if (selected !== 'true') {
    await haircut.click()
  }
  await page.keyboard.press('Escape')

  const profileSave = page
    .locator('form')
    .filter({ has: page.getByLabel('Dienste') })
    .getByRole('button', { name: 'Speichern' })
  await profileSave.click()
  await expect(profileSave).toBeEnabled({ timeout: 15_000 })

  await setEmployeeBookable(page, true)

  const uid = await getEmployeeUidByEmail(e2eEmployeeAccount.email)
  if (!uid) {
    throw new Error(`Employee doc not found for ${e2eEmployeeAccount.email}`)
  }
  // Emulator availability must see serviceIds + hours; UI save can race with the next page.
  await ensureEmployeeReadyForHaircutBooking(uid)
  await expect
    .poll(async () => {
      const doc = await getEmployeeDoc(uid)
      const ids = Array.isArray(doc?.serviceIds) ? doc.serviceIds.map(String) : []
      return doc?.active === true && doc?.authDisabled !== true && ids.includes('haircut')
    })
    .toBe(true)
}

export async function setEmployeeBookable(page: Page, on: boolean): Promise<void> {
  await expandEmployee(page)
  const toggle = page.getByRole('switch', { name: /Buchbar|Nicht buchbar/ })
  if ((await toggle.isChecked()) !== on) {
    await toggle.click()
  }
  if (on) await expect(toggle).toBeChecked()
  else await expect(toggle).not.toBeChecked()
}

export async function openAccountDialog(page: Page): Promise<void> {
  await expandEmployee(page)
  await page.getByRole('button', { name: 'Konto verwalten' }).click()
  await expect(page.getByRole('dialog', { name: /Konto/ })).toBeVisible()
}

export async function setEmployeeAuth(page: Page, enabled: boolean): Promise<void> {
  await openAccountDialog(page)
  const dialog = page.getByRole('dialog', { name: /Konto/ })
  const toggle = dialog.getByRole('switch', { name: /Login aktiv|Login deaktiviert/ })
  if ((await toggle.isChecked()) !== enabled) {
    await toggle.click()
  }
  // Profile remounts on updatedAt; assert the accordion chip rather than the dialog switch.
  const summary = page.getByRole('button', {
    name: new RegExp(e2eEmployeeAccount.email.replace(/\./g, '\\.')),
  })
  if (enabled) {
    await expect(summary).not.toContainText('Login deaktiviert', { timeout: 20_000 })
  } else {
    await expect(summary).toContainText('Login deaktiviert', { timeout: 20_000 })
  }
  if ((await dialog.count()) > 0) {
    await page.keyboard.press('Escape')
  }
}

/** Expand the employee accordion; match by email so renames do not break helpers. */
export async function expandEmployee(page: Page): Promise<void> {
  const summary = page.getByRole('button', {
    name: new RegExp(e2eEmployeeAccount.email.replace(/\./g, '\\.')),
  })
  await expect(summary).toBeVisible()
  if ((await summary.getAttribute('aria-expanded')) !== 'true') {
    await summary.click()
  }
  await expect(summary).toHaveAttribute('aria-expanded', 'true')
}

export async function addEmployeeAbsence(
  page: Page,
  input: { startDate: string; endDate?: string },
): Promise<void> {
  await expandEmployee(page)
  await page.getByRole('button', { name: 'Abwesenheit eintragen' }).click()
  const dialog = page.getByRole('dialog', { name: 'Abwesenheit eintragen' })
  await expect(dialog).toBeVisible()

  const start = dialog.getByLabel(/Erster Tag|Datum/)
  await start.fill(input.startDate)
  if (input.endDate) {
    await dialog.getByLabel('Letzter Tag').fill(input.endDate)
  }
  await dialog.getByRole('button', { name: 'Eintragen' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Ganztags abwesend').first()).toBeVisible()
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
  await serviceSection
    .getByRole('button', { name: /Herrenhaarschnitt/ })
    .first()
    .click()
  await page.getByRole('button', { name: 'Weiter zur Terminauswahl' }).click()
  await expect(page.getByRole('heading', { name: /Datum wählen/ })).toBeVisible()
  await expect(page.getByRole('button', { name: employeeName })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: employeeName }).click()
  await selectServiceDateAndTime(page, { skipServiceStep: true })
}

export async function expectNoStylistStep(page: Page): Promise<void> {
  await page.goto('/book')
  await page.reload()
  await page.goto('/book')
  const serviceSection = page.locator('[aria-labelledby="step-service"]')
  await serviceSection
    .getByRole('button', { name: /Herrenhaarschnitt/ })
    .first()
    .click()
  await page.getByRole('button', { name: 'Weiter zur Terminauswahl' }).click()
  await expect(page.getByRole('heading', { name: 'Stylist*in auswählen' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /Datum wählen/ })).toBeVisible()
}
