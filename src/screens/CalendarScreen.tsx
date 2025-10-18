import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useAuth } from '../contexts/AuthContext'
import { Background } from '../components/Background'
import { Card, CardContent } from '../components/ui/card'
import { useTheme } from '../contexts/ThemeContext'
import { glassCard } from '../components/themeStyles'
import { useHandymanCalendar } from '../hooks/useHandymanCalendar'
import { AvailabilityCalendar } from '../components/availability/AvailabilityCalendar'
import { formatSwissDateTime } from '../utils/timezone'

type RootStackParamList = {
  Calendar: undefined
  // Add other screens as needed
}

type Nav = StackNavigationProp<RootStackParamList>

export default function CalendarScreen() {
  const navigation = useNavigation<Nav>()
  const { user } = useAuth()
  const { theme } = useTheme()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  const { slots, bookings, loading, error, refresh } = useHandymanCalendar(user?.id)
  console.log('Calendar data in CalendarScreen:', { slots, bookings, loading, error });

  const markedDays = useMemo(() => {
    const map: Record<string, { date: string; hasOpen: boolean; hasBlocked: boolean }> = {}
    
    // Process availability slots (orange for open slots)
    slots.forEach((slot) => {
      const key = slot.start_time.slice(0, 10)
      if (!map[key]) {
        map[key] = { date: key, hasOpen: false, hasBlocked: false }
      }
      if (slot.status === 'open') {
        map[key].hasOpen = true
      }
      // We'll use hasBlocked for confirmed bookings (green)
      const hasConfirmedBooking = bookings.some(
        (booking) => booking.slot && 
        booking.slot.start_time.startsWith(key) && 
        booking.status === 'confirmed'
      )
      if (hasConfirmedBooking) {
        map[key].hasBlocked = true
      }
    })
    
    // Also check for bookings that might not have corresponding slots
    bookings.forEach((booking) => {
      if (booking.slot && booking.status === 'confirmed') {
        const key = booking.slot.start_time.slice(0, 10)
        if (!map[key]) {
          map[key] = { date: key, hasOpen: false, hasBlocked: false }
        }
        map[key].hasBlocked = true
      }
    })
    
    return Object.values(map)
  }, [slots, bookings])

  const eventsForDay = useMemo(() => {
    const dateStr = selectedDate.toISOString().slice(0, 10)
    
    // Get slots for the selected day
    const daySlots = slots.filter((slot) => slot.start_time.startsWith(dateStr))
    
    // Get bookings for the selected day
    const dayBookings = bookings.filter((booking) => 
      booking.slot && booking.slot.start_time.startsWith(dateStr)
    )
    
    return { slots: daySlots, bookings: dayBookings }
  }, [slots, bookings, selectedDate])

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
    <Background style={styles.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>
          <Text style={styles.subtitle}>Availability and bookings</Text>
        </View>
        
        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        <AvailabilityCalendar
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDay}
          onChangeMonth={changeMonth}
          markedDays={markedDays}
        />
        
        <Card style={[styles.eventsCard, theme === 'glass' && glassCard]}>
          <CardContent>
            <Text style={styles.sectionTitle}>
              Events for {selectedDate.toLocaleDateString('de-CH')}
            </Text>
            
            {loading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : (
              <ScrollView style={styles.eventsList}>
                {eventsForDay.slots.length === 0 && eventsForDay.bookings.length === 0 ? (
                  <Text style={styles.emptyText}>No events for this day</Text>
                ) : (
                  <>
                    {eventsForDay.slots.map((slot) => (
                      <View key={slot.id} style={styles.eventItem}>
                        <View style={styles.eventHeader}>
                          <Text style={styles.eventTime}>
                            {formatSwissDateTime(slot.start_time)} - {formatSwissDateTime(slot.end_time)}
                          </Text>
                          <Text style={[
                            styles.eventStatus, 
                            slot.status === 'open' ? styles.statusOpen : 
                            slot.status === 'booked' ? styles.statusBooked : styles.statusOther
                          ]}>
                            {slot.status}
                          </Text>
                        </View>
                        <Text style={styles.eventType}>Availability Slot</Text>
                      </View>
                    ))}
                    
                    {eventsForDay.bookings.map((booking) => (
                      booking.slot && (
                        <View key={booking.id} style={styles.eventItem}>
                          <View style={styles.eventHeader}>
                            <Text style={styles.eventTime}>
                              {formatSwissDateTime(booking.slot.start_time)} - {formatSwissDateTime(booking.slot.end_time)}
                            </Text>
                            <Text style={[
                              styles.eventStatus, 
                              booking.status === 'confirmed' ? styles.statusConfirmed : 
                              booking.status === 'pending' ? styles.statusPending : styles.statusOther
                            ]}>
                              {booking.status}
                            </Text>
                          </View>
                          <Text style={styles.eventType}>Booking</Text>
                          <Text style={styles.eventDescription} numberOfLines={2}>
                            {booking.work_description || 'Service Booking'}
                          </Text>
                        </View>
                      )
                    ))}
                  </>
                )}
              </ScrollView>
            )}
          </CardContent>
        </Card>
      </View>
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
  error: {
    color: '#f87171',
    marginBottom: 16,
  },
  eventsCard: {
    marginTop: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingVertical: 20,
  },
  eventsList: {
    maxHeight: 300,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingVertical: 20,
  },
  eventItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventTime: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  eventStatus: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusOpen: {
    color: '#f59e0b', // Orange
  },
  statusBooked: {
    color: '#10b981', // Green
  },
  statusConfirmed: {
    color: '#10b981', // Green
  },
  statusPending: {
    color: '#f59e0b', // Orange
  },
  statusOther: {
    color: 'rgba(255,255,255,0.7)',
  },
  eventType: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginBottom: 4,
  },
  eventDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
})
