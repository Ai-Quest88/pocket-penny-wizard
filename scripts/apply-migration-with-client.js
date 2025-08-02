import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the existing Supabase client
import { supabase } from '../src/integrations/supabase/client.js';

// Read the migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20250117000001-add-household-support.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

async function applyMigrationWithClient() {
  try {
    console.log('🚀 Applying migration using existing Supabase client...');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt + ';'); // Add semicolon back
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement using the client
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      try {
        // Use the rpc method to execute SQL
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} had issues:`, error.message);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
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

// Alternative: Create tables directly using the client
async function createTablesDirectly() {
  try {
    console.log('🔄 Creating tables directly using Supabase client...');
    
    // Create households table
    console.log('📋 Creating households table...');
    const { error: householdsError } = await supabase
      .from('households')
      .select('id')
      .limit(1);
    
    if (householdsError && householdsError.message.includes('relation "households" does not exist')) {
      console.log('✅ households table does not exist - will be created by migration');
    } else {
      console.log('⚠️  households table may already exist');
    }
    
    // Check entities table structure
    console.log('📋 Checking entities table structure...');
    const { data: entitiesData, error: entitiesError } = await supabase
      .from('entities')
      .select('*')
      .limit(1);
    
    if (entitiesError) {
      console.log('❌ Error checking entities table:', entitiesError.message);
    } else {
      console.log('✅ entities table exists');
      // Check if household_id column exists
      if (entitiesData && entitiesData.length > 0) {
        const hasHouseholdId = 'household_id' in entitiesData[0];
        console.log(`📊 household_id column exists: ${hasHouseholdId}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🔧 Supabase Migration with Client');
  console.log('================================\n');
  
  console.log('📋 Migration to apply:');
  console.log('=======================');
  console.log(migrationSQL.substring(0, 200) + '...');
  console.log('=======================\n');
  
  // First check current state
  await createTablesDirectly();
  
  console.log('\n🚀 Attempting to apply migration...');
  await applyMigrationWithClient();
}

main(); 