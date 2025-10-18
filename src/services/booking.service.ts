import { supabase } from '../lib/supabase'
import { Booking, TimeSlot } from '../types/database.types'
import { CHF_MINIMUM, CHF_INCREMENT } from '../utils/currency'

export interface BookingWithSlot extends Booking {
  slot?: TimeSlot | null
}

interface CreateBookingParams {
  slotId: string
  customerId: string
  workDescription: string
  address: string
}

interface RescheduleBookingParams {
  bookingId: string
  newSlotId: string
}

function assertSlot(slot: any): asserts slot is TimeSlot {
  if (!slot) {
    throw new Error('Time slot not found')
  }
}

function assertBooking(booking: any): asserts booking is Booking {
  if (!booking) {
    throw new Error('Booking not found')
  }
}

function toCHFIncrement(amount: number): number {
  if (!Number.isFinite(amount)) return CHF_MINIMUM
  const minimumApplied = Math.max(amount, CHF_MINIMUM)
  return Math.ceil(minimumApplied / CHF_INCREMENT) * CHF_INCREMENT
}

function hoursBetween(start: string, end: string): number {
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return 1
  }
  const diffMs = endMs - startMs
  return diffMs / (1000 * 60 * 60)
}

async function fetchBookingWithSlot(bookingId: string): Promise<BookingWithSlot> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, time_slots:slot_id(*)')
    .eq('id', bookingId)
    .maybeSingle()

  if (error) throw error
  assertBooking(data)
  const slot = (data as any).time_slots as TimeSlot | null | undefined
  return { ...data, slot: slot ?? null }
}

export async function listHandymanBookings(handymanId: string, limit?: number): Promise<BookingWithSlot[]> {
  const query = supabase
    .from('bookings')
    .select('*, time_slots:slot_id(*)')
    .eq('handyman_id', handymanId)
    .order('created_at', { ascending: false })
  let finalQuery = query
  if (limit) {
    finalQuery = finalQuery.limit(limit)
  }
  const { data, error } = await finalQuery
  if (error) throw error
  return (data ?? []).map((row: any) => ({ ...row, slot: row.time_slots ?? null }))
}

export async function listHandymanOpenSlots(handymanId: string, limit = 10): Promise<TimeSlot[]> {
  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .eq('handyman_id', handymanId)
    .eq('status', 'open')
    .order('start_time', { ascending: true })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as TimeSlot[]
}

export interface SlotSearchFilters {
  region?: string
  skill?: string
  startAfter?: string
  endBefore?: string
  limit?: number
}

export async function searchAvailableSlots(filters: SlotSearchFilters): Promise<TimeSlot[]> {
  const { region, skill, startAfter, endBefore, limit = 20 } = filters

  let handymanIds: string[] | undefined
  if (region || skill) {
    let profileQuery = supabase
      .from('handyman_profiles')
      .select('user_id')
    if (region) {
      profileQuery = profileQuery.eq('region', region)
    }
    if (skill) {
      profileQuery = profileQuery.contains('skills', [skill])
    }
    const profileResult = await profileQuery
    if (profileResult.error) throw profileResult.error
    handymanIds = (profileResult.data ?? []).map((row: any) => row.user_id)
    if (handymanIds.length === 0) {
      return []
    }
  }

  let slotQuery = supabase
    .from('time_slots')
    .select('*')
    .eq('status', 'open')
    .order('start_time', { ascending: true })
  if (handymanIds) {
    slotQuery = slotQuery.in('handyman_id', handymanIds)
  }
  if (startAfter) {
    slotQuery = slotQuery.gte('start_time', startAfter)
  }
  if (endBefore) {
    slotQuery = slotQuery.lte('end_time', endBefore)
  }
  slotQuery = slotQuery.limit(limit)

  const { data, error } = await slotQuery
  if (error) throw error
  return (data ?? []) as TimeSlot[]
}

