/**
 * Quick Supabase Connection Test
 * Run this to verify real database connectivity
 */

require('dotenv').config();

console.log('🧪 Testing Supabase Connection...');
console.log('📡 URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('🔑 Anon Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');

const testConnection = async () => {
  try {
    // Simple fetch test to Supabase REST API
    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/users?select=count&limit=1`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.text();
      console.log('✅ Supabase connection successful!');
      console.log('📄 Response:', data);

      // Test login endpoint
      console.log('\n🔐 Testing auth endpoint...');
      const authUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`;
      const authResponse = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      });

      console.log('🔐 Auth Response Status:', authResponse.status);
      const authData = await authResponse.text();
      console.log('🔐 Auth Response:', authData);

    } else {
      console.log('❌ Supabase connection failed');
      const error = await response.text();
      console.log('💥 Error:', error);
    }

  } catch (error) {
    console.error('💥 Connection test failed:', error.message);
  }
};

testConnection();