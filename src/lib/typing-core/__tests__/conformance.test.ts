import { afterAll, describe, expect, it } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { SessionController, applyEvent, calculateMetrics, emptyTranscript, graphemes, replaySession, replaySnapshot, replayTranscript, traceSessionWords, type SessionConfig, type SessionEvent, type SessionResult } from '..';
import { validateCandidate } from '../../../../supabase/functions/_shared/validation';
import { learningEvidenceFromResult } from '../../learning-evidence';

const summary = { exhaustiveProseVectors: 0, randomizedCodeEdits: 0, randomizedProseEdits: 0, randomizedUnicodeEdits: 0, fixedRegressions: [] as string[] };
const captures: Record<string, unknown> = {};
afterAll(async () => {
  if (!process.env.FORGE_AUDIT_ARTIFACT_DIR) return;
  const directory = resolve(process.env.FORGE_AUDIT_ARTIFACT_DIR);
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, 'core-conformance.json'), JSON.stringify({ kind: 'finite automated conformance evidence; not proof over every possible session', ...summary, captures }, null, 2));
});

describe('cross-layer attribution, lifecycle and Unicode boundaries', () => {
  it('derives identical server and learning key timing from qualified individual correct attempts', () => {
    const test = controller('abcdefghijklmnop');
    test.insert('a', 0); test.insert('x', 100); // incorrect b interval must never become a speed sample
    test.insert('cd', 200); test.insert('e', 300); // batch and the first key after it have no individual latency
    test.at(400); test.session.input({ type: 'composition', text: 'f', compositionId: 'ime-a' });
    test.insert('g', 500); test.insert('h', 600);
    test.at(700); test.session.pause(); test.at(900); test.session.resume();
    test.insert('i', 1000); test.insert('j', 1100); test.insert('k', 4000); test.insert('l', 4100);
    test.at(5000); const result = test.session.finish('manual');
    const evidence = learningEvidenceFromResult(result);
    expect(evidence.attempts.map(attempt => attempt.latencyMs)).toEqual([null, null, null, null, null, null, null, 100, null, 100, null, 100]);
    const server = validateCandidate(result, 'audit-owner');
    for (const key of server.keySummaries) {
      const attempts = evidence.attempts.filter(attempt => attempt.expected === key.character);
      const latencies = attempts.flatMap(attempt => attempt.latencyMs === null ? [] : [attempt.latencyMs]);
      expect(key).toMatchObject({ attempts: attempts.length, correctAttempts: attempts.filter(attempt => attempt.correct).length, intervalCount: latencies.length, intervalSumMs: latencies.reduce((sum, value) => sum + value, 0) });
    }
    expect(server.keySummaries.find(key => key.character === 'b')).toMatchObject({ correctAttempts: 0, intervalCount: 0 });
    summary.fixedRegressions.push('Server key timing delegates to the canonical qualified learning projection');
  });
  it('rejects contradictory wall metadata, finish reasons and unstarted evidence without rejecting delayed deadline callbacks', () => {
    const test = controller('abcdef'); test.insert('abc', 0); test.at(31000);
    const result = test.session.finish('timeout');
    expect(validateCandidate(result, 'audit-owner').candidate.wallDurationMs).toBe(31000);
    const mutations: Array<(candidate: SessionResult) => void> = [
      candidate => { candidate.startedAtWall = NaN; }, candidate => { candidate.finishedAtWall = Infinity; },
      candidate => { candidate.finishedAtWall += 50000; }, candidate => { candidate.startedAtWall = null; },
      candidate => { candidate.finishReason = 'invented' as SessionResult['finishReason']; },
      candidate => { candidate.finishReason = 'completed'; }, candidate => { candidate.wallDurationMs = 29000; },
      candidate => { candidate.status = 'invented' as SessionResult['status']; },
    ];
    for (const mutate of mutations) { const candidate = structuredClone(result); mutate(candidate); expect(() => validateCandidate(candidate, 'audit-owner')).toThrow(); }
    const empty = controller('abc').session.finish('manual');
    expect(validateCandidate(empty, 'audit-owner').replay.metrics.inputAccuracy).toBeNull();
    summary.fixedRegressions.push('Server rejects nonfinite or contradictory wall/start/finish lifecycle metadata');
  });
  it('does not allow an early timeout to manufacture elapsed time', () => {
    const test = controller('abcdef');
    expect(() => test.session.finish('timeout')).toThrow('deadline');
    test.insert('a', 0); test.at(100);
    expect(() => test.session.finish('timeout')).toThrow('deadline');
    expect(test.session.result).toBeNull();
    test.at(30000); expect(test.session.finish('timeout').elapsedMs).toBe(30000);
    summary.fixedRegressions.push('Early timeout cannot manufacture elapsed duration');
  });
  it('preserves whole-transcript grapheme units across joining edits and deletion', () => {
    for (const [target, first, second, expected] of [['é abc', 'e', '\u0301', 'é'], ['👩‍💻 abc', '👩', '\u200d💻', '👩‍💻'], ['कि abc', 'क', 'ि', 'कि']] as const) {
      const test = controller(target); test.insert(first, 0); test.insert(second, 100);
      const snapshot = test.session.snapshot();
      expect(snapshot.finalText).toBe(expected);
      expect(snapshot.metrics.retainedUnits).toBe(graphemes(snapshot.finalText).length);
      expect(snapshot.metrics.correct).toBe(1);
      test.at(200); test.session.input({ type: 'delete' });
      expect(test.session.snapshot().finalText).toBe('');
    }
    summary.fixedRegressions.push('Grapheme boundaries are reconciled across edits without rewriting earlier attempts');
  });
  it('preserves atomic Unicode range edits against an independent string-splice reference', () => {
    const segmenter = new Intl.Segmenter('und', { granularity: 'grapheme' });
    const split = (text: string) => Array.from(segmenter.segment(text), item => item.segment);
    for (let seed = 1; seed <= 100; seed++) {
      const rng = random(seed * 193), cfg = config('é कि 👩‍💻 🇦🇧 e\u0301', 'code'), state = emptyTranscript();
      let text = '';
      for (let sequence = 0; sequence < 50; sequence++) {
        const before = split(text), start = Math.floor(rng() * (before.length + 1)), end = start + Math.floor(rng() * (before.length - start + 1));
        const inserted = ['e', '\u0301', 'क', 'ि', '👩', '\u200d💻', '🇦', '🇧a', '', ' '][Math.floor(rng() * 10)];
        text = before.slice(0, start).join('') + inserted + before.slice(end).join('');
        applyEvent(state, { type: 'replace', text: inserted, start, end, sequence, offsetMs: sequence * 100, provenance: 'keyboard' }, cfg.initialTarget, cfg);
        expect(state.units.join('')).toBe(text); expect(state.units).toEqual(split(text));
        const metrics = calculateMetrics(cfg, cfg.initialTarget, state, 6000, { includeRhythm: false }).metrics;
        expect(metrics.correct + metrics.incorrect + metrics.extra).toBe(split(text).length);
        for (const value of Object.values(metrics)) expect(value === null || Number.isFinite(value)).toBe(true);
        summary.randomizedUnicodeEdits++;
      }
    }
  }, 30000);
  it('keeps snapshot playback scoring equal to full replay without an unused timeline', () => {
    const test = controller('cat dog'); test.insert('cxt ', 0); test.insert('d', 2000); test.at(4000);
    const result = test.session.finish('manual');
    for (const elapsedMs of [0, 1, 1999, 2000, 4000]) {
      const options = { targetText: result.targetText, issuedTargetSegments: result.issuedTargetSegments, pauseIntervals: result.pauseIntervals };
      const frame = replaySnapshot(result.configuration, result.events, elapsedMs, options);
      const full = replaySession(result.configuration, result.events, elapsedMs, options);
      expect(frame.finalText).toBe(full.finalText); expect(frame.characters).toEqual(full.characters);
      expect(frame.metrics).toEqual({ ...full.metrics, consistency: null, peakFiveSecondWpm: null });
      expect(frame).not.toHaveProperty('timeSeries');
    }
  });
});

