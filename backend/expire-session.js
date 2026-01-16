const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data/hire_me_for.db');
const db = new Database(dbPath);

const token = process.argv[2];
if (!token) {
  console.log('Usage: node expire-session.js <token>');
  process.exit(1);
}

// Set session expiry to past (1 hour ago)
const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
const result = db.prepare("UPDATE worker_sessions SET expires_at = ? WHERE token = ?").run(pastDate, token);

if (result.changes > 0) {
  console.log('Session expired successfully');
} else {
  console.log('Session not found');
}

db.close();
