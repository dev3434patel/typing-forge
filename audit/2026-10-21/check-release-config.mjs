import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const cases = [
  { id: 'missing', siteUrl: '', target: 'php', base: '/', expectedExit: 1 },
  { id: 'reserved', siteUrl: 'https://example.com/', target: 'php', base: '/', expectedExit: 1 },
  { id: 'pages-format', siteUrl: 'https://dev3434patel.github.io/typing-forge/', target: 'github-pages', base: '/typing-forge/', expectedExit: 0 },
];
const results = [];
for (const item of cases) {
  const command = [process.execPath, 'scripts/check-release-origin.mjs'];
  const result = spawnSync(command[0], command.slice(1), { encoding: 'utf8', windowsHide: true, env: { ...process.env, SPAROWTYPE_SITE_URL: item.siteUrl, SPAROWTYPE_DEPLOY_TARGET: item.target, SPAROWTYPE_BASE_PATH: item.base } });
  const receipt = { ...item, command, exitCode: result.status, stdout: result.stdout, stderr: result.stderr, status: result.status === item.expectedExit ? 'PASS-SCOPED' : 'FAILED' };
  await writeFile(`audit/2026-10-21/final-release-config-${item.id}.json`, JSON.stringify(receipt, null, 2), { flag: 'wx' });
  results.push(receipt);
}
const receipt = { checkedAt: new Date().toISOString(), status: results.every(row => row.status === 'PASS-SCOPED') ? 'PASS-SCOPED' : 'FAILED', results, scope: 'Real CLI configuration guard only. The Pages URL is the repository-derived format, not a verified deployment, DNS/TLS or publishing authorization. No real hosting origin was configured.' };
await writeFile('audit/2026-10-21/final-release-config.json', JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify(receipt)); assert.equal(receipt.status, 'PASS-SCOPED');
