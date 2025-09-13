import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { RouteProp, useRoute } from '@react-navigation/native'
import { RootStackParamList } from '../navigation/AppNavigator'
import { Background } from '../components/Background'
import { useTheme } from '../contexts/ThemeContext'
import { glassCard } from '../components/themeStyles'
import { auctionService } from '../services/auction.service'
import { Auction } from '../types/database.types'
import { AuctionTimer } from '../components/auction/AuctionTimer'
import { BiddingInterface } from '../components/auction/BiddingInterface'
import { formatCHF } from '../utils/currency'

type Route = RouteProp<RootStackParamList, 'AuctionDetail'>

export function AuctionDetail() {
  const { params } = useRoute<Route>()
  const { theme } = useTheme()
  const [auction, setAuction] = useState<Auction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  }, [params.id])

  if (loading) {
    return (
      <Background style={styles.background}>
        <View style={styles.center}><ActivityIndicator size="large" color="#fff" /></View>
      </Background>
    )
  }
  if (error || !auction) {
    return (
      <Background style={styles.background}>
        <View style={styles.center}><Text style={{ color: '#fff' }}>{error || 'Not found'}</Text></View>
      </Background>
    )
  }

  const current = auction.current_highest_bid ?? auction.starting_price

  return (
    <Background style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.header, theme === 'glass' && glassCard]}>
          <Text style={styles.title}>{auction.title}</Text>
          <Text style={styles.subtitle}>{auction.service_type} · {auction.region}</Text>
          <View style={styles.row}><Text style={styles.label}>Current</Text><Text style={styles.value}>{formatCHF(current)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Time Left</Text><AuctionTimer endsAt={auction.ends_at} /></View>
        </View>

        <View style={[styles.section, theme === 'glass' && glassCard]}>
          <Text style={styles.sectionTitle}>Place a Bid</Text>
          <BiddingInterface auctionId={auction.id} currentHighest={current} />
        </View>
      </ScrollView>
    </Background>
  )
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { paddingVertical: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { margin: 16, padding: 16, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  label: { color: 'rgba(255,255,255,0.7)' },
  value: { color: '#fff', fontWeight: '600' },
  section: { margin: 16, padding: 16, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 },
})

