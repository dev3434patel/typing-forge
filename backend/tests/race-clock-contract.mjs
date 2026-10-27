import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
import { phpRuntime } from '../../scripts/php-runtime.mjs';

// Pure TS->PHP canonical checkpoints; no HTTP, database, cookies or fixtures.
const root = path.resolve(import.meta.dirname, '../..');
const temporary = await mkdtemp(path.join(os.tmpdir(), 'sparow-race-clock-'));
try {
  for (const name of ['types', 'transcript', 'metrics', 'session', 'race-clock']) {
    const file = name === 'race-clock' ? 'src/lib/race-clock.ts' : `src/lib/typing-core/${name}.ts`;
    const source = (await readFile(path.join(root, file), 'utf8')).replace(/from ['"][^'"]*\/(types|transcript|metrics|session)\.ts['"]/g, (_, target) => `from './${target}.mjs'`);
    await writeFile(path.join(temporary, `${name}.mjs`), ts.transpileModule(source, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
    }).outputText);
  }
  const { SessionController } = await import(pathToFileURL(path.join(temporary, 'session.mjs')));
  const { raceClockAnchor } = await import(pathToFileURL(path.join(temporary, 'race-clock.mjs')));
  const owner = '11111111-1111-4111-8111-111111111111', start = 1_792_600_000_000;
  const cases = [];
  for (const mountDelay of [150, 4_000]) {
    let mono = 12_000;
    const anchor = raceClockAnchor(mono, start + mountDelay - 800, 800, start);
    const controller = new SessionController({
      clientSessionId: `race-sse-clock-${mountDelay}`, ownerScope: owner,
      mode: 'race', durationMs: 15_000, initialTarget: 'cat dog fox',
      correctionPolicy: 'current-word', scoringPolicy: 'prose',
    }, { now: () => mono, wallNow: () => anchor.wallAt(mono) });
    controller.startAt(anchor.startMono, anchor.startWall);
    mono += 1_000;
    controller.input({ type: 'insert', text: 'cat ' });
    const checkpoint = controller.checkpoint();
    assert.equal(checkpoint.finishedAtWall - checkpoint.startedAtWall, checkpoint.wallDurationMs);
    cases.push({ name: `stale-countdown-${mountDelay}-checkpoint`, candidate: checkpoint, owner, consent: true, interim: true });
    mono += 15_000;
    controller.tick();
    cases.push({ name: `stale-countdown-${mountDelay}-timeout`, candidate: controller.result, owner, consent: true });
  }
  const stale = structuredClone(cases[0]);
  stale.name = 'old-stale-snapshot-wall-rejected';
  stale.candidate.finishedAtWall -= 3_150;
  stale.reject = true;
  cases.push(stale);
  const { binary, args } = phpRuntime();
  const run = spawnSync(binary, [...args, path.join(import.meta.dirname, 'replay-driver.php')], {
    input: JSON.stringify(cases), encoding: 'utf8', maxBuffer: 2 * 1024 * 1024,
  });
  assert.equal(run.status, 0, run.stderr);
  const actual = JSON.parse(run.stdout);
  assert.equal(actual.length, cases.length);
  for (let i = 0; i < cases.length; i++) {
    assert.equal(actual[i].ok, !cases[i].reject, `${cases[i].name}: ${actual[i].message ?? ''}`);
    if (cases[i].reject) assert.match(actual[i].message, /Wall timestamps do not match duration/);
    else assert.equal(actual[i].result.replay.metrics.wpm, cases[i].candidate.metrics.wpm);
  }
  const report = { checkedAt: new Date().toISOString(), kind: 'pure-ts-php-race-clock-contract',
    total: cases.length, passed: cases.length, cases: cases.map((item, index) => ({ name: item.name, accepted: actual[index].ok })),
    scope: 'Canonical PHP SessionValidator only; no HTTP/server countdown acceptance claim.' };
  if (process.env.SPAROWTYPE_RACE_CLOCK_REPORT) await writeFile(process.env.SPAROWTYPE_RACE_CLOCK_REPORT, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  process.stdout.write(`${JSON.stringify(report)}\n`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
