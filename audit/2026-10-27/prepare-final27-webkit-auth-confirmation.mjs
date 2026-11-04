// Preparation only: writes new audit runners; never starts a service or test.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const directory = 'audit/2026-10-27';
const replace = (text, from, to) => {
  assert.equal(text.split(from).length - 1, 1, `Expected one adapter boundary: ${from.slice(0, 80)}`);
  return text.replace(from, to);
};
let adapter = await readFile(`${directory}/pack-native-browser-final27.mjs`, 'utf8');
adapter = replace(adapter, "import { readFile, realpath, writeFile } from 'node:fs/promises';", "import { readFile, readdir, realpath, writeFile } from 'node:fs/promises';");
adapter = replace(adapter, "assert.equal(process.env.SPAROWTYPE_PACK_BROWSER_ACCEPTANCE,'1','Wait for the separately coordinated native browser stage.');", "assert.equal(process.env.SPAROWTYPE_FINAL27_NATIVE_WEBKIT_AUTH_CONFIRMATION_WINDOW,'1','Wait for the separately coordinated source27 WebKit confirmation.');\nassert.equal(process.env.SPAROWTYPE_PACK_BROWSER_ACCEPTANCE,'1','Wait for the separately coordinated native browser stage.');");
adapter = replace(adapter, "const attempt=`${marker.id}-${Date.now()}`,prefix=path.join(here,`pack-native-final27-${attempt}`);", "assert.notEqual(marker.id,'3d44c37ac589c270','The original failed owner must never be reused or reset.');\nconst prior=(await readdir(here)).filter(name=>name.startsWith('pack-native-')&&name.includes(`-${marker.id}-`)&&name.endsWith('-protocol.json'));\nassert.deepEqual(prior,[],'Use a fresh distinct owner with no previous native-browser run.');\nconst attempt=`${marker.id}-${Date.now()}`,prefix=path.join(here,`pack-native-final27-webkit-auth-confirmation-${attempt}`);");
const diagnosticStart = adapter.indexOf("const diagnostic=process.env.SPAROWTYPE_PACK_BROWSER_DIAGNOSTIC==='webkit-humanrace';");
const protocolEnd = adapter.indexOf("await writeFile(`${prefix}-protocol.json`", diagnosticStart);
assert.ok(diagnosticStart > 0 && protocolEnd > diagnosticStart);
adapter = adapter.slice(0, diagnosticStart) + "assert.ok(!process.env.SPAROWTYPE_PACK_BROWSER_DIAGNOSTIC,'This confirmation runs exactly all five real native cases for WebKit.');\nconst protocol={declaredAt:new Date().toISOString(),diagnostic:null,scope:'Fresh-owner WebKit-only five-case auth quota follow-up; original20-caseFAILED result retained',expectedBuild:process.env.SPAROWTYPE_PACK_EXPECT_BUILD,readyReceipt:path.basename(readyPath),databaseNamespace:`sparow_pack_${marker.id}_audit`,engines:['webkit'],expectedCases:5,workers:1,retries:0,traces:false,countersReset:false,accountsReseeded:false,originalServicesTouched:false,freshOwner:true,originalFailedOwner:'3d44c37ac589c270',assertionsAndTimeoutsUnchanged:true};\n" + adapter.slice(protocolEnd);
adapter = replace(adapter, "const selected=diagnostic?['real two-browser PHP human race shares opponent pace and settles server results']:", 'const selected=');
adapter = replace(adapter, '`.playwright-artifacts-pack-native-final27-${attempt}`', '`.playwright-artifacts-pack-native-final27-webkit-auth-confirmation-${attempt}`');
adapter = replace(adapter, 'const stats=report?.stats??null,summary={status:exitCode===0&&stats?.expected===protocol.expectedCases&&stats?.unexpected===0&&stats?.skipped===0?', "const cases=[];const collect=suite=>{for(const spec of suite.specs??[])for(const item of spec.tests??[])cases.push({title:spec.title,engine:item.projectName});for(const childSuite of suite.suites??[])collect(childSuite);};for(const suite of report?.suites??[])collect(suite);const exactCasesVerified=cases.length===5&&cases.every(item=>item.engine==='webkit')&&JSON.stringify(cases.map(item=>item.title).sort())===JSON.stringify([...selected].sort());\n const stats=report?.stats??null,summary={exactCasesVerified,actualCases:cases,status:exitCode===0&&exactCasesVerified&&stats?.expected===protocol.expectedCases&&stats?.unexpected===0&&stats?.skipped===0?");

