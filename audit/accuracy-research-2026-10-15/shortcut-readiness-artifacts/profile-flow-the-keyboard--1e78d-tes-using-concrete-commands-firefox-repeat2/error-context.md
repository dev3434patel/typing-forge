# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: profile-flow.spec.ts >> the keyboard command palette changes theme and navigates using concrete commands
- Location: e2e\profile-flow.spec.ts:23:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('dialog', { name: 'Typing Forge commands', exact: true }).getByRole('combobox')
    - locator resolved to <input value="" type="text" cmdk-input="" role="combobox" id="radix-:r5:" autocorrect="off" autocomplete="off" spellcheck="false" aria-expanded="true" aria-autocomplete="list" aria-controls="radix-:r3:" aria-labelledby="radix-:r4:" placeholder="Where would you like to go?" class="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"/>

```

# Page snapshot

```yaml
- generic:
  - generic [aria-hidden]:
    - generic:
      - banner:
        - link:
          - /url: "#main-content"
          - text: Skip to content
        - generic:
          - link:
            - /url: /
            - generic: typingforge.
          - navigation:
            - link:
              - /url: /
              - text: Test
            - link:
              - /url: /learn
              - text: Learn
            - link:
              - /url: /race
              - text: Race
            - link:
              - /url: /stats
              - text: Stats
            - link:
              - /url: /leaderboard
              - text: Rankings
            - link:
              - /url: /keyboard-lab
              - text: Keyboard Lab
          - generic:
            - button
            - link:
              - /url: /settings
            - link:
              - /url: /auth
              - generic: Sign in
      - main:
        - generic:
          - generic:
            - paragraph: Your daily moment of focus
            - heading [level=1]: Make every keystroke count.
            - paragraph: Find your rhythm. Build your accuracy. See your progress.
          - link:
            - /url: /learn
            - text: Build a stronger foundation
        - region:
          - generic:
            - group:
              - button [pressed]: Time
              - button: Words
              - button: Quote
              - button: Code
              - button: Custom
              - button: Zen
            - group:
              - button:
                - text: "15"
                - generic: seconds
              - button [pressed]:
                - text: "30"
                - generic: seconds
              - button:
                - text: "60"
                - generic: seconds
              - button:
                - text: "120"
                - generic: seconds
          - generic:
            - generic:
              - checkbox
              - text: Precision mode · stop on errors
            - generic:
              - text: Language
              - combobox
            - button: punctuation
            - button: "# numbers"
        - region:
          - generic:
            - generic:
              - generic:
                - generic: 30s
                - generic: remaining
              - generic: —wpm
              - generic: —acc %
            - generic: Ready when you are
          - generic:
            - generic:
              - generic [aria-hidden]:
                - generic:
                  - generic: l
                  - text: ow under more or ten care race space yes light head map number night six air foot second lean near grass some wait bring street riot line code to tea ratio say those thought house seven these life an game each room woman put era quite test sound cold a great wait sun young line dark thing draw silver voice earn safe practice rate into summer place quick root much train own so story code room try race iron zero copy some she terrain idea joke zinc keep plan turn snow five nine soft dark ear hard can home eye move six six not to large day five make ease year later how under this early state speed part word
              - paragraph: "Practice passage: low under more or ten care race space yes light head map number night six air foot second lean near grass some wait bring street riot line code to tea ratio say those thought house seven these life an game each room woman put era quite test sound cold a great wait sun young line dark thing draw silver voice earn safe practice rate into summer place quick root much train own so story code room try race iron zero copy some she terrain idea joke zinc keep plan turn snow five nine soft dark ear hard can home eye move six six not to large day five make ease year later how under this early state speed part word"
              - textbox
              - button:
                - generic: Click here or tab to start typing
                - generic: Your first character starts the clock
          - generic:
            - paragraph: Esc pauses · Ctrl+Enter finishes · Tab moves focus
            - generic:
              - button
              - button
              - button [disabled]: Finish
          - status: Ready to type
          - paragraph: Stay relaxed. Accuracy builds speed.
        - generic:
          - generic:
            - generic:
              - heading [level=2]: A quieter workspace
              - paragraph: Six practice modes. Your language, layout and pace.
          - link:
            - /url: /learn
            - generic:
              - heading [level=2]: Practice with purpose
              - paragraph: Adaptive lessons follow the keys that need your attention.
          - generic:
            - generic:
              - heading [level=2]: Progress you can trust
              - paragraph: Clear metrics and local history, even without an account.
      - contentinfo:
        - generic:
          - generic: A little practice. Lasting progress.
          - generic:
            - link:
              - /url: /about
              - text: About & metrics
            - link:
              - /url: /settings
              - text: Preferences & data
            - generic: Typing Forge © 2026
  - dialog [ref=e2]:
    - generic [ref=e3]:
      - heading "Typing Forge commands" [level=2] [ref=e5]
      - paragraph [ref=e6]: Search pages and themes. Use arrow keys and Enter to select.
      - combobox [expanded] [active] [ref=e11]
      - listbox "Suggestions" [ref=e12]:
        - generic [ref=e13]:
          - generic [aria-hidden] [ref=e14]: Go to
          - group "Go to" [ref=e15]:
            - option "Practice" [selected] [ref=e16]
            - option "Adaptive learning" [ref=e17]
            - option "Race" [ref=e18]
            - option "Progress and history" [ref=e19]
            - option "Rankings" [ref=e20]
            - option "Preferences" [ref=e21]
            - option "About & metrics" [ref=e22]
            - option "Keyboard Lab" [ref=e23]
          - generic [aria-hidden] [ref=e24]: Theme
          - group "Theme" [ref=e25]:
            - option "Forge dark" [ref=e26]
            - option "Forge light" [ref=e27]
            - option "Graphite" [ref=e28]
            - option "Midnight blue" [ref=e29]
            - option "Ember" [ref=e30]
            - option "Mono ink" [ref=e31]
            - option "Paper" [ref=e32]
            - option "Aurora" [ref=e33]
    - button "Close" [ref=e34]
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
  28 |   const dialog = page.getByRole('dialog', { name: 'Typing Forge commands', exact: true }); await expect(dialog).toBeVisible();
> 29 |   await dialog.getByRole('combobox').fill('Aurora'); await page.keyboard.press('Enter');
     |                                      ^ Error: locator.fill: Test timeout of 30000ms exceeded.
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