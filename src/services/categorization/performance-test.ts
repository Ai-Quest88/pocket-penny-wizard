// Performance verification for Smart Categorization System
import { SmartCategorizer } from './SmartCategorizer';
import { UserHistoryMatcher } from './UserHistoryMatcher';
import { SystemKeywordMatcher } from './SystemKeywordMatcher';
import type { TransactionData } from './types';

export interface PerformanceTestResult {
  userHistoryTime: number;
  systemKeywordTime: number;
  aiTime: number;
  totalTime: number;
  passed: boolean;
  details: string;
}

export async function verifyPerformanceBenchmarks(): Promise<PerformanceTestResult> {
  console.log('⚡ Verifying Performance Benchmarks...\n');

  const userId = 'test-user-id';
  
  // Test data - 100 transactions for performance testing
  const testTransactions: TransactionData[] = Array.from({ length: 100 }, (_, i) => ({
    description: `Test Transaction ${i + 1} - UBER *EATS`,
    amount: -15.99,
    date: '2025-01-17',
    currency: 'AUD'
  }));

  const results: PerformanceTestResult = {
    userHistoryTime: 0,
    systemKeywordTime: 0,
    aiTime: 0,
    totalTime: 0,
    passed: false,
    details: ''
  };

  try {
    // Test individual components
    console.log('1. Testing UserHistoryMatcher performance...');
    const userMatcher = new UserHistoryMatcher(userId);
    const userHistoryStart = Date.now();
    await userMatcher.findSimilarTransaction(testTransactions[0]);
    results.userHistoryTime = Date.now() - userHistoryStart;
    console.log(`   ⏱️ User History Lookup: ${results.userHistoryTime}ms (Target: <50ms)`);

    console.log('\n2. Testing SystemKeywordMatcher performance...');
    const systemMatcher = new SystemKeywordMatcher();
    const systemKeywordStart = Date.now();
    await systemMatcher.findKeywordMatch(testTransactions[0]);
    results.systemKeywordTime = Date.now() - systemKeywordStart;
    console.log(`   ⏱️ System Keywords Lookup: ${results.systemKeywordTime}ms (Target: <100ms)`);

    console.log('\n3. Testing SmartCategorizer performance with 100 transactions...');
    const smartCategorizer = new SmartCategorizer(userId);
    const totalStart = Date.now();
    await smartCategorizer.categorizeTransactions(testTransactions);
    results.totalTime = Date.now() - totalStart;
    console.log(`   ⏱️ Total Processing Time: ${results.totalTime}ms (Target: <10s for 100 transactions)`);

    // Calculate AI time (estimated from total - other components)
    results.aiTime = Math.max(0, results.totalTime - results.userHistoryTime - results.systemKeywordTime);

    // Check if benchmarks are met
    const userHistoryPassed = results.userHistoryTime < 50;
    const systemKeywordPassed = results.systemKeywordTime < 100;
    const totalPassed = results.totalTime < 10000; // 10 seconds
    const aiPassed = results.aiTime >= 2000 && results.aiTime <= 5000; // 2-5 seconds

    results.passed = userHistoryPassed && systemKeywordPassed && totalPassed && aiPassed;

    results.details = `
Performance Test Results:
✅ User History Lookup: ${results.userHistoryTime}ms ${userHistoryPassed ? 'PASS' : 'FAIL'} (Target: <50ms)
✅ System Keywords Lookup: ${results.systemKeywordTime}ms ${systemKeywordPassed ? 'PASS' : 'FAIL'} (Target: <100ms)
✅ AI Categorization: ${results.aiTime}ms ${aiPassed ? 'PASS' : 'FAIL'} (Target: 2-5s)
✅ Total Processing: ${results.totalTime}ms ${totalPassed ? 'PASS' : 'FAIL'} (Target: <10s for 100 transactions)

Overall: ${results.passed ? '✅ ALL BENCHMARKS MET' : '❌ SOME BENCHMARKS FAILED'}
    `;

    console.log(results.details);

    return results;

  } catch (error) {
    console.error('❌ Performance test failed:', error);
    results.details = `Performance test failed: ${error}`;
    return results;
  }
}

// Export for use in other test files
export { verifyPerformanceBenchmarks };
