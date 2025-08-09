import { test, expect } from '@playwright/test';

// Ensure we start with defaults
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.removeItem('categoryGroups');
  });
});

test('Categories page shows default groups, buckets, and Transfers/Internal Transfer', async ({ page }) => {
  await page.goto('/categories');

  await expect(page.getByRole('heading', { name: 'Category Management' })).toBeVisible();

  // Core groups visible
  await expect(page.getByText('Income')).toBeVisible();
  await expect(page.getByText('Expenses')).toBeVisible();
  await expect(page.getByText('Transfers')).toBeVisible();

  // Sample buckets visible
  await expect(page.getByText('Primary Income')).toBeVisible();
  await expect(page.getByText('Housing')).toBeVisible();

  // Internal Transfer category present under Transfers
  await expect(page.getByText('Internal Transfer')).toBeVisible();
});

test('Reset Categories button restores defaults', async ({ page }) => {
  await page.goto('/categories');

  // Collapse/Expand controls should be present
  await expect(page.getByRole('button', { name: 'Reset Categories' })).toBeVisible();

  // Simulate a bad localStorage state and reload
  await page.evaluate(() => {
    localStorage.setItem('categoryGroups', JSON.stringify([]));
  });
  await page.reload();

  // Page should still show defaults thanks to strict fallback
  await expect(page.getByText('Income')).toBeVisible();

  // Now click Reset to make sure it recovers from any state
  await page.getByRole('button', { name: 'Reset Categories' }).click();
  await expect(page.getByText('Expenses')).toBeVisible();
});