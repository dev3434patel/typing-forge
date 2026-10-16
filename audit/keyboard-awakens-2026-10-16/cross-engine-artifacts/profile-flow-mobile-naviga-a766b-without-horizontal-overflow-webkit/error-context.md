# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: profile-flow.spec.ts >> mobile navigation exposes Test, Learn, Race, and Stats without horizontal overflow
- Location: e2e\profile-flow.spec.ts:50:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('link', { name: 'Test', exact: true })
Expected: "/"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('link', { name: 'Test', exact: true }) with timeout 5000ms
  - waiting for getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('link', { name: 'Test', exact: true })

```

```yaml
- status: Loading SparowType
- text: 100% Ready to type
- button "Enable intro sound": Sound off
- button "Skip intro"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('guest profile protects account controls and destructive reset requires exact confirmation', async ({ page }) => {
  4  |   await page.goto('/profile');
  5  |   await expect(page.getByRole('heading', { name: 'Guest workspace', exact: true })).toBeVisible();
  6  |   await expect(page.getByRole('textbox', { name: 'Handle', exact: true })).toBeDisabled();
  7  |   const reset = page.getByRole('button', { name: 'Reset guest workspace', exact: true });
  8  |   await expect(reset).toBeDisabled();
  9  |   await page.getByLabel('Type DELETE to enable this action', { exact: true }).fill('delete'); await expect(reset).toBeDisabled();
  10 |   await page.getByLabel('Type DELETE to enable this action', { exact: true }).fill('DELETE'); await expect(reset).toBeEnabled();
  11 | });
  12 | 
  13 | test('themes and keyboard preferences survive reload', async ({ page }) => {
  14 |   await page.goto('/settings');
  15 |   await page.getByRole('button', { name: 'Aa bb Paper', exact: true }).click();
  16 |   await page.getByRole('combobox', { name: 'Keyboard layout', exact: true }).selectOption('dvorak');
  17 |   await page.reload();
  18 |   await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  19 |   await expect(page.getByRole('combobox', { name: 'Keyboard layout', exact: true })).toHaveValue('dvorak');
  20 |   await expect(page.getByRole('button', { name: 'Aa bb Paper', exact: true })).toHaveAttribute('aria-pressed', 'true');
  21 | });
  22 | 
  23 | test('the keyboard command palette changes theme and navigates using concrete commands', async ({ page }) => {
  24 |   await page.goto('/');
  25 |   // Keyboard events do not auto-wait for React's lazy workspace to mount.
  26 |   await expect(page.getByRole('button', { name: 'Open command palette', exact: true })).toBeVisible();
  27 |   const dialog = page.getByRole('dialog', { name: 'SparowType commands', exact: true });
  28 |   await page.keyboard.press('ControlOrMeta+k');
  29 |   await expect(dialog).toBeVisible();
  30 |   await dialog.getByRole('combobox').fill('Aurora');
  31 |   // Once the lazy palette is interactive, a held shortcut closes it only once.
  32 |   await page.keyboard.down('ControlOrMeta');
  33 |   await page.keyboard.down('k');
  34 |   try {
  35 |     await expect(dialog).toBeHidden();
  36 |     await page.keyboard.down('k'); // The second down is an actual browser repeat event.
  37 |     await expect(dialog).toBeHidden();
  38 |   } finally {
  39 |     await page.keyboard.up('k');
  40 |     await page.keyboard.up('ControlOrMeta');
  41 |   }
  42 |   await page.keyboard.press('ControlOrMeta+k');
  43 |   await expect(dialog).toBeVisible();
  44 |   await dialog.getByRole('combobox').fill('Aurora'); await page.keyboard.press('Enter');
  45 |   await expect(page.locator('html')).toHaveAttribute('data-theme', 'aurora');
  46 |   await page.keyboard.press('ControlOrMeta+k'); await dialog.getByRole('combobox').fill('Adaptive learning'); await page.keyboard.press('Enter');
  47 |   await expect(page).toHaveURL('/learn'); await expect(page.getByRole('heading', { name: 'Make every key feel natural.', exact: true })).toBeVisible();
  48 | });
  49 | 
  50 | test('mobile navigation exposes Test, Learn, Race, and Stats without horizontal overflow', async ({ page }) => {
  51 |   await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  52 |   const nav = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
> 53 |   for (const [name, href] of [['Test', '/'], ['Learn', '/learn'], ['Race', '/race'], ['Stats', '/stats']]) await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
     |                                                                                                                                                                       ^ Error: expect(locator).toHaveAttribute(expected) failed
  54 |   await nav.getByRole('link', { name: 'Learn', exact: true }).click(); await expect(page).toHaveURL('/learn');
  55 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  56 |   await nav.getByRole('link', { name: 'Stats', exact: true }).click(); await expect(page).toHaveURL('/stats');
  57 | });
  58 | 
```