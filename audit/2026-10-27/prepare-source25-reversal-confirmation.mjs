// Preserve source25 and prove a source24 restoration without writing product files.
import assert from 'node:assert/strict';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory='audit/2026-10-27',folder=`${directory}/source25-replay-prototype-confirmation`;
const hash=value=>createHash('sha256').update(value).digest('hex');
const baseline=JSON.parse(await readFile(`${directory}/final24-source.json`,'utf8'));
const earlier=JSON.parse(await readFile(`${directory}/final22-backend-candidate-source.json`,'utf8'));
const paths=['backend/src/ArenaEvidence.php','backend/src/ArenaService.php','backend/tests/arena-evidence-lock-contract.php'];
await mkdir(folder,{recursive:false});const files=[];
for(const file of paths){
  const raw=await readFile(file),current=raw.toString('utf8').replace(/\r\n/g,'\n');let restored=current;
  if(file.endsWith('/ArenaService.php')){
    const before='$prepared=$evidence->prepare($body,$user,$receivedAt);';assert.equal(restored.split(before).length-1,1);
    restored=restored.replace(before,'$prepared=$evidence->prepare($body,$user);');
  }else if(file.endsWith('/ArenaEvidence.php')){
    restored=restored.replace('    private ?array $receiptReplay = null;\n','');
    const start=restored.indexOf('    /** Validate client evidence before taking account/room locks.');
    const end=restored.indexOf('    public function submit(',start);assert.ok(start>0&&end>start);
    const originalPrepare=`    /** Validate client evidence before taking account/room locks. None of these
     * checks reads mutable room state. Issuance, prefix, membership and the
     * authoritative shared-clock replay are still checked under the room lock.
     */
    public function prepare(array $body,array $user): array
    {
        $candidate=$body['candidate']??null;$finish=$body['finish']??false;
        if(!is_array($candidate)||!is_bool($finish))throw new ApiException(422,'arena-candidate','Send canonical evidence and a boolean finish flag.');
        ArenaRules::preflight($candidate);
        return ['finish'=>$finish,'validated'=>$this->validator->validate($candidate,$user['id'],false,!$finish)];
    }
`;
    restored=restored.slice(0,start)+originalPrepare+restored.slice(end);
    const source25='$replay=$this->receiptProjection($room,$candidate,$user,$finish,$now,$start,$duration,$elapsed);$metrics=$replay[\'metrics\'];';
    const source24='$replay=$this->validator->replay($candidate[\'configuration\'],$candidate[\'events\'],$elapsed,[\'targetText\'=>$room[\'expected_text\'],\'finiteFinal\'=>$finish]);$metrics=$replay[\'metrics\'];';
    assert.equal(restored.split(source25).length-1,1);restored=restored.replace(source25,source24);
    const helper=restored.indexOf('    private function receiptProjection(');assert.ok(helper>0);restored=restored.slice(0,helper)+'}\n';
  }else{
    const start=restored.indexOf('\n// Private context tests use the real replay implementation.');
    const end=restored.indexOf('$failed = count(array_filter($checks,',start);assert.ok(start>0&&end>start);
    restored=restored.slice(0,start)+restored.slice(end);
  }
  const expected=baseline.sourceHashes[file]??earlier.files.find(row=>row.path===file)?.sha256Normalized;
  assert.match(expected??'',/^[a-f0-9]{64}$/);assert.equal(hash(restored),expected,`Exact normalized source24 reconstruction failed: ${file}`);
  const name=file.replaceAll('/','__');
  await writeFile(`${folder}/${name}.source25`,raw,{flag:'wx'});
  await writeFile(`${folder}/${name}.source24-normalized`,restored,{flag:'wx'});
  files.push({file,currentRawSha256:hash(raw),currentNormalizedSha256:hash(current),restoredNormalizedSha256:hash(restored),expectedNormalizedSha256:expected,matches:true,source24ExpectedFrom:baseline.sourceHashes[file]?'final24-source.json':'final22-backend-candidate-source.json (unchanged original130-assertion driver)',source25RawCopy:`${folder}/${name}.source25`,preparedSource24Copy:`${folder}/${name}.source24-normalized`});
}
await writeFile(`${directory}/source25-reversal-preparation-confirmation.json`,JSON.stringify({recordedAt:new Date().toISOString(),status:'PASS-SCOPED-REVERSAL-PREPARED-NOT-APPLIED',scope:'Preserved actual source25 raw bytes and verified reconstructed source24 normalized bytes. No product/test file changed.',files,rawSource24HistoricalHashAvailable:false,rawLineEndingLimit:'Historical source manifests prove normalized source hashes; no claim about an unavailable old raw-line-ending hash.',servicesStarted:0,testsRun:0,productionFilesChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PASS-SCOPED-REVERSAL-PREPARED-NOT-APPLIED',files:files.length,matches:files.every(row=>row.matches),productionFilesChanged:false}));
