import { useCallback, useEffect, useState } from 'react'
import { BookingWithSlot, listCustomerBookings } from '../services/booking.service'

export function useCustomerBookings(customerId?: string) {
  const [bookings, setBookings] = useState<BookingWithSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!customerId) {
      setBookings([])
      return
    }
    try {
      setLoading(true)
      const data = await listCustomerBookings(customerId)
      setBookings(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => { refresh() }, [refresh])

  return { bookings, loading, error, refresh }
}
