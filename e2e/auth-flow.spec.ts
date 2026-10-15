import { test, expect } from '@playwright/test';

test('account form switches between sign in and creation using labelled controls', async ({ page }) => {
  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: 'Welcome Back', exact: true })).toBeVisible();
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible(); await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: "Don't have an account? Sign up", exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Create Account', exact: true })).toBeVisible();
  await expect(page.getByLabel('Username', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Already have an account? Sign in', exact: true }).click();
  await expect(page.getByLabel('Username', { exact: true })).toHaveCount(0);
});

test('guest practice remains reachable from the account screen', async ({ page }) => {
  await page.goto('/auth'); await page.getByRole('link', { name: '← Back to typing', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Typing input', exact: true })).toBeVisible();
});

test('real account sign in with dedicated deployment credentials', async ({ page }) => {
  test.skip(!process.env.FORGE_E2E_AUTH_EMAIL || !process.env.FORGE_E2E_AUTH_PASSWORD, 'Set dedicated FORGE_E2E_AUTH_EMAIL and FORGE_E2E_AUTH_PASSWORD against the deployed test backend; no fake token is used.');
  await page.goto('/auth'); await page.getByLabel('Email', { exact: true }).fill(process.env.FORGE_E2E_AUTH_EMAIL!);
  await page.getByLabel('Password', { exact: true }).fill(process.env.FORGE_E2E_AUTH_PASSWORD!);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click(); await expect(page).toHaveURL('/');
  await page.goto('/profile'); await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
});
