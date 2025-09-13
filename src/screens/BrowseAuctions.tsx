import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Background } from '../components/Background'
import { AuctionList } from '../components/auction/AuctionList'
import { useTheme } from '../contexts/ThemeContext'
import { glassCard } from '../components/themeStyles'

export function BrowseAuctions() {
  const { theme } = useTheme()
  return (
    <Background style={styles.background}>
      <View style={styles.container}>
        <View style={[styles.header, theme === 'glass' && glassCard]}>
          <Text style={styles.headerText}>Active Auctions</Text>
        </View>
        <AuctionList />
      </View>
    </Background>
  )
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: { margin: 16, padding: 16, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  headerText: { color: '#fff', fontSize: 20, fontWeight: '600' },
})

