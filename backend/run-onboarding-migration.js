#!/usr/bin/env node

/**
 * Run Onboarding Builder Migration
 * This script runs the JavaScript-based onboarding builder migration
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'behavioural_hub.db');
const migration = require('./migrations/003_create_onboarding_builder');

console.log('🚀 Running Onboarding Builder Migration');
console.log('📊 Database:', dbPath);
console.log('');

try {
  const db = new Database(dbPath);

  // Run migration
  migration.up(db);

  // Verify tables were created
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name LIKE 'onboarding_%'
    ORDER BY name
  `).all();

  console.log('\n📋 Onboarding Builder Tables:');
  console.log('─'.repeat(60));
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`   ✅ ${table.name.padEnd(35)} ${count.count} rows`);
  });

  db.close();

  console.log('\n✨ Migration completed successfully!\n');
  process.exit(0);

} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
