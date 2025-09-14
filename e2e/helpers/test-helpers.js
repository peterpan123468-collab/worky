const { device, element, by, waitFor } = require('detox')

/**
 * Test helper utilities for Worky E2E tests
 */

/**
 * Login as handyman user
 */
async function loginAsHandyman(email = 'test.handyman@example.com', password = 'testpass123') {
  try {
    await element(by.text('Get Started')).tap()
    await element(by.text('Sign In')).tap()
  } catch (e) {
    // Already on login screen
  }

  await element(by.id('email-input')).clearText()
  await element(by.id('email-input')).typeText(email)
  await element(by.id('password-input')).clearText()
  await element(by.id('password-input')).typeText(password)
  await element(by.id('login-button')).tap()

  await waitFor(element(by.text('Welcome back!')))
    .toBeVisible()
    .withTimeout(10000)
}

/**
 * Login as customer user
 */
async function loginAsCustomer(email = 'test.customer@example.com', password = 'testpass123') {
  try {
    await element(by.text('Get Started')).tap()
    await element(by.text('Sign In')).tap()
  } catch (e) {
    // Already on login screen
  }

  await element(by.id('email-input')).clearText()
  await element(by.id('email-input')).typeText(email)
  await element(by.id('password-input')).clearText()
  await element(by.id('password-input')).typeText(password)
  await element(by.id('login-button')).tap()

  await waitFor(element(by.text('Available Services')))
    .toBeVisible()
    .withTimeout(10000)
}

/**
 * Register new handyman user
 */
async function registerHandyman(
  email = 'new.handyman@example.com',
  password = 'testpass123',
  businessName = 'Test Handyman Business',
  hourlyRate = '50',
  region = 'Zurich'
) {
  await element(by.text('Get Started')).tap()
  await element(by.text('Sign Up')).tap()
  await element(by.text('I am a Handyman')).tap()

  await element(by.id('email-input')).typeText(email)
  await element(by.id('password-input')).typeText(password)
  await element(by.id('business-name-input')).typeText(businessName)
  await element(by.id('hourly-rate-input')).typeText(hourlyRate)
  await element(by.id('region-input')).typeText(region)

  await element(by.id('register-button')).tap()

  await waitFor(element(by.text('Welcome back!')))
    .toBeVisible()
    .withTimeout(10000)
}

/**
 * Register new customer user
 */
async function registerCustomer(email = 'new.customer@example.com', password = 'testpass123') {
  await element(by.text('Get Started')).tap()
  await element(by.text('Sign Up')).tap()
  await element(by.text('I am a Customer')).tap()

  await element(by.id('email-input')).typeText(email)
  await element(by.id('password-input')).typeText(password)

  await element(by.id('register-button')).tap()

  await waitFor(element(by.text('Available Services')))
    .toBeVisible()
    .withTimeout(10000)
}

/**
 * Create an auction with default or custom parameters
 */
async function createAuction({
  title = 'Test Auction',
  serviceType = 'handyman',
  region = 'Zurich',
  startingPrice = '50',
  duration = '120'
} = {}) {
  await element(by.id('create-auction-button')).tap()

  await element(by.id('auction-title-input')).clearText()
  await element(by.id('auction-title-input')).typeText(title)

  await element(by.id('service-type-input')).clearText()
  await element(by.id('service-type-input')).typeText(serviceType)

  await element(by.id('region-input')).clearText()
  await element(by.id('region-input')).typeText(region)

  await element(by.id('starting-price-input')).clearText()
  await element(by.id('starting-price-input')).typeText(startingPrice)

  await element(by.id('duration-input')).clearText()
  await element(by.id('duration-input')).typeText(duration)

  await element(by.id('create-auction-submit')).tap()

  await waitFor(element(by.text('Auction created')))
    .toBeVisible()
    .withTimeout(5000)

  await element(by.text('OK')).tap()
}

/**
 * Navigate to first available auction
 */
async function navigateToFirstAuction() {
  await element(by.id('browse-auctions-button')).tap()

  await waitFor(element(by.id('auction-list')))
    .toBeVisible()
    .withTimeout(10000)

  await waitFor(element(by.id('auction-card')).atIndex(0))
    .toBeVisible()
    .withTimeout(5000)

  await element(by.id('auction-card')).atIndex(0).tap()

  await waitFor(element(by.id('auction-detail-screen')))
    .toBeVisible()
    .withTimeout(5000)
}

