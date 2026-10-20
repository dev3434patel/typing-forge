import { chromium, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import axe from 'axe-core';
import { THEMES } from '../../src/lib/themes.ts';

const directory = 'audit/learning-upgrade-2026-10-20';
const build = JSON.parse(await readFile(`${directory}/source-build.json`, 'utf8')).local;
assert.deepEqual(await fetch('http://127.0.0.1:4173/offline-build.json').then(response => response.json()), build);
const browser = await chromium.launch();
const receipts = [], themes = [], errors = [];
try {
  const page = await browser.newPage();
  await page.addInitScript(() => localStorage.setItem('sparowtype.opening-animation.enabled', 'false'));
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [320, 360, 390, 768, 1024, 1280, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const [name, route] of [['test', '/'], ['adaptive', '/learn'], ['course', '/lessons'], ['lesson', '/lessons?lesson=home-anchors']]) {
      await page.goto(`http://127.0.0.1:4173${route}`);
      await expect(page.locator('main#main-content')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (name === 'lesson') await page.getByRole('button', { name: 'Start lesson', exact: true }).click();
      const result = await page.evaluate(() => {
        const board = document.querySelector('[data-testid="live-keyboard-board"]');
        const bounds = board?.getBoundingClientRect();
        const mainNav = document.querySelector('nav[aria-label="Main navigation"]');
        const visible = mainNav && getComputedStyle(mainNav).display !== 'none';
        const navBounds = mainNav?.getBoundingClientRect();
        const brand = document.querySelector('[aria-label="SparowType home"]')?.getBoundingClientRect();
        const controls = document.querySelector('header [aria-label$="theme"]')?.getBoundingClientRect();
        return { overflow: document.documentElement.scrollWidth > innerWidth + 1,
          keyboard: board ? { rows: board.querySelectorAll('.live-keyboard-row').length,
            keycaps: board.querySelectorAll('[data-key-code]').length,
            fits: [...board.querySelectorAll('[data-key-code]')].every(key => { const r=key.getBoundingClientRect(); return r.left >= bounds.left - 1 && r.right <= bounds.right + 1; }) } : null,
          desktopNavigationFits: !visible || navBounds.left >= brand.right - 1 && navBounds.right <= controls.left + 1 };
      });
      assert.equal(result.overflow, false, `${name} ${width}px overflow`);
      assert.equal(result.desktopNavigationFits, true, `${name} ${width}px navigation overlap`);
      if (result.keyboard) assert.deepEqual(result.keyboard, { rows: 5, keycaps: 61, fits: true });
      receipts.push({ width, name, route, ...result });
      if ([390, 1440].includes(width)) await page.screenshot({ path: `${directory}/after-${name}-${width}.png`, fullPage: true });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of THEMES) {
    await page.goto('http://127.0.0.1:4173/settings');
    await page.getByRole('button', { name: theme.name, exact: false }).click();
    for (const route of ['/lessons', '/lessons?lesson=home-anchors']) {
      await page.goto(`http://127.0.0.1:4173${route}`);
      await expect(page.locator('h1')).toBeVisible();
      await page.evaluate(axe.source);
      const result = await page.evaluate(async () => {
        const report = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
        return { violations: report.violations.map(({id, nodes}) => ({id, targets: nodes.map(node => node.target)})), incomplete: report.incomplete.map(rule => rule.id) };
      });
      themes.push({ theme: theme.id, route, ...result });
      assert.deepEqual(result.violations, [], `${theme.id} ${route}`);
      if (theme.id === 'sparow-light' && route === '/lessons') await page.screenshot({path:`${directory}/after-course-light-390.png`,fullPage:true});
    }
  }
  assert.deepEqual(errors, []);
  await writeFile(`${directory}/responsive-theme-receipt.json`, JSON.stringify({ build, browser: await browser.version(), receipts, themes, errors,
    limitation: 'Automated viewport and axe checks in local Chromium. Keycap labels are visual references, not touch targets. Incomplete accessibility rules and native devices remain manual checks.' }, null, 2));
  console.log(JSON.stringify({ viewports: 9, routeStates: receipts.length, themeViews: themes.length, errors }));
} finally { await browser.close(); }
