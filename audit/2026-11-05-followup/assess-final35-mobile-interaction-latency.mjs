// Separate stricter source35 assessment; never changes or reruns a measurement.
import assert from 'node:assert/strict';
import { access, readFile, writeFile } from 'node:fs/promises';
import { hash, verifyFrozenSource } from './artifact-verification.mjs';
const prefix=process.argv[2];
assert.match(prefix??'',/^mobile-workspaces-final35-static(?:-[a-z0-9]+)*$/);assert.equal(process.argv.length,3);
const directory='audit/2026-11-05-followup',output=`${directory}/${prefix}-interaction-latency-assessment.json`;
await assert.rejects(access(output),{code:'ENOENT'},'Every prior report is preserved.');
const build=process.env.SPAROWTYPE_FINAL35_BUILD_ID;assert.match(build??'',/^[a-f0-9]{20}$/);
const sourceFile=`${directory}/final35-source.json`,source=await verifyFrozenSource(sourceFile);
assert.equal(source.frozen.local.version,build);assert.equal(source.receipt.compared,506);assert.deepEqual(source.receipt.mismatches,[]);
const files=[`${directory}/${prefix}.json`,`${directory}/${prefix}-process.json`,`${directory}/${prefix}-protocol.json`,`${directory}/${prefix}-latency-assessment.json`];
const bytes=await Promise.all(files.map(file=>readFile(file))),[raw,processReport,protocol,eventAssessment]=bytes.map(value=>JSON.parse(value));
assert.equal(protocol.sourceFile,sourceFile);assert.equal(protocol.sourceExpectedBuild,build);assert.equal(raw.build.version,protocol.expectedBuild);
assert.equal(raw.completed,true);assert.equal(raw.watchdogExpired,false);assert.deepEqual(raw.cases.map(item=>item.id),['learn','course','local-bot','games']);
assert.equal(processReport.ownBrowserChildExited,true);assert.equal(processReport.ownedServerClosed,true);assert.deepEqual(processReport.apiRequests,[]);
const cases=raw.cases.map(item=>{
  const timing=item.timing,p98=timing?.p98ObservedInteractionMaximumMs,count=timing?.measuredInteractionsAtLeast16ms;
  const measured=timing?.eventTimingSupported===true&&Number.isFinite(p98)&&p98>=0&&Number.isInteger(count)&&count>0;
  return{id:item.id,functionalPassed:item.passed===true,interactionMetric:'Browser EventTiming interactionId maximum duration',
    p98ObservedInteractionMaximumMs:p98??null,measuredInteractionsAtLeast16ms:count??null,
    observedTypingEventsAtLeast16ms:timing?.observedTypingEventsAtLeast16ms??null,observedBeforeInputEvents:timing?.observedBeforeInputEvents??null,
    originalEventP98Ms:timing?.p98ObservedTypingEventDurationMs??null,targetMs:100,comparison:'<',
    interactionLatencyStatus:!measured?'UNVERIFIED':p98<100?'PASS-SCOPED':'FAILED'};
});
const functionalPassed=processReport.status==='PASS-SCOPED'&&cases.every(item=>item.functionalPassed);
const interactionStatus=!functionalPassed||cases.some(item=>item.interactionLatencyStatus==='FAILED')?'FAILED':cases.some(item=>item.interactionLatencyStatus==='UNVERIFIED')?'UNVERIFIED':'PASS-SCOPED';
const status=interactionStatus==='FAILED'||eventAssessment.status==='FAILED'?'FAILED':interactionStatus==='PASS-SCOPED'&&eventAssessment.status==='PASS-SCOPED'?'PASS-SCOPED':'UNVERIFIED';
await writeFile(output,JSON.stringify({assessedAt:new Date().toISOString(),status,interactionStatus,originalEventGateStatus:eventAssessment.status,
  source:source.receipt,inputs:Object.fromEntries(files.map((file,index)=>[file,hash(bytes[index])])),cases,functionalPassed,
  acceptance:'Both every-workspace original event-p98<100ms and every-workspace interaction-maximum-p98<100ms must pass. Unsupported/null measurements are UNVERIFIED. No averaging across workspaces or trials.',
  eventCardinalityDisclosure:'Trusted cancelable source35 beforeinput may prevent redundant native input events. Original pressSequentially actions, event filter and beforeinput target accounting are unchanged; event and interaction sample counts are retained. This extra gate tightens criteria and never rewrites source31 failures.',
  browserMeasurementsExecuted:0,automaticRetries:0,resultFiltering:false,fieldInpClaimed:false,physicalDeviceClaimed:false,
},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,status,interactionStatus,originalEventGateStatus:eventAssessment.status,cases}));
process.exitCode=status==='PASS-SCOPED'?0:1;
