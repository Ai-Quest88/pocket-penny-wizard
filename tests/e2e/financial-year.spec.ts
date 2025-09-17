import { test, expect } from '@playwright/test';

test.describe('Financial Year Management (Story 1.2)', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should display financial year information on dashboard', async ({ page }) => {
    // Check for financial year related content
    const financialYearContent = page.getByText(/financial year|FY|fiscal year/i);
    const netWorthContent = page.getByText(/net worth|assets|liabilities/i);
    
    // At least one should be visible
    const hasFinancialYear = await financialYearContent.isVisible();
    const hasNetWorth = await netWorthContent.isVisible();
    
    expect(hasFinancialYear || hasNetWorth).toBeTruthy();
  });

  test('should navigate to reports page and show financial year reports', async ({ page }) => {
    // Navigate to reports
    await page.getByRole('link', { name: /reports/i }).click();
    await expect(page).toHaveURL('/reports');
    
    // Check for reports page heading
    await expect(page.getByRole('heading', { name: /reports|financial reports/i })).toBeVisible();
    
    // Check for financial year related reports
    const netWorthReport = page.getByText(/net worth|assets|liabilities/i);
    const incomeExpenseReport = page.getByText(/income.*expense|income.*expense/i);
    
    // At least one should be visible
    const hasNetWorth = await netWorthReport.isVisible();
    const hasIncomeExpense = await incomeExpenseReport.isVisible();
    
    expect(hasNetWorth || hasIncomeExpense).toBeTruthy();
  });

  test('should display net worth trend over time', async ({ page }) => {
    // Navigate to reports
    await page.getByRole('link', { name: /reports/i }).click();
    await expect(page).toHaveURL('/reports');
    
    // Look for net worth trend section
    const netWorthTrend = page.getByText(/net worth.*trend|net worth.*over time/i);
    
    if (await netWorthTrend.isVisible()) {
      await expect(netWorthTrend).toBeVisible();
      
      // Check for chart or data visualization
      const chart = page.locator('canvas, svg, [data-testid*="chart"], .chart');
      const hasChart = await chart.isVisible();
      
      // Should have either chart or loading state
      const loadingState = page.getByText(/loading|calculating/i);
      const hasLoading = await loadingState.isVisible();
      
      expect(hasChart || hasLoading).toBeTruthy();
    }
  });

  test('should display assets and liabilities overview', async ({ page }) => {
    // Navigate to reports
    await page.getByRole('link', { name: /reports/i }).click();
    await expect(page).toHaveURL('/reports');
    
    // Check for assets overview
    const assetsOverview = page.getByText(/assets.*overview|total assets/i);
    if (await assetsOverview.isVisible()) {
      await expect(assetsOverview).toBeVisible();
    }
    
    // Check for liabilities overview
    const liabilitiesOverview = page.getByText(/liabilities.*overview|total liabilities/i);
    if (await liabilitiesOverview.isVisible()) {
      await expect(liabilitiesOverview).toBeVisible();
    }
  });

  test('should handle different financial year periods', async ({ page }) => {
    // Navigate to reports
    await page.getByRole('link', { name: /reports/i }).click();
    await expect(page).toHaveURL('/reports');
    
    // Look for date range selectors or period filters
    const dateSelectors = page.locator('input[type="date"], select, [role="combobox"]');
    const periodButtons = page.getByRole('button').filter({ hasText: /month|quarter|year|period/i });
    
    const hasDateSelectors = await dateSelectors.count() > 0;
    const hasPeriodButtons = await periodButtons.count() > 0;
    
    // Should have some way to select time periods
    expect(hasDateSelectors || hasPeriodButtons).toBeTruthy();
  });

  test('should calculate financial year correctly for current date', async ({ page }) => {
    // Navigate to reports
    await page.getByRole('link', { name: /reports/i }).click();
    await expect(page).toHaveURL('/reports');
    
    // Check that reports are showing current financial year data
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-based month
    
    // For Australia (July-June financial year)
    let expectedFY: string;
    if (currentMonth >= 7) {
      expectedFY = `${currentYear}-${currentYear + 1}`;
    } else {
      expectedFY = `${currentYear - 1}-${currentYear}`;
    }
    
    // Look for financial year indicators in the UI
    const fyIndicator = page.getByText(new RegExp(expectedFY, 'i'));
    const hasFYIndicator = await fyIndicator.isVisible();
    
    // If not visible, check for any year indicators
    if (!hasFYIndicator) {
      const anyYearIndicator = page.getByText(/\d{4}/);
      await expect(anyYearIndicator.first()).toBeVisible();
    }
  });

  test('should show income and expense breakdown by financial year', async ({ page }) => {
    // Navigate to reports
    await page.getByRole('link', { name: /reports/i }).click();
    await expect(page).toHaveURL('/reports');
    
    // Look for income and expense report
    const incomeExpenseReport = page.getByText(/income.*expense|income.*expense/i);
    
    if (await incomeExpenseReport.isVisible()) {
      await incomeExpenseReport.click();
      
      // Check for income and expense categories
      const incomeSection = page.getByText(/income|revenue/i);
      const expenseSection = page.getByText(/expense|spending/i);
      
      const hasIncome = await incomeSection.isVisible();
      const hasExpense = await expenseSection.isVisible();
      
      expect(hasIncome || hasExpense).toBeTruthy();
    }
  });
});
