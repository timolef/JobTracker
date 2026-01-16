const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'job_tracker',
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  try {
    const connection = await pool.getConnection();
    console.log('Connected to MySQL Database.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        is_premium BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        company VARCHAR(255) NOT NULL,
        position VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Applied',
        link TEXT,
        notes TEXT,
        cv_id INT,
        cover_letter_id INT,
        follow_up_date DATE,
        date_applied TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (cv_id) REFERENCES documents(id) ON DELETE SET NULL,
        FOREIGN KEY (cover_letter_id) REFERENCES documents(id) ON DELETE SET NULL
      )
    `);

    // Ensure columns exist for existing databases
    try {
      await connection.query('ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE');
    } catch (e) { /* ignore if column exists */ }

    try {
      await connection.query('ALTER TABLE applications ADD COLUMN cv_id INT');
    } catch (e) { /* ignore if column exists */ }
    try {
      await connection.query('ALTER TABLE applications ADD COLUMN cover_letter_id INT');
    } catch (e) { /* ignore if column exists */ }
    try {
      await connection.query('ALTER TABLE applications ADD COLUMN follow_up_date DATE');
    } catch (e) { /* ignore if column exists */ }
    try {
      await connection.query('ALTER TABLE applications ADD FOREIGN KEY (cv_id) REFERENCES documents(id) ON DELETE SET NULL');
    } catch (e) { /* ignore if key exists */ }
    try {
      await connection.query('ALTER TABLE applications ADD FOREIGN KEY (cover_letter_id) REFERENCES documents(id) ON DELETE SET NULL');
    } catch (e) { /* ignore if key exists */ }

    // Ensure contacts column exists
    try {
      await connection.query('ALTER TABLE contacts ADD COLUMN follow_up_date DATE');
    } catch (e) { /* ignore if column exists */ }

    // In a real app we'd have an 'applications' table too, but for MVP we might stick to local storage for data 
    // or we'd need to migrate that too. The prompt specifically asked for "inscription et connexion sécurisé". 
    // I will stick to User Auth for now to keep it simple as requested.

    await connection.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        type ENUM('CV', 'CoverLetter', 'Other') NOT NULL,
        file_path VARCHAR(255),
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        role VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        linkedin_url VARCHAR(255),
        notes TEXT,
        last_contact_date TIMESTAMP NULL,
        follow_up_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS interviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        application_id INT,
        company VARCHAR(255) NOT NULL,
        position VARCHAR(255) NOT NULL,
        interview_date DATETIME NOT NULL,
        type ENUM('Phone', 'Video', 'On-site', 'Technical') DEFAULT 'Video',
        questions TEXT,
        research TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
      )
    `);

    connection.release();
    console.log('Database initialized (Users, Applications, Documents tables ready).');
  } catch (err) {
    console.error('FATAL: Database initialization failed:', err);
    // On Railway, we want to crash if DB fails so we see it in logs
    process.exit(1);
  }
}

module.exports = { pool, initDB };
