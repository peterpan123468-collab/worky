import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native'
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

  const incrementBid = () => {
    setAmount(prev => prev + 5)
  }

  const decrementBid = () => {
    setAmount(prev => Math.max(prev - 5, 0))
  }

  const handleAmountChange = (text: string) => {
    const value = parseFloat(text || '0')
    setAmount(isNaN(value) ? 0 : value)
  }

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
          <Text style={styles.label}>Highest (CHF)</Text>
          <View style={styles.valueDisplay}>
            <Text style={styles.valueText}>{(highestBid ?? currentHighest).toFixed(2)}</Text>
          </View>
        </View>

        {/* Your Bid Section */}
        <View style={styles.bidGroup}>
          <Text style={styles.label}>Your bid (CHF)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              value={amount.toFixed(2)}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              style={[styles.input, disabled && { opacity: 0.6 }]}
              editable={!disabled && !placing}
              placeholder="0.00"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
            />
            <View style={styles.incrementButtons}>
              <TouchableOpacity
                onPress={incrementBid}
                style={[styles.incrementButton, disabled && { opacity: 0.6 }]}
                disabled={disabled || placing}
              >
                <Text style={styles.incrementText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={decrementBid}
                style={[styles.incrementButton, disabled && { opacity: 0.6 }]}
                disabled={disabled || placing}
              >
                <Text style={styles.incrementText}>−</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingRight: 50, // Space for increment buttons
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    color: '#ffffff',
    fontSize: 16,
  },
  incrementButtons: {
    position: 'absolute',
    right: 2,
    top: 2,
    bottom: 2,
    flexDirection: 'column',
  },
  incrementButton: {
    flex: 1,
    width: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginVertical: 1,
  },
  incrementText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
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
