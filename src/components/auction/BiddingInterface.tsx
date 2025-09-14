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
  disabled?: boolean
}

export function BiddingInterface({ auctionId, currentHighest, disabled = false }: Props) {
  const { user } = useAuth()
  const { show } = useToast()
  const { highestBid, placeBid, placing, error } = useBidding(auctionId, {
    currentUserId: user?.id,
    onOutbid: () => show("You've been outbid", { type: 'info' }),
  })
  const [amount, setAmount] = useState<number>(nextValidBid(currentHighest))

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
      <View style={styles.topRow}>
        <Text style={styles.meta}>Highest: {formatCHF(highestBid ?? currentHighest)}</Text>
      </View>

      <View style={styles.bidRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your bid</Text>
          <TextInput
            value={String(amount)}
            onChangeText={(t) => setAmount(parseInt(t || '0', 10))}
            keyboardType="numeric"
            style={[styles.input, disabled && { opacity: 0.6 }]}
            editable={!disabled && !placing}
            placeholder="Enter amount"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
          />
        </View>

        <Button onPress={submit} disabled={placing || disabled} style={styles.button}>
          {placing ? 'Placing…' : 'Place Bid'}
        </Button>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {disabled ? <Text style={[styles.error, { color: '#f59e0b' }]}>Bidding is closed</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  topRow: {
    marginBottom: 12,
  },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    color: '#ffffff',
    fontSize: 16,
  },
  button: {
    paddingHorizontal: 20,
  },
  meta: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    marginTop: 8,
    color: '#ef4444',
    fontSize: 14,
  },
})
