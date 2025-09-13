import { supabase } from '../lib/supabase'
import { Auction, AuctionInsert, AuctionBid } from '../types/database.types'
import { AuctionFilters, CreateAuctionPayload, BidInput, BidResult } from '../types/auction.types'

class AuctionService {
  async createAuction(handymanId: string, payload: CreateAuctionPayload) {
    const insert: AuctionInsert = {
      handyman_id: handymanId,
      title: payload.title,
      description: payload.description ?? null,
      service_type: payload.service_type,
      region: payload.region,
      start_time: payload.start_time,
      end_time: payload.end_time,
      starting_price: payload.starting_price,
      reserve_price: payload.reserve_price ?? null,
      bid_increment: payload.bid_increment ?? null,
      ends_at: payload.end_time, // alias for clarity with DB function names
      status: 'active',
      auto_extend: payload.auto_extend ?? null,
      auto_extend_minutes: payload.auto_extend_minutes ?? null,
    }

    const { data, error } = await supabase
      .from('auctions')
      .insert(insert)
      .select('*')
      .single()

    if (error) throw error
    return data as Auction
  }

  async listAuctions(filters: AuctionFilters = {}) {
    let query = supabase.from('auctions').select('*').order('created_at', { ascending: false })

    if (filters.status) query = query.eq('status', filters.status)
    if (filters.region) query = query.eq('region', filters.region)
    if (filters.serviceType) query = query.eq('service_type', filters.serviceType)
    if (filters.handymanId) query = query.eq('handyman_id', filters.handymanId)

    const { data, error } = await query
    if (error) throw error
    return data as Auction[]
  }

  async getAuction(id: string) {
    const { data, error } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Auction
  }

  async placeBid(input: BidInput): Promise<BidResult> {
    const { data, error } = await supabase.rpc('place_auction_bid', {
      p_auction_id: input.auctionId,
      p_bidder_id: input.bidderId,
      p_bid_amount: input.amount,
      p_max_auto_bid: input.maxAutoBid ?? null,
    })

    if (error) {
      return { success: false, error: error.message }
    }
    return {
      success: Boolean(data?.success ?? true),
      error: data?.error,
      bidId: data?.bid_id,
      newHighestBid: data?.new_highest_bid,
    }
  }
}

export const auctionService = new AuctionService()

