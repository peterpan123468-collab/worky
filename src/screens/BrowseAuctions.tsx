import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Background } from '../components/Background'
import { AuctionList } from '../components/auction/AuctionList'

export function BrowseAuctions() {
  const [serviceType, setServiceType] = useState('')
  const [region, setRegion] = useState('')
  const filters = useMemo(() => ({ status: 'active' as const, serviceType: serviceType || undefined, region: region || undefined }), [serviceType, region])
  return (
    <Background style={styles.background}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <View style={styles.filters}>
            <Text style={styles.filterTitle}>Filters</Text>
            <View style={styles.filterRow}>
              <View style={styles.filterGroup}>
                <Text style={styles.label}>Service</Text>
                <TextInput value={serviceType} onChangeText={setServiceType} placeholder="e.g., plumbing" placeholderTextColor="#aaa" style={styles.input} />
              </View>
              <View style={styles.filterGroup}>
                <Text style={styles.label}>Region</Text>
                <TextInput value={region} onChangeText={setRegion} placeholder="e.g., Zurich" placeholderTextColor="#aaa" style={styles.input} />
              </View>
              <TouchableOpacity onPress={() => { setServiceType(''); setRegion('') }} style={styles.clearButton}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          <AuctionList filters={filters} />
        </View>
      </SafeAreaView>
    </Background>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 80, // Space for React Navigation transparent header
  },
  filters: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  filterTitle: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8
  },
  filterGroup: {
    flex: 1
  },
  label: {
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.25)'
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  clearText: {
    color: '#fff'
  },
})
