import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface AuctionStats {
  totalAuctions: number
  activeAuctions: number
  completedAuctions: number
  totalRevenue: number
  avgBidCount: number
  winRate: number
}

export function useAuctionAnalytics(handymanId?: string) {
  const [stats, setStats] = useState<AuctionStats>({
    totalAuctions: 0,
    activeAuctions: 0,
    completedAuctions: 0,
    totalRevenue: 0,
    avgBidCount: 0,
    winRate: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!handymanId) return

    try {
      setLoading(true)
      
      // Fetch total auctions
      const { count: totalAuctions, error: totalError } = await supabase
        .from('auctions')
        .select('*', { count: 'exact', head: true })
        .eq('handyman_id', handymanId)
      
      if (totalError) throw totalError

      // Fetch active auctions
      const { count: activeAuctions, error: activeError } = await supabase
        .from('auctions')
        .select('*', { count: 'exact', head: true })
        .eq('handyman_id', handymanId)
        .eq('status', 'active')
      
      if (activeError) throw activeError

      // Fetch completed auctions (both 'ended' and 'cancelled')
      const { count: completedAuctions, error: completedError } = await supabase
        .from('auctions')
        .select('*', { count: 'exact', head: true })
        .eq('handyman_id', handymanId)
        .in('status', ['ended', 'cancelled'])
      
      if (completedError) throw completedError

      // Fetch revenue from completed auctions (only 'ended' ones have revenue)
      const { data: revenueData, error: revenueError } = await supabase
        .from('auctions')
        .select('current_highest_bid')
        .eq('handyman_id', handymanId)
        .eq('status', 'ended')
        .not('current_highest_bid', 'is', null)
      
      if (revenueError) throw revenueError
      
      const totalRevenue = revenueData?.reduce((sum, auction) => 
        sum + (auction.current_highest_bid || 0), 0) || 0

      // Fetch bid statistics
      const { data: auctionIdsData, error: idsError } = await supabase
        .from('auctions')
        .select('id')
        .eq('handyman_id', handymanId)
      
      if (idsError) throw idsError
      
      const auctionIds = auctionIdsData?.map(a => a.id) || []
      
      if (auctionIds.length > 0) {
        const { count: totalBids, error: bidsError } = await supabase
          .from('auction_bids')
          .select('*', { count: 'exact', head: true })
          .in('auction_id', auctionIds)
        
        if (bidsError) throw bidsError
        
        const avgBidCount = totalAuctions && totalAuctions > 0 
          ? (totalBids || 0) / totalAuctions 
          : 0

        // Calculate win rate (auctions with bids / total auctions)
        const { count: auctionsWithBids, error: winRateError } = await supabase
          .from('auctions')
          .select('*', { count: 'exact', head: true })
          .eq('handyman_id', handymanId)
          .gt('current_highest_bid', 0)
        
        if (winRateError) throw winRateError
        
        const winRate = totalAuctions && totalAuctions > 0 
          ? (auctionsWithBids || 0) / totalAuctions 
          : 0

        setStats({
          totalAuctions: totalAuctions || 0,
          activeAuctions: activeAuctions || 0,
          completedAuctions: completedAuctions || 0,
          totalRevenue,
          avgBidCount,
          winRate
        })
      } else {
        setStats({
          totalAuctions: totalAuctions || 0,
          activeAuctions: activeAuctions || 0,
          completedAuctions: completedAuctions || 0,
          totalRevenue,
          avgBidCount: 0,
          winRate: 0
        })
      }
      
      setError(null)
    } catch (err) {
      console.error('Error fetching auction analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [handymanId])

  useEffect(() => {
    fetchStats()
    
    // Set up real-time subscription for auction changes
    if (handymanId) {
      const channel = supabase
        .channel('auction-analytics-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'auctions',
            filter: `handyman_id=eq.${handymanId}`
          },
          () => {
            fetchStats()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'auctions',
            filter: `handyman_id=eq.${handymanId}`
          },
          () => {
            fetchStats()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'auctions',
            filter: `handyman_id=eq.${handymanId}`
          },
          () => {
            fetchStats()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [fetchStats, handymanId])

  return { stats, loading, error, refresh: fetchStats }
}