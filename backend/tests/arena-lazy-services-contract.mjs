import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

const directory = 'backend/tests/lazy-services', runtime = phpRuntime();
const sourceHash = bytes => createHash('sha256').update(bytes.toString('utf8').replaceAll('\r\n', '\n')).digest('hex');
const referenceHashes = {
  'backend/public/index.php': '92382a84ac652b38198711bc86973245a6a6dbc4af0aeaefb796ee0267618d76',
  'backend/src/ArenaService.php': '5076d6095607e652ee481b9dce772658996ee63ddea49a092414e01993f59392',
  'backend/src/ArenaEvidence.php': 'ea182239afb2420f6ae42f83b0ff6ac25fe4ce3fa7f2fc1d786bdf6dfc2e72af',
};
for (const [file, expected] of Object.entries(referenceHashes)) assert.equal(sourceHash(await readFile(`${directory}/reference/${file}`)), expected, `Frozen Source35 reference changed: ${file}`);
const cases = [...['baseline', 'candidate'].flatMap(variant => ['non-submit', 'checkpoint', 'finish'].map(mode => ({ variant, mode }))), ...['malformed-finish', 'malformed-candidate', 'missing-validator-prepare', 'finish-missing-data', 'missing-validator-submit', 'missing-data-submit'].map(mode => ({ variant: 'candidate', mode }))];
const runs = cases.map(input => {
  const result = spawnSync(runtime.binary, [...runtime.args, `${directory}/autoload-probe.php`], { input: JSON.stringify(input), encoding: 'utf8', windowsHide: true, timeout: 15000, maxBuffer: 1024 * 1024 });
  let data = null; try { data = JSON.parse(result.stdout); } catch { /* Preserve a failed child as a failing contract. */ }
  return { input, exit: result.status, stderr: result.stderr, data };
});
const checks = [], check = (name, pass) => checks.push({ name, pass: Boolean(pass) });
check('all twelve fresh PHP children return bounded JSON without stderr', runs.length === 12 && runs.every(row => row.exit === 0 && row.data && row.stderr === ''));
const get = (variant, mode) => runs.find(row => row.input.variant === variant && row.input.mode === mode)?.data;
for (const mode of ['non-submit', 'checkpoint', 'finish']) {
  const a = get('baseline', mode), b = get('candidate', mode);
  check(`${mode} original and lazy dependency construction succeed`, a?.error === null && b?.error === null);
  check(`${mode} canonical candidate bytes and prepared full/marker shape stay exact`, a?.canonicalCandidateSha256 === b?.canonicalCandidateSha256 && a?.completeFinishBundle === b?.completeFinishBundle && a?.checkpointMarker === b?.checkpointMarker);
  check(`${mode} genuine independent replay/write parameters stay exact`, JSON.stringify(a?.writes) === JSON.stringify(b?.writes));
  check(`${mode} service/evidence retain the same validator object`, a?.sameValidatorIdentity === true && b?.sameValidatorIdentity === true);
}
check('baseline non-submit eagerly loads both existing heavy classes', get('baseline', 'non-submit')?.validatorLoaded && get('baseline', 'non-submit')?.dataLoaded);
check('nullable genuine ArenaService does not autoload either unused class', get('candidate', 'non-submit')?.validatorLoaded === false && get('candidate', 'non-submit')?.dataLoaded === false && JSON.stringify(get('candidate', 'non-submit')?.loaded) === JSON.stringify(['ArenaService']));
check('checkpoint loads actual validator but never loads DataService even after actual prepare and locked replay/write', get('candidate', 'checkpoint')?.validatorLoaded === true && get('candidate', 'checkpoint')?.dataLoaded === false && get('candidate', 'checkpoint')?.writes.length === 1);
check('finish loads persistence and retains the complete default full bundle', get('candidate', 'finish')?.dataLoaded === true && get('candidate', 'finish')?.completeFinishBundle === true);
for (const mode of ['malformed-finish', 'malformed-candidate']) check(`${mode} remains arena-candidate422 before missing dependencies`, get('candidate', mode)?.error?.status === 422 && get('candidate', mode)?.error?.code === 'arena-candidate' && get('candidate', mode)?.writes.length === 0);
for (const mode of ['missing-validator-prepare', 'finish-missing-data', 'missing-validator-submit', 'missing-data-submit']) check(`${mode} fails closed internally before any write`, get('candidate', mode)?.error?.class === 'LogicException' && get('candidate', mode)?.writes.length === 0);
check('frozen reference/current production selection stays explicit', runs.every(row => row.data?.sourceSelectionCorrect === true && row.data?.databaseConnected === false && row.data?.privateConfigurationRead === false));
const indexProcess = spawnSync(runtime.binary, [...runtime.args, `${directory}/index-contract.php`], { input: JSON.stringify({ phpArgs: runtime.args }), encoding: 'utf8', windowsHide: true, timeout: 120000, maxBuffer: 8 * 1024 * 1024 });
if (indexProcess.status !== 0) throw new Error(indexProcess.stderr || indexProcess.stdout || 'Actual-index contract child failed.');
const index = JSON.parse(indexProcess.stdout); assert.equal(index.cases, 58); assert.equal(index.children, 116); assert.equal(index.failed, 0);
for (const assertion of index.checks) check(`Actual index: ${assertion.name}`, assertion.pass);
const failed = checks.filter(row => !row.pass).length;
console.log(JSON.stringify({ status: failed ? 'FAILED' : 'PASS-SCOPED', scope: 'Fresh PHP frozen-Source35/current-production autoload, real-validator/internal-guard and actual-index/real-parser contracts with unconnected PDO/service spies. No private app configuration, SQL server, HTTP throughput or hosting claim.', passed: checks.length - failed, failed, checks, genuineChildren: 12, indexCases: 58, indexChildren: 116, databaseConnected: false, privateConfigurationRead: false }));
if (failed) process.exitCode = 1;
