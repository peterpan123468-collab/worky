import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Card, CardContent } from '../components/ui/card'
import { Background } from '../components/Background'
import { AuctionCard } from '../components/auction/AuctionCard'
import { useAuth } from '../contexts/AuthContext'
import { auctionService } from '../services/auction.service'
import { Auction } from '../types/database.types'
import { formatCHF } from '../utils/currency'

type RootStackParamList = {
  AuctionDetail: { id: string }
  // Add other screens as needed
}

type Nav = StackNavigationProp<RootStackParamList>

export function AllAuctions() {
  const navigation = useNavigation<Nav>()
  const { user } = useAuth()
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAuctions = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const data = await auctionService.listAuctions({ handymanId: user.id })
      setAuctions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auctions')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    if (!user?.id) return

    setRefreshing(true)
    try {
      const data = await auctionService.listAuctions({ handymanId: user.id })
      setAuctions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auctions')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAuctions()
  }, [user?.id])

  if (loading) {
    return (
      <Background style={styles.background}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>All Auctions</Text>
            <Text style={styles.subtitle}>History of all your auctions</Text>
          </View>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        </View>
      </Background>
    )
  }

  if (error) {
    return (
      <Background style={styles.background}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>All Auctions</Text>
            <Text style={styles.subtitle}>History of all your auctions</Text>
          </View>
          <Card style={styles.errorCard}>
            <CardContent>
              <Text style={styles.errorText}>{error}</Text>
            </CardContent>
          </Card>
        </View>
      </Background>
    )
  }

  return (
    <Background style={styles.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>All Auctions</Text>
          <Text style={styles.subtitle}>History of all your auctions</Text>
        </View>
        
        <ScrollView
          style={styles.scroll}
          refreshControl={
            <RefreshControl
              tintColor="#ffffff"
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          {auctions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <CardContent>
                <Text style={styles.emptyText}>No auctions found</Text>
              </CardContent>
            </Card>
          ) : (
            <View style={styles.auctionsList}>
              {auctions.map((auction) => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  onPress={() => navigation.navigate('AuctionDetail', { id: auction.id })}
                />
              ))}
            </View>
          )}
          
          <View style={styles.summaryCard}>
            <Card>
              <CardContent>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Auctions:</Text>
                  <Text style={styles.summaryValue}>{auctions.length}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Active:</Text>
                  <Text style={styles.summaryValue}>
                    {auctions.filter(a => a.status === 'active').length}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Completed:</Text>
                  <Text style={styles.summaryValue}>
                    {auctions.filter(a => a.status === 'ended').length}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Revenue:</Text>
                  <Text style={styles.summaryValue}>
                    {formatCHF(auctions
                      .filter(a => a.status === 'ended' && a.current_highest_bid)
                      .reduce((sum, auction) => sum + (auction.current_highest_bid || 0), 0)
                    )}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  auctionsList: {
    gap: 16,
  },
  errorCard: {
    borderRadius: 16,
  },
  errorText: {
    color: '#f87171',
    textAlign: 'center',
  },
  emptyCard: {
    borderRadius: 16,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingVertical: 20,
  },
  summaryCard: {
    marginTop: 20,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})