import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, TextInput, Alert, Switch, TouchableOpacity } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { glassCard } from '../themeStyles'
import { auctionService } from '../../services/auction.service'
import { sanitizeStartingPrice, CHF_MINIMUM, CHF_INCREMENT, formatCHF } from '../../utils/currency'
import { addMinutes, formatSwissDateTime, nowSwiss } from '../../utils/timezone'

interface Props {
  onCreated?: (auctionId: string) => void
}

export function AuctionCreationForm({ onCreated }: Props) {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [title, setTitle] = useState('General Handyman Service')
  const [serviceType, setServiceType] = useState('handyman')
  const [region, setRegion] = useState('Zurich')
  const [startingPrice, setStartingPrice] = useState<number>(CHF_MINIMUM)
  const [durationMin, setDurationMin] = useState<number>(60)
  const [reservePrice, setReservePrice] = useState<number | undefined>(undefined)
  const [autoExtendEnabled, setAutoExtendEnabled] = useState(true)
  const [autoExtendMinutes, setAutoExtendMinutes] = useState<number>(2)
  const [submitting, setSubmitting] = useState(false)

  const start = nowSwiss()
  const end = addMinutes(start, durationMin)

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (startingPrice < CHF_MINIMUM) e.startingPrice = `Minimum starting price is CHF ${CHF_MINIMUM}`
    if (durationMin < 15 || durationMin > 1440) e.durationMin = 'Duration must be between 15 and 1440 minutes'
    if (reservePrice !== undefined && reservePrice < startingPrice) e.reservePrice = 'Reserve price must be >= starting price'
    if (autoExtendEnabled && (autoExtendMinutes < 1 || autoExtendMinutes > 10)) e.autoExtendMinutes = 'Auto-extend must be between 1 and 10 minutes'
    return e
  }, [startingPrice, durationMin, reservePrice, autoExtendEnabled, autoExtendMinutes])

  const isValid = Object.keys(errors).length === 0

  const create = async () => {
    if (!user) {
      Alert.alert('Authentication Error', 'You must be signed in to create an auction')
      return
    }

    console.log('🔧 Starting auction creation...')
    console.log('👤 User ID:', user.id)
    console.log('📊 Form validation errors:', errors)

    if (!isValid) {
      Alert.alert('Validation Error', 'Please fix all form errors before submitting:\n' + Object.values(errors).join('\n'))
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        title: title.trim(),
        description: null as any,
        service_type: serviceType.trim(),
        region: region.trim(),
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        starting_price: sanitizeStartingPrice(startingPrice),
        reserve_price: reservePrice ?? null,
        bid_increment: CHF_INCREMENT,
        auto_extend: autoExtendEnabled,
        auto_extend_minutes: autoExtendEnabled ? autoExtendMinutes : null,
      }

      console.log('📝 Auction payload:', JSON.stringify(payload, null, 2))
      console.log('💰 Sanitized starting price:', sanitizeStartingPrice(startingPrice))
      console.log('⏰ Start time:', start.toISOString())
      console.log('⏰ End time:', end.toISOString())

      const auction = await auctionService.createAuction(user.id, payload)

      console.log('✅ Auction created successfully:', auction)
      onCreated?.(auction.id)
      Alert.alert('Success!', `Auction created successfully!\nID: ${auction.id}\nTitle: ${auction.title}`)

    } catch (e) {
      console.error('💥 Auction creation failed:', e)

      let errorMessage = 'Unknown error occurred'
      let errorDetails = ''

      if (e instanceof Error) {
        errorMessage = e.message
        console.error('Error message:', e.message)
        console.error('Error stack:', e.stack)

        // Check for common Supabase errors
        if (e.message.includes('JWT')) {
          errorDetails = '\n\nAuthentication issue - please try logging out and back in.'
        } else if (e.message.includes('RLS')) {
          errorDetails = '\n\nDatabase access denied - check your permissions.'
        } else if (e.message.includes('violates')) {
          errorDetails = '\n\nDatabase constraint violation - check your input values.'
        } else if (e.message.includes('network') || e.message.includes('fetch')) {
          errorDetails = '\n\nNetwork connection issue - check your internet connection.'
        } else if (e.message.includes('timeout')) {
          errorDetails = '\n\nRequest timed out - please try again.'
        }
      }

      // Show detailed error to user
      Alert.alert(
        'Auction Creation Failed',
        `${errorMessage}${errorDetails}\n\nPlease check the console for more details.`,
        [
          { text: 'OK', style: 'default' },
          {
            text: 'Copy Error',
            onPress: () => {
              console.log('📋 Full error for copying:', JSON.stringify(e, null, 2))
            }
          }
        ]
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={[styles.card, theme === 'glass' && glassCard]}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Auction</Text>
        <Text style={styles.subtitle}>Start: {formatSwissDateTime(start)} · End: {formatSwissDateTime(end)}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholder="Auction title"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Service Type</Text>
          <TextInput
            value={serviceType}
            onChangeText={setServiceType}
            style={styles.input}
            placeholder="e.g., plumbing, electrical"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Region</Text>
          <TextInput
            value={region}
            onChangeText={setRegion}
            style={styles.input}
            placeholder="e.g., Zurich, Geneva"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Starting Price (CHF)</Text>
          <TextInput
            value={String(startingPrice)}
            onChangeText={(t) => setStartingPrice(parseInt(t || '0', 10))}
            style={styles.input}
            keyboardType="numeric"
            placeholder={`Minimum ${CHF_MINIMUM} CHF`}
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
          />
          <Text style={styles.hint}>{formatCHF(startingPrice)} (minimum CHF {CHF_MINIMUM})</Text>
          {errors.startingPrice ? <Text style={styles.error}>{errors.startingPrice}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Duration (minutes)</Text>
          <TextInput
            value={String(durationMin)}
            onChangeText={(t) => setDurationMin(parseInt(t || '60', 10))}
            style={styles.input}
            keyboardType="numeric"
            placeholder="Duration in minutes"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
          />
          {errors.durationMin ? <Text style={styles.error}>{errors.durationMin}</Text> : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Reserve Price (optional)</Text>
          <TextInput
            value={reservePrice ? String(reservePrice) : ''}
            onChangeText={(t) => setReservePrice(t ? parseInt(t, 10) : undefined)}
            style={styles.input}
            keyboardType="numeric"
            placeholder="Optional reserve price"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
          />
          {errors.reservePrice ? <Text style={styles.error}>{errors.reservePrice}</Text> : null}
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Auto-extend on late bids</Text>
          <Switch
            value={autoExtendEnabled}
            onValueChange={setAutoExtendEnabled}
            trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.5)' }}
            thumbColor={autoExtendEnabled ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'}
          />
        </View>

        {autoExtendEnabled && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Auto-extend Minutes</Text>
            <TextInput
              value={String(autoExtendMinutes)}
              onChangeText={(t) => setAutoExtendMinutes(parseInt(t || '2', 10) || 2)}
              style={styles.input}
              keyboardType="numeric"
              placeholder="Extension minutes"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
            />
            {errors.autoExtendMinutes ? <Text style={styles.error}>{errors.autoExtendMinutes}</Text> : null}
          </View>
        )}

        <TouchableOpacity
          onPress={create}
          disabled={submitting || !isValid}
          style={[styles.submitButton, (!isValid || submitting) && styles.disabledButton]}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Creating Auction...' : 'Create Auction'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 32,
    margin: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  hint: {
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  error: {
    marginTop: 4,
    color: '#fecaca',
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
})
