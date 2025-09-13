import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native'
import { Card, CardContent, CardHeader } from '../../components/ui/card'
import { Auction } from '../../types/database.types'
import { formatCHF } from '../../utils/currency'
import { formatSwissDateTime } from '../../utils/timezone'

interface Props {
  auction: Auction
  onPress?: () => void
  style?: ViewStyle
}

export function AuctionCard({ auction, onPress, style }: Props) {
  const Container: React.ComponentType<any> = onPress ? TouchableOpacity : View
  const containerProps = onPress ? { onPress, activeOpacity: 0.8 } : {}
  return (
    <Card style={[styles.card, style]}>
      <CardHeader>
        <Container {...containerProps}>
          <Text style={styles.title}>{auction.title}</Text>
        </Container>
        <Text style={styles.subtitle}>{auction.service_type} · {auction.region}</Text>
      </CardHeader>
      <CardContent>
        <View style={styles.row}><Text style={styles.label}>Ends</Text>
          <Text>{formatSwissDateTime(auction.ends_at)}</Text>
        </View>
        <View style={styles.row}><Text style={styles.label}>Current</Text>
          <Text>{formatCHF(auction.current_highest_bid ?? auction.starting_price)}</Text>
        </View>
        <View style={[styles.row, { marginTop: 10 }]}>
          <Text style={styles.status}>{auction.status}</Text>
        </View>
      </CardContent>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginVertical: 8 },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { color: '#666', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  label: { color: '#666' },
  status: { fontSize: 12, color: '#0f766e', backgroundColor: '#ccfbf1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
})
