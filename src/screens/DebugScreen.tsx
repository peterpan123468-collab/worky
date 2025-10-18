import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { supabase } from '../lib/supabase'
import { authService } from '../services/auth.service'

export default function DebugScreen() {
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [isTesting, setIsTesting] = useState(false)

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const runDebugTests = async () => {
    setIsTesting(true)
    setDebugInfo([])
    
    try {
      addDebugInfo('Starting debug tests...')
      
      // Test 1: Check Supabase client
      addDebugInfo('Test 1: Checking Supabase client...')
      if (!supabase) {
        addDebugInfo('❌ Supabase client is undefined')
        return
      }
      addDebugInfo('✅ Supabase client exists')
      
      // Test 2: Check auth session
      addDebugInfo('Test 2: Checking auth session...')
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          addDebugInfo(`❌ Session error: ${sessionError.message}`)
        } else {
          addDebugInfo(`✅ Session check completed. Session: ${session ? 'Present' : 'None'}`)
        }
      } catch (error: any) {
        addDebugInfo(`❌ Session check failed: ${error.message || error}`)
      }
      
      // Test 3: Check auth user
      addDebugInfo('Test 3: Checking auth user...')
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) {
          addDebugInfo(`❌ User error: ${userError.message}`)
        } else {
          addDebugInfo(`✅ User check completed. User: ${user ? user.id : 'None'}`)
        }
      } catch (error: any) {
        addDebugInfo(`❌ User check failed: ${error.message || error}`)
      }
      
      // Test 4: Test authService.getCurrentUser()
      addDebugInfo('Test 4: Testing authService.getCurrentUser()...')
      try {
        const currentUser = await authService.getCurrentUser()
        addDebugInfo(`✅ getCurrentUser completed. Result: ${currentUser ? currentUser.id : 'None'}`)
      } catch (error: any) {
        addDebugInfo(`❌ getCurrentUser failed: ${error.message || error}`)
      }
      
      addDebugInfo('All tests completed!')
      
    } catch (error: any) {
      addDebugInfo(`💥 Test failed with error: ${error.message || error}`)
    } finally {
      setIsTesting(false)
    }
  }

  const clearDebugInfo = () => {
    setDebugInfo([])
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Supabase Connection</Text>
        <Text style={styles.subtitle}>
          Run these tests to diagnose mobile connection issues
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={runDebugTests}
            disabled={isTesting}
            style={[styles.button, isTesting && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {isTesting ? 'Testing...' : 'Run Debug Tests'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={clearDebugInfo}
            style={[styles.button, styles.buttonSecondary]}
          >
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Output:</Text>
        {debugInfo.length === 0 ? (
          <Text style={styles.debugEmpty}>No tests run yet. Press "Run Debug Tests" to start.</Text>
        ) : (
          debugInfo.map((info, index) => (
            <Text key={index} style={styles.debugText}>
              {info}
            </Text>
          ))
        )}
      </View>
      
      {isTesting && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#171717" />
          <Text style={styles.loadingText}>Running tests...</Text>
        </View>
      )}
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
  debugContainer: {
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
  debugTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  debugEmpty: {
    color: '#999',
    fontStyle: 'italic',
  },
  debugText: {
    marginBottom: 4,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
})