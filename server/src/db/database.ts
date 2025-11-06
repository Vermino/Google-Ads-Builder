/**
 * SQLite Database Service
 * Handles database initialization and provides database instance
 */

import Database from 'better-sqlite3';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database instance (singleton)
let db: Database.Database | null = null;

/**
 * Run database migrations from the migrations folder
 */
function runMigrations(database: Database.Database): void {
  const migrationsPath = join(__dirname, 'migrations');

  if (!existsSync(migrationsPath)) {
    console.log('📦 No migrations folder found, skipping migrations');
    return;
  }

  // Create migrations tracking table
  database.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Get list of migration files
  const migrationFiles = readdirSync(migrationsPath)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensure migrations run in order

  for (const file of migrationFiles) {
    // Check if migration has already been applied
    const alreadyApplied = database
      .prepare('SELECT name FROM migrations WHERE name = ?')
      .get(file);

    if (alreadyApplied) {
      console.log(`⏭️  Migration ${file} already applied, skipping`);
      continue;
    }

    console.log(`🔄 Running migration: ${file}`);

    const migrationPath = join(migrationsPath, file);
    const migration = readFileSync(migrationPath, 'utf-8');

    try {
      // Execute migration in a transaction
      database.transaction(() => {
        // Remove SQL comments (both -- and /* */ style)
        let cleanedMigration = migration
          .split('\n')
          .map(line => {
            // Remove inline comments (-- style)
            const commentIndex = line.indexOf('--');
            if (commentIndex !== -1) {
              return line.substring(0, commentIndex);
            }
            return line;
          })
          .join('\n')
          .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove /* */ comments

        const statements = cleanedMigration
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          database.exec(statement);
        }

        // Record migration as applied
        database
          .prepare('INSERT INTO migrations (name) VALUES (?)')
          .run(file);
      })();

      console.log(`✅ Migration ${file} applied successfully`);
    } catch (error) {
      console.error(`❌ Failed to apply migration ${file}:`, error);
      throw error;
    }
  }
}

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

  // Run migrations
  runMigrations(db);

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
