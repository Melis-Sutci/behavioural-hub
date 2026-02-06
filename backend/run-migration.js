#!/usr/bin/env node

/**
 * Database Migration Runner for Quick Win #9
 * Runs the performance indexing migration
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'behavioural_hub.db');
const migrationPath = path.join(__dirname, '..', 'migrations', '006_add_performance_indexes.sql');

console.log('🔧 Running database migration...');
console.log('Database:', dbPath);
console.log('Migration:', migrationPath);

try {
  // Read migration file
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  // Connect to database
  const db = new Database(dbPath);

  // Split migration into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

  console.log(`\n📝 Found ${statements.length} SQL statements to execute\n`);

  // Execute each statement
  let successCount = 0;
  let skipCount = 0;

  statements.forEach((statement, index) => {
    try {
      // Skip PostgreSQL-specific commands
      if (statement.toUpperCase().includes('COMMENT ON INDEX') || statement.toUpperCase().includes('ANALYZE')) {
        skipCount++;
        return;
      }

      // Execute statement
      db.exec(statement);
      console.log(`✅ [${index + 1}] Success`);
      successCount++;
    } catch (error) {
      if (error.message.includes('already exists')) {
        skipCount++;
      } else {
        console.error(`❌ Error: ${error.message}`);
      }
    }
  });

  db.close();

  console.log('\n✨ Migration completed!');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}\n`);

} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
}
