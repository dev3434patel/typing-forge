// Preparation only. Does not start PHP, SQL, a service or an acceptance run.
import assert from 'node:assert/strict';
import { readFile,writeFile,access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory='audit/2026-10-27',hash=value=>createHash('sha256').update(value).digest('hex');
const planned=[
  {source:`${directory}/pack-backend-instance-source24.mjs`,target:`${directory}/pack-backend-instance-source24-db-profile.mjs`,pairs:[
    ["const httpRuntime = process.env.SPAROWTYPE_PACK_HTTP_RUNTIME ?? 'cli';","assert.equal(process.env.SPAROWTYPE_SOURCE24_DB_PROFILE_ACCEPTANCE, '1', 'Diagnostic preparation is not execution authorization.');\nconst httpRuntime = process.env.SPAROWTYPE_PACK_HTTP_RUNTIME ?? 'cli';"],
    ["'--performance-schema=OFF'","'--performance-schema=ON'"],
    ["if (line.trim() === 'capacity24')", "if (line.trim() === 'capacity24-db-profile')"],
    ["const capacityScript='audit/2026-10-27/run-source24-capacity-burst.mjs';","const capacityScript='audit/2026-10-27/run-source24-database-profile.mjs';"],
    ["send capacity24, rate-native24", "send capacity24-db-profile, rate-native24"],
  ]},
  {source:`${directory}/run-source24-capacity-burst.mjs`,target:`${directory}/run-source24-capacity-db-profile.mjs`,pairs:[
    ['pack-backend-instance-source24.mjs','pack-backend-instance-source24-db-profile.mjs'],
    ['run-source24-capacity-burst.mjs','run-source24-capacity-db-profile.mjs'],
    ['`source24-capacity-${ownerId}`','`source24-capacity-db-profile-${ownerId}`'],
    ["assert.equal(process.env.SPAROWTYPE_SOURCE24_CAPACITY_ACCEPTANCE, '1', 'Root must explicitly enable this owned capacity window.');", "assert.equal(process.env.SPAROWTYPE_SOURCE24_DB_PROFILE_ACCEPTANCE, '1', 'Root must separately enable this diagnostic environment.');\nassert.equal(process.env.SPAROWTYPE_SOURCE24_CAPACITY_ACCEPTANCE, '1', 'Root must explicitly enable this owned capacity window.');"],
  ]},
];
const prepared=[];
for(const plan of planned){
  await assert.rejects(access(plan.target),{code:'ENOENT'});
  const original=await readFile(plan.source,'utf8');let changed=original;const substitutions=[];
  for(const [before,after]of plan.pairs){const count=changed.split(before).length-1;assert.ok(count>0,`Missing exact adapter anchor: ${plan.source}`);changed=changed.split(before).join(after);substitutions.push({before,after,count});}
  let reversed=changed;for(const pair of [...plan.pairs].reverse())reversed=reversed.split(pair[1]).join(pair[0]);assert.equal(reversed,original);
  await writeFile(plan.target,changed,{flag:'wx'});prepared.push({source:plan.source,target:plan.target,sourceSha256:hash(original),targetSha256:hash(changed),substitutions,reversibleByteIdentity:true});
}
await writeFile(`${directory}/source24-db-profile-preparation.json`,JSON.stringify({preparedAt:new Date().toISOString(),status:'PREPARED-NOT-RUN',expectedBuild:'6cdddf1a74b2d10d1c9b',expectedSourceFiles:504,scope:'Audit-only cloned owned instance with performance_schema ON; unchanged1653-request/concurrency20/all-statuses/150ms assertions. Ordinary acceptance remains separate.',servicesStarted:0,sqlExecuted:0,browsersStarted:0,productOrE2ESourceChanged:false,prepared,limits:['Only the fresh owned instance enables Performance Schema.','Statement/wait summary collectors add overhead, so diagnostic latency cannot replace ordinary acceptance.','Original failed receipts remain unchanged; every diagnostic output uses a unique owner and namespace.','No application rate, durability, validation or score policy changes.'],sources:[{url:'https://mariadb.com/docs/server/reference/system-tables/performance-schema/performance-schema-tables/performance-schema-events_statements_summary_by_digest-table',checkedDate:'2026-10-27'},{url:'https://mariadb.com/docs/server/reference/system-tables/performance-schema/performance-schema-tables/performance-schema-events_statements_current-table',checkedDate:'2026-10-27'}]},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PREPARED-NOT-RUN',adapters:prepared.length,servicesStarted:0}));
