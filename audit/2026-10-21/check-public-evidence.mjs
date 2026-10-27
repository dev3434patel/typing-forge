import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const prefix = process.argv[2]; assert.match(prefix ?? '', /^[a-z][a-z0-9-]+$/);
const roots = ['audit/2026-10-21', 'audit/mega-pack-2026-10-21', 'audit/implementation-pack-2026-10-21', 'audit/mobile-games-static-2026-10-20'];
const reportFile = `audit/2026-10-21/${prefix}-evidence-scan.json`;
await assert.rejects(access(reportFile), { code: 'ENOENT' });
const patterns = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['github-token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|github_pat_[A-Za-z0-9_]{35,}/],
  ['google-key', /AIza[0-9A-Za-z_-]{35}/],
  ['generated-acceptance-password', /Acceptance![0-9a-f]{8}-[0-9a-f-]{27,}/i],
  ['generated-arena-password', /(?:Arena|Pack|Browser|Audit)![0-9a-f]{24,}/i],
  ['mysql-cli-password', /\b(?:mysql|mariadb)(?:admin|dump)?(?:\.exe)?\b[^\r\n]{0,200}\s(?:--password=|-p)[^\s"';]{8,}/],
  ['session-cookie-value', /(?:sparow_ephemeral_[a-f0-9]{16}|PHPSESSID)=[A-Za-z0-9,-]{20,}/],
];
const files = [];
for (const root of roots) for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && /\.(?:json|log|html|txt|md|mjs|ts|php|sql)$/.test(entry.name)) files.push(path.posix.join(root, entry.name));
}
const findings = [];
for (const file of files) {
  const content = await readFile(file, 'utf8');
  for (const [kind, expression] of patterns) if (expression.test(content)) findings.push({ file, kind });
}
const report = { checkedAt: new Date().toISOString(), status: findings.length ? 'FAILED' : 'PASS-SCOPED', scannedTopLevelTextFiles: files.length, roots, findings, previousAttempt: 'precommit-first used an overbroad -p prefix expression that matched CSS/test identifiers. That failed scan is retained; this expression requires a mysql/mariadb command context.', scope: 'Pattern scan of public evidence only; values are never printed. Does not read original private config/database or claim complete secret detection.' };
await writeFile(reportFile, JSON.stringify(report, null, 2), { flag: 'wx' });
console.log(JSON.stringify(report)); process.exitCode = findings.length ? 1 : 0;
