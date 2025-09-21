#!/usr/bin/env node

import { chromium } from 'playwright';
import { MCPTestExecutor } from '../tests/mcp-test-executor.js';
import { businessTestCases } from '../tests/business-test-cases.js';
import { execSync } from 'child_process';

// Function to clean up any existing browser processes
function cleanupBrowserProcesses() {
  try {
    // Kill any existing Chrome/Chromium processes (macOS/Linux)
    execSync('pkill -f "chrome\\|chromium" || true', { stdio: 'ignore' });
  } catch (error) {
    // Ignore errors if no processes to kill
  }
}

async function runMCPTests() {
  console.log('🧪 Starting MCP Test Execution...');
  console.log('🧹 Cleaning up any existing browser instances...');
  
  // Clean up any existing browser processes
  cleanupBrowserProcesses();
  
  // Launch browser with explicit settings for visibility
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500, // Slow down actions so you can see them
    devtools: false,
    args: ['--start-maximized'] // Start maximized for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();

  const executor = new MCPTestExecutor(page);
  
  // Get test case from command line argument
  const testCase = process.argv[2];
  
  try {
    if (testCase && businessTestCases[testCase]) {
      console.log(`🎯 Running specific test case: ${testCase}`);
      const success = await executor.executeTestCase(testCase, businessTestCases[testCase]);
      if (success) {
        console.log('✅ Test completed successfully');
      } else {
        console.log('❌ Test failed');
        process.exit(1);
      }
    } else if (testCase) {
      console.error(`❌ Test case "${testCase}" not found.`);
      console.log('Available test cases:', Object.keys(businessTestCases).join(', '));
      process.exit(1);
    } else {
      console.log('🎯 Running all test cases...');
      let allPassed = true;
      for (const key of Object.keys(businessTestCases)) {
        const success = await executor.executeTestCase(key, businessTestCases[key]);
        if (!success) {
          allPassed = false;
        }
      }
      
      const summary = executor.getSummary();
      console.log(`\n📊 Test Summary:`);
      console.log(`   Total Steps: ${summary.total}`);
      console.log(`   Passed: ${summary.passed}`);
      console.log(`   Failed: ${summary.failed}`);
      
      if (allPassed) {
        console.log('✅ All tests completed successfully');
      } else {
        console.log('❌ Some tests failed');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  } finally {
    console.log('🧹 Cleaning up browser...');
    try {
      await browser.close();
      console.log('✅ Browser cleanup completed');
    } catch (error) {
      console.error('⚠️ Browser cleanup warning:', error.message);
    }
  }
}

runMCPTests().catch((error) => {
  console.error('💥 Test execution failed:', error);
  process.exit(1);
});
