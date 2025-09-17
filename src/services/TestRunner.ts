import { spawn, ChildProcess } from 'child_process';

export interface TestExecutionUpdate {
  type: 'start' | 'progress' | 'complete' | 'error';
  testId?: string;
  testTitle?: string;
  status?: 'passed' | 'failed' | 'running' | 'skipped';
  duration?: number;
  error?: string;
  videoPath?: string;
  screenshotPath?: string;
  progress?: number;
  totalTests?: number;
  completedTests?: number;
}

export class TestRunner {
  private currentProcess: ChildProcess | null = null;
  private onUpdate: (update: TestExecutionUpdate) => void;

  constructor(onUpdate: (update: TestExecutionUpdate) => void) {
    this.onUpdate = onUpdate;
  }

  async runTests(category?: string): Promise<void> {
    if (this.currentProcess) {
      this.stopTests();
    }

    return new Promise((resolve, reject) => {
      const args = ['playwright', 'test'];
      
      // Add category filter if specified
      if (category) {
        args.push('--grep', `@${category}`);
      }

      // Add options for video and tracing
      args.push(
        '--reporter=json',
        '--video=on',
        '--trace=on',
        '--output-dir=test-results'
      );

      this.currentProcess = spawn('npx', args, {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let testOutput = '';
      let currentTestCount = 0;
      let totalTests = 0;

      this.onUpdate({
        type: 'start',
        progress: 0,
        totalTests: 0,
        completedTests: 0
      });

      this.currentProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        testOutput += output;
        
        // Parse test progress from output
        this.parseTestProgress(output, currentTestCount, totalTests);
      });

      this.currentProcess.stderr?.on('data', (data) => {
        console.error('Test error:', data.toString());
      });

      this.currentProcess.on('close', (code) => {
        if (code === 0) {
          this.parseTestResults(testOutput);
          this.onUpdate({
            type: 'complete',
            progress: 100
          });
          resolve();
        } else {
          this.onUpdate({
            type: 'error',
            error: `Test execution failed with code ${code}`
          });
          reject(new Error(`Test execution failed with code ${code}`));
        }
        this.currentProcess = null;
      });
    });
  }

  stopTests(): void {
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM');
      this.currentProcess = null;
      this.onUpdate({
        type: 'error',
        error: 'Tests stopped by user'
      });
    }
  }

  private parseTestProgress(output: string, currentTestCount: number, totalTests: number): void {
    // Parse test execution from Playwright output
    const testStartMatch = output.match(/Running (\d+) test/);
    if (testStartMatch) {
      totalTests = parseInt(testStartMatch[1]);
      this.onUpdate({
        type: 'progress',
        totalTests,
        completedTests: 0,
        progress: 0
      });
    }

    // Parse individual test updates
    const testLines = output.split('\n');
    testLines.forEach(line => {
      const passedMatch = line.match(/✓ (.+?) \((\d+)ms\)/);
      const failedMatch = line.match(/✗ (.+?) \((\d+)ms\)/);
      
      if (passedMatch) {
        currentTestCount++;
        this.onUpdate({
          type: 'progress',
          testTitle: passedMatch[1],
          status: 'passed',
          duration: parseInt(passedMatch[2]),
          completedTests: currentTestCount,
          totalTests,
          progress: Math.round((currentTestCount / totalTests) * 100)
        });
      } else if (failedMatch) {
        currentTestCount++;
        this.onUpdate({
          type: 'progress',
          testTitle: failedMatch[1],
          status: 'failed',
          duration: parseInt(failedMatch[2]),
          completedTests: currentTestCount,
          totalTests,
          progress: Math.round((currentTestCount / totalTests) * 100)
        });
      }
    });
  }

  private parseTestResults(output: string): void {
    try {
      // Parse final JSON results if available
      const jsonMatch = output.match(/\{.*"stats".*\}/s);
      if (jsonMatch) {
        const results = JSON.parse(jsonMatch[0]);
        // Process final results
        this.onUpdate({
          type: 'complete',
          progress: 100
        });
      }
    } catch (error) {
      console.error('Failed to parse test results:', error);
    }
  }
}

export default TestRunner;