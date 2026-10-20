import { test, expect } from '@playwright/test';
import { exportedResult } from './helpers';

test('learning shows the pressed wrong letter and advances by default, with corrections still counted', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.getByLabel('Correction policy')).toHaveValue('correct');
  const input = page.getByRole('textbox', { name: 'Type the practice text' });
  const target = page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text');
  const text = await target.textContent();
  expect(text).toBeTruthy();
  const wrong = text![0] === 'x' ? 'z' : 'x';
  await input.focus();
  await input.pressSequentially(wrong);
  await expect(target.locator('[data-typed]').first()).toHaveAttribute('data-typed', wrong);
  await expect(target.locator('[data-typed]').first()).toHaveAttribute('data-expected', text![0]);
  await expect(target.locator('[data-typed]').first()).toContainText(wrong);
  await expect(target.locator('[data-typed]').first()).not.toHaveAttribute('data-current', 'true');
  await expect(target.locator('[data-current="true"]')).toHaveAttribute('data-expected', text![1]);
  await expect(page.getByTestId('typing-feedback')).toContainText('Expected');
  await expect(page.getByTestId('typing-feedback')).toContainText(wrong);
  await expect(page.getByTestId('typing-feedback')).toContainText('Added to your text');

  await input.press('Backspace');
  await expect(target).toHaveText(text!);
  await expect(target.locator('[data-current="true"]')).toHaveAttribute('data-expected', text![0]);
  await input.pressSequentially(text!, { delay: 3 });
  await expect(page.getByRole('region', { name: 'Session results' })).toBeVisible();
  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem('typingforge:v3:guest:learning') || '{}'));
  expect(evidence.sessions).toHaveLength(1);
  expect(evidence.sessions[0].attempts).toHaveLength([...text!].length + 1);
  expect(evidence.sessions[0].attempts.filter((attempt: { correct: boolean }) => !attempt.correct)).toHaveLength(1);
  await expect(page.getByRole('region', { name: 'Session results' })).toContainText((text!.length / (text!.length + 1) * 100).toFixed(1));
});

test('learning records rejected attempts and saves exactly one immutable result', async ({ page }) => {
  await page.goto('/learn');
  await page.getByLabel('Correction policy').selectOption('stop');
  const input = page.getByRole('textbox', { name: 'Type the practice text' });
  await expect(input).toBeVisible();
  const text = await page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text').textContent();
  expect(text).toBeTruthy();
  const wrong = text![0] === 'x' ? 'z' : 'x';
  await input.focus();
  await input.pressSequentially(wrong);
  await expect(page.getByTestId('typing-feedback')).toBeVisible();
  await expect(page.getByTestId('typing-feedback')).toContainText('Expected');
  await expect(page.getByTestId('typing-feedback')).toContainText(wrong);
  await expect(page.getByTestId('typing-feedback')).toContainText('Not inserted');
  await expect(page.locator('[aria-label="Adaptive typing lesson"] [data-current="true"]')).toHaveAttribute('data-expected', text![0]);
  await expect(page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text')).toHaveText(text!);
  await expect(input).toHaveValue('');
  await input.pressSequentially(text!, { delay: 3 });
  await expect(page.getByRole('region', { name: 'Session results' })).toBeVisible();
  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem('typingforge:v3:guest:learning') || '{}'));
  expect(evidence.sessions).toHaveLength(1);
  expect(evidence.sessions[0].attempts).toHaveLength([...text!].length + 1);
  expect(evidence.sessions[0].attempts.filter((attempt: { correct: boolean }) => !attempt.correct)).toHaveLength(1);
  const expectedAccuracy = text!.length / (text!.length + 1) * 100;
  await expect(page.getByRole('region', { name: 'Session results' })).toContainText(expectedAccuracy.toFixed(1));
  await page.reload();
  await expect(page.getByText('Make every key feel natural.')).toBeVisible();
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('typingforge:v3:guest:learning') || '{}'));
  expect(persisted.sessions).toHaveLength(1);
});

