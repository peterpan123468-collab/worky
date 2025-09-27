# Testing Standards & Requirements

## Test Structure (MANDATORY)
```typescript
// Component test template
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { AuctionCard } from '../AuctionCard'

describe('AuctionCard', () => {
  const mockAuction = {
    id: '1',
    title: 'Test Auction',
    current_bid: 25.00,
    currency: 'CHF'
  }

  it('displays auction information correctly', () => {
    render(<AuctionCard auction={mockAuction} />)
    
    expect(screen.getByText('Test Auction')).toBeTruthy()
    expect(screen.getByText('CHF 25.00')).toBeTruthy()
  })

  it('handles bid interaction', () => {
    const mockOnBid = jest.fn()
    render(<AuctionCard auction={mockAuction} onBid={mockOnBid} />)
    
    fireEvent.press(screen.getByText('Place Bid'))
    expect(mockOnBid).toHaveBeenCalledWith(mockAuction.id)
  })
})
```

## Service Testing
```typescript
// Service test template
import { AuctionService } from '../auction.service'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase')

describe('AuctionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates auction successfully', async () => {
    const mockAuction = { title: 'Test', starting_bid: 20 }
    supabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: '1', ...mockAuction },
            error: null
          })
        })
      })
    })

    const result = await AuctionService.createAuction(mockAuction)
    expect(result.id).toBe('1')
  })
})
```

## Hook Testing
```typescript
// Hook test template
import { renderHook, waitFor } from '@testing-library/react-native'
import { useAuctionData } from '../useAuctionData'

describe('useAuctionData', () => {
  it('loads auction data', async () => {
    const { result } = renderHook(() => useAuctionData('1'))
    
    expect(result.current.loading).toBe(true)
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.data).toBeTruthy()
    })
  })
})
```

## E2E Testing (Detox)
```javascript
// E2E test template
describe('Auction Flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('should create and bid on auction', async () => {
    // Navigate to create auction
    await element(by.id('create-auction-button')).tap()
    
    // Fill form
    await element(by.id('auction-title-input')).typeText('Test Service')
    await element(by.id('starting-bid-input')).typeText('25')
    
    // Submit
    await element(by.id('create-auction-submit')).tap()
    
    // Verify creation
    await expect(element(by.text('Test Service'))).toBeVisible()
  })
})
```

## Test Requirements
- **Coverage**: Minimum 80% for services and hooks
- **Components**: Test user interactions and prop handling
- **Services**: Test success/error scenarios
- **Integration**: Test auth flows and real-time updates
- **E2E**: Test critical user journeys

## Mock Patterns
```typescript
// Supabase mock
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn()
    }
  }
}))

// Navigation mock
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn()
  })
}))
```

## Test Commands
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:e2e:build     # Build E2E tests
npm run test:e2e:ios       # Run E2E on iOS
```