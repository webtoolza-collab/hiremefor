const Database = require('./backend/node_modules/better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'backend', 'data', 'hire_me_for.db');
const db = new Database(dbPath);

// List all tables first
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

const phone = process.argv[2] || '0891234567';
try {
  const row = db.prepare('SELECT code FROM otp_codes WHERE phone_number = ? ORDER BY created_at DESC LIMIT 1').get(phone);
  console.log('OTP:', row ? row.code : 'No OTP found');
} catch (e) {
  console.log('Error:', e.message);
}
db.close();
