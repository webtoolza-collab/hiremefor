const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, 'data/hire_me_for.db'));

// Create an expired OTP
const expiredDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
const phoneNumber = '0841111111';
const code = '123456';

// First delete any existing OTPs for this phone
db.prepare('DELETE FROM otp_codes WHERE phone_number = ?').run(phoneNumber);

db.prepare(`
  INSERT INTO otp_codes (phone_number, code, purpose, expires_at, used)
  VALUES (?, ?, 'registration', ?, 0)
`).run(phoneNumber, code, expiredDate);

console.log('Inserted expired OTP:');
console.log('  Phone:', phoneNumber);
console.log('  Code:', code);
console.log('  Expired at:', expiredDate);
