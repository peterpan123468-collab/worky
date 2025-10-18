import React, { useCallback, useState } from 'react'
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useAuth } from '../contexts/AuthContext'
import { Background } from '../components/Background'
import { Card, CardContent } from '../components/ui/card'
import { useTheme } from '../contexts/ThemeContext'
import { glassCard } from '../components/themeStyles'
import { useCustomerBookings } from '../hooks/useCustomerBookings'
import { BookingWithSlot, cancelBooking, rescheduleBooking } from '../services/booking.service'
import { formatCHF } from '../utils/currency'
import { formatSwissDateTime } from '../utils/timezone'
import { BookingDetailSheet } from '../components/booking/BookingDetailSheet'
import { useToast } from '../contexts/ToastContext'

export function BookingsScreen() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const { show } = useToast()
  const { bookings, loading, error, refresh } = useCustomerBookings(user?.id)
  const [selectedBooking, setSelectedBooking] = useState<BookingWithSlot | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh])
  )

  const handleCancel = async (bookingId: string) => {
    try {
      setActionLoading(true)
      await cancelBooking(bookingId)
      show('Booking cancelled', { type: 'success' })
      await refresh()
      setSelectedBooking(null)
    } catch (e) {
      show(e instanceof Error ? e.message : 'Failed to cancel booking', { type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReschedule = async (bookingId: string, slotId: string) => {
    try {
      setActionLoading(true)
      await rescheduleBooking({ bookingId, newSlotId: slotId })
      show('Booking rescheduled', { type: 'success' })
      await refresh()
      setSelectedBooking(null)
    } catch (e) {
      show(e instanceof Error ? e.message : 'Failed to reschedule booking', { type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const onRefresh = async () => {
    await refresh()
  }

  return (
    <Background style={styles.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Bookings</Text>
          <Text style={styles.subtitle}>Manage confirmed and pending services</Text>
        </View>
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl tintColor="#ffffff" refreshing={loading} onRefresh={onRefresh} />}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {bookings.length === 0 && !loading ? (
            <Card style={[styles.card, theme === 'glass' && glassCard]}>
              <CardContent>
                <Text style={styles.emptyTitle}>No bookings yet</Text>
                <Text style={styles.emptySubtitle}>Browse available slots to request your first service.</Text>
              </CardContent>
            </Card>
          ) : (
            bookings.map((booking) => (
              <TouchableOpacity key={booking.id} onPress={() => setSelectedBooking(booking)} testID={`booking-card-${booking.id}`}>
                <Card style={[styles.card, theme === 'glass' && glassCard]}>
                  <CardContent>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{booking.work_description || 'Service Booking'}</Text>
                      <Text style={styles.cardPrice}>{formatCHF(booking.total_price)}</Text>
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardLabel}>Status</Text>
                      <Text style={styles.cardValue}>{booking.status}</Text>
                    </View>
                    {booking.slot ? (
                      <View style={styles.cardBody}>
                        <Text style={styles.cardLabel}>Time</Text>
                        <Text style={styles.cardValue}>{`${formatSwissDateTime(booking.slot.start_time)} → ${formatSwissDateTime(booking.slot.end_time)}`}</Text>
                      </View>
                    ) : null}
                    <View style={styles.cardBody}>
                      <Text style={styles.cardLabel}>Created</Text>
                      <Text style={styles.cardValue}>{formatSwissDateTime(booking.created_at)}</Text>
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
      <BookingDetailSheet
        booking={selectedBooking}
        visible={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        onCancel={handleCancel}
        onReschedule={handleReschedule}
        actionLoading={actionLoading}
      />
    </Background>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 64,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  cardPrice: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
  },
  cardValue: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  emptyTitle: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  error: {
    color: '#f87171',
    marginBottom: 16,
  },
})