describe('passage identity and private comparison integrity', () => {
  const finite = (target: string, id: string, mode: SessionConfig['mode'], settings: SessionConfig['settings'] = {}, privacy: SessionConfig['privacy'] = 'public-corpus') => {
    const test = controller(target, { clientSessionId: id, mode, durationMs: undefined, settings, privacy, scoringPolicy: mode === 'code' ? 'code' : 'prose' });
    const units = graphemes(target); test.insert(units[0], 0); test.insert(units.slice(1).join(''), 1000);
    return test.session.result!;
  };
  it('keeps unrelated custom passages out of comparable personal bests without persisting their text in the cohort', () => {
    const short = finite('cat', 'custom-short', 'custom', { contentId: 'en' }, 'private-custom');
    const long = finite('private customer passage', 'custom-long', 'custom', { contentId: 'en' }, 'private-custom');
    expect(short.comparisonKey).not.toBe(long.comparisonKey);
    for (const result of [short, long]) {
      expect(result.eligibility.eligible).toBe(false);
      expect(result.comparisonKey).not.toContain(result.targetText);
      const forged = structuredClone(result); forged.eligibility = { eligible: true, reasons: [], verification: 'local-unverified' };
      expect(validateCandidate(forged, 'audit-owner', { cloudConsent: true }).personalBestEligible).toBe(false);
    }
    captures.comparisonPolicy = { shortKey: short.comparisonKey, longKey: long.comparisonKey, warning: 'Private text is deliberately omitted from persistent comparison identity.' };
    summary.fixedRegressions.push('Private/custom comparison cohorts are session-isolated and personal-best ineligible');
  });
  for (const mode of ['quote', 'code'] as const) it(`groups ${mode} personal bests only by stable public passage identity`, () => {
    const first = finite('abc', `${mode}-one`, mode, { contentId: 'forge-original-1' });
    const same = finite('abc', `${mode}-two`, mode, { contentId: 'forge-original-1' });
    const different = finite('longer passage', `${mode}-other`, mode, { contentId: 'forge-original-2' });
    expect(first.comparisonKey).toBe(same.comparisonKey);
    expect(first.comparisonKey).not.toBe(different.comparisonKey);
    const legacyKey = JSON.parse(first.comparisonKey); delete legacyKey.comparisonPolicy; delete legacyKey.contentId; delete legacyKey.sessionId;
    expect(first.comparisonKey).not.toBe(JSON.stringify(legacyKey));
    expect(validateCandidate(first, 'audit-owner').personalBestEligible).toBe(true);
    const missing = finite('abc', `${mode}-missing`, mode), anotherMissing = finite('def', `${mode}-another-missing`, mode);
    expect(missing.comparisonKey).not.toBe(anotherMissing.comparisonKey);
    expect(missing.eligibility.eligible).toBe(false);
    expect(validateCandidate(missing, 'audit-owner').personalBestEligible).toBe(false);
    for (const contentId of ['', 'private passage text', 'x'.repeat(129), 42]) {
      const invalid = finite('abc', `${mode}-invalid`, mode, { contentId });
      expect(invalid.eligibility.eligible).toBe(false);
      expect(JSON.parse(invalid.comparisonKey).contentId).toBeNull();
      expect(validateCandidate(invalid, 'audit-owner').personalBestEligible).toBe(false);
    }
    const privateResult = finite('abc', `${mode}-private`, mode, { contentId: 'sensitive-passage-marker' }, 'private-custom');
    expect(privateResult.comparisonKey).not.toContain('sensitive-passage-marker');
    expect(validateCandidate(privateResult, 'audit-owner', { cloudConsent: true }).personalBestEligible).toBe(false);
  });
});
function config(target: string, policy: SessionConfig['scoringPolicy'] = 'prose'): SessionConfig {
  return { clientSessionId: 'conformance', ownerScope: 'audit-owner', mode: 'time', durationMs: 30000, initialTarget: target, scoringPolicy: policy, inputMethod: 'keyboard' };
}
function controller(target: string, overrides: Partial<SessionConfig> = {}) {
  let time = 0;
  const session = new SessionController({ ...config(target), ...overrides }, { now: () => time, wallNow: () => 1700000000000 + time });
  return { session, at(value: number) { time = value; }, insert(text: string, at: number) { time = at; return session.input({ type: 'insert', text }); } };
}
function random(seed: number) { let state = seed; return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; }; }

