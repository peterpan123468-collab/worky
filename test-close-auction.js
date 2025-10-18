/**
 * Test Close Auction - Directly test the close auction functionality
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
    // First, get an active auction to test with
    console.log('\n🔍 Finding an active auction to test with...');
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
      console.log('⚠️  No active auctions found to test with');
      return;
    }

    console.log(`✅ Found active auction: ${auction.title} (${auction.id})`);

    // Now try to close it directly
    console.log(`\n🔐 Attempting to close auction ${auction.id}...`);
    const { data: updatedAuction, error: closeError } = await supabase
      .from('auctions')
      .update({ status: 'ended' })
      .eq('id', auction.id)
      .eq('status', 'active') // Defensive check
      .select()
      .single();

    if (closeError) {
      console.error('❌ Error closing auction:', closeError);
      console.log('Error code:', closeError.code);
      console.log('Error message:', closeError.message);
      return;
    }

    if (!updatedAuction) {
      console.log('⚠️  No data returned when closing auction');
      return;
    }

    console.log(`✅ Successfully closed auction: ${updatedAuction.title} (${updatedAuction.id})`);
    console.log(`New status: ${updatedAuction.status}`);

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
};

testCloseAuction();