// File preparation only; no PHP, application test or diagnostic is executed.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const directory='audit/2026-10-27',sha=value=>createHash('sha256').update(value).digest('hex');
const phpSource=`${directory}/parser-hybrid-diagnostic.php`,jsSource=`${directory}/run-parser-hybrid-diagnostic.mjs`;
const phpTarget=`${directory}/request-body-production-diagnostic.php`,jsTarget=`${directory}/run-request-body-production-diagnostic.mjs`;
for(const file of [phpTarget,jsTarget])await assert.rejects(access(file),{code:'ENOENT'});
const phpOriginal=await readFile(phpSource,'utf8'),jsOriginal=await readFile(jsSource,'utf8');
const begin=phpOriginal.indexOf('function hybridDecode(string $raw): array {'),end=phpOriginal.indexOf('function normalizedOutcome(',begin);assert.ok(begin>0&&end>begin);
const replacement=`function hybridDecode(string $raw): array {
    return ['decoded'=>null,'body'=>SparowType\\RequestBody::decode($raw),'branch'=>str_contains($raw,'\\u0000')?'old-two-decode':'single-associative'];
}
`;
let php=phpOriginal.slice(0,begin)+replacement+phpOriginal.slice(end);
php=php.replaceAll('SPAROWTYPE_PARSER_HYBRID_DIAGNOSTIC','SPAROWTYPE_REQUEST_BODY_PRODUCTION_DIAGNOSTIC');
let js=jsOriginal.replaceAll('parser-hybrid-diagnostic','request-body-production-diagnostic').replaceAll('SPAROWTYPE_PARSER_HYBRID_DIAGNOSTIC','SPAROWTYPE_REQUEST_BODY_PRODUCTION_DIAGNOSTIC');
js=js.replace("'backend/src/SessionValidator.php',", "'backend/src/RequestBody.php', 'backend/public/index.php', 'backend/tests/request-body-contract.php', 'backend/src/SessionValidator.php',");
js=js.replace('proposedDecoder:', 'productionDecoder:').replace('productEdits: 0, inputHashes:', "productionHelper: 'backend/src/RequestBody.php', productEditsByDiagnostic: 0, inputHashes:");
await writeFile(phpTarget,php,{flag:'wx'});await writeFile(jsTarget,js,{flag:'wx'});
await writeFile(`${directory}/request-body-production-diagnostic-preparation.json`,JSON.stringify({preparedAt:new Date().toISOString(),status:'PREPARED-NOT-RUN',originalFiles:{[phpSource]:sha(phpOriginal),[jsSource]:sha(jsOriginal)},preparedFiles:{[phpTarget]:sha(php),[jsTarget]:sha(js)},changes:['Use the actual production RequestBody::decode implementation instead of the audit hybrid copy.','Retain the independent old false/root-stdClass/true reference and all51 fixed cases.','Retain the identical302392-byte candidate and302494-byte full POST fixture.','Retain12 alternating parser iterations,12 validation/second-replay component iterations, two isolated memory children, all raw results and JSON error-code parity.','Include production helper/index/contract source hashes before and after.'],executionRequires:'Root GO plus SPAROWTYPE_REQUEST_BODY_PRODUCTION_DIAGNOSTIC=1',servicesStarted:0,testsRun:0,productFilesChanged:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PREPARED-NOT-RUN',phpTarget,jsTarget,servicesStarted:0}));
