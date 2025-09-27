import { supabase } from '../lib/supabase'
import { Auction, AuctionInsert, AuctionBid } from '../types/database.types'
import { AuctionFilters, CreateAuctionPayload, BidInput, BidResult } from '../types/auction.types'
import { notificationService } from '../services/notification.service'

class AuctionService {
  async createAuction(handymanId: string, payload: CreateAuctionPayload) {
    console.log('🏪 AuctionService.createAuction called')
    console.log('👤 Handyman ID:', handymanId)
    console.log('📦 Payload:', JSON.stringify(payload, null, 2))

    // Validate inputs
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
    
    // Ensure auction duration is reasonable (at least 15 minutes, max 24 hours)
    const startTime = new Date(payload.start_time)
    const endTime = new Date(payload.end_time)
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationMinutes = durationMs / (1000 * 60)
    
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
      ends_at: payload.end_time, // alias for clarity with DB function names
      status: 'active',
      auto_extend: payload.auto_extend ?? null,
      auto_extend_minutes: payload.auto_extend_minutes ?? null,
    }

    console.log('📝 Database insert payload:', JSON.stringify(insert, null, 2))

    try {
      // Attempt insert; on PGRST204, strip the missing column and retry a few times
      let attempt = 0
      let maxAttempts = 5
      let retryPayload: any = { ...insert }
      let data: any = null
      let error: any = null

      while (attempt < maxAttempts) {
        const res = await supabase
          .from('auctions')
          .insert(retryPayload)
          .select('*')
          .single()

        data = res.data
        error = res.error

        if (!error) break

        // If schema cache says a column is missing, remove it and retry
        if (error.code === 'PGRST204' && error.message) {
          const match = error.message.match(/'([^']+)'/)
          const missingCol = match?.[1]
          if (missingCol && retryPayload.hasOwnProperty(missingCol)) {
            console.warn(`⚠️ Schema mismatch: column ${missingCol} missing. Retrying without it...`)
            delete retryPayload[missingCol]
            attempt++
            continue
          }
        }
        // Non-retriable error
        break
      }

      if (error) {
        console.error('❌ Supabase error:', error)
        console.error('Error code:', error.code)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        console.error('Error message:', error.message)

        // Enhanced error messages
        if (error.code === '42501') {
          throw new Error('Database access denied. Please check your authentication and permissions.')
        } else if (error.code === '23505') {
          throw new Error('Auction already exists with these parameters.')
        } else if (error.code === '23503') {
          throw new Error('Invalid reference data. Please check handyman ID.')
        } else if (error.message.includes('JWT')) {
          throw new Error('Authentication token expired. Please log out and log back in.')
        } else {
          throw new Error(`Database error (${error.code}): ${error.message}`)
        }
      }

      console.log('✅ Auction created successfully:', data)
      return data as Auction

    } catch (networkError) {
      console.error('🌐 Network/Connection error:', networkError)

      if (networkError instanceof Error) {
        if (networkError.message.includes('fetch')) {
          throw new Error('Network connection failed. Please check your internet connection.')
        } else if (networkError.message.includes('timeout')) {
          throw new Error('Request timed out. Please try again.')
        } else {
          // Re-throw our custom errors or unknown errors
          throw networkError
        }
      }

      throw new Error('Unknown network error occurred.')
    }
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
    
    // Send notification to the previous highest bidder if they were outbid
    if (data?.success && data?.new_highest_bid) {
      // The database function already handles sending outbid notifications
      // We could add additional notifications here if needed
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
