/**
 * Authentication Debug Test
 * Run this to verify authentication flow
 */

import { authService } from '../services/auth.service'
import { supabase } from '../lib/supabase'

async function runAuthDebug() {
  console.log('🧪 Authentication Debug Test')
  console.log('==========================')
  
  try {
    console.log('1️⃣ Testing Supabase client...')
    if (!supabase) {
      console.log('❌ Supabase client is undefined')
      return
    }
    console.log('✅ Supabase client exists')
    
    console.log('\n2️⃣ Testing auth session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message)
    } else {
      console.log('✅ Session check completed')
      console.log('   Session present:', !!session)
    }
    
    console.log('\n3️⃣ Testing auth user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.log('❌ User error:', userError.message)
    } else {
      console.log('✅ User check completed')
      console.log('   User present:', !!user)
      if (user) {
        console.log('   User ID:', user.id)
      }
    }
    
    console.log('\n4️⃣ Testing getCurrentUser...')
    const currentUser = await authService.getCurrentUser()
    console.log('✅ getCurrentUser completed')
    console.log('   Current user:', currentUser)
    
    console.log('\n🎉 All tests completed!')
    
  } catch (error) {
    console.error('💥 Test failed with error:', error)
  }
}

// Run the test
runAuthDebug()