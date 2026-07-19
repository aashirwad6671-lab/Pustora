const fetch = require('node-fetch');
require('dotenv').config({ path: '../admin/.env.local' });
async function test() {
  const res = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.SUPABASE_SERVICE_ROLE_KEY);
  const json = await res.json();
  console.log('Available tables:', Object.keys(json.definitions));
}
test();
