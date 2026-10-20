import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const directory = 'audit/learning-upgrade-2026-10-20';
const local = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
const response = await fetch('http://127.0.0.1:4173/offline-build.json', { cache: 'no-store' });
if (!response.ok) throw new Error(`Preview build identification failed: ${response.status}`);
const served = await response.json();
if (JSON.stringify(local) !== JSON.stringify(served)) throw new Error('Preview does not serve the frozen build');
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'src', 'backend/src', 'backend/resources', 'public', 'build', 'scripts', 'package.json', 'package-lock.json', 'vite.config.ts'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
const sourceSha256 = {};
for (const file of files) sourceSha256[file] = createHash('sha256').update(await readFile(file)).digest('hex');
execFileSync('git', ['diff', '--exit-code', '9fc87e2', '--', 'src/lib/typing-core', 'src/components/brand']);
const report = { capturedAt: new Date().toISOString(), baseline: '9fc87e2', local, served, canonicalEngineAndFullIntroUnchanged: true, sourceSha256 };
await writeFile(`${directory}/source-build.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ local, served, canonicalEngineAndFullIntroUnchanged: true, sourceFiles: files.length }));
