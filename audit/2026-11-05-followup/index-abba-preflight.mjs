import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {filesystemSource36Preflight} from './source36-ordinary-preflight.mjs';
const dir='audit/2026-11-05-followup';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export const indexAbbaInputs=[`${dir}/pack-index-abba-instance.mjs`,`${dir}/run-index-abba-capacity.mjs`,`${dir}/index-abba-preflight.mjs`,`${dir}/index-abba-host-metadata.mjs`,`${dir}/index-abba-shim.mjs`,`${dir}/index-abba-exact-transformations.json`,`${dir}/prepare-index-abba-files.mjs`,`${dir}/.final-index-abba/index-A.php`,`${dir}/.final-index-abba/index-B.php`,'backend/tests/lazy-services/reference/backend/public/index.php'];
export async function indexAbbaFilePreflight(){
  const ordinary=await filesystemSource36Preflight(process.env.SPAROWTYPE_FINAL36_BUILD_ID);
  const runtimeInputs={};for(const file of indexAbbaInputs){assert.equal((await stat(file)).isFile(),true,`Declared ABBA input missing: ${file}`);runtimeInputs[file]=sha(await readFile(file));}
  const transformations=JSON.parse(await readFile(`${dir}/index-abba-exact-transformations.json`));
  for(const edit of transformations.edits){const original=await readFile(edit.from,'utf8'),derived=await readFile(edit.to,'utf8');assert.equal(sha(original),edit.originalSha256);assert.equal(sha(derived),edit.derivedSha256);let reversed=derived;for(const {before,after} of [...edit.transformations].reverse()){assert.equal(reversed.split(after).length,2);reversed=reversed.replace(after,before);}assert.equal(reversed,original);}
  const guard=JSON.parse(await readFile(`${dir}/source36-capacity-independent-preflight.json`));
  const dependencies=[...(await readdir('e2e')).filter(file=>file.endsWith('.ts')).map(file=>`e2e/${file}`),'playwright.config.ts'].sort();assert.equal(dependencies.length,73);
  const dependencyHashes=Object.fromEntries(await Promise.all(dependencies.map(async file=>[file,sha(await readFile(file))]))),dependencySha256=sha(JSON.stringify(dependencyHashes));assert.equal(dependencySha256,'525e91c1a220c8e978d65241c7c2acfe76f53efec000817ab8a28416a4840f37');
  return {ordinary,runtimeInputs,transformationExactReverse:true,all73TestConfigDependenciesUnchanged:true,dependencySha256,priorOrdinaryIndependentReviewSha256:sha(await readFile(`${dir}/source36-capacity-independent-preflight.json`)),priorIndependentReviewStatus:guard.status??null,productionEdited:false,servicesStarted:0};
}
export async function verifyPreparedIndexAbba(){
  const bytes=await readFile(`${dir}/index-abba-preparation-v2.json`),plan=JSON.parse(bytes);
  assert.match(process.env.SPAROWTYPE_INDEX_ABBA_PREPARATION_SHA256??'',/^[a-f0-9]{64}$/);
  assert.equal(sha(bytes),process.env.SPAROWTYPE_INDEX_ABBA_PREPARATION_SHA256,'Explicit caller-bound reviewed ABBA protocol required before any process.');
  const actual=await indexAbbaFilePreflight();assert.deepEqual(actual,plan.preflight);
  return actual;
}
