// Preparation only: writes new audit runners; never starts a service or test.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const directory = 'audit/2026-10-27';
const replace = (text, from, to) => {
  assert.equal(text.split(from).length - 1, 1, `Expected one fixture boundary: ${from.slice(0, 80)}`);
  return text.replace(from, to);
};
let adapter = await readFile(`${directory}/pack-native-browser-final27-webkit-auth-confirmation.mjs`, 'utf8');
adapter = adapter.replaceAll('SPAROWTYPE_FINAL27_NATIVE_WEBKIT_AUTH_CONFIRMATION_WINDOW', 'SPAROWTYPE_FINAL27_NATIVE_FAULT_CONFIRMATION_WINDOW');
adapter = adapter.replaceAll('final27-webkit-auth-confirmation', 'final27-fault-confirmation');
adapter = adapter.replaceAll('source27 WebKit confirmation', 'source27 four-engine fault-fixture confirmation');
adapter = replace(adapter, "assert.notEqual(marker.id,'3d44c37ac589c270','The original failed owner must never be reused or reset.');", "assert.ok(!['3d44c37ac589c270','7bbf2372eea5cde5'].includes(marker.id),'Original failed owners must never be reused or reset.');");
adapter = replace(adapter, "This confirmation runs exactly all five real native cases for WebKit.", 'This confirmation runs exactly the corrected real-backend fault case for all four engines.');
adapter = replace(adapter, "scope:'Fresh-owner WebKit-only five-case auth quota follow-up; original20-caseFAILED result retained'", "scope:'Fresh-owner exact fault case in four engines after genuine first-character fixture precondition; original20 and WebKit5 failed reports retained'");
adapter = replace(adapter, "engines:['webkit'],expectedCases:5", "engines:['chromium','edge','firefox','webkit'],expectedCases:4");
adapter = replace(adapter, "originalFailedOwner:'3d44c37ac589c270',assertionsAndTimeoutsUnchanged:true", "originalFailedOwner:'3d44c37ac589c270',previousConfirmationOwner:'7bbf2372eea5cde5',existingAssertionsAndTimeoutsUnchanged:true,genuineFirstCharacterPreconditionAdded:true");
const oldSelection = "const selected=['real PHP account signup, replay upload, independent-device history/preferences and account deletion','real two-browser PHP human race shares opponent pace and settles server results','real account sign in with dedicated deployment credentials','PHP two-account race authorization and server-owned countdown','real two-browser PHP race clears recovered checkpoints and ignores late checkpoint errors after confirmed finish'];";
const title = 'real two-browser PHP race clears recovered checkpoints and ignores late checkpoint errors after confirmed finish';
adapter = replace(adapter, oldSelection, `const selected=['${title}'];`);
adapter = replace(adapter, "const exactCasesVerified=cases.length===5&&cases.every(item=>item.engine==='webkit')&&JSON.stringify(cases.map(item=>item.title).sort())===JSON.stringify([...selected].sort());", "const expectedCases=protocol.engines.map(engine=>`${engine}:${selected[0]}`).sort();const exactCasesVerified=cases.length===4&&JSON.stringify(cases.map(item=>`${item.engine}:${item.title}`).sort())===JSON.stringify(expectedCases);");

let wrapper = await readFile(`${directory}/run-final27-native-webkit-auth-confirmation.mjs`, 'utf8');
wrapper = wrapper.replaceAll('SPAROWTYPE_FINAL27_NATIVE_WEBKIT_AUTH_CONFIRMATION_WINDOW', 'SPAROWTYPE_FINAL27_NATIVE_FAULT_CONFIRMATION_WINDOW');
wrapper = wrapper.replaceAll('final27-webkit-auth-confirmation', 'final27-fault-confirmation');
wrapper = wrapper.replaceAll('final27-native-webkit-auth-confirmation', 'final27-native-fault-confirmation');
wrapper = replace(wrapper, "assert.notEqual(path.basename(readyFile),'pack-backend-3d44c37ac589c270-browser-ready.json','The original failed owner must remain closed.');", "assert.ok(!['pack-backend-3d44c37ac589c270-browser-ready.json','pack-backend-7bbf2372eea5cde5-browser-ready.json'].includes(path.basename(readyFile)),'Original failed owners must remain closed.');");
wrapper = replace(wrapper, "'Separate fresh-owner WebKit-only confirmation of the same five native titles. Original20-case16PASS/4FAIL report remains FAILED. No counter reset, rate-limit change, reused owner, capacity, hosted or physical-device claim.'", "'Separate fresh-owner exact corrected real-backend fault case in all four engines. Original20-case16PASS/4FAIL and freshWebKit5-case3PASS/2FAIL reports remain FAILED. Only the fixture first-input precondition changed; original assertions/timeouts remain. No counter reset, rate-limit change, reused owner, capacity, hosted or physical-device claim.'");
wrapper = replace(wrapper, "engines: ['webkit'], expectedCases: 5", "engines: ['chromium', 'edge', 'firefox', 'webkit'], expectedCases: 4");
wrapper = replace(wrapper, 'expectedCases: 5, workers: 1', 'expectedCases: 4, workers: 1');
wrapper = replace(wrapper, 'completed?.stats?.expected === 5', 'completed?.stats?.expected === 4');
wrapper = replace(wrapper, "originalFailedOwner: '3d44c37ac589c270', freshOwnerRequired: true", "originalFailedOwner: '3d44c37ac589c270', previousConfirmationOwner: '7bbf2372eea5cde5', freshOwnerRequired: true, genuineFirstCharacterPreconditionAdded: true");
wrapper = wrapper.replaceAll('all five original native titles for WebKit', 'the exact corrected real-backend fault case in all four engines');
for (const [name, text] of [
  ['pack-native-browser-final27-fault-confirmation.mjs', adapter],
  ['run-final27-native-fault-confirmation.mjs', wrapper],
]) await writeFile(`${directory}/${name}`, text, { flag: 'wx' });
console.log(JSON.stringify({ status: 'PREPARED-NOT-RUN', engines: ['chromium', 'edge', 'firefox', 'webkit'], expectedCases: 4, newOutputNamespace: 'final27-native-fault-confirmation', productEdits: false }));
