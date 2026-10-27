import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, open, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';

// Preparation does not run this file. Explicit parent-coordinated execution is
// required: both Vite builds and every browser run are deliberately sequential.
assert.equal(process.env.SPAROWTYPE_STATIC_ACCEPTANCE, '1', 'Set SPAROWTYPE_STATIC_ACCEPTANCE=1 only in the coordinated static window.');
const root = path.resolve(import.meta.dirname, '../..');
process.chdir(root);
const prefix = process.argv[2] || 'final10';
assert.match(prefix, /^final10(?:-[a-z0-9]+)*$/);
assert.equal(process.argv.length <= 3, true, 'Only an optional unique final10 prefix is accepted.');
const audit = path.join(root, 'audit/2026-10-21');
const sourceFile = 'audit/2026-10-21/final10-source.json';
const expectedBuild = process.env.SPAROWTYPE_FINAL10_BUILD_ID;
assert.match(expectedBuild ?? '', /^[a-f0-9]{20}$/, 'Supply the actual frozen final10 build ID explicitly after source/build acceptance.');
const directories = [`dist-static-${prefix}-vercel`, `dist-static-${prefix}-pages`];
const runDirectory = path.join(audit, `.playwright-artifacts-${prefix}-static-run`);
const screenshotDirectory = path.join(audit, `${prefix}-static-screenshots`);
const protocolPath = path.join(audit, `${prefix}-static-protocol.json`);
const summaryPath = path.join(audit, `${prefix}-static-process.json`);
const generatedConfigPath = path.join(audit, `.${prefix}-static-game.generated.mjs`);
const generatedSpecPath = path.join(runDirectory, 'frontend-game.generated.spec.ts');
const verifierReportPath = path.join(audit, `${prefix}-static-artifacts.json`);
const originalSpec = 'e2e/frontend-game-accessibility.spec.ts';
const projects = ['chromium', 'edge', 'firefox', 'webkit'];
const relative = file => path.relative(root, file).replaceAll('\\', '/');
const exists = async file => { try { await stat(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };
const initial = await verifyFrozenSource(sourceFile);
assert.equal(initial.frozen.local.version, expectedBuild);
assert.deepEqual(initial.receipt.mismatches, [], 'The product must still match the declared final10 source.');
const defaultBuild = await readFile('dist/offline-build.json');
assert.deepEqual(JSON.parse(defaultBuild), initial.frozen.local, 'The default artifact must remain final10.');
for (const file of [...directories, runDirectory, screenshotDirectory, protocolPath, summaryPath, generatedConfigPath, verifierReportPath]) {
  assert.equal(await exists(file), false, `Refusing to replace an existing artifact: ${relative(path.resolve(file))}`);
}
await mkdir(runDirectory);
await mkdir(screenshotDirectory);

const trackedToolInputs = [
  relative(import.meta.filename), 'package.json', 'package-lock.json', 'playwright.config.ts',
  'scripts/build-frontend.mjs', 'audit/2026-10-21/artifact-verification.mjs',
  'audit/2026-10-21/verify-static-artifacts.mjs', sourceFile,
  ...(await readdir('e2e', { withFileTypes: true })).filter(entry => entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name)).map(entry => `e2e/${entry.name}`),
].sort();
const inputHashes = Object.fromEntries(await Promise.all(trackedToolInputs.map(async file => [file, hash(await readFile(file))])));
const expectedPublicHashes = {};
const visitPublic = async (directory, parent = '') => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert.equal(entry.isSymbolicLink(), false, 'The default artifact must not contain symlinks.');
    const name = path.posix.join(parent, entry.name);
    if (entry.isDirectory()) await visitPublic(path.join(directory, entry.name), name);
    else { assert.ok(entry.isFile()); expectedPublicHashes[name] = hash(await readFile(path.join(directory, entry.name))); }
  }
};
await visitPublic('dist');

