import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/storage/user.json';

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('/login');
  
  // Fill in test credentials
  await page.getByLabelText('Email').fill('test@example.com');
  await page.getByLabelText('Password').fill('password123');
  
  // Submit login
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for redirect to dashboard
  await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  
  // Save signed-in state to storage
  await page.context().storageState({ path: authFile });
});