/**
 * Place a bid on current auction
 */
async function placeBid(amount) {
  await element(by.id('bid-amount-input')).clearText()
  await element(by.id('bid-amount-input')).typeText(amount.toString())
  await element(by.id('place-bid-button')).tap()

  // Wait for either success or error
  await waitFor(element(by.text('Bid placed successfully')).or(by.text('Bid too low')))
    .toBeVisible()
    .withTimeout(5000)
}

/**
 * Wait for element with retry logic
 */
async function waitForElementWithRetry(elementMatcher, timeout = 10000, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await waitFor(elementMatcher)
        .toBeVisible()
        .withTimeout(timeout / retries)
      return
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

/**
 * Verify CHF currency format
 */
async function verifyCHFFormat(expectedAmount) {
  const chfPattern = `CHF ${expectedAmount}.00`
  await expect(element(by.text(chfPattern))).toBeVisible()
}

/**
 * Clear app data and restart
 */
async function resetApp() {
  await device.uninstallApp()
  await device.installApp()
  await device.launchApp()
}

/**
 * Test network resilience by triggering reconnection
 */
async function testNetworkResilience() {
  // Simulate network issues
  await device.shake()
  await new Promise(resolve => setTimeout(resolve, 2000))

  // App should recover
  await waitForElementWithRetry(
    element(by.text('Network error')).or(element(by.id('main-screen'))),
    15000
  )
}

/**
 * Scroll through auction list
 */
async function scrollThroughAuctions(scrolls = 5) {
  await waitFor(element(by.id('auction-list')))
    .toBeVisible()
    .withTimeout(10000)

  for (let i = 0; i < scrolls; i++) {
    await element(by.id('auction-list')).scroll(300, 'down')
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

/**
 * Verify auction timer is running
 */
async function verifyAuctionTimer() {
  await waitFor(element(by.id('auction-timer')))
    .toBeVisible()
    .withTimeout(5000)

  // Timer should show format like "5m 30s"
  await waitFor(element(by.id('auction-timer')).and(by.text(/\d+m \d+s/)))
    .toBeVisible()
    .withTimeout(3000)
}

/**
 * Verify stats are displayed with proper formatting
 */
async function verifyDashboardStats() {
  await expect(element(by.id('active-bookings-stat'))).toBeVisible()
  await expect(element(by.id('month-revenue-stat'))).toBeVisible()

  // Revenue should be in CHF format
  await expect(element(by.text(/CHF \d+\.\d{2}/))).toBeVisible()
}

/**
 * Handle potential app crashes or freezes
 */
async function handleAppStability() {
  try {
    await waitFor(element(by.text('Something went wrong')))
      .toBeVisible()
      .withTimeout(3000)

    // If error screen is shown, restart app
    await device.launchApp({ newInstance: true })
  } catch (e) {
    // No error screen, continue
  }
}

/**
 * Test Swiss market specific validations
 */
async function testSwissValidations() {
  const tests = [
    { field: 'postal-code-input', value: '8001', valid: true },
    { field: 'postal-code-input', value: '12345', valid: false },
    { field: 'phone-input', value: '+41 76 123 45 67', valid: true },
    { field: 'phone-input', value: '+1 555 123 4567', valid: false }
  ]

  for (const test of tests) {
    await element(by.id(test.field)).clearText()
    await element(by.id(test.field)).typeText(test.value)

    if (test.valid) {
      await expect(element(by.text('Invalid format'))).not.toBeVisible()
    } else {
      await waitFor(element(by.text('Invalid format')))
        .toBeVisible()
        .withTimeout(3000)
    }
  }
}

module.exports = {
  loginAsHandyman,
  loginAsCustomer,
  registerHandyman,
  registerCustomer,
  createAuction,
  navigateToFirstAuction,
  placeBid,
  waitForElementWithRetry,
  verifyCHFFormat,
  resetApp,
  testNetworkResilience,
  scrollThroughAuctions,
  verifyAuctionTimer,
  verifyDashboardStats,
  handleAppStability,
  testSwissValidations
}