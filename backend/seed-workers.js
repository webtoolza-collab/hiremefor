const path = require('path');
const bcrypt = require('bcrypt');
const db = require('better-sqlite3')(path.join(__dirname, 'data/hire_me_for.db'));

async function seedWorkers() {
  // Get areas and skills
  const areas = db.prepare('SELECT id FROM areas').all();
  const skills = db.prepare('SELECT id FROM skills').all();

  if (areas.length === 0 || skills.length === 0) {
    console.log('Please ensure areas and skills exist in the database first');
    return;
  }

  const genders = ['male', 'female'];
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth',
    'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
    'Chris', 'Lisa', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
    'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'];
  const surnames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

  const pinHash = await bcrypt.hash('1234', 10);

  // Start transaction
  const insertWorker = db.prepare(`
    INSERT INTO workers (phone_number, pin_hash, first_name, surname, age, gender, area_id, bio, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const insertSkill = db.prepare(`
    INSERT INTO worker_skills (worker_id, skill_id, years_experience)
    VALUES (?, ?, ?)
  `);

  console.log('Creating 100 workers...');

  const transaction = db.transaction(() => {
    for (let i = 2; i <= 101; i++) {
      const phoneNumber = `08${String(i).padStart(8, '0')}`;
      const firstName = firstNames[i % firstNames.length];
      const surname = surnames[i % surnames.length];
      const age = 18 + (i % 50);
      const gender = genders[i % 2];
      const areaId = areas[i % areas.length].id;
      const bio = `Experienced worker with ${(i % 10) + 1} years in the industry. Ready to help!`;

      try {
        const result = insertWorker.run(phoneNumber, pinHash, firstName, surname, age, gender, areaId, bio);
        const workerId = result.lastInsertRowid;

        // Add 1-3 random skills
        const numSkills = 1 + (i % 3);
        const usedSkills = new Set();
        for (let j = 0; j < numSkills && j < skills.length; j++) {
          const skillId = skills[(i + j) % skills.length].id;
          if (!usedSkills.has(skillId)) {
            usedSkills.add(skillId);
            insertSkill.run(workerId, skillId, 1 + (i % 10));
          }
        }

        if (i % 20 === 0) {
          console.log(`Created ${i - 1} workers...`);
        }
      } catch (err) {
        console.log(`Skipping worker ${i}: ${err.message}`);
      }
    }
  });

  transaction();

  const count = db.prepare('SELECT COUNT(*) as count FROM workers').get();
  console.log(`Done! Total workers in database: ${count.count}`);
}

seedWorkers().catch(console.error);
