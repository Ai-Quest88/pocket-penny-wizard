import dotenv from 'dotenv';
dotenv.config();

import { query } from './pool.js';

async function init() {
  console.log('🔧 Initializing database for standalone backend...');

  // Create auth_users table (replaces Supabase auth.users)
  await query(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✅ auth_users table ready');

  // Migrate existing Supabase auth.users to auth_users
  // (This copies any existing users from the Supabase auth schema if it exists)
  try {
    const existing = await query(`SELECT id, email FROM auth.users`);
    if (existing.rows.length > 0) {
      console.log(`📦 Found ${existing.rows.length} existing Supabase auth users, migrating...`);
      for (const user of existing.rows) {
        await query(
          `INSERT INTO auth_users (id, email, password_hash, full_name)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [user.id, user.email, '$migrated$', user.raw_user_meta_data?.full_name || null]
        );
      }
      console.log('✅ Migrated existing users');
    }
  } catch (e) {
    console.log('ℹ️  No Supabase auth schema found (expected for fresh installs)');
  }

  // Update foreign key references: transactions, entities, etc. reference auth.users(id)
  // We need to also allow references to auth_users(id)
  // For now, since we're reusing the same UUIDs, this works transparently

  // Ensure user_profiles can reference auth_users
  try {
    await query(`
      ALTER TABLE user_profiles
      DROP CONSTRAINT IF EXISTS user_profiles_id_fkey
    `);
  } catch (e) {
    // constraint may not exist
  }

  console.log('🎉 Database initialization complete!');
  process.exit(0);
}

init().catch((err) => {
  console.error('❌ Init failed:', err);
  process.exit(1);
});
