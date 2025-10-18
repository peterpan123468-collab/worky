import { renderHook, act, waitFor } from '@testing-library/react-native'

jest.mock('../../services/auction.service')

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn()
  }
}))

const { useBidding } = require('../useBidding') as typeof import('../useBidding')
const { auctionService } = require('../../services/auction.service') as typeof import('../../services/auction.service')
const { supabase: mockSupabase } = require('../../lib/supabase') as {
  supabase: {
    from: jest.Mock
    channel: jest.Mock
    removeChannel: jest.Mock
  }
}

const mockAuctionService = auctionService as jest.Mocked<typeof auctionService>

describe('useBidding', () => {
  const mockAuctionId = 'auction-1'
  const mockUserId = 'user-1'
  const mockOnOutbid = jest.fn()

  const mockBids = [
    {
      id: 'bid-1',
      auction_id: 'auction-1',
      bidder_id: 'user-1',
      bid_amount: 55,
      is_winning_bid: true,
      created_at: '2024-09-14T10:01:00Z'
    },
    {
      id: 'bid-2',
      auction_id: 'auction-1',
      bidder_id: 'user-2',
      bid_amount: 50,
      is_winning_bid: false,
      created_at: '2024-09-14T10:00:00Z'
    }
  ]

  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Supabase query chain
    const mockQueryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: mockBids,
        error: null
      })
    }

    mockSupabase.from.mockReturnValue(mockQueryChain)
    mockSupabase.channel.mockReturnValue(mockChannel)
    mockSupabase.removeChannel.mockReset()

    // Mock auction service
    mockAuctionService.placeBid.mockResolvedValue({
      success: true,
      bidId: 'bid-3',
      newHighestBid: 60
    })
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useBidding(mockAuctionId))

    expect(result.current.highestBid).toBeNull()
    expect(result.current.placing).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.bids).toEqual([])
    expect(typeof result.current.placeBid).toBe('function')
  })

  it('loads initial bids on mount', async () => {
    const mockQueryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: mockBids,
        error: null
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryChain)

    const { result } = renderHook(() => useBidding(mockAuctionId))

    await waitFor(() => {
      expect(result.current.bids).toEqual(mockBids)
    })

    expect(mockSupabase.from).toHaveBeenCalledWith('auction_bids')
  })

  it('sets up realtime subscription', () => {
    mockSupabase.channel.mockReturnValue(mockChannel)

    renderHook(() => useBidding(mockAuctionId))

    expect(mockSupabase.channel).toHaveBeenCalledWith(`auction:${mockAuctionId}`)
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'auction_bids',
        filter: `auction_id=eq.${mockAuctionId}`
      },
      expect.any(Function)
    )
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it('cleans up subscription on unmount', () => {
    mockSupabase.removeChannel.mockReset()
    mockSupabase.channel.mockReturnValue(mockChannel)

    const { unmount } = renderHook(() => useBidding(mockAuctionId))

    unmount()

    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
  })

  it('updates highest bid from realtime events', async () => {
    mockSupabase.channel.mockReturnValue(mockChannel)
    const mockQueryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: mockBids,
        error: null
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryChain)

    const { result } = renderHook(() => useBidding(mockAuctionId))

    // Simulate realtime bid event
    const newBid = {
      id: 'bid-3',
      auction_id: 'auction-1',
      bidder_id: 'user-3',
      bid_amount: 65,
      is_winning_bid: true,
      created_at: '2024-09-14T10:02:00Z'
    }

    // Get the realtime callback
    const realtimeCallback = mockChannel.on.mock.calls[0][2]

    act(() => {
      realtimeCallback({ new: newBid })
    })

    await waitFor(() => {
      expect(result.current.highestBid).toBe(65)
      expect(result.current.bids[0]).toEqual(newBid)
    })
  })

  it('triggers onOutbid callback when user is outbid', async () => {
    mockSupabase.channel.mockReturnValue(mockChannel)
    
    // Initial setup with user winning
    const mockQueryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [mockBids[0]], // User is winning
        error: null
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryChain)

    const { result } = renderHook(() =>
      useBidding(mockAuctionId, { currentUserId: mockUserId, onOutbid: mockOnOutbid })
    )

    await waitFor(() => {
      expect(result.current.bids).toEqual([mockBids[0]])
    })

    // Simulate being outbid
    const outbiddingBid = {
      id: 'bid-4',
      auction_id: 'auction-1',
      bidder_id: 'user-3',
      bid_amount: 70,
      is_winning_bid: true,
      created_at: '2024-09-14T10:03:00Z'
    }

    const realtimeCallback = mockChannel.on.mock.calls[0][2]

    act(() => {
      realtimeCallback({ new: outbiddingBid })
    })

    await waitFor(() => {
      expect(mockOnOutbid).toHaveBeenCalled()
    })
  })

  it('does not trigger onOutbid when user was not winning', async () => {
    mockSupabase.channel.mockReturnValue(mockChannel)
    
    // Initial setup with user not winning
    const mockQueryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [mockBids[1]], // User is not winning
        error: null
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryChain)

    const { result } = renderHook(() =>
      useBidding(mockAuctionId, { currentUserId: mockUserId, onOutbid: mockOnOutbid })
    )

    await waitFor(() => {
      expect(result.current.bids).toEqual([mockBids[1]])
    })

    // Simulate another user winning
    const newWinningBid = {
      id: 'bid-5',
      auction_id: 'auction-1',
      bidder_id: 'user-3',
      bid_amount: 70,
      is_winning_bid: true,
      created_at: '2024-09-14T10:03:00Z'
    }

    const realtimeCallback = mockChannel.on.mock.calls[0][2]

    act(() => {
      realtimeCallback({ new: newWinningBid })
    })

    await waitFor(() => {
      expect(mockOnOutbid).not.toHaveBeenCalled()
    })
  })

  it('places bid successfully', async () => {
    const mockQueryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: mockBids,
        error: null
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryChain)
    mockSupabase.channel.mockReturnValue(mockChannel)

    const { result } = renderHook(() => useBidding(mockAuctionId))

    let bidResult: any
    await act(async () => {
      bidResult = await result.current.placeBid('user-1', 60)
    })

    expect(mockAuctionService.placeBid).toHaveBeenCalledWith({
      auctionId: mockAuctionId,
      bidderId: 'user-1',
      amount: 60,
      maxAutoBid: undefined
    })

    expect(bidResult).toEqual({
      success: true,
      bidId: 'bid-3',
      newHighestBid: 60
    })

    expect(result.current.placing).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.highestBid).toBe(60)
  })

  it('places bid with maxAutoBid', async () => {
    const mockQueryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: mockBids,
        error: null
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryChain)
    mockSupabase.channel.mockReturnValue(mockChannel)

    const { result } = renderHook(() => useBidding(mockAuctionId))

    await act(async () => {
      await result.current.placeBid('user-1', 60, 100)
    })

    expect(mockAuctionService.placeBid).toHaveBeenCalledWith({
      auctionId: mockAuctionId,
      bidderId: 'user-1',
      amount: 60,
      maxAutoBid: 100
    })
  })

  it('handles bid failure from service', async () => {
    const mockQueryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: mockBids,
        error: null
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryChain)
    mockSupabase.channel.mockReturnValue(mockChannel)
    
    mockAuctionService.placeBid.mockResolvedValue({
      success: false,
      error: 'Bid too low'
    })

    const { result } = renderHook(() => useBidding(mockAuctionId))

    let bidResult: any
    await act(async () => {
      bidResult = await result.current.placeBid('user-1', 30)
    })

    expect(result.current.error).toBe('Bid too low')
    expect(result.current.placing).toBe(false)
    expect(bidResult.success).toBe(false)
  })

  it('handles bid exception', async () => {
    const mockQueryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: mockBids,
        error: null
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryChain)
    mockSupabase.channel.mockReturnValue(mockChannel)
    
    mockAuctionService.placeBid.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useBidding(mockAuctionId))

    let bidResult: any
    await act(async () => {
      bidResult = await result.current.placeBid('user-1', 60)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.placing).toBe(false)
    expect(bidResult).toEqual({
      success: false,
      error: 'Network error'
    })
  })

  it('handles non-Error exceptions', async () => {
    const mockQueryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: mockBids,
        error: null
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryChain)
    mockSupabase.channel.mockReturnValue(mockChannel)
    
    mockAuctionService.placeBid.mockRejectedValue('String error')

    const { result } = renderHook(() => useBidding(mockAuctionId))

    let bidResult: any
    await act(async () => {
      bidResult = await result.current.placeBid('user-1', 60)
    })

    expect(result.current.error).toBe('Bid failed')
    expect(bidResult.error).toBe('Bid failed')
  })

  it('sets placing state during bid operation', async () => {
    const mockQueryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: mockBids,
        error: null
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryChain)
    mockSupabase.channel.mockReturnValue(mockChannel)
    
    let resolveBid: (value: any) => void = jest.fn()
    mockAuctionService.placeBid.mockImplementation(
      () => new Promise(resolve => { resolveBid = resolve as any })
    )

    const { result } = renderHook(() => useBidding(mockAuctionId))

    // Start bidding
    act(() => {
      result.current.placeBid('user-1', 60)
    })

    expect(result.current.placing).toBe(true)

    // Complete bidding
    await act(async () => {
      resolveBid({ success: true })
    })

    expect(result.current.placing).toBe(false)
  })

  it('limits bids to 20 items', async () => {
    mockSupabase.channel.mockReturnValue(mockChannel)
    
    const manyBids = Array.from({ length: 25 }, (_, i) => ({
      id: `bid-${i}`,
      auction_id: 'auction-1',
      bidder_id: `user-${i}`,
      bid_amount: 50 + i,
      is_winning_bid: i === 0,
      created_at: `2024-09-14T10:${String(i).padStart(2, '0')}:00Z`
    }))

    const mockQueryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: manyBids,
        error: null
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryChain)

    const { result } = renderHook(() => useBidding(mockAuctionId))

    await waitFor(() => {
      expect(result.current.bids).toEqual(manyBids)
    })

    // Simulate new bid via realtime
    const newBid = {
      id: 'bid-new',
      auction_id: 'auction-1',
      bidder_id: 'user-new',
      bid_amount: 100,
      is_winning_bid: true,
      created_at: '2024-09-14T11:00:00Z'
    }

    const realtimeCallback = mockChannel.on.mock.calls[0][2]

    act(() => {
      realtimeCallback({ new: newBid })
    })

    await waitFor(() => {
      expect(result.current.bids).toHaveLength(20)
      expect(result.current.bids[0]).toEqual(newBid)
    })
  })

  it('does not setup subscription when auctionId is empty', () => {
    mockSupabase.channel.mockReturnValue(mockChannel)

    renderHook(() => useBidding(''))

    expect(mockSupabase.channel).not.toHaveBeenCalled()
  })

  it('handles missing bid amount in realtime updates', async () => {
    mockSupabase.channel.mockReturnValue(mockChannel)
    const mockQueryChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: mockBids,
        error: null
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryChain)

    const { result } = renderHook(() => useBidding(mockAuctionId))

    // Simulate realtime event with no bid_amount
    const invalidBid = {
      id: 'bid-invalid',
      auction_id: 'auction-1',
      bidder_id: 'user-1'
      // No bid_amount
    }

    const realtimeCallback = mockChannel.on.mock.calls[0][2]

    act(() => {
      realtimeCallback({ new: invalidBid })
    })

    // Should not crash and should still add to bids
    await waitFor(() => {
      expect(result.current.bids[0]).toEqual(invalidBid)
    })

    // highestBid should not be updated
    expect(result.current.highestBid).toBeNull()
  })
})