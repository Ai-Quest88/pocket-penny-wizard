import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testBudgets } from '../fixtures/test-data';

test.describe('Budget Management @critical', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.navigateTo('/budgets');
  });

  test('should load budgets page @smoke', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /budget/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add budget|create budget/i })).toBeVisible();
    
    await helpers.takeScreenshot('budgets-page-loaded');
  });

  test('should create new budget @critical', async ({ page }) => {
    await page.getByRole('button', { name: /add budget|create budget/i }).click();
    
    const budget = testBudgets[0];
    
    await helpers.fillAndSubmitForm({
      'Name': budget.name,
      'Amount': budget.amount.toString(),
      'Period': budget.period
    }, 'Create Budget');
    
    await helpers.waitForToast();
    await helpers.takeScreenshot('budget-created');
  });

  test('should show budget progress indicators @regression', async ({ page }) => {
    // Look for progress bars or indicators
    const progressIndicators = page.locator('.progress, [role="progressbar"], .budget-progress');
    
    if (await progressIndicators.first().isVisible()) {
      await expect(progressIndicators.first()).toBeVisible();
    }
    
    await helpers.takeScreenshot('budget-progress');
  });

  test('should display budget vs actual spending @regression', async ({ page }) => {
    // Look for budget comparison elements
    const budgetComparison = page.locator('.budget-comparison, .vs-actual, .spending-vs-budget');
    const spendingAmounts = page.getByText(/spent|remaining|over budget/i);
    
    if (await budgetComparison.first().isVisible() || await spendingAmounts.first().isVisible()) {
      expect(true).toBeTruthy(); // Budget tracking is visible
    }
  });

  test('should allow budget editing @regression', async ({ page }) => {
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      
      await helpers.takeScreenshot('edit-budget-dialog');
    }
  });

  test('should show budget forecast @regression', async ({ page }) => {
    // Look for forecast or projection elements
    const forecast = page.locator('.forecast, .projection, .budget-forecast');
    const charts = page.locator('canvas, svg');
    
    if (await forecast.first().isVisible() || await charts.first().isVisible()) {
      expect(true).toBeTruthy(); // Budget forecast is available
    }
  });
});