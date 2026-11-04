// Preparation only. Legacy full capacity driver and owner remain byte-identical.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { hash } from '../2026-10-21/artifact-verification.mjs';

const directory = 'audit/2026-10-27';
const helper = await readFile('src/domain/arena.ts', 'utf8');
assert.match(helper, /export function arenaEvidencePayload\(/, 'Wait for the production helper to become stable before preparing this adapter.');
const adapter = async (originalFile, outputFile, apply) => {
  const original = await readFile(originalFile, 'utf8'); let text = original; const substitutions = [];
  const replace = (before, after, count = 1) => {
    assert.equal(text.split(before).length - 1, count, `Exact adapter boundary: ${before}`);
    text = text.replaceAll(before, after); substitutions.push({ before, after, count });
  };
  apply(replace);
  let reversed = text;
  for (const change of [...substitutions].reverse()) reversed = reversed.replaceAll(change.after, change.before);
  assert.equal(reversed, original);
  await writeFile(outputFile, text, { flag: 'wx' });
  assert.equal(hash(await readFile(originalFile)), hash(original));
  return { originalFile, originalSha256: hash(original), outputFile, sha256: hash(text), reversibleByteIdentity: true, substitutions };
};
const driver = await adapter(`${directory}/run-source26-capacity-burst.mjs`, `${directory}/run-source26-capacity-wire-burst.mjs`, replace => {
  replace("import { SessionController } from '../../src/lib/typing-core/index.ts';", "import { SessionController } from '../../src/lib/typing-core/index.ts';\nimport { arenaEvidencePayload } from '../../src/domain/arena.ts';");
  replace('SPAROWTYPE_SOURCE26_CAPACITY_ACCEPTANCE', 'SPAROWTYPE_SOURCE26_CAPACITY_WIRE_ACCEPTANCE');
  replace('const prefix = `source26-capacity-${ownerId}`;', 'const prefix = `source26-capacity-wire-${ownerId}`;');
  replace("const inputs = ['audit/2026-10-27/pack-backend-instance-source26.mjs', 'audit/2026-10-27/run-source26-capacity-burst.mjs', 'backend/tests/arena-audit-admin.php', 'scripts/php-runtime.mjs'];",
    "const inputs = ['audit/2026-10-27/pack-backend-instance-source26-wire.mjs', 'audit/2026-10-27/run-source26-capacity-wire-burst.mjs', 'audit/2026-10-27/run-source26-capacity-burst.mjs', 'src/domain/arena.ts', 'src/services/arena-service.ts', 'src/domain/__tests__/arena.test.ts', 'backend/tests/validation-parity.mjs', 'backend/tests/arena-audit-admin.php', 'scripts/php-runtime.mjs'];");
  replace('  evidence: \'400 independent guarded synthetic authenticated sessions.', "  currentWire: { productionHelper: 'src/domain/arena.ts#arenaEvidencePayload', actualHttpConsumer: 'src/services/arena-service.ts', fieldsRemovedExactly: ['characters', 'timeSeries', 'cursor'], metricsEventsAndAllOtherFieldsRetained: true, intentionalWireBytesChange: true, requestSerializationAdapterPoints: 1, helperImportedDirectlyWithNodeTypeStripping: true, separateRequiredContracts: ['src/domain/__tests__/arena.test.ts', 'backend/tests/validation-parity.mjs'], separatePhpCanonicalHashParityRequired: true, noParityPassClaimFromThisCapacityRun: true, legacyFullDriverPreserved: 'audit/2026-10-27/run-source26-capacity-burst.mjs', pairScope: 'Run after legacy full once on the same owned runtime with newly provisioned400-account fixtures. Order/cache effects remain a limitation; no result is overwritten.' },\n  evidence: '400 independent guarded synthetic authenticated sessions.");
  replace('body: JSON.stringify({ ...body, expectedOwner: account.id }), signal: controller.signal',
    "body: JSON.stringify(phase === 'submit' ? { ...body, candidate: arenaEvidencePayload(body.candidate), expectedOwner: account.id } : { ...body, expectedOwner: account.id }), signal: controller.signal");
});
const owner = await adapter(`${directory}/pack-backend-instance-source26.mjs`, `${directory}/pack-backend-instance-source26-wire.mjs`, replace => {
  replace("import { randomBytes } from 'node:crypto';", "import { randomBytes, createHash } from 'node:crypto';");
  replace('let capacityDeclared = false;', 'let capacityDeclared = false;\nlet capacityWireDeclared = false;');
  replace('After coordination send capacity26, rate-native26, prepare-browser, renew, or cleanup.', 'After coordination send capacity26, capacity26-wire, rate-native26, prepare-browser, renew, or cleanup.');
  replace("  await receipt('environment', identities); publicMessage({ stage: 'ephemeral-api-ready', ...identities });", "  await receipt('environment', identities); publicMessage({ stage: 'ephemeral-api-ready', ...identities });\n  const wireOwnerInputs = [import.meta.filename, 'audit/2026-10-27/pack-backend-instance-source26.mjs', 'audit/2026-10-27/run-source26-capacity-burst.mjs', 'audit/2026-10-27/run-source26-capacity-wire-burst.mjs', 'src/domain/arena.ts', 'src/services/arena-service.ts'];\n  const wireOwnerHashes = Object.fromEntries(await Promise.all(wireOwnerInputs.map(async file => [file, createHash('sha256').update(await readFile(file)).digest('hex')])));\n  await receipt('capacity-wire-owner-protocol', { declaredAt: new Date().toISOString(), ownerId: id, actualOwnerSourceHashes: wireOwnerHashes, legacyFullOwnerPreserved: true, legacyFullCommandAndCleanupUnchanged: true, pairOrder: ['capacity26', 'capacity26-wire'], separateFixturesForEachCommand: true, limitsRatesAndDurabilityChanged: false, noAutomaticRetries: true });");
  const newCommand = `      if (line.trim() === 'capacity26-wire') {
        assert.equal(capacityDeclared, true, 'The preserved full capacity26 attempt must complete first on this owner.');
        if(capacityWireDeclared){publicMessage({stage:'pack-capacity-wire-already-declared',message:'Use a new explicitly coordinated instance for another attempt.'});continue;}
        capacityWireDeclared=true;
        assert.equal(httpRuntime,'apache','Current-wire capacity requires the same real owned Apache runtime.');
        const capacityWireScript='audit/2026-10-27/run-source26-capacity-wire-burst.mjs';
        await receipt('capacity-wire-command-protocol',{declaredAt:new Date().toISOString(),noRetries:true,source:capacityWireScript,ownerId:id,actualOwnerSourceHashes:wireOwnerHashes,scope:'Separate current-production-wire1653 operations/50x8/concurrency20; only three server-rebuilt candidate fields are removed by the actual domain helper. All existing assertions and strict p95<150 remain. Newfixtures; sameowner; no full-payload result replacement.'});
        const result=await capture(process.execPath,['--experimental-transform-types',path.join(root,capacityWireScript)],'capacity26-wire',undefined,240000);
        let report=null;try{report=JSON.parse(result.stdout.trim());}catch{/* Private diagnostics retained separately. */}
        if(report)await receipt('capacity26-wire-summary',report);
        const unchanged=(await Promise.all(wireOwnerInputs.map(async file=>createHash('sha256').update(await readFile(file)).digest('hex')===wireOwnerHashes[file]))).every(Boolean);
        await receipt('capacity-wire-owner-inputs-after',{ownerId:id,allInputsUnchanged:unchanged,actualOwnerSourceHashes:wireOwnerHashes});
        const status={name:'capacity26-wire',exitCode:result.code,status:result.code===0&&unchanged?'PASS':'FAIL',checks:report?.total??null};suiteResults.push(status);failed||=result.code!==0||!unchanged;publicMessage({stage:'pack-capacity26-wire-complete',...status});
      }
`;
  replace("      if (line.trim() === 'capacity26') {", newCommand + "      if (line.trim() === 'capacity26') {");
});
const report = { status: 'PREPARED-NOT-RUN', preparedAt: new Date().toISOString(), expectedSourceFiles: 505, actualBuild: 'PENDING-FRESH-SOURCE26-BUILD',
  driver, owner, requestSerializationAdapterPoints: 1, productionHelper: 'src/domain/arena.ts#arenaEvidencePayload', helperSha256AtPreparation: hash(helper),
  helperTypeOnlyImportsSupportedByNode: true, fieldsRemovedExactly: ['characters', 'timeSeries', 'cursor'], allOtherEvidenceFieldsRetained: true,
  expectedOperations: 1653, concurrency: 20, rooms: 50, accountsPerRoom: 8, acceptedSubmissionsRequired: 400, p95TargetStrictlyBelowMs: 150,
  legacyFullCapacityDriverAndOwnerUnchanged: true, sameOwnerPair: { commands: ['capacity26', 'capacity26-wire'], eachAtMostOnce: true, separateFixtureNamespaces: true, fullFirstRequired: true, ownerAggregateRetainsAnyFailure: true },
  independentParityContractsRequiredBeforeAcceptance: ['src/domain/__tests__/arena.test.ts', 'backend/tests/validation-parity.mjs'], canonicalHashParityExecution: 'PENDING-SEPARATE-SOURCE-GATE',
  currentWireByteChangeIntentional: true, preservedFullRunNotReinterpreted: true, strictUiReuseChecker: 'NOT-USED-NOT-RELAXED; frontend26 changed and needs fresh build/input/Lighthouse',
  retries: 0, filters: 0, assertionsOrTimeoutsRelaxed: false, servicesStarted: 0, acceptanceTestsRun: 0, browserOrBuildJobsRun: 0, downloadsRun: 0 };
await writeFile(`${directory}/source26-wire-capacity-preparation.json`, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: report.status, newDriver: driver.outputFile, newOwner: owner.outputFile, serializationPoints: 1, expectedOperations: 1653 }));
