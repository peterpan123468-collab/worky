import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Card, CardContent } from './ui/card'
import { formatCHF } from '../utils/currency'
import { useTheme } from '../contexts/ThemeContext'
import { glassCard } from './themeStyles'

interface AuctionAnalyticsProps {
  stats: {
    totalAuctions: number
    activeAuctions: number
    completedAuctions: number
    totalRevenue: number
    avgBidCount: number
    winRate: number
  }
}

type RootStackParamList = {
  AllAuctions: undefined
  // Add other screens as needed
}

type Nav = StackNavigationProp<RootStackParamList>

export function AuctionAnalytics({ stats }: AuctionAnalyticsProps) {
  const navigation = useNavigation<Nav>()
  const { theme } = useTheme()
  const cardSurfaceStyle = theme === 'glass' ? glassCard : undefined
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auction Performance</Text>
      
      <View style={styles.grid}>
        <TouchableOpacity 
          style={styles.statCardTouchable}
          onPress={() => navigation.navigate('AllAuctions')}
        >
          <Card style={[styles.statCard, cardSurfaceStyle]}>
            <CardContent style={styles.statContent}>
              <Text style={styles.statValue}>{stats.totalAuctions}</Text>
              <Text style={styles.statLabel}>Total Auctions</Text>
            </CardContent>
          </Card>
        </TouchableOpacity>
        
        <View style={styles.statCardWrapper}>
          <Card style={[styles.statCard, cardSurfaceStyle]}>
            <CardContent style={styles.statContent}>
              <Text style={styles.statValue}>{stats.activeAuctions}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </CardContent>
          </Card>
        </View>
        
        <View style={styles.statCardWrapper}>
          <Card style={[styles.statCard, cardSurfaceStyle]}>
            <CardContent style={styles.statContent}>
              <Text style={styles.statValue}>{stats.completedAuctions}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </CardContent>
          </Card>
        </View>
        
        <View style={styles.statCardWrapper}>
          <Card style={[styles.statCard, cardSurfaceStyle]}>
            <CardContent style={styles.statContent}>
              <Text style={styles.statValue}>{formatCHF(stats.totalRevenue)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </CardContent>
          </Card>
        </View>
        
        <View style={styles.statCardWrapper}>
          <Card style={[styles.statCard, cardSurfaceStyle]}>
            <CardContent style={styles.statContent}>
              <Text style={styles.statValue}>{stats.avgBidCount.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg Bids</Text>
            </CardContent>
          </Card>
        </View>
        
        <View style={styles.statCardWrapper}>
          <Card style={[styles.statCard, cardSurfaceStyle]}>
            <CardContent style={styles.statContent}>
              <Text style={styles.statValue}>{Math.round(stats.winRate * 100)}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </CardContent>
          </Card>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12, // Further reduced from 16
  },
  title: {
    fontSize: 16, // Further reduced from 18
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8, // Further reduced from 12
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4, // Further reduced from 6
  },
  statCardTouchable: {
    width: '32%',
    marginBottom: 4, // Further reduced from 6
  },
  statCardWrapper: {
    width: '32%',
    marginBottom: 4, // Further reduced from 6
  },
  statCard: {
    minHeight: 50, // Further reduced from 60
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8, // Further reduced from 10
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 4, // Further reduced from 6
    paddingHorizontal: 3,
  },
  statValue: {
    fontSize: 12, // Further reduced from 14
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 1, // Further reduced from 2
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9, // Further reduced from 10
    textAlign: 'center',
  },
})