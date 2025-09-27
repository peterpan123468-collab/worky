import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { runManualAuthTests, testNewUserRegistration, migrateExistingUser } from '../test/manual-auth-test'

export function TestAuthScreen() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<string>('')

  const runTests = async () => {
    setIsRunning(true)
    setResults('Running tests...\n')

    try {
      // Capture console.log output
      const originalConsoleLog = console.log
      let output = ''

      console.log = (...args) => {
        const message = args.join(' ')
        output += message + '\n'
        originalConsoleLog(...args)
        setResults(output)
      }

      // Run the tests
      const testResult = await runManualAuthTests()

      // Restore console.log
      console.log = originalConsoleLog

      if (testResult.needsMigration) {
        Alert.alert(
          'Migration Required',
          'User exists but needs user_type assignment. Migrate to customer or handyman?',
          [
            {
              text: 'Customer',
              onPress: () => migrateUser('customer')
            },
            {
              text: 'Handyman',
              onPress: () => migrateUser('handyman')
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        )
      }

    } catch (error) {
      setResults(prev => prev + '\n❌ Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsRunning(false)
    }
  }

  const migrateUser = async (userType: 'customer' | 'handyman') => {
    setResults(prev => prev + `\n🔄 Migrating user to ${userType}...`)

    const migrationResult = await migrateExistingUser('atemndobs@gmail.com', userType)

    if (migrationResult.success) {
      setResults(prev => prev + '\n✅ Migration successful! Try logging in again.')
      Alert.alert('Success', 'User migrated successfully. Try the test again.')
    } else {
      setResults(prev => prev + '\n❌ Migration failed: ' + migrationResult.error)
      Alert.alert('Error', 'Migration failed: ' + migrationResult.error)
    }
  }

  const testRegistration = async () => {
    setIsRunning(true)
    setResults('Testing new user registration...\n')

    try {
      const originalConsoleLog = console.log
      let output = ''

      console.log = (...args) => {
        const message = args.join(' ')
        output += message + '\n'
        originalConsoleLog(...args)
        setResults(output)
      }

      await testNewUserRegistration()
      console.log = originalConsoleLog

    } catch (error) {
      setResults(prev => prev + '\n❌ Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsRunning(false)
    }
  }

  const clearResults = () => {
    setResults('')
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Auth Testing Suite</Text>
        <Text style={styles.subtitle}>Test real Supabase authentication</Text>
      </View>

      {/* Test credentials panel shown only here */}
      <View style={styles.credBox}>
        <View style={styles.credRow}>
          <Ionicons name="create-outline" size={14} color="#22c55e" />
          <Text style={styles.credText}>Test User: atemndobs@gmail.com</Text>
        </View>
        <View style={styles.credRow}>
          <Ionicons name="key-outline" size={14} color="#f59e0b" />
          <Text style={styles.credText}>Password: Atem1234</Text>
        </View>
        <View style={styles.credRow}>
          <Ionicons name="stats-chart" size={14} color="#22c55e" />
          <Text style={styles.credText}>Using Real Supabase Database</Text>
        </View>
      </View>

      <Card style={styles.card}>
        <CardHeader>
          <Text style={styles.cardTitle}>Test Existing User</Text>
        </CardHeader>
        <CardContent>
          <Text style={styles.description}>
            Test login with: atemndobs@gmail.com / Atem1234
          </Text>
          <Button
            onPress={runTests}
            disabled={isRunning}
            style={styles.button}
          >
            {isRunning ? 'Running Tests...' : 'Test Existing User Login'}
          </Button>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardHeader>
          <Text style={styles.cardTitle}>Test New Registration</Text>
        </CardHeader>
        <CardContent>
          <Text style={styles.description}>
            Test customer and handyman registration flows
          </Text>
          <Button
            onPress={testRegistration}
            disabled={isRunning}
            variant="secondary"
            style={styles.button}
          >
            {isRunning ? 'Running Tests...' : 'Test New User Registration'}
          </Button>
        </CardContent>
      </Card>

      {results ? (
        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.resultHeader}>
              <Text style={styles.cardTitle}>Test Results</Text>
              <TouchableOpacity onPress={clearResults}>
                <Text style={styles.clearButton}>Clear</Text>
              </TouchableOpacity>
            </View>
          </CardHeader>
          <CardContent>
            <ScrollView style={styles.resultsContainer}>
              <Text style={styles.results}>{results}</Text>
            </ScrollView>
          </CardContent>
        </Card>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          These tests use your real Supabase database
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  resultsContainer: {
    maxHeight: 300,
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
  },
  results: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#00ff00',
    lineHeight: 16,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  credBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  credText: {
    color: '#E5E7EB',
    fontSize: 14,
  },
})
