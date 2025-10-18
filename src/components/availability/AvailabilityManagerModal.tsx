import React, { useMemo, useState } from 'react'
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native'
import { AvailabilityCalendar } from './AvailabilityCalendar'
import { useHandymanAvailability } from '../../hooks/useHandymanAvailability'
import { formatSwissDateTime } from '../../utils/timezone'
import { useToast } from '../../contexts/ToastContext'

interface AvailabilityManagerModalProps {
  visible: boolean
  handymanId?: string
  onClose: () => void
}

function combineDateTime(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map((v) => parseInt(v, 10))
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error('Ungültige Uhrzeit, nutze HH:MM')
  }
  const iso = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
  ))
  return iso.toISOString()
}

function parseDuration(value: string) {
  const minutes = parseInt(value, 10)
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new Error('Dauer muss positiv sein')
  }
  return minutes
}

export function AvailabilityManagerModal({ visible, handymanId, onClose }: AvailabilityManagerModalProps) {
  const { show } = useToast()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [startTime, setStartTime] = useState('09:00')
  const [duration, setDuration] = useState('60')

  const { slots, loading, creating, updating, deleting, error, createSlot, toggleSlot, removeSlot } = useHandymanAvailability(handymanId)

  const markedDays = useMemo(() => {
    const map: Record<string, { hasOpen: boolean; hasBlocked: boolean }> = {}
    slots.forEach((slot) => {
      const key = slot.start_time.slice(0, 10)
      if (!map[key]) map[key] = { hasOpen: false, hasBlocked: false }
      if (slot.status === 'open') map[key].hasOpen = true
      if (slot.status === 'blocked') map[key].hasBlocked = true
    })
    return Object.entries(map).map(([date, value]) => ({ date, ...value }))
  }, [slots])

  const slotsForDay = useMemo(() => slots.filter((slot) => slot.start_time.startsWith(selectedDate.toISOString().slice(0, 10))), [slots, selectedDate])

  const handleAdd = async () => {
    if (!handymanId) {
      show('Nur Handwerker können Verfügbarkeiten anlegen', { type: 'error' })
      return
    }
    try {
      const startIso = combineDateTime(selectedDate, startTime)
      const dur = parseDuration(duration)
      const endDate = new Date(new Date(startIso).getTime() + dur * 60000)
      await createSlot({ startTime: startIso, endTime: endDate.toISOString() })
      show('Zeitslot gespeichert', { type: 'success' })
    } catch (e) {
      show(e instanceof Error ? e.message : 'Fehler beim Speichern', { type: 'error' })
    }
  }

  const handleToggle = async (slotId: string, status: 'open' | 'blocked') => {
    try {
      await toggleSlot(slotId, status)
      show(status === 'open' ? 'Slot freigegeben' : 'Slot blockiert', { type: 'success' })
    } catch (e) {
      show(e instanceof Error ? e.message : 'Fehler beim Aktualisieren', { type: 'error' })
    }
  }

  const handleDelete = async (slotId: string) => {
    try {
      await removeSlot(slotId)
      show('Slot gelöscht', { type: 'success' })
    } catch (e) {
      show(e instanceof Error ? e.message : 'Fehler beim Löschen', { type: 'error' })
    }
  }

  const changeMonth = (offset: number) => {
    const next = new Date(currentMonth)
    next.setMonth(next.getMonth() + offset)
    setCurrentMonth(next)
  }

  const handleSelectDay = (date: Date) => {
    setSelectedDate(date)
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1))
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Verfügbarkeit verwalten</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Schließen" testID="availability-close">
              <Text style={styles.close}>Schließen</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AvailabilityCalendar
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDay}
            onChangeMonth={changeMonth}
            markedDays={markedDays}
          />

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Neuen Slot anlegen</Text>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.inputLabel}>Start (HH:MM)</Text>
                <TextInput
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="09:00"
                  style={styles.input}
                  keyboardType="numbers-and-punctuation"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  testID="availability-start-input"
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.inputLabel}>Dauer (Minuten)</Text>
                <TextInput
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="60"
                  style={styles.input}
                  keyboardType="number-pad"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  testID="availability-duration-input"
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, (creating || !handymanId) && styles.disabled]}
              onPress={handleAdd}
              disabled={creating || !handymanId}
              testID="availability-add-slot"
            >
              <Text style={styles.primaryText}>{creating ? 'Speichere…' : 'Slot erstellen'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.slotsListHeader}>
            <Text style={styles.sectionLabel}>Slots am {selectedDate.toLocaleDateString('de-CH')}</Text>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : null}
          </View>

          <ScrollView style={styles.slotsList} testID="availability-slot-list">
            {slotsForDay.length === 0 ? (
              <Text style={styles.emptyText}>Noch keine Slots an diesem Tag</Text>
            ) : (
              slotsForDay.map((slot) => (
                <View key={slot.id} style={styles.slotItem}>
                  <View style={styles.slotInfo}>
                    <Text style={styles.slotTime}>{formatSwissDateTime(slot.start_time)}</Text>
                    <Text style={styles.slotTime}>bis {formatSwissDateTime(slot.end_time)}</Text>
                    <Text style={[styles.slotStatus, slot.status === 'open' ? styles.open : styles.blocked]}>
                      {slot.status === 'open' ? 'Offen' : 'Blockiert'}
                    </Text>
                  </View>
                  <View style={styles.slotActions}>
                    <TouchableOpacity
                      style={[styles.secondaryButton, updating && styles.disabled]}
                      onPress={() => handleToggle(slot.id, slot.status === 'open' ? 'blocked' : 'open')}
                      disabled={updating}
                      testID={`availability-toggle-${slot.id}`}
                    >
                      <Text style={styles.secondaryText}>{slot.status === 'open' ? 'Blockieren' : 'Freigeben'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.deleteButton, deleting && styles.disabled]}
                      onPress={() => handleDelete(slot.id)}
                      disabled={deleting}
                      testID={`availability-delete-${slot.id}`}
                    >
                      <Text style={styles.secondaryText}>Löschen</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
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
    color: '#60a5fa',
    fontSize: 16,
  },
  error: {
    color: '#f87171',
    marginBottom: 12,
  },
  formSection: {
    marginTop: 12,
    marginBottom: 16,
    gap: 12,
  },
  sectionLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    flex: 1,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
    fontSize: 13,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  slotsListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotsList: {
    maxHeight: 220,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    paddingVertical: 12,
  },
  slotItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  slotInfo: {
    marginBottom: 12,
    gap: 4,
  },
  slotTime: {
    color: '#ffffff',
    fontSize: 14,
  },
  slotStatus: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  open: {
    color: '#34d399',
  },
  blocked: {
    color: '#f59e0b',
  },
  slotActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.4)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#ffffff',
    fontWeight: '500',
  },
})
