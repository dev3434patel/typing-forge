// Explicitly authorized restoration after all source25 native services closed.
import assert from 'node:assert/strict';
import { readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory='audit/2026-10-27';
const preparation=JSON.parse(await readFile(`${directory}/source25-reversal-preparation-confirmation.json`,'utf8'));
assert.equal(preparation.status,'PASS-SCOPED-REVERSAL-PREPARED-NOT-APPLIED');assert.equal(preparation.files.length,3);
const hash=value=>createHash('sha256').update(value).digest('hex'),normalize=value=>value.toString('utf8').replace(/\r\n/g,'\n');
const archive=[];
for(const row of preparation.files){
  const raw=await readFile(row.file),backup=await readFile(row.source25RawCopy),restored=await readFile(row.preparedSource24Copy);
  assert.equal(hash(raw),row.currentRawSha256);assert.equal(hash(raw),hash(backup));assert.equal(hash(normalize(restored)),row.expectedNormalizedSha256);
  archive.push({file:row.file,source25RawSha256:hash(raw),source25NormalizedSha256:hash(normalize(raw)),source24NormalizedSha256:row.expectedNormalizedSha256,code:raw.toString('utf8')});
}
const test=archive.find(row=>row.file==='backend/tests/arena-evidence-lock-contract.php').code;
const blockStart=test.indexOf('// Private context tests use the real replay implementation.'),blockEnd=test.indexOf('$failed = count(array_filter($checks,',blockStart);assert.ok(blockStart>0&&blockEnd>blockStart);
await writeFile(`${directory}/source25-replay-prototype.json`,JSON.stringify({recordedAt:new Date().toISOString(),status:'ARCHIVED-REJECTED-PROTOTYPE',reason:'Fresh ordinary capacity source25 p95370.310ms did not demonstrate benefit over source24 p95314.253ms; reject additional context complexity without claiming causality or regression proof.',productGateReceipt:'final25-source-gates.json',nativeBrowserReceipt:'final25-native-browser.json',capacityReceipt:'source25-capacity-6ff3583527677b7e.json',sameOwnerCleanup:'pack-backend-6ff3583527677b7e-cleanup.json',files:archive,added32AssertionContractBlock:test.slice(blockStart,blockEnd),privateConfigurationOrCredentialsIncluded:false},null,2)+'\n',{flag:'wx'});
const restored=[];
for(const row of preparation.files){
  const content=await readFile(row.preparedSource24Copy);await writeFile(row.file,content);
  const actual=await readFile(row.file);assert.equal(hash(normalize(actual)),row.expectedNormalizedSha256);
  restored.push({file:row.file,rawSha256:hash(actual),normalizedSha256:hash(normalize(actual)),expectedNormalizedSha256:row.expectedNormalizedSha256,matches:true});
}
await writeFile(`${directory}/source25-reversal-applied.json`,JSON.stringify({recordedAt:new Date().toISOString(),status:'PASS-SCOPED-RESTORED-SOURCE24',archive:'source25-replay-prototype.json',preparation:'source25-reversal-preparation-confirmation.json',source24Restored:restored,rawHistoricalSource24HashAvailable:false,rawLineEndingLimit:'Restored bytes use LF and exactly match historical normalized hashes; the old raw-line-ending hashes were not recorded.',testsOrServicesRun:0,frontendOr3DChanged:false,source25AllResultsPreserved:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PASS-SCOPED-RESTORED-SOURCE24',restored:restored.length,matches:restored.every(row=>row.matches),archive:'source25-replay-prototype.json'}));
