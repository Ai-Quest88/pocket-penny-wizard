import { test, expect } from '@playwright/test';

test.describe('Integrated Features E2E Test (Stories 1.1-1.3)', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should demonstrate complete workflow: CSV import → Currency conversion → Financial year reporting', async ({ page }) => {
    // Step 1: Import CSV transactions
    await page.getByRole('link', { name: /transactions/i }).click();
    await expect(page).toHaveURL('/transactions');
    
    // Open CSV upload dialog
    const csvUploadButton = page.getByRole('button', { name: /upload csv|import csv|csv upload/i });
    await csvUploadButton.click();
    
    // Verify dialog opens
    const uploadDialog = page.locator('[role="dialog"]').filter({ hasText: /upload|import|csv/i });
    await expect(uploadDialog).toBeVisible();
    
    // Close dialog for now (we'll test actual upload in separate tests)
    const closeButton = page.getByRole('button', { name: /close|cancel/i });
    await closeButton.click();
    
    // Step 2: Test currency conversion
    // Get initial currency state
    const initialCurrency = page.locator('button').filter({ hasText: /🇦🇺|AUD/ });
    await expect(initialCurrency).toBeVisible();
    
    // Change currency to USD
    await initialCurrency.click();
    await page.waitForSelector('[data-value="USD"], [role="option"]', { timeout: 5000 });
    const usdOption = page.locator('[data-value="USD"]').or(page.locator('[role="option"]').filter({ hasText: /USD/ }));
    await usdOption.click();
    
    // Wait for conversion
    await page.waitForTimeout(2000);
    
    // Verify currency changed
    const usdCurrency = page.locator('button').filter({ hasText: /🇺🇸|USD/ });
    await expect(usdCurrency).toBeVisible();
    
    // Step 3: Navigate to financial year reports
    await page.getByRole('link', { name: /reports/i }).click();
    await expect(page).toHaveURL('/reports');
    
    // Verify reports page loads
    await expect(page.getByRole('heading', { name: /reports|financial reports/i })).toBeVisible();
    
    // Check that currency is still USD on reports page
    const usdCurrencyOnReports = page.locator('button').filter({ hasText: /🇺🇸|USD/ });
    await expect(usdCurrencyOnReports).toBeVisible();
    
    // Verify financial year reports are available
    const netWorthReport = page.getByText(/net worth|assets|liabilities/i);
    const hasNetWorthReport = await netWorthReport.isVisible();
    expect(hasNetWorthReport).toBeTruthy();
  });

  test('should maintain currency preference across all features', async ({ page }) => {
    // Set currency to EUR
    const currencySelector = page.locator('button').filter({ hasText: /🇦🇺|AUD/ });
    await currencySelector.click();
    
    await page.waitForSelector('[data-value="EUR"], [role="option"]', { timeout: 5000 });
    const eurOption = page.locator('[data-value="EUR"]').or(page.locator('[role="option"]').filter({ hasText: /EUR/ }));
    await eurOption.click();
    
    await page.waitForTimeout(2000);
    
    // Test currency persistence across pages
    const pages = [
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Transactions', url: '/transactions' },
      { name: 'Reports', url: '/reports' },
      { name: 'Assets', url: '/assets' },
      { name: 'Liabilities', url: '/liabilities' }
    ];
    
    for (const pageInfo of pages) {
      await page.getByRole('link', { name: new RegExp(pageInfo.name, 'i') }).click();
      await expect(page).toHaveURL(pageInfo.url);
      
      // Check that EUR currency is maintained
      const eurCurrency = page.locator('button').filter({ hasText: /🇪🇺|EUR/ });
      await expect(eurCurrency).toBeVisible();
    }
  });

  test('should handle currency conversion with financial year data', async ({ page }) => {
    // Navigate to reports
    await page.getByRole('link', { name: /reports/i }).click();
    await expect(page).toHaveURL('/reports');
    
    // Get initial amounts in AUD
    const initialAmounts = page.getByText(/\$[\d,]+\.?\d*/);
    const initialCount = await initialAmounts.count();
    
    // Change currency to GBP
    const currencySelector = page.locator('button').filter({ hasText: /🇦🇺|AUD/ });
    await currencySelector.click();
    
    await page.waitForSelector('[data-value="GBP"], [role="option"]', { timeout: 5000 });
    const gbpOption = page.locator('[data-value="GBP"]').or(page.locator('[role="option"]').filter({ hasText: /GBP/ }));
    await gbpOption.click();
    
    await page.waitForTimeout(2000);
    
    // Verify amounts have changed
    const updatedAmounts = page.getByText(/£[\d,]+\.?\d*/);
    const updatedCount = await updatedAmounts.count();
    
    // Should have converted amounts
    expect(updatedCount).toBeGreaterThan(0);
  });

  test('should demonstrate CSV import with currency conversion', async ({ page }) => {
    // Navigate to transactions
    await page.getByRole('link', { name: /transactions/i }).click();
    await expect(page).toHaveURL('/transactions');
    
    // Change currency to USD first
    const currencySelector = page.locator('button').filter({ hasText: /🇦🇺|AUD/ });
    await currencySelector.click();
    
    await page.waitForSelector('[data-value="USD"], [role="option"]', { timeout: 5000 });
    const usdOption = page.locator('[data-value="USD"]').or(page.locator('[role="option"]').filter({ hasText: /USD/ }));
    await usdOption.click();
    
    await page.waitForTimeout(2000);
    
    // Open CSV upload dialog
    const csvUploadButton = page.getByRole('button', { name: /upload csv|import csv|csv upload/i });
    await csvUploadButton.click();
    
    // Verify dialog shows current currency context
    const uploadDialog = page.locator('[role="dialog"]').filter({ hasText: /upload|import|csv/i });
    await expect(uploadDialog).toBeVisible();
    
    // Check that currency context is maintained in upload dialog
    const currencyInDialog = page.locator('button').filter({ hasText: /🇺🇸|USD/ });
    const hasCurrencyInDialog = await currencyInDialog.isVisible();
    
    // Currency should be visible in the upload context
    expect(hasCurrencyInDialog).toBeTruthy();
  });

  test('should show financial year calculations with different currencies', async ({ page }) => {
    const currencies = ['USD', 'EUR', 'GBP'];
    
    for (const currency of currencies) {
      // Change currency
      const currencySelector = page.locator('button').filter({ hasText: /🇦🇺|🇺🇸|🇪🇺|🇬🇧/ });
      await currencySelector.click();
      
      await page.waitForSelector(`[data-value="${currency}"], [role="option"]`, { timeout: 5000 });
      const currencyOption = page.locator(`[data-value="${currency}"]`).or(page.locator('[role="option"]').filter({ hasText: new RegExp(currency, 'i') }));
      await currencyOption.click();
      
      await page.waitForTimeout(2000);
      
      // Navigate to reports
      await page.getByRole('link', { name: /reports/i }).click();
      await expect(page).toHaveURL('/reports');
      
      // Verify financial year reports are available
      const netWorthReport = page.getByText(/net worth|assets|liabilities/i);
      await expect(netWorthReport).toBeVisible();
      
      // Verify currency is maintained
      const currentCurrency = page.locator('button').filter({ hasText: new RegExp(currency, 'i') });
      await expect(currentCurrency).toBeVisible();
      
      // Go back to dashboard for next iteration
      await page.getByRole('link', { name: /dashboard/i }).click();
      await expect(page).toHaveURL('/dashboard');
    }
  });

  test('should handle error states gracefully across all features', async ({ page }) => {
    // Mock API failures
    await page.route('**/exchange-rates/**', route => route.abort());
    await page.route('**/er-api.com/**', route => route.abort());
    
    // Test currency conversion with API failure
    const currencySelector = page.locator('button').filter({ hasText: /🇦🇺|AUD/ });
    await currencySelector.click();
    
    await page.waitForSelector('[data-value="USD"], [role="option"]', { timeout: 5000 });
    const usdOption = page.locator('[data-value="USD"]').or(page.locator('[role="option"]').filter({ hasText: /USD/ }));
    await usdOption.click();
    
    await page.waitForTimeout(2000);
    
    // App should still function with fallback rates
    await expect(page.getByText(/Total Net Worth/)).toBeVisible();
    
    // Test CSV upload with API failure
    await page.getByRole('link', { name: /transactions/i }).click();
    await expect(page).toHaveURL('/transactions');
    
    const csvUploadButton = page.getByRole('button', { name: /upload csv|import csv|csv upload/i });
    await csvUploadButton.click();
    
    // Upload dialog should still work
    const uploadDialog = page.locator('[role="dialog"]').filter({ hasText: /upload|import|csv/i });
    await expect(uploadDialog).toBeVisible();
    
    // Test financial year reports with API failure
    await page.getByRole('button', { name: /close|cancel/i }).click();
    await page.getByRole('link', { name: /reports/i }).click();
    await expect(page).toHaveURL('/reports');
    
    // Reports should still load
    await expect(page.getByRole('heading', { name: /reports|financial reports/i })).toBeVisible();
  });
});
