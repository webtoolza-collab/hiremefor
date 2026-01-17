const db = require('./backend/src/db/connection');

async function check() {
  const [rows] = await db.query(`
    SELECT ws.*, s.name as skill_name
    FROM worker_skills ws
    JOIN skills s ON ws.skill_id = s.id
    WHERE ws.worker_id = 1
  `);
  console.log('Worker 1 Skills:');
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

check();
