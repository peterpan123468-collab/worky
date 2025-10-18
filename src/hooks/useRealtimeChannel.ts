import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

type ChangeConfig = {
  event?: string
  schema: string
  table: string
  filter?: string
}

interface UseRealtimeChannelOptions {
  channelName: string
  changeConfig: ChangeConfig
  enabled?: boolean
  onPayload?: (payload: any) => void
  refresh?: () => void | Promise<void>
  pollIntervalMs?: number
  refreshOnEvent?: boolean
}

const DEFAULT_INTERVAL = 45000

export function useRealtimeChannel({
  channelName,
  changeConfig,
  enabled = true,
  onPayload,
  refresh,
  pollIntervalMs = DEFAULT_INTERVAL,
  refreshOnEvent = true,
}: UseRealtimeChannelOptions) {
  const refreshRef = useRef(refresh)
  const payloadRef = useRef(onPayload)

  useEffect(() => { refreshRef.current = refresh }, [refresh])
  useEffect(() => { payloadRef.current = onPayload }, [onPayload])

  useEffect(() => {
    if (!enabled) return undefined

    const channel = supabase.channel(channelName)

    const handler = (payload: any) => {
      payloadRef.current?.(payload)
      if (refreshOnEvent && refreshRef.current) {
        Promise.resolve(refreshRef.current()).catch(() => {})
      }
    }

    channel.on('postgres_changes', changeConfig, handler).subscribe()

    const interval = setInterval(() => {
      if (refreshRef.current) {
        Promise.resolve(refreshRef.current()).catch(() => {})
      }
    }, pollIntervalMs)

    return () => {
      clearInterval(interval)
      if (typeof channel.unsubscribe === 'function') {
        channel.unsubscribe()
      }
      if (typeof supabase.removeChannel === 'function') {
        supabase.removeChannel(channel)
      }
    }
  }, [channelName, JSON.stringify(changeConfig), enabled, pollIntervalMs, refreshOnEvent])
}
