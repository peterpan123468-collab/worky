import {
  getHandymanAuctionIds,
  getRecentBidsForHandyman,
  getHandymanStats,
  getAvailableSlots,
  getCustomerBookings,
  HandymanStats
} from '../dashboard.service'
import { createMockSupabaseClient } from '../../test/mocks/supabase.mock'
import { AuctionBid, Booking, TimeSlot } from '../../types/database.types'

// Mock the supabase client
jest.mock('../../lib/supabase', () => ({
  supabase: createMockSupabaseClient()
}))

const { supabase } = require('../../lib/supabase')

describe('Dashboard Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset date to a known value for consistent testing
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-09-15T10:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('getHandymanAuctionIds', () => {
    const mockAuctions = [
      { id: 'auction-1' },
      { id: 'auction-2' },
      { id: 'auction-3' }
    ]

    it('retrieves auction IDs for handyman', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockAuctions,
          error: null
        })
      }
      supabase.from.mockReturnValue(mockQuery)

      const result = await getHandymanAuctionIds('handyman-1')

      expect(supabase.from).toHaveBeenCalledWith('auctions')
      expect(mockQuery.select).toHaveBeenCalledWith('id')
      expect(mockQuery.eq).toHaveBeenCalledWith('handyman_id', 'handyman-1')
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockQuery.limit).toHaveBeenCalledWith(200)
      expect(result).toEqual(['auction-1', 'auction-2', 'auction-3'])
    })

    it('handles empty results', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }
      supabase.from.mockReturnValue(mockQuery)

      const result = await getHandymanAuctionIds('handyman-1')

      expect(result).toEqual([])
    })

    it('throws error on database error', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }
      supabase.from.mockReturnValue(mockQuery)

      await expect(getHandymanAuctionIds('handyman-1')).rejects.toEqual({
        message: 'Database error'
      })
    })
  })

  describe('getRecentBidsForHandyman', () => {
    const mockBids: AuctionBid[] = [
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
        auction_id: 'auction-2',
        bidder_id: 'customer-2',
        bid_amount: 45,
        is_winning_bid: false,
        created_at: '2024-09-15T09:25:00Z'
      }
    ]

    it('retrieves recent bids for handyman auctions', async () => {
      // Mock getHandymanAuctionIds to return auction IDs
      const auctionIds = ['auction-1', 'auction-2']
      const auctionQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: auctionIds.map(id => ({ id })),
          error: null
        })
      }

      const bidQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockBids,
          error: null
        })
      }

      supabase.from.mockImplementation((table) => {
        return table === 'auctions' ? auctionQuery : bidQuery
      })

      const result = await getRecentBidsForHandyman('handyman-1', 5)

      expect(bidQuery.select).toHaveBeenCalledWith('*')
      expect(bidQuery.in).toHaveBeenCalledWith('auction_id', auctionIds)
      expect(bidQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(bidQuery.limit).toHaveBeenCalledWith(5)
      expect(result).toEqual(mockBids)
    })

    it('returns empty array when handyman has no auctions', async () => {
      const auctionQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }

      supabase.from.mockReturnValue(auctionQuery)

      const result = await getRecentBidsForHandyman('handyman-1')

      expect(result).toEqual([])
    })
  })

  describe('getHandymanStats', () => {
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
        handyman_id: 'handyman-1',
        customer_id: 'customer-2',
        status: 'pending',
        total_price: 80,
        winning_bid_amount: null,
        created_at: '2024-09-12T10:00:00Z',
        start_time: '2024-09-22T14:00:00Z',
        end_time: '2024-09-22T16:00:00Z'
      },
      {
        id: 'booking-3',
        handyman_id: 'handyman-1',
        customer_id: 'customer-3',
        status: 'completed',
        total_price: 60,
        winning_bid_amount: 75,
        created_at: '2024-08-25T10:00:00Z', // Previous month
        start_time: '2024-08-30T14:00:00Z',
        end_time: '2024-08-30T16:00:00Z'
      }
    ]

    it('calculates stats correctly', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockBookings,
          error: null
        })
      }
      supabase.from.mockReturnValue(mockQuery)

      const result = await getHandymanStats('handyman-1')

      expect(result).toEqual({
        activeBookings: 2, // confirmed + pending
        monthRevenue: 200 // 120 (winning_bid_amount) + 80 (total_price) for current month bookings
      })
    })

    it('handles empty bookings', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }
      supabase.from.mockReturnValue(mockQuery)

      const result = await getHandymanStats('handyman-1')

      expect(result).toEqual({
        activeBookings: 0,
        monthRevenue: 0
      })
    })

    it('prefers winning_bid_amount over total_price for revenue calculation', async () => {
      const bookingWithBoth: Booking[] = [{
        id: 'booking-1',
        handyman_id: 'handyman-1',
        customer_id: 'customer-1',
        status: 'confirmed',
        total_price: 100,
        winning_bid_amount: 150, // Should use this
        created_at: '2024-09-10T10:00:00Z',
        start_time: '2024-09-20T14:00:00Z',
        end_time: '2024-09-20T16:00:00Z'
      }]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: bookingWithBoth,
          error: null
        })
      }
      supabase.from.mockReturnValue(mockQuery)

      const result = await getHandymanStats('handyman-1')

      expect(result.monthRevenue).toBe(150)
    })
  })

  describe('getAvailableSlots', () => {
    const mockTimeSlots: TimeSlot[] = [
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

    it('retrieves available time slots', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockTimeSlots,
          error: null
        })
      }
      supabase.from.mockReturnValue(mockQuery)

      const result = await getAvailableSlots(5)

      expect(supabase.from).toHaveBeenCalledWith('time_slots')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'open')
      expect(mockQuery.order).toHaveBeenCalledWith('start_time', { ascending: true })
      expect(mockQuery.limit).toHaveBeenCalledWith(5)
      expect(result).toEqual(mockTimeSlots)
    })

    it('uses default limit when not specified', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockTimeSlots,
          error: null
        })
      }
      supabase.from.mockReturnValue(mockQuery)

      await getAvailableSlots()

      expect(mockQuery.limit).toHaveBeenCalledWith(5)
    })
  })

  describe('getCustomerBookings', () => {
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
      }
    ]

    it('retrieves customer bookings', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockBookings,
          error: null
        })
      }
      supabase.from.mockReturnValue(mockQuery)

      const result = await getCustomerBookings('customer-1', 5)

      expect(supabase.from).toHaveBeenCalledWith('bookings')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('customer_id', 'customer-1')
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockQuery.limit).toHaveBeenCalledWith(5)
      expect(result).toEqual(mockBookings)
    })

    it('handles null data response', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }
      supabase.from.mockReturnValue(mockQuery)

      const result = await getCustomerBookings('customer-1')

      expect(result).toEqual([])
    })
  })
})