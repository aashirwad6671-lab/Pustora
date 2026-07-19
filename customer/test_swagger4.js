const fs = require('fs');
const json = JSON.parse(fs.readFileSync('swagger.json', 'utf8'));
const tables = Object.keys(json.definitions);
console.log('Available tables:', tables);
