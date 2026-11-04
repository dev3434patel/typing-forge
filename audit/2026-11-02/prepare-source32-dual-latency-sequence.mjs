// Preparation only. Preserve the failed source31 sequence and all trial reports.
import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const directory='audit/2026-11-02';
const originalFile=`${directory}/run-final31-static-mobile-sequence.mjs`,target=`${directory}/run-final32-static-mobile-sequence.mjs`;
await assert.rejects(access(target),{code:'ENOENT'});
const original=await readFile(originalFile,'utf8');
const renamed=original.replaceAll('FINAL31','FINAL32').replaceAll('final31','final32').replaceAll('source31','source32');
let candidate=renamed;const transforms=[];
function replace(from,to){assert.equal(candidate.split(from).length-1,1,from.slice(0,90));candidate=candidate.replace(from,to);transforms.push({from,to});}
replace('const assessmentFile = `${directory}/assess-final32-mobile-latency.mjs`;',
  'const assessmentFile = `${directory}/assess-final32-mobile-latency.mjs`;\nconst interactionFile = `${directory}/assess-final32-mobile-interaction-latency.mjs`;');
replace('const inputs = [import.meta.filename, sourceFile, staticFile, mobileFile, assessmentFile,','const inputs = [import.meta.filename, sourceFile, staticFile, mobileFile, assessmentFile, interactionFile,');
replace('`${directory}/${prefix}-latency-assessment.json`])])','`${directory}/${prefix}-latency-assessment.json`, `${directory}/${prefix}-interaction-latency-assessment.json`])])');
replace('  workers: 1, retries: 0, staticAndMobileRunSequentially: true, automaticRetries: 0, resultFiltering: false,',
  "  interactionAcceptance: 'Additionally every workspace in every declared trial must have p98ObservedInteractionMaximumMs strictly below100ms; event and interaction counts are retained and neither gate replaces the other.',\n  source32EventCardinalityChangeDisclosed: true,\n  workers: 1, retries: 0, staticAndMobileRunSequentially: true, automaticRetries: 0, resultFiltering: false,");
replace('    report.mobileTrials.push({ prefix, measurementStatus: measured.status, process: processPath,\n      latencyStatus: assessment.status, assessment: assessmentPath, cases: assessment.cases });',
  '    const interactionRun = await run(`${prefix}-interaction-assessment`, interactionFile, [prefix]);\n    const interactionPath = `${directory}/${prefix}-interaction-latency-assessment.json`;\n    const interaction = JSON.parse(await readFile(interactionPath, \'utf8\'));\n    report.mobileTrials.push({ prefix, measurementStatus: measured.status, process: processPath,\n      latencyStatus: assessment.status, assessment: assessmentPath, cases: assessment.cases,\n      interactionGateStatus: interaction.status, interactionAssessment: interactionPath, interactionCases: interaction.cases });\n    if (interactionRun.status !== \'PASS-SCOPED\') report.anyMobileInteractionFailure = true;');
replace("&& report.mobileTrials.every(trial => trial.latencyStatus === 'PASS-SCOPED') ?", "&& report.mobileTrials.every(trial => trial.latencyStatus === 'PASS-SCOPED' && trial.interactionGateStatus === 'PASS-SCOPED') ?");
replace('prefix: trial.prefix, status: trial.latencyStatus, p98:', 'prefix: trial.prefix, status: trial.latencyStatus, interactionGateStatus: trial.interactionGateStatus, p98:');
let reversed=candidate;for(const change of [...transforms].reverse()){assert.equal(reversed.split(change.to).length-1,1);reversed=reversed.replace(change.to,change.from);}
assert.equal(reversed,renamed);assert.equal(renamed.replaceAll('FINAL32','FINAL31').replaceAll('final32','final31').replaceAll('source32','source31'),original);
await writeFile(target,candidate,{flag:'wx'});
const hash=value=>createHash('sha256').update(value).digest('hex');
await writeFile(`${directory}/source32-dual-latency-sequence-preparation.json`,JSON.stringify({preparedAt:new Date().toISOString(),status:'PREPARED-NOT-RUN',
  original:originalFile,originalSha256:hash(original),target,targetSha256:hash(candidate),identifierReversal:true,declaredTransformReversal:true,transforms,
  eventGateUnmodified:true,interactionGateAdded:true,allThreeTrialsRetainedEvenOnMetricFailure:true,source31ReportsPreserved:true,
  executionPrerequisite:'Root GO only after both source32 candidate event and interaction gates pass and the appropriate heavy-job window is free.',
  servicesStarted:0,testsRun:0,productFilesChanged:false,
},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({target,status:'PREPARED-NOT-RUN',transforms:transforms.length,runtimeJobs:0}));
