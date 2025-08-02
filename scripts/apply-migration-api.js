import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = 'https://nqqbvlvuzyctmysablzw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWJ2bHZ1enljdG15c2FibHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwOTIyOTgsImV4cCI6MjA2OTY2ODI5OH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'; // You'll need to get this from your project

// Read the migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20250117000001-add-household-support.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

async function applyMigration() {
  try {
    console.log('Applying migration via Supabase API...');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Note: This would require the service_role key and proper authentication
    // For security reasons, we'll show the manual approach instead
    
    console.log('\n⚠️  Security Note: Direct API execution requires service_role key');
    console.log('For now, please use the manual approach:\n');
    
    console.log('📋 Migration SQL:');
    console.log('=======================');
    console.log(migrationSQL);
    console.log('=======================');
    
    console.log('\n🚀 To apply this migration:');
    console.log('1. Go to: https://supabase.com/dashboard/project/nqqbvlvuzyctmysablzw/sql');
    console.log('2. Click "New query"');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Click "Run"');
    
    console.log('\n🔑 To get the database password for CLI:');
    console.log('1. Go to: https://supabase.com/dashboard/project/nqqbvlvuzyctmysablzw/settings/database');
    console.log('2. Click "Reset database password"');
    console.log('3. Use the password with: npx supabase db push');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

applyMigration(); 