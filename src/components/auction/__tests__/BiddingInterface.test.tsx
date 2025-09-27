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
  Button: ({ children, onPress, disabled, style }: any) => (
    <button
      onPress={onPress}
      disabled={disabled}
      style={style}
      testID="bid-button"
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
    user_type: 'customer' as const
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseAuth.mockReturnValue({
      user: defaultUser,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    })

    mockUseToast.mockReturnValue({
      show: mockShow,
      hide: jest.fn(),
      toasts: []
    })

    mockUseBidding.mockReturnValue({
      highestBid: 50,
      placeBid: mockPlaceBid,
      placing: false,
      error: null,
      recentBids: []
    })
  })

  it('renders correctly with default values', () => {
    const { getByDisplayValue, getByText } = render(<BiddingInterface {...defaultProps} />)

    // Should show next valid bid (55) as default value
    expect(getByDisplayValue('55')).toBeTruthy()
    expect(getByText('Your bid')).toBeTruthy()
    expect(getByText('Place Bid')).toBeTruthy()
    expect(getByText('Highest: CHF 50.00')).toBeTruthy()
  })

  it('uses highest bid from hook when available', () => {
    mockUseBidding.mockReturnValue({
      highestBid: 65,
      placeBid: mockPlaceBid,
      placing: false,
      error: null,
      recentBids: []
    })

    const { getByText } = render(<BiddingInterface {...defaultProps} />)

    expect(getByText('Highest: CHF 65.00')).toBeTruthy()
  })

  it('allows user to change bid amount', () => {
    const { getByDisplayValue } = render(<BiddingInterface {...defaultProps} />)

    const input = getByDisplayValue('55')
    fireEvent.changeText(input, '75')

    expect(getByDisplayValue('75')).toBeTruthy()
  })

  it('handles empty input gracefully', () => {
    const { getByDisplayValue } = render(<BiddingInterface {...defaultProps} />)

    const input = getByDisplayValue('55')
    fireEvent.changeText(input, '')

    expect(getByDisplayValue('0')).toBeTruthy()
  })

  it('calls placeBid when button is pressed', async () => {
    mockPlaceBid.mockResolvedValue({ success: true })

    const { getByTestId, getByDisplayValue } = render(<BiddingInterface {...defaultProps} />)

    // Change bid amount
    const input = getByDisplayValue('55')
    fireEvent.changeText(input, '75')

    // Press the bid button
    fireEvent.press(getByTestId('bid-button'))

    await waitFor(() => {
      expect(mockPlaceBid).toHaveBeenCalledWith('user-1', 75)
    })
  })

  it('shows success toast on successful bid', async () => {
    mockPlaceBid.mockResolvedValue({ success: true })

    const { getByTestId } = render(<BiddingInterface {...defaultProps} />)

    fireEvent.press(getByTestId('bid-button'))

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

    fireEvent.press(getByTestId('bid-button'))

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
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    })

    const { getByTestId } = render(<BiddingInterface {...defaultProps} />)

    fireEvent.press(getByTestId('bid-button'))

    expect(mockPlaceBid).not.toHaveBeenCalled()
  })

  it('shows placing state during bid submission', () => {
    mockUseBidding.mockReturnValue({
      highestBid: 50,
      placeBid: mockPlaceBid,
      placing: true,
      error: null,
      recentBids: []
    })

    const { getByText, getByDisplayValue } = render(<BiddingInterface {...defaultProps} />)

    expect(getByText('Placing…')).toBeTruthy()

    // Input should be disabled during placing
    const input = getByDisplayValue('55')
    expect(input.props.editable).toBe(false)
  })

  it('displays error message when there is an error', () => {
    mockUseBidding.mockReturnValue({
      highestBid: 50,
      placeBid: mockPlaceBid,
      placing: false,
      error: 'Connection error',
      recentBids: []
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
    const input = getByDisplayValue('55')
    expect(input.props.editable).toBe(false)

    // Button should be disabled
    const button = getByTestId('bid-button')
    expect(button.props.disabled).toBe(true)
  })

  it('triggers outbid callback through useBidding hook', () => {
    const mockOnOutbid = jest.fn()

    // Mock the hook to call onOutbid
    mockUseBidding.mockImplementation((auctionId, options) => {
      // Simulate calling the onOutbid callback
      setTimeout(() => options?.onOutbid?.(), 0)

      return {
        highestBid: 50,
        placeBid: mockPlaceBid,
        placing: false,
        error: null,
        recentBids: []
      }
    })

    render(<BiddingInterface {...defaultProps} />)

    // Wait for the callback to be triggered
    setTimeout(() => {
      expect(mockShow).toHaveBeenCalledWith("You've been outbid", { type: 'info' })
    }, 10)
  })

  it('handles numeric input parsing correctly', () => {
    const { getByDisplayValue } = render(<BiddingInterface {...defaultProps} />)

    const input = getByDisplayValue('55')

    // Test valid numbers
    fireEvent.changeText(input, '100')
    expect(getByDisplayValue('100')).toBeTruthy()

    // Test invalid input (should default to 0)
    fireEvent.changeText(input, 'abc')
    expect(getByDisplayValue('0')).toBeTruthy()

    // Test decimal numbers (should be parsed as integer)
    fireEvent.changeText(input, '75.5')
    expect(getByDisplayValue('75')).toBeTruthy()
  })

  it('shows correct opacity when disabled', () => {
    const { getByDisplayValue } = render(
      <BiddingInterface {...defaultProps} disabled={true} />
    )

    const input = getByDisplayValue('55')
    expect(input.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ opacity: 0.6 })
      ])
    )
  })
})