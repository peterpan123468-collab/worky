/**
 * Test Real User Login
 * Test with atemndobs@gmail.com / Atem1234
 */

require('dotenv').config();

const testRealLogin = async () => {
  console.log('🔐 Testing real user login...');
  console.log('📧 Email: atemndobs@gmail.com');
  console.log('🔑 Password: Atem1234');

  try {
    const authUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`;

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'atemndobs@gmail.com',
        password: 'Atem1234'
      })
    });

    console.log('📊 Response Status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful!');
      console.log('👤 User ID:', data.user?.id);
      console.log('📧 User Email:', data.user?.email);
      console.log('🎫 Access Token:', data.access_token ? 'Present' : 'Missing');
    } else {
      const error = await response.text();
      console.log('❌ Login failed:', error);

      // Check if user exists in database
      console.log('\n🔍 Checking if user exists in database...');
      const dbUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/users?email=eq.atemndobs@gmail.com&select=*`;

      const dbResponse = await fetch(dbUrl, {
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        }
      });

      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        console.log('📊 Database check:', dbData);

        if (dbData.length > 0) {
          console.log('✅ User exists in database');
          console.log('👤 User Type:', dbData[0].user_type || '❗ NOT SET');
        } else {
          console.log('❌ User not found in database');
        }
      }
    }

  } catch (error) {
    console.error('💥 Login test failed:', error.message);
  }
};

testRealLogin();