test('learning preserves wrong-key feedback when one stop-mode input batch ends correctly', async ({ page }) => {
  await page.goto('/learn?language=en');
  await page.getByLabel('Correction policy').selectOption('stop');
  const target = page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text');
  const first = await target.locator('[data-slot-index="0"]').getAttribute('data-expected');
  const second = await target.locator('[data-slot-index="1"]').getAttribute('data-expected');
  expect(first).toBeTruthy();
  expect(second).toBeTruthy();
  const wrong = 'x';
  expect([first, second]).not.toContain(wrong);
  const batch = `${wrong}${first}${wrong}${second}`;
  const input = page.getByRole('textbox', { name: 'Type the practice text' });
  await input.fill(batch);
  const feedback = page.getByTestId('typing-feedback');
  await expect(feedback).toContainText(`You typed ${wrong}`);
  await expect(feedback).toContainText(`Expected ${second}`);
  await expect(feedback).toContainText('Not inserted');
  await expect(feedback).toContainText('2 incorrect units in this input');
  await expect(target.locator('[data-slot-index="0"]')).toHaveAttribute('data-typed', first!);
  await expect(target.locator('[data-slot-index="1"]')).toHaveAttribute('data-typed', second!);
  await expect(target.locator('[data-current="true"]')).toHaveAttribute('data-slot-index', '2');
  await page.getByRole('button', { name: 'Finish practice', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Session results' })).toBeVisible();
  const result = await exportedResult(page);
  expect(result.events).toHaveLength(1);
  expect(result.events[0].text).toBe(batch);
  expect(result.metrics.insertionAttempts).toBe(4);
  expect(result.metrics.incorrectAttempts).toBe(2);
  expect(result.finalText).toBe(`${first}${second}`);
});

test('Tab leaves the learning input without generating another lesson', async ({ page }) => {
  await page.goto('/learn');
  const target = page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text');
  const before = await target.textContent();
  const input = page.getByRole('textbox', { name: 'Type the practice text' });
  await input.focus();
  await input.press('Tab');
  await expect(input).not.toBeFocused();
  await expect(target).toHaveText(before!);
  await expect(page.getByRole('button', { name: 'Finger guide', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Hide keyboard', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Correction policy')).toBeFocused();
});

test('Arabic lesson uses RTL native characters and composition has no invented key timing', async ({ page }) => {
  await page.goto('/learn?language=ar&layout=native');
  await expect(page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text[dir="rtl"]')).toBeVisible();
  await page.getByLabel('Input method', { exact: true }).selectOption('composition');
  const input = page.getByRole('textbox', { name: 'Type the practice text' });
  const text = await page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text').textContent();
  await input.evaluate((element, content) => {
    element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: content }));
  }, text!);
  await expect(page.getByRole('region', { name: 'Session results' })).toBeVisible();
  const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem('typingforge:v3:guest:learning') || '{}'));
  expect(evidence.sessions).toHaveLength(1);
  expect(evidence.sessions[0].dimensions).toMatchObject({ language: 'ar', layout: 'native', inputMethod: 'composition' });
  expect(evidence.sessions[0].attempts.every((attempt: { attributable: boolean; latencyMs: number | null }) => !attempt.attributable && attempt.latencyMs === null)).toBe(true);
});

for (const language of ['en', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'hi', 'ar', 'gu-Latn']) {
  test(`${language} content completes through the actual learning input adapter`, async ({ page }) => {
    await page.goto(`/learn?language=${language}`);
    const input = page.getByRole('textbox', { name: 'Type the practice text' });
    await expect(input).toBeVisible();
    const text = await page.locator('[aria-label="Adaptive typing lesson"] .learn-stream-text').textContent();
    expect(text?.length).toBeGreaterThan(0);
    if (language === 'hi' || language === 'ar') {
      await input.evaluate((element, content) => {
        element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
        element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: content }));
      }, text!);
    } else {
      await input.focus();
      await input.pressSequentially(text!);
    }
    await expect(page.getByRole('region', { name: 'Session results' })).toBeVisible();
    const evidence = await page.evaluate(() => JSON.parse(localStorage.getItem('typingforge:v3:guest:learning') || '{}'));
    expect(evidence.sessions).toHaveLength(1);
    expect(evidence.sessions[0].dimensions.language).toBe(language);
    expect(evidence.sessions[0].attempts.every((attempt: { correct: boolean }) => attempt.correct)).toBe(true);
    if (language === 'hi' || language === 'ar') expect(evidence.sessions[0].dimensions.inputMethod).toBe('composition');
  });
}

