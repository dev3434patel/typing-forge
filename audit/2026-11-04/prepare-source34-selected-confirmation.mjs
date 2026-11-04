import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const file = 'audit/2026-11-04/run-source34-selected-confirmation.mjs';
const receipt = {
  status: 'PREPARED-NOT-RUN', recordedAt: new Date().toISOString(),
  wrapper: { file, sha256: createHash('sha256').update(await readFile(file)).digest('hex') },
  scope: 'All cases in five complete files across all four engines; one worker, zero retries. Runtime list derives actual count/title inventory before execution and every actual pair must match.',
  files: ['e2e/arena.spec.ts', 'e2e/account-workspace.spec.ts', 'e2e/progression-extras.spec.ts', 'e2e/typing-experience.spec.ts', 'e2e/typing-course.spec.ts'],
  originalRunnerUnchanged: true, sourceOrTestsEdited: false, syntaxCheck: 'PASS', runtimeStarted: false,
  requiresApprovedStable72DependencyDigest: true,
  originalMatrixStatusRetained: 'FAILED-ORIGINAL-FULL-MATRIX',
  priorMetadataInvocation: 'A node-e metadata-only invocation failed to parse before writing this receipt. No selected wrapper/browser/runtime executed.',
};
await writeFile('audit/2026-11-04/source34-selected-confirmation-preparation.json', JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify(receipt));
