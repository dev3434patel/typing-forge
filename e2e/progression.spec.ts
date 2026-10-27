import { expect, test } from '@playwright/test';
test.use({ timezoneId: 'UTC' });
test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/session*', route => route.fulfill({ json: { user: null, csrfToken: 'progression-fixture' } }));
  await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
});
test('guest progression starts honestly, daily reroll persists and never calls account claims', async ({ page }) => {
  const claims: string[] = []; page.on('request', request => { if (/\/api\/progression/.test(request.url()) && request.method() !== 'GET') claims.push(request.url()); });
  await page.goto('/progression');
  await expect(page.getByRole('heading', { name: 'Level 1 Hunter' })).toBeVisible();
  await expect(page.getByText('On this device · unverified')).toBeVisible();
  await expect(page.getByText('0 lifetime XP')).toBeVisible();
  await page.getByRole('button', { name: 'Free daily reroll' }).click();
  await expect(page.getByRole('button', { name: 'Reroll used today' })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reroll used today' })).toBeDisabled();
  await expect(page.getByText('0 lifetime XP')).toBeVisible();
  expect(claims).toHaveLength(0);
});
test('fallback reload preserves existing receipt awards without rewarding twice', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true });
    if (localStorage.getItem('sparowtype:progression:v1:guest')) return;
    localStorage.setItem('sparowtype:progression:v1:guest', JSON.stringify({ version: 1, ownerId: 'guest', pending: [], commands: [], receipts: [{ version: 1, id: 'browser-accepted-local', ownerId: 'guest', verification: 'local', payloadHash: 'fixture-local', at: Date.now(), timeZone: 'UTC', kind: 'lesson', completedChars: 100, attempts: 100, correctAttempts: 100, lessonQualified: true, raceWin: false, personalBest30: false, skills: [] }] }));
  });
  await page.goto('/progression');
  await expect(page.getByText('100 lifetime XP')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Qualified lesson', exact: true })).toBeVisible();
  const before = await page.getByRole('table', { name: 'Latest 30 Keys transactions' }).innerText();
  await page.reload();
  await expect(page.getByText('100 lifetime XP')).toBeVisible();
  expect(await page.getByRole('table', { name: 'Latest 30 Keys transactions' }).innerText()).toBe(before);
  await expect(page.getByText('Only server-replayed XP enters leagues. Participants and positions are real.')).toBeVisible();
});
test('a corrupt fallback envelope stays intact and has a recovery download', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); localStorage.setItem('sparowtype:progression:v1:guest', '{original damaged bytes'); });
  await page.goto('/progression');
  await expect(page.getByRole('alert')).toContainText('preserved');
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export reward receipts' }).click();
  expect((await download).suggestedFilename()).toBe('sparowtype-progression-recovery.json');
  expect(await page.evaluate(() => localStorage.getItem('sparowtype:progression:v1:guest'))).toBe('{original damaged bytes');
});
