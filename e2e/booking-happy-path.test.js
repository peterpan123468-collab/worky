const { device, element, by, expect, waitFor } = require('detox')
const { loginAsCustomer } = require('./helpers/test-helpers')

describe('Booking Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true })
    await loginAsCustomer()
  })

  it('navigates to bookings overview from dashboard', async () => {
    await waitFor(element(by.id('my-bookings-button')))
      .toBeVisible()
      .withTimeout(10000)
    await element(by.id('my-bookings-button')).tap()

    await waitFor(element(by.text('My Bookings')))
      .toBeVisible()
      .withTimeout(5000)

    await expect(element(by.id('bookings-scroll'))).toBeVisible()

    await device.pressBack()
  })

  it('navigates to booking creation flow and shows filters', async () => {
    await waitFor(element(by.id('browse-available-slots-button')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.id('browse-available-slots-button')).tap()

    await waitFor(element(by.text('Book An Appointment')))
      .toBeVisible()
      .withTimeout(5000)

    await expect(element(by.id('booking-filter-region'))).toBeVisible()
    await expect(element(by.id('booking-filter-apply'))).toBeVisible()

    await device.pressBack()
  })
})
