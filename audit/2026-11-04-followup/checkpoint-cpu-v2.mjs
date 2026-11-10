import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const prefix = 'audit/2026-11-04-followup';
const source = await readFile('src/lib/typing-core/session.ts', 'utf8');
const hash = text => createHash('sha256').update(text).digest('hex');
const old = "return freeze({ ...this.snapshot(now), ...replayed, status: final ? 'finished' : this.status, elapsedMs, wallDurationMs, remainingMs: duration === undefined ? null : Math.max(0, duration - elapsedMs), events: events.map(event => ({ ...event })),";
const replacement = "return freeze({ status: final ? 'finished' : this.status, finalText: replayed.finalText, targetText: this.target, elapsedMs, wallDurationMs, remainingMs: duration === undefined ? null : Math.max(0, duration - elapsedMs), cursor: replayed.cursor, characters: replayed.characters, metrics: replayed.metrics, events: events.map(event => ({ ...event })), timeSeries: replayed.timeSeries,";
assert.equal(source.split(old).length, 2);
const leaf = "    for (let index = 0; index < replayed.characters.length; index++) {\n      const character: FlatAlignmentLeaf<Alignment['characters'][number]> = replayed.characters[index];\n      Object.freeze(character);\n    }\n    Object.freeze(replayed.characters);\n";
const variants = { baseline: source, snapshot: source.replace(old, replacement), leaves: source.replace('    return freeze({ ...this.snapshot(now)', leaf + '    return freeze({ ...this.snapshot(now)'), combined: source.replace(old, replacement).replace('    return freeze({ status: final', leaf + '    return freeze({ status: final') };
const protocol = { declaredAt: new Date().toISOString(), status: 'PREPARED', sourceSha256: hash(source), iterations: 12, variants: Object.keys(variants), order: 'Rotate the declared four variants by iteration index; no discarded samples or automatic retries.', scope: 'Pure checkpoint CPU diagnostic, not HTTP capacity or browser latency. Fixed injected logical clock, no HTTP, database or browser.', originalSourceUnchangedRequired: true, exactRawJsonEqualityRequired: true, mutationIsolationRequired: true };
await writeFile(`${prefix}/checkpoint-cpu-v2-protocol.json`, JSON.stringify(protocol, null, 2) + '\n', { flag: 'wx' });
const classes = {};
for (const [name, text] of Object.entries(variants)) {
  const adapted = text.replaceAll("from './", "from '../../src/lib/typing-core/");
  const file = `${prefix}/checkpoint-v2-${name}.ts`;
  await writeFile(file, adapted, { flag: 'wx' });
  classes[name] = (await import(pathToFileURL(`${process.cwd()}/${file}`).href)).SessionController;
}
const target = Array.from({ length: 800 }, (_, i) => ['clear', 'river', 'steady', 'light', 'calm', 'signal', 'practice'][i % 7]).join(' ');
const rows = [];
for (let iteration = 0; iteration < 12; iteration++) {
  const names = Object.keys(classes);
  const order = [...names.slice(iteration % 4), ...names.slice(0, iteration % 4)];
  let reference;
  for (const name of order) {
    let now = 100, wall = 1793815200000;
    const controller = new classes[name]({ clientSessionId: 'checkpoint-cpu', ownerScope: 'guest', mode: 'race', durationMs: 30000, language: 'en', script: 'Latin', keyboardLayout: 'qwerty', inputMethod: 'keyboard', scoringPolicy: 'prose', contentRevision: 'sparow-arena-v1', challengeId: 'arena:checkpoint-cpu', correctionPolicy: 'current-word', privacy: 'public-corpus', settings: { arenaId: 'checkpoint-cpu', localBot: false }, initialTarget: target }, { now: () => now, wallNow: () => wall });
    controller.startAt(now, wall);
    for (let index = 0; index < 10; index++) { now += 80 + index % 3 * 3; wall += 80 + index % 3 * 3; controller.input({ type: 'insert', text: target[index] }); }
    now += 2500; wall += 2500;
    const began = performance.now();
    const checkpoint = controller.checkpoint();
    const checkpointMs = performance.now() - began;
    const encodedAt = performance.now();
    const json = JSON.stringify(checkpoint);
    const encodeMs = performance.now() - encodedAt;
    const observations = [json, JSON.stringify(controller.snapshot())];
    const retained = JSON.stringify(checkpoint);
    now += 100; wall += 100;
    controller.input({ type: 'insert', text: target[10] });
    observations.push(JSON.stringify(controller.snapshot()), JSON.stringify(controller.finish('manual')));
    assert.equal(JSON.stringify(checkpoint), retained);
    assert.ok(Object.isFrozen(checkpoint) && Object.isFrozen(checkpoint.characters) && checkpoint.characters.every(Object.isFrozen));
    if (reference) assert.deepEqual(observations, reference); else reference = observations;
    rows.push({ iteration, variant: name, checkpointMs, encodeMs, bytes: Buffer.byteLength(json), rawJsonSha256: hash(json), deepFrozen: true, mutationIsolated: true });
  }
}
assert.equal(hash(await readFile('src/lib/typing-core/session.ts', 'utf8')), protocol.sourceSha256);
const median = values => { const sorted = [...values].sort((a,b) => a-b); return (sorted[5] + sorted[6]) / 2; };
const summary = Object.fromEntries(Object.keys(classes).map(name => [name, { checkpointMedianMs: median(rows.filter(x => x.variant === name).map(x => x.checkpointMs)), encodeMedianMs: median(rows.filter(x => x.variant === name).map(x => x.encodeMs)) }]));
const result = { ...protocol, finishedAt: new Date().toISOString(), status: 'PASS-SCOPED-PURE-DIAGNOSTIC', sourceUnchanged: true, rawJsonAndPostCheckpointBehaviorExact: true, summary, rows };
await writeFile(`${prefix}/checkpoint-cpu-v2-result.json`, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: result.status, summary, samples: rows.length, bytes: rows[0].bytes }));
