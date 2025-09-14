import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RouteProp, useRoute } from '@react-navigation/native'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Background } from '../components/Background'
import { auctionService } from '../services/auction.service'
import { Auction } from '../types/database.types'
import { AuctionTimer } from '../components/auction/AuctionTimer'
import { BiddingInterface } from '../components/auction/BiddingInterface'
import { formatCHF } from '../utils/currency'
import { supabase } from '../lib/supabase'
import { useBidding } from '../hooks/useBidding'
import { formatSwissDateTime } from '../utils/timezone'
import { useAuth } from '../contexts/AuthContext'

type Route = RouteProp<RootStackParamList, 'AuctionDetail'>

export function AuctionDetail() {
  const { params } = useRoute<Route>()
  const [auction, setAuction] = useState<Auction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { bids } = useBidding(auction?.id || '')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await auctionService.getAuction(params.id)
        setAuction(data)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load auction'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    load()
    // Realtime updates for this auction
    const channel = supabase
      .channel(`auction-row:${params.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auctions', filter: `id=eq.${params.id}` }, (payload) => {
        const next = payload.new as Partial<Auction> | null
        if (next) {
          setAuction((prev) => (prev ? { ...prev, ...next } as Auction : (next as Auction)))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.id])

  if (loading) {
    return (
      <Background style={styles.background}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.center}><ActivityIndicator size="large" color="#fff" /></View>
        </SafeAreaView>
      </Background>
    )
  }
  if (error || !auction) {
    return (
      <Background style={styles.background}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.center}><Text style={{ color: '#fff' }}>{error || 'Not found'}</Text></View>
        </SafeAreaView>
      </Background>
    )
  }

  const current = auction.current_highest_bid ?? auction.starting_price

  return (
    <Background style={styles.background}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{auction.title}</Text>
          <Text style={styles.subtitle}>{auction.service_type} · {auction.region}</Text>
          <View style={styles.row}><Text style={styles.label}>Current</Text><Text style={styles.value}>{formatCHF(current)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Time Left</Text><AuctionTimer endsAt={auction.ends_at} /></View>
        </View>

        {auction.status !== 'active' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Auction Summary</Text>
            <View style={styles.row}><Text style={styles.label}>Status</Text><Text style={styles.value}>{auction.status}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Final Price</Text><Text style={styles.value}>{formatCHF(auction.current_highest_bid ?? auction.starting_price)}</Text></View>
            {auction.winner_id && (
              <View style={styles.row}><Text style={styles.label}>Result</Text><Text style={styles.value}>{user?.id === auction.winner_id ? 'You won this auction' : 'Winner selected'}</Text></View>
            )}
          </View>
        )}

        {/* Show bidding interface only if user is not the handyman who created this auction */}
        {user?.id !== auction.handyman_id ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Place a Bid</Text>
            <BiddingInterface auctionId={auction.id} currentHighest={current} disabled={auction.status !== 'active'} />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Auction</Text>
            <Text style={styles.ownerInfo}>You created this auction. Customers can place bids to win your services.</Text>
            {bids.length > 0 && (
              <Text style={styles.ownerInfo}>Current highest bid: {formatCHF(current)}</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Bids</Text>
          {bids.length === 0 ? (
            <Text style={{ color: 'rgba(255,255,255,0.7)' }}>No bids yet. Be the first!</Text>
          ) : (
            (() => {
              // Filter bids based on user type
              const filteredBids = user?.id === auction.handyman_id
                ? bids // Handyman sees ALL bids
                : bids.filter(bid =>
                    bid.bidder_id !== user?.id || // Other users' bids
                    bid.id === bids.find(b => b.bidder_id === user?.id)?.id // Only user's latest bid
                  )

              return filteredBids.map((b) => (
                <View key={b.id} style={styles.bidRow}>
                  <View style={styles.bidLeftSection}>
                    {/* Placeholder Avatar */}
                    <View style={[styles.avatar, b.bidder_id === user?.id && styles.yourAvatar]}>
                      <Text style={styles.avatarText}>
                        {b.bidder_id === user?.id
                          ? 'Y'
                          : b.bidder_id.charAt(0).toUpperCase()
                        }
                      </Text>
                    </View>

                    <View style={styles.bidInfo}>
                      <Text style={styles.bidAmount}>{formatCHF(b.bid_amount)}</Text>
                      {b.bidder_id === user?.id && (
                        <Text style={styles.yourBidLabel}>(Your bid)</Text>
                      )}
                    </View>
                  </View>

                  <Text style={styles.bidMeta}>{formatSwissDateTime(b.created_at)}</Text>
                </View>
              ))
            })()
          )}
        </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  )
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  container: { paddingTop: 80, paddingBottom: 16 }, // Space for React Navigation transparent header
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { margin: 16, padding: 16, borderRadius: 16, backgroundColor: 'rgba(0, 0, 0, 0.35)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' },
  title: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  subtitle: { color: 'rgba(255, 255, 255, 0.8)', marginTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  label: { color: 'rgba(255, 255, 255, 0.7)' },
  value: { color: '#ffffff', fontWeight: '600' },
  section: { margin: 16, padding: 16, borderRadius: 16, backgroundColor: 'rgba(0, 0, 0, 0.35)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' },
  sectionTitle: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  bidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)' },
  bidLeftSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yourAvatar: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderColor: 'rgba(0, 255, 0, 0.5)',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  bidInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bidAmount: { color: '#ffffff', fontWeight: '600' },
  yourBidLabel: { color: 'rgba(0, 255, 0, 0.8)', fontSize: 12, fontWeight: '500' },
  bidMeta: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 },
  ownerInfo: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 16, marginBottom: 8 },
})
