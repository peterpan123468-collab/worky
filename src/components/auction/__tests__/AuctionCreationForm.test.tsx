import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { AuctionCreationForm } from '../AuctionCreationForm'
import { useAuth } from '../../../contexts/AuthContext'
import { auctionService } from '../../../services/auction.service'
import { CHF_MINIMUM, CHF_INCREMENT } from '../../../utils/currency'

// Mock dependencies
jest.mock('../../../contexts/AuthContext')
jest.mock('../../../services/auction.service')
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn()
}))
jest.mock('../../ui/card', () => ({
  Card: ({ children, style }: any) => <div style={style}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>
}))
jest.mock('../../ui/button', () => ({
  Button: ({ children, onPress, disabled }: any) => (
    <button onPress={onPress} disabled={disabled} testID="create-button">
      {children}
    </button>
  )
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockAuctionService = auctionService as jest.Mocked<typeof auctionService>
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>

describe('AuctionCreationForm', () => {
  const defaultUser = {
    id: 'handyman-1',
    email: 'handyman@example.com',
    user_type: 'handyman' as const
  }

  const mockCreatedAuction = {
    id: 'auction-123',
    handyman_id: 'handyman-1',
    title: 'Test Service',
    service_type: 'handyman',
    region: 'Zurich',
    starting_price: 50,
    status: 'active' as const
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseAuth.mockReturnValue({
      user: defaultUser,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    })

    mockAuctionService.createAuction.mockResolvedValue(mockCreatedAuction as any)
  })

  it('renders with default values', () => {
    const { getByDisplayValue, getByText } = render(<AuctionCreationForm />)

    expect(getByText('Create Auction')).toBeTruthy()
    expect(getByDisplayValue('General Handyman Service')).toBeTruthy()
    expect(getByDisplayValue('handyman')).toBeTruthy()
    expect(getByDisplayValue('Zurich')).toBeTruthy()
    expect(getByDisplayValue(String(CHF_MINIMUM))).toBeTruthy()
    expect(getByDisplayValue('60')).toBeTruthy() // Default duration
  })

  it('allows editing all form fields', () => {
    const { getByDisplayValue } = render(<AuctionCreationForm />)

    // Update title
    const titleInput = getByDisplayValue('General Handyman Service')
    fireEvent.changeText(titleInput, 'Plumbing Service')
    expect(getByDisplayValue('Plumbing Service')).toBeTruthy()

    // Update service type
    const serviceInput = getByDisplayValue('handyman')
    fireEvent.changeText(serviceInput, 'plumbing')
    expect(getByDisplayValue('plumbing')).toBeTruthy()

    // Update region
    const regionInput = getByDisplayValue('Zurich')
    fireEvent.changeText(regionInput, 'Basel')
    expect(getByDisplayValue('Basel')).toBeTruthy()

    // Update starting price
    const priceInput = getByDisplayValue(String(CHF_MINIMUM))
    fireEvent.changeText(priceInput, '50')
    expect(getByDisplayValue('50')).toBeTruthy()

    // Update duration
    const durationInput = getByDisplayValue('60')
    fireEvent.changeText(durationInput, '120')
    expect(getByDisplayValue('120')).toBeTruthy()
  })

  it('validates starting price minimum', () => {
    const { getByDisplayValue, getByText } = render(<AuctionCreationForm />)

    const priceInput = getByDisplayValue(String(CHF_MINIMUM))
    fireEvent.changeText(priceInput, '10') // Below minimum

    expect(getByText(`Minimum starting price is CHF ${CHF_MINIMUM}`)).toBeTruthy()
  })

  it('validates duration range', () => {
    const { getByDisplayValue, getByText } = render(<AuctionCreationForm />)

    const durationInput = getByDisplayValue('60')

    // Test too short duration
    fireEvent.changeText(durationInput, '10')
    expect(getByText('Duration must be between 15 and 1440 minutes')).toBeTruthy()

    // Test too long duration
    fireEvent.changeText(durationInput, '2000')
    expect(getByText('Duration must be between 15 and 1440 minutes')).toBeTruthy()
  })

  it('validates reserve price vs starting price', () => {
    const { getByDisplayValue, getByText } = render(<AuctionCreationForm />)

    // Set starting price to 50
    const priceInput = getByDisplayValue(String(CHF_MINIMUM))
    fireEvent.changeText(priceInput, '50')

    // Set reserve price below starting price
    const reserveInput = getByDisplayValue('') // Reserve price starts empty
    fireEvent.changeText(reserveInput, '30')

    expect(getByText('Reserve price must be >= starting price')).toBeTruthy()
  })

  it('validates auto-extend minutes range when enabled', () => {
    const { getByDisplayValue, getByText } = render(<AuctionCreationForm />)

    // Auto-extend should be enabled by default
    const autoExtendInput = getByDisplayValue('2')

    // Test invalid range
    fireEvent.changeText(autoExtendInput, '15') // Above maximum
    expect(getByText('Auto-extend must be between 1 and 10 minutes')).toBeTruthy()

    fireEvent.changeText(autoExtendInput, '0') // Below minimum
    expect(getByText('Auto-extend must be between 1 and 10 minutes')).toBeTruthy()
  })

  it('disables create button when form is invalid', () => {
    const { getByDisplayValue, getByTestId } = render(<AuctionCreationForm />)

    // Set invalid starting price
    const priceInput = getByDisplayValue(String(CHF_MINIMUM))
    fireEvent.changeText(priceInput, '10')

    const createButton = getByTestId('create-button')
    expect(createButton.props.disabled).toBe(true)
  })

  it('enables create button when form is valid', () => {
    const { getByTestId } = render(<AuctionCreationForm />)

    const createButton = getByTestId('create-button')
    expect(createButton.props.disabled).toBe(false)
  })

  it('creates auction successfully with valid data', async () => {
    const mockOnCreated = jest.fn()
    const { getByTestId } = render(<AuctionCreationForm onCreated={mockOnCreated} />)

    const createButton = getByTestId('create-button')
    fireEvent.press(createButton)

    await waitFor(() => {
      expect(mockAuctionService.createAuction).toHaveBeenCalledWith(
        'handyman-1',
        expect.objectContaining({
          title: 'General Handyman Service',
          service_type: 'handyman',
          region: 'Zurich',
          starting_price: CHF_MINIMUM,
          bid_increment: CHF_INCREMENT,
          auto_extend: true,
          auto_extend_minutes: 2
        })
      )
    })

    expect(mockOnCreated).toHaveBeenCalledWith('auction-123')
    expect(mockAlert).toHaveBeenCalledWith('Auction created', '#auction-123')
  })

  it('creates auction without auto-extend when disabled', async () => {
    const { getByTestId } = render(<AuctionCreationForm />)

    // Disable auto-extend
    const autoExtendSwitch = getByTestId('auto-extend-switch')
    fireEvent(autoExtendSwitch, 'onValueChange', false)

    const createButton = getByTestId('create-button')
    fireEvent.press(createButton)

    await waitFor(() => {
      expect(mockAuctionService.createAuction).toHaveBeenCalledWith(
        'handyman-1',
        expect.objectContaining({
          auto_extend: false,
          auto_extend_minutes: null
        })
      )
    })
  })

  it('handles creation error gracefully', async () => {
    mockAuctionService.createAuction.mockRejectedValue(new Error('Database error'))

    const { getByTestId } = render(<AuctionCreationForm />)

    const createButton = getByTestId('create-button')
    fireEvent.press(createButton)

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Error', 'Database error')
    })
  })

  it('handles non-error exceptions', async () => {
    mockAuctionService.createAuction.mockRejectedValue('String error')

    const { getByTestId } = render(<AuctionCreationForm />)

    const createButton = getByTestId('create-button')
    fireEvent.press(createButton)

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to create auction')
    })
  })

  it('prevents creation when user is not logged in', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    })

    const { getByTestId } = render(<AuctionCreationForm />)

    const createButton = getByTestId('create-button')
    fireEvent.press(createButton)

    expect(mockAlert).toHaveBeenCalledWith('Not signed in')
    expect(mockAuctionService.createAuction).not.toHaveBeenCalled()
  })

  it('shows submitting state during creation', async () => {
    let resolveCreate: (value: any) => void
    mockAuctionService.createAuction.mockImplementation(
      () => new Promise(resolve => { resolveCreate = resolve })
    )

    const { getByTestId, getByText } = render(<AuctionCreationForm />)

    const createButton = getByTestId('create-button')
    fireEvent.press(createButton)

    // Should show submitting state
    expect(getByText('Creating...')).toBeTruthy()
    expect(createButton.props.disabled).toBe(true)

    // Resolve the promise
    resolveCreate!(mockCreatedAuction)

    await waitFor(() => {
      expect(getByText('Create Auction')).toBeTruthy() // Back to normal state
    })
  })

  it('handles numeric input parsing for prices', () => {
    const { getByDisplayValue } = render(<AuctionCreationForm />)

    const priceInput = getByDisplayValue(String(CHF_MINIMUM))

    // Test empty input
    fireEvent.changeText(priceInput, '')
    expect(getByDisplayValue('0')).toBeTruthy()

    // Test non-numeric input
    fireEvent.changeText(priceInput, 'abc')
    expect(getByDisplayValue('0')).toBeTruthy()

    // Test decimal input (should convert to integer)
    fireEvent.changeText(priceInput, '50.5')
    expect(getByDisplayValue('50')).toBeTruthy()
  })

  it('sanitizes starting price before submission', async () => {
    const { getByDisplayValue, getByTestId } = render(<AuctionCreationForm />)

    // Set price below minimum
    const priceInput = getByDisplayValue(String(CHF_MINIMUM))
    fireEvent.changeText(priceInput, '10')

    const createButton = getByTestId('create-button')
    fireEvent.press(createButton)

    await waitFor(() => {
      expect(mockAuctionService.createAuction).toHaveBeenCalledWith(
        'handyman-1',
        expect.objectContaining({
          starting_price: CHF_MINIMUM // Should be sanitized to minimum
        })
      )
    })
  })

  it('displays formatted price hint', () => {
    const { getByDisplayValue, getByText } = render(<AuctionCreationForm />)

    const priceInput = getByDisplayValue(String(CHF_MINIMUM))
    fireEvent.changeText(priceInput, '75')

    expect(getByText(`CHF 75.00 (min CHF ${CHF_MINIMUM})`)).toBeTruthy()
  })

  it('shows start and end times in Swiss format', () => {
    const { getByText } = render(<AuctionCreationForm />)

    // Should display formatted times (the exact format depends on the timezone utils)
    // This test verifies that the time display elements are present
    const timeDisplay = getByText(/Start:.*End:/)
    expect(timeDisplay).toBeTruthy()
  })
})