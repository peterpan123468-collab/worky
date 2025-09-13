import { useCallback, useEffect, useState } from 'react'
import { auctionService } from '../services/auction.service'
import { supabase } from '../lib/supabase'

export function useBidding(auctionId: string) {
  const [highestBid, setHighestBid] = useState<number | null>(null)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!auctionId) return
    const channel = supabase
      .channel(`auction:${auctionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_bids', filter: `auction_id=eq.${auctionId}` },
        (payload) => {
          const bid = payload.new as { bid_amount?: number }
          if (bid?.bid_amount) setHighestBid((prev) => Math.max(prev ?? 0, bid.bid_amount!))
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

  return { highestBid, placing, error, placeBid }
}

