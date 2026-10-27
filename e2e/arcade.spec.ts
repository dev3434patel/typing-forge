import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import axe from 'axe-core';
import { GAMES } from '../src/games/modes/catalog';
import type { GameEvidence } from '../src/games/engine/types';
import { phpApiBase } from './php-api-fixture';
import { settlePageVisuals } from './helpers';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page, baseURL }) => {
  const api = phpApiBase(baseURL!);
  await page.route(`${api.href}**`, route => route.fulfill({ json: { user: null, csrfToken: 'arcade-guest-fixture' } }));
  await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
});

test('arcade catalog exposes eight original local games without loading the player before interaction', async ({ page }) => {
  await page.goto('/arcade');
  await expect(page.getByRole('heading', { name: 'Eight ways to find your flow.', exact: true })).toBeVisible();
  await expect(page.locator('.arcade-card')).toHaveCount(8);
  for (const game of GAMES) await expect(page.getByRole('link', { name: `Open ${game.name}`, exact: true })).toHaveAttribute('href', `/arcade/${game.id}`);
  expect(await page.evaluate(() => performance.getEntriesByType('resource').some(entry => /ArcadePlayer[-.]/.test(entry.name)))).toBe(false);
});

for (const [index, game] of GAMES.entries()) {
  test(`${game.name} retains real attempts and exports local canonical evidence in ${index % 2 ? 'landscape' : 'portrait'}`, async ({ page }, info) => {
    await page.setViewportSize(index % 2 ? { width: 844, height: 390 } : { width: 390, height: 844 });
    await page.goto(`/arcade/${game.id}`);
    await expect(page.getByRole('heading', { name: game.name, exact: true })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Arcade difficulty', exact: true }).locator('option')).toHaveText(['Easy', 'Normal', 'Hard']);
    await page.getByRole('combobox', { name: 'Arcade difficulty', exact: true }).selectOption('easy');
    await page.getByRole('button', { name: `Play ${game.name}`, exact: true }).click();
    const input = page.getByRole('textbox', { name: 'Arcade typing input', exact: true });
    await expect(input).toBeEnabled();
    await page.locator('.arcade-target-alternative summary').click();
    const word = (await page.locator('.arcade-target-alternative li').first().textContent())!.split(' · ')[0];
    expect(word).toMatch(/^[a-z]+$/);
    await input.focus();
    await input.press('Shift'); await input.press('Backspace');
    await page.waitForTimeout(150);
    await expect(page.locator('.arcade-metrics > div').filter({ has: page.getByText('Active time', { exact: true }) }).locator('dd')).toHaveText('0.0s');
    await expect(page.getByText('Type your first character to start the clock and moving targets.', { exact: false })).toBeVisible();
    await input.pressSequentially('#', { delay: 20 });
    await expect(page.locator('.arcade-key-feedback')).toContainText('incorrect attempt recorded');
    await input.pressSequentially(word, { delay: 20 });
    await expect(input).toHaveValue('');
    await page.getByRole('button', { name: 'End run', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Arcade result', exact: true })).toBeVisible();
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export canonical game JSON', exact: true }).click();
    const download = await downloading, path = await download.path(); expect(path).not.toBeNull();
    const evidence = JSON.parse(await readFile(path!, 'utf8')) as GameEvidence;
    expect(evidence.verification).toBe('local-unverified'); expect(evidence.gameId).toBe(game.id);
    expect(evidence.session.configuration.settings?.arcadeGame).toBe(game.id);
    expect(evidence.session.metrics.insertionAttempts).toBe(word.length + 1);
    expect(evidence.session.metrics.correctAttempts).toBe(word.length);
    expect(evidence.session.metrics.incorrectAttempts).toBe(1);
    expect(evidence.session.metrics.inputAccuracy).toBeCloseTo(word.length / (word.length + 1) * 100);
    expect(evidence.session.finalTranscript).toBe(word);
    expect(evidence.session.events.some(event => event.text === '#')).toBe(true);
    expect(evidence.session.configuration.startImmediately).toBe(false);
    expect(evidence.session.events.find(event => event.text)?.offsetMs).toBe(0);
    await expect.poll(() => page.evaluate(id => JSON.parse(localStorage.getItem('sparowtype.arcade.v1:guest') || '{}').bests?.some((best: { gameId: string }) => best.gameId === id), game.id)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
    await settlePageVisuals(page); await page.evaluate(axe.source);
    const violations = await page.evaluate(async () => (await (window as unknown as Window & { axe: typeof axe }).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map(value => ({ id: value.id, nodes: value.nodes.map(node => node.target) })));
    expect(violations).toEqual([]);
    await info.attach('arcade-canonical-native-evidence', { contentType: 'application/json', body: JSON.stringify({ gameId: game.id, viewport: page.viewportSize(), realNativeTyping: true, wordLength: word.length, metrics: evidence.session.metrics, violations, limitation: 'Emulated desktop/mobile viewport. Physical phone keyboard and full native screen reader journey remain unverified.' }) });
  });
}

test('game pause, mobile word-delete fallback and reduced-motion mode keep actual input intact', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/arcade/word-invaders');
  await page.getByRole('button', { name: 'Play Word Invaders', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Arcade typing input', exact: true });
  await page.locator('.arcade-target-alternative summary').click();
  const word = (await page.locator('.arcade-target-alternative li').first().textContent())!.split(' · ')[0];
  await input.focus(); await input.pressSequentially(word.slice(0, 1));
  await input.press('Escape'); await expect(input).toBeDisabled();
  await page.getByRole('button', { name: 'Resume typing', exact: true }).first().click();
  await expect(input).toBeFocused(); await expect(input).toHaveValue(word.slice(0, 1));
  await input.press('Backspace'); await expect(input).toHaveValue('');
  await input.evaluate(element => { element.addEventListener('beforeinput', event => { element.dataset.diagnosticConstructor = event.constructor.name; element.dataset.diagnosticInputType = (event as InputEvent).inputType ?? ''; }, { once: true }); });
  // Playwright uses Event for unknown event names. Its constructor discards
  // InputEvent fields, so retain that original dispatch as a negative control.
  await input.dispatchEvent('beforeinput', { inputType: 'deleteContentBackward', bubbles: true, cancelable: true });
  const generic = await input.evaluate(element => ({ constructor: element.dataset.diagnosticConstructor, inputType: element.dataset.diagnosticInputType }));
  expect(generic).toEqual({ constructor: 'Event', inputType: '' });
  await expect(page.locator('.arcade-key-feedback')).toContainText(word);
  const native = await input.evaluate(element => {
    const event = new InputEvent('beforeinput', { inputType: 'deleteContentBackward', bubbles: true, cancelable: true });
    element.dispatchEvent(event); return { constructor: event.constructor.name, inputType: event.inputType, prevented: event.defaultPrevented };
  });
  expect(native).toEqual({ constructor: 'InputEvent', inputType: 'deleteContentBackward', prevented: true });
  await expect(page.locator('.arcade-key-feedback')).toContainText('choose a visible word');
  await input.pressSequentially(word); await page.getByRole('button', { name: 'End run', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Arcade result', exact: true })).toBeVisible();
  await info.attach('actual-native-input-event-vs-generic-event', { contentType: 'application/json', body: JSON.stringify({ generic, native, preservedDraftAfterPause: word.slice(0, 1), nativeEmptyDeletionUnlocked: true }) });
});
