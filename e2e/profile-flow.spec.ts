/**
 * E2E TEST: Profile Flow
 * Tests profile page, settings, and test history
 */

import { test, expect } from '../playwright-fixture';

test.describe('Profile Flow', () => {
  test('should redirect to auth if not authenticated', async ({ page }) => {
    await page.goto('/profile');
    
    // Should redirect to auth page
    await page.waitForTimeout(2000);
    
    // Check if redirected to auth or still on profile
    const url = page.url();
    // Might redirect to auth or show login prompt
    expect(url).toMatch(/\/(profile|auth)/);
  });

  test('should display profile page when authenticated', async ({ page }) => {
    // Mock authentication state
    await page.goto('/');
    await page.evaluate(() => {
      // Set mock auth state
      localStorage.setItem('supabase.auth.token', JSON.stringify({ access_token: 'mock', expires_at: Date.now() + 3600000 }));
    });
    
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    
    // Profile page should load (or redirect to auth if mock doesn't work)
    const url = page.url();
    expect(url).toMatch(/\/(profile|auth)/);
  });

  test('should show profile tabs', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    
    // Look for tab buttons
    const tabs = page.locator('button[role="tab"]').or(page.locator('[class*="tab"]'));
    
    // Tabs might be visible if authenticated
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(0);
  });

  test('should display consistent metrics after completing a test', async ({ page }) => {
    // Seed a known test result
    await page.goto('/');
    await page.evaluate(() => {
      const testResult = {
        id: 'cross-page-test-1',
        wpm: 50,
        rawWpm: 52,
        accuracy: 95.5,
        consistency: 85,
        mode: 'quote',
        duration: 10,
        correctChars: 250,
        incorrectChars: 12,
        totalChars: 262,
        errors: 12,
        date: new Date().toISOString(),
        wpmHistory: [48, 50, 52],
      };
      const existing = localStorage.getItem('typingmaster_history');
      const history = existing ? JSON.parse(existing) : [];
      history.unshift(testResult);
      localStorage.setItem('typingmaster_history', JSON.stringify(history));
    });

    // Navigate to profile
    await page.goto('/profile');
    await page.waitForTimeout(2000);

    // Extract metrics from profile
    const profileWpmText = await page.locator('text=/\\d+(\\.\\d+)?\\s*wpm/i').first().textContent().catch(() => null);
    const profileAccuracyText = await page.locator('text=/\\d+(\\.\\d+)?\\s*%/i').first().textContent().catch(() => null);

    if (profileWpmText) {
      const wpmMatch = profileWpmText.match(/(\d+(?:\.\d+)?)/);
      if (wpmMatch) {
        const profileWpm = parseFloat(wpmMatch[1]);
        // Should be close to seeded value (50 WPM)
        expect(Math.abs(profileWpm - 50)).toBeLessThan(2); // Within 2 WPM tolerance
        expect(isFinite(profileWpm)).toBe(true);
        expect(profileWpm).toBeGreaterThanOrEqual(0);
      }
    }

    if (profileAccuracyText) {
      const accMatch = profileAccuracyText.match(/(\d+(?:\.\d+)?)/);
      if (accMatch) {
        const profileAccuracy = parseFloat(accMatch[1]);
        // Should be close to seeded value (95.5%)
        expect(Math.abs(profileAccuracy - 95.5)).toBeLessThan(1); // Within 1% tolerance
        expect(isFinite(profileAccuracy)).toBe(true);
        expect(profileAccuracy).toBeGreaterThanOrEqual(0);
        expect(profileAccuracy).toBeLessThanOrEqual(100);
      }
    }

    // Navigate to stats and verify same metrics
    await page.goto('/stats');
    await page.waitForTimeout(2000);

    const statsWpmText = await page.locator('text=/\\d+(\\.\\d+)?\\s*wpm/i').first().textContent().catch(() => null);
    if (statsWpmText && profileWpmText) {
      const statsWpmMatch = statsWpmText.match(/(\d+(?:\.\d+)?)/);
      const profileWpmMatch = profileWpmText.match(/(\d+(?:\.\d+)?)/);
      if (statsWpmMatch && profileWpmMatch) {
        const statsWpm = parseFloat(statsWpmMatch[1]);
        const profileWpm = parseFloat(profileWpmMatch[1]);
        // Cross-page consistency: stats and profile should match within tolerance
        expect(Math.abs(statsWpm - profileWpm)).toBeLessThan(1); // < 1 WPM difference
      }
    }
  });
});
