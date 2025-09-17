#!/usr/bin/env node

// Build script for TypeScript test files
import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';

console.log('🔨 Building TypeScript test files...');

try {
  // Compile TypeScript files
  execSync('npx tsc tests/*.ts --outDir tests --target es2020 --module esnext --moduleResolution node', { 
    stdio: 'inherit' 
  });
  
  console.log('✅ TypeScript compilation completed successfully');
  
  // List compiled files
  console.log('\n📁 Compiled files:');
  const files = [
    'tests/types.js',
    'tests/element-library.js', 
    'tests/actions.js',
    'tests/business-operations.js',
    'tests/business-test-cases.js',
    'tests/mcp-test-executor.js'
  ];
  
  files.forEach(file => {
    if (existsSync(file)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} (missing)`);
    }
  });
  
} catch (error) {
  console.error('❌ TypeScript compilation failed:', error.message);
  process.exit(1);
}
