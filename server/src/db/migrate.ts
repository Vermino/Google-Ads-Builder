/**
 * Database Migration Script
 * Run this to add missing campaign fields
 */

import { getDatabase, initDatabase } from './database.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function runMigration() {
  console.log('🔄 Running database migration...');

  // Initialize database
  const dbPath = join(__dirname, '../../data/campaigns.db');
  initDatabase(dbPath);
  const db = getDatabase();

  // Check if columns already exist
  const tableInfo = db.pragma('table_info(campaigns)');
  const existingColumns = tableInfo.map((col: any) => col.name);

  const columnsToAdd = [
    { name: 'location', sql: "ALTER TABLE campaigns ADD COLUMN location TEXT DEFAULT 'United States'" },
    { name: 'start_date', sql: "ALTER TABLE campaigns ADD COLUMN start_date TEXT DEFAULT ''" },
    { name: 'end_date', sql: "ALTER TABLE campaigns ADD COLUMN end_date TEXT DEFAULT ''" },
    { name: 'final_url', sql: "ALTER TABLE campaigns ADD COLUMN final_url TEXT DEFAULT ''" },
    { name: 'path1', sql: "ALTER TABLE campaigns ADD COLUMN path1 TEXT DEFAULT ''" },
    { name: 'path2', sql: "ALTER TABLE campaigns ADD COLUMN path2 TEXT DEFAULT ''" },
    { name: 'global_descriptions', sql: "ALTER TABLE campaigns ADD COLUMN global_descriptions TEXT DEFAULT '[]'" },
  ];

  let addedCount = 0;
  for (const column of columnsToAdd) {
    if (!existingColumns.includes(column.name)) {
      console.log(`  Adding column: ${column.name}`);
      try {
        db.exec(column.sql);
        addedCount++;
      } catch (error: any) {
        console.error(`  Error adding ${column.name}:`, error.message);
      }
    } else {
      console.log(`  Column already exists: ${column.name}`);
    }
  }

  console.log(`✅ Migration complete! Added ${addedCount} new columns.`);
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { runMigration };
