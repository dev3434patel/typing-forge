import { spawnSync } from 'node:child_process';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

// Read-only working-tree screening. Never stage files or emit matched values.
// Private configuration values are read only into memory for exact comparison.
const here = import.meta.dirname;
const root = path.resolve(here, '../..');
function git(args, input) {
  const result = spawnSync('git', args, { cwd: root, input, encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  if (![0, 1].includes(result.status)) throw new Error('Git candidate/ignore inspection failed.');
  return result;
}
const listed = git(['ls-files', '-m', '-o', '--exclude-standard', '-z']);
if (listed.status !== 0) throw new Error('Could not enumerate prospective Git candidates.');
const candidates = [...new Set(listed.stdout.split('\0').filter(Boolean))].sort();
const ignoredProbes = [
  'backend/config.php', 'backend/audit-config.local.php', 'backend/storage/mysqladmin-audit.cnf',
  'audit/feature-audit-2026-10-19/.playwright-artifacts-secret-screen/trace.json',
  'audit/feature-audit-2026-10-19/firefox-trace-inspection/resources/trace.json',
  'audit/feature-audit-2026-10-19/secret-screen-probe.zip',
  'hosting-build/sparowtype-private/config.php', 'hosting-archive/secret-screen-probe/config.php',
  '.hosting-stage-secret-screen/sparowtype-private/config.php', 'dist/index.html',
];
const ignored = git(['check-ignore', '--no-index', '--stdin'], ignoredProbes.join('\n') + '\n');
const protectedSet = new Set(ignored.stdout.trim().split(/\r?\n/).filter(Boolean));
const protections = Object.fromEntries(ignoredProbes.map(value => [value, protectedSet.has(value)]));
const logProbe = git(['check-ignore', '--no-index', '--stdin'], 'audit/feature-audit-2026-10-19/secret-screen-probe.log\n');
const auditLogsIncluded = logProbe.status === 1;
const runtime = phpRuntime();
const privateValues = spawnSync(runtime.binary, [...runtime.args, '-r',
  '$out=["values"=>[],"sessionNames"=>[]];foreach(array_slice($argv,1) as $file){if(!is_file($file))throw new RuntimeException("Missing private local config.");$c=require $file;foreach([$c["app_key"]??null,$c["database"]["password"]??null] as $value){if(is_string($value)&&strlen($value)>=16)$out["values"][]=$value;}$out["sessionNames"][]=$c["session_name"]??"";}echo json_encode($out);',
  path.join(root, 'backend/config.php'), path.join(root, 'backend/audit-config.local.php')],
  { cwd: root, encoding: 'utf8', windowsHide: true });
if (privateValues.status !== 0) throw new Error('Private-value comparison preflight failed. No private diagnostic output was emitted.');
const privateData = JSON.parse(privateValues.stdout);
const exactSecrets = [...new Set(privateData.values)];
const regexEscape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cookieNames = [...new Set([...privateData.sessionNames, 'PHPSESSID'].filter(Boolean))];
const patterns = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/g],
  ['github-token', /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})/g],
  ['openai-secret-key', /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{40,}/g],
  ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['stripe-live-secret', /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}/g],
  ['jwt-shaped-token', /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{20,}\b/g],
  ['literal-app-key', /["']?app_key["']?\s*(?:=>|:)\s*["'][a-f0-9]{32,}["']/gi],
  ['literal-csrf-token', /(?:["']?csrfToken["']?\s*[:=]\s*["']|X-CSRF-Token["']?\s*[:=]\s*["']?)[a-f0-9]{32,}/gi],
  ['literal-session-cookie', new RegExp(`(?:${cookieNames.map(regexEscape).join('|')})\\s*=\\s*[A-Za-z0-9,-]{16,}`, 'g')],
];
const findings = [];
const privateNames = candidates.filter(value => /^(?:backend\/(?:config\.php|[^/]+-config\.local\.php|storage\/)|hosting-build\/|hosting-archive\/|\.hosting-stage-[^/]+\/)|(?:^|\/)(?:\.playwright-artifacts-[^/]+|firefox-trace-inspection)\/|\.(?:zip|tar|tar\.gz|tgz|7z)$/i.test(value));
let textFiles = 0, binaryFiles = 0, missingFiles = 0, totalBytes = 0, logFiles = 0, textBytes = 0;
for (const relative of candidates) {
  const file = path.join(root, relative);
  let buffer;
  try {
    const info = await stat(file); if (!info.isFile()) continue;
    buffer = await readFile(file); totalBytes += buffer.length;
  } catch (error) { if (error.code === 'ENOENT') { missingFiles++; continue; } throw error; }
  let text;
  try {
    if (buffer[0] === 0xff && buffer[1] === 0xfe) text = new TextDecoder('utf-16le', { fatal: true }).decode(buffer);
    else { if (buffer.includes(0)) throw new Error('Binary'); text = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
  } catch { binaryFiles++; continue; }
  textFiles++; textBytes += buffer.length; if (relative.endsWith('.log')) logFiles++;
  const add = (label, index) => findings.push({ file: relative, kind: label, line: text.slice(0, index).split('\n').length });
  for (const secret of exactSecrets) {
    const index = text.indexOf(secret); if (index !== -1) add('exact-local-private-config-value', index);
  }
  for (const [label, pattern] of patterns) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) add(label, match.index);
  }
}
const report = {
  date: new Date().toISOString(), scope: 'Modified tracked and nonignored untracked prospective Git candidates, not Git history',
  candidateFiles: candidates.length, utf8OrUtf16TextFiles: textFiles, binaryFilesNotTextScanned: binaryFiles,
  deletedOrChangedDuringEnumeration: missingFiles, totalBytes, textBytes, auditLogFilesScanned: logFiles,
  auditLogExceptionVerified: auditLogsIncluded, ignoreRuleProbes: protections,
  exactPrivateConfigValuesComparedWithoutEmittingValues: exactSecrets.length,
  suspiciousPrivateConfigNames: privateNames, highConfidenceTokenFindings: findings,
  stagingOrGitWritesPerformed: false,
  limitations: 'Finite pattern and exact current local-credential screening at this timestamp; binary image contents, Git history, arbitrary unrecognized secrets and files changed later are not universally covered.',
};
await writeFile(path.join(here, 'prospective-git-secret-screen.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (findings.length || privateNames.length || !auditLogsIncluded || Object.values(protections).some(value => !value)) process.exitCode = 1;
