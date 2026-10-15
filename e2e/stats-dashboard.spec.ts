import { test, expect } from '@playwright/test';
import { completeCorrectedCat } from './helpers';

test('actual guest history survives reload without duplicate completion', async ({ page }) => {
  await completeCorrectedCat(page);
  await expect(page.getByRole('status').filter({ hasText: /saved.*device|saved.*locally|local.*saved/i })).toBeVisible();
  await page.goto('/stats');
  const table = page.getByRole('table', { name: 'Completed sessions, most recent first', exact: true });
  await expect(table.getByRole('row')).toHaveCount(2); await expect(table.getByRole('row').nth(1)).toContainText('75.0%');
  await page.reload();
  await expect(table.getByRole('row')).toHaveCount(2); await expect(table.getByRole('row').nth(1)).toContainText('custom');
  await expect(page.getByText('Completed sessions', { exact: true }).locator('..').getByText('1', { exact: true })).toBeVisible();
});

test('empty history gives an actionable state without invented scores', async ({ page }) => {
  await page.goto('/stats');
  await expect(page.getByRole('heading', { name: 'Your next session starts your story.', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start typing', exact: true })).toHaveAttribute('href', '/');
  await expect(page.getByRole('table')).toHaveCount(0);
});
