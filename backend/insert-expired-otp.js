const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, 'data/hire_me_for.db'));

// Create an OTP that expired 2 hours ago
const expiredDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
const phoneNumber = '0839876543';
const code = '999888';

db.prepare(`
  INSERT INTO otp_codes (phone_number, code, purpose, expires_at, used)
  VALUES (?, ?, 'registration', ?, 0)
`).run(phoneNumber, code, expiredDate);

console.log('Inserted expired OTP:');
console.log('  Phone:', phoneNumber);
console.log('  Code:', code);
console.log('  Expired at:', expiredDate);
