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

    const dateSection = page.locator('[aria-labelledby="admin-manual-date"]')
    const dayButtons = dateSection.locator('button').filter({ hasText: /^\d{2}$/ })

    const findEnabledDayIndex = async (): Promise<number> => {
      const count = await dayButtons.count()
      for (let index = 0; index < count; index += 1) {
        if (await dayButtons.nth(index).isEnabled()) return index
      }
      return -1
    }

    let enabledIndex = -1
    for (let monthOffset = 0; monthOffset < 2; monthOffset += 1) {
      await expect(dateSection.getByRole('progressbar')).toHaveCount(0, { timeout: 15_000 })
      enabledIndex = await findEnabledDayIndex()
      if (enabledIndex >= 0) break
      await dateSection.getByRole('button', { name: 'Weiter' }).click()
    }
    expect(enabledIndex).toBeGreaterThanOrEqual(0)

    await dayButtons.nth(enabledIndex).click()
    const slot = page.getByRole('button', { name: /^\d{2}:\d{2}/ }).first()
    await expect(slot).toBeVisible({ timeout: 8_000 })
    await slot.click()

    await page.getByLabel('Vorname').fill('Telefon')
    await page.getByLabel('Nachname').fill('Kunde')
    await page.getByLabel('Telefon').fill('+43 660 5555555')
    await page.getByRole('button', { name: 'Termin anlegen' }).click()

    await expect(page).toHaveURL(/\/admin\/reservations\//)
    await expect(page.getByText('Telefon Kunde')).toBeVisible()
    await expect(page.getByText('Bestätigt')).toBeVisible()
  })
})
