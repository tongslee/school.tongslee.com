/**
 * Database Abstraction Layer
 * Supports SQLite (default) and PostgreSQL
 */

const fs = require('fs');
const path = require('path');

const DB_TYPE = process.env.DB_TYPE || 'sqlite';
const DB_PATH = process.env.DB_PATH || './data/school.db';

let db = null;

// Initialize database connection
async function init() {
  if (DB_TYPE === 'sqlite') {
    await initSQLite();
  } else if (DB_TYPE === 'postgresql') {
    await initPostgreSQL();
  } else {
    throw new Error(`Unsupported DB_TYPE: ${DB_TYPE}`);
  }
}

// SQLite Implementation
async function initSQLite() {
  const Database = require('better-sqlite3');
  
  // Ensure data directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS school_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT,
      color TEXT DEFAULT '#64748b'
    );
    
    CREATE TABLE IF NOT EXISTS school_weeks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_start TEXT NOT NULL,
      week_end TEXT NOT NULL,
      term TEXT DEFAULT '',
      is_current INTEGER DEFAULT 0
    );
    
    CREATE TABLE IF NOT EXISTS school_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      assignment_type TEXT DEFAULT 'other',
      due_date TEXT,
      status TEXT DEFAULT 'pending',
      subject_id INTEGER,
      week_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES school_subjects(id),
      FOREIGN KEY (week_id) REFERENCES school_weeks(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_assignments_week ON school_assignments(week_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_subject ON school_assignments(subject_id);
  `);
  
  console.log('SQLite database initialized at', DB_PATH);
}

// PostgreSQL Implementation
async function initPostgreSQL() {
  const { Client } = require('pg');
  
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'openclaw',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'openclaw'
  });
  
  await client.connect();
  
  // Create wrapper object that mimics SQLite API
  db = {
    client,
    type: 'postgresql',
    
    exec(sql) {
      return client.query(sql);
    },
    
    prepare(sql) {
      return {
        run: (...params) => client.query(sql, params),
        get: (...params) => client.query(sql, params).then(r => r.rows[0]),
        all: (...params) => client.query(sql, params).then(r => r.rows)
      };
    }
  };
  
  console.log('PostgreSQL database connected');
}

// Query helper - unified interface for both SQLite and PostgreSQL
function query(sql, params = []) {
  if (DB_TYPE === 'sqlite') {
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return rows;
  } else {
    return db.client.query(sql, params).then(r => r.rows);
  }
}

function run(sql, params = []) {
  if (DB_TYPE === 'sqlite') {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  } else {
    return db.client.query(sql, params);
  }
}

// Database API Methods
async function getSubjects() {
  const sql = `SELECT id, name, display_name, color FROM school_subjects ORDER BY name;`;
  const rows = query(sql);
  return rows.map(r => [r.id, r.name, r.display_name || r.name, r.color]);
}

async function getWeeks() {
  const sql = `SELECT id, week_start, week_end, term, is_current FROM school_weeks ORDER BY week_start;`;
  const rows = query(sql);
  return rows.map(r => [r.id, r.week_start, r.week_end, r.term, r.is_current ? 'true' : 'false']);
}

async function getAssignments() {
  const sql = `
    SELECT 
      a.id, a.title, a.assignment_type, a.due_date, a.status,
      s.id as subject_id, s.name as subject_name, s.color,
      w.id as week_id, w.week_start, w.week_end
    FROM school_assignments a
    JOIN school_subjects s ON a.subject_id = s.id
    JOIN school_weeks w ON a.week_id = w.id
    ORDER BY w.week_start, s.name
  `;
  const rows = query(sql);
  return rows.map(r => [
    r.id, r.title, r.assignment_type, r.due_date, r.status,
    r.subject_id, r.subject_name, r.color,
    r.week_id, r.week_start, r.week_end
  ]);
}

// Seed data if database is empty
async function seedIfEmpty() {
  const subjects = query(`SELECT COUNT(*) as count FROM school_subjects`);
  if (subjects[0].count > 0) return;
  
  console.log('Seeding database with sample data...');
  
  // Insert subjects
  const insertSubject = db.prepare ? db.prepare(`INSERT INTO school_subjects (name, display_name, color) VALUES (?, ?, ?)`) : null;
  
  const subjectData = [
    ['math', 'Mathematics', '#ef4444'],
    ['science', 'Science', '#22c55e'],
    ['english', 'English', '#3b82f6'],
    ['history', 'History', '#f59e0b'],
    ['art', 'Art', '#ec4899']
  ];
  
  if (DB_TYPE === 'sqlite') {
    const stmt = db.prepare(`INSERT INTO school_subjects (name, display_name, color) VALUES (?, ?, ?)`);
    subjectData.forEach(s => stmt.run(...s));
  } else {
    subjectData.forEach(s => run(`INSERT INTO school_subjects (name, display_name, color) VALUES ($1, $2, $3)`, s));
  }
  
  // Insert current week
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  if (DB_TYPE === 'sqlite') {
    db.prepare(`INSERT INTO school_weeks (week_start, week_end, term, is_current) VALUES (?, ?, ?, 1)`)
      .run(weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0], 'Spring 2025');
  } else {
    run(`INSERT INTO school_weeks (week_start, week_end, term, is_current) VALUES ($1, $2, $3, true)`,
      [weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0], 'Spring 2025']);
  }
  
  console.log('Database seeded successfully');
}

module.exports = { init, getSubjects, getWeeks, getAssignments, seedIfEmpty, query, run };
