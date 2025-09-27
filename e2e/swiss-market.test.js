const { device, expect, element, by, waitFor } = require('detox')

describe('Swiss Market Features', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  describe('CHF Currency Handling', () => {
    beforeEach(async () => {
      await loginAsHandyman()
    })

    it('should display CHF currency formatting correctly', async () => {
      await element(by.id('create-auction-button')).tap()

      // Input a price and verify CHF formatting
      await element(by.id('starting-price-input')).clearText()
      await element(by.id('starting-price-input')).typeText('75')

      // Should show formatted CHF
      await waitFor(element(by.text('CHF 75.00')))
        .toBeVisible()
        .withTimeout(3000)
    })

    it('should enforce CHF minimum price (20 CHF)', async () => {
      await element(by.id('create-auction-button')).tap()

      // Try price below minimum
      await element(by.id('starting-price-input')).clearText()
      await element(by.id('starting-price-input')).typeText('15')

      // Should show minimum price error
      await waitFor(element(by.text('Minimum starting price is CHF 20')))
        .toBeVisible()
        .withTimeout(3000)
    })

    it('should enforce CHF 5 bid increments', async () => {
      await loginAsCustomer()
      await element(by.id('browse-auctions-button')).tap()

      await waitFor(element(by.id('auction-card')).atIndex(0))
        .toBeVisible()
        .withTimeout(10000)
      await element(by.id('auction-card')).atIndex(0).tap()

      // Try invalid increment (not multiple of 5)
      await element(by.id('bid-amount-input')).clearText()
      await element(by.id('bid-amount-input')).typeText('77') // Not divisible by 5

      await element(by.id('place-bid-button')).tap()

      // Should validate bid increment
      await waitFor(element(by.text('Bid must be in CHF 5 increments')))
        .toBeVisible()
        .withTimeout(5000)
    })

    it('should display revenue in CHF format on dashboard', async () => {
      await loginAsHandyman()

      // Revenue should be displayed with CHF formatting
      await waitFor(element(by.id('month-revenue-stat')))
        .toBeVisible()
        .withTimeout(5000)

      // Should contain CHF prefix
      await expect(element(by.text(/CHF \d+\.\d{2}/))).toBeVisible()
    })
  })

  describe('Swiss Timezone Handling', () => {
    beforeEach(async () => {
      await loginAsHandyman()
    })

    it('should display times in Swiss format', async () => {
      await element(by.id('create-auction-button')).tap()

      // Should show start and end times in Swiss format
      // Times should be displayed in Europe/Zurich timezone
      await waitFor(element(by.text(/Start:.*\d{2}:\d{2}/)))
        .toBeVisible()
        .withTimeout(3000)

      await waitFor(element(by.text(/End:.*\d{2}:\d{2}/)))
        .toBeVisible()
        .withTimeout(3000)
    })

    it('should allow auction creation at any time', async () => {
      await element(by.id('create-auction-button')).tap()

      // Duration input
      await element(by.id('duration-input')).clearText()
      await element(by.id('duration-input')).typeText('480') // 8 hours

      // Should allow auction creation without business hours restrictions
      await element(by.id('create-auction-submit')).tap()

      // Should succeed in creating auction
      await waitFor(element(by.text('Auction created')))
        .toBeVisible()
        .withTimeout(5000)
    })
  })

  describe('Swiss Market Regions', () => {
    beforeEach(async () => {
      await loginAsHandyman()
    })

    it('should accept major Swiss cities', async () => {
      await element(by.id('create-auction-button')).tap()

      const swissCities = ['Zurich', 'Basel', 'Geneva', 'Bern', 'Lausanne']

      for (const city of swissCities) {
        await element(by.id('region-input')).clearText()
        await element(by.id('region-input')).typeText(city)

        // Verify city is accepted (no validation error)
        await expect(element(by.text('Invalid region'))).not.toBeVisible()
      }
    })
  })

  describe('Swiss Language Support', () => {
    it('should handle German service types', async () => {
      await loginAsHandyman()
      await element(by.id('create-auction-button')).tap()

      // Test German service types
      const germanServices = ['Installateur', 'Elektriker', 'Maler', 'Schreiner']

      for (const service of germanServices) {
        await element(by.id('service-type-input')).clearText()
        await element(by.id('service-type-input')).typeText(service)

        // Should accept German service types
        await expect(element(by.text('Invalid service type'))).not.toBeVisible()
      }
    })

    it('should handle French service types', async () => {
      await loginAsHandyman()
      await element(by.id('create-auction-button')).tap()

      // Test French service types
      const frenchServices = ['Plombier', 'Électricien', 'Peintre', 'Menuisier']

      for (const service of frenchServices) {
        await element(by.id('service-type-input')).clearText()
        await element(by.id('service-type-input')).typeText(service)

        // Should accept French service types
        await expect(element(by.text('Invalid service type'))).not.toBeVisible()
      }
    })
  })

  describe('Swiss Market Compliance', () => {
    it('should display proper Swiss contact information format', async () => {
      // Register with Swiss phone format
      await element(by.text('Get Started')).tap()
      await element(by.text('Sign Up')).tap()
      await element(by.text('I am a Handyman')).tap()

      await element(by.id('phone-input')).typeText('+41 76 123 45 67')

      // Should accept Swiss phone format
      await expect(element(by.text('Invalid phone format'))).not.toBeVisible()
    })

    it('should handle Swiss postal codes', async () => {
      await loginAsHandyman()
      await element(by.id('create-auction-button')).tap()

      // Test Swiss postal code format (4 digits)
      await element(by.id('postal-code-input')).typeText('8001') // Zurich

      // Should accept Swiss postal code format
      await expect(element(by.text('Invalid postal code'))).not.toBeVisible()
    })
  })

  describe('Currency Conversion Display', () => {
    it('should show consistent CHF formatting across screens', async () => {
      await loginAsCustomer()

      // Check auction list
      await element(by.id('browse-auctions-button')).tap()
      await waitFor(element(by.id('auction-card')).atIndex(0))
        .toBeVisible()
        .withTimeout(10000)

      // All prices should use CHF format
      await expect(element(by.text(/CHF \d+\.\d{2}/))).toBeVisible()

      // Navigate to auction detail
      await element(by.id('auction-card')).atIndex(0).tap()

      // Detail screen should also show CHF formatting
      await waitFor(element(by.text(/Starting: CHF \d+\.\d{2}/)))
        .toBeVisible()
        .withTimeout(5000)
    })
  })
})

// Helper function
async function loginAsHandyman() {
  try {
    await element(by.text('Get Started')).tap()
    await element(by.text('Sign In')).tap()
  } catch (e) {
    // Already on login screen
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
    await element(by.text('Sign In')).tap()
  } catch (e) {
    // Already on login screen
  }

  await element(by.id('email-input')).typeText('test.customer@example.com')
  await element(by.id('password-input')).typeText('testpass123')
  await element(by.id('login-button')).tap()

  await waitFor(element(by.text('Available Services')))
    .toBeVisible()
    .withTimeout(10000)
}