import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Card, CardContent } from './ui/card'
import { formatCHF } from '../utils/currency'

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

export function AuctionAnalytics({ stats }: AuctionAnalyticsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auction Performance</Text>
      
      <View style={styles.grid}>
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <Text style={styles.statValue}>{stats.totalAuctions}</Text>
            <Text style={styles.statLabel}>Total Auctions</Text>
          </CardContent>
        </Card>
        
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <Text style={styles.statValue}>{stats.activeAuctions}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </CardContent>
        </Card>
        
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <Text style={styles.statValue}>{stats.completedAuctions}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </CardContent>
        </Card>
        
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <Text style={styles.statValue}>{formatCHF(stats.totalRevenue)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </CardContent>
        </Card>
        
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <Text style={styles.statValue}>{stats.avgBidCount.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Avg Bids</Text>
          </CardContent>
        </Card>
        
        <Card style={styles.statCard}>
          <CardContent style={styles.statContent}>
            <Text style={styles.statValue}>{Math.round(stats.winRate * 100)}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </CardContent>
        </Card>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statContent: {
    alignItems: 'center',
    padding: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
})