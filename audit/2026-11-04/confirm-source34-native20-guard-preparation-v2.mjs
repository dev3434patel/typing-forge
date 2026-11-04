import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const file = 'audit/2026-11-04/run-source34-native20-dependency-guard.mjs';
const prior = `${file}.prep-v1`;
const old = await readFile(prior, 'utf8');
const current = await readFile(file, 'utf8');
const before = "native.status === 'PASS-SCOPED'";
const after = "native.status === 'PASS-SCOPED-NATIVE-BROWSER'";
assert.equal(old.replace(before, after), current);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const receipt = {
  status: 'PREPARED-NOT-RUN', recordedAt: new Date().toISOString(),
  priorPreparation: 'audit/2026-11-04/source34-native20-dependency-guard-preparation.json',
  preservedV1: prior, wrapper: file,
  beforeSha256: sha(await readFile(prior)), afterSha256: sha(await readFile(file)),
  exactSingleReplacement: { before, after, reason: 'Read-only comparison caught the original orchestrator exact success enum before execution; v1 wrapper would always fail. No runtime ran.' },
  originalOrchestratorEdited: false, sourceOrTestsEdited: false,
  syntaxCheck: 'PASS', runtimeStarted: false,
  metadataInvocationCorrection: 'A PowerShell-quoted node-e metadata-only invocation failed to parse before writing the v2 sidecar; this standalone script replaces that invocation. It did not execute the wrapper or edit the orchestrator/tests/source.',
};
await writeFile('audit/2026-11-04/source34-native20-dependency-guard-preparation-v2.json', JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify(receipt));