/** Independent ASCII reference: compare separately split word strings, not core slot mappings. */
function proseReference(target: string, typed: string, finite: boolean) {
  const expected = target.split(' '), observed = typed.split(' ');
  let correct = 0, incorrect = 0, extra = 0, missed = 0, untyped = 0, creditedUnits = 0;
  for (let index = 0; index < Math.max(expected.length, observed.length); index++) {
    const word = expected[index], input = observed[index];
    if (word === undefined) { extra += input?.length ?? 0; if (index < observed.length - 1) extra++; continue; }
    const current = input ?? '';
    for (let position = 0; position < Math.min(current.length, word.length); position++) {
      if (current[position] === word[position]) correct++; else incorrect++;
    }
    extra += Math.max(0, current.length - word.length);
    const submitted = index < observed.length - 1;
    const remaining = Math.max(0, word.length - current.length);
    if (finite || submitted) missed += remaining; else untyped += remaining;
    if (index < expected.length - 1) {
      if (submitted) correct++; else if (finite) missed++; else untyped++;
    } else if (submitted) extra++;
    if (word && current === word && (submitted || index === expected.length - 1)) creditedUnits += word.length + Number(submitted && index < expected.length - 1);
    else if (!finite && index === observed.length - 1) {
      let prefix = 0; while (prefix < current.length && prefix < word.length && current[prefix] === word[prefix]) prefix++;
      creditedUnits += prefix;
    }
  }
  return { correct, incorrect, extra, missed, untyped, creditedUnits, retainedUnits: typed.length };
}
function expectedAscii(target: string, text: string, cursor: number, policy: 'code' | 'prose') {
  if (policy === 'code') return target[cursor];
  const prefix = text.slice(0, cursor).split(' '), words = target.split(' ');
  const wordIndex = prefix.length - 1, within = prefix[wordIndex].length, word = words[wordIndex];
  return word === undefined ? undefined : within < word.length ? word[within] : wordIndex < words.length - 1 ? ' ' : undefined;
}

