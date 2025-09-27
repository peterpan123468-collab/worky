import { renderHook, waitFor } from '@testing-library/react-native'
import { useCustomerDashboard } from '../useCustomerDashboard'
import * as dashboardService from '../../services/dashboard.service'
import { Booking, TimeSlot } from '../../types/database.types'

// Mock the dashboard service
jest.mock('../../services/dashboard.service')

const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>

describe('useCustomerDashboard', () => {
  const mockBookings: Booking[] = [
    {
      id: 'booking-1',
      handyman_id: 'handyman-1',
      customer_id: 'customer-1',
      status: 'confirmed',
      total_price: 100,
      winning_bid_amount: 120,
      created_at: '2024-09-10T10:00:00Z',
      start_time: '2024-09-20T14:00:00Z',
      end_time: '2024-09-20T16:00:00Z'
    },
    {
      id: 'booking-2',
      handyman_id: 'handyman-2',
      customer_id: 'customer-1',
      status: 'pending',
      total_price: 80,
      winning_bid_amount: null,
      created_at: '2024-09-12T10:00:00Z',
      start_time: '2024-09-22T14:00:00Z',
      end_time: '2024-09-22T16:00:00Z'
    }
  ]

  const mockAvailableSlots: TimeSlot[] = [
    {
      id: 'slot-1',
      handyman_id: 'handyman-1',
      start_time: '2024-09-20T14:00:00Z',
      end_time: '2024-09-20T16:00:00Z',
      status: 'open',
      calendar_event_id: null,
      is_synced_to_calendar: false,
      created_at: '2024-09-15T10:00:00Z',
      updated_at: '2024-09-15T10:00:00Z'
    },
    {
      id: 'slot-2',
      handyman_id: 'handyman-2',
      start_time: '2024-09-21T14:00:00Z',
      end_time: '2024-09-21T16:00:00Z',
      status: 'open',
      calendar_event_id: null,
      is_synced_to_calendar: false,
      created_at: '2024-09-15T10:00:00Z',
      updated_at: '2024-09-15T10:00:00Z'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockDashboardService.getCustomerBookings.mockResolvedValue(mockBookings)
    mockDashboardService.getAvailableSlots.mockResolvedValue(mockAvailableSlots)
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useCustomerDashboard())

    expect(result.current.myBookings).toEqual([])
    expect(result.current.availableSlots).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('does not fetch bookings when customerId is undefined', () => {
    renderHook(() => useCustomerDashboard())

    expect(mockDashboardService.getCustomerBookings).not.toHaveBeenCalled()
    // Available slots should still be fetched as they don't require customerId
    expect(mockDashboardService.getAvailableSlots).toHaveBeenCalled()
  })

  it('fetches data when customerId is provided', async () => {
    const { result } = renderHook(() => useCustomerDashboard('customer-1'))

    await waitFor(() => {
      expect(result.current.myBookings).toEqual(mockBookings)
      expect(result.current.availableSlots).toEqual(mockAvailableSlots)
    })

    expect(mockDashboardService.getCustomerBookings).toHaveBeenCalledWith('customer-1', 5)
    expect(mockDashboardService.getAvailableSlots).toHaveBeenCalledWith(5)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets loading state during fetch', () => {
    let resolveBookings: (value: any) => void
    let resolveSlots: (value: any) => void

    mockDashboardService.getCustomerBookings.mockImplementation(
      () => new Promise(resolve => { resolveBookings = resolve })
    )
    mockDashboardService.getAvailableSlots.mockImplementation(
      () => new Promise(resolve => { resolveSlots = resolve })
    )

    const { result } = renderHook(() => useCustomerDashboard('customer-1'))

    expect(result.current.loading).toBe(true)

    // Resolve the promises
    resolveBookings!(mockBookings)
    resolveSlots!(mockAvailableSlots)
  })

  it('handles errors during fetch', async () => {
    const error = new Error('Failed to fetch bookings')
    mockDashboardService.getCustomerBookings.mockRejectedValue(error)

    const { result } = renderHook(() => useCustomerDashboard('customer-1'))

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch bookings')
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.myBookings).toEqual([])
    expect(result.current.availableSlots).toEqual([])
  })

  it('handles non-Error exceptions', async () => {
    mockDashboardService.getAvailableSlots.mockRejectedValue('String error')

    const { result } = renderHook(() => useCustomerDashboard('customer-1'))

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load')
    })
  })

  it('clears error on successful fetch', async () => {
    const error = new Error('Initial error')
    mockDashboardService.getCustomerBookings.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useCustomerDashboard('customer-1'))

    await waitFor(() => {
      expect(result.current.error).toBe('Initial error')
    })

    // Mock successful response
    mockDashboardService.getCustomerBookings.mockResolvedValue(mockBookings)
    mockDashboardService.getAvailableSlots.mockResolvedValue(mockAvailableSlots)

    // Trigger refresh
    result.current.refresh()

    await waitFor(() => {
      expect(result.current.error).toBeNull()
    })

    expect(result.current.myBookings).toEqual(mockBookings)
    expect(result.current.availableSlots).toEqual(mockAvailableSlots)
  })

  it('refetches data when customerId changes', async () => {
    const { result, rerender } = renderHook(
      (customerId) => useCustomerDashboard(customerId),
      { initialProps: 'customer-1' }
    )

    await waitFor(() => {
      expect(result.current.myBookings).toEqual(mockBookings)
    })

    expect(mockDashboardService.getCustomerBookings).toHaveBeenCalledWith('customer-1', 5)

    // Change customerId
    rerender('customer-2')

    await waitFor(() => {
      expect(mockDashboardService.getCustomerBookings).toHaveBeenCalledWith('customer-2', 5)
    })

    expect(mockDashboardService.getCustomerBookings).toHaveBeenCalledTimes(2)
  })

  it('manual refresh works correctly', async () => {
    const { result } = renderHook(() => useCustomerDashboard('customer-1'))

    await waitFor(() => {
      expect(result.current.myBookings).toEqual(mockBookings)
    })

    // Clear previous calls
    jest.clearAllMocks()
    const newBookings = [mockBookings[0]] // One less booking
    mockDashboardService.getCustomerBookings.mockResolvedValue(newBookings)
    mockDashboardService.getAvailableSlots.mockResolvedValue(mockAvailableSlots)

    // Manual refresh
    result.current.refresh()

    await waitFor(() => {
      expect(result.current.myBookings).toEqual(newBookings)
    })

    expect(mockDashboardService.getCustomerBookings).toHaveBeenCalledWith('customer-1', 5)
  })

  it('handles partial failures gracefully', async () => {
    mockDashboardService.getCustomerBookings.mockResolvedValue(mockBookings)
    mockDashboardService.getAvailableSlots.mockRejectedValue(new Error('Slots failed'))

    const { result } = renderHook(() => useCustomerDashboard('customer-1'))

    await waitFor(() => {
      expect(result.current.error).toBe('Slots failed')
    })

    // Should not update state on partial failure
    expect(result.current.myBookings).toEqual([])
    expect(result.current.availableSlots).toEqual([])
  })

  it('fetches available slots even without customerId', async () => {
    const { result } = renderHook(() => useCustomerDashboard())

    await waitFor(() => {
      expect(result.current.availableSlots).toEqual(mockAvailableSlots)
    })

    expect(mockDashboardService.getAvailableSlots).toHaveBeenCalledWith(5)
    expect(mockDashboardService.getCustomerBookings).not.toHaveBeenCalled()
  })

  it('handles customerId becoming available after initial render', async () => {
    const { result, rerender } = renderHook(
      (customerId) => useCustomerDashboard(customerId),
      { initialProps: undefined }
    )

    // Initially only available slots should be fetched
    await waitFor(() => {
      expect(result.current.availableSlots).toEqual(mockAvailableSlots)
    })

    expect(mockDashboardService.getCustomerBookings).not.toHaveBeenCalled()
    expect(result.current.myBookings).toEqual([])

    // Now provide customerId
    rerender('customer-1')

    await waitFor(() => {
      expect(result.current.myBookings).toEqual(mockBookings)
    })

    expect(mockDashboardService.getCustomerBookings).toHaveBeenCalledWith('customer-1', 5)
  })
})