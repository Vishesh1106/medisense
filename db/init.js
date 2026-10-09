const Database = require('better-sqlite3');
const fs       = require('fs');
const path     = require('path');

const DB_PATH     = path.join(__dirname, 'medisense.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Run schema (CREATE TABLE IF NOT EXISTS — safe to call every boot)
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

console.log('✅ Database ready →', DB_PATH);

module.exports = db;
