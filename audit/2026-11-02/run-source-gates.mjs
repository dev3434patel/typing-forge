import { spawn } from 'node:child_process';
import { access, open, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const prefix = process.argv[2]; assert.match(prefix ?? '', /^[a-z][a-z0-9-]+$/);
const directory = 'audit/2026-11-02';
const commands = [
  ['typecheck', 'npm run typecheck'], ['lint', 'npm run lint'],
  ['coverage', 'npm run test:coverage'], ['php-replay', 'npm run test:php'],
  ['php-course', 'npm run test:course-php'], ['php-progression', 'npm run test:progression-php'],
  ['php-classroom', 'npm run test:classroom-php'], ['php-social', 'npm run test:social-php'],
  ['php-arena', 'npm run test:arena-php'], ['php-race-clock', 'npm run test:race-clock-php'], ['content', 'npm run test:content'],
  ['dependencies', 'npm audit --omit=dev --json'],
];
const report = `${directory}/${prefix}-source-gates.json`;
await assert.rejects(access(report), { code: 'ENOENT' });
const results = [];
const reportVariables = {
  'php-replay': 'SPAROWTYPE_PHP_PARITY_REPORT', 'php-course': 'SPAROWTYPE_COURSE_TEST_REPORT',
  'php-progression': 'SPAROWTYPE_PROGRESSION_REPORT', 'php-classroom': 'CLASSROOM_CONTRACT_REPORT',
  'php-social': 'SPAROWTYPE_SOCIAL_REPORT', 'php-arena': 'ARENA_CONTRACT_REPORT',
  'php-race-clock': 'SPAROWTYPE_RACE_CLOCK_REPORT',
};
for (const [id, command] of commands) {
  const file = `${directory}/${prefix}-${id}.log`, log = await open(file, 'wx');
  const startedAt = new Date().toISOString(), start = performance.now(); let code;
  try {
    code = await new Promise((resolve, reject) => {
      const env = { ...process.env };
      if (reportVariables[id]) {
        env[reportVariables[id]] = `${directory}/${prefix}-${id}-receipt.json`;
      }
      const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command], { windowsHide: true, env, stdio: ['ignore', log.fd, log.fd] });
      child.once('error', reject); child.once('exit', resolve);
    });
  } finally { await log.close(); }
  const row = { id, command, startedAt, finishedAt: new Date().toISOString(), durationMs: performance.now() - start, exitCode: code, status: code === 0 ? 'PASS-SCOPED' : 'FAILED', file };
  results.push(row); console.log(JSON.stringify(row));
}
await writeFile(report, JSON.stringify({ status: results.every(row => row.exitCode === 0) ? 'PASS-SCOPED' : 'FAILED', automaticRetries: 0, results }, null, 2), { flag: 'wx' });
process.exitCode = results.some(row => row.exitCode !== 0) ? 1 : 0;
