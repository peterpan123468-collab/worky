import { useEffect, useState, useCallback } from 'react'
import { AuctionBid } from '../types/database.types'
import { getHandymanStats, getRecentBidsForHandyman, HandymanStats } from '../services/dashboard.service'

export function useHandymanDashboard(handymanId?: string) {
  const [stats, setStats] = useState<HandymanStats>({ activeBookings: 0, monthRevenue: 0 })
  const [recentBids, setRecentBids] = useState<AuctionBid[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!handymanId) return
    try {
      setLoading(true)
      const [s, bids] = await Promise.all([
        getHandymanStats(handymanId),
        getRecentBidsForHandyman(handymanId, 5),
      ])
      setStats(s)
      setRecentBids(bids)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [handymanId])

  useEffect(() => { refresh() }, [refresh])

  return { stats, recentBids, loading, error, refresh }
}