let wrapper = await readFile(`${directory}/run-final27-native-browser.mjs`, 'utf8');
wrapper = wrapper.replaceAll('SPAROWTYPE_FINAL27_NATIVE_BROWSER_WINDOW', 'SPAROWTYPE_FINAL27_NATIVE_WEBKIT_AUTH_CONFIRMATION_WINDOW');
wrapper = wrapper.replaceAll('pack-native-browser-final27.mjs', 'pack-native-browser-final27-webkit-auth-confirmation.mjs');
wrapper = wrapper.replaceAll('final27-native-browser', 'final27-native-webkit-auth-confirmation');
wrapper = wrapper.replaceAll('all20 native cases', 'all five original native titles for WebKit');
wrapper = replace(wrapper, "assert.match(path.basename(readyFile), /^pack-backend-[a-f0-9]{16}-browser-ready\\.json$/);", "assert.match(path.basename(readyFile), /^pack-backend-[a-f0-9]{16}-browser-ready\\.json$/);\nassert.notEqual(path.basename(readyFile),'pack-backend-3d44c37ac589c270-browser-ready.json','The original failed owner must remain closed.');");
wrapper = replace(wrapper, "'Original16 native cases plus one new real human-race regression per engine (20 total) against a separately owned fresh Apache/PHP/PDO/MariaDB instance and its build-matched preview. No capacity, hosted or physical-keyboard-device claim.'", "'Separate fresh-owner WebKit-only confirmation of the same five native titles. Original20-case16PASS/4FAIL report remains FAILED. No counter reset, rate-limit change, reused owner, capacity, hosted or physical-device claim.'");
wrapper = replace(wrapper, "engines: ['chromium', 'edge', 'firefox', 'webkit'], expectedCases: 20", "engines: ['webkit'], expectedCases: 5");
wrapper = replace(wrapper, 'caseSelectionAndAssertionsChanged: true, existingCaseAssertionsChanged: false, addedCasesPerEngine: 1', 'caseSelectionAndAssertionsChanged: false, existingCaseAssertionsChanged: false, existingTimeoutsChanged: false, addedCasesPerEngine: 0, originalFailedOwner: \'3d44c37ac589c270\', freshOwnerRequired: true');
wrapper = replace(wrapper, 'expectedCases: 20, workers: 1', 'expectedCases: 5, workers: 1');
wrapper = replace(wrapper, 'completed?.stats?.expected === 20', 'completed?.exactCasesVerified === true && completed?.stats?.expected === 5');
wrapper = replace(wrapper, "`${directory}/pack-native-browser-final27-webkit-auth-confirmation.mjs`, `${directory}/pack-backend-instance-source27.mjs`,", "`${directory}/pack-native-browser-final27-webkit-auth-confirmation.mjs`, `${directory}/pack-native-browser-final27.mjs`, `${directory}/run-final27-native-browser.mjs`, `${directory}/pack-backend-instance-source27.mjs`,");
for (const [name, text] of [
  ['pack-native-browser-final27-webkit-auth-confirmation.mjs', adapter],
  ['run-final27-native-webkit-auth-confirmation.mjs', wrapper],
]) await writeFile(`${directory}/${name}`, text, { flag: 'wx' });
console.log(JSON.stringify({ status: 'PREPARED-NOT-RUN', engines: ['webkit'], expectedCases: 5, newOutputNamespace: 'final27-native-webkit-auth-confirmation', productOrTestEdits: false }));
