// Preparation only: preserve the failed runs and write a new diagnostic scope.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const directory = 'audit/2026-10-27';
const replace = (text, from, to) => {
  assert.equal(text.split(from).length - 1, 1, `Expected one diagnostic boundary: ${from.slice(0, 80)}`);
  return text.replace(from, to);
};
let adapter = await readFile(`${directory}/pack-native-browser-final27-fault-confirmation.mjs`, 'utf8');
adapter = adapter.replaceAll('SPAROWTYPE_FINAL27_NATIVE_FAULT_CONFIRMATION_WINDOW', 'SPAROWTYPE_FINAL27_NATIVE_FAULT_ROUTE_DIAGNOSTIC_WINDOW');
adapter = adapter.replaceAll('final27-fault-confirmation', 'final27-fault-route-diagnostic');
adapter = adapter.replaceAll('source27 four-engine fault-fixture confirmation', 'source27 WebKit fault-route diagnostic');
adapter = replace(adapter, "['3d44c37ac589c270','7bbf2372eea5cde5'].includes(marker.id)", "['3d44c37ac589c270','7bbf2372eea5cde5','a4cda523ada86772'].includes(marker.id)");
adapter = replace(adapter, "This confirmation runs exactly the corrected real-backend fault case for all four engines.", 'This diagnostic runs exactly the unchanged real-backend fault case once in WebKit.');
adapter = replace(adapter, "diagnostic:null,scope:'Fresh-owner exact fault case in four engines after genuine first-character fixture precondition; original20 and WebKit5 failed reports retained'", "diagnostic:'fault-route-interception',scope:'Fresh-owner one-case WebKit diagnostic; current fault assertions/deadlines unchanged, safe opt-in interception metadata only; all failed originals retained'");
adapter = replace(adapter, "engines:['chromium','edge','firefox','webkit'],expectedCases:4", "engines:['webkit'],expectedCases:1");
adapter = replace(adapter, "existingAssertionsAndTimeoutsUnchanged:true,genuineFirstCharacterPreconditionAdded:true", "existingAssertionsAndTimeoutsUnchanged:true,genuineFirstCharacterPreconditionAdded:true,faultRouteAuditEnabled:true,serviceWorkersBlocked:false");
adapter = replace(adapter, "browserEnv.FORGE_E2E_AUTH_EMAIL=", "browserEnv.SPAROWTYPE_NATIVE_FAULT_ROUTE_AUDIT='1';\nbrowserEnv.FORGE_E2E_AUTH_EMAIL=");
adapter = replace(adapter, 'const exactCasesVerified=cases.length===4&&', 'const exactCasesVerified=cases.length===1&&');

let wrapper = await readFile(`${directory}/run-final27-native-fault-confirmation.mjs`, 'utf8');
wrapper = wrapper.replaceAll('SPAROWTYPE_FINAL27_NATIVE_FAULT_CONFIRMATION_WINDOW', 'SPAROWTYPE_FINAL27_NATIVE_FAULT_ROUTE_DIAGNOSTIC_WINDOW');
wrapper = wrapper.replaceAll('final27-fault-confirmation', 'final27-fault-route-diagnostic');
wrapper = wrapper.replaceAll('final27-native-fault-confirmation', 'final27-native-fault-route-diagnostic');
wrapper = replace(wrapper, "'pack-backend-7bbf2372eea5cde5-browser-ready.json'].includes", "'pack-backend-7bbf2372eea5cde5-browser-ready.json','pack-backend-a4cda523ada86772-browser-ready.json'].includes");
wrapper = wrapper.replaceAll('the exact corrected real-backend fault case in all four engines, never a diagnostic subset', 'exactly the unchanged fault case once in WebKit with opt-in bounded interception metadata');
wrapper = replace(wrapper, "'Separate fresh-owner exact corrected real-backend fault case in all four engines. Original20-case16PASS/4FAIL and freshWebKit5-case3PASS/2FAIL reports remain FAILED. Only the fixture first-input precondition changed; original assertions/timeouts remain. No counter reset, rate-limit change, reused owner, capacity, hosted or physical-device claim.'", "'Separate fresh-owner one-case WebKit fault-route diagnostic. Current fault assertions/timeouts remain unchanged and service workers remain enabled. The only additions are opt-in bounded finally metadata, without headers, bodies, DOM text or credentials. Original20, WebKit5 and fault4 FAILED reports remain unchanged. No counter reset, rate-limit change, reused owner, capacity, hosted or physical-device claim.'");
wrapper = replace(wrapper, "engines: ['chromium', 'edge', 'firefox', 'webkit'], expectedCases: 4", "engines: ['webkit'], expectedCases: 1");
wrapper = replace(wrapper, 'expectedCases: 4, workers: 1', 'expectedCases: 1, workers: 1');
wrapper = replace(wrapper, 'completed?.stats?.expected === 4', 'completed?.stats?.expected === 1');
wrapper = replace(wrapper, "freshOwnerRequired: true, genuineFirstCharacterPreconditionAdded: true", "freshOwnerRequired: true, genuineFirstCharacterPreconditionAdded: true, faultRouteAuditEnabled: true, serviceWorkersBlocked: false");
for (const [name, text] of [
  ['pack-native-browser-final27-fault-route-diagnostic.mjs', adapter],
  ['run-final27-native-fault-route-diagnostic.mjs', wrapper],
]) await writeFile(`${directory}/${name}`, text, { flag: 'wx' });
console.log(JSON.stringify({ status: 'PREPARED-NOT-RUN', engine: 'webkit', expectedCases: 1, optIn: 'SPAROWTYPE_NATIVE_FAULT_ROUTE_AUDIT=1', serviceWorkersBlocked: false, productEdits: false }));
