import { test, expect } from '@playwright/test';
import { phpApiBase } from './php-api-fixture';

test.beforeEach(async ({ page, baseURL }, info) => {
  // Account flows are independent of the separately tested opening animation.
  await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
  if (info.title !== 'real account sign in with dedicated deployment credentials') {
    const api = phpApiBase(baseURL!);
    await page.route(`${api.href}**`, route => new URL(route.request().url()).pathname.endsWith('/auth/session')
      ? route.fulfill({ json: { user: null, csrfToken: 'form-fixture-csrf' } })
      : route.fulfill({ status: 503, json: { error: { code: 'fixture-unconfigured', message: 'This form fixture does not make account requests.' } } }));
  }
});

test('account form switches between sign in and creation using labelled controls', async ({ page }) => {
  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: 'Welcome Back', exact: true })).toBeVisible();
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible(); await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: "Don't have an account? Sign up", exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Create Account', exact: true })).toBeVisible();
  await expect(page.getByText('Choose your public handle in Profile after signing in. Your email stays private.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Username', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Already have an account? Sign in', exact: true }).click();
  await expect(page.getByLabel('Username', { exact: true })).toHaveCount(0);
});

test('guest practice remains reachable from the account screen', async ({ page }) => {
  await page.goto('/auth'); await page.getByRole('link', { name: '← Back to typing', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Typing input', exact: true })).toBeVisible();
});

test('account entrance respects reduced motion and exposes password-manager semantics', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const samples: string[] = [];
    Object.assign(window, { authEntranceOpacity: samples });
    new MutationObserver(() => {
      const card = document.querySelector('main > div');
      if (card) samples.push(getComputedStyle(card).opacity);
    }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  });
  await page.goto('/auth');
  const email = page.getByLabel('Email', { exact: true });
  const password = page.getByLabel('Password', { exact: true });
  await expect(email).toHaveAttribute('autocomplete', 'email');
  await expect(password).toHaveAttribute('autocomplete', 'current-password');
  const samples = await page.evaluate(() => (window as Window & { authEntranceOpacity: string[] }).authEntranceOpacity);
  expect(samples.length).toBeGreaterThan(0);
  expect(samples.every(value => value === '1'), JSON.stringify(samples)).toBe(true);
  await page.getByRole('button', { name: "Don't have an account? Sign up", exact: true }).click();
  await expect(password).toHaveAttribute('autocomplete', 'new-password');
});

test('real account sign in with dedicated deployment credentials', async ({ page }) => {
  test.skip(!process.env.FORGE_E2E_AUTH_EMAIL || !process.env.FORGE_E2E_AUTH_PASSWORD, 'Set dedicated FORGE_E2E_AUTH_EMAIL and FORGE_E2E_AUTH_PASSWORD against the deployed test backend; no fake token is used.');
  await page.goto('/auth'); await page.getByLabel('Email', { exact: true }).fill(process.env.FORGE_E2E_AUTH_EMAIL!);
  await page.getByLabel('Password', { exact: true }).fill(process.env.FORGE_E2E_AUTH_PASSWORD!);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click(); await expect(page).toHaveURL('/');
  await page.goto('/profile'); await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
});
