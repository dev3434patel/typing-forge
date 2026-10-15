import { test, expect } from '@playwright/test';

test('rankings explain challenge eligibility without presenting practice as verified scores', async ({ page }) => {
  await page.goto('/leaderboard');
  await expect(page.getByRole('heading', { name: 'The leaderboard.', exact: true })).toBeVisible();
  await expect(page.getByText(/Rankings require an authenticated, server issued timed challenge and replay validation\./)).toBeVisible();
  await page.getByRole('link', { name: 'Take a ranked challenge', exact: true }).click();
  await expect(page).toHaveURL('/ranked');
  await expect(page.getByRole('link', { name: 'Sign in to start', exact: true })).toHaveAttribute('href', '/auth');
  await expect(page.getByRole('button', { name: 'Start ranked challenge', exact: true })).toHaveCount(0);
});
