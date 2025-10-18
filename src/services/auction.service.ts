import { supabase } from '../lib/supabase'
import { Auction, AuctionInsert } from '../types/database.types'
import { AuctionFilters, CreateAuctionPayload, BidInput, BidResult } from '../types/auction.types'

class AuctionService {
  async createAuction(handymanId: string, payload: CreateAuctionPayload) {
    console.log('[AuctionService] createAuction', { handymanId })

    if (!handymanId) {
      throw new Error('Handyman ID is required')
    }
    if (!payload.title?.trim()) {
      throw new Error('Auction title is required')
    }
    if (!payload.service_type?.trim()) {
      throw new Error('Service type is required')
    }
    if (!payload.region?.trim()) {
      throw new Error('Region is required')
    }
    if (payload.starting_price < 20) {
      throw new Error('Starting price must be at least CHF 20')
    }

    const startTime = new Date(payload.start_time)
    const endTime = new Date(payload.end_time)
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000

    if (durationMinutes < 15) {
      throw new Error('Auction duration must be at least 15 minutes')
    }

    if (durationMinutes > 24 * 60) {
      throw new Error('Auction duration cannot exceed 24 hours')
    }

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
      ends_at: payload.end_time,
      status: 'active',
      auto_extend: payload.auto_extend ?? null,
      auto_extend_minutes: payload.auto_extend_minutes ?? null,
    }

    console.log('[AuctionService] insert payload', insert)

    try {
      let attempt = 0
      const maxAttempts = 5
      let retryPayload: Record<string, unknown> = { ...insert }
      let data: Auction | null = null
      let error: any = null

      while (attempt < maxAttempts) {
        const response = await supabase
          .from('auctions')
          .insert(retryPayload)
          .select('*')
          .single()

        data = response.data as Auction | null
        error = response.error

        if (!error) {
          break
        }

        if (error.code === 'PGRST204' && error.message) {
          const match = error.message.match(/'([^']+)'/)
          const missingColumn = match?.[1]
          if (missingColumn && Object.prototype.hasOwnProperty.call(retryPayload, missingColumn)) {
            console.warn('[AuctionService] schema mismatch, retrying without column', missingColumn)
            delete retryPayload[missingColumn]
            attempt += 1
            continue
          }
        }

        break
      }

      if (error) {
        console.error('[AuctionService] Supabase error', error)
        throw error
      }

      console.log('[AuctionService] auction created', data)
      return data as Auction
    } catch (networkError) {
      console.error('[AuctionService] network error', networkError)

      if (!(networkError instanceof Error)) {
        throw networkError
      }

      const message = networkError.message.toLowerCase()
      if (message.includes('fetch')) {
        throw new Error('Network connection failed. Please check your internet connection.')
      }
      if (message.includes('timeout')) {
        throw new Error('Request timed out. Please try again.')
      }

      throw networkError
    }
  }

  async listAuctions(filters: AuctionFilters = {}) {
    const query = supabase.from('auctions').select('*').order('created_at', { ascending: false })

    if (filters.status) query.eq('status', filters.status)
    if (filters.region) query.eq('region', filters.region)
    if (filters.serviceType) query.eq('service_type', filters.serviceType)
    if (filters.handymanId) query.eq('handyman_id', filters.handymanId)

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

    if (data?.success && data?.new_highest_bid) {
      // Database triggers handle bidder notifications today
    }

    return {
      success: Boolean(data?.success ?? true),
      error: data?.error,
      bidId: data?.bid_id,
      newHighestBid: data?.new_highest_bid,
    }
  }

  /**
   * Close an auction manually (set status to 'ended')
   */
  async closeAuction(auctionId: string): Promise<Auction> {
    console.log(`[AuctionService] Attempting to close auction ${auctionId}`)
    try {
      // First, let's get the current auction to check its status
      console.log(`[AuctionService] Fetching current auction status for ${auctionId}`)
      const { data: currentAuction, error: fetchError } = await supabase
        .from('auctions')
        .select('id, status, title')
        .eq('id', auctionId)
        .single()
      
      if (fetchError) {
        console.error('[AuctionService] Error fetching auction:', fetchError)
        throw new Error(`Failed to fetch auction: ${fetchError.message}`)
      }
      
      if (!currentAuction) {
        console.error(`[AuctionService] Auction ${auctionId} not found`)
        throw new Error('Auction not found')
      }
      
      console.log(`[AuctionService] Current auction status: ${currentAuction.status}`)
      
      // Check if the auction is already closed or cancelled
      if (currentAuction.status === 'ended') {
        console.log(`[AuctionService] Auction ${auctionId} is already closed`)
        throw new Error('Auction is already closed')
      }
      
      if (currentAuction.status === 'cancelled') {
        console.log(`[AuctionService] Auction ${auctionId} is already cancelled`)
        throw new Error('Auction is already cancelled')
      }
      
      // Only update if the auction is currently active
      if (currentAuction.status !== 'active') {
        console.log(`[AuctionService] Auction ${auctionId} has invalid status: ${currentAuction.status}`)
        throw new Error(`Cannot close auction with status: ${currentAuction.status}`)
      }
      
      // Proceed with closing the auction
      console.log(`[AuctionService] Closing auction ${auctionId}`)
      const { data, error } = await supabase
        .from('auctions')
        .update({ status: 'ended', updated_at: new Date().toISOString() })
        .eq('id', auctionId)
        .eq('status', 'active') // Defensive check to ensure we only close active auctions
        .select()
        .single()
      
      if (error) {
        console.error('[AuctionService] Error closing auction:', error)
        // Provide more specific error messages based on the error type
        if (error.code === '23514') {
          // Constraint violation
          throw new Error('Auction status constraint violation. The auction may already be closed or have an invalid status.')
        } else if (error.code === 'PGRST116') {
          // No rows found (likely because status wasn't 'active')
          throw new Error('Auction cannot be closed. It may have already been closed or have a different status.')
        } else {
          // Generic error
          throw new Error(error.message || 'Failed to close auction due to database error.')
        }
      }
      
      if (!data) {
        console.error(`[AuctionService] No data returned when closing auction ${auctionId}`)
        throw new Error('Auction not found or already closed.')
      }
      
      console.log(`[AuctionService] Successfully closed auction ${auctionId}`)
      return data as Auction
    } catch (error) {
      console.error('[AuctionService] Exception in closeAuction:', error)
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('Failed to close auction due to unknown error.')
      }
    }
  }

  /**
   * Delete an auction permanently
   */
  async deleteAuction(auctionId: string): Promise<void> {
    const { error } = await supabase
      .from('auctions')
      .delete()
      .eq('id', auctionId)
    
    if (error) throw error
  }
}

export const auctionService = new AuctionService()
