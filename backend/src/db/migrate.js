require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'hire_me_for';

async function migrate() {
  // Connect without database first to create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  console.log('Creating database if not exists...');
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await connection.query(`USE \`${DB_NAME}\``);

  console.log('Creating tables...');

  // Areas table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS areas (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(200) NOT NULL,
      province VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  - areas table created');

  // Skills table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS skills (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(200) UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  - skills table created');

  // Workers table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS workers (
      id INT PRIMARY KEY AUTO_INCREMENT,
      phone_number VARCHAR(10) UNIQUE NOT NULL,
      pin_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      surname VARCHAR(100) NOT NULL,
      age INT NOT NULL,
      gender ENUM('male', 'female') NOT NULL,
      area_id INT NOT NULL,
      bio TEXT,
      email VARCHAR(255),
      profile_photo_url VARCHAR(500),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (area_id) REFERENCES areas(id)
    )
  `);
  console.log('  - workers table created');

  // Worker skills table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS worker_skills (
      id INT PRIMARY KEY AUTO_INCREMENT,
      worker_id INT NOT NULL,
      skill_id INT NOT NULL,
      years_experience INT DEFAULT 0,
      UNIQUE KEY unique_worker_skill (worker_id, skill_id),
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id)
    )
  `);
  console.log('  - worker_skills table created');

  // Ratings table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      worker_id INT NOT NULL,
      stars INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
      comment TEXT,
      status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
    )
  `);
  console.log('  - ratings table created');

  // OTP codes table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id INT PRIMARY KEY AUTO_INCREMENT,
      phone_number VARCHAR(10) NOT NULL,
      code VARCHAR(6) NOT NULL,
      purpose ENUM('registration', 'pin_reset') NOT NULL,
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  - otp_codes table created');

  // Main admin table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS main_admin (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('  - main_admin table created');

  // Worker sessions table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS worker_sessions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      worker_id INT NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
    )
  `);
  console.log('  - worker_sessions table created');

  // Admin sessions table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      admin_id INT NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES main_admin(id) ON DELETE CASCADE
    )
  `);
  console.log('  - admin_sessions table created');

  await connection.end();
  console.log('\nMigration completed successfully!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
