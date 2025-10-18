/**
 * Authentication Debug Test
 * Run this to verify authentication flow
 */

// Use CommonJS require for Node.js compatibility
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Authentication Debug Test');
console.log('==========================');

async function runAuthDebug() {
  try {
    console.log('1️⃣ Checking environment variables...');
    if (!supabaseUrl) {
      console.log('❌ Supabase URL is missing');
      return;
    }
    if (!supabaseAnonKey) {
      console.log('❌ Supabase Anon Key is missing');
      return;
    }
    console.log('✅ Environment variables present');
    
    console.log('\n2️⃣ Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client created successfully');
    
    console.log('\n3️⃣ Testing auth session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    } else {
      console.log('✅ Session check completed');
      console.log('   Session present:', !!session);
    }
    
    console.log('\n4️⃣ Testing auth user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log('❌ User error:', userError.message);
    } else {
      console.log('✅ User check completed');
      console.log('   User present:', !!user);
      if (user) {
        console.log('   User ID:', user.id);
      }
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
runAuthDebug();