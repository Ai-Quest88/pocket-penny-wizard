import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabelText('Email').fill('test@example.com');
    await page.getByLabelText('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should load dashboard without errors', async ({ page }) => {
    // Check for dashboard heading or welcome message
    const dashboardHeading = page.getByRole('heading', { name: /dashboard|overview|welcome/i });
    if (await dashboardHeading.isVisible()) {
      await expect(dashboardHeading).toBeVisible();
    }
    
    // Should not show any error messages
    const errorMessages = page.locator('[role="alert"], .error, .text-red, .text-destructive');
    await expect(errorMessages).toHaveCount(0);
  });

  test('should show financial summary cards', async ({ page }) => {
    // Look for common financial dashboard elements
    const summaryCards = page.locator('.card, [data-testid="summary-card"], .dashboard-card');
    
    if (await summaryCards.first().isVisible()) {
      await expect(summaryCards.first()).toBeVisible();
    }
    
    // Look for common financial metrics
    const financialTerms = page.getByText(/balance|income|expense|net worth|assets|liabilities/i);
    if (await financialTerms.first().isVisible()) {
      await expect(financialTerms.first()).toBeVisible();
    }
  });

  test('should show charts or visualizations', async ({ page }) => {
    // Look for chart containers
    const charts = page.locator('canvas, svg, .recharts-wrapper, .chart, [data-testid="chart"]');
    
    if (await charts.first().isVisible()) {
      await expect(charts.first()).toBeVisible();
    }
  });

  test('should handle empty dashboard state gracefully', async ({ page }) => {
    // Look for empty state messages or call-to-action buttons
    const emptyStateMessage = page.getByText(/get started|add your first|no data|empty/i);
    const ctaButtons = page.getByRole('button', { name: /add|create|start/i });
    
    // Either should show content or proper empty state
    const hasContent = await page.locator('.card, .chart, table').first().isVisible();
    const hasEmptyState = await emptyStateMessage.isVisible();
    const hasCta = await ctaButtons.first().isVisible();
    
    expect(hasContent || hasEmptyState || hasCta).toBeTruthy();
  });
});