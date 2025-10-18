/**
 * Debug Auctions - Check current auction states in the database
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔍 Debugging Auctions...');

const debugAuctions = async () => {
  try {
    // Get all auctions with their statuses
    console.log('\n📋 Fetching all auctions...');
    const { data: auctions, error } = await supabase
      .from('auctions')
      .select('id, status, title, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching auctions:', error);
      return;
    }

    console.log(`✅ Found ${auctions.length} auctions:`);
    auctions.forEach(auction => {
      console.log(`  - ${auction.id}: ${auction.title} (${auction.status})`);
    });

    // Check for invalid statuses
    console.log('\n🔍 Checking for invalid statuses...');
    const { data: invalidAuctions, error: invalidError } = await supabase
      .from('auctions')
      .select('id, status, title')
      .not('status', 'in', '("active","ended","cancelled")');

    if (invalidError) {
      console.error('❌ Error checking invalid statuses:', invalidError);
      return;
    }

    if (invalidAuctions.length > 0) {
      console.log(`⚠️  Found ${invalidAuctions.length} auctions with invalid statuses:`);
      invalidAuctions.forEach(auction => {
        console.log(`  - ${auction.id}: ${auction.title} (${auction.status})`);
      });
    } else {
      console.log('✅ No auctions with invalid statuses found.');
    }

    // Check constraint definition
    console.log('\n🔧 Checking auction status constraint...');
    const { data: constraints, error: constraintError } = await supabase
      .rpc('execute_sql', {
        sql: `
          SELECT conname AS constraint_name, pg_get_constraintdef(c.oid) AS constraint_definition
          FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
          JOIN pg_namespace n ON t.relnamespace = n.oid
          WHERE t.relname = 'auctions' AND n.nspname = 'public' AND conname LIKE '%status%'
        `
      });

    if (constraintError) {
      console.log('ℹ️  Could not check constraint (might not have permission):', constraintError.message);
    } else {
      console.log('ℹ️  Auction status constraint:', constraints);
    }

  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
};

debugAuctions();