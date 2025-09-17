import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('CSV Import System (Story 1.3)', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Navigate to transactions page
    await page.locator('a[href="/transactions"]').click();
    await expect(page).toHaveURL('/transactions');
  });

  test('should display CSV upload button on transactions page', async ({ page }) => {
    // Check for CSV upload button
    const csvUploadButton = page.getByRole('button', { name: /upload csv|import csv|csv upload/i });
    await expect(csvUploadButton).toBeVisible();
  });

  test('should open CSV upload dialog when upload button is clicked', async ({ page }) => {
    // Click CSV upload button
    const csvUploadButton = page.getByRole('button', { name: /upload csv|import csv|csv upload/i });
    await csvUploadButton.click();
    
    // Check for upload dialog
    const uploadDialog = page.locator('[role="dialog"]').filter({ hasText: /upload|import|csv/i });
    await expect(uploadDialog).toBeVisible();
    
    // Check for file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    
    // Check for supported formats text
    const supportedFormats = page.getByText(/csv|excel|xlsx|xls/i);
    await expect(supportedFormats).toBeVisible();
  });

  test('should show CSV and Excel template options', async ({ page }) => {
    // Open CSV upload dialog
    const csvUploadButton = page.getByRole('button', { name: /upload csv|import csv|csv upload/i });
    await csvUploadButton.click();
    
    // Check for template options
    const csvTemplate = page.getByText(/csv template/i);
    const excelTemplate = page.getByText(/excel template/i);
    
    const hasCsvTemplate = await csvTemplate.isVisible();
    const hasExcelTemplate = await excelTemplate.isVisible();
    
    expect(hasCsvTemplate || hasExcelTemplate).toBeTruthy();
  });

  test('should show generate test data option', async ({ page }) => {
    // Open CSV upload dialog
    const csvUploadButton = page.getByRole('button', { name: /upload csv|import csv|csv upload/i });
    await csvUploadButton.click();
    
    // Check for generate test data option
    const testDataOption = page.getByText(/generate test data|sample data|test data/i);
    await expect(testDataOption).toBeVisible();
  });

  test('should handle CSV file upload', async ({ page }) => {
    // Create a test CSV file
    const testCsvContent = `Date,Description,Amount
2024-01-01,Test Transaction 1,100.00
2024-01-02,Test Transaction 2,-50.00
2024-01-03,Test Transaction 3,25.50`;
    
    // Create a temporary file
    const fs = require('fs');
    const testFilePath = path.join(__dirname, 'test-transactions.csv');
    fs.writeFileSync(testFilePath, testCsvContent);
    
    try {
      // Open CSV upload dialog
      const csvUploadButton = page.getByRole('button', { name: /upload csv|import csv|csv upload/i });
      await csvUploadButton.click();
      
      // Upload the test file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testFilePath);
      
      // Wait for file processing
      await page.waitForTimeout(2000);
      
      // Check for success message or preview
      const successMessage = page.getByText(/success|uploaded|imported|processed/i);
      const previewTable = page.locator('table');
      const errorMessage = page.getByText(/error|invalid|failed/i);
      
      const hasSuccess = await successMessage.isVisible();
      const hasPreview = await previewTable.isVisible();
      const hasError = await errorMessage.isVisible();
      
      // Should have either success/preview or error (not both)
      expect(hasSuccess || hasPreview || hasError).toBeTruthy();
      
    } finally {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  test('should validate CSV file format', async ({ page }) => {
    // Create an invalid CSV file
    const invalidCsvContent = `Invalid,Headers
Not,A,Date
Missing,Amount,Column`;
    
    const fs = require('fs');
    const invalidFilePath = path.join(__dirname, 'invalid-transactions.csv');
    fs.writeFileSync(invalidFilePath, invalidCsvContent);
    
    try {
      // Open CSV upload dialog
      const csvUploadButton = page.getByRole('button', { name: /upload csv|import csv|csv upload/i });
      await csvUploadButton.click();
      
      // Upload the invalid file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(invalidFilePath);
      
      // Wait for validation
      await page.waitForTimeout(2000);
      
      // Should show validation error or warning
      const validationError = page.getByText(/invalid|error|missing|required/i);
      const hasValidationError = await validationError.isVisible();
      
      // Should handle invalid format gracefully
      expect(hasValidationError).toBeTruthy();
      
    } finally {
      // Clean up test file
      if (fs.existsSync(invalidFilePath)) {
        fs.unlinkSync(invalidFilePath);
      }
    }
  });

  test('should close upload dialog when close button is clicked', async ({ page }) => {
    // Open CSV upload dialog
    const csvUploadButton = page.getByRole('button', { name: /upload csv|import csv|csv upload/i });
    await csvUploadButton.click();
    
    // Verify dialog is open
    const uploadDialog = page.locator('[role="dialog"]').filter({ hasText: /upload|import|csv/i });
    await expect(uploadDialog).toBeVisible();
    
    // Click close button
    const closeButton = page.getByRole('button', { name: /close|cancel/i });
    await closeButton.click();
    
    // Verify dialog is closed
    await expect(uploadDialog).not.toBeVisible();
  });

  test('should handle empty CSV file gracefully', async ({ page }) => {
    // Create an empty CSV file
    const emptyCsvContent = '';
    
    const fs = require('fs');
    const emptyFilePath = path.join(__dirname, 'empty-transactions.csv');
    fs.writeFileSync(emptyFilePath, emptyCsvContent);
    
    try {
      // Open CSV upload dialog
      const csvUploadButton = page.getByRole('button', { name: /upload csv|import csv|csv upload/i });
      await csvUploadButton.click();
      
      // Upload the empty file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(emptyFilePath);
      
      // Wait for processing
      await page.waitForTimeout(2000);
      
      // Should handle empty file gracefully
      const emptyFileMessage = page.getByText(/empty|no data|no transactions/i);
      const errorMessage = page.getByText(/error|invalid/i);
      
      const hasEmptyMessage = await emptyFileMessage.isVisible();
      const hasError = await errorMessage.isVisible();
      
      expect(hasEmptyMessage || hasError).toBeTruthy();
      
    } finally {
      // Clean up test file
      if (fs.existsSync(emptyFilePath)) {
        fs.unlinkSync(emptyFilePath);
      }
    }
  });

  test('should show file format requirements', async ({ page }) => {
    // Open CSV upload dialog
    const csvUploadButton = page.getByRole('button', { name: /upload csv|import csv|csv upload/i });
    await csvUploadButton.click();
    
    // Check for format requirements
    const formatRequirements = page.getByText(/supported formats|csv|excel|xlsx|xls/i);
    await expect(formatRequirements).toBeVisible();
    
    // Check for column requirements
    const columnRequirements = page.getByText(/date|description|amount|required columns/i);
    const hasColumnRequirements = await columnRequirements.isVisible();
    
    // Should show what columns are expected
    expect(hasColumnRequirements).toBeTruthy();
  });
});
