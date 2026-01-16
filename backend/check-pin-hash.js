const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/hire_me_for.db');
const db = new Database(dbPath);

// Get John TestWorker's pin_hash (PIN is 4321)
const worker = db.prepare("SELECT id, phone_number, first_name, pin_hash FROM workers WHERE phone_number = ?").get('0821234567');

if (worker) {
  console.log('Worker:', worker.first_name);
  console.log('Phone:', worker.phone_number);
  console.log('PIN Hash:', worker.pin_hash);
  console.log('');
  console.log('Is hashed (not plain):', worker.pin_hash !== '4321');
  console.log('Is bcrypt format ($2...):', worker.pin_hash.startsWith('$2'));
  console.log('Hash length:', worker.pin_hash.length);
} else {
  console.log('Worker not found');
}

db.close();
