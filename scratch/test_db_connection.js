const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eusxrnwhjyebnuomazpr.supabase.co';
const supabaseKey = 'sb_publishable_-jHsPRaPPUi_apMqHu7Jjg_impQM9eE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Initiating diagnostics to Supabase endpoint...');
  try {
    // Queries the profiles schema to test RLS and public read triggers
    const { data, error, status } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Connection diagnostic failed!');
      console.error(`Error code: ${error.code}`);
      console.error(`Error message: ${error.message}`);
      console.error(`HTTP Status: ${status}`);
      process.exit(1);
    }

    console.log('✅ Connection diagnostic succeeded!');
    console.log(`Endpoint is online and responding. Schema query returned status code: ${status}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Network connection failed completely!');
    console.error(err.message);
    process.exit(1);
  }
}

testConnection();
