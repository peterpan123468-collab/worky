const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkHandymen() {
  try {
    console.log('🔍 Checking for handymen in database...\n');

    // Check total user count by type
    const { data: userStats, error: statsError } = await supabase
      .from('users')
      .select('user_type')
      .then(result => {
        if (result.error) return result;
        
        const stats = result.data.reduce((acc, user) => {
          acc[user.user_type] = (acc[user.user_type] || 0) + 1;
          return acc;
        }, {});
        
        return { data: stats, error: null };
      });

    if (statsError) {
      console.error('❌ Error getting user stats:', statsError.message);
      return;
    }

    console.log('📊 User Statistics:');
    console.log(`   Handymen: ${userStats.handyman || 0}`);
    console.log(`   Customers: ${userStats.customer || 0}`);
    console.log(`   Total: ${(userStats.handyman || 0) + (userStats.customer || 0)}\n`);

    // Get detailed handyman info
    const { data: handymen, error: handymenError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        user_type,
        created_at,
        handyman_profiles (
          business_name,
          hourly_rate,
          location,
          skills,
          description
        )
      `)
      .eq('user_type', 'handyman')
      .order('created_at', { ascending: false });

    if (handymenError) {
      console.error('❌ Error getting handymen:', handymenError.message);
      return;
    }

    if (!handymen || handymen.length === 0) {
      console.log('🚫 No handymen found in database');
      console.log('\n💡 To add test handymen, you can:');
      console.log('   1. Register through your app as a handyman');
      console.log('   2. Run the seed script (if you have one)');
      console.log('   3. Manually insert test data via Supabase dashboard');
      return;
    }

    console.log(`✅ Found ${handymen.length} handymen:\n`);

    handymen.forEach((handyman, index) => {
      console.log(`${index + 1}. ${handyman.email}`);
      console.log(`   ID: ${handyman.id}`);
      console.log(`   Created: ${new Date(handyman.created_at).toLocaleDateString()}`);
      
      if (handyman.handyman_profiles && handyman.handyman_profiles.length > 0) {
        const profile = handyman.handyman_profiles[0];
        console.log(`   Business: ${profile.business_name || 'Not set'}`);
        console.log(`   Rate: CHF ${profile.hourly_rate || 'Not set'}/hour`);
        console.log(`   Location: ${profile.location || 'Not set'}`);
        console.log(`   Skills: ${profile.skills?.join(', ') || 'None listed'}`);
      } else {
        console.log(`   ⚠️  No handyman profile found (incomplete registration)`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('\n💡 Make sure you have:');
    console.log('   1. Created a .env file with your Supabase credentials');
    console.log('   2. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }
}

// Run the check
checkHandymen();
