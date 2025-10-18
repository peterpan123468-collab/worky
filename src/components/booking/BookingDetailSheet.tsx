import React, { useEffect, useMemo, useState } from 'react'
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { BookingWithSlot, listHandymanOpenSlots } from '../../services/booking.service'
import { TimeSlot } from '../../types/database.types'
import { formatSwissDateTime } from '../../utils/timezone'
import { formatCHF } from '../../utils/currency'
import { useTheme } from '../../contexts/ThemeContext'
import { glassCard } from '../themeStyles'
import { Button } from '../ui/button'

interface BookingDetailSheetProps {
  booking: BookingWithSlot | null
  visible: boolean
  onClose: () => void
  onCancel: (bookingId: string) => Promise<void>
  onReschedule: (bookingId: string, newSlotId: string) => Promise<void>
  actionLoading?: boolean
}

export function BookingDetailSheet({ booking, visible, onClose, onCancel, onReschedule, actionLoading }: BookingDetailSheetProps) {
  const { theme } = useTheme()
  const [rescheduleMode, setRescheduleMode] = useState(false)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotError, setSlotError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setRescheduleMode(false)
      fetchSlots()
    }
  }, [visible, booking?.handyman_id])

  const fetchSlots = async () => {
    if (!booking?.handyman_id) {
      setSlots([])
      return
    }
    try {
      setLoadingSlots(true)
      const result = await listHandymanOpenSlots(booking.handyman_id, 8)
      setSlots(result.filter((slot) => slot.id !== booking.slot_id))
      setSlotError(null)
    } catch (e) {
      setSlotError(e instanceof Error ? e.message : 'Unable to load availability')
    } finally {
      setLoadingSlots(false)
    }
  }

  const statusLabel = useMemo(() => {
    switch (booking?.status) {
      case 'confirmed':
        return { label: 'Confirmed', style: styles.statusConfirmed }
      case 'pending':
        return { label: 'Pending', style: styles.statusPending }
      case 'completed':
        return { label: 'Completed', style: styles.statusCompleted }
      case 'canceled':
        return { label: 'Canceled', style: styles.statusCanceled }
      default:
        return { label: 'Unknown', style: styles.statusPending }
    }
  }, [booking?.status])

  const handleReschedule = async (slotId: string) => {
    if (!booking || actionLoading) return
    await onReschedule(booking.id, slotId)
  }

  if (!booking) return null

  const slot = booking.slot

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, theme === 'glass' && glassCard]}>
          <View style={styles.header}>
            <Text style={styles.title}>Booking Details</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close booking details">
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={[styles.statusBadge, statusLabel.style]}>
                <Text style={styles.statusText}>{statusLabel.label}</Text>
              </View>
            </View>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>{formatSwissDateTime(booking.created_at)}</Text>
            {slot ? (
              <>
                <Text style={[styles.detailLabel, styles.detailSpacing]}>Scheduled Window</Text>
                <Text style={styles.detailValue}>{`${formatSwissDateTime(slot.start_time)} → ${formatSwissDateTime(slot.end_time)}`}</Text>
              </>
            ) : null}
            <Text style={[styles.detailLabel, styles.detailSpacing]}>Total Price</Text>
            <Text style={styles.detailValue}>{formatCHF(booking.total_price)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Details</Text>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{booking.customer_address}</Text>
            {booking.work_description ? (
              <>
                <Text style={[styles.detailLabel, styles.detailSpacing]}>Description</Text>
                <Text style={styles.detailValue}>{booking.work_description}</Text>
              </>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Button variant="destructive" onPress={() => onCancel(booking.id)} disabled={actionLoading || booking.status === 'canceled'}>
              {actionLoading ? 'Processing…' : 'Cancel Booking'}
            </Button>
            <Button variant="outline" onPress={() => setRescheduleMode((value) => !value)} disabled={actionLoading}>
              {rescheduleMode ? 'Hide Options' : 'Reschedule'}
            </Button>
          </View>

          {rescheduleMode ? (
            <View style={styles.rescheduleBlock}>
              <View style={styles.rescheduleHeader}>
                <Text style={styles.sectionTitle}>Available Slots</Text>
                <TouchableOpacity onPress={fetchSlots} disabled={loadingSlots}>
                  <Text style={styles.refresh}>{loadingSlots ? 'Refreshing…' : 'Refresh'}</Text>
                </TouchableOpacity>
              </View>
              {slotError ? <Text style={styles.error}>{slotError}</Text> : null}
              {loadingSlots ? (
                <ActivityIndicator color="#ffffff" />
              ) : slots.length === 0 ? (
                <Text style={styles.empty}>No alternative slots currently open</Text>
              ) : (
                <ScrollView style={styles.slotList}>
                  {slots.map((availableSlot) => (
                    <TouchableOpacity
                      key={availableSlot.id}
                      style={styles.slotItem}
                      onPress={() => handleReschedule(availableSlot.id)}
                      disabled={actionLoading}
                    >
                      <Text style={styles.slotText}>{`${formatSwissDateTime(availableSlot.start_time)} → ${formatSwissDateTime(availableSlot.end_time)}`}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'rgba(17,24,39,0.95)',
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  close: {
    fontSize: 16,
    color: '#9ca3af',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
  },
  detailSpacing: {
    marginTop: 10,
  },
  detailValue: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusConfirmed: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  statusCanceled: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rescheduleBlock: {
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingTop: 14,
  },
  rescheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refresh: {
    color: '#60a5fa',
    fontSize: 14,
  },
  slotList: {
    maxHeight: 160,
  },
  slotItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  slotText: {
    color: '#ffffff',
    fontSize: 14,
  },
  empty: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 4,
  },
  error: {
    color: '#f87171',
    marginBottom: 8,
  },
})
