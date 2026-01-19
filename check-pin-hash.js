const db = require('./backend/node_modules/better-sqlite3')('backend/data/hire_me_for.db');
const row = db.prepare('SELECT phone_number, pin_hash FROM workers WHERE phone_number = ?').get('0821234567');
console.log('Phone:', row.phone_number);
console.log('PIN Hash:', row.pin_hash);
console.log('Is bcrypt hash (starts with $2):', row.pin_hash.startsWith('$2'));
console.log('Hash length:', row.pin_hash.length);
