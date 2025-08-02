import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - You'll need to get these from your Supabase project
const SUPABASE_URL = 'https://nqqbvlvuzyctmysablzw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Set this in your environment

// Read the migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20250117000001-add-household-support.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

async function applyMigrationDirect() {
  try {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.log('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
      console.log('\n🔑 To get your service role key:');
      console.log('1. Go to: https://supabase.com/dashboard/project/nqqbvlvuzyctmysablzw/settings/api');
      console.log('2. Copy the "service_role" key (not the anon key)');
      console.log('3. Set it as environment variable:');
      console.log('   export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"');
      console.log('4. Run this script again');
      return;
    }

    console.log('🚀 Applying migration via Supabase API...');
    
    // Split SQL into executable statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt + ';'); // Add semicolon back
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement via REST API
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY
          },
          body: JSON.stringify({
            sql: statement
          })
        });
        
        if (response.ok) {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } else {
          const errorText = await response.text();
          console.log(`⚠️  Statement ${i + 1} had issues:`, errorText);
          // Continue with other statements
        }
      } catch (error) {
        console.log(`❌ Error executing statement ${i + 1}:`, error.message);
      }
    }
    
    console.log('\n🎉 Migration application completed!');
    console.log('\n📊 To verify the migration:');
    console.log('1. Go to: https://supabase.com/dashboard/project/nqqbvlvuzyctmysablzw/table-editor');
    console.log('2. Check if the "households" table exists');
    console.log('3. Check if "entities" table has "household_id" column');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Alternative approach:');
    console.log('1. Go to: https://supabase.com/dashboard/project/nqqbvlvuzyctmysablzw/sql');
    console.log('2. Copy and paste the migration SQL manually');
  }
}

// Alternative: Use pgAdmin-style approach
async function applyMigrationViaRPC() {
  try {
    console.log('🔄 Trying alternative RPC approach...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        sql: migrationSQL
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Migration applied successfully!');
      console.log('Result:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ RPC Error:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🔧 Supabase Migration Application Tool');
  console.log('=====================================\n');
  
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.log('📋 Migration SQL to apply manually:');
    console.log('=====================================');
    console.log(migrationSQL);
    console.log('=====================================');
    console.log('\n🚀 To apply this migration:');
    console.log('1. Go to: https://supabase.com/dashboard/project/nqqbvlvuzyctmysablzw/sql');
    console.log('2. Click "New query"');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Click "Run"');
    console.log('\n🔑 To get service role key for API:');
    console.log('1. Go to: https://supabase.com/dashboard/project/nqqbvlvuzyctmysablzw/settings/api');
    console.log('2. Copy the "service_role" key');
    console.log('3. Set: export SUPABASE_SERVICE_ROLE_KEY="your_key"');
    console.log('4. Run this script again');
  } else {
    await applyMigrationDirect();
    // await applyMigrationViaRPC(); // Uncomment to try alternative approach
  }
}

main(); 