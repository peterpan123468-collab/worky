import { useCallback, useEffect, useMemo, useState } from 'react'
import { availabilityService, createTimeSlot, deleteSlot, listHandymanSlots, updateSlotStatus } from '../services/availability.service'
import { TimeSlot } from '../types/database.types'
import { useRealtimeChannel } from './useRealtimeChannel'

interface SlotFormValues {
  startTime: string
  endTime: string
}

interface HandymanAvailability {
  slots: TimeSlot[]
  loading: boolean
  error: string | null
  creating: boolean
  updating: boolean
  deleting: boolean
  createSlot: (values: SlotFormValues) => Promise<void>
  toggleSlot: (slotId: string, status: 'open' | 'blocked') => Promise<void>
  removeSlot: (slotId: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useHandymanAvailability(handymanId?: string): HandymanAvailability {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const refresh = useCallback(async () => {
    if (!handymanId) {
      setSlots([])
      return
    }
    try {
      setLoading(true)
      const data = await listHandymanSlots(handymanId)
      setSlots(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load availability')
    } finally {
      setLoading(false)
    }
  }, [handymanId])

  useEffect(() => { refresh() }, [refresh])

  const changeConfig = useMemo(() => ({
    event: '*',
    schema: 'public',
    table: 'time_slots',
    filter: handymanId ? `handyman_id=eq.${handymanId}` : undefined,
  }), [handymanId])

  const handleRealtime = useCallback((payload: any) => {
    const slot = payload.new as TimeSlot | null
    if (payload.eventType === 'DELETE') {
      const deleted = payload.old as TimeSlot
      setSlots((current) => current.filter((item) => item.id !== deleted.id))
      return
    }
    if (!slot) return
    setSlots((current) => {
      const exists = current.find((item) => item.id === slot.id)
      if (exists) {
        return current.map((item) => (item.id === slot.id ? slot : item))
      }
      return [...current, slot].sort((a, b) => a.start_time.localeCompare(b.start_time))
    })
  }, [])

  useRealtimeChannel({
    channelName: `handyman-availability-${handymanId ?? 'anon'}`,
    changeConfig,
    enabled: Boolean(handymanId),
    onPayload: handleRealtime,
    refresh,
    refreshOnEvent: false,
    pollIntervalMs: 60000,
  })

  const createSlot = useCallback(async ({ startTime, endTime }: SlotFormValues) => {
    if (!handymanId) throw new Error('Missing handyman')
    try {
      setCreating(true)
      setError(null)
      await createTimeSlot({ handymanId, startTime, endTime })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create slot')
      throw e
    } finally {
      setCreating(false)
    }
  }, [handymanId])

  const toggleSlot = useCallback(async (slotId: string, status: 'open' | 'blocked') => {
    try {
      setUpdating(true)
      setError(null)
      await updateSlotStatus(slotId, status)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update slot')
      throw e
    } finally {
      setUpdating(false)
    }
  }, [])

  const removeSlot = useCallback(async (slotId: string) => {
    try {
      setDeleting(true)
      setError(null)
      await deleteSlot(slotId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete slot')
      throw e
    } finally {
      setDeleting(false)
    }
  }, [])

  const sortedSlots = useMemo(() => [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time)), [slots])

  return {
    slots: sortedSlots,
    loading,
    error,
    creating,
    updating,
    deleting,
    createSlot,
    toggleSlot,
    removeSlot,
    refresh,
  }
}
