import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const directory = 'audit/2026-10-21';
const source = await readFile(`${directory}/measure-mobile-workspaces.mjs`, 'utf8');
const references = [
  ["process.argv[2] ?? 'mobile-workspaces'", "process.argv[2] ?? 'mobile-workspaces-final8-static'"],
  ['`${directory}/mobile-workspaces-protocol.json`', '`${directory}/mobile-workspaces-final8-static-protocol.json`'],
  ['`${directory}/after-1-build.json`', '`${directory}/mobile-workspaces-final8-static-build.json`'],
];
let driver = source;
for (const [from, to] of references) {
  assert.equal(driver.split(from).length - 1, 1);
  driver = driver.replace(from, to);
}
const previousWrapper = await readFile(`${directory}/run-mobile-workspaces-static-final7.mjs`, 'utf8');
let wrapper = previousWrapper.replaceAll('final7', 'final8');
wrapper = wrapper.replace("const sourceIdentity = 'f3ac03affbc33168655a';", "const sourceIdentity = process.env.SPAROWTYPE_FINAL8_BUILD_ID;\nassert.match(sourceIdentity ?? '', /^[a-f0-9]{20}$/);");
wrapper = wrapper.replace("const artifactIdentity = 'dc383279e8a338455910';", "const artifactIdentity = process.env.SPAROWTYPE_FINAL8_STATIC_BUILD_ID;\nassert.match(artifactIdentity ?? '', /^[a-f0-9]{20}$/);");
// Preserve the declared prior normal-mode case definitions and failures; no new
// backend-enabled run is implied by this real API-disabled acceptance window.
wrapper = wrapper.replace('const originalProtocol = `${audit}/mobile-workspaces-final8-protocol.json`;', 'const originalProtocol = `${audit}/mobile-workspaces-final7-protocol.json`;');
wrapper = wrapper.replace('preservedNormalReport: `${audit}/mobile-workspaces-final8.json`', 'preservedNormalReport: `${audit}/mobile-workspaces-final7.json`');
assert.ok(!wrapper.includes('f3ac03affbc33168655a') && !wrapper.includes('dc383279e8a338455910'));
const files = {
  [`${directory}/measure-mobile-workspaces-static-final8.mjs`]: driver,
  [`${directory}/run-mobile-workspaces-static-final8.mjs`]: wrapper,
};
for (const file of Object.keys(files)) await assert.rejects(access(file), { code: 'ENOENT' });
for (const [file, content] of Object.entries(files)) await writeFile(file, content, { flag: 'wx' });
const hash = text => createHash('sha256').update(text).digest('hex');
await writeFile(`${directory}/final8-mobile-preparation.json`, JSON.stringify({
  preparedAt: new Date().toISOString(), status: 'NOT-RUN',
  scope: 'Reference-only driver clone and explicit-build-bound static wrapper preparation. No browser, build or measurement executed.',
  source: { file: `${directory}/measure-mobile-workspaces.mjs`, sha256: hash(source) },
  references, wrapperBaseline: { file: `${directory}/run-mobile-workspaces-static-final7.mjs`, sha256: hash(previousWrapper) },
  files: Object.fromEntries(Object.entries(files).map(([file, content]) => [file, hash(content)])),
  automaticRetries: 0, thresholdsOrAssertionsChanged: false,
}, null, 2), { flag: 'wx' });
console.log('Prepared final8 static mobile drivers; execution remains NOT-RUN.');
