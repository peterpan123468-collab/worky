import { createBookingFromSlot, cancelBooking, rescheduleBooking, listCustomerBookings, listHandymanOpenSlots, searchAvailableSlots } from '../booking.service'
import { supabase } from '../../lib/supabase'

const mockFrom = (supabase as any).from as jest.Mock

describe('Booking Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createBookingFromSlot', () => {
    it('creates booking and marks slot as booked', async () => {
      const slot = {
        id: 'slot-1',
        handyman_id: 'handyman-1',
        start_time: '2025-01-18T08:00:00Z',
        end_time: '2025-01-18T10:00:00Z',
        status: 'open',
      }
      const profile = {
        hourly_rate: 60,
        auto_confirm_calendar_bookings: true,
      }
      const inserted = {
        id: 'booking-1',
        slot_id: 'slot-1',
        customer_id: 'customer-1',
        handyman_id: 'handyman-1',
        status: 'confirmed',
        total_price: 120,
        work_description: 'Install lighting',
        customer_address: 'Zurich',
        booking_type: 'calendar',
        auction_id: null,
        winning_bid_amount: null,
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      }
      const bookingWithSlot = {
        ...inserted,
        time_slots: slot,
      }

      const slotSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: slot, error: null }),
      }

      const profileSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: profile, error: null }),
      }

      const bookingInsert = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: inserted, error: null }),
      }

      const slotUpdateEq = jest.fn().mockResolvedValue({ data: null, error: null })
      const slotUpdate = {
        update: jest.fn().mockReturnValue({ eq: slotUpdateEq }),
      }

      const bookingSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: bookingWithSlot, error: null }),
      }

      const queue = [
        { table: 'time_slots', query: slotSelect },
        { table: 'handyman_profiles', query: profileSelect },
        { table: 'bookings', query: bookingInsert },
        { table: 'time_slots', query: slotUpdate },
        { table: 'bookings', query: bookingSelect },
      ]

      mockFrom.mockImplementation((table: string) => {
        const next = queue.shift()
        if (!next) throw new Error(`Unexpected table ${table}`)
        expect(next.table).toBe(table)
        return next.query
      })

      const result = await createBookingFromSlot({
        slotId: 'slot-1',
        customerId: 'customer-1',
        workDescription: 'Install lighting',
        address: 'Zurich',
      })

      expect(slotSelect.select).toHaveBeenCalledWith('*')
      expect(profileSelect.eq).toHaveBeenCalledWith('user_id', 'handyman-1')
      expect(bookingInsert.insert).toHaveBeenCalledWith({
        slot_id: 'slot-1',
        customer_id: 'customer-1',
        handyman_id: 'handyman-1',
        total_price: 120,
        work_description: 'Install lighting',
        customer_address: 'Zurich',
        booking_type: 'calendar',
        status: 'confirmed',
      })
      expect(slotUpdate.update).toHaveBeenCalledWith({ status: 'booked' })
      expect(slotUpdateEq).toHaveBeenCalledWith('id', 'slot-1')
      expect(result.id).toBe('booking-1')
      expect(result.slot?.id).toBe('slot-1')
    })

    it('throws when slot is unavailable', async () => {
      const slot = {
        id: 'slot-1',
        handyman_id: 'handyman-1',
        start_time: '2025-01-18T08:00:00Z',
        end_time: '2025-01-18T10:00:00Z',
        status: 'booked',
      }

      const slotSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: slot, error: null }),
      }

      const queue = [
        { table: 'time_slots', query: slotSelect },
      ]

      mockFrom.mockImplementation((table: string) => {
        const next = queue.shift()
        if (!next) throw new Error(`Unexpected table ${table}`)
        expect(next.table).toBe(table)
        return next.query
      })

      await expect(
        createBookingFromSlot({
          slotId: 'slot-1',
          customerId: 'customer-1',
          workDescription: 'Install lighting',
          address: 'Zurich',
        })
      ).rejects.toThrow('Slot is no longer available')
    })
  })

  describe('cancelBooking', () => {
    it('marks booking canceled and reopens slot', async () => {
      const bookingRow = { id: 'booking-1', slot_id: 'slot-1' }
      const slotUpdateEq = jest.fn().mockResolvedValue({ data: null, error: null })

      const bookingUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: bookingRow, error: null }),
      }

      const slotUpdate = {
        update: jest.fn().mockReturnValue({ eq: slotUpdateEq }),
      }

      const bookingSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { ...bookingRow, time_slots: null },
          error: null,
        }),
      }

      const queue = [
        { table: 'bookings', query: bookingUpdate },
        { table: 'time_slots', query: slotUpdate },
        { table: 'bookings', query: bookingSelect },
      ]

      mockFrom.mockImplementation((table: string) => {
        const next = queue.shift()
        if (!next) throw new Error(`Unexpected table ${table}`)
        expect(next.table).toBe(table)
        return next.query
      })

      const result = await cancelBooking('booking-1')

      expect(bookingUpdate.update).toHaveBeenCalledWith({ status: 'canceled' })
      expect(slotUpdate.update).toHaveBeenCalledWith({ status: 'open' })
      expect(slotUpdateEq).toHaveBeenCalledWith('id', 'slot-1')
      expect(result.id).toBe('booking-1')
    })
  })

  describe('rescheduleBooking', () => {
    it('moves booking to new slot and updates statuses', async () => {
      const existingBooking = {
        id: 'booking-1',
        slot_id: 'slot-1',
        handyman_id: 'handyman-1',
      }
      const newSlot = {
        id: 'slot-2',
        handyman_id: 'handyman-1',
        start_time: '2025-01-20T09:00:00Z',
        end_time: '2025-01-20T11:00:00Z',
        status: 'open',
      }
      const profile = {
        hourly_rate: 75,
        auto_confirm_calendar_bookings: false,
      }
      const bookingWithSlot = {
        ...existingBooking,
        slot_id: 'slot-2',
        total_price: 150,
        status: 'pending',
        customer_id: 'customer-1',
        booking_type: 'calendar',
        customer_address: 'Bern',
        auction_id: null,
        winning_bid_amount: null,
        work_description: 'Repair',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
        time_slots: newSlot,
      }

      const bookingSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: existingBooking, error: null }),
      }

      const slotSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: newSlot, error: null }),
      }

      const profileSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: profile, error: null }),
      }

      const bookingUpdate = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      }

      bookingUpdate.update.mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: null, error: null }) })

      const newSlotUpdate = {
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: null, error: null }) }),
      }

      const oldSlotUpdate = {
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: null, error: null }) }),
      }

      const bookingWithSlotSelect = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: bookingWithSlot, error: null }),
      }

      const queue = [
        { table: 'bookings', query: bookingSelect },
        { table: 'time_slots', query: slotSelect },
        { table: 'handyman_profiles', query: profileSelect },
        { table: 'bookings', query: bookingUpdate },
        { table: 'time_slots', query: newSlotUpdate },
        { table: 'time_slots', query: oldSlotUpdate },
        { table: 'bookings', query: bookingWithSlotSelect },
      ]

      mockFrom.mockImplementation((table: string) => {
        const next = queue.shift()
        if (!next) throw new Error(`Unexpected table ${table}`)
        expect(next.table).toBe(table)
        return next.query
      })

      const result = await rescheduleBooking({ bookingId: 'booking-1', newSlotId: 'slot-2' })

      expect(result.slot?.id).toBe('slot-2')
      expect(newSlotUpdate.update).toHaveBeenCalledWith({ status: 'booked' })
      expect(oldSlotUpdate.update).toHaveBeenCalledWith({ status: 'open' })
    })
  })

  describe('listHandymanOpenSlots', () => {
    it('returns open slots ordered by start time', async () => {
      const slots = [
        {
          id: 'slot-1',
          handyman_id: 'handyman-1',
          start_time: '2025-01-18T08:00:00Z',
          end_time: '2025-01-18T10:00:00Z',
          status: 'open',
          calendar_event_id: null,
          is_synced_to_calendar: false,
          booking_type: 'calendar',
          created_at: '2025-01-10T00:00:00Z',
          updated_at: '2025-01-10T00:00:00Z',
        },
      ]

      const slotQuery: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      }
      slotQuery.then = jest.fn((resolve: any) => Promise.resolve(resolve({ data: slots, error: null })))

      mockFrom.mockImplementation((table: string) => {
        expect(table).toBe('time_slots')
        return slotQuery
      })

      const result = await listHandymanOpenSlots('handyman-1', 10)

      expect(slotQuery.eq).toHaveBeenNthCalledWith(1, 'handyman_id', 'handyman-1')
      expect(slotQuery.eq).toHaveBeenNthCalledWith(2, 'status', 'open')
      expect(slotQuery.order).toHaveBeenCalledWith('start_time', { ascending: true })
      expect(slotQuery.limit).toHaveBeenCalledWith(10)
      expect(result).toEqual(slots)
    })
  })

  describe('searchAvailableSlots', () => {
    it('filters slots by region and skill', async () => {
      const profilesQuery: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
      }
      profilesQuery.then = jest.fn((resolve: any) => Promise.resolve(resolve({ data: [{ user_id: 'handyman-1' }], error: null })))

      const slotsQuery: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      }
      slotsQuery.then = jest.fn((resolve: any) => Promise.resolve(resolve({ data: [{ id: 'slot-1' }], error: null })))

      const queue = [
        { table: 'handyman_profiles', query: profilesQuery },
        { table: 'time_slots', query: slotsQuery },
      ]

      mockFrom.mockImplementation((table: string) => {
        const next = queue.shift()
        if (!next) throw new Error(`Unexpected table ${table}`)
        expect(next.table).toBe(table)
        return next.query
      })

      const result = await searchAvailableSlots({ region: 'Zurich', skill: 'plumbing', startAfter: '2025-01-10', endBefore: '2025-01-30', limit: 5 })

      expect(profilesQuery.eq).toHaveBeenCalledWith('region', 'Zurich')
      expect(profilesQuery.contains).toHaveBeenCalledWith('skills', ['plumbing'])
      expect(slotsQuery.in).toHaveBeenCalledWith('handyman_id', ['handyman-1'])
      expect(slotsQuery.gte).toHaveBeenCalledWith('start_time', '2025-01-10')
      expect(slotsQuery.lte).toHaveBeenCalledWith('end_time', '2025-01-30')
      expect(slotsQuery.limit).toHaveBeenCalledWith(5)
      expect(result).toEqual([{ id: 'slot-1' }])
    })

    it('returns empty array when no profiles match filters', async () => {
      const profilesQuery: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
      }
      profilesQuery.then = jest.fn((resolve: any) => Promise.resolve(resolve({ data: [], error: null })))

      mockFrom.mockImplementation((table: string) => {
        expect(table).toBe('handyman_profiles')
        return profilesQuery
      })

      const result = await searchAvailableSlots({ region: 'Basel', skill: 'carpentry' })

      expect(result).toEqual([])
      expect(mockFrom).toHaveBeenCalledTimes(1)
    })
  })

  describe('listCustomerBookings', () => {
    it('returns bookings with slot data', async () => {
      const rows = [
        {
          id: 'booking-1',
          slot_id: 'slot-1',
          customer_id: 'customer-1',
          handyman_id: 'handyman-1',
          total_price: 120,
          status: 'confirmed',
          work_description: 'Install',
          customer_address: 'Basel',
          booking_type: 'calendar',
          auction_id: null,
          winning_bid_amount: null,
          created_at: '2025-01-10T00:00:00Z',
          updated_at: '2025-01-10T00:00:00Z',
          time_slots: {
            id: 'slot-1',
            handyman_id: 'handyman-1',
            start_time: '2025-01-18T08:00:00Z',
            end_time: '2025-01-18T10:00:00Z',
            status: 'booked',
          },
        },
      ]

      const listQuery: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      }

      const execute = jest.fn((resolve: any) => Promise.resolve(resolve({ data: rows, error: null })))
      listQuery.then = execute
      ;(listQuery.select as jest.Mock).mockReturnValue(listQuery)
      ;(listQuery.eq as jest.Mock).mockReturnValue(listQuery)
      ;(listQuery.order as jest.Mock).mockReturnValue(listQuery)
      ;(listQuery.limit as jest.Mock).mockReturnValue(listQuery)

      mockFrom.mockImplementation((table: string) => {
        expect(table).toBe('bookings')
        return listQuery
      })

      const result = await listCustomerBookings('customer-1', 10)

      expect(listQuery.limit).toHaveBeenCalledWith(10)
      expect(execute).toHaveBeenCalled()
      expect(result[0].slot?.id).toBe('slot-1')
    })
  })
})
