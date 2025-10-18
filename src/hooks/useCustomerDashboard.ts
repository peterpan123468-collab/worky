import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRealtimeChannel } from './useRealtimeChannel'
import { listCustomerBookings, BookingWithSlot } from '../services/booking.service'
import { getAvailableSlots } from '../services/dashboard.service'
import { TimeSlot } from '../types/database.types'

export function useCustomerDashboard(customerId?: string) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [bookings, setBookings] = useState<BookingWithSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const [s, b] = await Promise.all([
        getAvailableSlots(5),
        customerId ? listCustomerBookings(customerId, 5) : Promise.resolve([]),
      ])
      setSlots(s)
      setBookings(b as BookingWithSlot[])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => { refresh() }, [refresh])

  const slotConfig = useMemo(() => ({
    event: '*',
    schema: 'public',
    table: 'time_slots',
    filter: 'status=eq.open',
  }), [])

  const bookingConfig = useMemo(() => ({
    event: '*',
    schema: 'public',
    table: 'bookings',
    filter: customerId ? `customer_id=eq.${customerId}` : undefined,
  }), [customerId])

  useRealtimeChannel({
    channelName: 'customer-dashboard-slots',
    changeConfig: slotConfig,
    refresh,
    refreshOnEvent: true,
    pollIntervalMs: 60000,
  })

  useRealtimeChannel({
    channelName: `customer-dashboard-bookings-${customerId ?? 'anon'}`,
    changeConfig: bookingConfig,
    refresh,
    enabled: Boolean(customerId),
    refreshOnEvent: true,
    pollIntervalMs: 60000,
  })

  return {
    slots,
    bookings,
    availableSlots: slots,
    myBookings: bookings,
    loading,
    error,
    refresh,
  }
}

