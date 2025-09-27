import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { QRCode } from '../components/ui/QRCode'
import { Background } from '../components/Background'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Button } from '../components/ui/button'

export function QRCodeDemo() {
  const [text, setText] = useState('https://worky.ch')
  const [qrValue, setQrValue] = useState('https://worky.ch')

  const generateQRCode = () => {
    setQrValue(text)
  }

  return (
    <Background style={styles.background}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.container}>
            <Card style={styles.card}>
              <CardHeader>
                <Text style={styles.title}>QR Code Generator</Text>
                <Text style={styles.subtitle}>Generate QR codes for Worky services</Text>
              </CardHeader>
              <CardContent>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Enter text or URL:</Text>
                  <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    placeholder="https://worky.ch"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                  <Button 
                    onPress={generateQRCode} 
                    style={styles.generateButton}
                  >
                    Generate QR Code
                  </Button>
                </View>
                
                <View style={styles.qrContainer}>
                  <QRCode 
                    value={qrValue} 
                    size={200} 
                    color="#ffffff" 
                    backgroundColor="transparent"
                  />
                  <Text style={styles.qrText}>{qrValue}</Text>
                </View>
                
                <View style={styles.useCases}>
                  <Text style={styles.sectionTitle}>Common Use Cases:</Text>
                  <View style={styles.useCaseItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.useCaseText}>Share your Worky profile</Text>
                  </View>
                  <View style={styles.useCaseItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.useCaseText}>Promote your services</Text>
                  </View>
                  <View style={styles.useCaseItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.useCaseText}>Link to auction details</Text>
                  </View>
                  <View style={styles.useCaseItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.useCaseText}>Share booking information</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  qrText: {
    marginTop: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 14,
  },
  useCases: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  useCaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#ffffff',
    marginRight: 8,
  },
  useCaseText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
})