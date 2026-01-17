const db = require('./backend/node_modules/better-sqlite3')('./backend/data/hire_me_for.db');
const row = db.prepare('SELECT * FROM otp_codes WHERE phone_number = ? ORDER BY created_at DESC LIMIT 1').get('0899998888');
console.log(JSON.stringify(row, null, 2));
