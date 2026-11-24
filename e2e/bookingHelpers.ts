import { expect, type Page } from '@playwright/test'

type SelectSlotOptions = {
  /** Service (and optional stylist) already chosen — start at date step. */
  skipServiceStep?: boolean
}

/** Drive the booking wizard through service → date → time (stylist step left at “Beliebig” when shown). */
export async function selectServiceDateAndTime(
  page: Page,
  options: SelectSlotOptions = {},
): Promise<void> {
  if (!options.skipServiceStep) {
    await expect(page.getByRole('heading', { name: 'Termin buchen' })).toBeVisible()
  }
  const serviceSection = page.locator('[aria-labelledby="step-service"]')
  if (!options.skipServiceStep && (await serviceSection.isVisible())) {
    await serviceSection.locator('button').first().click()
    await page.getByRole('button', { name: 'Weiter zur Terminauswahl' }).click()
  }

  await expect(page.getByRole('heading', { name: /Datum wählen/ })).toBeVisible({
    timeout: 15_000,
  })

  const dayButtons = page
    .locator('[aria-labelledby="step-date"] button')
    .filter({ hasText: /^\d{1,2}$/ })

  await expect
    .poll(async () => {
      const count = await dayButtons.count()
      let enabled = 0
      for (let i = 0; i < count; i += 1) {
        if (await dayButtons.nth(i).isEnabled()) enabled += 1
      }
      return enabled
    })
    .toBeGreaterThan(0)

  const count = await dayButtons.count()
  for (let i = 0; i < count; i += 1) {
    const button = dayButtons.nth(i)
    if (!(await button.isEnabled())) continue
    await button.click()
    const slot = page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first()
    try {
      await expect(slot).toBeVisible({ timeout: 8_000 })
      await slot.click()
      await expect(page.getByRole('heading', { name: /Kontaktdaten/ })).toBeVisible()
      return
    } catch {
      // try next enabled day
    }
  }

  throw new Error('No available date/time found in the booking calendar')
}
