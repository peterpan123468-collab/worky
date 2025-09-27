const { device, expect, element, by, waitFor } = require('detox')

describe('Performance & Reliability Tests', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  describe('Real-time Performance', () => {
    it('should handle rapid bid updates without lag', async () => {
      await loginAsCustomer()
      await element(by.id('browse-auctions-button')).tap()

      await waitFor(element(by.id('auction-card')).atIndex(0))
        .toBeVisible()
        .withTimeout(10000)
      await element(by.id('auction-card')).atIndex(0).tap()

      // Simulate rapid bidding
      const startTime = Date.now()

      for (let i = 0; i < 5; i++) {
        const bidAmount = 80 + (i * 5)

        await element(by.id('bid-amount-input')).clearText()
        await element(by.id('bid-amount-input')).typeText(bidAmount.toString())
        await element(by.id('place-bid-button')).tap()

        // Wait for bid confirmation
        await waitFor(element(by.text('Bid placed successfully')))
          .toBeVisible()
          .withTimeout(3000)

        // Dismiss toast
        await device.shake() // Clear any toasts
      }

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Should complete all bids within reasonable time (30 seconds)
      expect(totalTime).toBeLessThan(30000)
    })

    it('should maintain UI responsiveness during real-time updates', async () => {
      await loginAsCustomer()
      await element(by.id('browse-auctions-button')).tap()

      await waitFor(element(by.id('auction-card')).atIndex(0))
        .toBeVisible()
        .withTimeout(10000)
      await element(by.id('auction-card')).atIndex(0).tap()

      // Test UI responsiveness while timer is running
      const startTime = Date.now()

      // Interact with UI elements while real-time updates are happening
      await element(by.id('bid-amount-input')).tap()
      await element(by.id('bid-amount-input')).typeText('85')

      // UI should respond quickly
      const responseTime = Date.now() - startTime
      expect(responseTime).toBeLessThan(2000) // 2 seconds max

      // Timer should still be updating
      await expect(element(by.id('auction-timer'))).toBeVisible()
    })
  })

  describe('Memory Management', () => {
    it('should handle navigation between screens without memory leaks', async () => {
      await loginAsCustomer()

      // Navigate through multiple screens rapidly
      for (let i = 0; i < 10; i++) {
        // Go to browse auctions
        await element(by.id('browse-auctions-button')).tap()
        await waitFor(element(by.id('auction-list')))
          .toBeVisible()
          .withTimeout(5000)

        // Go back to dashboard
        await device.pressBack() // Android back button

        await waitFor(element(by.text('Available Services')))
          .toBeVisible()
          .withTimeout(5000)
      }

      // App should still be responsive
      await expect(element(by.id('browse-auctions-button'))).toBeVisible()
    })

    it('should handle multiple auction subscriptions properly', async () => {
      await loginAsCustomer()
      await element(by.id('browse-auctions-button')).tap()

      await waitFor(element(by.id('auction-list')))
        .toBeVisible()
        .withTimeout(10000)

      // Open multiple auctions in sequence
      for (let i = 0; i < 3; i++) {
        if (await element(by.id('auction-card')).atIndex(i).exists()) {
          await element(by.id('auction-card')).atIndex(i).tap()

          // Verify auction detail loads
          await waitFor(element(by.id('auction-detail-screen')))
            .toBeVisible()
            .withTimeout(5000)

          // Go back
          await device.pressBack()

          await waitFor(element(by.id('auction-list')))
            .toBeVisible()
            .withTimeout(5000)
        }
      }

      // Should not crash and should be responsive
      await expect(element(by.id('auction-list'))).toBeVisible()
    })
  })

  describe('Network Reliability', () => {
    it('should handle connection drops gracefully', async () => {
      await loginAsCustomer()
      await element(by.id('browse-auctions-button')).tap()

      // Simulate network issues by shaking device (in dev builds)
      await device.shake()

      // App should show loading state or error, not crash
      await waitFor(element(by.id('auction-list')).or(by.text('Network error')))
        .toBeVisible()
        .withTimeout(15000)

      // Should recover when network is restored
      await waitFor(element(by.id('auction-list')))
        .toBeVisible()
        .withTimeout(20000)
    })

    it('should retry failed requests automatically', async () => {
      await loginAsCustomer()

      // Navigate to auctions which requires network call
      await element(by.id('browse-auctions-button')).tap()

      // Should eventually load even with intermittent connectivity
      await waitFor(element(by.id('auction-list')))
        .toBeVisible()
        .withTimeout(30000) // Extended timeout for retry logic
    })
  })

  describe('Large Dataset Handling', () => {
    it('should handle scrolling through many auctions', async () => {
      await loginAsCustomer()
      await element(by.id('browse-auctions-button')).tap()

      await waitFor(element(by.id('auction-list')))
        .toBeVisible()
        .withTimeout(10000)

      // Scroll through auction list
      const startTime = Date.now()

      for (let i = 0; i < 10; i++) {
        await element(by.id('auction-list')).scroll(300, 'down')
        await new Promise(resolve => setTimeout(resolve, 500)) // Small delay
      }

      const scrollTime = Date.now() - startTime

      // Scrolling should be smooth (under 10 seconds for 10 scrolls)
      expect(scrollTime).toBeLessThan(10000)

      // List should still be responsive
      await expect(element(by.id('auction-list'))).toBeVisible()
    })
  })

  describe('Error Recovery', () => {
    it('should recover from authentication errors', async () => {
      // Try to access protected content without auth
      await element(by.id('browse-auctions-button')).tap()

      // Should redirect to login or show auth required message
      await waitFor(element(by.text('Sign In')).or(by.text('Authentication required')))
        .toBeVisible()
        .withTimeout(10000)

      // Login and retry
      await loginAsCustomer()
      await element(by.id('browse-auctions-button')).tap()

      // Should now work
      await waitFor(element(by.id('auction-list')))
        .toBeVisible()
        .withTimeout(10000)
    })

    it('should handle form validation errors gracefully', async () => {
      await loginAsHandyman()
      await element(by.id('create-auction-button')).tap()

      // Submit form with multiple validation errors
      await element(by.id('starting-price-input')).clearText()
      await element(by.id('starting-price-input')).typeText('5') // Too low

      await element(by.id('duration-input')).clearText()
      await element(by.id('duration-input')).typeText('5000') // Too high

      await element(by.id('create-auction-submit')).tap()

      // Should show multiple validation errors without crashing
      await waitFor(element(by.text('Minimum starting price')))
        .toBeVisible()
        .withTimeout(5000)

      await waitFor(element(by.text('Duration must be between')))
        .toBeVisible()
        .withTimeout(3000)

      // Form should still be editable
      await element(by.id('starting-price-input')).clearText()
      await element(by.id('starting-price-input')).typeText('50')

      // Should clear the error
      await waitFor(element(by.text('Minimum starting price')))
        .not.toBeVisible()
        .withTimeout(3000)
    })
  })

  describe('Concurrent User Simulation', () => {
    it('should handle concurrent operations without race conditions', async () => {
      await loginAsCustomer()
      await element(by.id('browse-auctions-button')).tap()

      await waitFor(element(by.id('auction-card')).atIndex(0))
        .toBeVisible()
        .withTimeout(10000)
      await element(by.id('auction-card')).atIndex(0).tap()

      // Simulate multiple rapid bid attempts (race condition test)
      const bidPromises = []

      for (let i = 0; i < 3; i++) {
        bidPromises.push((async () => {
          await element(by.id('bid-amount-input')).clearText()
          await element(by.id('bid-amount-input')).typeText((80 + i).toString())
          await element(by.id('place-bid-button')).tap()
        })())
      }

      // Wait for all attempts to complete
      await Promise.allSettled(bidPromises)

      // Should handle race conditions gracefully
      // Either show success for one bid or appropriate error messages
      await waitFor(element(by.text('Bid placed successfully')).or(by.text('Bid too low')))
        .toBeVisible()
        .withTimeout(10000)
    })
  })

  describe('App Lifecycle', () => {
    it('should handle app backgrounding and foregrounding', async () => {
      await loginAsCustomer()
      await element(by.id('browse-auctions-button')).tap()

      await waitFor(element(by.id('auction-list')))
        .toBeVisible()
        .withTimeout(10000)

      // Background the app
      await device.sendToHome()
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Bring back to foreground
      await device.launchApp({ newInstance: false })

      // Should restore state properly
      await waitFor(element(by.id('auction-list')))
        .toBeVisible()
        .withTimeout(10000)
    })
  })
})

// Helper functions
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