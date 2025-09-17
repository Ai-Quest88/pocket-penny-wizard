#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.bright}${description}${colors.reset}`);
  log(`Running: ${command}`, 'cyan');
  
  try {
    const output = execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf8',
      cwd: process.cwd()
    });
    log('✅ Success', 'green');
    return { success: true, output };
  } catch (error) {
    log('❌ Failed', 'red');
    log(error.stdout || error.message, 'red');
    return { success: false, error: error.stdout || error.message };
  }
}

function createTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    },
    results: results.map(r => ({
      name: r.name,
      success: r.success,
      duration: r.duration,
      error: r.error || null
    }))
  };

  const reportPath = path.join(process.cwd(), 'test-results', 'comprehensive-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  return report;
}

function displaySummary(report) {
  log('\n' + '='.repeat(60), 'bright');
  log('📊 COMPREHENSIVE TEST SUMMARY', 'bright');
  log('='.repeat(60), 'bright');
  
  log(`\nTotal Test Suites: ${report.summary.total}`, 'blue');
  log(`✅ Passed: ${report.summary.passed}`, 'green');
  log(`❌ Failed: ${report.summary.failed}`, 'red');
  
  const successRate = ((report.summary.passed / report.summary.total) * 100).toFixed(1);
  log(`📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  if (report.summary.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    report.results
      .filter(r => !r.success)
      .forEach(r => log(`  • ${r.name}`, 'red'));
  }
  
  log(`\n📄 Detailed report saved to: test-results/comprehensive-report.json`, 'cyan');
  log('='.repeat(60), 'bright');
}

async function main() {
  const startTime = Date.now();
  
  log('🚀 Starting Comprehensive Test Suite', 'bright');
  log('Pocket Penny Wizard - Testing Infrastructure', 'cyan');
  
  const results = [];
  
  // 1. Unit Tests
  const unitStart = Date.now();
  const unitResult = runCommand('npm run test:unit', '🧪 Unit Tests');
  results.push({
    name: 'Unit Tests',
    success: unitResult.success,
    duration: Date.now() - unitStart,
    error: unitResult.error
  });
  
  // 2. Integration Tests
  const integrationStart = Date.now();
  const integrationResult = runCommand('npm run test:integration', '🔗 Integration Tests');
  results.push({
    name: 'Integration Tests',
    success: integrationResult.success,
    duration: Date.now() - integrationStart,
    error: integrationResult.error
  });
  
  // 3. Component Tests
  const componentStart = Date.now();
  const componentResult = runCommand('npm run test:component', '🧩 Component Tests');
  results.push({
    name: 'Component Tests',
    success: componentResult.success,
    duration: Date.now() - componentStart,
    error: componentResult.error
  });
  
  // 4. Hook Tests
  const hookStart = Date.now();
  const hookResult = runCommand('npm run test:hooks', '🎣 Hook Tests');
  results.push({
    name: 'Hook Tests',
    success: hookResult.success,
    duration: Date.now() - hookStart,
    error: hookResult.error
  });
  
  // 5. API Tests
  const apiStart = Date.now();
  const apiResult = runCommand('npm run test:api', '🌐 API Tests');
  results.push({
    name: 'API Tests',
    success: apiResult.success,
    duration: Date.now() - apiStart,
    error: apiResult.error
  });
  
  // 6. Coverage Report
  const coverageStart = Date.now();
  const coverageResult = runCommand('npm run test:coverage', '📊 Coverage Report');
  results.push({
    name: 'Coverage Report',
    success: coverageResult.success,
    duration: Date.now() - coverageStart,
    error: coverageResult.error
  });
  
  // 7. E2E Tests (if not in CI)
  if (!process.env.CI) {
    const e2eStart = Date.now();
    const e2eResult = runCommand('npm run test:e2e', '🎭 E2E Tests');
    results.push({
      name: 'E2E Tests',
      success: e2eResult.success,
      duration: Date.now() - e2eStart,
      error: e2eResult.error
    });
  }
  
  // 8. Linting
  const lintStart = Date.now();
  const lintResult = runCommand('npm run lint', '🔍 Code Linting');
  results.push({
    name: 'Code Linting',
    success: lintResult.success,
    duration: Date.now() - lintStart,
    error: lintResult.error
  });
  
  const totalDuration = Date.now() - startTime;
  
  // Create and display report
  const report = createTestReport(results);
  report.summary.totalDuration = totalDuration;
  
  displaySummary(report);
  
  // Exit with appropriate code
  const hasFailures = report.summary.failed > 0;
  if (hasFailures) {
    log('\n⚠️  Some tests failed. Please review the output above.', 'yellow');
    process.exit(1);
  } else {
    log('\n🎉 All tests passed!', 'green');
    process.exit(0);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`\n💥 Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log(`\n💥 Unhandled Rejection: ${reason}`, 'red');
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  log(`\n💥 Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});
