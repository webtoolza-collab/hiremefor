const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, 'data/hire_me_for.db'));
console.log('OTP Codes (all):');
console.log(JSON.stringify(db.prepare("SELECT * FROM otp_codes ORDER BY created_at DESC LIMIT 5").all(), null, 2));
