import React from 'react'
import { View, FlatList, Text } from 'react-native'
import { useAuctions } from '../../hooks/useAuctions'
import { AuctionCard } from './AuctionCard'

export function AuctionList() {
  const { auctions, loading, error, refresh } = useAuctions({ status: 'active' })

  if (loading) return <Text style={{ padding: 16 }}>Loading auctions…</Text>
  if (error) return <Text style={{ padding: 16, color: '#ef4444' }}>{error}</Text>

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <FlatList
        data={auctions}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => <AuctionCard auction={item} />}
        onRefresh={refresh}
        refreshing={loading}
      />
    </View>
  )
}

