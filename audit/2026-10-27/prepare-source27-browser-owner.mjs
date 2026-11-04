// Preparation only. Original26 owner is retained; no service or test starts.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const directory='audit/2026-10-27',source=`${directory}/pack-backend-instance-source26.mjs`,target=`${directory}/pack-backend-instance-source27.mjs`;
await assert.rejects(access(target),{code:'ENOENT'});
const raw=await readFile(source),original=raw.toString('utf8').replace(/\r\n/g,'\n');let text=original;
const replaceOnce=(before,after)=>{assert.equal(text.split(before).length-1,1,'Missing/ambiguous owner preparation anchor.');text=text.replace(before,after);};
replaceOnce("import { phpRuntime } from '../../scripts/php-runtime.mjs';", "import { phpRuntime } from '../../scripts/php-runtime.mjs';\nimport { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';");
replaceOnce("const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));", `assert.equal(process.env.SPAROWTYPE_FINAL27_NATIVE_BROWSER_WINDOW, '1', 'Wait for the coordinated source27 native-browser window.');
assert.equal(httpRuntime, 'apache', 'The source27 browser owner requires its own Apache/PHP runtime.');
const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const expectedBuild = process.env.SPAROWTYPE_FINAL27_BUILD_ID;
assert.match(expectedBuild ?? '', /^[a-f0-9]{20}$/, 'Bind the actual frozen source27 frontend build.');
const frozenBefore = await verifyFrozenSource(path.join(root, 'audit/2026-10-27/final27-source.json'));
assert.equal(frozenBefore.frozen.local.version, expectedBuild);
assert.equal(frozenBefore.receipt.compared, 505);
assert.deepEqual(frozenBefore.receipt.mismatches, []);`);
replaceOnce('let capacityDeclared = false;\n','');replaceOnce('let nativeRateDeclared = false;\n','');
const suiteStart=text.indexOf('  const suites = { progression:');const suiteEnd=text.indexOf("  await receipt('protocol'",suiteStart);assert.ok(suiteStart>0&&suiteEnd>suiteStart);
text=text.slice(0,suiteStart)+`  const suites = { password:'backend/tests/password-policy.php' };
  const selected=(process.env.SPAROWTYPE_PACK_SUITES||'password').split(',');
  assert.ok(selected.length===1&&selected[0]==='password', 'This owner permits only password readiness before browser preparation.');
`+text.slice(suiteEnd);
replaceOnce("arenaTargetIfSelected:'50x8, p95<150ms; all errors and failures retained'",'browserOnlyOwner:true,capacityLoad:false,nativeCiSuites:false,rateBenchmark:false,frozenSource:frozenBefore.receipt');
replaceOnce('After coordination send capacity26, rate-native26, prepare-browser, renew, or cleanup. No browser/load starts automatically. Hold expires in15min without renew.','After coordination send prepare-browser, renew, or cleanup only. No browser or load starts automatically. Hold expires in15min without renew.');
const loopStart=text.indexOf('    for await (const line of lines) {');const loopEnd=text.indexOf('    clearTimeout(lease);',loopStart);assert.ok(loopStart>0&&loopEnd>loopStart);
text=text.slice(0,loopStart)+`    for await (const line of lines) {
      const command=line.trim();
      if(command==='')continue;
      if(command==='cleanup'){lines.close();break;}
      if(command==='prepare-browser')await prepareBrowser();
      else if(command==='renew')renew();
      else publicMessage({stage:'browser-only-command-rejected',message:'This owner permits browser preparation, lease renewal and same-owner cleanup only.'});
    }
`+text.slice(loopEnd);
assert.ok(!text.includes("line.trim() === 'capacity26'")&&!text.includes('run-source26-capacity-burst.mjs')&&!text.includes('run-source26-native-rate.mjs'));
await writeFile(target,text,{flag:'wx'});
const sha=value=>createHash('sha256').update(value).digest('hex');
await writeFile(`${directory}/source27-browser-owner-preparation.json`,JSON.stringify({preparedAt:new Date().toISOString(),status:'PREPARED-NOT-RUN',source,sourceRawSha256:sha(raw),target,targetSha256:sha(text),changes:['Require exact current source27 build and505 frozen sources before creating owned resources.','Keep original owned Apache/PHP/MariaDB provisioning, ownership guards, browser preparation and same-session graceful cleanup.','Restrict readiness to the password suite and stdin to prepare-browser/renew/cleanup; remove capacity/native-rate commands.'],requires:'Root GO plus PACK instance/Apache flags, FINAL27_NATIVE_BROWSER_WINDOW=1 and actual FINAL27_BUILD_ID.',ordinaryCapacityReplayed:false,nativeCiReplayed:false,servicesStarted:0,testsRun:0,productOrE2ESourceChanged:false,originalConfigRead:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PREPARED-NOT-RUN',target,servicesStarted:0}));
