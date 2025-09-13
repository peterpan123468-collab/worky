import { supabase } from '../lib/supabase'
import { AuctionBid, Booking, TimeSlot } from '../types/database.types'

export async function getHandymanAuctionIds(handymanId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('auctions')
    .select('id')
    .eq('handyman_id', handymanId)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return (data ?? []).map((r) => r.id)
}

export async function getRecentBidsForHandyman(handymanId: string, limit = 5): Promise<AuctionBid[]> {
  const ids = await getHandymanAuctionIds(handymanId)
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from('auction_bids')
    .select('*')
    .in('auction_id', ids)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as AuctionBid[]
}

export interface HandymanStats {
  activeBookings: number
  monthRevenue: number
}

export async function getHandymanStats(handymanId: string): Promise<HandymanStats> {
  // Pull recent bookings and compute simple stats client-side
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('handyman_id', handymanId)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error

  const activeBookings = (bookings ?? []).filter((b) => b.status === 'confirmed' || b.status === 'pending').length
  const monthRevenue = (bookings ?? [])
    .filter((b) => new Date(b.created_at) >= startOfMonth)
    .reduce((sum, b) => sum + (b.winning_bid_amount ?? b.total_price ?? 0), 0)

  return { activeBookings, monthRevenue }
}

export async function getAvailableSlots(limit = 5): Promise<TimeSlot[]> {
  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .eq('status', 'open')
    .order('start_time', { ascending: true })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as TimeSlot[]
}

export async function getCustomerBookings(customerId: string, limit = 5): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Booking[]
}

