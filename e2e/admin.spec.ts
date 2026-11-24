import { expect, test } from '@playwright/test'

import { signInAsDemo } from './helpers'

test.describe('admin @smoke', () => {
  test('admin opens the week planner and confirms a pending seed reservation', async ({ page }) => {
    await signInAsDemo(page)

    await page.goto('/admin/settings')
    await page.getByRole('button', { name: 'Kalender' }).click()
    await expect(page).toHaveURL(/\/admin\?week=/)
    await expect(page.getByRole('region', { name: 'Wochenkalender' })).toBeVisible()

    await page.goto('/admin?week=2026-04-06')
    const entry = page
      .getByRole('region', { name: 'Wochenkalender' })
      .getByRole('button', { name: /Max Mustermann/ })
    await expect(entry).toBeVisible({ timeout: 15_000 })

    await entry.click()
    await page.getByRole('menuitem', { name: 'Details anzeigen' }).click()
    await expect(page).toHaveURL(/\/admin\/reservations\//)
    await expect(page.getByRole('heading', { name: 'Termin-Details' })).toBeVisible()
    await expect(page.getByText('Ausstehend')).toBeVisible()

    await page.getByRole('button', { name: 'Bestätigen' }).click()
    await expect(page.getByText('Bestätigt')).toBeVisible({ timeout: 15_000 })
  })

  test('admin can create a manual reservation', async ({ page }) => {
    await signInAsDemo(page)
    await page.goto('/admin/manual')

    await page.getByRole('button', { name: /^Herrenhaarschnitt/ }).click()
    await page.getByRole('button', { name: /^Kinderhaarschnitt/ }).click()

    const dateButtons = page.locator('button').filter({ hasText: /\d{2}\.\d{2}\.\d{4}/ })
    const dateCount = await dateButtons.count()
    expect(dateCount).toBeGreaterThan(0)

    let booked = false
    for (let index = 0; index < dateCount; index += 1) {
      await dateButtons.nth(index).click()
      const slot = page.getByRole('button', { name: /^\d{2}:\d{2}/ }).first()
      try {
        await expect(slot).toBeVisible({ timeout: 8_000 })
        await slot.click()
        booked = true
        break
      } catch {
        // try next day
      }
    }
    expect(booked).toBe(true)

    await page.getByLabel('Vorname').fill('Telefon')
    await page.getByLabel('Nachname').fill('Kunde')
    await page.getByLabel('Telefon').fill('+43 660 5555555')
    await page.getByRole('button', { name: 'Termin anlegen' }).click()

    await expect(page).toHaveURL(/\/admin\/reservations\//)
    await expect(page.getByText('Telefon Kunde')).toBeVisible()
    await expect(page.getByText('Bestätigt')).toBeVisible()
  })
})
