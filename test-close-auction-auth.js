/**
 * Test Close Auction with Authentication
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🧪 Testing Close Auction with Authentication...');

const testCloseAuction = async () => {
  try {
    // First, let's sign in as a user who might own an auction
    console.log('\n🔐 Signing in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'handyman@example.com',
      password: 'password123'
    });

    if (authError) {
      console.log('⚠️  Could not sign in with handyman@example.com, trying customer account...');
      const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
        email: 'customer@example.com',
        password: 'password123'
      });
      
      if (authError2) {
        console.error('❌ Authentication failed:', authError2.message);
        return;
      }
      
      console.log('✅ Signed in as customer');
    } else {
      console.log('✅ Signed in as handyman');
    }

    // Get user ID
    const { data: { user } } = await supabase.auth.getUser();
    console.log(`👤 Current user ID: ${user.id}`);

    // Find an auction owned by this user
    console.log('\n🔍 Finding an auction owned by this user...');
    const { data: auction, error: fetchError } = await supabase
      .from('auctions')
      .select('id, status, title, handyman_id')
      .eq('handyman_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (fetchError) {
      console.log('⚠️  No auctions found for this user, trying to find any active auction...');
      const { data: anyAuction, error: anyFetchError } = await supabase
        .from('auctions')
        .select('id, status, title, handyman_id')
        .eq('status', 'active')
        .limit(1)
        .single();

      if (anyFetchError) {
        console.error('❌ Error fetching any active auction:', anyFetchError);
        return;
      }

      console.log(`✅ Found auction: ${anyAuction.title} (${anyAuction.id})`);
      console.log(`  Owner: ${anyAuction.handyman_id}`);
      console.log(`  Current user: ${user.id}`);
      
      if (anyAuction.handyman_id !== user.id) {
        console.log('⚠️  This auction is not owned by the current user. RLS will prevent update.');
        console.log('💡 To close this auction, you need to sign in as the auction owner.');
        return;
      }
      
      return;
    }

    if (!auction) {
      console.log('⚠️  No active auctions found for this user');
      return;
    }

    console.log(`✅ Found auction: ${auction.title} (${auction.id})`);

    // Try to close it
    console.log(`\n🔐 Closing auction ${auction.id}...`);
    const { data, error } = await supabase
      .from('auctions')
      .update({ status: 'ended' })
      .eq('id', auction.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error:', error);
      console.log('Code:', error.code);
      return;
    }

    if (!data) {
      console.log('⚠️  No data returned');
      return;
    }

    console.log(`✅ Success: ${data.title} now has status ${data.status}`);

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
};

testCloseAuction();