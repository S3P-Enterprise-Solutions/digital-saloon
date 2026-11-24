import { expect, test, type Page } from '@playwright/test'

import { selectServiceDateAndTime } from './bookingHelpers'
import {
  getBookingSettings,
  getSalonDetails,
  restoreSeededSettings,
  seededBookingSettings,
  seededSalonDetails,
} from './firestoreAdmin'
import { signInAsDemo, signOutAsDemo } from './helpers'

async function openSettings(page: Page): Promise<void> {
  await page.goto('/admin/settings')
  await expect(page.getByRole('heading', { name: 'Einstellungen' })).toBeVisible()
  await expect(page.getByLabel('Mindestvorlauf')).toBeVisible()
}

function bookingRules(page: Page) {
  return page.getByRole('region', { name: 'Online-Buchung' })
}

function salonDetails(page: Page) {
  return page.getByRole('region', { name: 'Salon und Kontakt' })
}

test.describe('admin settings @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await restoreSeededSettings()
    await signInAsDemo(page)
    await openSettings(page)
  })

  test.afterAll(async () => {
    await restoreSeededSettings()
  })

  test('shows the current booking rules and contact data', async ({ page }) => {
    await expect(page.getByLabel('Automatisch bestätigen')).toBeChecked()
    await expect(page.getByLabel('Mindestvorlauf')).toHaveValue('60')
    await expect(page.getByLabel('Höchstens im Voraus buchbar')).toHaveValue('60')
    await expect(page.getByLabel('Offene Anfragen verfallen nach')).toHaveValue('24')
    await expect(bookingRules(page)).toContainText('15 Minuten')
    await expect(page.getByLabel(/Telefon/)).toHaveValue(seededSalonDetails.phone)
  })

  test('saves booking rules and keeps them after reload', async ({ page }) => {
    await bookingRules(page).getByRole('combobox').click()
    await page.getByRole('option', { name: '30 Minuten' }).click()
    await page.getByLabel('Höchstens im Voraus buchbar').fill('90')
    await page.getByLabel('Mindestvorlauf').fill('120')
    await bookingRules(page).getByRole('button', { name: 'Speichern' }).click()
    await expect(bookingRules(page).getByRole('status')).toHaveText('Gespeichert.')

    await expect.poll(getBookingSettings).toEqual({
      ...seededBookingSettings,
      slotIntervalMinutes: 30,
      maxAdvanceBookingDays: 90,
      minAdvanceBookingMinutes: 120,
    })

    await page.reload()
    await expect(page.getByLabel('Höchstens im Voraus buchbar')).toHaveValue('90')
    await expect(page.getByLabel('Mindestvorlauf')).toHaveValue('120')
    await expect(bookingRules(page)).toContainText('30 Minuten')
  })

  test('rejects values outside the allowed range without saving', async ({ page }) => {
    await page.getByLabel('Höchstens im Voraus buchbar').fill('0')
    await page.getByLabel('Mindestvorlauf').fill('abc')
    await bookingRules(page).getByRole('button', { name: 'Speichern' }).click()

    await expect(bookingRules(page)).toContainText('Erlaubt sind ganze Zahlen von 1 bis 365.')
    await expect(bookingRules(page)).toContainText('Erlaubt sind ganze Zahlen von 0 bis 10080.')
    await expect(bookingRules(page).getByRole('status')).toHaveCount(0)
    expect(await getBookingSettings()).toEqual(seededBookingSettings)
  })

  test('manual confirmation turns new online bookings into open requests', async ({ page }) => {
    await page.getByLabel(/Jede Anfrage selbst bestätigen/).check()
    await bookingRules(page).getByRole('button', { name: 'Speichern' }).click()
    await expect(bookingRules(page).getByRole('status')).toHaveText('Gespeichert.')
    await expect.poll(async () => (await getBookingSettings()).confirmationMode).toBe('MANUAL')

    const lastName = `Anfrage${Date.now().toString().slice(-5)}`
    await signOutAsDemo(page)
    await page.goto('/book')
    await selectServiceDateAndTime(page)
    await page.getByLabel('Vorname').fill('Manuell')
    await page.getByLabel('Nachname').fill(lastName)
    await page.getByLabel('Telefon').fill('+39 333 7654321')
    await page.getByLabel('E-Mail-Adresse').fill('manuell@example.com')
    await page.getByLabel(/Datenschutzhinweise/).check()
    await page.getByRole('button', { name: 'Termin verbindlich anfragen' }).click()
    await expect(page.getByRole('heading', { name: /Anfrage eingegangen/ })).toBeVisible()

    await signInAsDemo(page)
    await page.goto('/admin/pending')
    await expect(
      page.getByRole('region', { name: 'Offene Anfragen' }).getByText(`Manuell ${lastName}`),
    ).toBeVisible()
  })

  test('updates the contact data shown on the website', async ({ page }) => {
    const newPhone = '+39 0473 000111'
    await salonDetails(page)
      .getByLabel(/Telefon/)
      .fill(newPhone)
    await salonDetails(page).getByRole('button', { name: 'Speichern' }).click()
    await expect(salonDetails(page).getByRole('status')).toHaveText('Gespeichert.')
    await expect.poll(async () => (await getSalonDetails()).phone).toBe(newPhone)
    expect((await getSalonDetails()).timezone).toBe('Europe/Vienna')

    await signOutAsDemo(page)
    await page.goto('/')
    await expect(page.getByRole('contentinfo')).toContainText(newPhone)
    await expect(
      page.getByRole('main').getByRole('link', { name: newPhone, exact: true }),
    ).toHaveAttribute('href', 'tel:+390473000111')
  })

  test('requires a valid email and the other contact fields', async ({ page }) => {
    await salonDetails(page)
      .getByLabel(/E-Mail/)
      .fill('keine-mail')
    await salonDetails(page)
      .getByLabel(/Adresse/)
      .fill('   ')
    await salonDetails(page).getByRole('button', { name: 'Speichern' }).click()

    await expect(salonDetails(page)).toContainText('Bitte eine gültige E-Mail-Adresse eingeben.')
    await expect(salonDetails(page)).toContainText('Bitte ausfüllen.')
    expect((await getSalonDetails()).email).toBe(seededSalonDetails.email)
  })

  test('rejects overlong contact data before saving', async ({ page }) => {
    await salonDetails(page)
      .getByLabel(/Name des Salons/)
      .fill('x'.repeat(121))
    await salonDetails(page).getByRole('button', { name: 'Speichern' }).click()

    await expect(salonDetails(page)).toContainText('Höchstens 120 Zeichen.')
    await expect(salonDetails(page).getByRole('alert')).toHaveCount(0)
    expect((await getSalonDetails()).name).toBe(seededSalonDetails.name)
  })
})
