import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Background } from '../components/Background'
import { Card, CardContent } from '../components/ui/card'
import { useTheme } from '../contexts/ThemeContext'
import { glassCard } from '../components/themeStyles'
import { BookingFormModal } from '../components/booking/BookingFormModal'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { searchAvailableSlots, createBookingFromSlot } from '../services/booking.service'
import { TimeSlot } from '../types/database.types'
import { formatSwissDateTime } from '../utils/timezone'
import { useToast } from '../contexts/ToastContext'

type Filters = {
  region: string
  skill: string
  startAfter: string
  endBefore: string
}

const initialFilters: Filters = {
  region: '',
  skill: '',
  startAfter: '',
  endBefore: '',
}

export function CreateBookingScreen() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const { show } = useToast()
  const [filters, setFilters] = useState(initialFilters)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const searchCriteria = useMemo(() => filters, [filters])

  const loadSlots = useCallback(async (criteria: Filters = searchCriteria) => {
    try {
      setLoading(true)
      const startAfter = criteria.startAfter ? `${criteria.startAfter}T00:00:00Z` : undefined
      const endBefore = criteria.endBefore ? `${criteria.endBefore}T23:59:59Z` : undefined
      const data = await searchAvailableSlots({
        region: criteria.region || undefined,
        skill: criteria.skill || undefined,
        startAfter,
        endBefore,
        limit: 24,
      })
      setSlots(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load availability')
    } finally {
      setLoading(false)
    }
  }, [searchCriteria])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  useFocusEffect(
    useCallback(() => {
      loadSlots()
    }, [loadSlots])
  )

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    loadSlots(filters)
  }

  const handleSubmit = async ({ address, description }: { address: string; description: string }) => {
    if (!user?.id || !selectedSlot) {
      show('You need to be logged in to book a slot', { type: 'error' })
      return
    }
    try {
      setSubmitting(true)
      await createBookingFromSlot({
        slotId: selectedSlot.id,
        customerId: user.id,
        workDescription: description,
        address,
      })
      show('Booking request sent', { type: 'success' })
      setSelectedSlot(null)
      await loadSlots(filters)
    } catch (e) {
      show(e instanceof Error ? e.message : 'Could not create booking', { type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Background style={styles.background}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Book An Appointment</Text>
        <Text style={styles.subtitle}>Filter open time slots and request a booking that fits your schedule.</Text>

        <Card style={[styles.card, theme === 'glass' && glassCard]}>
          <CardContent>
            <Text style={styles.sectionTitle}>Filters</Text>
            <View style={styles.filterRow}>
              <View style={styles.filterField}>
                <Text style={styles.label}>Region</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Zurich"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={filters.region}
                  onChangeText={(value) => updateFilter('region', value)}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.filterField}>
                <Text style={styles.label}>Skill</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. plumbing"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={filters.skill}
                  onChangeText={(value) => updateFilter('skill', value)}
                  autoCapitalize="none"
                />
              </View>
            </View>
            <View style={styles.filterRow}>
              <View style={styles.filterField}>
                <Text style={styles.label}>Earliest Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={filters.startAfter}
                  onChangeText={(value) => updateFilter('startAfter', value)}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.filterField}>
                <Text style={styles.label}>Latest Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={filters.endBefore}
                  onChangeText={(value) => updateFilter('endBefore', value)}
                  autoCapitalize="none"
                />
              </View>
            </View>
            <View style={styles.filterActions}>
              <Button variant="outline" onPress={() => { setFilters(initialFilters); loadSlots(initialFilters) }} testID="booking-filter-reset">
                Reset
              </Button>
              <Button onPress={applyFilters} testID="booking-filter-apply">
                Apply Filters
              </Button>
            </View>
          </CardContent>
        </Card>

        <Card style={[styles.card, theme === 'glass' && glassCard]}>
          <CardContent>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Open Slots</Text>
              {loading ? <ActivityIndicator color="#ffffff" /> : null}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {!loading && slots.length === 0 ? (
              <Text style={styles.empty}>No slots match the selected filters right now.</Text>
            ) : (
              slots.map((slot) => (
                <View key={slot.id} style={styles.slotRow} testID={`booking-slot-${slot.id}`}>
                  <View>
                    <Text style={styles.slotDate}>{formatSwissDateTime(slot.start_time)}</Text>
                    <Text style={styles.slotMeta}>Ends {formatSwissDateTime(slot.end_time)}</Text>
                  </View>
                  <Button variant="secondary" onPress={() => setSelectedSlot(slot)} testID={`book-slot-button-${slot.id}`}>
                    Book
                  </Button>
                </View>
              ))
            )}
          </CardContent>
        </Card>
      </ScrollView>
      <BookingFormModal
        visible={Boolean(selectedSlot)}
        slot={selectedSlot}
        onClose={() => setSelectedSlot(null)}
        onSubmit={handleSubmit}
        submitting={submitting}
        estimatedPrice={null}
      />
    </Background>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  content: {
    paddingTop: 64,
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  filterField: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 6,
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
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  slotDate: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  slotMeta: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 2,
  },
  empty: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  error: {
    color: '#f87171',
    marginBottom: 12,
  },
})
