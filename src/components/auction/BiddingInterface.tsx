import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput } from 'react-native'
import { Button } from '../../components/ui/button'
import { useAuth } from '../../contexts/AuthContext'
import { useBidding } from '../../hooks/useBidding'
import { nextValidBid, formatCHF } from '../../utils/currency'
import { useToast } from '../../contexts/ToastContext'

interface Props {
  auctionId: string
  currentHighest: number
}

export function BiddingInterface({ auctionId, currentHighest }: Props) {
  const { user } = useAuth()
  const { highestBid, placeBid, placing, error } = useBidding(auctionId)
  const [amount, setAmount] = useState<number>(nextValidBid(currentHighest))
  const { show } = useToast()

  const submit = async () => {
    if (!user) return
    const res = await placeBid(user.id, amount)
    if (res.success) {
      show('Bid placed successfully', { type: 'success' })
    } else if (res.error) {
      show(res.error, { type: 'error', duration: 4000 })
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your bid</Text>
      <TextInput
        value={String(amount)}
        onChangeText={(t) => setAmount(parseInt(t || '0', 10))}
        keyboardType="numeric"
        style={styles.input}
      />
      <Button onPress={submit} disabled={placing} style={{ marginLeft: 8 }}>
        {placing ? 'Placing…' : 'Place Bid'}
      </Button>
      <Text style={styles.meta}>Highest: {formatCHF(highestBid ?? currentHighest)}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  label: { marginRight: 8 },
  input: { borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, minWidth: 80 },
  meta: { marginLeft: 12, color: '#666' },
  error: { marginLeft: 12, color: '#ef4444' },
})
