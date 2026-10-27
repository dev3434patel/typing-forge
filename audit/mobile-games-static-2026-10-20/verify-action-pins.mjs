import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
const exec = promisify(execFile);
const workflow = await readFile('.github/workflows/github-pages.yml', 'utf8');
const entries = [...workflow.matchAll(/uses: (actions\/[a-z-]+)@([0-9a-f]{40}) # (v\d+)/g)];
if (entries.length !== 5) throw new Error('Expected five explicitly pinned official Actions.');
const checks = [];
for (const [, repository, pin, tag] of entries) {
  const { stdout } = await exec('git', ['ls-remote', `https://github.com/${repository}.git`, `refs/tags/${tag}`, `refs/tags/${tag}^{}`], { windowsHide: true });
  const refs = stdout.trim().split(/\r?\n/).filter(Boolean).map(line => line.split(/\s+/));
  const commit = refs.find(([, ref]) => ref.endsWith('^{}'))?.[0] || refs[0]?.[0];
  const url = `https://raw.githubusercontent.com/${repository}/${pin}/action.yml`;
  const response = await fetch(url);
  const body = await response.text();
  checks.push({ repository, tag, pin, resolvedTagCommit: commit, exactTagMatch: commit === pin, actionMetadataVerified: response.ok && /^name:/m.test(body), source: url });
}
const receipt = { checkedAt: new Date().toISOString(), passed: checks.filter(check => check.exactTagMatch && check.actionMetadataVerified).length, total: checks.length, checks, remoteWorkflowExecution: 'UNVERIFIED', note: 'setup-node original official-guide pin was valid v7.0.0; final workflow uses the verified current v7 tag commit (v7.1.0).' };
await writeFile('audit/mobile-games-static-2026-10-20/static-action-pins.json', JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ passed: receipt.passed, total: receipt.total }));
if (receipt.passed !== receipt.total) process.exitCode = 1;
