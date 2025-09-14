import { renderHook, waitFor } from '@testing-library/react-native'
import { useHandymanDashboard } from '../useHandymanDashboard'
import * as dashboardService from '../../services/dashboard.service'
import { AuctionBid } from '../../types/database.types'

// Mock the dashboard service
jest.mock('../../services/dashboard.service')

const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>

describe('useHandymanDashboard', () => {
  const mockStats = {
    activeBookings: 3,
    monthRevenue: 450
  }

  const mockRecentBids: AuctionBid[] = [
    {
      id: 'bid-1',
      auction_id: 'auction-1',
      bidder_id: 'customer-1',
      bid_amount: 55,
      is_winning_bid: true,
      created_at: '2024-09-15T09:30:00Z'
    },
    {
      id: 'bid-2',
      auction_id: 'auction-1',
      bidder_id: 'customer-2',
      bid_amount: 50,
      is_winning_bid: false,
      created_at: '2024-09-15T09:25:00Z'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockDashboardService.getHandymanStats.mockResolvedValue(mockStats)
    mockDashboardService.getRecentBidsForHandyman.mockResolvedValue(mockRecentBids)
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useHandymanDashboard())

    expect(result.current.stats).toEqual({ activeBookings: 0, monthRevenue: 0 })
    expect(result.current.recentBids).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('does not fetch data when handymanId is undefined', () => {
    renderHook(() => useHandymanDashboard())

    expect(mockDashboardService.getHandymanStats).not.toHaveBeenCalled()
    expect(mockDashboardService.getRecentBidsForHandyman).not.toHaveBeenCalled()
  })

  it('fetches data when handymanId is provided', async () => {
    const { result } = renderHook(() => useHandymanDashboard('handyman-1'))

    await waitFor(() => {
      expect(result.current.stats).toEqual(mockStats)
      expect(result.current.recentBids).toEqual(mockRecentBids)
    })

    expect(mockDashboardService.getHandymanStats).toHaveBeenCalledWith('handyman-1')
    expect(mockDashboardService.getRecentBidsForHandyman).toHaveBeenCalledWith('handyman-1', 5)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets loading state during fetch', () => {
    let resolveStats: (value: any) => void
    let resolveBids: (value: any) => void

    mockDashboardService.getHandymanStats.mockImplementation(
      () => new Promise(resolve => { resolveStats = resolve })
    )
    mockDashboardService.getRecentBidsForHandyman.mockImplementation(
      () => new Promise(resolve => { resolveBids = resolve })
    )

    const { result } = renderHook(() => useHandymanDashboard('handyman-1'))

    expect(result.current.loading).toBe(true)

    // Resolve the promises
    resolveStats!(mockStats)
    resolveBids!(mockRecentBids)
  })

  it('handles errors during fetch', async () => {
    const error = new Error('Failed to fetch stats')
    mockDashboardService.getHandymanStats.mockRejectedValue(error)

    const { result } = renderHook(() => useHandymanDashboard('handyman-1'))

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch stats')
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.stats).toEqual({ activeBookings: 0, monthRevenue: 0 })
    expect(result.current.recentBids).toEqual([])
  })

  it('handles non-Error exceptions', async () => {
    mockDashboardService.getHandymanStats.mockRejectedValue('String error')

    const { result } = renderHook(() => useHandymanDashboard('handyman-1'))

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load')
    })
  })

  it('clears error on successful fetch', async () => {
    const error = new Error('Initial error')
    mockDashboardService.getHandymanStats.mockRejectedValueOnce(error)

    const { result, rerender } = renderHook(
      (handymanId) => useHandymanDashboard(handymanId),
      { initialProps: 'handyman-1' }
    )

    await waitFor(() => {
      expect(result.current.error).toBe('Initial error')
    })

    // Mock successful response
    mockDashboardService.getHandymanStats.mockResolvedValue(mockStats)
    mockDashboardService.getRecentBidsForHandyman.mockResolvedValue(mockRecentBids)

    // Trigger refresh
    result.current.refresh()

    await waitFor(() => {
      expect(result.current.error).toBeNull()
    })

    expect(result.current.stats).toEqual(mockStats)
    expect(result.current.recentBids).toEqual(mockRecentBids)
  })

  it('refetches data when handymanId changes', async () => {
    const { result, rerender } = renderHook(
      (handymanId) => useHandymanDashboard(handymanId),
      { initialProps: 'handyman-1' }
    )

    await waitFor(() => {
      expect(result.current.stats).toEqual(mockStats)
    })

    expect(mockDashboardService.getHandymanStats).toHaveBeenCalledWith('handyman-1')

    // Change handymanId
    rerender('handyman-2')

    await waitFor(() => {
      expect(mockDashboardService.getHandymanStats).toHaveBeenCalledWith('handyman-2')
    })

    expect(mockDashboardService.getHandymanStats).toHaveBeenCalledTimes(2)
  })

  it('manual refresh works correctly', async () => {
    const { result } = renderHook(() => useHandymanDashboard('handyman-1'))

    await waitFor(() => {
      expect(result.current.stats).toEqual(mockStats)
    })

    // Clear previous calls
    jest.clearAllMocks()
    mockDashboardService.getHandymanStats.mockResolvedValue({
      activeBookings: 5,
      monthRevenue: 600
    })

    // Manual refresh
    result.current.refresh()

    await waitFor(() => {
      expect(result.current.stats).toEqual({ activeBookings: 5, monthRevenue: 600 })
    })

    expect(mockDashboardService.getHandymanStats).toHaveBeenCalledWith('handyman-1')
  })

  it('handles partial failures gracefully', async () => {
    mockDashboardService.getHandymanStats.mockResolvedValue(mockStats)
    mockDashboardService.getRecentBidsForHandyman.mockRejectedValue(new Error('Bids failed'))

    const { result } = renderHook(() => useHandymanDashboard('handyman-1'))

    await waitFor(() => {
      expect(result.current.error).toBe('Bids failed')
    })

    // Should not update state on partial failure
    expect(result.current.stats).toEqual({ activeBookings: 0, monthRevenue: 0 })
    expect(result.current.recentBids).toEqual([])
  })
})