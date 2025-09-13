import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/AuthContext'
import { Background } from '../components/Background'
import { glassCard } from '../components/themeStyles'
import { useTheme } from '../contexts/ThemeContext'
import { AuctionList } from '../components/auction/AuctionList'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../navigation/AppNavigator'

type Nav = StackNavigationProp<RootStackParamList>
export function HandymanDashboard() {
  const { logout, user } = useAuth()
  const { theme } = useTheme()
  const navigation = useNavigation<Nav>()
  return (
    <Background style={styles.background}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <Text style={styles.subtitleText}>Manage your services and earnings</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Active Bookings</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>$2,450</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={[styles.card, theme === 'glass' && glassCard]}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <View style={styles.cardContent}>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Set Availability</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('CreateAuction')}>
                <Text style={styles.secondaryButtonText}>Create Auction</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>View Calendar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={[styles.card, theme === 'glass' && glassCard]}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <View style={styles.cardContent}>
              <View style={styles.activityItem}>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>New booking request</Text>
                  <Text style={styles.activitySubtitle}>Plumbing repair - Tomorrow 2PM</Text>
                </View>
                <TouchableOpacity style={styles.smallButton}>
                  <Text style={styles.smallButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.activityItem}>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>Auction bid received</Text>
                  <Text style={styles.activitySubtitle}>Electrical work - $150 bid</Text>
                </View>
                <Text style={styles.priceText}>$150</Text>
              </View>
            </View>
          </View>

          {/* Active Auctions */}
          <View style={[styles.card, theme === 'glass' && glassCard]}>
            <Text style={styles.cardTitle}>Your Active Auctions</Text>
            <AuctionList filters={{ status: 'active', handymanId: user?.id }} embedded limit={3} emptyText="No active auctions" />
          </View>
        </View>
      </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
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
})
