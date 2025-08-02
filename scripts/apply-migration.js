import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20250117000001-add-household-support.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('Migration SQL to apply:');
console.log('=======================');
console.log(migrationSQL);
console.log('=======================');
console.log('');
console.log('To apply this migration:');
console.log('1. Go to: https://supabase.com/dashboard/project/nqqbvlvuzyctmysablzw/sql');
console.log('2. Click "New query"');
console.log('3. Copy and paste the SQL above');
console.log('4. Click "Run"');
console.log('');
console.log('Or use the CLI with the database password:');
console.log('npx supabase db push'); 