import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = 'https://nqqbvlvuzyctmysablzw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

// Read the migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20250117000001-add-household-support.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Method 1: Direct REST API with service role key
async function applyViaREST() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Service role key not available for REST API');
    return false;
  }

  try {
    console.log('🚀 Attempting REST API approach...');
    
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
      console.log('✅ REST API migration successful!');
      console.log('Result:', result);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ REST API failed:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ REST API error:', error.message);
    return false;
  }
}

// Method 2: Using Supabase client
async function applyViaClient() {
  try {
    console.log('🔄 Attempting Supabase client approach...');
    
    // This would require the @supabase/supabase-js package
    // For now, we'll show the approach
    console.log('📦 Would require @supabase/supabase-js package');
    console.log('🔧 Would use supabase.rpc() method');
    return false;
  } catch (error) {
    console.log('❌ Client approach error:', error.message);
    return false;
  }
}

// Method 3: Direct PostgreSQL connection
async function applyViaDirectConnection() {
  if (!SUPABASE_DB_PASSWORD) {
    console.log('❌ Database password not available for direct connection');
    return false;
  }

  try {
    console.log('🔌 Attempting direct PostgreSQL connection...');
    
    // This would require the 'pg' package
    // For now, we'll show the approach
    console.log('📦 Would require pg package');
    console.log('🔧 Would connect directly to PostgreSQL');
    return false;
  } catch (error) {
    console.log('❌ Direct connection error:', error.message);
    return false;
  }
}

// Method 4: Create a simple HTTP client
async function applyViaSimpleHTTP() {
  try {
    console.log('🌐 Attempting simple HTTP approach...');
    
    // Try to create a simple HTTP request to execute SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY || 'no-key'
      }
    });
    
    console.log('📡 HTTP connection test:', response.status);
    return false;
  } catch (error) {
    console.log('❌ HTTP approach error:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔧 Advanced Supabase Migration Tool');
  console.log('==================================\n');
  
  console.log('📋 Migration to apply:');
  console.log('=======================');
  console.log(migrationSQL.substring(0, 200) + '...');
  console.log('=======================\n');
  
  // Try different approaches
  const methods = [
    { name: 'REST API', fn: applyViaREST },
    { name: 'Supabase Client', fn: applyViaClient },
    { name: 'Direct PostgreSQL', fn: applyViaDirectConnection },
    { name: 'Simple HTTP', fn: applyViaSimpleHTTP }
  ];
  
  let success = false;
  
  for (const method of methods) {
    console.log(`\n🔧 Trying ${method.name}...`);
    try {
      const result = await method.fn();
      if (result) {
        console.log(`✅ ${method.name} succeeded!`);
        success = true;
        break;
      }
    } catch (error) {
      console.log(`❌ ${method.name} failed:`, error.message);
    }
  }
  
  if (!success) {
    console.log('\n💡 All automated methods failed. Manual approach required:');
    console.log('\n🚀 Manual Migration Steps:');
    console.log('1. Go to: https://supabase.com/dashboard/project/nqqbvlvuzyctmysablzw/sql');
    console.log('2. Click "New query"');
    console.log('3. Copy and paste this SQL:');
    console.log('\n' + migrationSQL);
    console.log('\n4. Click "Run"');
    
    console.log('\n🔑 To enable automated approaches:');
    console.log('1. Get service role key: https://supabase.com/dashboard/project/nqqbvlvuzyctmysablzw/settings/api');
    console.log('2. Set: export SUPABASE_SERVICE_ROLE_KEY="your_key"');
    console.log('3. Get database password: https://supabase.com/dashboard/project/nqqbvlvuzyctmysablzw/settings/database');
    console.log('4. Set: export SUPABASE_DB_PASSWORD="your_password"');
    console.log('5. Run this script again');
  }
}

main(); 