import { act, renderHook, waitFor } from '@testing-library/react-native'
import { useCustomerDashboard } from '../useCustomerDashboard'
import * as dashboardService from '../../services/dashboard.service'
import * as bookingService from '../../services/booking.service'

jest.mock('../../services/dashboard.service')
jest.mock('../../services/booking.service')
jest.mock('../../lib/supabase', () => require('../../__mocks__/lib/supabase'))

const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>
const mockBookingService = bookingService as jest.Mocked<typeof bookingService>

describe('useCustomerDashboard', () => {
  const mockSlots = [
    {
      id: 'slot-1',
      handyman_id: 'handyman-1',
      start_time: '2025-01-20T09:00:00Z',
      end_time: '2025-01-20T11:00:00Z',
      status: 'open',
      calendar_event_id: null,
      is_synced_to_calendar: false,
      booking_type: 'calendar',
      created_at: '2025-01-10T00:00:00Z',
      updated_at: '2025-01-10T00:00:00Z'
    }
  ]

  const mockBookings = [
    {
      id: 'booking-1',
      slot_id: 'slot-1',
      handyman_id: 'handyman-1',
      customer_id: 'customer-1',
      status: 'confirmed',
      total_price: 120,
      work_description: 'Install',
      customer_address: 'Zurich',
      booking_type: 'calendar',
      auction_id: null,
      winning_bid_amount: null,
      created_at: '2025-01-11T00:00:00Z',
      updated_at: '2025-01-11T00:00:00Z',
      slot: mockSlots[0]
    } as any
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockDashboardService.getAvailableSlots.mockResolvedValue(mockSlots as any)
    mockBookingService.listCustomerBookings.mockResolvedValue(mockBookings as any)
  })

  it('fetches slots and bookings for a customer', async () => {
    const { result } = renderHook(() => useCustomerDashboard('customer-1'))

    await waitFor(() => {
      expect(result.current.slots).toEqual(mockSlots)
      expect(result.current.bookings).toEqual(mockBookings)
      expect(result.current.loading).toBe(false)
    })

    expect(mockDashboardService.getAvailableSlots).toHaveBeenCalledWith(5)
    expect(mockBookingService.listCustomerBookings).toHaveBeenCalledWith('customer-1', 5)
  })

  it('skips booking fetch when customer id missing', async () => {
    const { result } = renderHook(() => useCustomerDashboard())

    await waitFor(() => {
      expect(result.current.slots).toEqual(mockSlots)
      expect(result.current.bookings).toEqual([])
    })

    expect(mockBookingService.listCustomerBookings).not.toHaveBeenCalled()
  })

  it('exposes refresh helper', async () => {
    const { result } = renderHook(() => useCustomerDashboard('customer-1'))

    await waitFor(() => expect(result.current.bookings).toEqual(mockBookings))

    const updatedBookings = [{ ...mockBookings[0], id: 'booking-2' }]
    mockBookingService.listCustomerBookings.mockResolvedValue(updatedBookings as any)

    await act(async () => {
      await result.current.refresh()
    })

    await waitFor(() => expect(result.current.bookings).toEqual(updatedBookings))
  })
})
