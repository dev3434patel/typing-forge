/**
 * E2E TEST: Live vs Final Accuracy Discrepancy
 * Reproduces and measures discrepancy between live HUD accuracy during typing
 * and final results accuracy after test completion.
 */

import { test, expect } from '../playwright-fixture';

// Live HUD: stat box with "accuracy" label - first span is the numeric value
function liveAccuracyLocator(page: import('@playwright/test').Page) {
  return page.locator('.flex.flex-col.items-center').filter({ hasText: 'accuracy' }).locator('span.font-mono').first();
}
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080';

test.describe('Live vs Final Accuracy Discrepancy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  test('run 1: error-heavy typing - capture live vs final accuracy', async ({ page }, testInfo) => {
    // 1. Ensure time mode and 30s duration
    const timeModeBtn = page.locator('button').filter({ hasText: /^time$/i }).first();
    if (await timeModeBtn.isVisible()) {
      await timeModeBtn.click();
      await page.waitForTimeout(300);
    }
    const duration30Btn = page.locator('button').filter({ hasText: /^30$/ }).first();
    if (await duration30Btn.isVisible()) {
      await duration30Btn.click();
      await page.waitForTimeout(300);
    }

    // 2. Reveal paragraph (Enter) and focus input
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // 3. Focus the typing area / input
    const typingInput = page.locator('input[type="text"]').first();
    await typingInput.click();
    await page.waitForTimeout(200);

    // 4. Get target text from visible paragraph
    const targetEl = page.locator('.font-mono.text-xl, .font-mono.text-2xl').first();
    const targetText = (await targetEl.textContent()) || '';
    const targetChars = targetText.replace(/\s+/g, ' ').trim().split('');
    if (targetChars.length < 20) {
      testInfo.annotations.push({ type: 'skip', description: 'Target text too short' });
      return;
    }

    // 5. Type ERROR-HEAVY: mostly wrong chars (mix ~80% wrong, ~20% correct)
    const wrongChars = 'xxxxxxxxxxxxxxxxxxxx'; // deliberate wrong chars
    const liveAccuracySamples: number[] = [];
    const typeForSeconds = 12; // Type for ~12 seconds
    const charsPerSecond = 3; // ~3 chars/sec = very slow
    const totalCharsToType = Math.min(typeForSeconds * charsPerSecond, targetChars.length, 50);
    const sampleInterval = 4; // Sample live accuracy every 4 seconds

    for (let i = 0; i < totalCharsToType; i++) {
      const targetChar = targetChars[i];
      const typeWrong = Math.random() < 0.8; // 80% wrong
      const charToType = typeWrong && targetChar !== ' ' ? 'x' : targetChar;
      await typingInput.type(charToType, { delay: 1000 / charsPerSecond });

      // Sample live accuracy at intervals
      if (i > 0 && i % (sampleInterval * charsPerSecond) === 0) {
        const accEl = liveAccuracyLocator(page);
        if (await accEl.isVisible()) {
          const text = await accEl.textContent();
          const match = text?.match(/(\d+(?:\.\d+)?)/);
          if (match) liveAccuracySamples.push(parseFloat(match[1]));
        }
      }
    }

    // One more sample before timer ends
    await page.waitForTimeout(500);
    const lastAccEl = liveAccuracyLocator(page);
    if (await lastAccEl.isVisible()) {
      const text = await lastAccEl.textContent();
      const match = text?.match(/(\d+(?:\.\d+)?)/);
      if (match) liveAccuracySamples.push(parseFloat(match[1]));
    }

    // 6. Wait for test to end (30s total - we typed ~12s, wait remaining)
    await page.waitForTimeout(20000);

    // 7. Capture final results
    const finalAccEl = page.locator('text=/\\d+(\\.\\d+)?\\s*%/').filter({ hasText: /^\d+(\.\d+)?\s*%$/ }).first();
    const resultsAccEl = page.locator('.stat-card, [class*="StatCard"]').filter({ hasText: /accuracy|%/i }).first();
    const accuracyLabel = page.locator('span, div').filter({ hasText: /^accuracy$/i }).first();
    let finalAccuracy: number | null = null;

    // Try multiple selectors for final accuracy
    const candidates = [
      page.locator('div').filter({ hasText: /^\d+(\.\d+)?\s*%$/ }).first(),
      page.locator('[class*="text-3xl"], [class*="text-4xl"]').filter({ hasText: /\d+\.?\d*%/ }).first(),
    ];
    for (const loc of candidates) {
      if (await loc.isVisible({ timeout: 2000 }).catch(() => false)) {
        const t = await loc.textContent();
        const m = t?.match(/(\d+(?:\.\d+)?)/);
        if (m) {
          finalAccuracy = parseFloat(m[1]);
          break;
        }
      }
    }

    // Fallback: get any number followed by %
    const anyPercent = await page.locator('text=/\\d+(\\.\\d+)?%?/').allTextContents();
    for (const s of anyPercent) {
      const m = s.match(/(\d+(?:\.\d+)?)\s*%?/);
      if (m) {
        const v = parseFloat(m[1]);
        if (v >= 0 && v <= 100 && !finalAccuracy) finalAccuracy = v;
      }
    }

    const liveAccuracy = liveAccuracySamples.length > 0
      ? liveAccuracySamples[liveAccuracySamples.length - 1]
      : null;
    const discrepancy = (liveAccuracy != null && finalAccuracy != null)
      ? Math.abs(liveAccuracy - finalAccuracy)
      : null;

    // Log report
    const report = {
      run: 1,
      liveAccuracySeen: liveAccuracySamples,
      liveAccuracyFinal: liveAccuracy,
      finalAccuracy,
      discrepancy,
      significant: discrepancy != null && discrepancy > 5,
    };
    console.log('\n=== ACCURACY DISCREPANCY REPORT (Run 1) ===');
    console.log(JSON.stringify(report, null, 2));
    testInfo.annotations.push({ type: 'report', description: JSON.stringify(report) });

    if (discrepancy != null) {
      expect(discrepancy, `Live vs final accuracy should not differ by >5%. Live: ${liveAccuracy}, Final: ${finalAccuracy}`).toBeLessThanOrEqual(5);
    }
  });

  test('run 2: different pattern - alternating correct/wrong', async ({ page }, testInfo) => {
    // Same setup
    const timeModeBtn = page.locator('button').filter({ hasText: /^time$/i }).first();
    if (await timeModeBtn.isVisible()) {
      await timeModeBtn.click();
      await page.waitForTimeout(300);
    }
    const duration30Btn = page.locator('button').filter({ hasText: /^30$/ }).first();
    if (await duration30Btn.isVisible()) {
      await duration30Btn.click();
      await page.waitForTimeout(300);
    }

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const typingInput = page.locator('input[type="text"]').first();
    await typingInput.click();
    await page.waitForTimeout(200);

    const targetEl = page.locator('.font-mono.text-xl, .font-mono.text-2xl').first();
    const targetText = (await targetEl.textContent()) || '';
    const targetChars = targetText.replace(/\s+/g, ' ').trim().split('');
    if (targetChars.length < 20) {
      testInfo.annotations.push({ type: 'skip', description: 'Target text too short' });
      return;
    }

    // Pattern: every 2nd char wrong (50% errors)
    const totalCharsToType = Math.min(40, targetChars.length);
    const liveAccuracySamples: number[] = [];

    for (let i = 0; i < totalCharsToType; i++) {
      const targetChar = targetChars[i];
      const typeWrong = i % 2 === 1; // Every 2nd is wrong
      const charToType = typeWrong && targetChar !== ' ' ? 'z' : targetChar;
      await typingInput.type(charToType, { delay: 150 });

      if (i > 0 && i % 10 === 0) {
        const accEl = liveAccuracyLocator(page);
        if (await accEl.isVisible()) {
          const text = await accEl.textContent();
          const match = text?.match(/(\d+(?:\.\d+)?)/);
          if (match) liveAccuracySamples.push(parseFloat(match[1]));
        }
      }
    }

    await page.waitForTimeout(500);
    const lastAccEl = liveAccuracyLocator(page);
    if (await lastAccEl.isVisible()) {
      const text = await lastAccEl.textContent();
      const match = text?.match(/(\d+(?:\.\d+)?)/);
      if (match) liveAccuracySamples.push(parseFloat(match[1]));
    }

    await page.waitForTimeout(20000);

    let finalAccuracy: number | null = null;
    const anyPercent = await page.locator('text=/\\d+(\\.\\d+)?%?/').allTextContents();
    for (const s of anyPercent) {
      const m = s.match(/(\d+(?:\.\d+)?)\s*%?/);
      if (m) {
        const v = parseFloat(m[1]);
        if (v >= 0 && v <= 100 && !finalAccuracy) {
          finalAccuracy = v;
          break;
        }
      }
    }

    const liveAccuracy = liveAccuracySamples.length > 0
      ? liveAccuracySamples[liveAccuracySamples.length - 1]
      : null;
    const discrepancy = (liveAccuracy != null && finalAccuracy != null)
      ? Math.abs(liveAccuracy - finalAccuracy)
      : null;

    const report = {
      run: 2,
      liveAccuracySeen: liveAccuracySamples,
      liveAccuracyFinal: liveAccuracy,
      finalAccuracy,
      discrepancy,
      significant: discrepancy != null && discrepancy > 5,
    };
    console.log('\n=== ACCURACY DISCREPANCY REPORT (Run 2) ===');
    console.log(JSON.stringify(report, null, 2));
    testInfo.annotations.push({ type: 'report', description: JSON.stringify(report) });

    if (discrepancy != null) {
      expect(discrepancy, `Live vs final accuracy should not differ by >5%. Live: ${liveAccuracy}, Final: ${finalAccuracy}`).toBeLessThanOrEqual(5);
    }
  });
});
