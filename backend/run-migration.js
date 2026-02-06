const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'behavioural_hub.db');
const migrationPath = path.join(__dirname, 'migrations', '001_add_settings_table.sql');

console.log('🗄️  Running migration...');
console.log('Database:', dbPath);
console.log('Migration:', migrationPath);

try {
  // Connect to database
  const db = new Database(dbPath);

  // Read migration file
  const migration = fs.readFileSync(migrationPath, 'utf8');

  console.log(`\n📝 Executing migration SQL...\n`);

  try {
    // Execute entire migration as one transaction
    db.exec(migration);
    console.log(`✅ Migration executed successfully`);
  } catch (error) {
    console.error(`❌ Migration error:`, error.message);
    throw error;
  }

  // Verify settings table
  const count = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  console.log(`\n✅ Migration completed! Settings table has ${count.count} records.`);

  // Show sample settings
  const samples = db.prepare('SELECT category, key, value FROM settings LIMIT 5').all();
  console.log('\n📋 Sample settings:');
  samples.forEach(s => {
    console.log(`   ${s.category}.${s.key} = ${s.value}`);
  });

  db.close();
  console.log('\n✅ Database connection closed');

} catch (error) {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
}