describe('independent finite metric conformance', () => {
  it('exhausts short ASCII prose transcripts against a word-string reference', () => {
    const words = ['a', 'b', 'ab', 'ba'];
    const targets = [...words, ...words.flatMap(first => words.map(second => `${first} ${second}`))];
    const transcripts = [''];
    for (let length = 1; length <= 4; length++) {
      for (let number = 0; number < 4 ** length; number++) {
        let remainder = number, text = '';
        for (let position = 0; position < length; position++) { text += 'abx '[remainder % 4]; remainder = Math.floor(remainder / 4); }
        transcripts.push(text);
      }
    }
    for (const target of targets) for (const typed of transcripts) for (const finite of [false, true]) {
      const cfg = config(target), state = emptyTranscript();
      applyEvent(state, { type: 'insert', text: typed, start: 0, end: 0, sequence: 0, offsetMs: 0, provenance: 'keyboard' }, target, cfg);
      const actual = calculateMetrics(cfg, target, state, 30000, { finiteFinal: finite, includeRhythm: false }).metrics;
      expect(actual, JSON.stringify({ target, typed, finite })).toMatchObject(proseReference(target, typed, finite));
      let prefix = '', correctAttempts = 0;
      for (const character of typed) { if (character === expectedAscii(target, prefix, prefix.length, 'prose')) correctAttempts++; prefix += character; }
      expect(actual.correctAttempts).toBe(correctAttempts);
      summary.exhaustiveProseVectors++;
    }
  }, 30000);

  for (const policy of ['code', 'prose'] as const) it(`matches independently edited text and attempt history for seeded ${policy} replacements/deletions`, () => {
    for (let seed = 1; seed <= 150; seed++) {
      const rng = random(seed * 91), target = policy === 'code' ? 'ab ba\n\taba' : 'ab ba ab ba', cfg = config(target, policy), state = emptyTranscript();
      let text = '', correctAttempts = 0, attempts = 0, removed = 0, removals = 0;
      for (let sequence = 0; sequence < 50; sequence++) {
        const start = Math.floor(rng() * (text.length + 1)), end = start + Math.floor(rng() * (text.length - start + 1));
        const deleting = rng() < .3, inserted = deleting ? '' : ['a', 'b', 'x', ' ', 'ab', ' a'][Math.floor(rng() * 6)];
        const event: SessionEvent = { type: deleting ? 'delete' : 'replace', start, end, text: inserted, sequence, offsetMs: sequence * 100, provenance: 'keyboard' };
        if (end > start || deleting) removals++;
        removed += end - start;
        text = text.slice(0, start) + text.slice(end);
        let cursor = start;
        for (const character of inserted) {
          if (character === expectedAscii(target, text, cursor, policy)) correctAttempts++;
          attempts++; text = text.slice(0, cursor) + character + text.slice(cursor); cursor++;
        }
        applyEvent(state, event, target, cfg);
        const actual = calculateMetrics(cfg, target, state, 6000, { includeRhythm: false }).metrics;
        expect(state.units.join('')).toBe(text);
        expect(actual).toMatchObject({ insertionAttempts: attempts, correctAttempts, deletedUnits: removed, deletionActions: removals });
        if (policy === 'prose') expect(actual).toMatchObject(proseReference(target, text, false));
        else {
          const matching = [...text].filter((character, index) => character === target[index]).length;
          expect(actual).toMatchObject({ correct: matching, incorrect: Math.min(text.length, target.length) - matching, extra: Math.max(0, text.length - target.length), creditedUnits: matching });
        }
        summary[policy === 'code' ? 'randomizedCodeEdits' : 'randomizedProseEdits']++;
      }
    }
  }, 30000);
});

