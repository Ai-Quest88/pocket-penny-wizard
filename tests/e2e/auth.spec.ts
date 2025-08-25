import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page and allow signup', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Check login form elements
    await expect(page.getByRole('heading', { name: /welcome back|create account/i })).toBeVisible();
    await expect(page.getByLabelText('Email')).toBeVisible();
    await expect(page.getByLabelText('Password')).toBeVisible();
    
    // Check toggle between sign in and sign up
    const toggleButton = page.getByText(/don't have an account\?|already have an account\?/i);
    await expect(toggleButton).toBeVisible();
    
    // Check Google auth button
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
  });

  test('should handle signup flow', async ({ page }) => {
    await page.goto('/login');
    
    // Switch to signup mode
    await page.getByText(/don't have an account/i).click();
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    
    // Fill signup form
    const testEmail = `test${Date.now()}@example.com`;
    await page.getByLabelText('Email').fill(testEmail);
    await page.getByLabelText('Password').fill('password123');
    
    // Submit signup
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Should show confirmation message or redirect
    // This will vary based on email confirmation settings
  });

  test('should handle login with test credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form with the test account
    await page.getByLabelText('Email').fill('test@example.com');
    await page.getByLabelText('Password').fill('password123');
    
    // Submit login
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });
});