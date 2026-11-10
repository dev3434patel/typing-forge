import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const baselineSha256 = '9008825c59bdcfd863b714f45412638082043eae56a1000b70a134de67919a6d';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

/** Audit-only generation. No application, PHP interpreter, DB or service is run. */
export function arenaMemberCacheCandidate(sourceBytes) {
  assert.equal(sha256(sourceBytes), baselineSha256, 'Frozen Arena source must match exactly.');
  const original = sourceBytes.toString('utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  let candidate = original;
  const replacements = [];
  const replace = (from, to, reason) => {
    from = from.replaceAll('\n', eol); to = to.replaceAll('\n', eol);
    assert.equal(candidate.split(from).length, 2, `Unique cache boundary: ${reason}`);
    const index = candidate.indexOf(from);
    candidate = candidate.replace(from, to);
    replacements.push({ from, to, index, reason });
  };
  replace('final class ArenaService\n', 'final class ArenaServiceCachedCandidate\n', 'audit-only class identity');
  replace('    public function __construct(private PDO $db,private SessionValidator $validator,private DataService $data){}', [
    '    private bool $memberCacheActive=false;',
    '    private ?string $memberCacheRoom=null;',
    '    private array $memberCacheRows=[];',
    '    public function __construct(private PDO $db,private SessionValidator $validator,private DataService $data){}',
  ].join('\n'), 'one room snapshot, never a room map');
  replace("        Security::owner($body,$user['id'],false);", "        $this->memberCacheActive=false;$this->clearMemberCache();\n        Security::owner($body,$user['id'],false);", 'clear at every handle entry before validation');
  replace('        $this->db->beginTransaction();\n        try{', '        $this->db->beginTransaction();\n        $this->memberCacheActive=true;\n        try{', 'enable only after original transaction begins');
  replace('        }catch(\\Throwable $error){if($this->db->inTransaction())$this->db->rollBack();throw $error;}', '        }catch(\\Throwable $error){if($this->db->inTransaction())$this->db->rollBack();throw $error;}\n        finally{$this->memberCacheActive=false;$this->clearMemberCache();}', 'clear after success, rollback or exception');
  replace("    private function members(array $room): array\n    {\n        $q=$this->db->prepare('SELECT * FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE');$q->execute([$room['id']]);return $q->fetchAll();\n    }", [
    '    private function members(array $room): array',
    '    {',
    '        $cacheable=$this->memberCacheActive&&$this->db->inTransaction();',
    "        if($cacheable&&$this->memberCacheRoom===$room['id'])return $this->memberCacheRows;",
    '        $this->clearMemberCache();',
    "        $q=$this->db->prepare('SELECT * FROM arena_members WHERE arena_id=? ORDER BY slot FOR UPDATE');$q->execute([$room['id']]);$rows=$q->fetchAll();",
    "        if($cacheable){$this->memberCacheRoom=$room['id'];$this->memberCacheRows=$rows;}",
    '        return $rows;',
    '    }',
    '    private function clearMemberCache(): void{$this->memberCacheRoom=null;$this->memberCacheRows=[];}',
  ].join('\n'), 'same full locking query on first read, room switch or invalidation');
  const invalidations = [
    ["$evidence->submit($room,$member,$prepared,$user,$now);$this->bump", "$evidence->submit($room,$member,$prepared,$user,$now);$this->clearMemberCache();$this->bump", 'external authoritative evidence write'],
    ["$q->execute([$roomId,$owner,$slot,Database::timestamp($now)]);$this->bump", "$q->execute([$roomId,$owner,$slot,Database::timestamp($now)]);$this->clearMemberCache();$this->bump", 'insertMember'],
    ["$q->execute([(int)$body['ready'],Database::timestamp($now),$room['id'],$member['user_id']]);", "$q->execute([(int)$body['ready'],Database::timestamp($now),$room['id'],$member['user_id']]);$this->clearMemberCache();", 'ready before startWhenReady'],
    ["$q->execute([Database::timestamp($now),$room['id'],$member['user_id']]);}", "$q->execute([Database::timestamp($now),$room['id'],$member['user_id']]);$this->clearMemberCache();}", 'heartbeat'],
    ["$q=$this->db->prepare('DELETE FROM arena_members WHERE arena_id=? AND user_id=?');$q->execute([$room['id'],$member['user_id']]);", "$q=$this->db->prepare('DELETE FROM arena_members WHERE arena_id=? AND user_id=?');$q->execute([$room['id'],$member['user_id']]);$this->clearMemberCache();", 'waiting leave DELETE'],
    ["$q->execute([$elapsed,$elapsed>0?(int)$member['credited_units']*12000/$elapsed:null,Database::timestamp($at),$room['id'],$member['user_id']]);", "$q->execute([$elapsed,$elapsed>0?(int)$member['credited_units']*12000/$elapsed:null,Database::timestamp($at),$room['id'],$member['user_id']]);$this->clearMemberCache();", 'forfeit'],
    ["$q->execute([$room['id'],...$liveness['remove']]);$changed=", "$q->execute([$room['id'],...$liveness['remove']]);$this->clearMemberCache();$changed=", 'waiting prune before rowCount/startWhenReady'],
    ["$q->execute([$room['id']]);$room['status']='active';", "$q->execute([$room['id']]);$this->clearMemberCache();$room['status']='active';", 'countdown mass status'],
    ["$q->execute([$duration,(int)$member['credited_units']*12000/$duration,Database::timestamp($deadline),$room['id'],$member['user_id']]);$changed=true;", "$q->execute([$duration,(int)$member['credited_units']*12000/$duration,Database::timestamp($deadline),$room['id'],$member['user_id']]);$this->clearMemberCache();$changed=true;", 'grace finish'],
    ["$q->execute([$room['id'],$member['user_id']]);$members=$this->members($room);", "$q->execute([$room['id'],$member['user_id']]);$this->clearMemberCache();$members=$this->members($room);", 'rematch vote before read'],
    ["$q->execute([Database::timestamp($now),$room['id'],$member['user_id']]);$this->bump", "$q->execute([Database::timestamp($now),$room['id'],$member['user_id']]);$this->clearMemberCache();$this->bump", 'appeal'],
  ];
  for (const [from, to, reason] of invalidations) replace(from, to, reason);
  let reversed = candidate;
  for (const change of [...replacements].reverse()) {
    assert.equal(reversed.slice(change.index, change.index + change.to.length), change.to);
    reversed = reversed.slice(0, change.index) + change.from + reversed.slice(change.index + change.to.length);
  }
  assert.equal(reversed, original, 'Exact byte reversal to frozen source.');
  return { candidate, replacements, baselineSha256, candidateSha256: sha256(candidate), exactReverse: true, localWriteInvalidations: 10, externalSubmitInvalidations: 1 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../..', import.meta.url));
  const result = arenaMemberCacheCandidate(await readFile(path.join(root, 'backend/src/ArenaService.php')));
  const output = path.join(root, 'audit/2026-11-04-capacity-followup/ArenaServiceCachedCandidate.php');
  try { await writeFile(output, result.candidate, { flag: 'wx' }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; assert.equal(sha256(await readFile(output)), result.candidateSha256); }
  console.log(JSON.stringify({ status: 'AUDIT-ONLY-PREPARED-NOT-EXECUTED', baselineSha256, candidateSha256: result.candidateSha256, exactReverse: result.exactReverse, uniqueReplacements: result.replacements.length, localWriteInvalidations: result.localWriteInvalidations, externalSubmitInvalidations: result.externalSubmitInvalidations, phpExecuted: false, productionEdited: false }));
}
