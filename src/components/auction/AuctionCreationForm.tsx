import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native'
import { Card, CardContent, CardHeader } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { useAuth } from '../../contexts/AuthContext'
import { auctionService } from '../../services/auction.service'
import { sanitizeStartingPrice, CHF_MINIMUM, CHF_INCREMENT, formatCHF } from '../../utils/currency'
import { addMinutes, formatSwissDateTime, nowSwiss } from '../../utils/timezone'

interface Props {
  onCreated?: (auctionId: string) => void
}

export function AuctionCreationForm({ onCreated }: Props) {
  const { user } = useAuth()
  const [title, setTitle] = useState('General Handyman Service')
  const [serviceType, setServiceType] = useState('handyman')
  const [region, setRegion] = useState('Zurich')
  const [startingPrice, setStartingPrice] = useState<number>(CHF_MINIMUM)
  const [durationMin, setDurationMin] = useState<number>(60)
  const [reservePrice, setReservePrice] = useState<number | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)

  const start = nowSwiss()
  const end = addMinutes(start, durationMin)

  const create = async () => {
    if (!user) return Alert.alert('Not signed in')
    try {
      setSubmitting(true)
      const payload = {
        title,
        description: null as any,
        service_type: serviceType,
        region,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        starting_price: sanitizeStartingPrice(startingPrice),
        reserve_price: reservePrice ?? null,
        bid_increment: CHF_INCREMENT,
        auto_extend: true,
        auto_extend_minutes: 2,
      }
      const auction = await auctionService.createAuction(user.id, payload)
      onCreated?.(auction.id)
      Alert.alert('Auction created', `#${auction.id}`)
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to create auction')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card style={styles.card}>
      <CardHeader>
        <Text style={styles.title}>Create Auction</Text>
        <Text style={styles.subtitle}>Start: {formatSwissDateTime(start)} · End: {formatSwissDateTime(end)}</Text>
      </CardHeader>
      <CardContent>
        <View style={styles.row}><Text style={styles.label}>Title</Text>
          <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Auction title" />
        </View>
        <View style={styles.row}><Text style={styles.label}>Service</Text>
          <TextInput value={serviceType} onChangeText={setServiceType} style={styles.input} placeholder="Service type" />
        </View>
        <View style={styles.row}><Text style={styles.label}>Region</Text>
          <TextInput value={region} onChangeText={setRegion} style={styles.input} placeholder="Region" />
        </View>
        <View style={styles.row}><Text style={styles.label}>Starting Price</Text>
          <TextInput
            value={String(startingPrice)}
            onChangeText={(t) => setStartingPrice(parseInt(t || '0', 10))}
            style={styles.input}
            keyboardType="numeric"
            placeholder="CHF"
          />
          <Text style={styles.hint}>{formatCHF(startingPrice)} (min CHF {CHF_MINIMUM})</Text>
        </View>
        <View style={styles.row}><Text style={styles.label}>Duration (min)</Text>
          <TextInput
            value={String(durationMin)}
            onChangeText={(t) => setDurationMin(parseInt(t || '60', 10))}
            style={styles.input}
            keyboardType="numeric"
            placeholder="Duration in minutes"
          />
        </View>
        <View style={styles.row}><Text style={styles.label}>Reserve Price (opt.)</Text>
          <TextInput
            value={reservePrice ? String(reservePrice) : ''}
            onChangeText={(t) => setReservePrice(t ? parseInt(t, 10) : undefined)}
            style={styles.input}
            keyboardType="numeric"
            placeholder="Reserve price"
          />
        </View>
        <Button onPress={create} disabled={submitting} style={{ marginTop: 12 }}>
          {submitting ? 'Creating…' : 'Create Auction'}
        </Button>
      </CardContent>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { margin: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  subtitle: { color: '#666' },
  row: { marginTop: 12 },
  label: { marginBottom: 6, color: '#444' },
  input: { borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  hint: { marginTop: 4, color: '#666', fontSize: 12 },
})

