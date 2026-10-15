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

Locator: getByRole('dialog', { name: 'Typing Forge commands', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('dialog', { name: 'Typing Forge commands', exact: true }) with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Typing Forge commands', exact: true })

```

```yaml
- banner:
  - link "Skip to content":
    - /url: "#main-content"
  - link "Typing Forge home":
    - /url: /
    - img
    - text: typingforge.
  - navigation "Main navigation":
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
  - button "Open command palette":
    - img
  - link "Settings":
    - /url: /settings
    - img
  - link "Sign in":
    - /url: /auth
    - img
    - text: Sign in
- main:
  - paragraph: Your daily moment of focus
  - heading "Make every keystroke count." [level=1]
  - paragraph: Find your rhythm. Build your accuracy. See your progress.
  - link "Build a stronger foundation":
    - /url: /learn
    - text: Build a stronger foundation
    - img
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
    - paragraph: "Practice passage: low last under hand main jump near talk ground smile last tan toe fun person who tent keep happy queen thought six jump taste net each flow line line rate just oat line east quiet zone who just great world this pair west letter speak sane week way brown as root never join save at then neon these idea shape group toe school nine left task show this nest her tall face tire arise point stop sound old queen view stop out map with game a many give read show play just tent group nine earn tall run team set last wish many park ant shore nature window though silver play feel clean sent most face race tin wood people"
    - textbox "Typing input"
    - button "Click here or tab to start typing Your first character starts the clock":
      - img
      - text: Click here or tab to start typing Your first character starts the clock
    - paragraph: Esc pauses · Ctrl+Enter finishes · Tab moves focus
    - button "Show accessible text editor":
      - img
    - button "Restart with new text":
      - img
    - button "Finish" [disabled]:
      - img
      - text: Finish
    - status: Ready to type
    - paragraph: Stay relaxed. Accuracy builds speed.
  - img
  - heading "A quieter workspace" [level=2]
  - paragraph: Six practice modes. Your language, layout and pace.
  - link "Practice with purpose Adaptive lessons follow the keys that need your attention.":
    - /url: /learn
    - img
    - heading "Practice with purpose" [level=2]
    - paragraph: Adaptive lessons follow the keys that need your attention.
  - img
  - heading "Progress you can trust" [level=2]
  - paragraph: Clear metrics and local history, even without an account.
- contentinfo:
  - img
  - text: A little practice. Lasting progress.
  - link "About & metrics":
    - /url: /about
  - link "Preferences & data":
    - /url: /settings
  - text: Typing Forge © 2026
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
  27 |   await page.keyboard.press('ControlOrMeta+k');
> 28 |   const dialog = page.getByRole('dialog', { name: 'Typing Forge commands', exact: true }); await expect(dialog).toBeVisible();
     |                                                                                                                 ^ Error: expect(locator).toBeVisible() failed
  29 |   await dialog.getByRole('combobox').fill('Aurora'); await page.keyboard.press('Enter');
  30 |   await expect(page.locator('html')).toHaveAttribute('data-theme', 'aurora');
  31 |   await page.keyboard.press('ControlOrMeta+k'); await dialog.getByRole('combobox').fill('Adaptive learning'); await page.keyboard.press('Enter');
  32 |   await expect(page).toHaveURL('/learn'); await expect(page.getByRole('heading', { name: 'Make every key feel natural.', exact: true })).toBeVisible();
  33 | });
  34 | 
  35 | test('mobile navigation exposes Test, Learn, Race, and Stats without horizontal overflow', async ({ page }) => {
  36 |   await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  37 |   const nav = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
  38 |   for (const [name, href] of [['Test', '/'], ['Learn', '/learn'], ['Race', '/race'], ['Stats', '/stats']]) await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('href', href);
  39 |   await nav.getByRole('link', { name: 'Learn', exact: true }).click(); await expect(page).toHaveURL('/learn');
  40 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  41 |   await nav.getByRole('link', { name: 'Stats', exact: true }).click(); await expect(page).toHaveURL('/stats');
  42 | });
  43 | 
```