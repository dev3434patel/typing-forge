import { chromium } from '@playwright/test';
import axe from 'axe-core';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:4173/lessons');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(axe.source);
  const result = await page.evaluate(async () => {
    const build = await fetch('/offline-build.json').then(response => response.json());
    const report = await window.axe.run(document, { runOnly: ['label-content-name-mismatch'] });
    window.axe.setup(document);
    return {
      build,
      violations: report.violations.map(rule => ({ id: rule.id, nodes: rule.nodes.map(node => ({ target: node.target, html: node.html })) })),
      buttons: [...document.querySelectorAll('.course-lesson')].slice(0, 6).map(button => ({
        text: button.innerText,
        accessible: window.axe.commons.text.accessibleText(button),
        visible: window.axe.commons.text.visible(button),
        labelledBy: button.getAttribute('aria-labelledby'),
        describedBy: button.getAttribute('aria-describedby'),
      })),
    };
  });
  await writeFile('audit/learning-upgrade-2026-10-20/course-accessible-names.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
