import React from 'react'
import { View, FlatList, Text } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useAuctions } from '../../hooks/useAuctions'
import { AuctionCard } from './AuctionCard'
import { RootStackParamList } from '../../navigation/AppNavigator'
import { AuctionFilters } from '../../types/auction.types'

interface Props {
  filters?: AuctionFilters
  embedded?: boolean
  limit?: number
  emptyText?: string
}

export function AuctionList({ filters = { status: 'active' }, embedded = false, limit, emptyText }: Props) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { auctions, loading, error, refresh } = useAuctions(filters)

  if (loading) return <Text style={{ padding: 16 }}>Loading auctions…</Text>
  if (error) return <Text style={{ padding: 16, color: '#ef4444' }}>{error}</Text>

  const data = limit ? auctions.slice(0, limit) : auctions

  if (!loading && data.length === 0 && emptyText) {
    return <Text style={{ padding: 16, color: '#999' }}>{emptyText}</Text>
  }

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <FlatList
        data={data}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <AuctionCard auction={item} onPress={() => navigation.navigate('AuctionDetail', { id: item.id })} />
        )}
        onRefresh={refresh}
        refreshing={loading}
        scrollEnabled={!embedded}
      />
    </View>
  )
}
