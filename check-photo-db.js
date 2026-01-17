const db = require('./backend/src/db/connection');

async function check() {
  const [rows] = await db.query('SELECT id, first_name, profile_photo_url FROM workers WHERE id = 1');
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

check();
