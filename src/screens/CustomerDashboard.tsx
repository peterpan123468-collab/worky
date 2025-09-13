import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/AuthContext'
import { Background } from '../components/Background'
import { useTheme } from '../contexts/ThemeContext'
import { glassCard } from '../components/themeStyles'
import Ionicons from '@expo/vector-icons/Ionicons'
import { RootStackParamList } from '../navigation/AppNavigator'

type Nav = StackNavigationProp<RootStackParamList>
export function CustomerDashboard() {
  const { logout } = useAuth()
  const { theme } = useTheme()
  const navigation = useNavigation<Nav>()
  return (
    <Background style={styles.background}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>Find Help</Text>
              <Text style={styles.subtitleText}>Book services or join auctions</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchCard, theme === 'glass' && glassCard]}>
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
          </View>

          {/* Quick Actions */}
          <View style={[styles.card, theme === 'glass' && glassCard]}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <View style={styles.cardContent}>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Browse Available Slots</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('BrowseAuctions')}>
                <Text style={styles.secondaryButtonText}>Join Auctions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>My Bookings</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Available Services */}
          <View style={[styles.card, theme === 'glass' && glassCard]}>
            <Text style={styles.cardTitle}>Available Services</Text>
            <View style={styles.cardContent}>
              <View style={styles.serviceItem}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName}>Mike's Plumbing</Text>
                  <Text style={styles.servicePrice}>$75/hr</Text>
                </View>
                <Text style={styles.serviceTime}>Available tomorrow 2PM-4PM</Text>
                <View style={styles.serviceFooter}>
                  <View style={styles.serviceRatingRow}>
                    <Ionicons name="star" size={14} color="#f5c518" />
                    <Text style={styles.serviceRatingText}>4.8 (24 reviews)</Text>
                  </View>
                  <TouchableOpacity style={styles.bookButton}>
                    <Text style={styles.bookButtonText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.serviceItem}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceName}>Sarah's Electrical</Text>
                  <Text style={styles.servicePrice}>$90/hr</Text>
                </View>
                <Text style={styles.serviceTime}>Available today 6PM-8PM</Text>
                <View style={styles.serviceFooter}>
                  <View style={styles.serviceRatingRow}>
                    <Ionicons name="star" size={14} color="#f5c518" />
                    <Text style={styles.serviceRatingText}>4.9 (18 reviews)</Text>
                  </View>
                  <TouchableOpacity style={styles.bookButton}>
                    <Text style={styles.bookButtonText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Live Auctions */}
          <View style={[styles.card, theme === 'glass' && glassCard]}>
            <Text style={styles.cardTitle}>Live Auctions</Text>
            <View style={styles.cardContent}>
              <View style={styles.auctionItem}>
                <View style={styles.auctionHeader}>
                  <Text style={styles.auctionTitle}>Kitchen Renovation</Text>
                  <Text style={styles.auctionPrice}>$200</Text>
                </View>
                <Text style={styles.auctionSubtitle}>Current highest bid</Text>
                <View style={styles.auctionFooter}>
                  <Text style={styles.auctionTime}>Ends in 2h 15m</Text>
                  <TouchableOpacity style={styles.bidButton}>
                    <Text style={styles.bidButtonText}>Place Bid</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.auctionItem}>
                <View style={styles.auctionHeader}>
                  <Text style={styles.auctionTitle}>Bathroom Repair</Text>
                  <Text style={styles.auctionPrice}>$120</Text>
                </View>
                <Text style={styles.auctionSubtitle}>Your bid is winning</Text>
                <View style={styles.auctionFooter}>
                  <Text style={styles.auctionTime}>Ends in 45m</Text>
                  <Text style={styles.winningText}>Winning</Text>
                </View>
              </View>
            </View>
          </View>

          {/* My Bookings */}
          <View style={[styles.card, theme === 'glass' && glassCard]}>
            <Text style={styles.cardTitle}>My Bookings</Text>
            <View style={styles.cardContent}>
              <View style={styles.bookingItem}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingTitle}>Plumbing Repair</Text>
                  <Text style={styles.bookingPrice}>$150</Text>
                </View>
                <Text style={styles.bookingDetails}>Tomorrow 2PM - Mike's Plumbing</Text>
                <Text style={styles.confirmedStatus}>Confirmed</Text>
              </View>
              
              <View style={styles.bookingItem}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingTitle}>Electrical Work</Text>
                  <Text style={styles.bookingPrice}>$180</Text>
                </View>
                <Text style={styles.bookingDetails}>Friday 10AM - Sarah's Electrical</Text>
                <Text style={styles.pendingStatus}>Pending</Text>
              </View>
            </View>
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
  searchCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
