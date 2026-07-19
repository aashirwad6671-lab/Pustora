const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config({ path: '../admin/.env.local' });
async function test() {
  const res = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.SUPABASE_SERVICE_ROLE_KEY);
  const json = await res.json();
  const ordersDef = Object.entries(json.definitions).find(([k, v]) => k.toLowerCase() === 'orders');
  if (ordersDef) {
    console.log('Orders columns:', Object.keys(ordersDef[1].properties));
  } else {
    console.log('No orders table found in definitions. Available tables:', Object.keys(json.definitions));
  }
}
test();
