import assert from'node:assert/strict';
import{readFile,writeFile,mkdir}from'node:fs/promises';
import{createHash}from'node:crypto';
import path from'node:path';
import{verifyFrozenSource}from'../2026-10-21/artifact-verification.mjs';
const directory='audit/2026-11-05-followup/lazy-services',sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const frozen=await verifyFrozenSource('audit/2026-11-05-followup/final35-source.json');assert.equal(frozen.receipt.compared,506);assert.deepEqual(frozen.receipt.mismatches,[]);
const files=['backend/public/index.php','backend/src/ArenaService.php','backend/src/ArenaEvidence.php'],records=[];
for(const file of files){
  const bytes=await readFile(file),original=bytes.toString('utf8'),eol=original.includes('\r\n')?'\r\n':'\n';let value=original;const edits=[];
  const replace=(from,to)=>{from=from.replaceAll('\n',eol);to=to.replaceAll('\n',eol);assert.equal(value.split(from).length,2,`Unique lazy boundary: ${file}`);const index=value.indexOf(from);value=value.replace(from,to);edits.push({from,to,index});};
  if(file==='backend/public/index.php'){
    replace('    $validator = new SessionValidator();\n    $data = new DataService($db, $validator, $config);\n','');
    replace("    if ($method === 'GET' && $path === '/health') {",[
      '    $validator = null; $data = null;',
      "    if ($arenaAction === null || $arenaAction === 'submit') {",
      '        $validator = new SessionValidator();',
      "        if ($arenaAction === null || ($body['finish'] ?? false) === true) $data = new DataService($db, $validator, $config);",
      '    }',
      "    if ($method === 'GET' && $path === '/health') {",
    ].join('\n'));
  }else{
    replace('public function __construct(private PDO $db,private SessionValidator $validator,private DataService $data){}','public function __construct(private PDO $db,private ?SessionValidator $validator,private ?DataService $data){}');
    if(file==='backend/src/ArenaEvidence.php'){
      replace("        return ['finish'=>$finish,'validated'=>$finish?$this->validator->validate($candidate,$user['id'],false,false):$this->validator->validateCheckpoint($candidate,$user['id'])];",[
        '        $validator=$this->validator;',
        "        if($validator===null)throw new \\LogicException('Arena submission requires a validator.');",
        "        $validated=$finish?$validator->validate($candidate,$user['id'],false,false):$validator->validateCheckpoint($candidate,$user['id']);",
        "        if($finish&&$this->data===null)throw new \\LogicException('Arena finish requires persistence.');",
        "        return ['finish'=>$finish,'validated'=>$validated];",
      ].join('\n'));
      replace("        $finish=$prepared['finish'];$validated=$prepared['validated'];$candidate=$validated['candidate'];",[
        "        $finish=$prepared['finish'];$validator=$this->validator;$data=$this->data;",
        "        if($validator===null)throw new \\LogicException('Arena submission requires a validator.');",
        "        if($finish&&$data===null)throw new \\LogicException('Arena finish requires persistence.');",
        "        $validated=$prepared['validated'];$candidate=$validated['candidate'];",
      ].join('\n'));
      replace('$replay=$this->validator->replay(', '$replay=$validator->replay(');
      replace('$this->data->commitValidated(', '$data->commitValidated(');
    }
  }
  let reversed=value;for(const edit of[...edits].reverse()){assert.equal(reversed.slice(edit.index,edit.index+edit.to.length),edit.to);reversed=reversed.slice(0,edit.index)+edit.from+reversed.slice(edit.index+edit.to.length);}assert.equal(reversed,original);
  for(const[variant,contents]of[['baseline',bytes],['candidate',value]]){const target=path.join(directory,variant,file);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,contents,{flag:'wx'});}
  records.push({file,sourceSha256:sha(bytes),candidateSha256:sha(value),edits,exactReverse:true});
}
const receipt={preparedAt:new Date().toISOString(),status:'AUDIT-ONLY-LAZY-SERVICES-CANDIDATE-NOT-EXECUTED',source:frozen.receipt,records,scope:'Three exact cloned files; only constructor allocation/nullable dependency guards. No production edit, parser/rate/auth/clock/lock/cache/scoring/hash/policy change.',nonArena:'Both original services remain allocated before route dispatch; constructor bodies have no side effects.',arenaNonSubmit:'Neither optional heavy class is instantiated.',arenaCheckpoint:'Same validator for prepare and independent authoritative replay; no DataService.',arenaFinish:'Strict boolean true allocates both; missing persistence fails before transaction/write, including direct prepared bypass.',tests:'PENDING',servicesStarted:0,productionEdited:false};
const file='audit/2026-11-05-followup/lazy-arena-services-candidate-preparation.json',out=JSON.stringify(receipt,null,2)+'\n';await writeFile(file,out,{flag:'wx'});console.log(JSON.stringify({file,sha256:sha(out),records:records.map(({file,sourceSha256,candidateSha256})=>({file,sourceSha256,candidateSha256})),sourceUnchanged:true,runtime:false}));
