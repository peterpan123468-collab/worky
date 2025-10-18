import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { AuctionCreationForm } from '../AuctionCreationForm'
import { useAuth } from '../../../contexts/AuthContext'
import { auctionService } from '../../../services/auction.service'
import { nativeAlert } from '../../../utils/nativeAlert'
import { CHF_INCREMENT, CHF_MINIMUM } from '../../../utils/currency'

jest.mock('../../../contexts/AuthContext')
jest.mock('../../../services/auction.service')
jest.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'default' }),
}))
jest.mock('../../../utils/nativeAlert', () => ({
  nativeAlert: {
    alert: jest.fn(),
  },
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockAuctionService = auctionService as jest.Mocked<typeof auctionService>
const mockAlert = nativeAlert.alert as jest.MockedFunction<typeof nativeAlert.alert>

const isButtonDisabled = (element: any) => {
  const accessibilityState = element.props.accessibilityState
  if (accessibilityState && typeof accessibilityState.disabled === 'boolean') {
    return accessibilityState.disabled
  }
  return Boolean(element.props.disabled)
}

describe('AuctionCreationForm', () => {
  const defaultUser = {
    id: 'handyman-1',
    email: 'handyman@example.com',
    user_type: 'handyman' as const,
  }

  const mockCreatedAuction = {
    id: 'auction-123',
    handyman_id: 'handyman-1',
    title: 'Test Service',
    service_type: 'handyman',
    region: 'Zurich',
    starting_price: 50,
    status: 'active' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseAuth.mockReturnValue({
      user: defaultUser,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
    } as any)

    mockAuctionService.createAuction.mockResolvedValue(mockCreatedAuction as any)
  })

  it('renders with default values', () => {
    const { getAllByText, getByDisplayValue } = render(<AuctionCreationForm />)

    expect(getAllByText('Create Auction').length).toBeGreaterThan(0)
    expect(getByDisplayValue('General Handyman Service')).toBeTruthy()
    expect(getByDisplayValue('handyman')).toBeTruthy()
    expect(getByDisplayValue('Zurich')).toBeTruthy()
    expect(getByDisplayValue(String(CHF_MINIMUM))).toBeTruthy()
    expect(getByDisplayValue('60')).toBeTruthy()
  })

  it('allows editing all form fields', () => {
    const { getByDisplayValue, getByPlaceholderText } = render(<AuctionCreationForm />)

    fireEvent.changeText(getByDisplayValue('General Handyman Service'), 'Plumbing Service')
    expect(getByDisplayValue('Plumbing Service')).toBeTruthy()

    fireEvent.changeText(getByDisplayValue('handyman'), 'plumbing')
    expect(getByDisplayValue('plumbing')).toBeTruthy()

    fireEvent.changeText(getByDisplayValue('Zurich'), 'Basel')
    expect(getByDisplayValue('Basel')).toBeTruthy()

    fireEvent.changeText(getByDisplayValue(String(CHF_MINIMUM)), '50')
    expect(getByDisplayValue('50')).toBeTruthy()

    fireEvent.changeText(getByDisplayValue('60'), '120')
    expect(getByDisplayValue('120')).toBeTruthy()

    fireEvent.changeText(getByPlaceholderText('Optional reserve price'), '150')
    expect(getByDisplayValue('150')).toBeTruthy()
  })

  it('validates starting price minimum', () => {
    const { getByDisplayValue, getByText } = render(<AuctionCreationForm />)

    fireEvent.changeText(getByDisplayValue(String(CHF_MINIMUM)), '10')

    expect(getByText(`Minimum starting price is CHF ${CHF_MINIMUM}`)).toBeTruthy()
  })

  it('validates duration range', () => {
    const { getByDisplayValue, getByText } = render(<AuctionCreationForm />)

    const durationInput = getByDisplayValue('60')
    fireEvent.changeText(durationInput, '10')
    expect(getByText('Duration must be between 15 and 1440 minutes')).toBeTruthy()

    fireEvent.changeText(durationInput, '2000')
    expect(getByText('Duration must be between 15 and 1440 minutes')).toBeTruthy()
  })

  it('validates reserve price vs starting price', () => {
    const { getByDisplayValue, getByPlaceholderText, getByText } = render(<AuctionCreationForm />)

    fireEvent.changeText(getByDisplayValue(String(CHF_MINIMUM)), '50')
    fireEvent.changeText(getByPlaceholderText('Optional reserve price'), '30')

    expect(getByText('Reserve price must be >= starting price')).toBeTruthy()
  })

  it('validates auto-extend minutes range when enabled', () => {
    const { getByDisplayValue, getByText } = render(<AuctionCreationForm />)

    const autoExtendInput = getByDisplayValue('2')
    fireEvent.changeText(autoExtendInput, '15')
    expect(getByText('Auto-extend must be between 1 and 10 minutes')).toBeTruthy()

    fireEvent.changeText(autoExtendInput, '0')
    expect(getByText('Auto-extend must be between 1 and 10 minutes')).toBeTruthy()
  })

  it('disables create button when form is invalid', () => {
    const { getByDisplayValue, getByTestId } = render(<AuctionCreationForm />)

    fireEvent.changeText(getByDisplayValue(String(CHF_MINIMUM)), '10')

    const createButton = getByTestId('create-button')
    expect(isButtonDisabled(createButton)).toBe(true)

    fireEvent.press(createButton)
    expect(mockAuctionService.createAuction).not.toHaveBeenCalled()
  })

  it('enables create button when form is valid', () => {
    const { getByTestId } = render(<AuctionCreationForm />)

    const createButton = getByTestId('create-button')
    expect(isButtonDisabled(createButton)).toBe(false)
  })

  it('creates auction successfully with valid data', async () => {
    const mockOnCreated = jest.fn()
    const { getByTestId } = render(<AuctionCreationForm onCreated={mockOnCreated} />)

    fireEvent.press(getByTestId('create-button'))

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
          auto_extend_minutes: 2,
        })
      )
    })

    expect(mockOnCreated).toHaveBeenCalledWith('auction-123')
    expect(mockAlert).toHaveBeenCalledWith(
      'Success!',
      expect.stringContaining('auction-123')
    )
  })

  it('creates auction without auto-extend when disabled', async () => {
    const { getByTestId } = render(<AuctionCreationForm />)

    fireEvent(getByTestId('auto-extend-switch'), 'valueChange', false)
    fireEvent.press(getByTestId('create-button'))

    await waitFor(() => {
      expect(mockAuctionService.createAuction).toHaveBeenCalledWith(
        'handyman-1',
        expect.objectContaining({
          auto_extend: false,
          auto_extend_minutes: null,
        })
      )
    })
  })

  it('handles creation error gracefully', async () => {
    mockAuctionService.createAuction.mockRejectedValue(new Error('Database error'))

    const { getByTestId } = render(<AuctionCreationForm />)
    fireEvent.press(getByTestId('create-button'))

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalled()
    })

    const [title, message] = mockAlert.mock.calls[0]
    expect(title).toBe('Auction Creation Failed')
    expect(message as string).toContain('Database error')
  })

  it('handles non-error exceptions', async () => {
    mockAuctionService.createAuction.mockRejectedValue('String error')

    const { getByTestId } = render(<AuctionCreationForm />)
    fireEvent.press(getByTestId('create-button'))

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalled()
    })

    const [title, message] = mockAlert.mock.calls[0]
    expect(title).toBe('Auction Creation Failed')
    expect(message as string).toContain('String error')
  })

  it('prevents creation when user is not logged in', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
    } as any)

    const { getByTestId } = render(<AuctionCreationForm />)
    fireEvent.press(getByTestId('create-button'))

    expect(mockAlert).toHaveBeenCalledWith(
      'Authentication Error',
      'You must be signed in to create an auction'
    )
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

    expect(getByText('Creating Auction...')).toBeTruthy()
    expect(isButtonDisabled(createButton)).toBe(true)

    resolveCreate!(mockCreatedAuction)

    await waitFor(() => {
      expect(getByText('Create Auction')).toBeTruthy()
    })
  })

  it('handles numeric input parsing for prices', () => {
    const { getByDisplayValue } = render(<AuctionCreationForm />)

    const priceInput = getByDisplayValue(String(CHF_MINIMUM))

    fireEvent.changeText(priceInput, '')
    expect(getByDisplayValue('0')).toBeTruthy()

    fireEvent.changeText(priceInput, 'abc')
    expect(getByDisplayValue('0')).toBeTruthy()

    fireEvent.changeText(priceInput, '50.5')
    expect(getByDisplayValue('50')).toBeTruthy()
  })

  it('displays formatted price hint', () => {
    const { getByDisplayValue, getByText } = render(<AuctionCreationForm />)

    fireEvent.changeText(getByDisplayValue(String(CHF_MINIMUM)), '75')

    expect(getByText(`CHF 75.00 (minimum CHF ${CHF_MINIMUM})`)).toBeTruthy()
  })

  it('shows start and end times in Swiss format', () => {
    const { getByText } = render(<AuctionCreationForm />)

    expect(getByText(/Start:.*End:/)).toBeTruthy()
  })
})
