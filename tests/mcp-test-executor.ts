// MCP Test Executor - TypeScript with proper typing
import { Page, expect } from '@playwright/test';
import { TestStep, TestResult, TestCase } from './types.js';

export class MCPTestExecutor {
  private page: Page;
  private testResults: TestResult[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  async executeTestCase(testCaseName: string, testCase: TestCase): Promise<boolean> {
    console.log(`\n🧪 Executing: ${testCase.name}`);
    console.log(`📝 Description: ${testCase.description}`);
    console.log(`📊 Steps: ${testCase.steps.length}`);

    try {
      // Clear all cookies and local storage to ensure fresh session
      await this.page.context().clearCookies();
      
      // Navigate to the app first, then clear storage
      await this.page.goto('http://localhost:8080');
      await this.page.waitForLoadState('networkidle');
      
      // Clear storage after navigation
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await this.page.waitForTimeout(500);
      
      for (let i = 0; i < testCase.steps.length; i++) {
        const step = testCase.steps[i];
        const stepNumber = i + 1;
        
        console.log(`\n📍 Step ${stepNumber}/${testCase.steps.length}: ${step.action}${step.selector ? ` ${step.selector}` : ''}${step.value ? ` = "${step.value}"` : ''}`);
        
        try {
          await this.executeStep(step);
          this.testResults.push({ testCase: testCaseName, step: stepNumber, status: 'pass' });
          console.log(`✅ Step ${stepNumber} passed`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.testResults.push({ testCase: testCaseName, step: stepNumber, status: 'fail', error: errorMessage });
          console.log(`❌ Step ${stepNumber} failed: ${errorMessage}`);
          
          // Take screenshot for debugging
          await this.takeScreenshot(`error-step-${stepNumber}`);
          return false;
        }
      }

      console.log(`\n🎉 Test case '${testCaseName}' completed successfully!`);
      return true;
    } catch (error) {
      console.error(`💥 Test case '${testCaseName}' failed:`, error);
      return false;
    }
  }

  private async executeStep(step: TestStep): Promise<void> {
    switch (step.action) {
      case 'navigate':
        if (step.url) {
          await this.page.goto(step.url);
          await this.page.waitForLoadState('networkidle');
        }
        break;
        
      case 'click':
        if (step.selector) {
          await this.page.locator(step.selector).click();
          await this.page.waitForTimeout(500);
        }
        break;
        
      case 'fill':
        if (step.selector && step.value !== undefined) {
          await this.page.locator(step.selector).fill(step.value);
          await this.page.waitForTimeout(200);
        }
        break;
        
      case 'select':
        if (step.selector && step.value !== undefined) {
          await this.page.locator(step.selector).selectOption(step.value);
          await this.page.waitForTimeout(200);
        }
        break;
        
      case 'wait':
        if (step.timeout) {
          await this.page.waitForTimeout(step.timeout);
        }
        break;
        
      case 'verify':
        if (step.selector) {
          const element = this.page.locator(step.selector);
          if (step.shouldBe === 'visible') {
            await element.waitFor({ state: 'visible', timeout: 5000 });
          } else if (step.shouldBe === 'hidden') {
            await element.waitFor({ state: 'hidden', timeout: 5000 });
          } else if (step.shouldBe === 'enabled') {
            await expect(element).toBeEnabled();
          } else if (step.shouldBe === 'disabled') {
            await expect(element).toBeDisabled();
          }
        }
        break;
        
      default:
        console.warn(`⚠️ Unknown action: ${step.action}`);
    }
  }

  private async takeScreenshot(name: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `./tmp/playwright-screenshots/${name}-${timestamp}.png`;
      await this.page.screenshot({ path: filename, fullPage: true });
      console.log(`📸 Screenshot saved: ${filename}`);
    } catch (error) {
      console.log(`📸 Screenshot failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getResults(): TestResult[] {
    return this.testResults;
  }

  getSummary(): { total: number; passed: number; failed: number } {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'pass').length;
    const failed = this.testResults.filter(r => r.status === 'fail').length;
    
    return { total, passed, failed };
  }
}