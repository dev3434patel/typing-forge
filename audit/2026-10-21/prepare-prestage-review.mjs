import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Read-only review of public repository evidence. This tool never stages,
// commits, launches services/browsers/builds, or opens private configuration.
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--prefix' || !/^final\d+(?:-[a-z0-9]+)*$/.test(args[1]))
  throw new Error('Usage: node audit/2026-10-21/prepare-prestage-review.mjs --prefix final10');
const prefix = args[1], artifactPrefix = prefix.match(/^final\d+/)[0], cwd = process.cwd();
const roots = ['audit/2026-10-21', 'audit/implementation-pack-2026-10-21', 'audit/mega-pack-2026-10-21', 'audit/mobile-games-static-2026-10-20'];
const outputs = {
  review: `audit/2026-10-21/${prefix}-prestage-review.json`,
  paths: `audit/2026-10-21/${prefix}-prestage-paths.json`,
  scan: `audit/2026-10-21/${prefix}-prestage-public-scan.json`,
};
for (const file of Object.values(outputs)) if (fs.existsSync(file)) throw new Error('Choose a new prefix; existing review receipts are preserved.');
const relative = file => path.relative(cwd, file).replaceAll('\\', '/');
const split = value => value.split('\0').filter(Boolean);
function git(command, input) {
  try { return { exitCode: 0, output: execFileSync('git', command, { input, encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] }) }; }
  catch (error) {
    if (typeof error.status !== 'number') throw error;
    return { exitCode: error.status, output: String(error.stdout ?? '') };
  }
}
function requiredGit(command) {
  const result = git(command);
  if (result.exitCode !== 0) throw new Error('A read-only Git inventory failed; diagnostics are suppressed.');
  return result.output;
}
const tracked = new Set(split(requiredGit(['ls-files', '-z'])));
const staged = split(requiredGit(['diff', '--cached', '--name-only', '-z']));
const unstaged = split(requiredGit(['diff', '--name-only', '-z']));
const untracked = split(requiredGit(['ls-files', '--others', '--exclude-standard', '-z']));
const worktreeCheck = git(['diff', '--check']), indexCheck = git(['diff', '--cached', '--check']);
const unsafe = /(?:^|\/)(?:\.env(?:\.[^/]*)?|config\.php|[^/]*-config\.local\.php)$|(?:^|\/)backend\/storage\/|(?:^|\/)(?:hosting-build|hosting-archive|\.hosting-stage-[^/]*|\.playwright-artifacts[^/]*|playwright-report|test-results|node_modules|dist(?:-[^/]*)?)\/|\.(?:zip|tar|tar\.gz|tgz|7z|cpuprofile)$|\.generated\.mjs$/i;
const isUnsafe = file => file !== '.env.example' && unsafe.test(file);
const textExtension = /\.(?:json|log|txt|md|mjs|ts|php|sql|html|ps1)$/i;
const filesIn = directory => fs.readdirSync(directory, { withFileTypes: true }).filter(entry => entry.isFile()).map(entry => `${directory}/${entry.name}`);
const curatedExisting = roots.flatMap(filesIn).filter(file => !path.basename(file).startsWith('.') && textExtension.test(file) && !isUnsafe(file)).sort();
const historical = 'audit/accuracy-research-2026-10-15/core-suite.log';
if (fs.existsSync(historical) && fs.lstatSync(historical).isFile()) curatedExisting.push(historical);
const curated = [...new Set([...curatedExisting, ...Object.values(outputs)])].sort();
const ignoreResult = git(['check-ignore', '-z', '--stdin'], curated.join('\0') + '\0');
if (![0, 1].includes(ignoreResult.exitCode)) throw new Error('Git ignore inspection failed.');
const ignored = split(ignoreResult.output);

function markdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? markdownFiles(path.join(directory, entry.name))
    : entry.isFile() && /\.md$/i.test(entry.name) ? [path.join(directory, entry.name)] : []);
}
const documents = [path.join(cwd, 'README.md'), ...markdownFiles(path.join(cwd, 'docs'))];
const references = new Map(), missingMarkdownLinks = [], excludedLocalReferences = [];
let localLinks = 0;
function auditReference(file, document) {
  references.set(file, [...(references.get(file) ?? []), document]);
}
for (const document of documents) {
  const body = fs.readFileSync(document, 'utf8'), name = relative(document);
  for (const match of body.matchAll(/!?\[[^\]]*\]\((<[^>]+>|[^\s)]+)(?:\s+[^)]*)?\)/g)) {
    let target = match[1].replace(/^<|>$/g, '');
    if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(target)) continue;
    target = target.split('#')[0].split('?')[0];
    if (!target) continue;
    try { target = decodeURIComponent(target); } catch { /* Retain malformed public link text for the missing-link check. */ }
    target = target.replace(/:\d+$/, '');
    const full = path.resolve(path.dirname(document), target), file = relative(full);
    if (file.startsWith('../') || path.isAbsolute(file) || isUnsafe(file)) {
      excludedLocalReferences.push({ document: name, reason: 'Outside workspace or private/generated reference; target was not opened.' });
      continue;
    }
    localLinks++;
    if (!fs.existsSync(full)) missingMarkdownLinks.push({ document: name, target });
    if (file.startsWith('audit/')) auditReference(file, name);
  }
  for (const match of body.matchAll(/`(audit\/[A-Za-z0-9_.\/-]+\.(?:json|log|txt|md|mjs|ts|php|sql|html|ps1|png))`/g)) {
    if (!isUnsafe(match[1]) && !match[1].split('/').includes('..')) auditReference(match[1], name);
  }
}
const fileReferences = [], directoryReferences = [], missingAuditReferences = [];
for (const [file, refs] of references) {
  const entry = { path: file, referencedBy: [...new Set(refs)] };
  if (!fs.existsSync(file)) missingAuditReferences.push(entry);
  else if (fs.lstatSync(file).isFile()) fileReferences.push(entry);
  else if (fs.lstatSync(file).isDirectory()) directoryReferences.push(entry);
}
const linkedIgnored = ignored.filter(file => references.has(file)).map(file => ({ path: file, referencedBy: [...new Set(references.get(file))] }));
const linkedUntrackedFiles = fileReferences.filter(entry => !tracked.has(entry.path));

// Only these PNG paths are provenance-eligible. Existence does not certify a
// visual review; the root reviewer selects exact completed captures explicitly.
const screenshotDirectories = fs.readdirSync(roots[0], { withFileTypes: true })
  .filter(entry => entry.isDirectory() && /^final\d+-static-screenshots$/.test(entry.name))
  .map(entry => `${roots[0]}/${entry.name}`);
const pngFiles = [...roots, ...screenshotDirectories].flatMap(filesIn).filter(file => /\.png$/i.test(file));
const eligibleStaticPng = pngFiles.filter(file => /(?:\/static-(?:after\d+-)?(?:vercel|github-pages)-games-(?:ready-1440|playing-390)\.png$|\/final\d+-static-screenshots\/(?:chromium|edge|firefox|webkit)-static-(?:vercel|github-pages)-games-(?:ready-1440|playing-390)\.png$)/.test(file));
const conditionalPng = [];
for (const project of ['chromium', 'edge', 'firefox', 'webkit']) for (const target of ['vercel', 'github-pages']) for (const state of ['ready-1440', 'playing-390']) {
  const file = `${roots[0]}/${artifactPrefix}-static-screenshots/${project}-static-${target}-games-${state}.png`;
  conditionalPng.push({ path: file, exists: fs.existsSync(file), status: 'Requires completed run and root visual/privacy review; never implicitly selected.' });
}

