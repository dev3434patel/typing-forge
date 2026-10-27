import { spawn } from 'node:child_process';
import { readFile, writeFile, access, open } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { summarizeReport } from './summarize-browsers.mjs';

const projects = ['chromium', 'edge', 'firefox', 'webkit'];
const identity = value => JSON.stringify([value.project, value.file, value.titlePath]);
const posix = value => value.replaceAll('\\', '/');

export function reportCases(report) {
  const cases = [];
  const visit = (suite, parents = []) => {
    const isFileSuite = suite.file && posix(suite.title ?? '') === posix(suite.file);
    const titles = suite.title && !isFileSuite ? [...parents, suite.title] : parents;
    for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
      const file = posix(spec.file ?? suite.file);
      cases.push({ project: test.projectName, file, titlePath: [...titles, spec.title],
        specId: spec.id, timeout: test.timeout, status: test.status, results: test.results ?? [] });
    }
    for (const child of suite.suites ?? []) visit(child, titles);
  };
  for (const suite of report.suites ?? []) visit(suite);
  return cases;
}

export function createQuietPlan(source) {
  const cases = reportCases(source);
  const failed = cases.filter(value => value.status === 'unexpected');
  assert.equal(failed.length, source.stats.unexpected, 'Every reported failure must be selected.');
  const selected = new Map();
  for (const original of failed) selected.set(identity(original), {
    ...original, results: undefined, status: undefined, originalFailure: true,
    originalSpecId: original.specId, originalTimeoutMs: original.timeout, addedScopes: [],
  });
  const supplements = [
    ['startup-recovery.spec.ts', 'startup recovers from real workspace script and stylesheet failures at 320px without losing guest history', 'startup-and-recovery'],
    ['startup-recovery.spec.ts', 'an unavailable home-page chunk does not block account access or local history', 'unused-home-dependency-regression'],
    ...[390, 1440].map(width => ['accessibility-audit.spec.ts', `existing guest pages and completed results meet automated accessibility rules at ${width}px`, 'all-page-boot-and-accessibility']),
  ];
  for (const project of projects) for (const [file, title, scope] of supplements) {
    const item = { project, file, titlePath: [title] };
    const key = identity(item);
    const existing = selected.get(key);
    if (existing) existing.addedScopes.push(scope);
    else selected.set(key, { ...item, originalFailure: false, addedScopes: [scope] });
  }
  const selection = [...selected.values()].sort((a, b) =>
    projects.indexOf(a.project) - projects.indexOf(b.project) ||
    a.file.localeCompare(b.file) || a.titlePath.join(' › ').localeCompare(b.titlePath.join(' › ')));
  for (const item of selection) {
    assert.ok(projects.includes(item.project));
    assert.ok(item.file.endsWith('.spec.ts') && !item.file.includes('..'));
    item.testListLine = `[${item.project}] › ${item.file} › ${item.titlePath.join(' › ')}`;
  }
  return { originalFailureCount: failed.length, supplementalRequestedCases: supplements.length * projects.length,
    addedUniqueCases: selection.filter(value => !value.originalFailure).length,
    overlapCases: selection.filter(value => value.originalFailure && value.addedScopes.length).length,
    totalSelectedCases: selection.length, selection };
}

