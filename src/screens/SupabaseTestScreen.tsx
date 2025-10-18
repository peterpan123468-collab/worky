import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function SupabaseTestScreen() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const { user } = useAuth()

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, message])
  }

  const runTests = async () => {
    setIsTesting(true)
    setTestResults([])
    
    try {
      addResult('🚀 Starting Supabase tests...')
      
      // Test 1: Check if supabase client exists
      addResult('1️⃣ Testing Supabase client...')
      if (!supabase) {
        addResult('❌ Supabase client is undefined')
        return
      }
      addResult('✅ Supabase client exists')
      
      // Test 2: Check environment variables
      addResult('2️⃣ Checking environment variables...')
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL
      const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      addResult(`📡 URL: ${url ? 'Present' : 'Missing'}`)
      addResult(`🔑 Key: ${key ? 'Present' : 'Missing'}`)
      
      // Test 3: Test basic query
      addResult('3️⃣ Testing basic database query...')
      try {
        const { data, error } = await supabase
          .from('handyman_profiles')
          .select('id')
          .limit(1)
        
        if (error) {
          addResult(`❌ Query failed: ${error.message}`)
          addResult(`Error details: ${JSON.stringify(error, null, 2)}`)
        } else {
          addResult(`✅ Query successful. Rows returned: ${data?.length || 0}`)
        }
      } catch (error: any) {
        addResult(`💥 Query error: ${error.message || error}`)
      }
      
      // Test 4: Test auth session
      addResult('4️⃣ Testing auth session...')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        addResult(`🔐 Session: ${session ? 'Active' : 'None'}`)
      } catch (error: any) {
        addResult(`💥 Session error: ${error.message || error}`)
      }
      
      // Test 5: Test user info
      addResult('5️⃣ Testing user info...')
      if (user) {
        addResult(`👤 User: ${user.email} (${user.user_type})`)
      } else {
        addResult('👤 No user logged in')
      }
      
      addResult('🎉 All tests completed!')
      
    } catch (error: any) {
      addResult(`💥 Test failed: ${error.message || error}`)
      console.error('Test error:', error)
    } finally {
      setIsTesting(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Supabase Connection Test</Text>
        <Text style={styles.subtitle}>
          Run these tests to diagnose Supabase connection issues
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={runTests}
            disabled={isTesting}
            style={[styles.button, isTesting && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {isTesting ? 'Testing...' : 'Run Tests'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={clearResults}
            style={[styles.button, styles.buttonSecondary]}
          >
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        {testResults.length === 0 ? (
          <Text style={styles.resultsEmpty}>No tests run yet. Press "Run Tests" to start.</Text>
        ) : (
          testResults.map((result, index) => (
            <Text key={index} style={styles.resultsText}>
              {result}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonSecondary: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  resultsEmpty: {
    color: '#999',
    fontStyle: 'italic',
  },
  resultsText: {
    marginBottom: 4,
    fontFamily: 'monospace',
    fontSize: 12,
  },
})