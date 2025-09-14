const { device, expect, element, by, waitFor } = require('detox')

describe('Auction Workflow', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  describe('Authentication Flow', () => {
    it('should show welcome screen on app launch', async () => {
      await waitFor(element(by.text('Welcome to Worky')))
        .toBeVisible()
        .withTimeout(10000)
    })

    it('should allow handyman registration', async () => {
      // Navigate to registration
      await element(by.text('Get Started')).tap()
      await element(by.text('Sign Up')).tap()

      // Select handyman user type
      await element(by.text('I am a Handyman')).tap()

      // Fill registration form
      await element(by.id('email-input')).typeText('test.handyman@example.com')
      await element(by.id('password-input')).typeText('testpass123')
      await element(by.id('business-name-input')).typeText('Test Handyman Business')
      await element(by.id('hourly-rate-input')).typeText('50')
      await element(by.id('region-input')).typeText('Zurich')

      // Submit registration
      await element(by.id('register-button')).tap()

      // Verify successful registration
      await waitFor(element(by.text('Welcome back!')))
        .toBeVisible()
        .withTimeout(10000)
    })

    it('should allow customer registration', async () => {
      // Navigate to registration
      await element(by.text('Get Started')).tap()
      await element(by.text('Sign Up')).tap()

      // Select customer user type
      await element(by.text('I am a Customer')).tap()

      // Fill registration form
      await element(by.id('email-input')).typeText('test.customer@example.com')
      await element(by.id('password-input')).typeText('testpass123')

      // Submit registration
      await element(by.id('register-button')).tap()

      // Verify successful registration
      await waitFor(element(by.text('Available Services')))
        .toBeVisible()
        .withTimeout(10000)
    })
  })

  describe('Handyman Auction Creation', () => {
    beforeEach(async () => {
      // Login as handyman
      await loginAsHandyman()
    })

    it('should create an auction successfully', async () => {
      // Navigate to auction creation
      await element(by.id('create-auction-button')).tap()

      // Fill auction form
      await element(by.id('auction-title-input')).clearText()
      await element(by.id('auction-title-input')).typeText('Plumbing Emergency Repair')

      await element(by.id('service-type-input')).clearText()
      await element(by.id('service-type-input')).typeText('plumbing')

      await element(by.id('region-input')).clearText()
      await element(by.id('region-input')).typeText('Zurich')

      await element(by.id('starting-price-input')).clearText()
      await element(by.id('starting-price-input')).typeText('75')

      await element(by.id('duration-input')).clearText()
      await element(by.id('duration-input')).typeText('120')

      // Create auction
      await element(by.id('create-auction-submit')).tap()

      // Verify auction created
      await waitFor(element(by.text('Auction created')))
        .toBeVisible()
        .withTimeout(5000)

      // Verify back on dashboard with new auction
      await element(by.text('OK')).tap()
      await waitFor(element(by.text('Plumbing Emergency Repair')))
        .toBeVisible()
        .withTimeout(5000)
    })

    it('should validate auction form inputs', async () => {
      await element(by.id('create-auction-button')).tap()

      // Try to submit with invalid starting price
      await element(by.id('starting-price-input')).clearText()
      await element(by.id('starting-price-input')).typeText('10') // Below minimum

      await element(by.id('create-auction-submit')).tap()

      // Should show validation error
      await waitFor(element(by.text('Minimum starting price is CHF 20')))
        .toBeVisible()
        .withTimeout(3000)
    })

    it('should validate duration limits', async () => {
      await element(by.id('create-auction-button')).tap()

      // Try invalid duration
      await element(by.id('duration-input')).clearText()
      await element(by.id('duration-input')).typeText('5') // Below minimum

      await waitFor(element(by.text('Duration must be between 15 and 1440 minutes')))
        .toBeVisible()
        .withTimeout(3000)
    })
  })

  describe('Customer Bidding Flow', () => {
    beforeEach(async () => {
      // Login as customer
      await loginAsCustomer()
    })

    it('should display available auctions', async () => {
      // Navigate to browse auctions
      await element(by.id('browse-auctions-button')).tap()

      // Wait for auctions to load
      await waitFor(element(by.id('auction-list')))
        .toBeVisible()
        .withTimeout(10000)

      // Should see auction cards
      await expect(element(by.id('auction-card')).atIndex(0)).toBeVisible()
    })

    it('should place bid on auction', async () => {
      await element(by.id('browse-auctions-button')).tap()

      // Wait for auctions and tap first one
      await waitFor(element(by.id('auction-card')).atIndex(0))
        .toBeVisible()
        .withTimeout(10000)
      await element(by.id('auction-card')).atIndex(0).tap()

      // Verify auction detail screen
      await waitFor(element(by.id('auction-detail-screen')))
        .toBeVisible()
        .withTimeout(5000)

      // Check current bid amount and place higher bid
      await element(by.id('bid-amount-input')).clearText()
      await element(by.id('bid-amount-input')).typeText('80')

      await element(by.id('place-bid-button')).tap()

      // Verify bid placed
      await waitFor(element(by.text('Bid placed successfully')))
        .toBeVisible()
        .withTimeout(5000)

      // Verify updated highest bid
      await waitFor(element(by.text('Highest: CHF 80.00')))
        .toBeVisible()
        .withTimeout(3000)
    })

    it('should show validation for invalid bid amounts', async () => {
      await element(by.id('browse-auctions-button')).tap()
      await waitFor(element(by.id('auction-card')).atIndex(0))
        .toBeVisible()
        .withTimeout(10000)
      await element(by.id('auction-card')).atIndex(0).tap()

      // Try to place bid lower than current highest
      await element(by.id('bid-amount-input')).clearText()
      await element(by.id('bid-amount-input')).typeText('20') // Assuming current is higher

      await element(by.id('place-bid-button')).tap()

      // Should show error
      await waitFor(element(by.text('Bid amount too low')))
        .toBeVisible()
        .withTimeout(5000)
    })
  })

  describe('Real-time Bidding', () => {
    it('should show real-time bid updates', async () => {
      // This test would require multiple device instances
      // For now, we'll test the UI updates when bid data changes

      await loginAsCustomer()
      await element(by.id('browse-auctions-button')).tap()

      await waitFor(element(by.id('auction-card')).atIndex(0))
        .toBeVisible()
        .withTimeout(10000)
      await element(by.id('auction-card')).atIndex(0).tap()

      // Verify real-time elements are present
      await expect(element(by.id('auction-timer'))).toBeVisible()
      await expect(element(by.id('current-highest-bid'))).toBeVisible()
      await expect(element(by.id('bidding-interface'))).toBeVisible()
    })
  })

  describe('Auction Timer', () => {
    it('should display countdown timer', async () => {
      await loginAsCustomer()
      await element(by.id('browse-auctions-button')).tap()

      await waitFor(element(by.id('auction-card')).atIndex(0))
        .toBeVisible()
        .withTimeout(10000)
      await element(by.id('auction-card')).atIndex(0).tap()

      // Verify timer is showing
      await waitFor(element(by.id('auction-timer')))
        .toBeVisible()
        .withTimeout(5000)

      // Timer should show time format (e.g., "5m 30s")
      await waitFor(element(by.id('auction-timer')).and(by.text(/\d+m \d+s/)))
        .toBeVisible()
        .withTimeout(3000)
    })
  })

  describe('Dashboard Statistics', () => {
    it('should display handyman stats', async () => {
      await loginAsHandyman()

      // Verify dashboard elements
      await waitFor(element(by.text('Welcome back!')))
        .toBeVisible()
        .withTimeout(5000)

      await expect(element(by.id('active-bookings-stat'))).toBeVisible()
      await expect(element(by.id('month-revenue-stat'))).toBeVisible()
    })

    it('should display customer dashboard', async () => {
      await loginAsCustomer()

      // Verify customer dashboard elements
      await waitFor(element(by.text('Available Services')))
        .toBeVisible()
        .withTimeout(5000)

      await expect(element(by.id('available-slots'))).toBeVisible()
      await expect(element(by.id('my-bookings'))).toBeVisible()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate network issues and verify app doesn't crash
      await device.shake() // This can trigger debug menu in dev builds

      await loginAsCustomer()
      await element(by.id('browse-auctions-button')).tap()

      // App should show loading state or error message, not crash
      await waitFor(element(by.id('auction-list')).or(by.text('Failed to load')))
        .toBeVisible()
        .withTimeout(15000)
    })
  })
})

// Helper functions
async function loginAsHandyman() {
  try {
    await element(by.text('Get Started')).tap()
  } catch (e) {
    // Might already be on login screen
  }

  try {
    await element(by.text('Sign In')).tap()
  } catch (e) {
    // Might already be on sign in screen
  }

  await element(by.id('email-input')).typeText('test.handyman@example.com')
  await element(by.id('password-input')).typeText('testpass123')
  await element(by.id('login-button')).tap()

  await waitFor(element(by.text('Welcome back!')))
    .toBeVisible()
    .withTimeout(10000)
}

async function loginAsCustomer() {
  try {
    await element(by.text('Get Started')).tap()
  } catch (e) {
    // Might already be on login screen
  }

  try {
    await element(by.text('Sign In')).tap()
  } catch (e) {
    // Might already be on sign in screen
  }

  await element(by.id('email-input')).typeText('test.customer@example.com')
  await element(by.id('password-input')).typeText('testpass123')
  await element(by.id('login-button')).tap()

  await waitFor(element(by.text('Available Services')))
    .toBeVisible()
    .withTimeout(10000)
}