import { chromium, firefox, webkit } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const output = new URL('./source32-native-browser-semantics-result.json', import.meta.url);
const files = ['src/components/keybr/KeybrLessonMode.tsx', 'e2e/learning-v3.spec.ts'];
const fingerprint = async () => Object.fromEntries(await Promise.all(files.map(async path =>
  [path, createHash('sha256').update(await readFile(path)).digest('hex')])));
const before = await fingerprint();
const receipt = { startedAt: new Date().toISOString(), plan: 'source32-native-browser-semantics-plan.json',
  scope: 'Standalone textarea diagnostic only; no app or backend', before, browsers: [], errors: [] };
for (const name of ['chromium', 'edge', 'firefox', 'webkit']) {
  let browser;
  let context;
  const result = { name, cases: [] };
  try {
    const engine = name === 'firefox' ? firefox : name === 'webkit' ? webkit : chromium;
    browser = await engine.launch({ headless: true, ...(name === 'edge' ? { channel: 'msedge' } : {}), timeout: 45000 });
    result.version = browser.version();
    context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    await page.setContent('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Public native input diagnostic</title></head><body><label for="draft">Public diagnostic textarea</label><textarea id="draft"></textarea></body></html>');
    const setup = await page.evaluate(() => {
      const field = document.querySelector('textarea');
      const points = value => Array.from(value ?? '').slice(0, 32).map(char => `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`);
      const events = [];
      for (const type of ['beforeinput', 'input', 'textInput', 'compositionstart', 'compositionupdate', 'compositionend']) {
        field.addEventListener(type, event => {
          if (events.length >= 32) return;
          events.push({ event: event.type, trusted: event.isTrusted, cancelable: event.cancelable,
            prevented: event.defaultPrevented, inputType: typeof event.inputType === 'string' ? event.inputType : null,
            isComposing: typeof event.isComposing === 'boolean' ? event.isComposing : null,
            data: points(event.data), nativeValue: points(field.value) });
        });
      }
      Object.assign(window, { nativeSemantics: { events, points } });
      const constructed = ['insertFromComposition', 'insertCompositionText', 'insertText'].map(inputType => {
        const event = new InputEvent('input', { bubbles: true, inputType, data: 'é' });
        return { requestedType: inputType, actualType: event.inputType, data: points(event.data),
          trusted: event.isTrusted, cancelable: event.cancelable, isComposing: event.isComposing };
      });
      field.value = 'a\r\nb';
      const assignmentCrLf = points(field.value);
      field.value = '';
      return { constructed, assignmentCrLf };
    });
    Object.assign(result, setup);
    for (const [label, text] of [['accent', 'é'], ['crlf', 'a\r\nb'], ['lf', 'a\nb']]) {
      await page.locator('textarea').evaluate(field => {
        field.value = '';
        window.nativeSemantics.events.length = 0;
      });
      await page.locator('textarea').focus();
      await page.keyboard.insertText(text);
      const observation = await page.locator('textarea').evaluate(field => ({
        events: window.nativeSemantics.events.slice(),
        value: window.nativeSemantics.points(field.value),
        codePointCount: Array.from(field.value).length,
      }));
      result.cases.push({ label, requestedCodePoints: Array.from(text).map(char => `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`), ...observation });
    }
    result.status = 'OBSERVED';
  } catch (error) {
    result.status = 'ERROR';
    result.error = String(error?.stack ?? error);
    receipt.errors.push({ browser: name, error: result.error });
  } finally {
    await context?.close().catch(() => undefined);
    await browser?.close().catch(() => undefined);
    result.closed = true;
    receipt.browsers.push(result);
    await writeFile(output, JSON.stringify(receipt, null, 2));
    console.log(JSON.stringify({ name, status: result.status, closed: result.closed, cases: result.cases.length }));
  }
}
receipt.after = await fingerprint();
receipt.sourceAndTestUnchanged = JSON.stringify(receipt.before) === JSON.stringify(receipt.after);
receipt.finishedAt = new Date().toISOString();
receipt.status = receipt.errors.length === 0 && receipt.sourceAndTestUnchanged ? 'OBSERVED' : 'FAILED';
await writeFile(output, JSON.stringify(receipt, null, 2));
if (receipt.status !== 'OBSERVED') process.exitCode = 1;