describe('target issuance, diagnostics and sample arithmetic', () => {
  it('never reclassifies an earlier out-of-target insertion during finish, learning projection, or server replay', () => {
    const test = controller('a'); test.insert('ab', 0);
    expect(test.session.snapshot().metrics.inputAccuracy).toBe(50);
    test.at(100); test.session.appendTarget('b'); test.at(30000);
    const result = test.session.finish('timeout');
    expect(result.metrics.inputAccuracy).toBe(50);
    expect(result.metrics.correctAttempts).toBe(1);
    expect(result.eligibility.eligible).toBe(false);
    expect(learningEvidenceFromResult(result).attempts.map(attempt => attempt.correct)).toEqual([true, false]);
    expect(validateCandidate(result, 'audit-owner').replay.metrics).toEqual(result.metrics);
    const forged = JSON.parse(JSON.stringify(result)); forged.metrics.correctAttempts = 2; forged.metrics.incorrectAttempts = 0; forged.metrics.inputAccuracy = 100;
    expect(() => validateCandidate(forged, 'audit-owner')).toThrow('metrics');
    captures.targetIssuance = result;
    summary.fixedRegressions.push('No retroactive attempt correctness after target extension');
  });
  it('records equal-clock ordering and preserves partial scrubs across an append', () => {
    const after = controller('a'); after.insert('ab', 0); after.session.appendTarget('b', 0); after.at(30000);
    const result = after.session.finish('timeout');
    expect(result.issuedTargetSegments[0].afterSequence).toBe(0);
    expect(result.metrics.inputAccuracy).toBe(50);
    const checked = validateCandidate(result, 'audit-owner');
    expect(checked.replay.metrics.inputAccuracy).toBe(50);
    expect(checked).toMatchObject({ lateTargetExtension: true, personalBestEligible: false });
    const forgedEligibility = structuredClone(result); forgedEligibility.eligibility = { eligible: true, reasons: [], verification: 'local-unverified' };
    expect(validateCandidate(forgedEligibility, 'audit-owner').personalBestEligible).toBe(false);
    for (const cutoff of [0, 50, 30000]) {
      const partial = replaySession(result.configuration, result.events, cutoff, { targetText: result.targetText, issuedTargetSegments: result.issuedTargetSegments });
      expect(partial.metrics.correctAttempts).toBe(1);
      expect(partial.metrics.incorrectAttempts).toBe(1);
      expect(traceSessionWords(result.configuration, result.events, cutoff, { targetText: result.targetText, issuedTargetSegments: result.issuedTargetSegments }).reduce((total, word) => total + word.creditedUnits, 0)).toBe(partial.metrics.creditedUnits);
    }
    const before = controller('a'); before.session.appendTarget('b', 0); before.insert('ab', 0); before.at(30000);
    const preissued = before.session.finish('timeout');
    expect(preissued.metrics.inputAccuracy).toBe(100);
    expect(validateCandidate(preissued, 'audit-owner')).toMatchObject({ lateTargetExtension: false, personalBestEligible: true });
  });
  it('traces credits inside the canonical word loop for mistakes, skips, prefixes and overflow', () => {
    for (const [target, typed, finite] of [['cat dog', 'cxt dog', true], ['cat dog', 'cat d', false], ['cat dog', 'c dog', false], ['cat', 'cat extra', false], ['cat dog', '', true]] as const) {
      const cfg = config(target), events: SessionEvent[] = [{ type: 'insert', text: typed, start: 0, end: 0, sequence: 0, offsetMs: 0, provenance: 'keyboard' }];
      const replay = replaySession(cfg, events, 30000, { finiteFinal: finite });
      const words = traceSessionWords(cfg, events, 30000, { finiteFinal: finite });
      expect(words.reduce((sum, word) => sum + word.creditedUnits, 0)).toBe(replay.metrics.creditedUnits);
      for (const count of ['correct', 'incorrect', 'extra', 'missed', 'untyped'] as const) expect(words.reduce((sum, word) => sum + word[count], 0)).toBe(replay.metrics[count]);
    }
  });
  it('constructs a synthetic consistency witness for the displayed 30-second sample without claiming its actual event history', () => {
    const prefix = 'aaaa '.repeat(22);
    const target = `${prefix}ab ${'c'.repeat(23)}${'d'.repeat(10)} future`;
    const text = `${prefix}a ${'c'.repeat(23)}${'x'.repeat(10)}q `;
    const test = controller(target);
    for (let index = 0; index < 9; index++) test.insert('x', index * 20);
    for (let index = 0; index < 9; index++) { test.at(200 + index * 20); test.session.input({ type: 'delete' }); }
    for (let index = 0; index < text.length; index++) test.insert(text[index], 2000 + index * 150);
    test.at(30000); const result = test.session.finish('timeout');
    expect(result.metrics).toMatchObject({ correct: 136, incorrect: 10, extra: 1, missed: 1, retainedUnits: 147, insertionAttempts: 156, correctAttempts: 135, incorrectAttempts: 21, deletedUnits: 9, creditedUnits: 110, wpm: 44, rawWpm: 58.8, attemptRate: 62.4 });
    expect(result.metrics.inputAccuracy).toBeCloseTo(135 / 156 * 100, 12);
    expect(result.metrics.finalTextAccuracy).toBeCloseTo(136 / 148 * 100, 12);
    expect(validateCandidate(result, 'audit-owner').replay.metrics).toEqual(result.metrics);
    captures.sampleConsistencyWitness = { warning: 'Synthetic existence witness only. The user session cannot be verified without its actual exported target and normalized events.', result, words: traceSessionWords(result.configuration, result.events, result.elapsedMs) };
  });
});
