import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { Card, CardContent } from './ui/card'
import { formatCHF } from '../utils/currency'
import { formatSwissDateTime } from '../utils/timezone'
import { AuctionBid } from '../types/database.types'

interface BiddingHistoryProps {
  bids: AuctionBid[]
  onAuctionPress?: (auctionId: string) => void
}

export function BiddingHistory({ bids, onAuctionPress }: BiddingHistoryProps) {
  const renderBidItem = ({ item }: { item: AuctionBid }) => (
    <Card style={styles.bidCard}>
      <CardContent style={styles.bidContent}>
        <View style={styles.bidHeader}>
          <Text style={styles.bidAmount}>{formatCHF(item.bid_amount)}</Text>
          <Text style={styles.bidTime}>{item.bid_time ? formatSwissDateTime(item.bid_time) : 'Unknown time'}</Text>
        </View>
        <View style={styles.bidFooter}>
          <Text style={styles.bidStatus}>
            {item.is_winning_bid ? 'Winning Bid' : 'Outbid'}
          </Text>
          {onAuctionPress && (
            <Text 
              style={styles.viewAuction} 
              onPress={() => onAuctionPress(item.auction_id)}
            >
              View Auction
            </Text>
          )}
        </View>
      </CardContent>
    </Card>
  )

  if (bids.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No bidding history</Text>
        <Text style={styles.emptySubtext}>Your bids on auctions will appear here</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bidding History</Text>
      <FlatList
        data={bids}
        renderItem={renderBidItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
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
  listContent: {
    gap: 12,
  },
  bidCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bidContent: {
    padding: 16,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  bidTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  bidFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidStatus: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  viewAuction: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
})