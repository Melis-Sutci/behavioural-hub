#!/usr/bin/env node

/**
 * Flexible Database Migration Runner
 * Runs specified migration files or all pending migrations
 * Supports both SQL (.sql) and JavaScript (.js) migrations
 * Usage:
 *   node run-migrations.js                    # Run all migrations
 *   node run-migrations.js 007 008 009        # Run specific migrations
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'behavioural_hub.db');
const migrationsDir = path.join(__dirname, 'migrations');

// Get migration numbers from command line args, or run all
const args = process.argv.slice(2);
let migrationFiles = [];

if (args.length === 0) {
  // Run all migrations in order (both .sql and .js files)
  const allFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') || f.endsWith('.js'))
    .sort();
  migrationFiles = allFiles.map(f => path.join(migrationsDir, f));
} else {
  // Run specified migrations
  migrationFiles = args.map(num => {
    const matches = fs.readdirSync(migrationsDir)
      .filter(f => f.startsWith(num.padStart(3, '0')) && (f.endsWith('.sql') || f.endsWith('.js')));

    if (matches.length === 0) {
      console.error(`❌ Migration ${num} not found`);
      process.exit(1);
    }

    return path.join(migrationsDir, matches[0]);
  });
}

console.log('🔧 Database Migration Runner');
console.log('📊 Database:', dbPath);
console.log(`📝 Running ${migrationFiles.length} migration(s)\n`);

try {
  // Connect to database
  const db = new Database(dbPath);

  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  // Process each migration file
  for (const migrationFile of migrationFiles) {
    const fileName = path.basename(migrationFile);
    console.log(`\n🔄 Running: ${fileName}`);
    console.log('─'.repeat(60));

    // Check if this is a JavaScript migration
    if (fileName.endsWith('.js')) {
      try {
        console.log('   Executing JavaScript migration...');
        const migration = require(migrationFile);
        if (typeof migration.up === 'function') {
          migration.up(db);
          console.log(`   ✅ JavaScript migration completed successfully\n`);
          totalSuccess++;
        } else {
          console.error(`   ❌ JavaScript migration has no 'up' function`);
          totalFailed++;
        }
        continue;
      } catch (error) {
        console.error(`   ❌ JavaScript migration failed: ${error.message}`);
        console.error(`      ${error.stack}`);
        totalFailed++;
        continue;
      }
    }

    // Read migration file (SQL)
    const migrationSQL = fs.readFileSync(migrationFile, 'utf8');

    // Remove comments first, then split into statements
    const cleanedSQL = migrationSQL
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        // Keep non-empty lines that don't start with --
        return trimmed.length > 0 && !trimmed.startsWith('--');
      })
      .join('\n');

    // Split into statements by semicolon
    const statements = cleanedSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`   Found ${statements.length} SQL statements\n`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    // Execute each statement
    statements.forEach((statement, index) => {
      try {
        // Skip PostgreSQL-specific or informational commands
        const upper = statement.toUpperCase();
        if (upper.includes('COMMENT ON') ||
            upper.includes('ANALYZE') ||
            upper.startsWith('COMMENT')) {
          skipCount++;
          return;
        }

        // Execute statement
        db.exec(statement);

        // Get a preview of the statement (first 50 chars)
        const preview = statement.replace(/\s+/g, ' ').substring(0, 50);
        console.log(`   ✅ [${index + 1}/${statements.length}] ${preview}...`);
        successCount++;

      } catch (error) {
        if (error.message.includes('already exists') ||
            error.message.includes('duplicate column name')) {
          console.log(`   ⏭️  [${index + 1}/${statements.length}] Already exists (skipped)`);
          skipCount++;
        } else {
          console.error(`   ❌ [${index + 1}/${statements.length}] Error: ${error.message}`);
          const preview = statement.substring(0, 100);
          console.error(`      Statement: ${preview}...`);
          failCount++;
        }
      }
    });

    console.log(`\n   📊 ${fileName} Results:`);
    console.log(`      ✅ Successful: ${successCount}`);
    console.log(`      ⏭️  Skipped: ${skipCount}`);
    if (failCount > 0) {
      console.log(`      ❌ Failed: ${failCount}`);
    }

    totalSuccess += successCount;
    totalSkipped += skipCount;
    totalFailed += failCount;
  }

  db.close();

  console.log('\n' + '═'.repeat(60));
  console.log('✨ All migrations completed!');
  console.log(`   ✅ Total successful: ${totalSuccess}`);
  console.log(`   ⏭️  Total skipped: ${totalSkipped}`);
  if (totalFailed > 0) {
    console.log(`   ❌ Total failed: ${totalFailed}`);
  }
  console.log('');

  if (totalFailed > 0) {
    process.exit(1);
  }

} catch (error) {
  console.error('\n❌ Migration runner failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
