import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const source='backend/src/SessionValidator.php',target='audit/2026-11-04/CheckpointProjectionValidatorSource34.php';
const original=await readFile(source,'utf8'),eol=original.includes('\r\n')?'\r\n':'\n';
const oldClass='final class SessionValidator',newClass='final class CheckpointProjectionValidatorSource34';
const oldSignature='public function validate(array $candidate, string $owner, bool $cloudConsent = false, bool $interim = false): array';
const newSignature='public function validate(array $candidate, string $owner, bool $cloudConsent = false, bool $interim = false, bool $checkpointOnly = false): array';
const anchor="        $keys = $this->deriveKeys($candidate, $replay['attempts']);";
const branch=[
 '        if ($checkpointOnly) {',
 "            $candidate['metrics'] = $replay['metrics']; $candidate['timeSeries'] = $replay['timeSeries']; $candidate['characters'] = $replay['characters']; $candidate['cursor'] = $replay['cursor'];",
 '            // Preserve JSON encoding rejection on the final canonical projection.',
 '            json_encode($candidate, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR, 2147483647);',
 "            if ($course !== null) CourseAssessment::assess($candidate, $replay['metrics'], $course);",
 "            return ['candidate' => $candidate, 'checkpointOnly' => true];",
 '        }','',
].join(eol);
for(const value of[oldClass,oldSignature,anchor])assert.equal(original.split(value).length,2);
const candidate=original.replace(oldClass,newClass).replace(oldSignature,newSignature).replace(anchor,branch+anchor);
assert.equal(candidate.replace(newClass,oldClass).replace(newSignature,oldSignature).replace(branch,''),original);
await writeFile(target,candidate,{flag:'wx'});
const syntax=spawnSync('C:/xampp/php/php.exe',['-n','-l',target],{encoding:'utf8'});assert.equal(syntax.status,0,syntax.stderr||syntax.stdout);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const proof={recordedAt:new Date().toISOString(),kind:'audit-only-checkpoint-projection-cpu-candidate',source,target,sourceSha256:hash(original),candidateSha256:hash(candidate),exactReverse:true,syntaxPassed:true,source33ProductionEdited:false,fullCanonicalChartAndReplayRetained:true,canonicalEncodabilityCheckRetained:true,courseAssessRetained:true,checkpointMarker:true,notYetUsedByAnyApplicationConsumer:true};
await writeFile('audit/2026-11-04/source34-checkpoint-cpu-candidate-preparation.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(proof));
