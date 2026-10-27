import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { argumentsFor, reserve, filesWithin, hash, json, migrations, verifyFrozenSource, workerRouteContract, sceneAssets, qualityBaseline, compareQuality } from './artifact-verification.mjs';

const options = argumentsFor(['--prefix', '--source', '--prior', '--prior-public']);
const { report, check, finish } = await reserve(options['--prefix'] || 'final5', 'hosting-package-verification');
report.scope = 'Fresh PHP package structure, exact public/private-source bytes, additive migrations/CLI and frozen 3D/source integrity only. Apache execution, database installation and remote hosting are not performed.';
try {
  const { frozen, receipt } = await verifyFrozenSource(options['--source'] || 'audit/2026-10-21/final5-source.json'); report.source = receipt;
  check('current product source matches frozen final identity', receipt.mismatches.length === 0, receipt);
  const publicFiles = await filesWithin('dist'), packaged = await filesWithin('hosting-build'), publicPackaged = await filesWithin('hosting-build/public_html');
  report.build = await json('dist/offline-build.json');
  check('PHP public artifact matches frozen build identity', JSON.stringify(report.build) === JSON.stringify(frozen.local));
  const publicComparisons = [];
  for (const file of publicFiles) { const source = hash(await readFile(path.join('dist', file))), packed = hash(await readFile(path.join('hosting-build/public_html', file))); publicComparisons.push({ file, sha256: source, pass: source === packed }); }
  report.publicFiles = publicComparisons;
  check('all public build files are byte-identical in package', publicComparisons.every(row => row.pass));
  check('public tree contains only build plus reviewed API wrapper/headers', publicPackaged.every(file => publicFiles.includes(file) || ['api/index.php', 'api/.htaccess', '.htaccess'].includes(file)));
  check('no local config, session store, environment or private key packaged', !packaged.some(file => /(?:^|\/)(?:config\.php|storage|\.git)(?:\/|$)|(?:^|\/)\.env(?:\.|$)|(?:\.local\.php|\.pem|\.key)$/i.test(file)));
  check('private backend never appears below public_html', !publicPackaged.some(file => /(?:^|\/)(?:src|bin|migrations|resources|schema\.sql|config\.example\.php)(?:\/|$)|\.sql$/.test(file)));
  const expectedPrivate = [], backendPaths = ['src', 'bin', 'public', 'resources', 'migrations', 'bootstrap.php', 'config.example.php', 'schema.sql', 'UNICODE-LICENSE.txt', '.htaccess'];
  for (const item of backendPaths) { const location = path.join('backend', item); if ((await stat(location)).isDirectory()) for (const file of await filesWithin(location)) expectedPrivate.push(`${item}/${file}`); else expectedPrivate.push(item); }
  const privateComparisons = [];
  for (const file of expectedPrivate) { const sourceFile = `backend/${file}`, expected = hash(await readFile(sourceFile)), packed = hash(await readFile(`hosting-build/sparowtype-private/${file}`)); privateComparisons.push({ file: sourceFile, sha256: expected, pass: expected === packed, inFrozenSourceManifest: Object.hasOwn(frozen.sourceHashes, sourceFile) }); }
  report.privateSources = privateComparisons;
  check('every shipped backend source/resource/migration byte matches workspace', privateComparisons.every(row => row.pass));
  const privatePackaged = await filesWithin('hosting-build/sparowtype-private');
  check('private package includes only explicit reviewed source allowlist', privatePackaged.length === expectedPrivate.length && privatePackaged.every(file => expectedPrivate.includes(file)));
  for (const migration of migrations) check(`${migration} included with frozen hash`, privateComparisons.some(row => row.file === `backend/migrations/${migration}` && row.pass && row.inFrozenSourceManifest));
  for (const cli of ['install-schema.php', 'migrate-schema.php']) {
    const file = `backend/bin/${cli}`, content = await readFile(file, 'utf8');
    check(`${cli} packaged exactly and frozen`, privateComparisons.some(row => row.file === file && row.pass && row.inFrozenSourceManifest));
    check(`${cli} references every required additive migration`, migrations.every(migration => content.includes(migration)));
    check(`${cli} remains CLI-only with explicit config/database choice`, content.includes("PHP_SAPI !== 'cli'") && content.includes("['config:', 'database:'"));
  }
  const wrapper = await readFile('hosting-build/public_html/api/index.php', 'utf8');
  check('public API wrapper resolves only sibling private API', wrapper === "<?php\ndeclare(strict_types=1);\nrequire dirname(__DIR__, 2).'/sparowtype-private/public/index.php';\n");
  check('private directory has Apache deny boundary', (await readFile('hosting-build/sparowtype-private/.htaccess', 'utf8')).replace(/^\s*#.*$/gm, '').trim() === 'Require all denied');
  check('packaged setup guide is current source guide', hash(await readFile('hosting-build/SETUP.md')) === hash(await readFile('docs/PHP_XAMPP_SETUP.md')));
  const routeContract = workerRouteContract(await readFile('hosting-build/public_html/sw.js', 'utf8'), false); report.offlineRouteContract = routeContract;
  check('PHP offline allowlist is exact and retains private boundaries', routeContract.exact && routeContract.privateOrUnknownExcluded);
  const baseline = await qualityBaseline(options['--prior'] || 'audit/mobile-games-static-2026-10-20/static-after5-artifacts.json', options['--prior-public'] || 'audit/mobile-games-static-2026-10-20/before-config-build-public-sha256.json');
  report.sceneAssets = await sceneAssets('hosting-build/public_html', publicPackaged); report.visualComparisons = compareQuality(report.sceneAssets, baseline);
  for (const comparison of report.visualComparisons) check(`${comparison.kind} quality bytes retained from checkpoint`, comparison.pass, comparison.comparison);
  report.publicFilesCompared = publicFiles.length; report.packageFiles = packaged.length;
} catch (error) { report.error = { name: error.name, message: error.message }; }
await finish();
