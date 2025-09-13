import { useCallback, useEffect, useState } from 'react'
import { Booking, TimeSlot } from '../types/database.types'
import { getAvailableSlots, getCustomerBookings } from '../services/dashboard.service'

export function useCustomerDashboard(customerId?: string) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const [s, b] = await Promise.all([
        getAvailableSlots(5),
        customerId ? getCustomerBookings(customerId, 5) : Promise.resolve([] as Booking[]),
      ])
      setSlots(s)
      setBookings(b as Booking[])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => { refresh() }, [refresh])

  return { slots, bookings, loading, error, refresh }
}

