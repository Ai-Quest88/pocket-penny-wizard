import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('App loads and shows login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should show login form
    await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit-button"]')).toBeVisible();
  });

  test('Login works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Login
    await page.fill('[data-testid="login-email-input"]', 'test@example.com');
    await page.fill('[data-testid="login-password-input"]', 'password123');
    await page.click('[data-testid="login-submit-button"]');
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('text=Welcome back!').first()).toBeVisible();
  });
});