// Only artifact output names and the moved helper import differ. All original
// actions, timing, assertions and test definitions remain byte-for-byte intact.
const original = await readFile(originalSpec, 'utf8');
const replacements = [
  { from: 'from "./frontend-static-server"', to: 'from "../../../e2e/frontend-static-server"', expected: 1 },
  {
    from: 'audit/mobile-games-static-2026-10-20/static-${server.deployment.target}-games-ready-1440.png',
    to: `${relative(screenshotDirectory)}/\${info.project.name}-static-\${server.deployment.target}-games-ready-1440.png`, expected: 1,
  },
  {
    from: 'audit/mobile-games-static-2026-10-20/static-${server.deployment.target}-games-playing-390.png',
    to: `${relative(screenshotDirectory)}/\${info.project.name}-static-\${server.deployment.target}-games-playing-390.png`, expected: 1,
  },
];
let generated = original;
for (const replacement of replacements) {
  assert.equal(generated.split(replacement.from).length - 1, replacement.expected, 'The frozen screenshot/import adapter must match exactly once.');
  generated = generated.replace(replacement.from, replacement.to);
}
let reversed = generated;
for (const replacement of [...replacements].reverse()) reversed = reversed.replace(replacement.to, replacement.from);
assert.equal(reversed, original, 'No actions, assertions, timing, or test definitions may change in the audit adapter.');
await writeFile(generatedSpecPath, generated, { flag: 'wx' });
const configuration = `import base from '../../playwright.config.ts';\nimport { defineConfig } from '@playwright/test';\nexport default defineConfig({ ...base, testDir: ${JSON.stringify(runDirectory)}, testMatch: 'frontend-game.generated.spec.ts', webServer: undefined });\n`;
await writeFile(generatedConfigPath, configuration, { flag: 'wx' });
inputHashes[relative(generatedSpecPath)] = hash(generated);
inputHashes[relative(generatedConfigPath)] = hash(configuration);
const protocol = {
  status: 'DECLARED', declaredAt: new Date().toISOString(), expectedBuild, sourceFile,
  sourceFiles: initial.receipt.compared, sourceHashes: initial.frozen.sourceHashes,
  defaultArtifact: { files: Object.keys(expectedPublicHashes).length, hashes: expectedPublicHashes },
  sourceAndTestInputs: inputHashes, projects, workers: 1, retries: 0, automaticRetries: 0, resultFiltering: false,
  directories, publicOriginsAreLaboratoryMetadataOnly: true,
  siteUrls: ['https://sparowtype-static.invalid/', 'https://sparowtype-static.invalid/sparowtype-static-audit/'],
  expectedCases: { deployment: 56, gameAccessibility: 16 },
  sequence: ['Vercel isolated build', 'Pages isolated build', 'exact static artifact/source/3D verification', 'original frontend-deployment.spec.ts across four engines', 'output-only adapter of frontend-game-accessibility.spec.ts across four engines and two artifacts'],
  screenshotAdapter: { original: originalSpec, originalSha256: hash(original), generated: relative(generatedSpecPath), generatedSha256: hash(generated), reversibleByteIdentity: true, replacements },
  privacy: 'Only fresh guest directory-server contexts. No live API mocks are added, no credentials or private backend files are read, no live hosting or user database is contacted.',
  scope: 'Static byte/route/offline contracts, real loopback directory hosting, browser guest features and automated Signal Run accessibility. No claim of actual public hosting, manual accessibility, physical mobile devices or capacity/performance.',
};
await writeFile(protocolPath, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
const summaryHandle = await open(summaryPath, 'wx');
const report = { status: 'RUNNING', declaredAt: protocol.declaredAt, protocol: relative(protocolPath), expectedBuild, checks: [], processes: [] };
let ownedChild;
let interrupted = false;
const onSignal = () => { interrupted = true; if (ownedChild) ownedChild.kill('SIGINT'); };
process.once('SIGINT', onSignal);
process.once('SIGTERM', onSignal);
const check = (name, pass, detail) => {
  report.checks.push({ name, pass: Boolean(pass), ...(detail === undefined ? {} : { detail }) });
  assert.ok(pass, name);
};
const integrity = async stage => {
  const { receipt } = await verifyFrozenSource(sourceFile);
  const changedInputs = [];
  for (const [file, expected] of Object.entries(inputHashes)) if (hash(await readFile(file)) !== expected) changedInputs.push(file);
  const changedPublic = [];
  const actualNames = [];
  const walk = async (directory, parent = '') => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      assert.equal(entry.isSymbolicLink(), false);
      const name = path.posix.join(parent, entry.name);
      if (entry.isDirectory()) await walk(path.join(directory, entry.name), name);
      else { assert.ok(entry.isFile()); actualNames.push(name); if (hash(await readFile(path.join(directory, entry.name))) !== expectedPublicHashes[name]) changedPublic.push(name); }
    }
  };
  await walk('dist');
  for (const name of Object.keys(expectedPublicHashes)) if (!actualNames.includes(name)) changedPublic.push(name);
  check(`${stage}: frozen product, source/tests and every default artifact byte unchanged`, !receipt.mismatches.length && !changedInputs.length && !changedPublic.length, { sourceFiles: receipt.compared, sourceMismatches: receipt.mismatches, changedInputs, changedPublic });
};
const run = async (name, args, extraEnvironment = {}) => {
  assert.equal(interrupted, false, 'The declared run was interrupted.');
  await integrity(`before ${name}`);
  const logPath = path.join(audit, `${prefix}-static-${name}.log`);
  const processPath = path.join(audit, `${prefix}-static-${name}-process.json`);
  const log = await open(logPath, 'wx');
  const processReceipt = await open(processPath, 'wx');
  const started = performance.now();
  const receipt = { name, command: process.execPath, args, startedAt: new Date().toISOString(), status: 'RUNNING', log: relative(logPath) };
  report.processes.push(receipt);
  try {
    ownedChild = spawn(process.execPath, args, { cwd: root, windowsHide: true, env: { ...process.env, ...extraEnvironment }, stdio: ['ignore', log.fd, log.fd] });
    receipt.pid = ownedChild.pid;
    const result = await new Promise((resolve, reject) => {
      ownedChild.once('error', reject);
      ownedChild.once('exit', (code, signal) => resolve({ code, signal }));
    });
    receipt.exitCode = result.code; receipt.signal = result.signal;
    receipt.status = !interrupted && result.code === 0 ? 'PASS-SCOPED' : 'FAILED';
  } catch (error) { receipt.status = 'FAILED'; receipt.error = { name: error.name, message: error.message }; }
  finally {
    ownedChild = undefined; receipt.finishedAt = new Date().toISOString(); receipt.durationMs = performance.now() - started;
    await log.close(); await processReceipt.writeFile(JSON.stringify(receipt, null, 2) + '\n'); await processReceipt.close();
  }
  await integrity(`after ${name}`);
  console.log(JSON.stringify({ name, status: receipt.status, exitCode: receipt.exitCode, log: receipt.log }));
  return receipt;
};
const reportBrowser = async (name, file, expectedCases) => {
  const raw = JSON.parse(await readFile(file, 'utf8'));
  const counts = { total: 0, pass: 0, fail: 0, skip: 0, flaky: 0, projects: {}, errors: raw.errors?.length || 0 };
  const visit = suite => {
    for (const spec of suite.specs || []) for (const test of spec.tests || []) {
      const project = test.projectName;
      const projectCounts = counts.projects[project] ||= { total: 0, pass: 0, fail: 0, skip: 0, flaky: 0 };
      counts.total++; projectCounts.total++;
      const kind = test.status === 'expected' ? 'pass' : test.status === 'skipped' ? 'skip' : test.status === 'flaky' ? 'flaky' : 'fail';
      counts[kind]++; projectCounts[kind]++;
    }
    for (const child of suite.suites || []) visit(child);
  };
  for (const suite of raw.suites || []) visit(suite);
  report[name] = { raw: relative(file), ...counts };
  check(`${name}: exact declared case/project coverage without skips, retries or failures`, counts.total === expectedCases && counts.pass === expectedCases && !counts.skip && !counts.fail && !counts.flaky && !counts.errors && Object.keys(counts.projects).sort().join(',') === [...projects].sort().join(','), counts);
};
try {
  let receipt = await run('build-vercel', ['scripts/build-frontend.mjs', 'vercel', '--out-dir', directories[0], '--site-url', protocol.siteUrls[0]]);
  check('Vercel dedicated static build completed', receipt.status === 'PASS-SCOPED');
  receipt = await run('build-pages', ['scripts/build-frontend.mjs', 'github-pages', '--out-dir', directories[1], '--site-url', protocol.siteUrls[1]]);
  check('Pages dedicated subpath build completed', receipt.status === 'PASS-SCOPED');
  receipt = await run('verify-artifacts', ['audit/2026-10-21/verify-static-artifacts.mjs', '--prefix', prefix, '--source', sourceFile, '--vercel', directories[0], '--pages', directories[1]]);
  check('Static artifact and original 3D quality verification completed', receipt.status === 'PASS-SCOPED');
  const environment = { PLAYWRIGHT_BROWSERS: projects.join(','), PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:4173', SPAROWTYPE_STATIC_OUTPUTS: directories.join(',') };
  let browserFailed = false;
  for (const [name, selection, expectedCases] of [
    ['deployment', ['e2e/frontend-deployment.spec.ts'], protocol.expectedCases.deployment],
    ['game-accessibility', ['--config', generatedConfigPath], protocol.expectedCases.gameAccessibility],
  ]) {
    const rawPath = path.join(audit, `${prefix}-static-${name}-raw.json`);
    assert.equal(await exists(rawPath), false, 'Refusing to overwrite a browser JSON report.');
    receipt = await run(name, ['node_modules/@playwright/test/cli.js', 'test', ...selection, '--workers=1', '--retries=0', '--reporter=line,json', `--output=${path.join(runDirectory, name)}`], { ...environment, PLAYWRIGHT_JSON_OUTPUT_NAME: rawPath, PLAYWRIGHT_HTML_OUTPUT_DIR: path.join(runDirectory, `${name}-html`) });
    if (receipt.status !== 'PASS-SCOPED') browserFailed = true;
    try { await reportBrowser(name, rawPath, expectedCases); } catch (error) { browserFailed = true; report[name] ||= { reportMissingOrUnreadable: true }; report[name].error = { name: error.name, message: error.message }; }
    assert.equal(interrupted, false, 'The declared browser run was interrupted.');
  }
  check('Both browser suites completed with every declared case passing', !browserFailed);
  report.status = 'PASS-SCOPED';
} catch (error) { report.status = 'FAILED'; report.error = { name: error.name, message: error.message }; }
finally {
  try { await integrity('final'); } catch (error) { report.status = 'FAILED'; report.integrityError = { name: error.name, message: error.message }; }
  process.removeListener('SIGINT', onSignal); process.removeListener('SIGTERM', onSignal);
  report.finishedAt = new Date().toISOString(); report.interrupted = interrupted;
  report.ownedChildProcessExited = !ownedChild;
  await summaryHandle.writeFile(JSON.stringify(report, null, 2) + '\n'); await summaryHandle.close();
}
console.log(JSON.stringify({ status: report.status, expectedBuild, summary: relative(summaryPath), directories, browserSuites: ['deployment', 'game-accessibility'].map(name => ({ name, counts: report[name] || 'NOT RUN' })) }));
if (report.status !== 'PASS-SCOPED') process.exitCode = 1;
