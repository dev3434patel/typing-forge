import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const directory = 'audit/correction-experience-2026-10-20';
const frozen = JSON.parse(await readFile(`${directory}/source-build.json`, 'utf8')).local;
async function files(root, prefix = '') {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    assert.equal(entry.isSymbolicLink(), false);
    if (entry.isDirectory()) result.push(...await files(path.join(root, entry.name), `${prefix}${entry.name}/`));
    else if (entry.isFile()) result.push(`${prefix}${entry.name}`);
  }
  return result.sort();
}
const sha = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const publicRoot = 'hosting-build/public_html', privateRoot = 'hosting-build/sparowtype-private';
assert.deepEqual(JSON.parse(await readFile('dist/offline-build.json', 'utf8')), frozen);
assert.deepEqual(JSON.parse(await readFile(`${publicRoot}/offline-build.json`, 'utf8')), frozen);
const distFiles = await files('dist');
assert.deepEqual(await files(publicRoot), [...distFiles, '.htaccess', 'api/.htaccess', 'api/index.php'].sort());
for (const file of distFiles) assert.equal(await sha(`dist/${file}`), await sha(`${publicRoot}/${file}`), file);
const expectedPrivate = [];
for (const name of ['src', 'bin', 'public', 'resources'])
  expectedPrivate.push(...(await files(`backend/${name}`)).map(file => `${name}/${file}`));
expectedPrivate.push('bootstrap.php', 'config.example.php', 'schema.sql', 'UNICODE-LICENSE.txt', '.htaccess');
assert.deepEqual(await files(privateRoot), expectedPrivate.sort());
for (const file of expectedPrivate) assert.equal(await sha(`backend/${file}`), await sha(`${privateRoot}/${file}`), file);
const report = { checkedAt: new Date().toISOString(), build: frozen, publicFileCount: distFiles.length + 3, privateFileCount: expectedPrivate.length, exactPublicAndPrivateFileSetsAndHashes: true, privateConfigIncluded: false, storageOrTestsIncluded: false, frontendRebuiltDuringPackaging: false, externalDeployment: false, note: 'Read-only package hygiene after packaging current dist; no new native HTTP, database or Apache acceptance claimed for this correction-policy release.' };
await writeFile(`${directory}/hosting-package.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
