import { renderHook, act } from '@testing-library/react-native'
import { useHandymanAvailability } from '../useHandymanAvailability'
import * as availabilityService from '../../services/availability.service'
import { supabase } from '../../lib/supabase'

jest.mock('../../services/availability.service')
jest.mock('../../lib/supabase', () => require('../../__mocks__/lib/supabase'))

const mockAvailability = availabilityService as jest.Mocked<typeof availabilityService>
const mockSupabase = supabase as any

const sampleSlots = [
  {
    id: 'slot-1',
    handyman_id: 'handyman-1',
    start_time: '2025-01-20T09:00:00Z',
    end_time: '2025-01-20T10:00:00Z',
    status: 'open',
    calendar_event_id: null,
    is_synced_to_calendar: false,
    booking_type: 'calendar',
    created_at: '2025-01-10T00:00:00Z',
    updated_at: '2025-01-10T00:00:00Z',
  },
]

describe('useHandymanAvailability', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAvailability.listHandymanSlots.mockResolvedValue(sampleSlots as any)
  })

  it('loads slots for provided handyman', async () => {
    const { result } = renderHook(() => useHandymanAvailability('handyman-1'))

    await act(async () => {})

    expect(result.current.slots).toEqual(sampleSlots)
    expect(mockAvailability.listHandymanSlots).toHaveBeenCalledWith('handyman-1')
  })

  it('creates slot and relays to service', async () => {
    mockAvailability.createTimeSlot.mockResolvedValue(sampleSlots[0] as any)
    const { result } = renderHook(() => useHandymanAvailability('handyman-1'))

    await act(async () => {})

    await act(async () => {
      await result.current.createSlot({
        startTime: sampleSlots[0].start_time,
        endTime: sampleSlots[0].end_time,
      })
    })

    expect(mockAvailability.createTimeSlot).toHaveBeenCalledWith({
      handymanId: 'handyman-1',
      startTime: sampleSlots[0].start_time,
      endTime: sampleSlots[0].end_time,
    })
  })

  it('handles realtime updates on insert and delete', async () => {
    const callbacks: any[] = []
    mockSupabase.channel.mockImplementation(() => {
      const channel = {
        on: (_event: any, _filter: any, cb: any) => { callbacks.push(cb); return channel },
        subscribe: jest.fn().mockReturnValue(channel),
      }
      return channel
    })

    const { result } = renderHook(() => useHandymanAvailability('handyman-1'))
    await act(async () => {})

    const newSlot = { ...sampleSlots[0], id: 'slot-2' }
    await act(async () => { callbacks[0]({ eventType: 'INSERT', new: newSlot }) })
    expect(result.current.slots.find((slot) => slot.id === 'slot-2')).toBeDefined()

    await act(async () => { callbacks[0]({ eventType: 'DELETE', old: newSlot }) })
    expect(result.current.slots.find((slot) => slot.id === 'slot-2')).toBeUndefined()
  })
})
