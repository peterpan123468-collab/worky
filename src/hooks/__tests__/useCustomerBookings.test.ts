import { renderHook, waitFor, act } from '@testing-library/react-native'
import { useCustomerBookings } from '../useCustomerBookings'
import * as bookingService from '../../services/booking.service'

jest.mock('../../services/booking.service')

const mockBookingService = bookingService as jest.Mocked<typeof bookingService>

const sampleBookings = [
  {
    id: 'booking-1',
    slot_id: 'slot-1',
    customer_id: 'customer-1',
    handyman_id: 'handyman-1',
    status: 'confirmed',
    total_price: 120,
    work_description: 'Install',
    customer_address: 'Zurich',
    booking_type: 'calendar',
    auction_id: null,
    winning_bid_amount: null,
    created_at: '2025-01-10T00:00:00Z',
    updated_at: '2025-01-10T00:00:00Z',
    slot: {
      id: 'slot-1',
      handyman_id: 'handyman-1',
      start_time: '2025-01-20T09:00:00Z',
      end_time: '2025-01-20T11:00:00Z',
      status: 'booked',
      calendar_event_id: null,
      is_synced_to_calendar: false,
      booking_type: 'calendar',
      created_at: '2025-01-09T00:00:00Z',
      updated_at: '2025-01-09T00:00:00Z',
    },
  },
]

describe('useCustomerBookings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBookingService.listCustomerBookings.mockResolvedValue(sampleBookings as any)
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useCustomerBookings())

    expect(result.current.bookings).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetches bookings when customerId is provided', async () => {
    const { result } = renderHook(() => useCustomerBookings('customer-1'))

    await waitFor(() => {
      expect(result.current.bookings).toEqual(sampleBookings)
    })

    expect(mockBookingService.listCustomerBookings).toHaveBeenCalledWith('customer-1')
  })

  it('does not fetch when customerId is missing', async () => {
    renderHook(() => useCustomerBookings())

    expect(mockBookingService.listCustomerBookings).not.toHaveBeenCalled()
  })

  it('exposes refresh function', async () => {
    const { result } = renderHook(() => useCustomerBookings('customer-1'))

    await waitFor(() => {
      expect(result.current.bookings).toEqual(sampleBookings)
    })

    const updated = [...sampleBookings, { ...sampleBookings[0], id: 'booking-2' }]
    mockBookingService.listCustomerBookings.mockResolvedValue(updated as any)

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.bookings).toEqual(updated)
  })

  it('handles errors from service', async () => {
    const error = new Error('Failed')
    mockBookingService.listCustomerBookings.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useCustomerBookings('customer-1'))

    await waitFor(() => {
      expect(result.current.error).toBe('Failed')
    })
  })
})
