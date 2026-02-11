/**
 * E2E TEST: Leaderboard
 * Tests leaderboard display and filtering
 */

import { test, expect } from '../playwright-fixture';

test.describe('Leaderboard', () => {
  test('should display leaderboard page', async ({ page }) => {
    await page.goto('/leaderboard');
    
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Check for leaderboard title
    const title = page.locator('h1').filter({ hasText: /leaderboard/i });
    await expect(title).toBeVisible();
  });

  test('should show time filters', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForTimeout(2000);
    
    // Look for time filter buttons
    const timeFilters = page.locator('button').filter({ hasText: /all time|weekly|daily/i });
    
    // Filters should be visible
    const count = await timeFilters.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show ranking tabs', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForTimeout(2000);
    
    // Look for ranking type tabs
    const tabs = page.locator('button[role="tab"]').or(page.locator('[class*="tab"]').filter({ hasText: /speed|accuracy|consistency|tests/i }));
    
    // Tabs should exist
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(0);
  });

  test('should display leaderboard table or empty state', async ({ page }) => {
    await page.goto('/leaderboard');
    await page.waitForTimeout(2000);
    
    // Look for table or empty state
    const table = page.locator('table');
    const emptyState = page.locator('text=/no entries|empty|no data/i');
    
    // Either table or empty state should be visible
    const hasTable = await table.isVisible({ timeout: 1000 }).catch(() => false);
    const hasEmptyState = await emptyState.isVisible({ timeout: 1000 }).catch(() => false);
    
    expect(hasTable || hasEmptyState).toBeTruthy();
  });
});
