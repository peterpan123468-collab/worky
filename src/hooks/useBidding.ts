import { useCallback, useEffect, useRef, useState } from 'react'
import { auctionService } from '../services/auction.service'
import { supabase } from '../lib/supabase'
import { AuctionBid } from '../types/database.types'

interface BiddingOptions {
  currentUserId?: string
  onOutbid?: () => void
}

export function useBidding(auctionId: string, opts: BiddingOptions = {}) {
  const [highestBid, setHighestBid] = useState<number | null>(null)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bids, setBids] = useState<AuctionBid[]>([])
  const wasWinningRef = useRef<boolean>(false)

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
        if (data) {
          const list = data as AuctionBid[]
          setBids(list)
          if (opts.currentUserId) {
            const top = list[0]
            wasWinningRef.current = !!(top && top.is_winning_bid && top.bidder_id === opts.currentUserId)
          }
        }
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
          if (opts.currentUserId && bid.is_winning_bid) {
            const nowWinning = bid.bidder_id === opts.currentUserId
            if (wasWinningRef.current && !nowWinning) {
              opts.onOutbid?.()
            }
            wasWinningRef.current = nowWinning
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [auctionId, opts.currentUserId])

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
