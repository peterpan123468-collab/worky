import React, { useEffect, useMemo, useState } from 'react'
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { TimeSlot } from '../../types/database.types'
import { formatSwissDateTime } from '../../utils/timezone'
import { Button } from '../ui/button'
import { useTheme } from '../../contexts/ThemeContext'
import { glassCard } from '../themeStyles'
import { formatCHF } from '../../utils/currency'

interface BookingFormValues {
  address: string
  description: string
}

interface BookingFormModalProps {
  visible: boolean
  slot: TimeSlot | null
  onClose: () => void
  onSubmit: (values: BookingFormValues) => Promise<void>
  submitting?: boolean
  estimatedPrice?: number | null
}

export function BookingFormModal({ visible, slot, onClose, onSubmit, submitting, estimatedPrice }: BookingFormModalProps) {
  const { theme } = useTheme()
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setAddress('')
      setDescription('')
      setError(null)
    }
  }, [visible, slot?.id])

  const slotWindow = useMemo(() => {
    if (!slot) return null
    return `${formatSwissDateTime(slot.start_time)} → ${formatSwissDateTime(slot.end_time)}`
  }, [slot])

  const handleSubmit = async () => {
    if (!slot) return
    if (!address.trim()) {
      setError('Address is required to confirm booking')
      return
    }
    setError(null)
    await onSubmit({
      address: address.trim(),
      description: description.trim(),
    })
  }

  if (!slot) return null

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.avoider}>
          <View style={[styles.sheet, theme === 'glass' && glassCard]}>
            <View style={styles.header}>
              <Text style={styles.title}>Confirm Booking</Text>
              <TouchableOpacity onPress={onClose} accessibilityLabel="Close booking form">
                <Text style={styles.close}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Selected Slot</Text>
              <Text style={styles.value}>{slotWindow}</Text>
              {estimatedPrice ? (
                <Text style={styles.meta}>Estimated price {formatCHF(estimatedPrice)}</Text>
              ) : (
                <Text style={styles.meta}>Exact CHF total confirmed after submission</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Service Address</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Lagerstrasse 5, 8004 Zurich"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={address}
                onChangeText={setAddress}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Work Description</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Describe the work that should be completed"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <Button variant="secondary" onPress={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button onPress={handleSubmit} disabled={submitting}>
                {submitting ? 'Booking…' : 'Confirm Booking'}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  avoider: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 6,
  },
  value: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  error: {
    color: '#f87171',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
})
