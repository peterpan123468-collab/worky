import { useCallback, useEffect, useState } from 'react'
import { auctionService } from '../services/auction.service'
import { supabase } from '../lib/supabase'
import { AuctionBid } from '../types/database.types'

export function useBidding(auctionId: string) {
  const [highestBid, setHighestBid] = useState<number | null>(null)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bids, setBids] = useState<AuctionBid[]>([])

  useEffect(() => {
    if (!auctionId) return
    // Initial load of recent bids
    supabase
      .from('auction_bids')
      .select('*')
      .eq('auction_id', auctionId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setBids(data as AuctionBid[])
      })
    const channel = supabase
      .channel(`auction:${auctionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_bids', filter: `auction_id=eq.${auctionId}` },
        (payload) => {
          const bid = payload.new as AuctionBid
          if (bid?.bid_amount) setHighestBid((prev) => Math.max(prev ?? 0, bid.bid_amount))
          if (bid) setBids((prev) => [bid as AuctionBid, ...prev].slice(0, 20))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [auctionId])

  const placeBid = useCallback(async (bidderId: string, amount: number, maxAutoBid?: number) => {
    try {
      setPlacing(true)
      setError(null)
      const result = await auctionService.placeBid({ auctionId, bidderId, amount, maxAutoBid })
      if (!result.success) setError(result.error || 'Bid failed')
      if (result.newHighestBid) setHighestBid(result.newHighestBid)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bid failed'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setPlacing(false)
    }
  }, [auctionId])

  return { highestBid, placing, error, placeBid, bids }
}
