# Detox E2E Testing Guide for Worky

## Overview

This directory contains comprehensive end-to-end tests for the Worky auction system using Detox. The tests cover the complete user journeys, Swiss market compliance, and performance scenarios.

## Test Structure

### Test Suites

1. **auction-workflow.test.js** - Core auction functionality
   - Authentication flows (handyman/customer registration & login)
   - Auction creation and validation
   - Real-time bidding system
   - Dashboard statistics
   - Error handling

2. **swiss-market.test.js** - Swiss market specific features
   - CHF currency formatting and validation
   - Swiss timezone handling
   - Regional compliance (cities, postal codes, phone formats)
   - Multi-language support (German/French service types)

3. **performance.test.js** - Performance and reliability tests
   - Real-time performance under load
   - Memory management during navigation
   - Network reliability and error recovery
   - Concurrent user simulation
   - App lifecycle management

### Helper Functions

**e2e/helpers/test-helpers.js** - Reusable test utilities
- Login/registration helpers
- Auction creation utilities
- Navigation helpers
- Validation functions
- Error handling utilities

## Running Tests

### Prerequisites

1. **Development Build Required**: Detox requires a development build of the app
   ```bash
   # iOS
   npm run build:ios

   # Android
   npm run build:android
   ```

2. **Simulator/Emulator Setup**:
   - iOS: iPhone 15 Simulator (configured in .detoxrc.js)
   - Android: Pixel_3a_API_30_x86 AVD (configurable)

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Build and test (full workflow)
npm run test:e2e:build && npm run test:e2e

# iOS specific
npm run test:e2e:ios

# Android specific
npm run test:e2e:android

# Individual test suites
npx detox test e2e/auction-workflow.test.js
npx detox test e2e/swiss-market.test.js
npx detox test e2e/performance.test.js
```

## Test Scenarios Covered

### 🔐 Authentication & User Management
- ✅ Handyman registration with business details
- ✅ Customer registration
- ✅ Login flows for both user types
- ✅ User type detection and routing
- ✅ Error handling for invalid credentials

### 🏷️ Auction Creation (Handyman)
- ✅ Complete auction creation flow
- ✅ Form validation (pricing, duration, regions)
- ✅ Swiss CHF minimum price enforcement (CHF 20)
- ✅ Duration limits (15-1440 minutes)
- ✅ Reserve price validation
- ✅ Auto-extend settings

### 💰 Real-time Bidding (Customer)
- ✅ Auction discovery and filtering
- ✅ Real-time bid placement
- ✅ Bid increment validation (CHF 5 increments)
- ✅ Outbid notifications
- ✅ Auction timer countdown
- ✅ Race condition handling

### 🇨🇭 Swiss Market Compliance
- ✅ CHF currency formatting throughout app
- ✅ Europe/Zurich timezone handling
- ✅ Swiss business hours validation
- ✅ Swiss postal code format (4 digits)
- ✅ Swiss phone number format (+41)
- ✅ Major Swiss cities acceptance
- ✅ German/French service type support

### 📊 Dashboard & Statistics
- ✅ Handyman dashboard with live stats
- ✅ Customer dashboard with available slots
- ✅ Revenue tracking in CHF
- ✅ Active bookings count
- ✅ Real-time data updates

### ⚡ Performance & Reliability
- ✅ Rapid bid updates without lag
- ✅ UI responsiveness during real-time updates
- ✅ Memory management during navigation
- ✅ Network error recovery
- ✅ Concurrent operations handling
- ✅ App backgrounding/foregrounding
- ✅ Large dataset scrolling performance

## Configuration

### Detox Configuration (.detoxrc.js)

```javascript
configurations: {
  'expo.ios.sim.debug': {
    device: 'simulator',
    app: 'expo.ios.debug'
  },
  'expo.android.emu.debug': {
    device: 'emulator',
    app: 'expo.android.debug'
  }
}
```

### Test Environment Setup

The tests expect certain elements to have `testID` attributes:
- `email-input`, `password-input` - Authentication forms
- `create-auction-button` - Main auction creation trigger
- `auction-title-input`, `starting-price-input` - Auction form fields
- `place-bid-button`, `bid-amount-input` - Bidding interface
- `auction-list`, `auction-card` - Auction discovery
- `auction-timer` - Countdown display

## Best Practices

### Test Writing Guidelines

1. **Wait Patterns**: Always use `waitFor()` with appropriate timeouts
2. **Element Selection**: Prefer `testID` over text matching for stability
3. **Data Cleanup**: Each test should be independent
4. **Error Handling**: Tests should handle network failures gracefully
5. **Swiss Compliance**: Include CHF and timezone validations

### Example Test Pattern

```javascript
it('should create auction with Swiss CHF validation', async () => {
  await loginAsHandyman()
  await element(by.id('create-auction-button')).tap()

  // Test Swiss minimum price
  await element(by.id('starting-price-input')).typeText('15')
  await waitFor(element(by.text('Minimum starting price is CHF 20')))
    .toBeVisible()
    .withTimeout(5000)

  // Fix and submit
  await element(by.id('starting-price-input')).clearText()
  await element(by.id('starting-price-input')).typeText('50')
  await element(by.id('create-auction-submit')).tap()

  await waitFor(element(by.text('Auction created')))
    .toBeVisible()
    .withTimeout(10000)
})
```

## Troubleshooting

### Common Issues

1. **App Build Failures**
   - Ensure Expo development build is created
   - Check iOS/Android build paths in .detoxrc.js
   - Verify simulator/emulator is running

2. **Test Timeouts**
   - Increase timeouts for slow CI environments
   - Check network connectivity for Supabase calls
   - Verify test data prerequisites

3. **Element Not Found**
   - Ensure testID attributes are added to components
   - Check if elements are conditionally rendered
   - Verify screen navigation is complete

4. **Flaky Tests**
   - Add proper wait conditions
   - Handle async operations correctly
   - Clean up test data between runs

### CI/CD Integration

For continuous integration, use:

```yaml
- name: Run E2E Tests
  run: |
    npm run build:android
    npm run test:e2e:android
```

## Test Coverage Summary

- **Unit Tests**: 18 test files covering services, hooks, components
- **E2E Tests**: 3 comprehensive test suites
- **Swiss Market**: 100% compliance testing
- **Real-time Features**: Complete bidding flow testing
- **Performance**: Load and reliability testing

## Next Steps

1. Add visual regression testing
2. Implement cross-platform test matrix
3. Add accessibility testing scenarios
4. Performance benchmarking automation
5. Test data factory for consistent scenarios

---

**Last Updated**: Phase 3 Testing Complete - Ready for Production Validation