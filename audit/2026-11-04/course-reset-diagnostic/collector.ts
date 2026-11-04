import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { Page, TestInfo } from '@playwright/test';
import { installCourseResetProbe } from './observer';

const directory = 'audit/2026-11-04';
const eventsFile = path.resolve(directory, 'source34-course-reset-native-events.jsonl');
const observationFile = path.resolve(directory, 'source34-course-reset-native-observation.json');
const maximumRows = 400;
const rows: Record<string, unknown>[] = [];
let began = 0, dropped = 0, rejected = 0;
const keys = new Set(['version','sequence','documentTimeOrigin','elapsedMs','type','phase','streamErrors','observerErrors','inputNode','mainNode','firstInputNode','firstMainNode','sameInput','sameMain','inputConnected','inputFocused','inputValue','guestHeading','guestResetButton','resetDisabled','workingButton','workspaceResetPresent','workspaceResetAt','progressionResetPresent','progressionResetAt','requestedValue','setterNode','setterConnected','trusted','eventNode','eventConnected','guestEvent','succeeded','resetAt']);
const stringValues: Record<string, readonly string[]> = {
  type: ['probe','focus','blur','beforeinput','input','change','value-setter','sparowtype:workspace-reset','sparowtype:workspace-reset-result','storage','dom','document'],
  phase: ['attached','setter-installed','setter-unavailable','microtask','animation-frame','after-native','capture','known-guest-reset','changed','pagehide'],
  inputValue: ['absent','','DELETE','other'], requestedValue: ['','DELETE'],
};
function append(row: Record<string, unknown>) {
  if (rows.length >= maximumRows) { dropped++; return; }
  const value = { nodeElapsedMs: Math.round((performance.now() - began) * 1000) / 1000, ...row };
  rows.push(value);
  // Each bounded scalar row survives a later test/browser timeout.
  appendFileSync(eventsFile, JSON.stringify(value) + '\n', 'utf8');
}
export function diagnosticPhase(label: string) {
  if (!/^case-start$|^(?:before|after)-await-[0-9]{2}$/.test(label)) throw new Error('Unknown diagnostic milestone.');
  append({ kind: 'phase', label });
}
export async function beginCourseResetDiagnostic(page: Page, info: TestInfo) {
  if (process.env.SPAROWTYPE_COURSE_RESET_DIAGNOSTIC !== '1') throw new Error('Coordinated audit-only diagnostic required.');
  began = performance.now();
  append({ kind: 'lifecycle', label: 'beforeEach', testTimeoutMs: info.timeout });
  await page.exposeBinding('__sparowCourseResetDiagnostic', (_source, input: unknown) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) { rejected++; return; }
    const row = input as Record<string, unknown>;
    if (Object.entries(row).some(([key,value]) => !keys.has(key) || (typeof value === 'string' ? !stringValues[key]?.includes(value) : value !== null && typeof value !== 'boolean' && !(typeof value === 'number' && Number.isFinite(value))))) { rejected++; return; }
    append({ kind: 'browser', ...row });
  });
  await page.addInitScript(installCourseResetProbe);
  page.on('framenavigated', frame => {
    if (frame !== page.mainFrame()) return;
    const pathname = new URL(frame.url()).pathname;
    append({ kind: 'navigation', pathname: ['/lessons','/profile','/'].includes(pathname) ? pathname : 'other' });
  });
  page.on('pageerror', error => append({ kind: 'pageerror', errorName: /^[A-Za-z]+Error$/.test(error.name) ? error.name : 'Error', messageSha256: createHash('sha256').update(error.message).digest('hex') }));
}
export async function finishCourseResetDiagnostic(info: TestInfo) {
  append({ kind: 'lifecycle', label: 'afterEach', status: info.status ?? 'unknown', errorCount: info.errors.length });
  const report = { status: 'DIAGNOSTIC-OBSERVATION-ONLY', actualTestStatus: info.status, originalTimeoutMs: info.timeout, rows: rows.length, dropped, rejected, maximumRows, nativeActionsChanged: false, helperChanged: false, noAdditionalFlowWaits: true, recordsFile: path.relative(process.cwd(), eventsFile).replaceAll('\\','/'), recordsSha256: createHash('sha256').update(readFileSync(eventsFile)).digest('hex') };
  writeFileSync(observationFile, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  await info.attach('bounded-course-reset-observation', { contentType: 'application/json', body: JSON.stringify(report) });
}
