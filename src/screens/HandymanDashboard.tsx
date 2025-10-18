import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { Background } from '../components/Background'
import { AuctionList } from '../components/auction/AuctionList'
import { AuctionAnalytics } from '../components/AuctionAnalytics'
import { NotificationBell } from '../components/NotificationBell'
import { useHandymanDashboard } from '../hooks/useHandymanDashboard'
import { useAuctionAnalytics } from '../hooks/useAuctionAnalytics'
import { formatCHF } from '../utils/currency'
import { AvailabilityManagerModal } from '../components/availability/AvailabilityManagerModal'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Ionicons } from '@expo/vector-icons'
import { auctionLifecycleService } from '../services/auction-lifecycle.service'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { glassCard } from '../components/themeStyles'
import { t } from '../utils/i18n'

type Nav = StackNavigationProp<RootStackParamList>
export function HandymanDashboard() {
  const { logout, user } = useAuth()
  const { unreadCount } = useNotifications()
  const navigation = useNavigation<Nav>()
  const { stats, recentBids, refresh } = useHandymanDashboard(user?.id)
  const { stats: auctionStats, loading: auctionLoading } = useAuctionAnalytics(user?.id)
  const [availabilityVisible, setAvailabilityVisible] = React.useState(false)
  const { theme } = useTheme()
  const { language } = useLanguage()
  const cardSurfaceStyle = theme === 'glass' ? glassCard : undefined

  const handleManualAuctionProcessing = async () => {
    try {
      console.log('Manually processing expired auctions...')
      await auctionLifecycleService.processExpiredAuctions()
      console.log('Expired auctions processed successfully')
      // Refresh the analytics
      refresh()
    } catch (error) {
      console.error('Error processing expired auctions:', error)
    }
  }

  return (
    <Background style={styles.background}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <AvailabilityManagerModal
          visible={availabilityVisible}
          handymanId={user?.id}
          onClose={() => setAvailabilityVisible(false)}
        />
        {/* Navigation Header */}
        <View style={styles.navHeader}>
          <View style={styles.navHeaderContent}>
            <Text style={styles.pageTitle}>{t('nav.settings', language)}</Text>
            <View style={styles.navActions}>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton}>
                <Ionicons name="settings-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
              <NotificationBell />
              <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scrollView}>
          <View style={styles.container}>
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.subtitleText}>Manage your services and earnings</Text>
            </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <Card style={[styles.statCard, cardSurfaceStyle]}>
              <CardContent>
                <Text style={styles.statNumber}>{stats.activeBookings}</Text>
                <Text style={styles.statLabel}>Active Bookings</Text>
              </CardContent>
            </Card>
            <Card style={[styles.statCard, cardSurfaceStyle]}>
              <CardContent>
                <Text style={styles.statNumber}>{formatCHF(stats.monthRevenue)}</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </CardContent>
            </Card>
          </View>

          {/* Auction Analytics */}
          {!auctionLoading && (
            <AuctionAnalytics stats={auctionStats} />
          )}

          {/* Quick Actions */}
          <Card style={cardSurfaceStyle}>
            <CardContent>
              <Text style={styles.cardTitle}>Quick Actions</Text>
              <View style={styles.cardContent}>
                <TouchableOpacity testID="set-availability-button" style={styles.primaryButton} onPress={() => setAvailabilityVisible(true)}>
                  <Text style={styles.primaryButtonText}>Set Availability</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="create-auction-button" style={styles.secondaryButton} onPress={() => navigation.navigate('CreateAuction')}>
                  <Text style={styles.secondaryButtonText}>Create Auction</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  testID="view-calendar-button" 
                  style={styles.secondaryButton} 
                  onPress={() => navigation.navigate('Calendar')}
                >
                  <Text style={styles.secondaryButtonText}>View Calendar</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="qr-code-generator-button" style={styles.secondaryButton} onPress={() => navigation.navigate('QRCodeDemo')}>
                  <Text style={styles.secondaryButtonText}>QR Code Generator</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="process-auctions-button" style={styles.secondaryButton} onPress={handleManualAuctionProcessing}>
                  <Text style={styles.secondaryButtonText}>Process Expired Auctions</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="supabase-test-button" style={styles.secondaryButton} onPress={() => navigation.navigate('SupabaseTest')}>
                  <Text style={styles.secondaryButtonText}>Test Supabase</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="debug-button" style={styles.secondaryButton} onPress={() => navigation.navigate('Debug')}>
                  <Text style={styles.secondaryButtonText}>Debug Connection</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card style={cardSurfaceStyle}>
            <CardContent>
              <Text style={styles.cardTitle}>Recent Bids</Text>
              <View style={styles.cardContent}>
                {recentBids.length === 0 ? (
                  <Text style={{ color: 'rgba(255,255,255,0.7)' }}>No recent bids</Text>
                ) : recentBids.map((b) => (
                  <View key={b.id} style={styles.activityItem}>
                    <View style={styles.activityLeft}>
                      {/* Person Avatar for Bidder */}
                      <View style={styles.bidderAvatar}>
                        <Ionicons
                          name="person"
                          size={16}
                          color="rgba(255, 255, 255, 0.8)"
                        />
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityTitle}>New bid placed</Text>
                        <Text style={styles.activitySubtitle}>{new Date(b.created_at).toLocaleString()}</Text>
                      </View>
                    </View>
                    <Text style={styles.priceText}>{formatCHF(b.bid_amount)}</Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Active Auctions */}
          <Card style={cardSurfaceStyle}>
            <CardContent>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Your Active Auctions</Text>
                <TouchableOpacity testID="browse-auctions-button" onPress={() => navigation.navigate('BrowseAuctions')}>
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>
              <AuctionList filters={{ status: 'active', handymanId: user?.id }} embedded limit={3} emptyText="No active auctions" />
            </CardContent>
          </Card>
        </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  navHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  navHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  welcomeSection: {
    marginBottom: 32,
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
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
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
    gap: 12,
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
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  bidderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 4,
  },
  activitySubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  smallButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  smallButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  priceText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
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
  outlineButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  outlineButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
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
})

export default HandymanDashboard
