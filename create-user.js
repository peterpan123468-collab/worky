/**
 * Create Real User Account
 * Creates atemndobs@gmail.com with Atem1234 password
 */

require('dotenv').config();

const createUser = async () => {
  console.log('👤 Creating user account...');
  console.log('📧 Email: atemndobs@gmail.com');
  console.log('🔑 Password: Atem1234');
  console.log('👔 Type: Customer (for testing)');

  try {
    // Step 1: Create auth user
    const signupUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/signup`;

    const signupResponse = await fetch(signupUrl, {
      method: 'POST',
      headers: {
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'atemndobs@gmail.com',
        password: 'Atem1234',
        data: {
          user_type: 'customer'
        }
      })
    });

    console.log('📊 Signup Response Status:', signupResponse.status);

    if (signupResponse.ok) {
      const signupData = await signupResponse.json();
      console.log('✅ Auth user created!');
      console.log('👤 User ID:', signupData.user?.id);
      console.log('📧 Email:', signupData.user?.email);
      console.log('✉️  Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No');

      // Step 2: Create database user record
      const userId = signupData.user?.id;
      if (userId) {
        console.log('\n📝 Creating database user record...');

        const dbUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/users`;

        const dbResponse = await fetch(dbUrl, {
          method: 'POST',
          headers: {
            'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            id: userId,
            email: 'atemndobs@gmail.com',
            user_type: 'customer'
          })
        });

        console.log('📊 Database Response Status:', dbResponse.status);

        if (dbResponse.ok) {
          const dbData = await dbResponse.json();
          console.log('✅ Database user created!');
          console.log('📊 Database Record:', dbData);
        } else {
          const dbError = await dbResponse.text();
          console.log('❌ Database creation failed:', dbError);
        }
      }

      console.log('\n🎉 User account creation complete!');
      console.log('📱 You can now test login in the app');

    } else {
      const error = await signupResponse.text();
      console.log('❌ Signup failed:', error);
    }

  } catch (error) {
    console.error('💥 User creation failed:', error.message);
  }
};

createUser();