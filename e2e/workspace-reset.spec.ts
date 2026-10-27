import { expect, test } from '@playwright/test';
import { customPractice } from './helpers';
test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ context }) => {
  await context.route('**/api/**', route => route.fulfill({ json: { user: null, csrfToken: 'reset-guest-fixture' } }));
  await context.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
});
for (const complete of [false, true]) test(`another tab reset closes the ${complete ? 'completed result' : 'active controller'} without restoring private text`, async ({ page, context }) => {
  const input = await customPractice(page, 'cat dog');
  await input.pressSequentially(complete ? 'cat dog' : 'cat ', { delay: 50 });
  if (complete) await expect(page.getByText('Session complete', { exact: true })).toBeVisible();
  else await expect(input).toHaveValue('cat ');
  const other = await context.newPage(); await other.goto('/profile');
  await other.getByLabel('Type DELETE to enable this action').fill('DELETE');
  await other.getByRole('button', { name: 'Reset guest workspace', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Custom practice passage', exact: true })).toHaveValue('');
  await expect(page.getByText('Session complete', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Typing input', exact: true })).toHaveCount(0);
  await expect(other.getByText('No sessions saved in this workspace yet.', { exact: true })).toBeVisible();
  // A hidden empty UI is insufficient: completed raw evidence must be gone from IndexedDB.
  const persisted = await other.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('typingforge-sessions', 3); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    try { return await new Promise<Array<Record<string, unknown>>>((resolve, reject) => { const request = database.transaction('sessions', 'readonly').objectStore('sessions').getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
    finally { database.close(); }
  });
  const owned = persisted.filter(row => row.ownerId === 'guest');
  if (complete) expect(owned.length).toBeGreaterThan(0);
  expect(owned.every(row => row.deleted === true && Object.keys(row).sort().join(',') === 'clientSessionId,deleted,key,ownerId')).toBe(true);
  await other.goto('/progression');
  await expect(other.getByText('0 lifetime XP', { exact: true })).toBeVisible();
});
