import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20250117000001-add-household-support.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('🔧 Household Migration Application');
console.log('==================================\n');

console.log('📋 Migration SQL:');
console.log('=======================');
console.log(migrationSQL);
console.log('=======================\n');

console.log('🚀 To apply this migration, you have several options:\n');

console.log('Option 1: Manual via Dashboard (Recommended)');
console.log('1. Go to: https://supabase.com/dashboard/project/nqqbvlvuzyctmysablzw/sql');
console.log('2. Click "New query"');
console.log('3. Copy and paste the SQL above');
console.log('4. Click "Run"\n');

console.log('Option 2: CLI with Database Password');
console.log('1. Get database password: https://supabase.com/dashboard/project/nqqbvlvuzyctmysablzw/settings/database');
console.log('2. Click "Reset database password"');
console.log('3. Use: npx supabase db push\n');

console.log('Option 3: Direct API (Advanced)');
console.log('1. Get service role key: https://supabase.com/dashboard/project/nqqbvlvuzyctmysablzw/settings/api');
console.log('2. Set: export SUPABASE_SERVICE_ROLE_KEY="your_key"');
console.log('3. Run: node scripts/apply-migration-direct.js\n');

console.log('✅ After applying the migration, you can:');
console.log('- Create households in the UI');
console.log('- Add individuals to households');
console.log('- View household management features');
console.log('- Test family-level reporting');

console.log('\n🎯 Quick Start:');
console.log('1. Copy the SQL above');
console.log('2. Go to the SQL editor in your Supabase dashboard');
console.log('3. Paste and run the SQL');
console.log('4. Test the household features in your app!'); 