export async function listCustomerBookings(customerId: string, limit?: number): Promise<BookingWithSlot[]> {
  const query = supabase
    .from('bookings')
    .select('*, time_slots:slot_id(*)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  let finalQuery = query
  if (limit) {
    finalQuery = finalQuery.limit(limit)
  }
  const { data, error } = await finalQuery
  if (error) throw error
  return (data ?? []).map((row: any) => ({ ...row, slot: row.time_slots ?? null }))
}

export async function createBookingFromSlot(params: CreateBookingParams): Promise<BookingWithSlot> {
  const { slotId, customerId, workDescription, address } = params

  const { data: slot, error: slotError } = await supabase
    .from('time_slots')
    .select('*')
    .eq('id', slotId)
    .maybeSingle()
  if (slotError) throw slotError
  assertSlot(slot)
  if (slot.status !== 'open') {
    throw new Error('Slot is no longer available')
  }

  const { data: profile, error: profileError } = await supabase
    .from('handyman_profiles')
    .select('hourly_rate, auto_confirm_calendar_bookings')
    .eq('user_id', slot.handyman_id)
    .maybeSingle()
  if (profileError) throw profileError
  if (!profile) {
    throw new Error('Missing handyman profile for booking')
  }

  const durationHours = hoursBetween(slot.start_time, slot.end_time)
  const hourlyRate = Number(profile.hourly_rate ?? CHF_MINIMUM)
  const rawPrice = Math.max(durationHours * hourlyRate, CHF_MINIMUM)
  const totalPrice = toCHFIncrement(rawPrice)
  const status = profile.auto_confirm_calendar_bookings ? 'confirmed' : 'pending'

  const { data: created, error: createError } = await supabase
    .from('bookings')
    .insert({
      slot_id: slotId,
      customer_id: customerId,
      handyman_id: slot.handyman_id,
      total_price: totalPrice,
      work_description: workDescription,
      customer_address: address,
      booking_type: 'calendar',
      status,
    })
    .select()
    .maybeSingle()

  if (createError) throw createError
  assertBooking(created)

  const { error: slotUpdateError } = await supabase
    .from('time_slots')
    .update({ status: 'booked' })
    .eq('id', slotId)
  if (slotUpdateError) throw slotUpdateError

  return fetchBookingWithSlot(created.id)
}

export async function cancelBooking(bookingId: string): Promise<BookingWithSlot> {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'canceled' })
    .eq('id', bookingId)
    .select('id, slot_id')
    .maybeSingle()
  if (error) throw error
  assertBooking(data)
  if (data.slot_id) {
    await supabase.from('time_slots').update({ status: 'open' }).eq('id', data.slot_id)
  }
  return fetchBookingWithSlot(bookingId)
}

export async function rescheduleBooking(params: RescheduleBookingParams): Promise<BookingWithSlot> {
  const { bookingId, newSlotId } = params

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, slot_id, handyman_id')
    .eq('id', bookingId)
    .maybeSingle()
  if (bookingError) throw bookingError
  assertBooking(booking)

  if (booking.slot_id === newSlotId) {
    return fetchBookingWithSlot(bookingId)
  }

  const { data: newSlot, error: slotError } = await supabase
    .from('time_slots')
    .select('*')
    .eq('id', newSlotId)
    .maybeSingle()
  if (slotError) throw slotError
  assertSlot(newSlot)
  if (newSlot.status !== 'open') {
    throw new Error('Selected slot is not available')
  }
  if (newSlot.handyman_id !== booking.handyman_id) {
    throw new Error('Slot belongs to a different handyman')
  }

  const { data: profile, error: profileError } = await supabase
    .from('handyman_profiles')
    .select('hourly_rate, auto_confirm_calendar_bookings')
    .eq('user_id', booking.handyman_id)
    .maybeSingle()
  if (profileError) throw profileError
  if (!profile) {
    throw new Error('Missing handyman profile for reschedule')
  }

  const durationHours = hoursBetween(newSlot.start_time, newSlot.end_time)
  const hourlyRate = Number(profile.hourly_rate ?? CHF_MINIMUM)
  const rawPrice = Math.max(durationHours * hourlyRate, CHF_MINIMUM)
  const totalPrice = toCHFIncrement(rawPrice)
  const status = profile.auto_confirm_calendar_bookings ? 'confirmed' : 'pending'

  const previousSlotId = booking.slot_id

  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      slot_id: newSlotId,
      total_price: totalPrice,
      status,
    })
    .eq('id', bookingId)
  if (updateError) throw updateError

  const { error: newSlotUpdateError } = await supabase
    .from('time_slots')
    .update({ status: 'booked' })
    .eq('id', newSlotId)
  if (newSlotUpdateError) {
    await supabase.from('bookings').update({ slot_id: previousSlotId }).eq('id', bookingId)
    throw newSlotUpdateError
  }

  if (previousSlotId) {
    await supabase.from('time_slots').update({ status: 'open' }).eq('id', previousSlotId)
  }

  return fetchBookingWithSlot(bookingId)
}
