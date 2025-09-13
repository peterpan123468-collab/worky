import { useEffect, useState, useCallback } from 'react'
import { auctionService } from '../services/auction.service'
import { Auction } from '../types/database.types'
import { AuctionFilters } from '../types/auction.types'
import { supabase } from '../lib/supabase'

export function useAuctions(initialFilters: AuctionFilters = {}) {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (filters: AuctionFilters = initialFilters) => {
    try {
      setLoading(true)
      const data = await auctionService.listAuctions(filters)
      setAuctions(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auctions')
    } finally {
      setLoading(false)
    }
  }, [initialFilters])

  useEffect(() => {
    refresh(initialFilters)
    // Basic realtime stub: listen to inserts/updates on auctions
    const channel = supabase
      .channel('auctions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auctions' }, () => {
        refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialFilters, refresh])

  return { auctions, loading, error, refresh }
}

