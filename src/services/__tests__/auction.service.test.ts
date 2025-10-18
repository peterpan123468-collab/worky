import { auctionService } from '../auction.service'
import { createMockSupabaseClient, createMockSupabaseError } from '../../test/mocks/supabase.mock'
import { Auction, AuctionInsert } from '../../types/database.types'
import { CreateAuctionPayload, BidInput, AuctionFilters } from '../../types/auction.types'

// Mock the supabase client
jest.mock('../../lib/supabase', () => {
  const { createMockSupabaseClient } = require('../../test/mocks/supabase.mock')
  return { supabase: createMockSupabaseClient() }
})

const { supabase } = require('../../lib/supabase')

describe('AuctionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockAuction: Auction = {
    id: 'auction-1',
    handyman_id: 'handyman-1',
    title: 'Test Service',
    description: 'Test Description',
    service_type: 'plumbing',
    region: 'Zurich',
    start_time: '2024-09-14T10:00:00Z',
    end_time: '2024-09-14T12:00:00Z',
    starting_price: 50,
    current_highest_bid: 50,
    reserve_price: null,
    bid_increment: 5,
    status: 'active',
    created_at: '2024-09-14T09:00:00Z',
    updated_at: '2024-09-14T09:00:00Z',
    ends_at: '2024-09-14T12:00:00Z',
    auto_extend: true,
    auto_extend_minutes: 5,
    winning_bidder_id: null
  }

  const mockCreatePayload: CreateAuctionPayload = {
    title: 'Test Service',
    description: 'Test Description',
    service_type: 'plumbing',
    region: 'Zurich',
    start_time: '2024-09-14T10:00:00Z',
    end_time: '2024-09-14T12:00:00Z',
    starting_price: 50,
    reserve_price: null,
    bid_increment: 5,
    auto_extend: true,
    auto_extend_minutes: 5
  }

  describe('createAuction', () => {
    it('creates auction with valid payload', async () => {
      const expectedInsert: AuctionInsert = {
        handyman_id: 'handyman-1',
        title: 'Test Service',
        description: 'Test Description',
        service_type: 'plumbing',
        region: 'Zurich',
        start_time: '2024-09-14T10:00:00Z',
        end_time: '2024-09-14T12:00:00Z',
        starting_price: 50,
        reserve_price: null,
        bid_increment: 5,
        ends_at: '2024-09-14T12:00:00Z',
        status: 'active',
        auto_extend: true,
        auto_extend_minutes: 5
      }

      supabase.__mocks.single.mockResolvedValueOnce({
        data: mockAuction,
        error: null
      })

      const result = await auctionService.createAuction('handyman-1', mockCreatePayload)

      expect(supabase.from).toHaveBeenCalledWith('auctions')
      expect(supabase.__mocks.insert).toHaveBeenCalledWith(expectedInsert)
      expect(supabase.__mocks.select).toHaveBeenCalledWith('*')
      expect(supabase.__mocks.single).toHaveBeenCalled()
      expect(result).toEqual(mockAuction)
    })

    it('creates auction with minimal payload', async () => {
      const minimalPayload: CreateAuctionPayload = {
        title: 'Basic Service',
        service_type: 'electrical',
        region: 'Basel',
        start_time: '2024-09-14T14:00:00Z',
        end_time: '2024-09-14T16:00:00Z',
        starting_price: 40
      }

      const expectedInsert: AuctionInsert = {
        handyman_id: 'handyman-1',
        title: 'Basic Service',
        description: null,
        service_type: 'electrical',
        region: 'Basel',
        start_time: '2024-09-14T14:00:00Z',
        end_time: '2024-09-14T16:00:00Z',
        starting_price: 40,
        reserve_price: null,
        bid_increment: null,
        ends_at: '2024-09-14T16:00:00Z',
        status: 'active',
        auto_extend: null,
        auto_extend_minutes: null
      }

      supabase.__mocks.single.mockResolvedValueOnce({
        data: mockAuction,
        error: null
      })

      await auctionService.createAuction('handyman-1', minimalPayload)

      expect(supabase.__mocks.insert).toHaveBeenCalledWith(expectedInsert)
    })

    it('throws error when database operation fails', async () => {
      const error = createMockSupabaseError('Database error')
      supabase.__mocks.single.mockResolvedValueOnce({
        data: null,
        error
      })

      await expect(
        auctionService.createAuction('handyman-1', mockCreatePayload)
      ).rejects.toEqual(error)
    })
  })

  describe('listAuctions', () => {
    const mockAuctions = [mockAuction, { ...mockAuction, id: 'auction-2' }]

    it('lists all auctions without filters', async () => {
      supabase.__mocks.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: mockAuctions,
          error: null
        })
      })

      const result = await auctionService.listAuctions()

      expect(supabase.from).toHaveBeenCalledWith('auctions')
      expect(result).toEqual(mockAuctions)
    })

    it('applies status filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({
          data: mockAuctions,
          error: null
        })
      }
      supabase.__mocks.from.mockReturnValueOnce(mockQuery)

      const filters: AuctionFilters = { status: 'active' }
      await auctionService.listAuctions(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active')
    })

    it('applies multiple filters', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis()
      }
      mockQuery.eq.mockResolvedValueOnce({
        data: mockAuctions,
        error: null
      })
      supabase.__mocks.from.mockReturnValueOnce(mockQuery)

      const filters: AuctionFilters = {
        status: 'active',
        region: 'Zurich',
        serviceType: 'plumbing',
        handymanId: 'handyman-1'
      }
      await auctionService.listAuctions(filters)

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active')
      expect(mockQuery.eq).toHaveBeenCalledWith('region', 'Zurich')
      expect(mockQuery.eq).toHaveBeenCalledWith('service_type', 'plumbing')
      expect(mockQuery.eq).toHaveBeenCalledWith('handyman_id', 'handyman-1')
    })

    it('throws error when query fails', async () => {
      const error = createMockSupabaseError('Query failed')
      supabase.__mocks.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: null,
          error
        })
      })

      await expect(auctionService.listAuctions()).rejects.toEqual(error)
    })
  })

  describe('getAuction', () => {
    it('retrieves auction by id', async () => {
      supabase.__mocks.single.mockResolvedValueOnce({
        data: mockAuction,
        error: null
      })

      const result = await auctionService.getAuction('auction-1')

      expect(supabase.from).toHaveBeenCalledWith('auctions')
      expect(supabase.__mocks.select).toHaveBeenCalledWith('*')
      expect(supabase.__mocks.eq).toHaveBeenCalledWith('id', 'auction-1')
      expect(supabase.__mocks.single).toHaveBeenCalled()
      expect(result).toEqual(mockAuction)
    })

    it('throws error when auction not found', async () => {
      const error = createMockSupabaseError('Auction not found', 'PGRST116')
      supabase.__mocks.single.mockResolvedValueOnce({
        data: null,
        error
      })

      await expect(auctionService.getAuction('nonexistent')).rejects.toEqual(error)
    })
  })

  describe('placeBid', () => {
    const mockBidInput: BidInput = {
      auctionId: 'auction-1',
      bidderId: 'bidder-1',
      amount: 55
    }

    it('places bid successfully', async () => {
      const mockRpcResponse = {
        success: true,
        bid_id: 'bid-1',
        new_highest_bid: 55
      }

      supabase.rpc = jest.fn().mockResolvedValueOnce({
        data: mockRpcResponse,
        error: null
      })

      const result = await auctionService.placeBid(mockBidInput)

      expect(supabase.rpc).toHaveBeenCalledWith('place_auction_bid', {
        p_auction_id: 'auction-1',
        p_bidder_id: 'bidder-1',
        p_bid_amount: 55,
        p_max_auto_bid: null
      })

      expect(result).toEqual({
        success: true,
        bidId: 'bid-1',
        newHighestBid: 55
      })
    })

    it('places bid with max auto bid', async () => {
      const bidInputWithMax: BidInput = {
        ...mockBidInput,
        maxAutoBid: 100
      }

      supabase.rpc = jest.fn().mockResolvedValueOnce({
        data: { success: true },
        error: null
      })

      await auctionService.placeBid(bidInputWithMax)

      expect(supabase.rpc).toHaveBeenCalledWith('place_auction_bid', {
        p_auction_id: 'auction-1',
        p_bidder_id: 'bidder-1',
        p_bid_amount: 55,
        p_max_auto_bid: 100
      })
    })

    it('handles RPC function error', async () => {
      const error = createMockSupabaseError('Bid amount too low')
      supabase.rpc = jest.fn().mockResolvedValueOnce({
        data: null,
        error
      })

      const result = await auctionService.placeBid(mockBidInput)

      expect(result).toEqual({
        success: false,
        error: 'Bid amount too low'
      })
    })

    it('handles business logic error from RPC function', async () => {
      const mockRpcResponse = {
        success: false,
        error: 'Auction has ended'
      }

      supabase.rpc = jest.fn().mockResolvedValueOnce({
        data: mockRpcResponse,
        error: null
      })

      const result = await auctionService.placeBid(mockBidInput)

      expect(result).toEqual({
        success: false,
        error: 'Auction has ended'
      })
    })

    it('handles undefined RPC response', async () => {
      supabase.rpc = jest.fn().mockResolvedValueOnce({
        data: null,
        error: null
      })

      const result = await auctionService.placeBid(mockBidInput)

      expect(result).toEqual({
        success: true,
        error: undefined,
        bidId: undefined,
        newHighestBid: undefined
      })
    })
  })
})