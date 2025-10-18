const { device, element, by, expect, waitFor } = require('detox')
const { loginAsHandyman } = require('./helpers/test-helpers')

describe('Handyman Availability', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true })
    await loginAsHandyman()
  })

  it('opens availability manager from dashboard', async () => {
    await waitFor(element(by.id('set-availability-button')))
      .toBeVisible()
      .withTimeout(10000)

    await element(by.id('set-availability-button')).tap()

    await expect(element(by.text('Verfügbarkeit verwalten'))).toBeVisible()
    await expect(element(by.id('availability-add-slot'))).toBeVisible()

    await element(by.id('availability-close')).tap()
    await expect(element(by.text('Verfügbarkeit verwalten'))).toBeNotVisible()
  })
})
