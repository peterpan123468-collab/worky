import { availabilityService, createTimeSlot, deleteSlot, listHandymanSlots, updateSlotStatus } from '../availability.service'
import { supabase } from '../../lib/supabase'

const mockFrom = (supabase as any).from

describe('availability.service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('lists handyman slots', async () => {
    const rows = [{ id: 'slot-1' }]
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: rows, error: null }),
    }
    mockFrom.mockReturnValue(query)

    const result = await listHandymanSlots('handyman-1', 20)

    expect(mockFrom).toHaveBeenCalledWith('time_slots')
    expect(query.eq).toHaveBeenCalledWith('handyman_id', 'handyman-1')
    expect(query.limit).toHaveBeenCalledWith(20)
    expect(result).toEqual(rows)
  })

  it('creates time slot', async () => {
    const insert = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'slot-1' }, error: null }),
    }
    mockFrom.mockReturnValue(insert)

    const result = await createTimeSlot({
      handymanId: 'handyman-1',
      startTime: '2025-01-20T09:00:00Z',
      endTime: '2025-01-20T11:00:00Z',
    })

    expect(insert.insert).toHaveBeenCalledWith({
      handyman_id: 'handyman-1',
      start_time: '2025-01-20T09:00:00Z',
      end_time: '2025-01-20T11:00:00Z',
      status: 'open',
      booking_type: 'calendar',
    })
    expect(result).toEqual({ id: 'slot-1' })
  })

  it('updates slot status', async () => {
    const update = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'slot-1', status: 'blocked' }, error: null }),
    }
    mockFrom.mockReturnValue(update)

    const result = await updateSlotStatus('slot-1', 'blocked')

    expect(update.update).toHaveBeenCalledWith({ status: 'blocked' })
    expect(update.eq).toHaveBeenCalledWith('id', 'slot-1')
    expect(result).toEqual({ id: 'slot-1', status: 'blocked' })
  })

  it('deletes slot', async () => {
    const del = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    }
    mockFrom.mockReturnValue(del)

    await deleteSlot('slot-1')

    expect(del.delete).toHaveBeenCalled()
    expect(del.eq).toHaveBeenCalledWith('id', 'slot-1')
  })

  it('re-exports service object', () => {
    expect(availabilityService).toBeDefined()
  })
})
