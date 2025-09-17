import { chromium, FullConfig } from '@playwright/test';
import { supabase } from '../../src/integrations/supabase/client';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  // Create test data in Supabase
  await setupTestData();
  
  // Setup test environment
  process.env.TEST_ENV = 'true';
  
  console.log('✅ Global test setup completed');
}

async function setupTestData() {
  try {
    // Clean up any existing test data
    console.log('🧹 Cleaning up existing test data...');
    
    // Add test user and sample data
    console.log('📊 Creating test data...');
    
    // You can add specific test data creation here
    // For now, we'll rely on the existing auth flow
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  }
}

export default globalSetup;