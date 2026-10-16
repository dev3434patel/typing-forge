import { chromium, firefox, webkit } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const records = [];
for (const [name, engine, options] of [['chromium', chromium, {}], ['firefox', firefox, {}], ['webkit', webkit, {}], ['edge', chromium, { channel: 'msedge' }]]) {
  const browser = await engine.launch(options);
  try {
    const page = await browser.newPage();
    const capabilities = await page.evaluate(() => ({
      audioContext: typeof window.AudioContext,
      prefixedAudioContext: typeof window.webkitAudioContext,
      offlineAudioContext: typeof window.OfflineAudioContext,
      serviceWorker: 'serviceWorker' in navigator,
      webgl2: Boolean(document.createElement('canvas').getContext('webgl2')),
      hardwareConcurrency: navigator.hardwareConcurrency,
      userAgent: navigator.userAgent
    }));
    records.push({ name, version: browser.version(), ...capabilities });
  } finally { await browser.close(); }
}
await writeFile('audit/keyboard-awakens-2026-10-16/browser-capabilities.json', JSON.stringify(records, null, 2));
console.log(JSON.stringify(records, null, 2));
