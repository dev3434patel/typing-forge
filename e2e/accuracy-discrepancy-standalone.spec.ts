/**
 * E2E TEST: Live vs Final Accuracy Discrepancy (Standalone)
 * Run with: npx playwright test e2e/accuracy-discrepancy-standalone.spec.ts
 * Requires dev server at http://localhost:8080 (or set BASE_URL)
 */

import { test, expect } from '@playwright/test';

function liveAccuracyLocator(page: import('@playwright/test').Page) {
  // Running HUD card: number (text-3xl) above the "accuracy" label.
  return page
    .locator('div.flex.flex-col.items-center')
    .filter({ has: page.locator('span:has-text("accuracy")') })
    .locator('span.text-3xl')
    .first();
}

test.describe('Live vs Final Accuracy Discrepancy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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

    // 3. Input is an invisible focused field controlled by Enter/global handlers.
    // Do not click the hidden input directly (pointer-events-none).
    await page.waitForTimeout(200);

    // 4. Get target text from visible paragraph
    const targetEl = page.locator('.font-mono.text-xl, .font-mono.text-2xl').first();
    const targetText = (await targetEl.textContent()) || '';
    const targetChars = targetText.replace(/\s+/g, ' ').trim().split('');
    if (targetChars.length < 20) {
      testInfo.annotations.push({ type: 'skip', description: 'Target text too short' });
      return;
    }

    // 5. Type ERROR-HEAVY: mostly wrong chars (~80% wrong)
    const liveAccuracySamples: number[] = [];
    const totalCharsToType = Math.min(36, targetChars.length); // ~12 seconds at 3 chars/sec
    const sampleInterval = 12;

    for (let i = 0; i < totalCharsToType; i++) {
      const targetChar = targetChars[i];
      const typeWrong = Math.random() < 0.8;
      const charToType = typeWrong && targetChar !== ' ' ? 'x' : targetChar;
      await page.keyboard.type(charToType, { delay: 350 });

      if (i > 0 && i % sampleInterval === 0) {
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

    // 6. Wait for test to end
    await page.waitForTimeout(18000);

    // 7. Capture final results - look for main accuracy stat on results screen
    let finalAccuracy: number | null = null;
    const statCards = page.locator('[class*="stat-card"], [class*="StatCard"], .grid .gap-4 div');
    for (const _ of Array(10)) {
      const cards = await statCards.all();
      for (const card of cards) {
        const text = await card.textContent();
        if (text && /accuracy/i.test(text)) {
          const m = text.match(/(\d+(?:\.\d+)?)/);
          if (m) {
            const v = parseFloat(m[1]);
            if (v >= 0 && v <= 100) {
              finalAccuracy = v;
              break;
            }
          }
        }
      }
      if (finalAccuracy != null) break;
      await page.waitForTimeout(500);
    }

    if (finalAccuracy == null) {
      const allText = await page.locator('body').textContent();
      const matches = allText?.matchAll(/(\d+(?:\.\d+)?)\s*%/g);
      if (matches) {
        for (const m of matches) {
          const v = parseFloat(m[1]);
          if (v >= 20 && v <= 100) {
            finalAccuracy = v;
            break;
          }
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
      run: 1,
      liveAccuracySeen: liveAccuracySamples,
      liveAccuracyFinal: liveAccuracy,
      finalAccuracy,
      discrepancy,
      significant: discrepancy != null && discrepancy > 5,
    };
    console.log('\n=== ACCURACY DISCREPANCY REPORT (Run 1) ===');
    console.log(JSON.stringify(report, null, 2));

    if (discrepancy != null && discrepancy > 5) {
      expect(discrepancy, `Live vs final accuracy differed by >5%. Live: ${liveAccuracy}%, Final: ${finalAccuracy}%`).toBeLessThanOrEqual(5);
    }
  });

  test('run 2: alternating correct/wrong (50% errors)', async ({ page }, testInfo) => {
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

    await page.waitForTimeout(200);

    const targetEl = page.locator('.font-mono.text-xl, .font-mono.text-2xl').first();
    const targetText = (await targetEl.textContent()) || '';
    const targetChars = targetText.replace(/\s+/g, ' ').trim().split('');
    if (targetChars.length < 20) {
      testInfo.annotations.push({ type: 'skip', description: 'Target text too short' });
      return;
    }

    const totalCharsToType = Math.min(40, targetChars.length);
    const liveAccuracySamples: number[] = [];

    for (let i = 0; i < totalCharsToType; i++) {
      const targetChar = targetChars[i];
      const typeWrong = i % 2 === 1;
      const charToType = typeWrong && targetChar !== ' ' ? 'z' : targetChar;
      await page.keyboard.type(charToType, { delay: 150 });

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
    const statCards = page.locator('[class*="stat-card"], [class*="StatCard"], .grid div');
    for (const _ of Array(10)) {
      const cards = await statCards.all();
      for (const card of cards) {
        const text = await card.textContent();
        if (text && /accuracy/i.test(text)) {
          const m = text.match(/(\d+(?:\.\d+)?)/);
          if (m) {
            const v = parseFloat(m[1]);
            if (v >= 0 && v <= 100) {
              finalAccuracy = v;
              break;
            }
          }
        }
      }
      if (finalAccuracy != null) break;
      await page.waitForTimeout(500);
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

    if (discrepancy != null && discrepancy > 5) {
      expect(discrepancy, `Live vs final accuracy differed by >5%. Live: ${liveAccuracy}%, Final: ${finalAccuracy}%`).toBeLessThanOrEqual(5);
    }
  });
});