const patterns = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['github-token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|github_pat_[A-Za-z0-9_]{35,}/],
  ['google-key', /AIza[0-9A-Za-z_-]{35}/],
  ['generated-acceptance-password', /Acceptance![0-9a-f]{8}-[0-9a-f-]{27,}/i],
  ['generated-arena-password', /(?:Arena|Pack|Browser|Audit)![0-9a-f]{24,}/i],
  ['generated-native-password', /NativeAudit![0-9a-f]{48}/i],
  ['mysql-cli-password', /\b(?:mysql|mariadb)(?:admin|dump)?(?:\.exe)?\b[^\r\n]{0,200}\s(?:--password=|-p)[^\s"';]{8,}/],
  ['session-cookie-value', /(?:sparow_ephemeral_[a-f0-9]{16}|PHPSESSID)=[A-Za-z0-9,-]{20,}/],
];
const findings = [], malformedJson = [], retainedTextTranscripts = [];
for (const file of curatedExisting) {
  const content = fs.readFileSync(file, 'utf8');
  for (const [kind, expression] of patterns) if (expression.test(content)) findings.push({ file, kind });
  if (file.endsWith('.json')) try { JSON.parse(content); } catch {
    if (file === 'audit/2026-10-21/pack-checkpoint-bundle-1.json' && /^> /m.test(content))
      retainedTextTranscripts.push({ path: file, classification: 'Historical command-output transcript with .json suffix; preserve exact original bytes, not a parsed JSON pass receipt.' });
    else malformedJson.push({ path: file, classification: 'Incomplete or malformed JSON; reconcile before staging. Contents are not printed.' });
  }
}
const scan = { at: new Date().toISOString(), status: findings.length ? 'FAILED' : 'PASS-SCOPED', scannedTextFiles: curatedExisting.length, roots, recursive: false, includes: ['PS1 top-level files', historical], findings, valuesPrinted: false, scope: 'Finite credential patterns on intended public text evidence only; no private config/database or complete-secret-detection claim.' };
const productPaths = ['.env.example', '.gitignore', '.github', 'README.md', 'LICENSES', 'backend/bin', 'backend/migrations', 'backend/public', 'backend/resources', 'backend/src', 'backend/tests', 'build', 'docs', 'e2e', 'scripts', 'src', 'public', 'supabase/functions/_shared/validation.ts', 'package.json', 'package-lock.json', 'playwright.config.ts', 'tsconfig.domain.json', 'vercel.json', 'vite.config.ts', 'vitest.config.ts', 'eslint.config.js'];
const manifest = {
  at: scan.at, prefix, artifactPrefix, productPaths, curatedTopLevelTextFiles: curated,
  ignoredExactFilesRequiringForceAdd: ignored, linkedIgnoredFiles: linkedIgnored,
  linkedUntrackedFiles, excludedDirectoryReferences: directoryReferences,
  existingSourceProvenanceEligibleStaticPng: eligibleStaticPng,
  conditionalCurrentStaticPng: conditionalPng,
  otherPngRequireSeparateReview: pngFiles.filter(file => !eligibleStaticPng.includes(file)),
  warning: 'This is a JSON review manifest, not a git pathspec file. Generate a separate NUL-separated exact FILE list only after root reviews completed outputs. Never force-add an audit directory.',
};
const unsafeIndex = staged.filter(isUnsafe);
const blocked = Boolean(unsafeIndex.length || findings.length || missingMarkdownLinks.length || malformedJson.length || worktreeCheck.exitCode || indexCheck.exitCode);
const review = {
  at: scan.at, prefix, artifactPrefix, status: blocked ? 'NEEDS_RECONCILIATION' : 'PASS-SCOPED-PRESTAGE',
  scope: 'Read-only snapshot after final jobs; no staging/commit/build/browser/service work. Refresh after later outputs or documentation updates.',
  manifest: outputs.paths, privacyScan: outputs.scan,
  git: { changedStaged: staged.length, expectedPriorStaged: 85, matchesPriorCount: staged.length === 85, unstagedModified: unstaged.length, untrackedUnignored: untracked.length, unsafeChangedIndexPaths: unsafeIndex, indexModifiedByTool: false },
  diffChecks: { worktreeExitCode: worktreeCheck.exitCode, cachedExitCode: indexCheck.exitCode, detailsPrinted: false },
  docs: { markdownFiles: documents.length, localLinks, missingMarkdownLinks, missingAuditReferences, excludedPrivateOrExternalLocalReferences: excludedLocalReferences, directoryLinksExcludedFromFileManifest: directoryReferences.length },
  counts: { curatedTextFilesIncludingThisReview: curated.length, ignoredExactFiles: ignored.length, ignoredLogs: ignored.filter(file => file.endsWith('.log')).length, referencedIgnoredFiles: linkedIgnored.length, referencedUntrackedFiles: linkedUntrackedFiles.length, eligibleExistingStaticPng: eligibleStaticPng.length, conditionalCurrentStaticPng: conditionalPng.length },
  evidenceFormat: { malformedJson, retainedTextTranscripts },
  pngScope: 'Fresh guest frontend-only static-server Signal Run ready/playing captures. No account backend or private workspace. This establishes generator provenance; root still reviews completed selected pixels and receipts. No pending capture is marked verified.',
  stagingRecipe: [
    'After all gates and docs reconciliation, git add -A -- the explicit productPaths only.',
    'Create a unique UTF-8 NUL-separated manifest containing refreshed curatedTopLevelTextFiles plus individually reviewed exact PNG files, never directory links.',
    'git add -f --pathspec-from-file=<own manifest> --pathspec-file-nul; remove only that owned single temporary manifest afterward.',
    'Verify every final linked JSON/log/PNG is indexed, inspect git diff --cached --name-status, and run git diff --cached --check.',
    'Preserve all earlier failed/partial receipts and historical tracked artifacts; do not invent missing evidence or imply hosted/device verification.',
  ],
  exclusions: ['private backend configs', 'backend/storage', 'non-example .env files', 'hosting builds/archives/stages', 'dist/node_modules', 'nested Playwright traces/screenshots/reports/screencasts', 'archives', 'CPU profiles', 'hidden generated audit modules'],
  serviceBoundary: 'No health inspection. Port8081 was previously absent; untouched does not mean healthy.',
  cleanupParagraph: 'Automatic approval review blocked cleanup of two temporary audit folders (“blocked by policy”); they remain Git-ignored.',
};
for (const [name, value] of [['review', review], ['paths', manifest], ['scan', scan]])
  fs.writeFileSync(outputs[name], JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ review: outputs.review, manifest: outputs.paths, scan: outputs.scan, status: review.status, counts: review.counts, stagedCountUnchanged: staged.length, secretPatternFindings: findings.length, missingMarkdownLinks: missingMarkdownLinks.length, malformedJson: malformedJson.length }));
process.exitCode = blocked ? 1 : 0;
