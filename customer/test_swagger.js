const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config({ path: '../admin/.env.local' });
async function test() {
  const res = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const json = await res.json();
  fs.writeFileSync('swagger.json', JSON.stringify(json, null, 2));
}
test();
