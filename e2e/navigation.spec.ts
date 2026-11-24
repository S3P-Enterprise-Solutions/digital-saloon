import { expect, test } from '@playwright/test'

import { selectServiceDateAndTime } from './bookingHelpers'
import { signInAsDemo } from './helpers'

test.describe('navigation @smoke', () => {
  test('customer header has no "Meine Termine" and the footer links the privacy policy', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(
      page.getByRole('banner').getByRole('button', { name: 'Meine Termine' }),
    ).toHaveCount(0)

    await page.getByRole('contentinfo').getByRole('button', { name: 'Datenschutz' }).click()
    await expect(page).toHaveURL(/\/datenschutz$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Datenschutzerklärung' }),
    ).toBeVisible()
    await expect(page.getByText('Via Piave 71, 39012 Meran').last()).toBeVisible()
  })

  test('admin is sent from customer pages to the calendar', async ({ page }) => {
    await signInAsDemo(page)

    await page.goto('/')
    await expect(page).toHaveURL(/\/admin(\?week=|$)/)

    await page.goto('/book')
    await expect(page).toHaveURL(/\/admin(\?week=|$)/)

    await page.goto('/admin/settings')
    await page
      .getByRole('banner')
      .getByRole('button', { name: /KIMM Hair|Salon 1500/ })
      .click()
    await expect(page).toHaveURL(/\/admin\?week=/)
    await expect(
      page.getByRole('banner').getByRole('button', { name: 'Termin buchen' }),
    ).toHaveCount(0)
  })

  test('admin header marks the current page', async ({ page }) => {
    await signInAsDemo(page)
    const header = page.getByRole('banner')

    await expect(header.getByRole('button', { name: 'Kalender' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(header.getByRole('button', { name: 'Anfragen' })).not.toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(header.getByRole('button', { name: 'Einstellungen' })).not.toHaveAttribute(
      'aria-current',
      'page',
    )

    await header.getByRole('button', { name: 'Anfragen' }).click()
    await expect(page).toHaveURL(/\/admin\/pending$/)
    await expect(header.getByRole('button', { name: 'Anfragen' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(header.getByRole('button', { name: 'Kalender' })).not.toHaveAttribute(
      'aria-current',
      'page',
    )

    await header.getByRole('button', { name: 'Einstellungen' }).click()
    await expect(page).toHaveURL(/\/admin\/settings$/)
    await expect(header.getByRole('button', { name: 'Einstellungen' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(header.getByRole('button', { name: 'Kalender' })).not.toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(header.getByRole('button', { name: 'Anfragen' })).not.toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  test('booking consent links the privacy policy in a new tab', async ({ page }) => {
    await page.goto('/book')
    await selectServiceDateAndTime(page)

    const consent = page.getByLabel(/Datenschutzhinweise/)
    const link = page.getByRole('link', { name: /^Datenschutzhinweise/ })
    await expect(link).toHaveAttribute('href', '/datenschutz')
    await expect(link).toHaveAttribute('target', '_blank')

    const popupPromise = page.waitForEvent('popup')
    await link.click()
    const popup = await popupPromise
    await expect(
      popup.getByRole('heading', { level: 1, name: 'Datenschutzerklärung' }),
    ).toBeVisible()
    await popup.close()

    await expect(consent).not.toBeChecked()
    await consent.check()
    await expect(consent).toBeChecked()
  })
})
