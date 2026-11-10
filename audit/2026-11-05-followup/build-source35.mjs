import { spawn } from 'node:child_process';
import { readFile, open, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const directory = 'audit/2026-11-05-followup';
const hash = value => createHash('sha256').update(value).digest('hex');
const previousBuild = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
const log = await open(`${directory}/final35-build.log`, 'wx');
const startedAt = new Date().toISOString();
let exitCode;
try {
  exitCode = await new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'npm run build'], { windowsHide: true, env: process.env, stdio: ['ignore', log.fd, log.fd] });
    child.once('error', reject); child.once('exit', resolve);
  });
} finally { await log.close(); }
const build = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
const result = { startedAt, finishedAt: new Date().toISOString(), command: 'npm run build', exitCode, previousBuild, build, log: `${directory}/final35-build.log`, logSha256: hash(await readFile(`${directory}/final35-build.log`)), qualityOverride: false };
await writeFile(`${directory}/final35-build-process.json`, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(result));
assert.equal(exitCode, 0);
