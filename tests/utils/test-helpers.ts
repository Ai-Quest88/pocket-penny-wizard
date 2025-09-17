import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for network requests to settle
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for toast message
   */
  async waitForToast(message?: string) {
    const toast = this.page.locator('[data-sonner-toast]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    
    if (message) {
      await expect(toast).toContainText(message);
    }
    
    return toast;
  }

  /**
   * Fill form and submit
   */
  async fillAndSubmitForm(formData: Record<string, string>, submitButtonText: string) {
    for (const [field, value] of Object.entries(formData)) {
      const input = this.page.getByLabel(new RegExp(field, 'i'));
      await input.fill(value);
    }
    
    await this.page.getByRole('button', { name: new RegExp(submitButtonText, 'i') }).click();
  }

  /**
   * Navigate and wait for page load
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.waitForNetworkIdle();
  }

  /**
   * Wait for table to load with data
   */
  async waitForTableData(selector = 'table tbody tr') {
    await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
    const rows = await this.page.locator(selector).count();
    expect(rows).toBeGreaterThan(0);
  }

  /**
   * Upload CSV file
   */
  async uploadCSV(filePath: string) {
    const fileChooser = this.page.waitForEvent('filechooser');
    await this.page.getByRole('button', { name: /upload|choose file/i }).click();
    const chooser = await fileChooser;
    await chooser.setFiles(filePath);
  }

  /**
   * Check accessibility issues
   */
  async checkAccessibility() {
    // This would integrate with @axe-core/playwright
    // await injectAxe(this.page);
    // const results = await checkA11y(this.page);
    // expect(results.violations).toHaveLength(0);
  }

  /**
   * Simulate slow network
   */
  async enableSlowNetwork() {
    await this.page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });
  }
}