import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native'
import { Card, CardContent, CardHeader } from '../../components/ui/card'
import { useTheme } from '../../contexts/ThemeContext'
import { glassCard } from '../themeStyles'
import { Auction } from '../../types/database.types'
import { formatCHF } from '../../utils/currency'
import { formatSwissDateTime } from '../../utils/timezone'

interface Props {
  auction: Auction
  onPress?: () => void
  style?: ViewStyle
}

export function AuctionCard({ auction, onPress, style }: Props) {
  const { theme } = useTheme()
  const Container: React.ComponentType<any> = onPress ? TouchableOpacity : View
  const containerProps = onPress ? { onPress, activeOpacity: 0.8 } : {}
  return (
    <Card style={[styles.card, theme === 'glass' && glassCard, style]}>
      <CardHeader>
        <Container {...containerProps}>
          <Text style={[styles.title, theme === 'glass' && styles.titleGlass]}>{auction.title}</Text>
        </Container>
        <Text style={[styles.subtitle, theme === 'glass' && styles.subtitleGlass]}>{auction.service_type} · {auction.region}</Text>
      </CardHeader>
      <CardContent>
        <View style={styles.row}><Text style={[styles.label, theme === 'glass' && styles.labelGlass]}>Ends</Text>
          <Text style={theme === 'glass' && styles.valueGlass as any}>{formatSwissDateTime(auction.ends_at)}</Text>
        </View>
        <View style={styles.row}><Text style={[styles.label, theme === 'glass' && styles.labelGlass]}>Current</Text>
          <Text style={theme === 'glass' && styles.valueGlass as any}>{formatCHF(auction.current_highest_bid ?? auction.starting_price)}</Text>
        </View>
        <View style={[styles.row, { marginTop: 10 }]}>
          <Text style={[styles.status, theme === 'glass' && styles.statusGlass]}>{auction.status}</Text>
        </View>
      </CardContent>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { marginVertical: 8, borderRadius: 16 },
  title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  titleGlass: { color: '#ffffff' },
  subtitle: { color: '#666', marginTop: 4 },
  subtitleGlass: { color: 'rgba(255, 255, 255, 0.8)' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  label: { color: '#666' },
  labelGlass: { color: 'rgba(255, 255, 255, 0.7)' },
  valueGlass: { color: '#ffffff' },
  status: { fontSize: 12, color: '#0f766e', backgroundColor: '#ccfbf1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusGlass: { color: '#e5e7eb', backgroundColor: 'rgba(255,255,255,0.12)' },
})
