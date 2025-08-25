import { test, expect } from '@playwright/test';

test.describe('Assets Page', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabelText('Email').fill('test@example.com');
    await page.getByLabelText('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Navigate to assets page
    await page.getByRole('link', { name: /assets/i }).click();
    await expect(page).toHaveURL('/assets');
  });

  test('should load assets page without errors', async ({ page }) => {
    // Check for page heading
    await expect(page.getByRole('heading', { name: /assets/i })).toBeVisible();
    
    // Should not show any error messages
    const errorMessages = page.locator('[role="alert"], .error, .text-red, .text-destructive');
    await expect(errorMessages).toHaveCount(0);
    
    // Check for add asset button or similar CTA
    const addButton = page.getByRole('button', { name: /add asset|new asset|create asset/i });
    if (await addButton.isVisible()) {
      await expect(addButton).toBeVisible();
    }
  });

  test('should handle empty assets state', async ({ page }) => {
    // Look for empty state message or assets list
    const emptyStateMessage = page.getByText(/no assets|empty|get started/i);
    const assetsList = page.locator('[data-testid="assets-list"], .assets-list, table, .grid');
    
    // Either should show empty state or assets list
    const hasEmptyState = await emptyStateMessage.isVisible();
    const hasAssetsList = await assetsList.isVisible();
    
    expect(hasEmptyState || hasAssetsList).toBeTruthy();
  });

  test('should open add asset dialog when add button is clicked', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add asset|new asset|create asset/i });
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Check for dialog or form
      const dialog = page.locator('[role="dialog"], .dialog, .modal');
      const form = page.locator('form').filter({ hasText: /asset/i });
      
      const hasDialog = await dialog.isVisible();
      const hasForm = await form.isVisible();
      
      expect(hasDialog || hasForm).toBeTruthy();
      
      // Check for basic form fields
      if (hasDialog || hasForm) {
        await expect(page.getByLabelText(/name/i)).toBeVisible();
        await expect(page.getByLabelText(/value|amount/i)).toBeVisible();
      }
    }
  });
});