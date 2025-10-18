/**
 * Simple Test Close Auction
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🧪 Testing Close Auction...');

const testCloseAuction = async () => {
  try {
    // Get an active auction
    console.log('\n🔍 Finding an active auction...');
    const { data: auction, error: fetchError } = await supabase
      .from('auctions')
      .select('id, status, title')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching active auction:', fetchError);
      return;
    }

    if (!auction) {
      console.log('⚠️  No active auctions found');
      return;
    }

    console.log(`✅ Found: ${auction.title} (${auction.id}) - Status: ${auction.status}`);

    // Try to close it with only ID condition
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