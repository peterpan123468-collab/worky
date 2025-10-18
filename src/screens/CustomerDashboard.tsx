import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { Background } from '../components/Background'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { glassCard } from '../components/themeStyles'
import Ionicons from '@expo/vector-icons/Ionicons'
import { RootStackParamList } from '../navigation/AppNavigator'
import { AuctionList } from '../components/auction/AuctionList'
import { BiddingHistory } from '../components/BiddingHistory'
import { NotificationBell } from '../components/NotificationBell'
import { useCustomerDashboard } from '../hooks/useCustomerDashboard'
import { useBiddingHistory } from '../hooks/useBiddingHistory'
import { formatSwissDateTime } from '../utils/timezone'
import { formatCHF } from '../utils/currency'
import { BookingFormModal } from '../components/booking/BookingFormModal'
import { TimeSlot } from '../types/database.types'
import { useToast } from '../contexts/ToastContext'
import { createBookingFromSlot } from '../services/booking.service'
import { t } from '../utils/i18n'

type Nav = StackNavigationProp<RootStackParamList>
export function CustomerDashboard() {
  const { logout, user } = useAuth()
  const { show } = useToast()
  const { unreadCount } = useNotifications()
  const { theme } = useTheme()
  const { language } = useLanguage()
  const navigation = useNavigation<Nav>()
  const { slots, bookings } = useCustomerDashboard(user?.id)
  const { bids, loading: bidsLoading } = useBiddingHistory(user?.id)
  
  const [activeSlot, setActiveSlot] = useState<TimeSlot | null>(null)
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  
  const handleBookingSubmit = async ({ address, description }: { address: string; description: string }) => {
    if (!user?.id || !activeSlot) {
      show('You need to be logged in to book a slot', { type: 'error' })
      return
    }
    try {
      setBookingSubmitting(true)
      await createBookingFromSlot({
        slotId: activeSlot.id,
        customerId: user.id,
        workDescription: description,
        address,
      })
      show('Booking request sent', { type: 'success' })
      setActiveSlot(null)
    } catch (e) {
      show(e instanceof Error ? e.message : 'Could not create booking', { type: 'error' })
    } finally {
      setBookingSubmitting(false)
    }
  }

  return (
    <Background style={styles.background}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>{t('dashboard.welcome', language)}</Text>
              <Text style={styles.subtitleText}>{t('dashboard.subtitle', language)}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton}>
                <Ionicons name="settings-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
              <NotificationBell />
              <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                <Text style={styles.logoutButtonText}>{t('nav.logout', language)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <Card style={[theme === 'glass' && glassCard]}>
            <CardContent>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for services..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
                <TouchableOpacity style={styles.searchButton}>
                  <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card style={[theme === 'glass' && glassCard]}>
            <CardContent>
              <Text style={styles.cardTitle}>Quick Actions</Text>
              <View style={styles.quickActionsContent}>
                <TouchableOpacity testID="browse-available-slots-button" style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Browse Available Slots</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="join-auctions-button" style={styles.secondaryButton} onPress={() => navigation.navigate('BrowseAuctions')}>
                  <Text style={styles.secondaryButtonText}>Join Auctions</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="my-bookings-button" style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>My Bookings</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="qr-code-generator-button" style={styles.secondaryButton} onPress={() => navigation.navigate('QRCodeDemo')}>
                  <Text style={styles.secondaryButtonText}>QR Code Generator</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>

          {/* Available Services */}
          <Card style={[theme === 'glass' && glassCard]}>
            <CardContent>
              <Text style={styles.cardTitle}>Available Services</Text>
              <View style={styles.cardContent}>
                {slots.length === 0 ? (
                  <Text style={{ color: 'rgba(255,255,255,0.7)' }}>No open time slots</Text>
                ) : (
                  slots.map((s) => (
                    <View key={s.id} style={styles.serviceItem}>
                      <View style={styles.serviceHeader}>
                        <Text style={styles.serviceName}>Available Slot</Text>
                        <Text style={styles.servicePrice}>{formatSwissDateTime(s.start_time)}</Text>
                      </View>
                      <Text style={styles.serviceTime}>Ends {formatSwissDateTime(s.end_time)}</Text>
                      <View style={styles.serviceFooter}>
                        <View style={styles.serviceRatingRow}>
                          <Ionicons name="star" size={14} color="#f5c518" />
                          <Text style={styles.serviceRatingText}>Open</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.bookButton}
                          onPress={() => setActiveSlot(s)}
                        >
                          <Text style={styles.bookButtonText}>Book</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </CardContent>
          </Card>

          {/* Live Auctions */}
          <Card style={[theme === 'glass' && glassCard]}>
            <CardContent>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Live Auctions</Text>
                <TouchableOpacity testID="browse-auctions-button" onPress={() => navigation.navigate('BrowseAuctions')}>
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 8 }}>
                <AuctionList filters={{ status: 'active' }} embedded limit={5} emptyText="No live auctions" />
              </View>
            </CardContent>
          </Card>

          {/* Bidding History */}
          <Card style={[theme === 'glass' && glassCard]}>
            <CardContent>
              <BiddingHistory 
                bids={bids} 
                onAuctionPress={(auctionId) => navigation.navigate('AuctionDetail', { id: auctionId })} 
              />
            </CardContent>
          </Card>

          {/* My Bookings */}
          <Card style={[theme === 'glass' && glassCard]}>
            <CardContent>
              <Text style={styles.cardTitle}>My Bookings</Text>
              <View style={styles.cardContent}>
                {bookings.length === 0 ? (
                  <Text style={{ color: 'rgba(255,255,255,0.7)' }}>No recent bookings</Text>
                ) : (
                  bookings.map((b) => (
                    <View key={b.id} style={styles.bookingItem}>
                      <View style={styles.bookingHeader}>
                        <Text style={styles.bookingTitle}>{b.work_description || 'Service Booking'}</Text>
                        <Text testID="month-revenue-stat" style={styles.bookingPrice}>{formatCHF(b.total_price)}</Text>
                      </View>
                      <Text style={styles.bookingDetails}>{formatSwissDateTime(b.created_at)}</Text>
                      <Text style={b.status === 'confirmed' ? styles.confirmedStatus : styles.pendingStatus}>
                        {b.status}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
      <BookingFormModal
        visible={Boolean(activeSlot)}
        slot={activeSlot}
        onClose={() => setActiveSlot(null)}
        onSubmit={handleBookingSubmit}
        submitting={bookingSubmitting}
        estimatedPrice={null}
      />
    </Background>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  viewAllText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  quickActionsContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  primaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 16,
  },
  serviceItem: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceName: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 16,
  },
  servicePrice: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  serviceTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 12,
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceRating: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  serviceRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceRatingText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
  },
  bookButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  auctionItem: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  auctionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  auctionTitle: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 16,
  },
  auctionPrice: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  auctionSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 12,
  },
  auctionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auctionTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  bidButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bidButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  winningText: {
    color: '#10b981',
    fontWeight: '500',
    fontSize: 14,
  },
  bookingItem: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookingTitle: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 16,
  },
  bookingPrice: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  bookingDetails: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 8,
  },
  confirmedStatus: {
    color: '#10b981',
    fontWeight: '500',
    fontSize: 14,
  },
  pendingStatus: {
    color: '#f59e0b',
    fontWeight: '500',
    fontSize: 14,
  },
})

export default CustomerDashboard
