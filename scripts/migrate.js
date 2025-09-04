const path = require('path');
const fs = require('fs');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../database/migrations');
  const files = fs.readdirSync(migrationsDir).sort();
  
  console.log('🔄 Running database migrations...');
  
  for (const file of files) {
    if (file.endsWith('.js')) {
      console.log(`Running migration: ${file}`);
      const migration = require(path.join(migrationsDir, file));
      await migration.up();
    }
  }
  
  console.log('✅ All migrations completed successfully');
  process.exit(0);
}

runMigrations().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
