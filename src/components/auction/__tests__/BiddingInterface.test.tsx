import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { BiddingInterface } from '../BiddingInterface'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import { useBidding } from '../../../hooks/useBidding'

// Mock the dependencies
jest.mock('../../../contexts/AuthContext')
jest.mock('../../../contexts/ToastContext')
jest.mock('../../../hooks/useBidding')
jest.mock('../../ui/button', () => ({
  Button: ({ children, onPress, disabled, style, testID }: any) => (
    <button
      onClick={onPress}
      disabled={disabled}
      style={style}
      testID={testID || 'bid-button'}
    >
      {children}
    </button>
  )
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>
const mockUseBidding = useBidding as jest.MockedFunction<typeof useBidding>

describe('BiddingInterface', () => {
  const mockShow = jest.fn()
  const mockPlaceBid = jest.fn()

  const defaultProps = {
    auctionId: 'auction-1',
    currentHighest: 50,
    disabled: false
  }

  const defaultUser = {
    id: 'user-1',
    email: 'test@example.com',
    user_type: 'customer' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseAuth.mockReturnValue({
      user: defaultUser,
      userType: 'customer',
      authState: 'authenticated',
      isAuthenticated: true,
      isLoading: false,
      error: null,
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      clearError: jest.fn(),
      setUserType: jest.fn(),
      logout: jest.fn()
    } as any)

    mockUseToast.mockReturnValue({
      show: mockShow
    })

    mockUseBidding.mockReturnValue({
      highestBid: 50,
      placeBid: mockPlaceBid,
      placing: false,
      error: null,
      bids: [],
      currentUserBid: null
    })
  })

  it('renders correctly with default values', () => {
    const { getByDisplayValue, getByText, getByTestId } = render(<BiddingInterface {...defaultProps} />)

    expect(getByDisplayValue('55.00')).toBeTruthy()
    expect(getByText('Your bid (CHF)')).toBeTruthy()
    const button = getByTestId('place-bid-button')
    expect(button).toBeTruthy()
    expect(button.props.children).toContain('Place Bid')
    expect(getByText('Highest (CHF)')).toBeTruthy()
    expect(getByText('50.00')).toBeTruthy()
  })

  it('uses highest bid from hook when available', () => {
    mockUseBidding.mockReturnValue({
      highestBid: 65,
      placeBid: mockPlaceBid,
      placing: false,
      error: null,
      bids: [],
      currentUserBid: null
    })

    const { getByText } = render(<BiddingInterface {...defaultProps} />)

    expect(getByText('Highest (CHF)')).toBeTruthy()
    expect(getByText('65.00')).toBeTruthy()
  })

  it('allows user to change bid amount', () => {
    const { getByDisplayValue } = render(<BiddingInterface {...defaultProps} />)

    const input = getByDisplayValue('55.00')
    fireEvent.changeText(input, '75')

    expect(getByDisplayValue('75.00')).toBeTruthy()
  })

  it('handles empty input gracefully', () => {
    const { getByDisplayValue } = render(<BiddingInterface {...defaultProps} />)

    const input = getByDisplayValue('55.00')
    fireEvent.changeText(input, '')

    expect(getByDisplayValue('0.00')).toBeTruthy()
  })

  it('calls placeBid when button is pressed', async () => {
    mockPlaceBid.mockResolvedValue({ success: true })

    const { getByTestId, getByDisplayValue } = render(<BiddingInterface {...defaultProps} />)

    // Change bid amount
    const input = getByDisplayValue('55.00')
    fireEvent.changeText(input, '75')

    // Press the bid button
    fireEvent.press(getByTestId('place-bid-button'))

    await waitFor(() => {
      expect(mockPlaceBid).toHaveBeenCalledWith('user-1', 75)
    })
  })

  it('shows success toast on successful bid', async () => {
    mockPlaceBid.mockResolvedValue({ success: true })

    const { getByTestId } = render(<BiddingInterface {...defaultProps} />)

    fireEvent.press(getByTestId('place-bid-button'))

    await waitFor(() => {
      expect(mockShow).toHaveBeenCalledWith('Bid placed successfully', { type: 'success' })
    })
  })

  it('shows error toast on failed bid', async () => {
    mockPlaceBid.mockResolvedValue({
      success: false,
      error: 'Bid amount too low'
    })

    const { getByTestId } = render(<BiddingInterface {...defaultProps} />)

    fireEvent.press(getByTestId('place-bid-button'))

    await waitFor(() => {
      expect(mockShow).toHaveBeenCalledWith('Bid amount too low', {
        type: 'error',
        duration: 4000
      })
    })
  })

  it('does not submit bid when user is not logged in', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      userType: null,
      authState: 'unauthenticated',
      isAuthenticated: false,
      isLoading: false,
      error: null,
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      clearError: jest.fn(),
      setUserType: jest.fn(),
      logout: jest.fn()
    } as any)

    const { getByTestId } = render(<BiddingInterface {...defaultProps} />)

    fireEvent.press(getByTestId('place-bid-button'))

    expect(mockPlaceBid).not.toHaveBeenCalled()
  })

  it('shows placing state during bid submission', () => {
    mockUseBidding.mockReturnValue({
      highestBid: 50,
      placeBid: mockPlaceBid,
      placing: true,
      error: null,
      bids: [],
      currentUserBid: null
    })

    const { getByText, getByDisplayValue, getByTestId } = render(<BiddingInterface {...defaultProps} />)

    const button = getByTestId('place-bid-button')
    expect(button.props.children).toContain('Updating')

    const input = getByDisplayValue('55.00')
    expect(input.props.editable).toBe(false)
  })

  it('displays error message when there is an error', () => {
    mockUseBidding.mockReturnValue({
      highestBid: 50,
      placeBid: mockPlaceBid,
      placing: false,
      error: 'Connection error',
      bids: [],
      currentUserBid: null
    })

    const { getByText } = render(<BiddingInterface {...defaultProps} />)

    expect(getByText('Connection error')).toBeTruthy()
  })

  it('disables interface when disabled prop is true', () => {
    const { getByText, getByDisplayValue, getByTestId } = render(
      <BiddingInterface {...defaultProps} disabled={true} />
    )

    // Should show disabled message
    expect(getByText('Bidding is closed')).toBeTruthy()

    // Input should be disabled
    const input = getByDisplayValue('55.00')
    expect(input.props.editable).toBe(false)

    // Button should be disabled
    const button = getByTestId('place-bid-button')
    expect(button.props.disabled).toBe(true)
  })

  it('triggers outbid callback through useBidding hook', async () => {
    const mockOnOutbid = jest.fn()
    let outbidCallback: (() => void) | undefined

    // Mock the hook to capture the onOutbid callback
    mockUseBidding.mockImplementation((auctionId, options) => {
      // Store the callback for later use
      if (options?.onOutbid) {
        outbidCallback = options.onOutbid
      }

      return {
        highestBid: 50,
        placeBid: mockPlaceBid,
        placing: false,
        error: null,
        bids: [],
        currentUserBid: null
      }
    })

    render(<BiddingInterface {...defaultProps} />)

    // Simulate the outbid callback being called
    if (outbidCallback) {
      outbidCallback()
    }

    // Wait for the toast to be shown
    await waitFor(() => {
      expect(mockShow).toHaveBeenCalledWith("You've been outbid", { type: 'info' })
    }, { timeout: 2000 })
  })

  it('handles numeric input parsing correctly', () => {
    const { getByDisplayValue } = render(<BiddingInterface {...defaultProps} />)

    const input = getByDisplayValue('55.00')

    // Test valid numbers
    fireEvent.changeText(input, '100')
    expect(getByDisplayValue('100.00')).toBeTruthy()

    // Test invalid input (should default to 0)
    fireEvent.changeText(input, 'abc')
    expect(getByDisplayValue('0.00')).toBeTruthy()

    // Test decimal numbers (should be parsed as integer)
    fireEvent.changeText(input, '75.5')
    // The component should show 75.50, not 75.00, because it's displaying the actual value
    expect(getByDisplayValue('75.50')).toBeTruthy()
  })

  it('shows correct opacity when disabled', () => {
    const { getByDisplayValue } = render(
      <BiddingInterface {...defaultProps} disabled={true} />
    )

    const input = getByDisplayValue('55.00')
    expect(input.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ opacity: 0.6 })
      ])
    )
  })
})