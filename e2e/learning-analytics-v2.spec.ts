import { expect, test } from '@playwright/test';
import axe from 'axe-core';
import { readFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync(new URL('../backend/resources/typing-course-v1.json', import.meta.url), 'utf8')) as { lessons: Array<{ id: string }> };
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
});
test('placement stays optional and a locked skill remains freely explorable without a checkpoint', async ({ page }) => {
  await page.goto(`/lessons?lesson=${catalog.lessons[5].id}`);
  await expect(page.getByRole('heading', { name: 'Practice assist', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start free practice', exact: true }).click();
  const input = page.getByRole('textbox', { name: 'Typing input', exact: true });
  await input.focus(); await input.pressSequentially('abc', { delay: 100 });
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await expect(page.getByText('Personal practice; no course checkpoint awarded.', { exact: false })).toBeVisible();
  await expect(page.getByText('0 of 2 checkpoints', { exact: true })).toBeVisible();
});
test('optional placement can start and be left without creating a result or blocking the course', async ({ page }) => {
  await page.goto('/lessons');
  await page.getByRole('button', { name: 'Try optional placement', exact: true }).click();
  await expect(page.getByText('Placement part 1 of 3', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Leave practice', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start learning', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your placementV1 guidance', exact: true })).toHaveCount(0);
});
test('dashboard presents accessible empty evidence without inventing PBs or stars', async ({ page }) => {
  await page.goto('/stats');
  await expect(page.getByRole('heading', { name: 'Learning dashboard', exact: true })).toBeVisible();
  await page.getByText('Course stars and comparison bests', { exact: true }).click();
  await expect(page.getByText('A qualifying course attempt starts your star record.', { exact: true })).toBeVisible();
  await page.evaluate(axe.source);
  const violations = await page.evaluate(async () => (window as typeof window & { axe: typeof axe }).axe.run(document).then(result => result.violations));
  expect(violations).toEqual([]);
});
