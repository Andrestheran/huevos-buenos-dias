#!/usr/bin/env node

/**
 * Script to run database migration
 * Usage: node run-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🔄 Running migration: 003_add_frozen_and_mortality.sql\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/003_add_frozen_and_mortality.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Remove comments and split by semicolons
    const statements = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.match(/^(BEGIN|COMMIT)$/i));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executing...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { query: stmt });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.error('Statement:', stmt.substring(0, 100) + '...');
          throw error;
        }

        console.log(`✅ Success\n`);
      } catch (err) {
        console.error(`\n❌ Failed to execute statement ${i + 1}`);
        console.error('Error:', err.message);
        console.error('\nNote: You need to run this migration in the Supabase SQL Editor.');
        console.error('The ANON_KEY does not have permissions for DDL operations.\n');
        process.exit(1);
      }
    }

    console.log('✅ Migration completed successfully!\n');

    // Verify the migration
    console.log('🔍 Verifying migration...\n');

    const { data, error } = await supabase
      .from('production_records')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Verification failed:', error.message);
    } else {
      console.log('✅ Database structure verified!');
      if (data && data[0]) {
        console.log('Sample record fields:', Object.keys(data[0]));
      }
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n⚠️  Please run the migration manually in Supabase SQL Editor:');
    console.error('1. Go to https://supabase.com/dashboard');
    console.error('2. Select your project');
    console.error('3. Navigate to SQL Editor');
    console.error('4. Copy and paste the content of:');
    console.error('   supabase/migrations/003_add_frozen_and_mortality.sql');
    console.error('5. Click "Run"\n');
    process.exit(1);
  }
}

runMigration();
