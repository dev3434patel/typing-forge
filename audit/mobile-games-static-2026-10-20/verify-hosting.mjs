import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve('.');
const hash = value => createHash('sha256').update(value).digest('hex');
async function files(directory, base = directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert.equal(entry.isSymbolicLink(), false);
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(location, base));
    else result.push(path.relative(base, location).replaceAll('\\', '/'));
  }
  return result;
}
const publicFiles = await files(path.join(root, 'dist'));
for (const file of publicFiles) {
  assert.equal(hash(await readFile(path.join(root, 'dist', file))),
    hash(await readFile(path.join(root, 'hosting-build/public_html', file))), file);
}
const packaged = await files(path.join(root, 'hosting-build'));
assert.equal(packaged.some(file => /(?:^|\/)config\.php$|(?:^|\/)storage\/|(?:^|\/)\.env(?:\.|$)|\.local\.php$/.test(file)), false);
assert.ok(packaged.includes('sparowtype-private/config.example.php'));
assert.ok(packaged.includes('sparowtype-private/schema.sql'));
assert.ok(packaged.includes('public_html/api/index.php'));
const build = JSON.parse(await readFile('dist/offline-build.json', 'utf8'));
const receipt = { checkedAt: new Date().toISOString(), build, publicFilesCompared: publicFiles.length,
  allPublicFilesByteIdentical: true, packageFiles: packaged.length,
  localConfigurationOrStorageIncluded: false, result: 'PASS',
  scope: 'Fresh PHP hosting package structure and bytes only; no Apache, remote upload, database configuration or deployment performed.' };
await writeFile('audit/mobile-games-static-2026-10-20/hosting-package-verification.json', JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt));
