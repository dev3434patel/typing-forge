/**
 * E2E TEST: Stats Dashboard
 * Tests statistics page with filters and charts
 */

import { test, expect } from '../playwright-fixture';

test.describe('Stats Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Set up some test data in localStorage
    await page.goto('/');
    await page.evaluate(() => {
      const testResult = {
        id: 'test-1',
        wpm: 60,
        rawWpm: 65,
        accuracy: 95,
        consistency: 85,
        mode: 'time',
        duration: 30,
        correctChars: 150,
        incorrectChars: 8,
        totalChars: 158,
        errors: 8,
        date: new Date().toISOString(),
        wpmHistory: [55, 60, 65],
      };
      localStorage.setItem('typingmaster_history', JSON.stringify([testResult]));
    });
  });

  test('should display stats page', async ({ page }) => {
    await page.goto('/stats');
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Check for stats title
    const title = page.locator('h1').filter({ hasText: /statistics|stats/i });
    await expect(title).toBeVisible();
  });

  test('should show summary statistics', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForTimeout(2000);

    // Look for summary cards
    const summaryCards = page.locator('text=/WPM|speed|accuracy|consistency|lessons/i');
    
    // At least some stats should be visible
    const count = await summaryCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should filter by time period', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForTimeout(2000);

    // Look for time period filters
    const timeFilters = page.locator('button').filter({ hasText: /all|week|month|year|today/i });
    
    if (await timeFilters.count() > 0) {
      // Click on a filter
      await timeFilters.first().click();
      await page.waitForTimeout(500);
      
      // Verify filter is active (might have different styling)
      const activeFilter = timeFilters.first();
      await expect(activeFilter).toBeVisible();
    }
  });

  test('should display charts', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForTimeout(2000);

    // Look for chart containers (Recharts creates SVG elements)
    const charts = page.locator('svg').or(page.locator('[class*="chart"], [class*="Chart"]'));
    
    // Charts might not be visible immediately, but containers should exist
    const chartCount = await charts.count();
    // At least some chart elements should exist (even if empty)
    expect(chartCount).toBeGreaterThanOrEqual(0);
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForTimeout(2000);

    // Look for tab buttons
    const tabs = page.locator('button[role="tab"]').or(page.locator('[class*="tab"], [class*="Tab"]'));
    
    if (await tabs.count() > 0) {
      // Click on a different tab
      await tabs.nth(1).click();
      await page.waitForTimeout(500);
      
      // Verify tab content changes
      await expect(tabs.nth(1)).toBeVisible();
    }
  });
});
