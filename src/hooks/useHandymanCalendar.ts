import { useCallback, useEffect, useState } from 'react'
import { listHandymanSlots } from '../services/availability.service'
import { listHandymanBookings, BookingWithSlot } from '../services/booking.service'
import { TimeSlot } from '../types/database.types'

export function useHandymanCalendar(handymanId?: string) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [bookings, setBookings] = useState<BookingWithSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!handymanId) {
      setSlots([])
      setBookings([])
      return
    }
    try {
      setLoading(true)
      const [slotsData, bookingsData] = await Promise.all([
        listHandymanSlots(handymanId),
        listHandymanBookings(handymanId),
      ])
      setSlots(slotsData)
      setBookings(bookingsData)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calendar data')
    } finally {
      setLoading(false)
    }
  }, [handymanId])

  useEffect(() => { 
    refresh() 
  }, [refresh])

  return { slots, bookings, loading, error, refresh }
}