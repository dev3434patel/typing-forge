import assert from 'node:assert/strict';

/** Adds actual-PHP timing/replay cases to the existing social source gate. */
export function appendChallengeTimingCases(domain, cases, expected) {
  const opens = Date.parse('2026-10-21T00:00:03.000Z'), expires = opens + 597000;
  const owner = '11111111-1111-4111-8111-111111111111';
  const base = { mode: 'time', durationMs: 30000, language: 'en', keyboardLayout: 'qwerty', inputMethod: 'keyboard', scoringPolicy: 'prose', contentRevision: 'forge-social-duel-en-v2', correctionPolicy: 'current-word', settings: { timingPolicy: 'first-input-v1' } };
  function generated(issued = base, start = opens, legacy = false) {
    let mono = 0;
    const challenge = { configuration: issued, starts_at: new Date(opens).toISOString(), deadline_at: new Date(opens + issued.durationMs).toISOString(), expires_at: new Date(expires).toISOString() };
    const config = { ...issued, clientSessionId: `native-first-${cases.length}`, ownerScope: owner, initialTarget: 'cat dog calm clear '.repeat(10), challengeId: 'issued', privacy: 'public-corpus' };
    const { controller } = domain.createIssuedChallengeController(config, challenge, 0, { now: () => mono, wallNow: () => start + mono });
    if (legacy) mono = 83;
    controller.input({ type: 'insert', text: 'x' });
    mono += 100; controller.input({ type: 'insert', text: 'a' });
    mono = issued.durationMs; controller.tick();
    const candidate = structuredClone(controller.result);
    assert.ok(candidate); assert.equal(candidate.startedAtWall, legacy ? opens : start);
    return { candidate, timing: { issued, start: opens, deadline: opens + issued.durationMs, expires, now: start + issued.durationMs }, replay: true };
  }
  function add(name, value, reject = false) { cases.push({ name, ...value }); expected.push(reject ? { error: true } : { value: true }); }
  for (const durationMs of [15000, 30000, 60000, 120000]) for (const wait of [0, 17000, expires - durationMs - opens]) {
    const issued = { ...base, durationMs, contentRevision: 'forge-ranked-en-v2' };
    add(`first-input-${durationMs}-wait-${wait}`, generated(issued, opens + wait));
  }
  const valid = generated();
  const changed = (mutate) => { const item = structuredClone(valid); mutate(item); return item; };
  for (const [name, mutate] of [
    ['before-preparation-window', item => { item.candidate.startedAtWall = opens - 1; }],
    ['after-last-permitted-start', item => { item.candidate.startedAtWall = expires - 30000 + 1; }],
    ['early-server-receipt', item => { item.timing.now -= 0.001; }],
    ['late-server-receipt', item => { item.timing.now += 3000.001; }],
    ['first-text-not-at-zero', item => { item.candidate.events[0].offsetMs = 1; }],
    ['empty-pre-start-event', item => { item.candidate.events.unshift({ ...item.candidate.events[0], text: '', type: 'submit' }); item.candidate.events.forEach((event, sequence) => { event.sequence = sequence; }); }],
    ['no-input', item => { item.candidate.events = []; }],
    ['not-full-duration', item => { item.candidate.elapsedMs = 29999; }],
    ['manual-instead-of-timeout', item => { item.candidate.finishReason = 'manual'; }],
    ['paused-attempt', item => { item.candidate.pauseIntervals = [{ startMs: 1, endMs: 2 }]; }],
    ['future-finish', item => { item.candidate.finishedAtWall += 3001; item.candidate.wallDurationMs += 3001; }],
    ['short-wall', item => { item.candidate.wallDurationMs -= 1; item.candidate.finishedAtWall -= 1; }],
    ['composition', item => { item.candidate.events[0].provenance = 'composition'; }],
    ['bulk-insertion', item => { item.candidate.events[0].text = 'bulk'; }],
    ['unknown-policy', item => { item.timing.issued.settings.timingPolicy = 'future-v8'; }],
    ['missing-v2-policy', item => { delete item.timing.issued.settings; }],
    ['v1-with-new-policy', item => { item.timing.issued.contentRevision = 'forge-social-duel-en-v1'; }],
  ]) add(name, changed(mutate), true);
  for (const extra of [1, 150, 3000]) add(`bounded-receipt-${extra}`, changed(item => { item.timing.now += extra; }));
  add('bounded-scheduler-tail', changed(item => { item.candidate.wallDurationMs += 100; item.candidate.finishedAtWall += 100; item.timing.now += 100; }));
  for (const [name, arrivalDelay, options, rejectedCode] of [
    ['timely-arrival-survives-owner-lock-processing-delay', 1000, { lockDelayMs: 10000 }, null],
    ['captured-authenticated-arrival-survives-feature-and-owner-lock-delay', 1000, { captureAtDispatch: true, beforeSubmitDelayMs: 20000, lockDelayMs: 10000 }, null],
    ['nested-feature-transaction-keeps-timely-arrival-and-rollback-ownership', 1000, { captureAtDispatch: true, beforeSubmitDelayMs: 20000, lockDelayMs: 10000, nestedTransaction: true }, null],
    ['receipt-at-exact-grace-boundary-survives-processing', 3000, { lockDelayMs: 10000 }, null],
    ['genuinely-late-arrival-still-rejected', 3001, { lockDelayMs: 10000 }, 'challenge-mismatch'],
    ['early-arrival-not-made-valid-by-slow-processing', -1, { lockDelayMs: 10000 }, 'challenge-mismatch'],
    ['client-receipt-timestamp-cannot-backdate-late-arrival', 4000, { lockDelayMs: 10000, clientFields: { receivedAt: opens + 30000, requestReceivedAt: opens + 30000 } }, 'challenge-mismatch'],
    ['invalid-server-receipt-clock-is-not-replaced-by-client-time', 1000, { invalidClock: true }, 'receipt-clock'],
  ]) {
    const item = changed(value => { value.timing.now += arrivalDelay; });
    cases.push({ name, ...item, receipt: options });
    expected.push(rejectedCode ? { error: true, errorCode: rejectedCode } : { value: true });
  }
  // The original native failure had900 individually timed edits. Keep its
  // canonical replay/rate path while advancing only the controlled server clock.
  {
    const issued = { ...base, durationMs: 15000, contentRevision: 'forge-ranked-en-v2' };
    let mono = 0;
    const config = { ...issued, clientSessionId: 'timely-processing-rate-regression', ownerScope: owner, initialTarget: 'the '.repeat(500), challengeId: 'issued', privacy: 'public-corpus' };
    const challenge = { configuration: issued, starts_at: new Date(opens).toISOString(), deadline_at: new Date(opens + 15000).toISOString(), expires_at: new Date(expires).toISOString() };
    const { controller } = domain.createIssuedChallengeController(config, challenge, 0, { now: () => mono, wallNow: () => opens + mono });
    for (let index = 0; index < 900; index++) { mono = index * 16; controller.input({ type: 'insert', text: config.initialTarget[index] }); }
    mono = 15000; controller.tick();
    cases.push({ name: 'timely900-event-evidence-still-reaches-unchanged-competitive-rate-check', candidate: structuredClone(controller.result), timing: { issued, start: opens, deadline: opens + 15000, expires, now: opens + 16000 }, receipt: { lockDelayMs: 10000 } });
    expected.push({ error: true, errorCode: 'competitive-rate' });
  }
  const latest = generated(base, expires - 30000); latest.timing.now = expires + 3000;
  add('latest-start-finish-receipt-at-expiry-plus-existing-grace', latest);
  add('first-input-burst-limit-preserved', changed(item => { item.candidate.events = Array.from({ length: 81 }, (_, sequence) => ({ ...item.candidate.events[0], sequence, start: sequence, end: sequence })); }), true);
  const legacyIssued = { ...base, contentRevision: 'forge-social-duel-en-v1' }; delete legacyIssued.settings;
  for (const [name, peer, value] of [['new-duel-defaults-to-v2', null, base], ['issued-v1-peer-pins-both-to-v1', legacyIssued, legacyIssued], ['issued-v2-peer-pins-both-to-v2', base, base]]) {
    cases.push({ name, peer }); expected.push({ value });
  }
  for (const [name, peer] of [['unknown-peer-policy-denied', { ...base, settings: { timingPolicy: 'future' } }], ['changed-peer-duration-denied', { ...base, durationMs: 15000 }], ['extra-peer-dimension-denied', { ...base, startImmediately: true }]]) {
    cases.push({ name, peer }); expected.push({ error: true });
  }
  const legacy = generated(legacyIssued, opens, true);
  add('legacy-fixed-start-83ms-first-character-preserved', legacy);
  add('legacy-start-cannot-move', { ...legacy, candidate: { ...legacy.candidate, startedAtWall: opens + 1 } }, true);
  add('legacy-receipt-expiry-preserved', { ...legacy, timing: { ...legacy.timing, now: expires + 1 } }, true);
  cases.push({ name: 'legacy-fixed-start-keeps-redemption-time-clock', ...legacy, timing: { ...legacy.timing, now: opens + 31000 }, receipt: { lockDelayMs: 10000 } }); expected.push({ value: true });
  cases.push({ name: 'legacy-expiry-is-not-relaxed-by-new-receipt-capture', ...legacy, timing: { ...legacy.timing, now: expires - 1000 }, receipt: { lockDelayMs: 10000 } }); expected.push({ error: true, errorCode: 'challenge-mismatch' });
  for (const [name, issued, now, answer] of [
    ['new-resume-after-old-nominal-deadline', base, opens + 40000, true],
    ['new-resume-at-last-start', base, expires - 30000, true],
    ['new-resume-past-last-start', base, expires - 30000 + 1, false],
    ['legacy-resume-before-deadline', legacyIssued, opens + 29999, true],
    ['legacy-resume-at-deadline-denied', legacyIssued, opens + 30000, false],
  ]) { cases.push({ name, resume: { issued, start: opens, deadline: opens + 30000, expires, now } }); expected.push({ value: answer }); }
  const source = { configuration: { ...base, challengeId: 'owned-challenge' }, targetText: 'same passage', initialTarget: 'same passage' };
  for (const [name, candidate, issued, reject] of [
    ['new-duel-issued-source', source, base, false],
    ['legacy-source-cannot-opt-into-first-input', source, legacyIssued, true],
    ['new-source-cannot-opt-out-to-legacy', { ...source, configuration: { ...legacyIssued, challengeId: 'owned-challenge' } }, base, true],
    ['new-source-unknown-policy', { ...source, configuration: { ...source.configuration, settings: { timingPolicy: 'unknown' } } }, base, true],
  ]) add(name, { candidate, issued, duel: { expected_text: 'same passage' }, run: { challenge_id: 'owned-challenge' } }, reject);
}
