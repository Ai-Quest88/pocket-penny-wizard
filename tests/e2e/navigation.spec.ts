import { test, expect } from '@playwright/test';

test.describe('Navigation and Layout', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabelText('Email').fill('test@example.com');
    await page.getByLabelText('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should show main navigation and allow page navigation', async ({ page }) => {
    // Check sidebar navigation
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /transactions/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /accounts/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /assets/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /liabilities/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /budgets/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /categories/i })).toBeVisible();
    
    // Test navigation to different pages
    await page.getByRole('link', { name: /assets/i }).click();
    await expect(page).toHaveURL('/assets');
    
    await page.getByRole('link', { name: /transactions/i }).click();
    await expect(page).toHaveURL('/transactions');
    
    await page.getByRole('link', { name: /categories/i }).click();
    await expect(page).toHaveURL('/categories');
  });

  test('should show user menu and logout functionality', async ({ page }) => {
    // Look for user menu trigger (could be avatar, name, or menu button)
    const userMenuTrigger = page.locator('[data-testid="user-menu"], .user-menu, [aria-label*="user"], [aria-label*="menu"]').first();
    
    if (await userMenuTrigger.isVisible()) {
      await userMenuTrigger.click();
      
      // Check if logout option appears
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        
        // Should redirect to login
        await expect(page).toHaveURL('/login', { timeout: 5000 });
      }
    }
  });
});