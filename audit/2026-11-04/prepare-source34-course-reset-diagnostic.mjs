import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { verifyFrozenSource } from '../2026-10-21/artifact-verification.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const originalFile = 'e2e/typing-course.spec.ts', target = 'audit/2026-11-04/course-reset-diagnostic/typing-course.spec.ts';
const original = await readFile(originalFile, 'utf8'), eol = original.includes('\r\n') ? '\r\n' : '\n';
let source = original;
const changes = [];
const replace = (from,to) => { assert.equal(source.split(from).length, 2); source = source.replace(from,to); changes.push({from,to}); };
replace('from "./helpers";', 'from "../../../e2e/helpers";');
replace('new URL("../backend/resources/typing-course-v1.json", import.meta.url)', 'new URL("../../../backend/resources/typing-course-v1.json", import.meta.url)');
const importAnchor = 'import axe from "axe-core";';
replace(importAnchor, importAnchor + eol + 'import { beginCourseResetDiagnostic, finishCourseResetDiagnostic, diagnosticPhase } from "./collector";');
const hookAnchor = 'async function start(page: Page, lesson = first) {';
const hooks = ['test.beforeEach(async ({ page }, info) => beginCourseResetDiagnostic(page, info));','test.afterEach(async ({}, info) => finishCourseResetDiagnostic(info));','', ''].join(eol);
replace(hookAnchor,hooks+hookAnchor);
const title = 'test("two different measured passages unlock the next lesson; repetition, reload and reset are truthful",';
const first = source.indexOf(title), last = source.indexOf('test("corrected errors retain',first);
assert.ok(first>0&&last>first);
const block = source.slice(first,last), milestones=[];
let index=0;
const instrumented = block.split(eol).flatMap(line => {
  if (line==='  test.setTimeout(60_000);') return [line,'  diagnosticPhase("case-start");'];
  if (!line.startsWith('  await ')) return [line];
  const id=String(++index).padStart(2,'0');milestones.push({id,originalStatement:line.trim()});
  return [`  diagnosticPhase("before-await-${id}");`,line,`  diagnosticPhase("after-await-${id}");`];
}).join(eol);
replace(block,instrumented);
let reversed=source;for(const entry of [...changes].reverse())reversed=reversed.replace(entry.to,entry.from);assert.equal(reversed,original);
await writeFile(target,source,{flag:'wx'});
const codeFiles=[target,'audit/2026-11-04/course-reset-diagnostic/observer.ts','audit/2026-11-04/course-reset-diagnostic/collector.ts','audit/2026-11-04/course-reset-diagnostic/course-reset.config.ts'];
for(const file of codeFiles){const result=ts.transpileModule(await readFile(file,'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});assert.deepEqual(result.diagnostics.filter(item=>item.category===ts.DiagnosticCategory.Error),[],file);}
const frozen=await verifyFrozenSource('audit/2026-11-02/final34-source.json');assert.equal(frozen.receipt.compared,505);assert.deepEqual(frozen.receipt.mismatches,[]);
const inputs=[originalFile,'e2e/helpers.ts','playwright.config.ts',...codeFiles,'audit/2026-11-04/run-source34-course-reset-diagnostic.mjs'];
const report={recordedAt:new Date().toISOString(),status:'PREPARED-NOT-RUN',kind:'AUDIT-ONLY-NATIVE-COURSE-RESET-DIAGNOSTIC',source:frozen.receipt,sourceManifestSha256:hash(await readFile('audit/2026-11-02/final34-source.json')),build:frozen.frozen.local.version,originalFile,target,originalSpecSha256:hash(original),originalHelperSha256:hash(await readFile('e2e/helpers.ts')),exactReversal:true,changes,milestones,syntaxOnlyTranspileChecks:codeFiles.length,inputHashes:Object.fromEntries(await Promise.all(inputs.map(async file=>[file,hash(await readFile(file))]))),caseTitle:title,project:'webkit',workers:1,retries:0,testDeadlineMs:60000,originalActionsAssertionsAndCadenceRetained:true,additionalFlowWaits:0,logging:{browserRowsPerProfileDocument:160,nodeRowsMaximum:400,values:'DELETE/empty/other class only; no other input values, cookies or storage contents',setter:'Transparent original delegation; /profile only, installed before React mount',timingQualification:'Observational hooks and bounded streaming can perturb scheduling. This run is diagnostic and cannot replace original acceptance.'},productionAndGuardedTestsEdited:false,servicesStarted:0};
const file='audit/2026-11-04/source34-course-reset-diagnostic-preparation.json',bytes=JSON.stringify(report,null,2)+'\n';await writeFile(file,bytes,{flag:'wx'});console.log(JSON.stringify({file,sha256:hash(bytes),syntaxChecks:codeFiles.length,exactReversal:true,milestones:milestones.length}));
