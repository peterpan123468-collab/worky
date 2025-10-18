/**
 * Supabase Debug Test
 * Run this to verify Supabase connection in Node.js environment
 */

// Use CommonJS require for Node.js compatibility
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Supabase Debug Test');
console.log('=====================');

const runSupabaseDebugTest = async () => {
  try {
    console.log('1️⃣ Checking environment variables...');
    if (!supabaseUrl) {
      console.log('❌ Supabase URL is missing');
      return false;
    }
    if (!supabaseAnonKey) {
      console.log('❌ Supabase Anon Key is missing');
      return false;
    }
    console.log('✅ Environment variables present');
    console.log('📡 URL:', supabaseUrl.substring(0, 30) + '...');
    
    console.log('\n2️⃣ Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client created successfully');
    
    console.log('\n3️⃣ Testing basic query...');
    const { data, error } = await supabase
      .from('handyman_profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Query failed:', error.message);
      console.log('Error details:', error);
      return false;
    }
    
    console.log('✅ Query successful');
    console.log('Response data:', data);
    
    console.log('\n4️⃣ Testing auth session...');
    // Note: getSession() might not work in Node.js environment without proper auth setup
    console.log('ℹ️  Auth session test skipped in Node.js environment');
    
    console.log('\n🎉 All tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    return false;
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  runSupabaseDebugTest().then((result) => {
    console.log('\nTest result:', result ? 'PASSED' : 'FAILED');
    process.exit(result ? 0 : 1);
  });
}

// Export for use in other modules
module.exports = { runSupabaseDebugTest };