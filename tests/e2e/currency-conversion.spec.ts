import { test, expect } from '@playwright/test';

test.describe('Currency Conversion System (Story 1.1)', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should display currency selector on dashboard', async ({ page }) => {
    // Check for currency selector
    const currencySelector = page.locator('button').filter({ hasText: /🇦🇺|AUD|USD|EUR/ });
    await expect(currencySelector).toBeVisible();
    
    // Should show current currency (AUD by default)
    await expect(currencySelector).toContainText('AUD');
  });

  test('should change currency and update all amounts', async ({ page }) => {
    // Get initial amounts in AUD
    const initialNetWorth = page.getByText(/Total Net Worth/).locator('..').getByText(/\$[\d,]+\.?\d*/);
    const initialAmount = await initialNetWorth.textContent();
    console.log('Initial amount:', initialAmount);
    
    // Click currency selector (use the first one in header)
    const currencySelector = page.locator('header button').filter({ hasText: /🇦🇺|AUD/ }).first();
    await currencySelector.click();
    
    // Wait for dropdown to appear and select USD
    await page.waitForSelector('[data-value="USD"], [role="option"]', { timeout: 5000 });
    
    // Look for USD option
    const usdOption = page.locator('[data-value="USD"]').or(page.locator('[role="option"]').filter({ hasText: /USD/ }));
    await expect(usdOption).toBeVisible();
    await usdOption.click();
    
    // Wait for currency change to take effect
    await page.waitForTimeout(2000);
    
    // Check that currency has changed to USD
    const updatedCurrencySelector = page.locator('button').filter({ hasText: /🇺🇸|USD/ });
    await expect(updatedCurrencySelector).toBeVisible();
    
    // Check that amounts have been converted
    const updatedNetWorth = page.getByText(/Total Net Worth/).locator('..').getByText(/\$[\d,]+\.?\d*/);
    const updatedAmount = await updatedNetWorth.textContent();
    console.log('Updated amount:', updatedAmount);
    
    // Amounts should be different (converted)
    expect(updatedAmount).not.toBe(initialAmount);
  });

  test('should display currency symbols correctly', async ({ page }) => {
    // Check for AUD symbol (check the first one)
    const audSymbol = page.getByText('A$').first();
    await expect(audSymbol).toBeVisible();
    
    // Change to USD (use header selector)
    const currencySelector = page.locator('header button').filter({ hasText: /🇦🇺|AUD/ }).first();
    await currencySelector.click();
    
    await page.waitForSelector('[data-value="USD"], [role="option"]', { timeout: 5000 });
    const usdOption = page.locator('[data-value="USD"]').or(page.locator('[role="option"]').filter({ hasText: /USD/ }));
    await usdOption.click();
    
    await page.waitForTimeout(2000);
    
    // Check for USD symbol
    const usdSymbol = page.getByText('$');
    await expect(usdSymbol).toBeVisible();
  });

  test('should maintain currency preference across page navigation', async ({ page }) => {
    // Change currency to USD (use header selector)
    const currencySelector = page.locator('header button').filter({ hasText: /🇦🇺|AUD/ }).first();
    await currencySelector.click();
    
    await page.waitForSelector('[data-value="USD"], [role="option"]', { timeout: 5000 });
    const usdOption = page.locator('[data-value="USD"]').or(page.locator('[role="option"]').filter({ hasText: /USD/ }));
    await usdOption.click();
    
    await page.waitForTimeout(2000);
    
    // Navigate to transactions page
    await page.getByRole('link', { name: /transactions/i }).click();
    await expect(page).toHaveURL('/transactions');
    
    // Check that currency is still USD
    const currencyOnTransactions = page.locator('button').filter({ hasText: /🇺🇸|USD/ });
    await expect(currencyOnTransactions).toBeVisible();
    
    // Navigate back to dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Check that currency is still USD
    const currencyOnDashboard = page.locator('button').filter({ hasText: /🇺🇸|USD/ });
    await expect(currencyOnDashboard).toBeVisible();
  });

  test('should handle exchange rate API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/exchange-rates/**', route => route.abort());
    await page.route('**/er-api.com/**', route => route.abort());
    
    // Try to change currency
    const currencySelector = page.locator('button').filter({ hasText: /🇦🇺|AUD/ });
    await currencySelector.click();
    
    await page.waitForSelector('[data-value="USD"], [role="option"]', { timeout: 5000 });
    const usdOption = page.locator('[data-value="USD"]').or(page.locator('[role="option"]').filter({ hasText: /USD/ }));
    await usdOption.click();
    
    await page.waitForTimeout(2000);
    
    // App should still function (fallback rates)
    await expect(page.getByText(/Total Net Worth/)).toBeVisible();
  });
});
