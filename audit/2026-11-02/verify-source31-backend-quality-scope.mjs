// Read-only identity/method-scope proof. No services, configuration or benchmarks.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { hash, normalizedSourceHash, verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-11-02';
const output = `${directory}/source31-backend-quality-scope.json`;
await assert.rejects(access(output), { code: 'ENOENT' });
const source26File = 'audit/2026-10-27/final26-source.json';
const source31File = `${directory}/final31-source.json`;
const oldBytes = await readFile(source26File), currentBytes = await readFile(source31File);
const old = JSON.parse(oldBytes), current = JSON.parse(currentBytes);
const verified = await verifyFrozenSource(source31File);
assert.equal(verified.receipt.compared, 505);
assert.equal(verified.receipt.expectedBuild, 'f52d0372fe7656817259');
assert.deepEqual(verified.receipt.mismatches, []);
const backendFiles = Object.keys(old.sourceHashes).filter(file => file.startsWith('backend/')).sort();
assert.equal(backendFiles.length, 38);
assert.deepEqual(Object.keys(current.sourceHashes).filter(file => file.startsWith('backend/')).sort(), backendFiles);
const backend = backendFiles.map(file => ({ file, source26Sha256: old.sourceHashes[file], source31Sha256: current.sourceHashes[file], unchanged: old.sourceHashes[file] === current.sourceHashes[file] }));
assert.deepEqual(backend.filter(row => !row.unchanged).map(row => row.file), ['backend/src/ArenaService.php', 'backend/src/SessionValidator.php']);
const arenaFile = 'backend/src/ArenaService.php';
const arena = (await readFile(arenaFile, 'utf8')).replaceAll('\r\n', '\n');
const newMembers = `    private function members(array $room): array
    {
        $q=$this->db->prepare('SELECT * FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE');$q->execute([$room['id']]);return $q->fetchAll();
    }
`;
const oldMembers = `    private function members(array $room): array
    {
        $q=$this->db->prepare('SELECT * FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE');$q->execute([$room['id']]);$members=$q->fetchAll();
        if(!$members)return [];
        // Do not lock other accounts while holding this room: concurrent racers
        // already own their own account lock. Public handles need no write lock.
        $q=$this->db->prepare('SELECT id,handle FROM users WHERE id IN('.implode(',',array_fill(0,count($members),'?')).')');$q->execute(array_column($members,'user_id'));$handles=array_column($q->fetchAll(),'handle','id');
        foreach($members as &$member)$member['handle']=$handles[$member['user_id']]??'Former member';unset($member);return $members;
    }
`;
const newSerializePrefix = `        $members=$this->members($room);
        if($members){
            // Only the public response needs handles. Internal room operations
            // retain fresh full member rows and their original write locks.
            // Other accounts must never be write-locked while holding a room.
            $q=$this->db->prepare('SELECT id,handle FROM users WHERE id IN('.implode(',',array_fill(0,count($members),'?')).')');$q->execute(array_column($members,'user_id'));$handles=array_column($q->fetchAll(),'handle','id');
            foreach($members as &$member)$member['handle']=$handles[$member['user_id']]??'Former member';unset($member);
        }
        $placements=`;
