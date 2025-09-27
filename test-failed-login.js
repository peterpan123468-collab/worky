/**
 * Test Failed Authentication
 * Test with wrong credentials to verify authentication properly fails
 */

require('dotenv').config();

const testFailedLogin = async () => {
  console.log('🔐 Testing failed login with wrong credentials...');
  console.log('📧 Email: atemndobs@gmail.com');
  console.log('🔑 Password: WrongPassword123');

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
        password: 'WrongPassword123'
      })
    });

    console.log('📊 Response Status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('❌ ERROR: Login should have failed but succeeded!');
      console.log('👤 User ID:', data.user?.id);
    } else {
      const error = await response.text();
      console.log('✅ EXPECTED: Login failed correctly');
      console.log('💥 Error:', error);

      // Test with completely wrong email too
      console.log('\n🔐 Testing with wrong email...');
      const wrongEmailResponse = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'AnyPassword'
        })
      });

      console.log('📊 Wrong Email Response Status:', wrongEmailResponse.status);
      if (wrongEmailResponse.ok) {
        console.log('❌ ERROR: Login with wrong email should have failed!');
      } else {
        const wrongEmailError = await wrongEmailResponse.text();
        console.log('✅ EXPECTED: Wrong email login failed correctly');
        console.log('💥 Error:', wrongEmailError);
      }
    }

  } catch (error) {
    console.error('💥 Test failed with exception:', error.message);
  }
};

testFailedLogin();