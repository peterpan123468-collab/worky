import { supabase } from '../lib/supabase'
import { TimeSlot, SlotStatus, BookingType } from '../types/database.types'

function assertSlot(row: any): asserts row is TimeSlot {
  if (!row) throw new Error('Slot not found')
}

export async function listHandymanSlots(handymanId: string, limit = 40): Promise<TimeSlot[]> {
  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .eq('handyman_id', handymanId)
    .order('start_time', { ascending: true })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as TimeSlot[]
}

export interface CreateSlotParams {
  handymanId: string
  startTime: string
  endTime: string
  bookingType?: BookingType
}

function validateInterval(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) {
    throw new Error('Invalid start or end time')
  }
  if (endDate <= startDate) {
    throw new Error('End time must be after start time')
  }
}

export async function createTimeSlot(params: CreateSlotParams): Promise<TimeSlot> {
  const { handymanId, startTime, endTime, bookingType = 'calendar' } = params
  validateInterval(startTime, endTime)
  const { data, error } = await supabase
    .from('time_slots')
    .insert({
      handyman_id: handymanId,
      start_time: startTime,
      end_time: endTime,
      status: 'open',
      booking_type: bookingType,
    })
    .select()
    .maybeSingle()
  if (error) throw error
  assertSlot(data)
  return data
}

export async function updateSlotStatus(slotId: string, status: SlotStatus): Promise<TimeSlot> {
  const { data, error } = await supabase
    .from('time_slots')
    .update({ status })
    .eq('id', slotId)
    .select()
    .maybeSingle()
  if (error) throw error
  assertSlot(data)
  return data
}

export async function deleteSlot(slotId: string): Promise<void> {
  const { error } = await supabase
    .from('time_slots')
    .delete()
    .eq('id', slotId)
  if (error) throw error
}

export const availabilityService = {
  listHandymanSlots,
  createTimeSlot,
  updateSlotStatus,
  deleteSlot,
}
