const fs = require('fs');
const json = JSON.parse(fs.readFileSync('swagger.json', 'utf8'));
const ordersDef = Object.entries(json.definitions).find(([k, v]) => k.toLowerCase() === 'orders');
if (ordersDef) {
  console.log('Orders columns:', Object.keys(ordersDef[1].properties));
} else {
  console.log('No orders table found in definitions. Available tables:', Object.keys(json.definitions));
}
