export interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  output?: string;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  story: string;
  tests: TestResult[];
  status: 'pending' | 'running' | 'passed' | 'failed' | 'partial';
}

export class RealE2ETestRunner {
  private isRunning = false;

  async runTestSuite(suiteId: string): Promise<TestSuite> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    this.isRunning = true;

    try {
      // Call backend API to run actual Playwright tests
      const response = await fetch('/api/e2e-tests/run-suite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suiteId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to run test suite: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } finally {
      this.isRunning = false;
    }
  }

  async runAllTests(): Promise<TestSuite[]> {
    const response = await fetch('/api/e2e-tests/run-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to run all tests: ${response.statusText}`);
    }

    const results = await response.json();
    return results;
  }

  stopTests(): void {
    // Call backend API to stop tests
    fetch('/api/e2e-tests/stop', {
      method: 'POST',
    }).catch(console.error);
    
    this.isRunning = false;
  }

  isTestRunning(): boolean {
    return this.isRunning;
  }
}

export const realE2ETestRunner = new RealE2ETestRunner();
