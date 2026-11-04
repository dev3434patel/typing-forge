// New scope only. Do not replace any failed confirmation or diagnostic runner.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const directory = 'audit/2026-10-27';
const replace = (text, from, to) => {
  assert.equal(text.split(from).length - 1, 1, `Expected one routing-isolation boundary: ${from.slice(0, 80)}`);
  return text.replace(from, to);
};
let adapter = await readFile(`${directory}/pack-native-browser-final27-fault-confirmation.mjs`, 'utf8');
adapter = adapter.replaceAll('SPAROWTYPE_FINAL27_NATIVE_FAULT_CONFIRMATION_WINDOW', 'SPAROWTYPE_FINAL27_NATIVE_ROUTED_FAULT_CONFIRMATION_WINDOW');
adapter = adapter.replaceAll('final27-fault-confirmation', 'final27-routed-fault-confirmation');
adapter = adapter.replaceAll('source27 four-engine fault-fixture confirmation', 'source27 four-engine route-isolated fault confirmation');
adapter = replace(adapter, "['3d44c37ac589c270','7bbf2372eea5cde5'].includes(marker.id)", "['3d44c37ac589c270','7bbf2372eea5cde5','a4cda523ada86772','6a2da7a72dc80e8e'].includes(marker.id)");
adapter = replace(adapter, "scope:'Fresh-owner exact fault case in four engines after genuine first-character fixture precondition; original20 and WebKit5 failed reports retained'", "scope:'Fresh-owner exact routed-fault case in four engines; serviceWorkers:block is local to appended fault test and peer context. Existing assertions/timeouts unchanged; new controller-null and route-hit controls. All original failures retained; SW response causality unproven.'");
adapter = replace(adapter, "existingAssertionsAndTimeoutsUnchanged:true,genuineFirstCharacterPreconditionAdded:true", "existingAssertionsAndTimeoutsUnchanged:true,genuineFirstCharacterPreconditionAdded:true,serviceWorkersBlockedOnlyForFaultCase:true,controllerNullAndRouteHitControlsAdded:true,faultRouteAuditEnabled:true,originalHumanRaceAndPwaWorkerBehaviorChanged:false");
adapter = replace(adapter, 'browserEnv.FORGE_E2E_AUTH_EMAIL=', "browserEnv.SPAROWTYPE_NATIVE_FAULT_ROUTE_AUDIT='1';\nbrowserEnv.FORGE_E2E_AUTH_EMAIL=");

let wrapper = await readFile(`${directory}/run-final27-native-fault-confirmation.mjs`, 'utf8');
wrapper = wrapper.replaceAll('SPAROWTYPE_FINAL27_NATIVE_FAULT_CONFIRMATION_WINDOW', 'SPAROWTYPE_FINAL27_NATIVE_ROUTED_FAULT_CONFIRMATION_WINDOW');
wrapper = wrapper.replaceAll('final27-fault-confirmation', 'final27-routed-fault-confirmation');
wrapper = wrapper.replaceAll('final27-native-fault-confirmation', 'final27-native-routed-fault-confirmation');
wrapper = replace(wrapper, "'pack-backend-7bbf2372eea5cde5-browser-ready.json'].includes", "'pack-backend-7bbf2372eea5cde5-browser-ready.json','pack-backend-a4cda523ada86772-browser-ready.json','pack-backend-6a2da7a72dc80e8e-browser-ready.json'].includes");
wrapper = replace(wrapper, "'Separate fresh-owner exact corrected real-backend fault case in all four engines. Original20-case16PASS/4FAIL and freshWebKit5-case3PASS/2FAIL reports remain FAILED. Only the fixture first-input precondition changed; original assertions/timeouts remain. No counter reset, rate-limit change, reused owner, capacity, hosted or physical-device claim.'", "'Separate fresh-owner route-isolated real-backend fault case in all four engines. Service workers are blocked only in this appended route-controlled test and its peer context. Existing assertions/timeouts remain; controller-null and positive-route controls are added. All original native and diagnostic failures remain unchanged. No app/SW-source change, rate-limit change, counter reset, hosted or physical-device claim; original realhuman and PWA tests retain normal SW behavior.'");
wrapper = replace(wrapper, "freshOwnerRequired: true, genuineFirstCharacterPreconditionAdded: true", "freshOwnerRequired: true, genuineFirstCharacterPreconditionAdded: true, serviceWorkersBlockedOnlyForFaultCase: true, controllerNullAndRouteHitControlsAdded: true, faultRouteAuditEnabled: true, originalHumanRaceAndPwaWorkerBehaviorChanged: false");
for (const [name, text] of [
  ['pack-native-browser-final27-routed-fault-confirmation.mjs', adapter],
  ['run-final27-native-routed-fault-confirmation.mjs', wrapper],
]) await writeFile(`${directory}/${name}`, text, { flag: 'wx' });
console.log(JSON.stringify({ status: 'PREPARED-NOT-RUN', engines: ['chromium', 'edge', 'firefox', 'webkit'], expectedCases: 4, serviceWorkersBlockedOnlyForFaultCase: true, productEdits: false }));
