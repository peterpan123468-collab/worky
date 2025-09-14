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
      <View style={styles.bidRow}>
        {/* Highest Bid Section */}
        <View style={styles.bidGroup}>
          <Text style={styles.label}>Highest</Text>
          <View style={styles.valueDisplay}>
            <Text style={styles.valueText}>{formatCHF(highestBid ?? currentHighest)}</Text>
          </View>
        </View>

        {/* Your Bid Section */}
        <View style={styles.bidGroup}>
          <Text style={styles.label}>Your bid</Text>
          <TextInput
            value={String(amount)}
            onChangeText={(t) => setAmount(parseInt(t || '0', 10))}
            keyboardType="numeric"
            style={[styles.input, disabled && { opacity: 0.6 }]}
            editable={!disabled && !placing}
            placeholder="0"
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
          />
        </View>

        {/* Place Bid Button */}
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
  bidRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  bidGroup: {
    flex: 1,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
    fontSize: 14,
  },
  valueDisplay: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'center',
  },
  valueText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
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
    paddingHorizontal: 16,
    flex: 1.2, // Slightly larger than the bid groups
  },
  error: {
    marginTop: 8,
    color: '#ef4444',
    fontSize: 14,
  },
})