const oldSerializePrefix = '        $members=$this->members($room);$placements=';
assert.equal(arena.split(newMembers).length, 2);
assert.equal(arena.split(newSerializePrefix).length, 2);
const reconstructedArena = arena.replace(newMembers, oldMembers).replace(newSerializePrefix, oldSerializePrefix);
assert.equal(normalizedSourceHash(arenaFile, Buffer.from(reconstructedArena)), old.sourceHashes[arenaFile]);
const validatorFile = 'backend/src/SessionValidator.php';
const validator = (await readFile(validatorFile, 'utf8')).replaceAll('\r\n', '\n');
const archiveFile = `${directory}/LegacyWordMetadataValidatorSource30.php`;
const archive = (await readFile(archiveFile, 'utf8')).replaceAll('\r\n', '\n').replace('final class LegacyWordMetadataValidatorSource30', 'final class SessionValidator');
assert.equal(normalizedSourceHash(validatorFile, Buffer.from(archive)), old.sourceHashes[validatorFile]);
const substitutions = [
  ['    private ?array $wordTarget = null;\n    private array $wordCache = [];\n', ''],
  ['    private function words(array $target): array', '    private static function words(array $target): array'],
  [`        // A replay visits the same immutable issued target for each edit and
        // chart bucket. Keep only its word boundaries, never transcript state
        // or an authoritative projection, within this validator instance.
        if ($this->wordTarget === $target) return $this->wordCache;
`, ''],
  ['        $this->wordTarget = $target;\n        $this->wordCache = $words;\n', ''],
  ['$this->words($target)', 'self::words($target)'],
];
let reconstructedValidator = validator;
const validatorScope = [];
for (const [before, after] of substitutions) {
  const count = reconstructedValidator.split(before).length - 1;
  assert.equal(count, before === '$this->words($target)' ? 3 : 1);
  reconstructedValidator = reconstructedValidator.replaceAll(before, after);
  validatorScope.push({ before, after, count });
}
assert.equal(reconstructedValidator, archive);
assert.equal(normalizedSourceHash(validatorFile, Buffer.from(reconstructedValidator)), old.sourceHashes[validatorFile]);
const wire = ['src/domain/arena.ts', 'src/services/arena-service.ts'].map(file => ({ file, source26Sha256: old.sourceHashes[file], source31Sha256: current.sourceHashes[file], unchanged: old.sourceHashes[file] === current.sourceHashes[file] }));
assert.ok(wire.every(row => row.unchanged));
const brand = Object.keys(old.sourceHashes).filter(file => file.startsWith('src/components/brand/')).map(file => ({ file, source26Sha256: old.sourceHashes[file], source31Sha256: current.sourceHashes[file], unchanged: old.sourceHashes[file] === current.sourceHashes[file] }));
assert.equal(brand.length, 21);
assert.ok(brand.every(row => row.unchanged));
const evidenceFiles = [`${directory}/source30-arena-public-handles-focused-contract.json`, `${directory}/source31-word-metadata-cache-focused-contract.json`, `${directory}/source31-word-metadata-cpu-result.json`, `${directory}/final31-source-gates.json`, `${directory}/source31-capacity-and-cpu-assessment.json`];
const evidence = await Promise.all(evidenceFiles.map(async file => ({ file, sha256: hash(await readFile(file)) })));
const report = { status: 'PASS-SCOPED-METHOD-IDENTITY', recordedAt: new Date().toISOString(), source26: { file: source26File, sha256: hash(oldBytes), build: old.local.version }, source31: { file: source31File, sha256: hash(currentBytes), build: current.local.version }, sourceAfter: verified.receipt, backend, unchangedBackendFiles: backend.filter(row => row.unchanged).length,
  changedBackendFiles: backend.filter(row => !row.unchanged).map(row => row.file),
  methodScope: {
    arena: { methodsChangedExactly: ['members', 'serialize'], wholeOriginalFileReconstructedSha256: normalizedSourceHash(arenaFile, Buffer.from(reconstructedArena)), matchesSource26: true, meaning: 'Move only the original non-locking handle lookup/fallback to public serialization. Full-row member SQL,parameters,slot order,FOR UPDATE and every other method—including handle,receipt,settlement,join,match,readiness andforfeit—remain exact source26 text.' },
    validator: { methodsWithChangedTextExactly: ['words', 'previousCommittedWord', 'apply', 'align'], originalWholeFileSha256: old.sourceHashes[validatorFile], legacyArchiveFile: archiveFile, legacyArchiveSha256: hash(await readFile(archiveFile)), reconstructedWholeFileMatchesLegacyAndSource26: true, substitutions: validatorScope, meaning: 'Only a single-entry word-boundary cache and three helper call-site bindings change. Original word scan, edit rules,align/scoring formulas,validation,stable payload,replay—including independent authoritative replay—remain exact after these bounded substitutions. This is a source-scope proof; runtime equivalence is separately tested.' },
  }, wire, brand, evidence,
  interpretation: 'This is method/source identity and observed differential evidence, not a fresh pass inherited from source26. Source31 capacity independently FAILED453.9505/371.7349ms p95. Original source26 FAILED261.3165/242.934ms p95 and native failures retain their own scopes. No capacity,physical-device,hosting ornewruntime success follows from unchanged helpers or3Dsource.',
  servicesStarted: 0, benchmarksExecuted: 0, privateConfigurationRead: false, productSourceModified: false };
await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, output, backend: backend.length, unchanged: report.unchangedBackendFiles, changed: report.changedBackendFiles, wireUnchanged: wire.length, brandUnchanged: brand.length }));
