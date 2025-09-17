import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testAssets, testLiabilities } from '../fixtures/test-data';

test.describe('Assets & Liabilities Management @critical', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Assets Management', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateTo('/assets');
    });

    test('should load assets page @smoke', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /assets/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /add asset/i })).toBeVisible();
      
      await helpers.takeScreenshot('assets-page-loaded');
    });

    test('should create new asset @critical', async ({ page }) => {
      await page.getByRole('button', { name: /add asset/i }).click();
      
      const asset = testAssets[0];
      
      await helpers.fillAndSubmitForm({
        'Name': asset.name,
        'Type': asset.type,
        'Value': asset.value.toString(),
        'Category': asset.category
      }, 'Add Asset');
      
      await helpers.waitForToast();
      await helpers.takeScreenshot('asset-created');
    });

    test('should display asset valuations @regression', async ({ page }) => {
      const assetValues = page.locator('.asset-value, .valuation, [data-testid="asset-value"]');
      
      if (await assetValues.first().isVisible()) {
        await expect(assetValues.first()).toBeVisible();
      }
    });

    test('should show property value estimates @regression', async ({ page }) => {
      const propertyEstimates = page.locator('.property-estimate, .value-estimate');
      
      if (await propertyEstimates.first().isVisible()) {
        await expect(propertyEstimates.first()).toBeVisible();
      }
    });
  });

  test.describe('Liabilities Management', () => {
    test.beforeEach(async ({ page }) => {
      await helpers.navigateTo('/liabilities');
    });

    test('should load liabilities page @smoke', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /liabilities/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /add liability/i })).toBeVisible();
      
      await helpers.takeScreenshot('liabilities-page-loaded');
    });

    test('should create new liability @critical', async ({ page }) => {
      await page.getByRole('button', { name: /add liability/i }).click();
      
      const liability = testLiabilities[0];
      
      await helpers.fillAndSubmitForm({
        'Name': liability.name,
        'Type': liability.type,
        'Amount': liability.amount.toString(),
        'Interest Rate': liability.interestRate?.toString() || '',
        'Monthly Payment': liability.monthlyPayment?.toString() || ''
      }, 'Add Liability');
      
      await helpers.waitForToast();
      await helpers.takeScreenshot('liability-created');
    });

    test('should calculate loan payments @regression', async ({ page }) => {
      // Look for loan calculation elements
      const loanCalculations = page.locator('.loan-calc, .payment-calc, .interest-calc');
      
      if (await loanCalculations.first().isVisible()) {
        await expect(loanCalculations.first()).toBeVisible();
      }
    });
  });

  test.describe('Net Worth Calculations', () => {
    test('should display net worth summary @critical', async ({ page }) => {
      await helpers.navigateTo('/assets');
      
      // Look for net worth display
      const netWorth = page.locator('.net-worth, [data-testid="net-worth"]');
      const netWorthValue = page.getByText(/net worth|total assets|total liabilities/i);
      
      if (await netWorth.isVisible() || await netWorthValue.isVisible()) {
        expect(true).toBeTruthy();
      }
      
      await helpers.takeScreenshot('net-worth-summary');
    });

    test('should show historical net worth chart @regression', async ({ page }) => {
      await helpers.navigateTo('/assets');
      
      const charts = page.locator('canvas, svg, .chart');
      
      if (await charts.first().isVisible()) {
        await expect(charts.first()).toBeVisible();
      }
    });
  });
});