const path = require('path');
const db = require('better-sqlite3')(path.join(__dirname, 'data/hire_me_for.db'));

// Check admin table
const admins = db.prepare('SELECT * FROM main_admin').all();

console.log('Admin accounts:');
admins.forEach(admin => {
  const isBcrypt = admin.password_hash.startsWith('$2');
  const isNotPlainText = admin.password_hash.length > 20;
  console.log(`  Username: ${admin.username}`);
  console.log(`  Password Hash: ${admin.password_hash.substring(0, 30)}...`);
  console.log(`  Hash Length: ${admin.password_hash.length}`);
  console.log(`  Is Bcrypt Format: ${isBcrypt}`);
  console.log(`  Is Hashed (not plain text): ${isNotPlainText}`);
});
