const Database = require('better-sqlite3');
const path = require('path');

// Create/open SQLite database
const dbPath = path.join(__dirname, '../../data/hire_me_for.db');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('Database connected successfully (SQLite)');

// Create a MySQL-like promise interface wrapper
const pool = {
  async query(sql, params = []) {
    try {
      // Convert MySQL placeholders (?) to SQLite format
      // Handle LIMIT ?, ? syntax
      let processedSql = sql;

      // Check if it's a SELECT/read query or a write query
      const trimmedSql = sql.trim().toUpperCase();
      const isSelect = trimmedSql.startsWith('SELECT');
      const isInsert = trimmedSql.startsWith('INSERT');
      const isUpdate = trimmedSql.startsWith('UPDATE');
      const isDelete = trimmedSql.startsWith('DELETE');

      // Convert MySQL NOW() to SQLite datetime('now')
      processedSql = processedSql.replace(/NOW\(\)/gi, "datetime('now')");

      // Convert MySQL DATE_ADD syntax to SQLite
      processedSql = processedSql.replace(/DATE_ADD\(NOW\(\),\s*INTERVAL\s+(\d+)\s+(\w+)\)/gi,
        (match, num, unit) => `datetime('now', '+${num} ${unit.toLowerCase()}')`);
      processedSql = processedSql.replace(/DATE_ADD\(datetime\('now'\),\s*INTERVAL\s+(\d+)\s+(\w+)\)/gi,
        (match, num, unit) => `datetime('now', '+${num} ${unit.toLowerCase()}')`);

      if (isSelect) {
        const stmt = db.prepare(processedSql);
        const rows = params.length > 0 ? stmt.all(...params) : stmt.all();
        return [rows];
      } else if (isInsert) {
        const stmt = db.prepare(processedSql);
        const result = params.length > 0 ? stmt.run(...params) : stmt.run();
        return [{ insertId: result.lastInsertRowid, affectedRows: result.changes }];
      } else if (isUpdate || isDelete) {
        const stmt = db.prepare(processedSql);
        const result = params.length > 0 ? stmt.run(...params) : stmt.run();
        return [{ affectedRows: result.changes }];
      } else {
        // For other statements (CREATE, etc.)
        const stmt = db.prepare(processedSql);
        if (params.length > 0) {
          stmt.run(...params);
        } else {
          stmt.run();
        }
        return [{}];
      }
    } catch (err) {
      console.error('SQL Error:', err.message);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw err;
    }
  },

  async getConnection() {
    return {
      async query(sql, params = []) {
        return pool.query(sql, params);
      },
      release() {
        // No-op for SQLite
      }
    };
  },

  async execute(sql, params = []) {
    return pool.query(sql, params);
  }
};

// Initialize database schema
function initializeDatabase() {
  // Areas table
  db.exec(`
    CREATE TABLE IF NOT EXISTS areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(200) NOT NULL,
      province VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Skills table
  db.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(200) UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Workers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number VARCHAR(10) UNIQUE NOT NULL,
      pin_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      surname VARCHAR(100) NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female')) NOT NULL,
      area_id INTEGER NOT NULL,
      bio TEXT,
      email VARCHAR(255),
      profile_photo_url VARCHAR(500),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (area_id) REFERENCES areas(id)
    )
  `);

  // Worker skills table
  db.exec(`
    CREATE TABLE IF NOT EXISTS worker_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      years_experience INTEGER DEFAULT 0,
      UNIQUE(worker_id, skill_id),
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id)
    )
  `);

  // Ratings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
      comment TEXT,
      status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
    )
  `);

  // OTP codes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number VARCHAR(10) NOT NULL,
      code VARCHAR(6) NOT NULL,
      purpose TEXT CHECK(purpose IN ('registration', 'pin_reset')) NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Main admin table
  db.exec(`
    CREATE TABLE IF NOT EXISTS main_admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Worker sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS worker_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES workers(id) ON DELETE CASCADE
    )
  `);

  // Admin sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES main_admin(id) ON DELETE CASCADE
    )
  `);

  console.log('Database schema initialized');

  // Seed initial data if tables are empty
  const areaCount = db.prepare('SELECT COUNT(*) as count FROM areas').get();
  if (areaCount.count === 0) {
    db.prepare("INSERT INTO areas (name, province) VALUES (?, ?)").run('Johannesburg1', 'Gauteng');
    db.prepare("INSERT INTO areas (name, province) VALUES (?, ?)").run('Johannesburg2', 'Gauteng');
    console.log('Seeded areas');
  }

  const skillCount = db.prepare('SELECT COUNT(*) as count FROM skills').get();
  if (skillCount.count === 0) {
    db.prepare("INSERT INTO skills (name) VALUES (?)").run('Plumber');
    db.prepare("INSERT INTO skills (name) VALUES (?)").run('Taxi Driver');
    console.log('Seeded skills');
  }

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM main_admin').get();
  if (adminCount.count === 0) {
    const bcrypt = require('bcrypt');
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    db.prepare("INSERT INTO main_admin (username, password_hash) VALUES (?, ?)").run(adminUsername, passwordHash);
    console.log('Seeded admin user');
  }
}

// Initialize on module load
initializeDatabase();

module.exports = pool;
