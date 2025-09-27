import React from 'react'
import { ScrollView, StyleSheet, View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import { Background } from '../components/Background'
import { AuctionCreationForm } from '../components/auction/AuctionCreationForm'
import { RootStackParamList } from '../navigation/AppNavigator'

export function CreateAuction() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  return (
    <Background style={styles.background}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container}>
          <AuctionCreationForm onCreated={(id) => navigation.navigate('AuctionDetail', { id })} />
        </ScrollView>
      </SafeAreaView>
    </Background>
  )
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  container: { paddingTop: 80, paddingBottom: 24 }, // Space for React Navigation transparent header
  header: { margin: 16, padding: 16, borderRadius: 16, backgroundColor: 'rgba(0, 0, 0, 0.35)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' },
  headerText: { color: '#ffffff', fontSize: 20, fontWeight: '600' },
})
