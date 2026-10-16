# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: profile-flow.spec.ts >> mobile navigation exposes Test, Learn, Race, and Stats without horizontal overflow
- Location: e2e\profile-flow.spec.ts:55:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- status [ref=e3]: Loading your workspace…
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.beforeEach(async ({ page }) => {
  4  |   // Profile and navigation flows have separate coverage from the opening lifecycle.
  5  |   await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
  6  | });
  7  | 
  8  | test('guest profile protects account controls and destructive reset requires exact confirmation', async ({ page }) => {
  9  |   await page.goto('/profile');
  10 |   await expect(page.getByRole('heading', { name: 'Guest workspace', exact: true })).toBeVisible();
  11 |   await expect(page.getByRole('textbox', { name: 'Handle', exact: true })).toBeDisabled();
  12 |   const reset = page.getByRole('button', { name: 'Reset guest workspace', exact: true });
  13 |   await expect(reset).toBeDisabled();
  14 |   await page.getByLabel('Type DELETE to enable this action', { exact: true }).fill('delete'); await expect(reset).toBeDisabled();
  15 |   await page.getByLabel('Type DELETE to enable this action', { exact: true }).fill('DELETE'); await expect(reset).toBeEnabled();
  16 | });
  17 | 
  18 | test('themes and keyboard preferences survive reload', async ({ page }) => {
  19 |   await page.goto('/settings');
  20 |   await page.getByRole('button', { name: 'Aa bb Paper', exact: true }).click();
  21 |   await page.getByRole('combobox', { name: 'Keyboard layout', exact: true }).selectOption('dvorak');
  22 |   await page.reload();
  23 |   await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  24 |   await expect(page.getByRole('combobox', { name: 'Keyboard layout', exact: true })).toHaveValue('dvorak');
  25 |   await expect(page.getByRole('button', { name: 'Aa bb Paper', exact: true })).toHaveAttribute('aria-pressed', 'true');
  26 | });
  27 | 
  28 | test('the keyboard command palette changes theme and navigates using concrete commands', async ({ page }) => {
  29 |   await page.goto('/');
  30 |   // Keyboard events do not auto-wait for React's lazy workspace to mount.
  31 |   await expect(page.getByRole('button', { name: 'Open command palette', exact: true })).toBeVisible();
  32 |   const dialog = page.getByRole('dialog', { name: 'SparowType commands', exact: true });
  33 |   await page.keyboard.press('ControlOrMeta+k');
  34 |   await expect(dialog).toBeVisible();
  35 |   await dialog.getByRole('combobox').fill('Aurora');
  36 |   // Once the lazy palette is interactive, a held shortcut closes it only once.
  37 |   await page.keyboard.down('ControlOrMeta');
  38 |   await page.keyboard.down('k');
  39 |   try {
  40 |     await expect(dialog).toBeHidden();
  41 |     await page.keyboard.down('k'); // The second down is an actual browser repeat event.
  42 |     await expect(dialog).toBeHidden();
  43 |   } finally {
  44 |     await page.keyboard.up('k');
  45 |     await page.keyboard.up('ControlOrMeta');
  46 |   }
  47 |   await page.keyboard.press('ControlOrMeta+k');
  48 |   await expect(dialog).toBeVisible();
  49 |   await dialog.getByRole('combobox').fill('Aurora'); await page.keyboard.press('Enter');
  50 |   await expect(page.locator('html')).toHaveAttribute('data-theme', 'aurora');
  51 |   await page.keyboard.press('ControlOrMeta+k'); await dialog.getByRole('combobox').fill('Adaptive learning'); await page.keyboard.press('Enter');
  52 |   await expect(page).toHaveURL('/learn'); await expect(page.getByRole('heading', { name: 'Make every key feel natural.', exact: true })).toBeVisible();
  53 | });
  54 | 
  55 | test('mobile navigation exposes Test, Learn, Race, and Stats without horizontal overflow', async ({ page }) => {
  56 |   await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  57 |   const nav = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
  58 |   for (const [name, href] of [['Test', '/'], ['Learn', '/learn'], ['Race', '/race'], ['Stats', '/stats']]) await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  59 |   await nav.getByRole('link', { name: 'Learn', exact: true }).click(); await expect(page).toHaveURL('/learn');
> 60 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
     |                                                                                         ^ Error: expect(received).toBe(expected) // Object.is equality
  61 |   await nav.getByRole('link', { name: 'Stats', exact: true }).click(); await expect(page).toHaveURL('/stats');
  62 | });
  63 | 
```