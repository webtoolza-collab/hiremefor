require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const DB_NAME = process.env.DB_NAME || 'hire_me_for';

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME
  });

  console.log('Seeding database...');

  // Seed areas
  console.log('  - Seeding areas...');
  await connection.query(`
    INSERT IGNORE INTO areas (name, province) VALUES
    ('Johannesburg1', 'Gauteng'),
    ('Johannesburg2', 'Gauteng')
  `);

  // Seed skills
  console.log('  - Seeding skills...');
  await connection.query(`
    INSERT IGNORE INTO skills (name) VALUES
    ('Plumber'),
    ('Taxi Driver')
  `);

  // Seed admin user
  console.log('  - Seeding admin user...');
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await connection.query(`
    INSERT INTO main_admin (username, password_hash)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)
  `, [adminUsername, passwordHash]);

  await connection.end();
  console.log('\nSeeding completed successfully!');
  console.log(`Admin credentials: ${adminUsername} / ${adminPassword}`);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
