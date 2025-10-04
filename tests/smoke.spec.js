import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('App loads and shows login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for the login form to be visible
    await page.waitForSelector('[data-testid="login-email-input"]', { timeout: 10000 });
    
    // Should show login form
    await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit-button"]')).toBeVisible();
  });

  test('Login works with test user', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for the login form to be visible
    await page.waitForSelector('[data-testid="login-email-input"]', { timeout: 10000 });
    
    // Fill in test credentials
    await page.fill('[data-testid="login-email-input"]', 'test@example.com');
    await page.fill('[data-testid="login-password-input"]', 'password123');
    
    // Submit login
    await page.click('[data-testid="login-submit-button"]');
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Should show welcome message
    await expect(page.locator('text=Welcome back!').first()).toBeVisible();
  });

  test('App navigation works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that we can navigate to login page explicitly
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Wait for the login form to be visible
    await page.waitForSelector('[data-testid="login-email-input"]', { timeout: 10000 });
    
    // Should show login form
    await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible();
  });
});
