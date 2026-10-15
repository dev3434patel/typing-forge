import { test, expect } from '@playwright/test';

test('guest profile protects account controls and destructive reset requires exact confirmation', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Guest workspace', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Handle', exact: true })).toBeDisabled();
  const reset = page.getByRole('button', { name: 'Reset guest workspace', exact: true });
  await expect(reset).toBeDisabled();
  await page.getByLabel('Type DELETE to enable this action', { exact: true }).fill('delete'); await expect(reset).toBeDisabled();
  await page.getByLabel('Type DELETE to enable this action', { exact: true }).fill('DELETE'); await expect(reset).toBeEnabled();
});

test('themes and keyboard preferences survive reload', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Aa bb Paper', exact: true }).click();
  await page.getByRole('combobox', { name: 'Keyboard layout', exact: true }).selectOption('dvorak');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  await expect(page.getByRole('combobox', { name: 'Keyboard layout', exact: true })).toHaveValue('dvorak');
  await expect(page.getByRole('button', { name: 'Aa bb Paper', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('the keyboard command palette changes theme and navigates using concrete commands', async ({ page }) => {
  await page.goto('/');
  // Keyboard events do not auto-wait for React's lazy workspace to mount.
  await expect(page.getByRole('button', { name: 'Open command palette', exact: true })).toBeVisible();
  const dialog = page.getByRole('dialog', { name: 'Typing Forge commands', exact: true });
  await page.keyboard.press('ControlOrMeta+k');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('combobox').fill('Aurora');
  // Once the lazy palette is interactive, a held shortcut closes it only once.
  await page.keyboard.down('ControlOrMeta');
  await page.keyboard.down('k');
  try {
    await expect(dialog).toBeHidden();
    await page.keyboard.down('k'); // The second down is an actual browser repeat event.
    await expect(dialog).toBeHidden();
  } finally {
    await page.keyboard.up('k');
    await page.keyboard.up('ControlOrMeta');
  }
  await page.keyboard.press('ControlOrMeta+k');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('combobox').fill('Aurora'); await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'aurora');
  await page.keyboard.press('ControlOrMeta+k'); await dialog.getByRole('combobox').fill('Adaptive learning'); await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/learn'); await expect(page.getByRole('heading', { name: 'Make every key feel natural.', exact: true })).toBeVisible();
});

test('mobile navigation exposes Test, Learn, Race, and Stats without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
  for (const [name, href] of [['Test', '/'], ['Learn', '/learn'], ['Race', '/race'], ['Stats', '/stats']]) await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  await nav.getByRole('link', { name: 'Learn', exact: true }).click(); await expect(page).toHaveURL('/learn');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await nav.getByRole('link', { name: 'Stats', exact: true }).click(); await expect(page).toHaveURL('/stats');
});