async function main() {
  const directory = path.resolve('audit/mobile-games-static-2026-10-20');
  const phase = process.argv[2];
  assert.match(phase ?? '', /^after-[1-9][0-9]*$/);
  const sourceFile = path.resolve(process.argv[3] ?? `${directory}/after-4-browser-ordinary.json`);
  const sourceText = await readFile(sourceFile, 'utf8');
  const source = JSON.parse(sourceText);
  assert.equal(reportCases(source).length, 868, 'Require the complete preserved ordinary report.');
  assert.equal(source.stats.expected + source.stats.unexpected + source.stats.skipped + source.stats.flaky, 868);
  assert.equal(source.stats.unexpected, 19, 'The declared confirmation covers all19 original failed cases.');
  const plan = createQuietPlan(source);
  assert.equal(plan.totalSelectedCases, 34);
  const build = JSON.parse(await readFile(`${directory}/${phase}-build.json`, 'utf8')).local;
  const prefix = `${phase}-quiet-confirmation`;
  const protocolFile = `${directory}/${prefix}-protocol.json`;
  const reportFile = `${directory}/${prefix}.json`;
  const testListFile = `${directory}/${prefix}-test-list.txt`;
  const logFile = `${directory}/${prefix}.log`;
  for (const file of [protocolFile, reportFile, testListFile, logFile, `${directory}/${prefix}-summary.json`])
    await assert.rejects(access(file), { code: 'ENOENT' }, `Preserve existing evidence: ${file}`);
  const baseURL = 'http://127.0.0.1:4173';
  assert.deepEqual(await fetch(`${baseURL}/offline-build.json`).then(response => response.json()), build);
  const protocol = { declaredAt: new Date().toISOString(), phase, build, baseURL, browsers: projects,
    workers: 1, automaticRetries: 0, resultFiltering: false, modifiedTestBudgets: false,
    sourceFile, sourceSha256: createHash('sha256').update(sourceText).digest('hex'),
    sourceStats: source.stats, plan,
    method: 'Exact original project/file/full-title identities through Playwright --test-list, plus both unchanged startup tests and both full-page accessibility sizes across4engines. Original failure outcomes and newly added outcomes are reported separately. Cold/reload is already in the separate isolated group.',
    completed: false };
  await writeFile(protocolFile, JSON.stringify(protocol, null, 2));
  await writeFile(testListFile, plan.selection.map(value => value.testListLine).join('\n') + '\n');
  const handle = await open(logFile, 'wx');
  const args = ['node_modules/@playwright/test/cli.js', 'test', '--test-list', testListFile,
    '--workers=1', '--retries=0', '--reporter=list,json',
    `--output=${directory}/.playwright-artifacts-${prefix}`];
  console.log(JSON.stringify({ phase, build: build.version, original: plan.originalFailureCount,
    addedUnique: plan.addedUniqueCases, total: plan.totalSelectedCases, workers: 1, retries: 0 }));
  const started = performance.now();
  let code;
  try {
    code = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, { windowsHide: true,
        env: { ...process.env, PLAYWRIGHT_BASE_URL: baseURL, PLAYWRIGHT_BROWSERS: projects.join(','),
          PLAYWRIGHT_JSON_OUTPUT_NAME: reportFile }, stdio: ['ignore', handle.fd, handle.fd] });
      child.once('error', reject); child.once('exit', resolve);
    });
  } finally { await handle.close(); }
  const result = JSON.parse(await readFile(reportFile, 'utf8'));
  const actual = reportCases(result);
  const byIdentity = new Map(actual.map(value => [identity(value), value]));
  const integrityErrors = [];
  if (actual.length !== plan.totalSelectedCases) integrityErrors.push(`Expected34 selected outcomes; recorded${actual.length}.`);
  const outcomes = plan.selection.map(item => {
    const observed = byIdentity.get(identity(item));
    if (!observed) integrityErrors.push(`Missing exact case: ${item.testListLine}`);
    if (observed && item.originalFailure && observed.timeout !== item.originalTimeoutMs)
      integrityErrors.push(`Original timeout changed: ${item.testListLine}`);
    return { ...item, observedSpecId: observed?.specId ?? null, status: observed?.status ?? 'MISSING',
      attempts: observed?.results.map(attempt => ({ status: attempt.status, retry: attempt.retry, duration: attempt.duration })) ?? [] };
  });
  const sourceKeys = new Set(plan.selection.map(identity));
  for (const item of actual) if (!sourceKeys.has(identity(item))) integrityErrors.push(`Unexpected extra case: ${identity(item)}`);
  const summary = { ...summarizeReport(result), integrityErrors,
    originalFailureConfirmations: outcomes.filter(value => value.originalFailure),
    addedUniqueConfirmations: outcomes.filter(value => !value.originalFailure),
    scope: 'A separate final-build confirmation of retained original failures and explicitly added route/recovery/a11y cases. It does not erase prior failures or establish their root cause.' };
  protocol.completed = true;
  protocol.finishedAt = new Date().toISOString();
  protocol.exitCode = code;
  protocol.durationMs = performance.now() - started;
  protocol.integrityErrors = integrityErrors;
  await writeFile(`${directory}/${prefix}-summary.json`, JSON.stringify(summary, null, 2));
  await writeFile(protocolFile, JSON.stringify(protocol, null, 2));
  assert.deepEqual(await fetch(`${baseURL}/offline-build.json`).then(response => response.json()), build);
  console.log(JSON.stringify({ code, totals: summary.totals, integrityErrors, reportFile }));
  if (code !== 0 || integrityErrors.length) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url)
  await main();
