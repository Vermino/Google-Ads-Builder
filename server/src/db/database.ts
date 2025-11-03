/**
 * SQLite Database Service
 * Handles database initialization and provides database instance
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

// Database instance (singleton)
let db: Database.Database | null = null;

/**
 * Initialize the SQLite database
 * Creates the database file and runs schema migrations
 */
export function initDatabase(dbPath: string = './data/campaigns.db'): Database.Database {
  if (db) {
    return db;
  }

  console.log(`📦 Initializing SQLite database at: ${dbPath}`);

  // Create database connection
  db = new Database(dbPath, {
    verbose: console.log, // Log SQL queries in development
  });

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Read and execute schema
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Execute schema (split by semicolon and execute each statement)
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  db.transaction(() => {
    for (const statement of statements) {
      db!.exec(statement);
    }
  })();

  console.log('✅ Database initialized successfully');

  return db;
}

/**
 * Get the database instance
 * Throws error if database is not initialized
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('🔌 Database connection closed');
  }
}

/**
 * Reset the database (drop all tables and recreate)
 * WARNING: This will delete all data!
 */
export function resetDatabase(): void {
  const database = getDatabase();

  console.warn('⚠️  Resetting database - ALL DATA WILL BE LOST');

  // Drop all tables
  database.exec('DROP TABLE IF EXISTS ads');
  database.exec('DROP TABLE IF EXISTS ad_groups');
  database.exec('DROP TABLE IF EXISTS campaigns');

  // Reinitialize schema
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  database.transaction(() => {
    for (const statement of statements) {
      database.exec(statement);
    }
  })();

  console.log('✅ Database reset complete');
}

export default {
  initDatabase,
  getDatabase,
  closeDatabase,
  resetDatabase,
};
