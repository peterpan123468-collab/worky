import React, { useMemo, useState } from 'react'
import { StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { auctionService } from '../../services/auction.service'
import { CHF_INCREMENT, CHF_MINIMUM, formatCHF, sanitizeStartingPrice } from '../../utils/currency'
import { addMinutes, formatSwissDateTime, nowSwiss } from '../../utils/timezone'
import { nativeAlert } from '../../utils/nativeAlert'
import { glassCard } from '../themeStyles'
import { Card, CardContent, CardHeader } from '../ui/card'

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

  const toInt = (value: string, fallback: number) => {
    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) ? fallback : parsed
  }

  const errors = useMemo(() => {
    const validation: Record<string, string> = {}
    if (startingPrice < CHF_MINIMUM) validation.startingPrice = `Minimum starting price is CHF ${CHF_MINIMUM}`
    if (durationMin < 15 || durationMin > 1440) validation.durationMin = 'Duration must be between 15 and 1440 minutes'
    if (reservePrice !== undefined && reservePrice < startingPrice) validation.reservePrice = 'Reserve price must be >= starting price'
    if (autoExtendEnabled && (autoExtendMinutes < 1 || autoExtendMinutes > 10)) validation.autoExtendMinutes = 'Auto-extend must be between 1 and 10 minutes'
    return validation
  }, [startingPrice, durationMin, reservePrice, autoExtendEnabled, autoExtendMinutes])

  const isValid = Object.keys(errors).length === 0
  const logPrefix = '[AuctionCreationForm]'

  const create = async () => {
    if (!user) {
      nativeAlert.alert('Authentication Error', 'You must be signed in to create an auction')
      return
    }

    if (!isValid) {
      nativeAlert.alert('Validation Error', 'Please fix all form errors before submitting:\n' + Object.values(errors).join('\n'))
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        title: title.trim(),
        description: undefined,
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

      console.log(logPrefix, 'submitting payload', payload)

      const auction = await auctionService.createAuction(user.id, payload)

      console.log(logPrefix, 'created auction', auction)
      onCreated?.(auction.id)

      nativeAlert.alert(
        'Success!',
        `Auction created successfully!\nID: ${auction.id}\nTitle: ${auction.title}`
      )
    } catch (error) {
      console.error(logPrefix, 'creation failed', error)

      let errorMessage = 'Unknown error occurred'
      let errorDetails = ''

      if (error instanceof Error) {
        errorMessage = error.message

        if (error.message.includes('JWT')) {
          errorDetails = '\n\nAuthentication issue - please try logging out and back in.'
        } else if (error.message.includes('RLS')) {
          errorDetails = '\n\nDatabase access denied - check your permissions.'
        } else if (error.message.includes('violates')) {
          errorDetails = '\n\nDatabase constraint violation - check your input values.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorDetails = '\n\nNetwork connection issue - check your internet connection.'
        } else if (error.message.includes('timeout')) {
          errorDetails = '\n\nRequest timed out - please try again.'
        }
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      nativeAlert.alert(
        'Auction Creation Failed',
        `${errorMessage}${errorDetails}\n\nPlease check the console for more details.`,
        [
          { text: 'OK', style: 'default' },
          {
            text: 'Log Error Details',
            onPress: () => {
              console.log(logPrefix, 'error payload', JSON.stringify(error, null, 2))
            }
          }
        ]
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card style={[styles.card, theme === 'glass' && glassCard]} testID='auction-creation-card'>
      <CardHeader style={styles.header}>
        <Text style={styles.title}>Create Auction</Text>
        <Text style={styles.subtitle}>Start: {formatSwissDateTime(start)} | End: {formatSwissDateTime(end)}</Text>
      </CardHeader>

      <CardContent>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholder='Auction title'
              placeholderTextColor='rgba(255, 255, 255, 0.4)'
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Service Type</Text>
            <TextInput
              value={serviceType}
              onChangeText={setServiceType}
              style={styles.input}
              placeholder='e.g., plumbing, electrical'
              placeholderTextColor='rgba(255, 255, 255, 0.4)'
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Region</Text>
            <TextInput
              value={region}
              onChangeText={setRegion}
              style={styles.input}
              placeholder='e.g., Zurich, Geneva'
              placeholderTextColor='rgba(255, 255, 255, 0.4)'
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Starting Price (CHF)</Text>
            <TextInput
              value={String(startingPrice)}
              onChangeText={(value) => setStartingPrice(toInt(value, 0))}
              style={styles.input}
              keyboardType='numeric'
              placeholder={`Minimum ${CHF_MINIMUM} CHF`}
              placeholderTextColor='rgba(255, 255, 255, 0.4)'
            />
            <Text style={styles.hint}>{formatCHF(startingPrice)} (minimum CHF {CHF_MINIMUM})</Text>
            {errors.startingPrice ? <Text style={styles.error}>{errors.startingPrice}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              value={String(durationMin)}
              onChangeText={(value) => setDurationMin(toInt(value, 60))}
              style={styles.input}
              keyboardType='numeric'
              placeholder='Duration in minutes'
              placeholderTextColor='rgba(255, 255, 255, 0.4)'
            />
            {errors.durationMin ? <Text style={styles.error}>{errors.durationMin}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Reserve Price (optional)</Text>
            <TextInput
              value={reservePrice !== undefined ? String(reservePrice) : ''}
              onChangeText={(value) => {
                const parsed = Number.parseInt(value, 10)
                setReservePrice(Number.isNaN(parsed) ? undefined : parsed)
              }}
              style={styles.input}
              keyboardType='numeric'
              placeholder='Optional reserve price'
              placeholderTextColor='rgba(255, 255, 255, 0.4)'
            />
            {errors.reservePrice ? <Text style={styles.error}>{errors.reservePrice}</Text> : null}
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Auto-extend on late bids</Text>
            <Switch
              testID='auto-extend-switch'
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
                onChangeText={(value) => setAutoExtendMinutes(toInt(value, 2))}
                style={styles.input}
                keyboardType='numeric'
                placeholder='Extension minutes'
                placeholderTextColor='rgba(255, 255, 255, 0.4)'
              />
              {errors.autoExtendMinutes ? <Text style={styles.error}>{errors.autoExtendMinutes}</Text> : null}
            </View>
          )}

          <TouchableOpacity
            testID='create-button'
            onPress={create}
            accessibilityRole='button'
            disabled={submitting || !isValid}
            accessibilityState={{ disabled: submitting || !isValid }}
            style={[styles.submitButton, (!isValid || submitting) && styles.disabledButton]}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Creating Auction...' : 'Create Auction'}
            </Text>
          </TouchableOpacity>
        </View>
      </CardContent>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
  },
  header: {
    gap: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
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
