import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { hash, normalizedSourceHash } from './artifact-verification.mjs';

export const directory = 'audit/2026-10-21';
export const confirmationFile = `${directory}/final18-coverage-workers2-confirmation.json`;
export const rawFile = `${directory}/final18-coverage-workers2-raw.json`;
export const logFile = `${directory}/final18-coverage-workers2.log`;
export const reportsDirectory = `${directory}/.final18-coverage-workers2`;
export const originalGateFile = `${directory}/final18-source-gates.json`;
export const sourceFile = `${directory}/final18-source.json`;
export const inputConfigurationFiles = [
  'package.json', 'package-lock.json', 'vitest.config.ts', 'vite.config.ts',
  'src/test-setup.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json',
  'tsconfig.domain.json', 'tsconfig.portable.json', 'build/keyboard-worker-plugin.ts',
  'node_modules/vitest/package.json', 'node_modules/@vitest/coverage-v8/package.json',
  'node_modules/vite/package.json', 'node_modules/@vitejs/plugin-react-swc/package.json',
  'node_modules/typescript/package.json',
];
export const json = async file => JSON.parse(await readFile(file, 'utf8'));
export const rawHash = async file => hash(await readFile(file));

export async function unitFiles(directory = 'src') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert.equal(entry.isSymbolicLink(), false, 'Unit inventory refuses symbolic links.');
    const file = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await unitFiles(file));
    else if (/\.(?:test|spec)\.(?:[cm]?[jt]s|jsx|tsx)$/.test(file)) files.push(file);
  }
  return files.sort();
}

export async function inputSnapshot() {
  const units = await unitFiles();
  assert.equal(units.length, 111, 'This declaration covers the complete frozen111-file suite.');
  const files = [...new Set([...units, ...inputConfigurationFiles])].sort();
  return { unitFiles: units, hashes: Object.fromEntries(await Promise.all(files.map(async file => [file, await rawHash(file)]))) };
}

export async function sourceSnapshot(expectedBuild) {
  const frozen = await json(sourceFile);
  assert.equal(frozen.local.version, expectedBuild);
  assert.deepEqual(frozen.local, frozen.served);
  assert.equal(Object.keys(frozen.sourceHashes).length, 499);
  const hashes = {}, mismatches = [];
  for (const [file, expected] of Object.entries(frozen.sourceHashes)) {
    assert.ok(!path.isAbsolute(file) && !file.split(/[\\/]/).includes('..'));
    assert.ok(!/(?:^|\/)(?:config\.php|storage|\.env)(?:\/|$)/.test(file), 'Private inputs are not readable.');
    hashes[file] = normalizedSourceHash(file, await readFile(file));
    if (hashes[file] !== expected) mismatches.push({ file, expected, actual: hashes[file] });
  }
  return { build: frozen.local, receipt: { sourceFile, expectedBuild, compared: 499, mismatches }, hashes, sourceManifestSha256: await rawHash(sourceFile) };
}

export function originalGates(data) {
  const names = ['typecheck', 'lint', 'coverage', 'php-replay', 'php-course', 'php-progression', 'php-classroom', 'php-social', 'php-arena', 'php-race-clock', 'content', 'dependencies'];
  assert.equal(data.status, 'FAILED');
  assert.equal(data.automaticRetries, 0);
  assert.deepEqual(data.results.map(row => row.id), names);
  assert.ok(data.results.every(row => row.finishedAt), 'Wait until the original gate runner finishes.');
  const failures = data.results.filter(row => row.exitCode !== 0);
  assert.equal(failures.length, 1);
  assert.equal(failures[0].id, 'coverage');
  assert.equal(failures[0].status, 'FAILED');
  assert.ok(data.results.filter(row => row.id !== 'coverage').every(row => row.exitCode === 0 && row.status === 'PASS-SCOPED'));
  return failures[0];
}

export function inspectCoverage(raw, log) {
  const files = raw.testResults ?? [];
  const assertions = files.flatMap(file => file.assertionResults ?? []);
  const summary = {
    tests: assertions.length, files: files.length,
    passed: assertions.filter(row => row.status === 'passed').length,
    failed: assertions.filter(row => row.status === 'failed').length,
    skipped: assertions.filter(row => row.status !== 'passed' && row.status !== 'failed').length,
  };
  assert.equal(raw.numTotalTests, summary.tests);
  assert.equal(raw.numPassedTests, summary.passed);
  assert.equal(raw.numFailedTests, summary.failed);
  const coveragePercent = {};
  for (const [field, label] of [['statements', 'Statements'], ['branches', 'Branches'], ['functions', 'Functions'], ['lines', 'Lines']]) {
    const value = [...log.matchAll(new RegExp(`${label}\\s*:\\s*([0-9.]+)%`, 'g'))].at(-1)?.[1];
    coveragePercent[field] = value === undefined ? null : Number(value);
  }
  if (Object.values(coveragePercent).some(value => value === null)) {
    const table = /(?:^|\n)\s*All files\s*\|\s*([0-9.]+)\s*\|\s*([0-9.]+)\s*\|\s*([0-9.]+)\s*\|\s*([0-9.]+)/.exec(log);
    if (table) ['statements', 'branches', 'functions', 'lines'].forEach((field, index) => { coveragePercent[field] = Number(table[index + 1]); });
  }
  return { summary, coveragePercent, rawSuccess: raw.success === true, fileNames: files.map(file => file.name).sort() };
}

export function requireCompleteCoverage(inspected) {
  assert.deepEqual(inspected.summary, { tests: 2811, files: 111, passed: 2811, failed: 0, skipped: 0 });
  assert.equal(inspected.rawSuccess, true);
  for (const [field, threshold] of [['statements', 80], ['branches', 80], ['functions', 80], ['lines', 85]]) {
    assert.ok(Number.isFinite(inspected.coveragePercent[field]) && inspected.coveragePercent[field] >= threshold, `Original ${field} coverage floor.`);
  }
}
