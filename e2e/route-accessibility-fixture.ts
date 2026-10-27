import { expect, type Page, type TestInfo } from '@playwright/test';
import axe from 'axe-core';
import { settlePageVisuals } from './helpers';

/** Real rendered geometry and WCAG2.2AA on an explicitly populated route fixture. */
export async function auditPopulatedRoute(page: Page, info: TestInfo, state: string) {
  const main = page.locator('main#main-content');
  await expect(main).toBeVisible();
  await settlePageVisuals(page);
  // Playwright evaluation executes the bundled tool without injecting a script
  // element or weakening the application's script-src CSP.
  await page.evaluate(axe.source);
  const violations = await page.evaluate(async () => {
    const tool = (window as unknown as { axe: typeof axe }).axe;
    const result = await tool.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
    return result.violations.map(violation => ({ id: violation.id, impact: violation.impact, description: violation.description,
      nodes: violation.nodes.map(node => ({ target: node.target, html: node.html, failureSummary: node.failureSummary })) }));
  });
  const controls = await main.locator('button:visible, input:not([type="hidden"]):visible, select:visible, a[href]:visible').evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return { tag: element.tagName.toLowerCase(), label: element.getAttribute('aria-label') ?? element.textContent?.trim() ?? '', width: rect.width, height: rect.height };
  }));
  const viewport = await page.evaluate(() => ({ innerWidth, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, height: innerHeight }));
  const undersized = controls.filter(control => control.width < 44 - 0.02 || control.height < 44 - 0.02);
  await info.attach(`${state}-accessibility-and-targets`, { contentType: 'application/json', body: JSON.stringify({ state, viewport, scope: 'Populated owned API fixture; rendered full-document WCAG2.2AA and all visible main-route interactive controls. Physical assistive technology remains separate.', violations, controls, undersized }, null, 2) });
  expect(violations, `${state}: automated WCAG2.2AA`).toEqual([]);
  expect(viewport.scrollWidth, `${state}: no horizontal document overflow`).toBeLessThanOrEqual(viewport.innerWidth + 1);
  expect(controls.length, `${state}: actual interactive controls must be rendered`).toBeGreaterThan(0);
  expect(undersized, `${state}: each visible main-route control has a44px target with at most0.02px floating-point tolerance`).toEqual([]);
}
