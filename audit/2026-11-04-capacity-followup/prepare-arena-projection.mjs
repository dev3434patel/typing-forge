import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';
const directory = 'audit/2026-11-04-capacity-followup';
const sourceFile = 'backend/src/ArenaService.php';
const candidateFile = `${directory}/ArenaServiceProjectionCandidate.php`;
const sourceBytes = await readFile(sourceFile), source = sourceBytes.toString('utf8');
const eol = source.includes('\r\n') ? '\r\n' : '\n';
const sha = value => createHash('sha256').update(value).digest('hex');
const responseColumns = ['user_id', 'slot', 'ready', 'status', 'credited_units', 'wpm', 'accuracy', 'elapsed_ms', 'rematch_vote', 'quarantine_reason', 'appeal_requested_at'];
const activeColumns = ['user_id', 'status', 'last_seen_at', 'credited_units'];
const replacements = [];
let candidate = source;
function replace(from, to) {
  from = from.replaceAll('\n', eol); to = to.replaceAll('\n', eol);
  assert.equal(candidate.split(from).length, 2, 'Each declared source span is unique');
  const index = candidate.indexOf(from);
  candidate = candidate.replace(from, to); replacements.push({ from, to, index });
}
replace('final class ArenaService\n', 'final class ArenaServiceProjectionCandidate\n');
const originalMembers = "    private function members(array $room): array\n    {\n        $q=$this->db->prepare('SELECT * FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE');$q->execute([$room['id']]);return $q->fetchAll();\n    }";
replace(originalMembers, originalMembers + '\n' + [
  '    /** Scalar active-state projection; every call retains its fresh row locks. */',
  '    private function activeMembers(array $room): array',
  '    {',
  `        $q=$this->db->prepare('SELECT ${activeColumns.join(',')} FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE');$q->execute([$room['id']]);return $q->fetchAll();`,
  '    }',
  '    /** Public response projection; private canonical evidence stays in members(). */',
  '    private function responseMembers(array $room): array',
  '    {',
  `        $q=$this->db->prepare('SELECT ${responseColumns.join(',')} FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE');$q->execute([$room['id']]);return $q->fetchAll();`,
  '    }',
].join('\n'));
replace('$members=$this->members($room);$active=0;', '$members=$this->activeMembers($room);$active=0;');
replace("    private function serialize(array $room,string $owner,bool $spectator,float $now): array\n    {\n        $members=$this->members($room);", "    private function serialize(array $room,string $owner,bool $spectator,float $now): array\n    {\n        $members=$this->responseMembers($room);");
replace('            // Only the public response needs handles. Internal room operations\n            // retain fresh full member rows and their original write locks.', '            // Only the public response needs handles. Its scalar projection\n            // retains fresh member rows and their original write locks.');
let reversed = candidate;
for (const change of [...replacements].reverse()) {
  assert.equal(reversed.slice(change.index, change.index + change.to.length), change.to);
  reversed = reversed.slice(0, change.index) + change.from + reversed.slice(change.index + change.to.length);
}
assert.equal(reversed, source, 'Exact byte reversal to frozen production source');
await mkdir(directory, { recursive: true });
await writeFile(`${directory}/ArenaServiceSource34.php.original`, sourceBytes, { flag: 'wx' });
await writeFile(candidateFile, candidate, { flag: 'wx' });
const diff = spawnSync('git', ['diff', '--no-index', '--', `${directory}/ArenaServiceSource34.php.original`, candidateFile], { encoding: 'utf8', windowsHide: true });
assert.equal(diff.status, 1); await writeFile(`${directory}/arena-projection-candidate.patch`, diff.stdout, { flag: 'wx' });
const frozen = await verifyFrozenSource('audit/2026-11-02/final34-source.json');
assert.equal(frozen.receipt.compared, 505); assert.deepEqual(frozen.receipt.mismatches, []);
const historicalFile = 'audit/2026-11-02/source31-sql-profile-c4f783325fb85273-summary.json';
const historical = JSON.parse(await readFile(historicalFile, 'utf8'));
const submit = historical.phases.find(phase => phase.phase === 'submit');
const facts = Object.fromEntries(submit.selectedTiming.filter(row => ['sqlcat_member_lock', 'sqlcat_room_lock', 'stage_locked_replay'].includes(row.label)).map(row => [row.label, row]));
const receipt = {
  recordedAt: new Date().toISOString(), status: 'AUDIT-ONLY-CANDIDATE-PREPARED-NOT-EXECUTED', sourceFile, sourceSha256: sha(sourceBytes), candidateFile, candidateSha256: sha(candidate), exactReverse: true, replacements,
  sourceBefore: frozen.receipt, proposedProductionFiles: [sourceFile], activeColumns, responseColumns,
  lockBoundary: 'Identical WHERE arena_id=? ORDER BY slot FOR UPDATE, same parameter values and call positions. Full members() remains authoritative and waiting-liveness source. No row, clock, handle, lock or statement-result cache introduced.',
  preserved: ['Own member full evidence/prefix/immutable finish retry', 'Waiting liveness six null evidence markers', 'All room/account/member locks and ordering', 'All independent validation/replay/chart/final persistence', 'Every database-clock call and shared deadline/grace', 'Separate nonlocking public handle lookup', 'Transaction positions, status/version writes and response field order'],
  risks: ['SQL column projection may alter physical optimizer access and requires native query-plan/lock proof.', 'Historical member stage is small; removing it cannot by itself justify a predicted38ms gain.', 'Terminal finished evidence can be large, but current original capacity fixture has only ten events per account.'],
  historicalMeasurement: { source: 'source31 instrumented wire diagnostic, not a current source34 measurement or acceptance', file: historicalFile, sha256: sha(await readFile(historicalFile)), submitRequests: submit.requests, facts, positiveUnattributedHttpMinusPhpP95Ms: 88.9288 },
  requiredEvidence: ['Pure original-vs-candidate PDO mocks returning actual slim column sets and comparing exact public response bytes, mutations, clocks and query shape.', 'Original full member evidence and waiting-liveness contracts unchanged.', 'Separately approved fresh owned native plan/lock/lifecycle checks.', 'Exact original full1653 and wire1653 bursts,50x8 seats,concurrency20,strict p95<150,all outcomes retained and no retry/filter/warmup policy change.'],
  servicesStarted: 0, productionEdited: false, capacityPassed: 'UNVERIFIED', performanceGain: 'UNMEASURED', privateConfigRead: false,
};
const file = `${directory}/arena-projection-preparation.json`, bytes = JSON.stringify(receipt, null, 2) + '\n';
await writeFile(file, bytes, { flag: 'wx' });
console.log(JSON.stringify({ prepared: true, sourceSha256: receipt.sourceSha256, candidateSha256: receipt.candidateSha256, preparationSha256: sha(bytes), productionUnchanged: true, runtimeExecuted: false }));
