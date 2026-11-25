import { expect, test } from '@playwright/test'

import { selectServiceDateAndTime } from './bookingHelpers'

test.describe('customer booking @smoke', () => {
  test('customer books without account and can cancel via manage link', async ({ page }) => {
    await page.goto('/book')

    await selectServiceDateAndTime(page)

    await page.getByLabel('Vorname').fill('Erika')
    await page.getByLabel('Nachname').fill('Muster')
    await page.getByLabel('Telefon').fill('0660 9999999')
    await page.getByLabel('E-Mail-Adresse').fill('erika@example.com')
    await page.getByLabel(/Notizen/).fill('Bitte Spitzen schneiden')
    await page.getByLabel(/Datenschutzhinweise/).check()
    await page.getByRole('button', { name: 'Termin verbindlich anfragen' }).click()

    await expect(page).toHaveURL(/\/booking\/confirmed/)
    await expect(
      page.getByRole('heading', { name: /Termin bestätigt|Anfrage eingegangen/ }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Termin verwalten' })).toBeVisible()

    await page.getByRole('button', { name: 'Termin verwalten' }).click()
    await expect(page).toHaveURL(/\/manage\//)
    await expect(page.getByRole('heading', { name: 'Termin verwalten' })).toBeVisible()
    await expect(page.getByText('Erika Muster')).toBeVisible()

    await page.getByRole('button', { name: 'Stornieren' }).click()
    await expect(page.getByText('Status: Storniert')).toBeVisible({ timeout: 15_000 })
  })

  test('shows form errors in the selected language', async ({ page }) => {
    await page.goto('/book')
    await selectServiceDateAndTime(page)
    await page
      .getByRole('banner')
      .getByRole('group', { name: 'Sprache' })
      .getByRole('button', { name: 'Italiano' })
      .click()

    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Giulia')
    await page.getByRole('textbox', { name: 'Cognome' }).fill('Test')
    await page.getByRole('textbox', { name: 'Telefono' }).fill('+39 333 1234567')
    await page.getByRole('textbox', { name: 'Indirizzo e-mail' }).fill('giulia@example.com')
    await page.getByRole('button', { name: 'Richiedi appuntamento' }).click()
    await expect(page.getByRole('alert')).toHaveText(
      'Confermi di aver letto l’informativa sulla privacy.',
    )

    await page
      .getByRole('banner')
      .getByRole('group', { name: 'Lingua' })
      .getByRole('button', { name: 'Deutsch' })
      .click()
    await expect(page.getByRole('alert')).toHaveText(
      'Bitte bestätigen Sie, dass Sie die Datenschutzhinweise gelesen haben.',
    )

    await page.getByLabel(/Datenschutzhinweise/).check()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('selecting a timeslot does not add empty space below the footer', async ({ page }) => {
    const spaceBelowFooter = async (): Promise<number> => {
      const footer = page.locator('footer')
      await expect(footer).toBeVisible()
      const box = await footer.boundingBox()
      if (!box) throw new Error('footer bounding box not available')
      const { scrollHeight, scrollY } = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        scrollY: window.scrollY,
      }))
      return scrollHeight - (box.y + box.height + scrollY)
    }

    await page.goto('/book')
    const serviceSection = page.locator('[aria-labelledby="step-service"]')
    await serviceSection.locator('button').first().click()
    await page.getByRole('button', { name: 'Weiter zur Terminauswahl' }).click()
    await expect(page.getByRole('heading', { name: /Datum wählen/ })).toBeVisible({
      timeout: 15_000,
    })

    const gapBeforeSlot = await spaceBelowFooter()

    await selectServiceDateAndTime(page, { skipServiceStep: true })

    const gapAfterSlot = await spaceBelowFooter()

    expect(gapBeforeSlot).toBeLessThanOrEqual(16)
    expect(Math.abs(gapAfterSlot - gapBeforeSlot)).toBeLessThanOrEqual(8)
  })
})
