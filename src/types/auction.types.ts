import { Auction, AuctionBid, AuctionInsert, AuctionStatus } from './database.types'

export interface AuctionFilters {
  status?: AuctionStatus | 'scheduled'
  region?: string
  serviceType?: string
  handymanId?: string
  customerOnlyActive?: boolean
}

export interface CreateAuctionPayload {
  title: string
  description?: string
  service_type: string
  region: string
  start_time: string // ISO
  end_time: string // ISO
  starting_price: number
  reserve_price?: number | null
  bid_increment?: number | null
  auto_extend?: boolean | null
  auto_extend_minutes?: number | null
}

export interface BidInput {
  auctionId: string
  bidderId: string
  amount: number
  maxAutoBid?: number
}

export interface BidResult {
  success: boolean
  error?: string
  bidId?: string
  newHighestBid?: number
}

export type AuctionWithMeta = Auction & {
  bids_count?: number
}

