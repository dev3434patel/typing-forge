# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-flow.spec.ts >> guest practice remains reachable from the account screen
- Location: e2e\auth-flow.spec.ts:14:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('textbox', { name: 'Typing input', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('textbox', { name: 'Typing input', exact: true }) with timeout 5000ms
  - waiting for getByRole('textbox', { name: 'Typing input', exact: true })

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
  3  | test('account form switches between sign in and creation using labelled controls', async ({ page }) => {
  4  |   await page.goto('/auth');
  5  |   await expect(page.getByRole('heading', { name: 'Welcome Back', exact: true })).toBeVisible();
  6  |   await expect(page.getByLabel('Email', { exact: true })).toBeVisible(); await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  7  |   await page.getByRole('button', { name: "Don't have an account? Sign up", exact: true }).click();
  8  |   await expect(page.getByRole('heading', { name: 'Create Account', exact: true })).toBeVisible();
  9  |   await expect(page.getByLabel('Username', { exact: true })).toBeVisible();
  10 |   await page.getByRole('button', { name: 'Already have an account? Sign in', exact: true }).click();
  11 |   await expect(page.getByLabel('Username', { exact: true })).toHaveCount(0);
  12 | });
  13 | 
  14 | test('guest practice remains reachable from the account screen', async ({ page }) => {
  15 |   await page.goto('/auth'); await page.getByRole('link', { name: '← Back to typing', exact: true }).click();
> 16 |   await expect(page.getByRole('textbox', { name: 'Typing input', exact: true })).toBeVisible();
     |                                                                                  ^ Error: expect(locator).toBeVisible() failed
  17 | });
  18 | 
  19 | test('real account sign in with dedicated deployment credentials', async ({ page }) => {
  20 |   test.skip(!process.env.FORGE_E2E_AUTH_EMAIL || !process.env.FORGE_E2E_AUTH_PASSWORD, 'Set dedicated FORGE_E2E_AUTH_EMAIL and FORGE_E2E_AUTH_PASSWORD against the deployed test backend; no fake token is used.');
  21 |   await page.goto('/auth'); await page.getByLabel('Email', { exact: true }).fill(process.env.FORGE_E2E_AUTH_EMAIL!);
  22 |   await page.getByLabel('Password', { exact: true }).fill(process.env.FORGE_E2E_AUTH_PASSWORD!);
  23 |   await page.getByRole('button', { name: 'Sign In', exact: true }).click(); await expect(page).toHaveURL('/');
  24 |   await page.goto('/profile'); await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  25 | });
  26 | 
```