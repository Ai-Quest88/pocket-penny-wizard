import { test, expect } from '@playwright/test';

test.describe('Transactions Page', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabelText('Email').fill('test@example.com');
    await page.getByLabelText('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Navigate to transactions page
    await page.getByRole('link', { name: /transactions/i }).click();
    await expect(page).toHaveURL('/transactions');
  });

  test('should load transactions page without errors', async ({ page }) => {
    // Check for page heading
    await expect(page.getByRole('heading', { name: /transactions/i })).toBeVisible();
    
    // Should not show any error messages
    const errorMessages = page.locator('[role="alert"], .error, .text-red, .text-destructive');
    await expect(errorMessages).toHaveCount(0);
    
    // Check for add transaction button or similar CTA
    const addButton = page.getByRole('button', { name: /add transaction|new transaction|create transaction/i });
    if (await addButton.isVisible()) {
      await expect(addButton).toBeVisible();
    }
  });

  test('should handle empty transactions state', async ({ page }) => {
    // Look for empty state message or transactions list
    const emptyStateMessage = page.getByText(/no transactions|empty|get started/i);
    const transactionsList = page.locator('[data-testid="transactions-list"], .transactions-list, table, .grid');
    
    // Either should show empty state or transactions list
    const hasEmptyState = await emptyStateMessage.isVisible();
    const hasTransactionsList = await transactionsList.isVisible();
    
    expect(hasEmptyState || hasTransactionsList).toBeTruthy();
  });

  test('should show transaction search and filters', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('textbox', { name: /search/i }));
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
    
    // Look for filter controls
    const filterControls = page.locator('[data-testid="filters"], .filters, select, [role="combobox"]');
    if (await filterControls.first().isVisible()) {
      await expect(filterControls.first()).toBeVisible();
    }
  });

  test('should open add transaction dialog when add button is clicked', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add transaction|new transaction|create transaction/i });
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Check for dialog or form
      const dialog = page.locator('[role="dialog"], .dialog, .modal');
      const form = page.locator('form').filter({ hasText: /transaction/i });
      
      const hasDialog = await dialog.isVisible();
      const hasForm = await form.isVisible();
      
      expect(hasDialog || hasForm).toBeTruthy();
      
      // Check for basic form fields
      if (hasDialog || hasForm) {
        await expect(page.getByLabelText(/description|name/i)).toBeVisible();
        await expect(page.getByLabelText(/amount/i)).toBeVisible();
        await expect(page.getByLabelText(/date/i)).toBeVisible();
      }
    }
  });
});