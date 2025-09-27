import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { AuctionBid } from '../types/database.types'

export function useBiddingHistory(customerId?: string) {
  const [bids, setBids] = useState<AuctionBid[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBids = useCallback(async () => {
    if (!customerId) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('auction_bids')
        .select(`
          *,
          auction:auctions(title, service_type, region)
        `)
        .eq('bidder_id', customerId)
        .order('bid_time', { ascending: false })
        .limit(50)
      
      if (error) throw error
      
      setBids(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching bidding history:', err)
      setError(err instanceof Error ? err.message : 'Failed to load bidding history')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    fetchBids()
  }, [fetchBids])

  return { bids, loading, error, refresh: fetchBids }
}