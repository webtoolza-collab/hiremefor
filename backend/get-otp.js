const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/hire_me_for.db');
const db = new Database(dbPath);

const phone = process.argv[2] || '0831112222';
const otp = db.prepare("SELECT code FROM otp_codes WHERE phone_number=? AND used=0 ORDER BY created_at DESC LIMIT 1").get(phone);

if (otp) {
  console.log('OTP:', otp.code);
} else {
  console.log('No OTP found for', phone);
}

db.close();
