#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'behavioural_hub.db');
const db = new Database(dbPath);

console.log('🔍 Checking database structure...\n');

// Check if users table exists
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('📋 Tables in database:');
  tables.forEach(t => console.log(`   - ${t.name}`));

  // Check users table specifically
  const usersTableExists = tables.some(t => t.name === 'users');

  if (usersTableExists) {
    console.log('\n✅ Users table EXISTS\n');

    // Get users table schema
    const schema = db.prepare("PRAGMA table_info(users)").all();
    console.log('📊 Users table schema:');
    schema.forEach(col => console.log(`   - ${col.name} (${col.type})`));

    // Get users count
    const count = db.prepare("SELECT COUNT(*) as count FROM users").get();
    console.log(`\n👥 Total users in database: ${count.count}`);

    // Get first user
    const users = db.prepare("SELECT id, email, full_name, role FROM users LIMIT 5").all();
    if (users.length > 0) {
      console.log('\n📝 Users:');
      users.forEach(u => console.log(`   - ${u.email} (${u.full_name}) - Role: ${u.role}`));
    }
  } else {
    console.log('\n❌ Users table DOES NOT EXIST');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

db.close();
console.log('\n✅ Database check complete!');
