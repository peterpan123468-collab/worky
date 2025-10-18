import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { supabase } from '../lib/supabase'

export default function MobileTestScreen() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isTesting, setIsTesting] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const testSupabaseDirect = async () => {
    try {
      addResult('Testing direct Supabase connectivity...')
      
      // Test if we can reach the Supabase URL
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        addResult('❌ Supabase URL not found in environment variables')
        return
      }
      
      addResult(`Supabase URL: ${supabaseUrl}`)
      
      // Test basic HTTP connectivity (simplified test)
      addResult('Testing HTTP connectivity to Supabase...')
      
      // Just try to make a simple query
      addResult('Making test query to Supabase...')
      const { data, error } = await supabase
        .from('handyman_profiles')
        .select('id')
        .limit(1)
      
      if (error) {
        addResult(`❌ Query failed: ${error.message}`)
        if (error.details) {
          addResult(`Error details: ${error.details}`)
        }
        if (error.hint) {
          addResult(`Hint: ${error.hint}`)
        }
      } else {
        addResult(`✅ Query successful. Rows: ${data?.length || 0}`)
      }
      
    } catch (error: any) {
      addResult(`💥 Direct test failed: ${error.message}`)
      console.error('Direct test error:', error)
    }
  }

  const runAllTests = async () => {
    setIsTesting(true)
    setTestResults([])
    
    try {
      addResult(`🚀 Starting mobile tests on ${Platform.OS}...`)
      
      // Test Supabase connectivity
      await testSupabaseDirect()
      
      addResult('🎉 All tests completed!')
      
    } catch (error: any) {
      addResult(`💥 Tests failed: ${error.message}`)
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
        <Text style={styles.title}>Mobile Connection Test</Text>
        <Text style={styles.subtitle}>
          Diagnose mobile-specific connectivity issues
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={runAllTests}
            disabled={isTesting}
            style={[styles.button, isTesting && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {isTesting ? 'Testing...' : 'Run Mobile Tests'}
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
          <Text style={styles.resultsEmpty}>No tests run yet. Press "Run Mobile Tests" to start.</Text>
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
    minWidth: 120,
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
    marginBottom: 20,
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