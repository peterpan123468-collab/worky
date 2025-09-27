# Worky Testing Strategy

This document outlines the comprehensive testing strategy for the Worky mobile app, including unit tests, integration tests, end-to-end tests, and performance testing procedures.

## Table of Contents
1. [Testing Philosophy](#testing-philosophy)
2. [Testing Layers](#testing-layers)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Performance Testing](#performance-testing)
7. [Swiss Market Testing](#swiss-market-testing)
8. [Test Automation](#test-automation)

## Testing Philosophy

### Quality Goals
- 80%+ code coverage for critical business logic
- Zero critical bugs in production
- Fast feedback loops for developers
- Realistic test scenarios that mirror user behavior

### Testing Principles
- Test behavior, not implementation
- Write tests that are readable and maintainable
- Use realistic test data
- Automate repetitive testing tasks
- Continuously improve test suite

## Testing Layers

### Unit Tests (70%)
- Individual functions and components
- Business logic validation
- Utility function testing
- Mock external dependencies

### Integration Tests (20%)
- Service layer interactions
- Database function testing
- API endpoint validation
- Component integration

### End-to-End Tests (10%)
- Critical user journeys
- Cross-component workflows
- Real device testing
- Production-like environments

## Unit Testing

### Test Structure
```typescript
// Example unit test structure
describe('AuctionService', () => {
  describe('createAuction', () => {
    it('should create auction with valid data', async () => {
      // Arrange
      const mockData = { /* test data */ };
      
      // Act
      const result = await auctionService.createAuction(mockData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe(mockData.title);
    });
    
    it('should throw error for invalid data', async () => {
      // Arrange
      const invalidData = { /* invalid data */ };
      
      // Act & Assert
      await expect(auctionService.createAuction(invalidData))
        .rejects.toThrow('Validation error');
    });
  });
});
```

### Running Unit Tests
```bash
# Run all unit tests
npm test

# Run specific test file
npm test src/services/auction.service.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Code Coverage Requirements
- Services: 90%+ coverage
- Components: 80%+ coverage
- Utilities: 95%+ coverage
- Hooks: 85%+ coverage

## Integration Testing

### Supabase Function Testing
```typescript
// Test database functions
describe('place_auction_bid', () => {
  it('should place bid successfully', async () => {
    // Setup test auction
    const auction = await createTestAuction();
    
    // Place bid
    const result = await supabase.rpc('place_auction_bid', {
      p_auction_id: auction.id,
      p_bidder_id: 'test-user-id',
      p_bid_amount: 50.00
    });
    
    // Verify result
    expect(result.data.success).toBe(true);
    expect(result.data.bid_id).toBeDefined();
  });
});
```

### Service Integration Testing
```typescript
// Test service layer integration
describe('AuctionService Integration', () => {
  it('should fetch auctions with filters', async () => {
    // Create test data
    await createMultipleTestAuctions();
    
    // Test service method
    const activeAuctions = await auctionService.listAuctions({ status: 'active' });
    
    // Verify results
    expect(activeAuctions.length).toBeGreaterThan(0);
    expect(activeAuctions.every(a => a.status === 'active')).toBe(true);
  });
});
```

## End-to-End Testing

### Detox Configuration
```javascript
// detox.config.js
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.config.js',
  configurations: {
    'ios.sim.debug': {
      type: 'ios.simulator',
      binaryPath: 'bin/ios/Debug/app.app',
      device: {
        type: 'iPhone 12'
      }
    },
    'android.emu.debug': {
      type: 'android.emulator',
      binaryPath: 'bin/android/app-debug.apk',
      device: {
        avdName: 'Pixel_3a_API_30_x86'
      }
    }
  }
};
```

### E2E Test Examples
```javascript
// e2e/auction-workflow.test.js
describe('Auction Workflow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should allow customer to bid on auction', async () => {
    // Login as customer
    await element(by.id('email-input')).typeText('customer@test.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    // Navigate to auctions
    await element(by.id('browse-auctions-button')).tap();

    // Select first auction
    await element(by.id('auction-card')).atIndex(0).tap();

    // Place bid
    await element(by.id('bid-amount-input')).typeText('75');
    await element(by.id('place-bid-button')).tap();

    // Verify bid confirmation
    await expect(element(by.text('Bid placed successfully'))).toBeVisible();
  });
});
```

### Running E2E Tests
```bash
# Build app for testing
npm run test:e2e:build

# Run iOS tests
npm run test:e2e:ios

# Run Android tests
npm run test:e2e:android

# Run all E2E tests
npm run test:e2e
```

## Performance Testing

### Load Testing Auction Bidding
```javascript
// performance/bid-stress-test.js
describe('Auction Bidding Performance', () => {
  it('should handle 100 concurrent bids', async () => {
    const auctionId = await createTestAuction();
    const users = await createTestUsers(100);
    
    // Measure response times
    const startTime = Date.now();
    
    // Place concurrent bids
    const bidPromises = users.map((user, index) => {
      return supabase.rpc('place_auction_bid', {
        p_auction_id: auctionId,
        p_bidder_id: user.id,
        p_bid_amount: 50 + index * 5
      });
    });
    
    const results = await Promise.all(bidPromises);
    const endTime = Date.now();
    
    // Verify performance
    const totalTime = endTime - startTime;
    expect(totalTime).toBeLessThan(5000); // 5 seconds max
    expect(results.every(r => r.data.success)).toBe(true);
  });
});
```

### Memory Usage Testing
```bash
# Monitor memory usage during testing
npm run test:performance -- --monitor-memory
```

## Swiss Market Testing

### Currency Testing
```typescript
// Test CHF formatting
describe('Currency Formatting', () => {
  it('should format CHF correctly', () => {
    expect(formatCHF(1234.56)).toBe('CHF 1,234.56');
    expect(formatCHF(50)).toBe('CHF 50.00');
  });
});
```

### Timezone Testing
```typescript
// Test Swiss timezone handling
describe('Timezone Handling', () => {
  it('should display times in Europe/Zurich timezone', () => {
    const utcTime = '2025-01-15T10:00:00Z';
    const zurichTime = formatSwissDateTime(utcTime);
    expect(zurichTime).toBe('15.01.2025, 11:00'); // UTC+1 in winter
  });
});
```

### Business Hours Testing
```javascript
// Test business hours validation
describe('Business Hours', () => {
  it('should validate auction scheduling', async () => {
    // Weekend auction should be rejected
    const weekendAuction = {
      start_time: '2025-01-18T10:00:00Z', // Saturday
      end_time: '2025-01-18T12:00:00Z'
    };
    
    await expect(createAuction(weekendAuction))
      .rejects.toThrow('Auctions can only be scheduled during business hours');
  });
});
```

## Test Automation

### CI/CD Integration
```yaml
# GitHub Actions workflow
name: CI Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run unit tests
        run: npm run test:coverage
      - name: Run integration tests
        run: npm run test:integration
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

### Test Reporting
```bash
# Generate test reports
npm run test:report

# View coverage report
npm run test:coverage:view
```

### Test Maintenance
- Review and update tests with each feature change
- Remove obsolete tests
- Add new tests for edge cases
- Refactor tests for better readability