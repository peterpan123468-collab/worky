/**
 * Test Handyman Signup Flow
 * Creates a new handyman account with business profile
 */

require('dotenv').config();

const testHandymanSignup = async () => {
  const testEmail = `handyman-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123';

  console.log('🔧 Testing handyman signup flow...');
  console.log('📧 Email:', testEmail);
  console.log('🔑 Password:', testPassword);
  console.log('👔 Type: Handyman');

  try {
    // Step 1: Create auth user
    const signupUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/signup`;

    console.log('\n📝 Step 1: Creating auth user...');
    const signupResponse = await fetch(signupUrl, {
      method: 'POST',
      headers: {
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        data: {
          user_type: 'handyman'
        }
      })
    });

    console.log('📊 Signup Response Status:', signupResponse.status);

    if (signupResponse.ok) {
      const signupData = await signupResponse.json();
      console.log('✅ Auth user created!');
      console.log('👤 User ID:', signupData.user?.id);
      console.log('📧 Email:', signupData.user?.email);

      const userId = signupData.user?.id;
      if (userId) {
        // Step 2: Create database user record
        console.log('\n📝 Step 2: Creating database user record...');
        const userDbUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/users`;

        const userDbResponse = await fetch(userDbUrl, {
          method: 'POST',
          headers: {
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            id: userId,
            email: testEmail,
            user_type: 'handyman'
          })
        });

        console.log('📊 User DB Response Status:', userDbResponse.status);

        if (userDbResponse.ok) {
          const userDbData = await userDbResponse.json();
          console.log('✅ Database user created!');

          // Step 3: Create handyman profile
          console.log('\n🔧 Step 3: Creating handyman profile...');
          const profileUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/handyman_profiles`;

          const profileResponse = await fetch(profileUrl, {
            method: 'POST',
            headers: {
              'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              user_id: userId,
              business_name: 'Test Handyman Business',
              hourly_rate: 75,
              region: 'Zurich',
              skills: ['plumbing', 'electrical', 'carpentry'],
              phone: '+41 44 123 45 67',
              description: 'Professional handyman services in Zurich area'
            })
          });

          console.log('📊 Profile Response Status:', profileResponse.status);

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('✅ Handyman profile created!');
            console.log('🔧 Business Name:', profileData[0]?.business_name);
            console.log('💰 Hourly Rate:', profileData[0]?.hourly_rate, 'CHF');
            console.log('📍 Region:', profileData[0]?.region);
            console.log('🛠️  Skills:', profileData[0]?.skills);

            console.log('\n🎉 Handyman signup flow complete!');
            console.log('📱 User can now login with:', testEmail);

            // Test login with new handyman account
            console.log('\n🔐 Testing login with new handyman account...');
            const authUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`;

            const loginResponse = await fetch(authUrl, {
              method: 'POST',
              headers: {
                'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email: testEmail,
                password: testPassword
              })
            });

            if (loginResponse.ok) {
              console.log('✅ Login test successful!');
            } else {
              console.log('❌ Login test failed');
            }

          } else {
            const profileError = await profileResponse.text();
            console.log('❌ Profile creation failed:', profileError);
          }
        } else {
          const userDbError = await userDbResponse.text();
          console.log('❌ Database user creation failed:', userDbError);
        }
      }
    } else {
      const error = await signupResponse.text();
      console.log('❌ Signup failed:', error);
    }

  } catch (error) {
    console.error('💥 Handyman signup test failed:', error.message);
  }
};

testHandymanSignup();