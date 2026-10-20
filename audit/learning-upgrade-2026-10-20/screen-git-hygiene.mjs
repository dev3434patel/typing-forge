import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { lstat, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

// Read-only candidate inspection; only the sanitized receipt below is written.
const root = path.resolve(import.meta.dirname, '../..');
function git(args, input) {
  const result = spawnSync('git', args, { cwd: root, input, encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  assert.ok([0, 1].includes(result.status), 'Git inspection failed; private diagnostic output suppressed.');
  return result;
}
const listed = git(['ls-files', '-m', '-o', '--exclude-standard', '-z']);
const staged = git(['diff', '--cached', '--name-only', '--diff-filter=ACMRTUXB', '-z']);
assert.equal(listed.status, 0); assert.equal(staged.status, 0);
const candidates = [...new Set([...listed.stdout.split('\0'), ...staged.stdout.split('\0')].filter(Boolean))].sort();
const ignoredProbes = [
  'backend/config.php', 'backend/audit-config.local.php', 'backend/storage/mysqladmin-audit.cnf',
  'audit/learning-upgrade-2026-10-20/.playwright-artifacts-probe/trace.json',
  'audit/learning-upgrade-2026-10-20/firefox-trace-inspection/resources/trace.json',
  'audit/learning-upgrade-2026-10-20/probe.zip',
  'hosting-build/sparowtype-private/config.php', 'hosting-archive/probe/config.php',
  '.hosting-stage-probe/sparowtype-private/config.php', 'dist/index.html',
];
const protectedOutput = git(['check-ignore', '--no-index', '--stdin'], ignoredProbes.join('\n') + '\n');
const protectedSet = new Set(protectedOutput.stdout.trim().split(/\r?\n/));
const ignoreRuleProbes = Object.fromEntries(ignoredProbes.map(file => [file, protectedSet.has(file)]));
const auditLogExceptions = Object.fromEntries(['feature-audit-2026-10-19', 'learning-upgrade-2026-10-20'].map(folder => [folder,
  git(['check-ignore', '--no-index', '--stdin'], `audit/${folder}/probe.log\n`).status === 1]));

// Read local secrets into memory solely for exact matching. Never serialize them.
const runtime = phpRuntime();
const privateResult = spawnSync(runtime.binary, [...runtime.args, '-r',
  '$out=["values"=>[],"sessionNames"=>[]];foreach(array_slice($argv,1) as $file){$c=require $file;foreach([$c["app_key"]??null,$c["database"]["password"]??null] as $v){if(is_string($v)&&strlen($v)>=16)$out["values"][]=$v;}$out["sessionNames"][]=$c["session_name"]??"";}echo json_encode($out);',
  path.join(root, 'backend/config.php'), path.join(root, 'backend/audit-config.local.php')],
  { cwd: root, encoding: 'utf8', windowsHide: true });
assert.equal(privateResult.status, 0, 'Private comparison preflight failed; diagnostics suppressed.');
const privateData = JSON.parse(privateResult.stdout);
const exactSecrets = [...new Set(privateData.values)];
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cookieNames = [...new Set([...privateData.sessionNames, 'PHPSESSID'].filter(Boolean))];
const uuid = '[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}';
const patterns = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/g],
  ['github-token', /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})/g],
  ['openai-secret-key', /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{40,}/g],
  ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['stripe-live-secret', /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}/g],
  ['jwt-shaped-token', /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{20,}\b/g],
  ['literal-app-key', /["']?app_key["']?\s*(?:=>|:)\s*["'][a-f0-9]{32,}["']/gi],
  ['literal-csrf-token', /(?:["']?csrfToken["']?\s*[:=]\s*["']|X-CSRF-Token["']?\s*[:=]\s*["']?)[a-f0-9]{32,}/gi],
  ['literal-session-cookie', new RegExp(`(?:${cookieNames.map(escape).join('|')})\\s*=\\s*[A-Za-z0-9,-]{16,}`, 'g')],
  ['materialized-reserved-account-email', new RegExp(`(?:sparowtype-${uuid}|(?:http-audit|race-[abc]|missing)-[a-f0-9]{8,64}(?:-[a-z]+)?)@example\\.(?:test|invalid)`, 'gi')],
  ['serialized-account-identifier', new RegExp(`(?:["'](?:ownerId|user_id|userId|expectedOwner|accountId)["']\\s*:\\s*["'])${uuid}["']`, 'gi')],
];
const archivePattern = /\.(?:zip|tar|tar\.gz|tgz|7z)$/i;
const privatePathPattern = /^(?:backend\/(?:config\.php|[^/]+-config\.local\.php|storage\/)|hosting-build\/|hosting-archive\/|\.hosting-stage-[^/]+\/)|(?:^|\/)(?:\.playwright-artifacts-[^/]+|firefox-trace-inspection)\//i;
const suspiciousPrivateArtifactPaths = candidates.filter(file => privatePathPattern.test(file));
const prospectiveArchivePaths = candidates.filter(file => archivePattern.test(file));
const findings = [];
let textFiles = 0, binaryFiles = 0, archivesExcluded = 0, missingFiles = 0, linksExcluded = 0, textBytes = 0;
let auditJsonFiles = 0, auditLogFiles = 0, auditHtmlFiles = 0, documentationFiles = 0;
const changedWhileReading = [];
for (const relative of candidates) {
  const file = path.resolve(root, relative);
  assert.ok(file.startsWith(root + path.sep), 'Candidate escaped the workspace.');
  let before, buffer;
  try {
    before = await lstat(file);
    if (before.isSymbolicLink()) { linksExcluded++; continue; }
    if (!before.isFile()) continue;
    if (archivePattern.test(relative)) { archivesExcluded++; continue; }
    buffer = await readFile(file);
    const after = await lstat(file);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) changedWhileReading.push(relative);
  } catch (error) { if (error.code === 'ENOENT') { missingFiles++; continue; } throw error; }
  let content;
  try {
    if (buffer[0] === 0xff && buffer[1] === 0xfe) content = new TextDecoder('utf-16le', { fatal: true }).decode(buffer);
    else { if (buffer.includes(0)) throw new Error('Binary'); content = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
  } catch { binaryFiles++; continue; }
  textFiles++; textBytes += buffer.length;
  if (relative.startsWith('audit/')) {
    if (/\.json$/i.test(relative)) auditJsonFiles++;
    if (/\.log$/i.test(relative)) auditLogFiles++;
    if (/\.html?$/i.test(relative)) auditHtmlFiles++;
  }
  if (/\.md$/i.test(relative)) documentationFiles++;
  const add = (kind, index) => findings.push({ file: relative, kind, line: content.slice(0, index).split('\n').length });
  for (const secret of exactSecrets) { const index = content.indexOf(secret); if (index !== -1) add('exact-local-private-config-value', index); }
  for (const [kind, pattern] of patterns) { pattern.lastIndex = 0; for (const match of content.matchAll(pattern)) add(kind, match.index); }
}
const historicPaths = ['firefox', 'webkit'].map(browser => `audit/feature-audit-2026-10-19/verified-targeted-artifacts/php-account-flow-real-PHP--b8e61-rences-and-account-deletion-${browser}/error-context.md`);
const historicStatus = git(['status', '--porcelain=v1', '--', ...historicPaths]);
assert.equal(historicStatus.status, 0);
const report = {
  date: new Date().toISOString(),
  scope: 'Current modified tracked, staged added/changed, and nonignored untracked prospective Git files; working-tree contents at this timestamp. No staging, Git history scan, DB query or service action.',
  candidateFiles: candidates.length, utf8OrUtf16TextFilesScanned: textFiles, textBytesScanned: textBytes,
  auditJsonFilesScanned: auditJsonFiles, auditLogFilesScanned: auditLogFiles, auditHtmlFilesScanned: auditHtmlFiles, markdownDocumentationFilesScanned: documentationFiles,
  binaryFilesExcludedFromContentScan: binaryFiles, archivesExcludedFromContentScan: archivesExcluded,
  symlinksExcludedFromContentScan: linksExcluded, deletedOrMissingCandidates: missingFiles, changedWhileReading,
  exactCurrentPrivateConfigValuesComparedInMemoryOnly: exactSecrets.length,
  ignoreRuleProbes, auditLogExceptions,
  suspiciousPrivateArtifactPaths, prospectiveArchivePaths, findings,
  historicalUnchangedSyntheticIdentifierArtifacts: { knownFiles: historicPaths.length, unchangedInWorkingTreeAndIndex: historicStatus.stdout.length === 0, contentNotRecertifiedOrModified: true },
  gitStagingOrIndexWritesPerformed: false, databaseOrServiceChangesPerformed: false,
  limitations: [
    'Finite high-confidence token, session/CSRF, exact current local credential, and materialized reserved account identifier patterns; arbitrary secrets or unrelated personal data can escape these patterns.',
    'Binary image pixels/OCR, archive contents, unchanged historical tracked artifacts, Git object history, ignored private local files and changes after this timestamp are outside the content certification.',
    'The sanitized receipt is written after enumeration; rerun includes its prior contents. A later staging operation should use the current tree without introducing new generated artifacts.',
  ],
};
report.passed = findings.length === 0 && suspiciousPrivateArtifactPaths.length === 0 && prospectiveArchivePaths.length === 0 && linksExcluded === 0 && changedWhileReading.length === 0 && Object.values(ignoreRuleProbes).every(Boolean) && Object.values(auditLogExceptions).every(Boolean) && historicStatus.stdout.length === 0;
await writeFile(path.join(import.meta.dirname, 'git-hygiene-final.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
