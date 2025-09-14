import React from 'react'
import { ScrollView, StyleSheet, View, Text } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Background } from '../components/Background'
import { AuctionCreationForm } from '../components/auction/AuctionCreationForm'
import { useTheme } from '../contexts/ThemeContext'
import { glassCard } from '../components/themeStyles'
import { RootStackParamList } from '../navigation/AppNavigator'

export function CreateAuction() {
  const { theme } = useTheme()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  return (
    <Background style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.header, theme === 'glass' && glassCard]}> 
          <Text style={styles.headerText}>Create New Auction</Text>
        </View>
        <AuctionCreationForm onCreated={(id) => navigation.navigate('AuctionDetail', { id })} />
      </ScrollView>
    </Background>
  )
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { paddingVertical: 24 },
  header: { margin: 16, padding: 16, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  headerText: { color: '#fff', fontSize: 20, fontWeight: '600' },
})
