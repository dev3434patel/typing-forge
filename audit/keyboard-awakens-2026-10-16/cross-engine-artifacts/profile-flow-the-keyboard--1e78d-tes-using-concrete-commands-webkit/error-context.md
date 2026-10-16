# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: profile-flow.spec.ts >> the keyboard command palette changes theme and navigates using concrete commands
- Location: e2e\profile-flow.spec.ts:23:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Make every key feel natural.', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Make every key feel natural.', exact: true }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Make every key feel natural.', exact: true })

```

```yaml
- banner:
  - link "Skip to content":
    - /url: "#main-content"
  - link "SparowType home":
    - /url: /
    - text: Sparow Type
  - button "Switch to light theme":
    - img
  - button "Open command palette":
    - img
  - link "Settings":
    - /url: /settings
    - img
  - link "Sign in":
    - /url: /auth
    - img
    - text: Sign in
  - navigation "Mobile navigation":
    - link "Test":
      - /url: /
      - img
      - text: Test
    - link "Learn":
      - /url: /learn
      - img
      - text: Learn
    - link "Race":
      - /url: /race
      - img
      - text: Race
    - link "Stats":
      - /url: /stats
      - img
      - text: Stats
    - link "Rankings":
      - /url: /leaderboard
      - img
      - text: Rankings
    - link "Keyboard Lab":
      - /url: /keyboard-lab
      - img
      - text: Keyboard Lab
- main:
  - heading "Typing practice" [level=1]
  - region "Test configuration":
    - group "Test mode":
      - button "Time" [pressed]:
        - img
        - text: Time
      - button "Words":
        - img
        - text: Words
      - button "Quote":
        - img
        - text: Quote
      - button "Code":
        - img
        - text: Code
      - button "Custom":
        - img
        - text: Custom
      - button "Zen":
        - img
        - text: Zen
    - group "Test duration":
      - button "15 seconds"
      - button "30 seconds" [pressed]
      - button "60 seconds"
      - button "120 seconds"
    - checkbox "Precision mode · stop on errors"
    - text: Precision mode · stop on errors Language
    - combobox "Language":
      - option "English" [selected]
      - option "Español"
      - option "Français"
      - option "Deutsch"
      - option "Português"
      - option "Italiano"
      - option "Русский"
      - option "हिन्दी"
      - option "العربية"
      - option "Gujarati transliteration (Latin)"
    - button "punctuation":
      - img
      - text: punctuation
    - button "# numbers"
  - region "Typing session":
    - text: 30s remaining —wpm —acc % Ready when you are
    - paragraph: "Practice passage: paint true read six are why work kite here wish park star keep note full give talk down book net put notion note land terrain retina ease my forge great terrain deep power night wind queen room mean talk zone joke soot ground calm find wait want race end tie how nice when simple door era side shore zone dear name two as race go turn deep ant road code train thank slow than dear fast every tell way their road terrain blue through innate not book try send quite no sun often sane read just deep to fair under glass ready this group as why zero one please taste east path in map through sun from here park voice"
    - textbox "Typing input"
    - button "Click here or tab to start typing":
      - img
      - text: Click here or tab to start typing
    - paragraph: Type the text above. Wrong letters stay visible; Backspace corrects.
    - status
    - paragraph: Esc pauses · Ctrl+Enter finishes · Tab → Enter restarts
    - button "Restart with new text":
      - img
    - button "Show accessible text editor":
      - img
    - button "Finish" [disabled]:
      - img
      - text: Finish
    - status: Ready to type
- contentinfo:
  - text: Sparow Type Find your rhythm.
  - link "About & metrics":
    - /url: /about
  - link "Preferences & data":
    - /url: /settings
  - link "Touch typing guide":
    - /url: /touch-typing
  - link "Privacy":
    - /url: /privacy
  - link "Terms":
    - /url: /terms
  - link "Offline":
    - /url: /offline
  - text: SparowType © 2026
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
> 47 |   await expect(page).toHaveURL('/learn'); await expect(page.getByRole('heading', { name: 'Make every key feel natural.', exact: true })).toBeVisible();
     |                                                                                                                                          ^ Error: expect(locator).toBeVisible() failed
  48 | });
  49 | 
  50 | test('mobile navigation exposes Test, Learn, Race, and Stats without horizontal overflow', async ({ page }) => {
  51 |   await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  52 |   const nav = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
  53 |   for (const [name, href] of [['Test', '/'], ['Learn', '/learn'], ['Race', '/race'], ['Stats', '/stats']]) await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  54 |   await nav.getByRole('link', { name: 'Learn', exact: true }).click(); await expect(page).toHaveURL('/learn');
  55 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  56 |   await nav.getByRole('link', { name: 'Stats', exact: true }).click(); await expect(page).toHaveURL('/stats');
  57 | });
  58 | 
```