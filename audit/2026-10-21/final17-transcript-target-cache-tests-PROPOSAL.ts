// PROPOSAL ONLY: copy to src/lib/typing-core/__tests__/transcript-target-cache.test.ts
// only after approval. Imports deliberately address that eventual production path.
import { describe, expect, it, vi } from "vitest";
import {
  SessionController,
  alignTranscript,
  applyEvent,
  calculateMetrics,
  emptyTranscript,
  graphemes,
  normalizeTarget,
  replaySession,
  targetGraphemes,
  traceSessionWords,
  type Alignment,
  type ScoringPolicy,
  type SessionConfig,
  type SessionEvent,
} from "..";

type NativeWeakKey = Parameters<typeof WeakMap.prototype.set>[0];

interface CacheWrite {
  key: NativeWeakKey;
  value: unknown;
}

/** Forward every native operation unchanged. Assertions run after restoration,
 * so Vitest's own equality bookkeeping cannot enter the captured operation.
 */
function observeWeakMapWrites<T>(operation: () => T) {
  const writes: CacheWrite[] = [];
  const originalSet = WeakMap.prototype.set;
  const spy = vi.spyOn(WeakMap.prototype, "set").mockImplementation(function (
    this: WeakMap<NativeWeakKey, unknown>,
    key: NativeWeakKey,
    value: unknown,
  ) {
    const result = originalSet.call(this, key, value);
    writes.push({ key, value });
    return result;
  });
  try {
    return { result: operation(), writes };
  } finally {
    spy.mockRestore();
  }
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function arrayWritesFor(writes: readonly CacheWrite[], target: readonly string[]) {
  return writes.flatMap(({ key, value }) =>
    key === target && isUnknownArray(value) ? [value] : [],
  );
}

interface WordBounds {
  readonly start: number;
  readonly end: number;
  readonly separator: number | null;
}

function isNumericWordBounds(value: unknown): value is WordBounds {
  if (!value || typeof value !== "object") return false;
  const fields = value as Record<string, unknown>;
  return (
    Object.keys(fields).sort().join(",") === "end,separator,start" &&
    typeof fields.start === "number" &&
    Number.isInteger(fields.start) &&
    typeof fields.end === "number" &&
    Number.isInteger(fields.end) &&
    (fields.separator === null ||
      (typeof fields.separator === "number" &&
        Number.isInteger(fields.separator)))
  );
}

function expectFrozenNumericMetadata(value: readonly unknown[], wordCount: number) {
  expect(value).toHaveLength(wordCount);
  expect(Object.isFrozen(value)).toBe(true);
  for (const word of value) {
    expect(isNumericWordBounds(word)).toBe(true);
    expect(Object.isFrozen(word)).toBe(true);
  }
}

function insertEvent(text: string): SessionEvent {
  return {
    type: "insert",
    text,
    start: 0,
    end: 0,
    sequence: 0,
    offsetMs: 100,
    provenance: "keyboard",
  };
}

/** Compare the factory path with a fresh external-array alignment, every trace
 * field, and independently reconstructed final metrics at an ordinary clock.
 */
function expectReplayParity(
  originalTarget: string,
  events: SessionEvent[],
  policy: ScoringPolicy = "prose",
) {
  const targetText = normalizeTarget(originalTarget, policy);
  const configuration: SessionConfig = {
    clientSessionId: "word-cache-semantic-parity",
    mode: policy === "free" ? "zen" : policy === "code" ? "code" : "words",
    scoringPolicy: policy,
    initialTarget: targetText,
  };
  const state = emptyTranscript();
  for (const event of events) applyEvent(state, event, targetText, configuration);
  const external = alignTranscript(
    graphemes(targetText),
    [...state.units],
    policy,
    true,
    [...state.submissions],
    { includeWords: true },
  );
  const factory = alignTranscript(
    targetGraphemes(targetText),
    [...state.units],
    policy,
    true,
    [...state.submissions],
    { includeWords: true },
  );
  expect(factory).toEqual(external);
  const expected = calculateMetrics(configuration, targetText, state, 2000, {
    finiteFinal: true,
    alignment: external,
  });
  const replayed = replaySession(configuration, events, 2000, {
    finiteFinal: true,
  });
  expect(replayed.metrics).toEqual(expected.metrics);
  expect(replayed.characters).toEqual(expected.characters);
  expect(replayed.cursor).toBe(expected.cursor);
  expect(replayed.finalText).toBe(state.units.join(""));
  expect(
    traceSessionWords(configuration, events, 2000, { finiteFinal: true }),
  ).toEqual(external.words);
  return { factory, external, replayed };
}

function exerciseFactory(text: string, typedText = text.slice(0, 80)) {
  const typed = graphemes(typedText.normalize("NFC"));
  const observed = observeWeakMapWrites(() => {
    const target = targetGraphemes(text);
    const first = alignTranscript(target, [...typed], "prose", false, [], {
      includeWords: true,
    });
    const second = alignTranscript(target, [...typed], "prose", false, [], {
      includeWords: true,
    });
    return { target, first, second };
  });
  const external = alignTranscript(graphemes(text), typed, "prose", false, [], {
    includeWords: true,
  });
  expect(observed.result.first).toEqual(external);
  expect(observed.result.second).toEqual(external);
  expectReplayParity(text, [insertEvent(typed.join(""))]);
  return {
    ...observed.result,
    metadataWrites: arrayWritesFor(observed.writes, observed.result.target),
  };
}

function oneWordOfLength(length: number, uniqueLabel: string) {
  if (uniqueLabel.length > length) throw new Error("Fixture label exceeds target.");
  return uniqueLabel + "x".repeat(length - uniqueLabel.length);
}

function nonemptyWords(count: number, uniqueLabel: string) {
  return Array.from({ length: count }, (_, index) =>
    index === 0 ? uniqueLabel : "a",
  ).join(" ");
}

describe("bounded factory-owned target-word metadata", () => {
  it("reuses one frozen numeric record without changing complete Alignment or final metrics", () => {
    const exercised = exerciseFactory("factory-cache-contract calm hands", "factory-");
    expect(exercised.first.creditedUnits).toBe(8);
    expect(exercised.metadataWrites).toHaveLength(1);
    expectFrozenNumericMetadata(exercised.metadataWrites[0], 3);
    expect(exercised.target).toEqual(graphemes("factory-cache-contract calm hands"));
    expect(Object.isFrozen(exercised.target)).toBe(true);
    // Holding an old public factory array across unrelated target turnover must
    // not change its meaning. Do not assert nondeterministic GC timing.
    for (let index = 0; index < 20; index++)
      targetGraphemes(`unrelated-cache-lifetime-fixture-${index}`);
    expect(alignTranscript(exercised.target, graphemes("factory-"), "prose", false, [], { includeWords: true })).toEqual(exercised.first);
    expect(alignTranscript(targetGraphemes("factory-cache-contract calm hands"), graphemes("factory-"), "prose", false, [], { includeWords: true })).toEqual(exercised.first);
  });

  it("preserves empty-word separators and virtual submissions instead of crediting every correct slot", () => {
    for (const target of ["", " a", "a ", "a  b", "  a  b  "]) {
      const typed = target.slice(0, 3);
      exerciseFactory(target, typed);
    }
    const emptyWord = alignTranscript(
      targetGraphemes("a  b"),
      graphemes("a  "),
      "prose",
      false,
      [],
      { includeWords: true },
    );
    expect(emptyWord.characters.filter(slot => slot.status === "correct")).toHaveLength(3);
    expect(emptyWord.creditedUnits).toBe(2);
    expect(emptyWord.words[1].wordCredit).toBe(0);
    expectReplayParity("cat dog", [
      insertEvent("ct"),
      {
        type: "submit", text: "", start: 2, end: 2,
        sequence: 1, offsetMs: 200, provenance: "keyboard",
      },
      {
        type: "insert", text: "dog", start: 2, end: 2,
        sequence: 2, offsetMs: 300, provenance: "keyboard",
      },
    ]);
  });

  it("allows bounded metadata at 4,096 factory graphemes", () => {
    const exercised = exerciseFactory(oneWordOfLength(4096, "inclusive-unit-cache-contract-"));
    expect(exercised.target).toHaveLength(4096);
    expect(exercised.metadataWrites).toHaveLength(1);
    expectFrozenNumericMetadata(exercised.metadataWrites[0], 1);
  });

  it("does not retain word-array metadata for 4,097 factory graphemes", () => {
    const exercised = exerciseFactory(oneWordOfLength(4097, "exclusive-unit-cache-contract-"));
    expect(exercised.target).toHaveLength(4097);
    expect(exercised.metadataWrites).toEqual([]);
  });

  it("allows at most 512 frozen numeric Word records for an eligible factory target", () => {
    const exercised = exerciseFactory(nonemptyWords(512, "inclusive-word-cache-contract"));
    expect(exercised.target.length).toBeLessThan(4096);
    expect(exercised.metadataWrites).toHaveLength(1);
    expectFrozenNumericMetadata(exercised.metadataWrites[0], 512);
  });

  it("does not retain 513 Word records even when target length is below 4,096", () => {
    const exercised = exerciseFactory(nonemptyWords(513, "exclusive-word-cache-contract"));
    expect(exercised.target.length).toBeLessThan(4096);
    expect(exercised.metadataWrites).toEqual([]);
  });

  it("keeps all-space and empty-word-heavy targets on exact bounded-retention fallback", () => {
    const atWordLimit = exerciseFactory(" ".repeat(511), "  ");
    // Another suite may already have used this literal; an existing eligible
    // cache hit writes nothing. Any new payload must still be bounded/frozen.
    expect(atWordLimit.metadataWrites.length).toBeLessThanOrEqual(1);
    for (const words of atWordLimit.metadataWrites)
      expectFrozenNumericMetadata(words, 512);
    const beyondWordLimit = exerciseFactory(" ".repeat(512), "  ");
    expect(beyondWordLimit.metadataWrites).toEqual([]);
    const denseEmptyWords = exerciseFactory(" ".repeat(4096), "  ");
    expect(denseEmptyWords.first.words).toHaveLength(4097);
    expect(denseEmptyWords.first.creditedUnits).toBe(0);
    expect(denseEmptyWords.metadataWrites).toEqual([]);
  });

  it("never brands external mutable or ordinary frozen public target arrays", () => {
    const mutable = ["a", " ", "b"];
    const frozen = Object.freeze(graphemes("external array"));
    const observed = observeWeakMapWrites(() => {
      const before = alignTranscript(mutable, ["a", " ", "b"], "prose", false, [], { includeWords: true });
      mutable[1] = "x";
      const after = alignTranscript(mutable, ["a", " ", "b"], "prose", false, [], { includeWords: true });
      const frozenFirst = alignTranscript(frozen, graphemes("external"), "prose", false, [], { includeWords: true });
      const frozenSecond = alignTranscript(frozen, graphemes("external"), "prose", false, [], { includeWords: true });
      return { before, after, frozenFirst, frozenSecond };
    });
    expect(observed.result.before.creditedUnits).toBe(3);
    expect(observed.result.after.creditedUnits).toBe(0);
    expect(observed.result.after).toEqual(alignTranscript([...mutable], ["a", " ", "b"], "prose", false, [], { includeWords: true }));
    expect(observed.result.frozenFirst).toEqual(observed.result.frozenSecond);
    expect(arrayWritesFor(observed.writes, mutable)).toEqual([]);
    expect(arrayWritesFor(observed.writes, frozen)).toEqual([]);
    expectReplayParity("a b", [insertEvent("a b")]);
    expectReplayParity("axb", [insertEvent("a b")]);
    expectReplayParity("external array", [insertEvent("external")]);
  });

  it("responds to frozen getter and proxy target content changing between public calls", () => {
    for (const useProxy of [false, true]) {
      let separator = false;
      const backing = ["a", "x", "b"];
      Object.defineProperty(backing, "1", {
        configurable: true,
        enumerable: true,
        get: () => separator ? " " : "x",
      });
      const immutable = Object.freeze(backing);
      const target = useProxy
        ? new Proxy(immutable, { get: (object, key, receiver) => Reflect.get(object, key, receiver) })
        : immutable;
      const observed = observeWeakMapWrites(() => {
        const before = alignTranscript(target, ["a", " ", "b"], "prose", false, [], { includeWords: true });
        separator = true;
        const after = alignTranscript(target, ["a", " ", "b"], "prose", false, [], { includeWords: true });
        return { before, after };
      });
      expect(Object.isFrozen(target)).toBe(true);
      expect(observed.result.before).toEqual(alignTranscript(["a", "x", "b"], ["a", " ", "b"], "prose", false, [], { includeWords: true }));
      expect(observed.result.after).toEqual(alignTranscript(["a", " ", "b"], ["a", " ", "b"], "prose", false, [], { includeWords: true }));
      expect(observed.result.before.creditedUnits).toBe(0);
      expect(observed.result.after.creditedUnits).toBe(3);
      expect(arrayWritesFor(observed.writes, target)).toEqual([]);
      if (useProxy) expect(arrayWritesFor(observed.writes, immutable)).toEqual([]);
      expectReplayParity("axb", [insertEvent("a b")]);
      expectReplayParity("a b", [insertEvent("a b")]);
    }
  });

  it("does not leak cached bounds through mutable public alignment output", () => {
    const target = targetGraphemes("alias-isolation-contract calm");
    const first = alignTranscript(target, graphemes("alias-"), "prose", false, [], { includeWords: true });
    const retained: Alignment = structuredClone(first);
    first.mapping[0] = null;
    first.characters[0].typed = "!";
    first.characters[0].status = "incorrect";
    first.words[0].targetStart = 999;
    first.words[0].targetWord = "spoofed";
    expect(Reflect.set(target, "0", "!")).toBe(false);
    const next = alignTranscript(target, graphemes("alias-"), "prose", false, [], { includeWords: true });
    expect(next).toEqual(retained);
    expect(next.characters).not.toBe(first.characters);
    expect(next.words).not.toBe(first.words);
    expectReplayParity(target.join(""), [insertEvent("alias-")]);
  });

  it("preserves Unicode, RTL, IME history and code/free final metrics", () => {
    for (const [target, typed] of [
      ["café 👩🏽‍💻 हिन्दी", "cafe\u0301 👩🏽‍💻 "],
      ["العربية دقيقة", "العرب"],
      ["क्‍ष तेज अभ्यास", "क्‍ष "],
      ["🇮🇳 é 👩‍💻", "🇮🇳 é "],
    ]) {
      exerciseFactory(target, typed);
      expectReplayParity(target, [insertEvent(typed)]);
    }
    expectReplayParity("a\tb\nc", [insertEvent("a\tx\n")], "code");
    expectReplayParity("", [insertEvent("free 👩🏽‍💻 text")], "free");
    let now = 0;
    const controller = new SessionController({
      clientSessionId: "word-cache-composition-history", mode: "time", durationMs: 60000,
      initialTarget: "é 👩‍💻", correctionPolicy: "correct-words-locked",
    }, { now: () => now, wallNow: () => 1_700_000_000_000 + now });
    alignTranscript(targetGraphemes("é 👩‍💻"), [], "prose");
    const old = controller.input({ type: "insert", text: "e" });
    now = 100;
    controller.input({ type: "composition", text: "\u0301", compositionId: "accent" });
    now = 2000;
    const result = controller.finish("manual");
    expect(old.characters[0]).toMatchObject({ typed: "e", status: "incorrect" });
    expect(result.characters[0]).toMatchObject({ typed: "é", status: "correct" });
    expect(result.metrics.incorrectAttempts).toBe(2);
    expect(result.metrics.inputAccuracy).toBe(0);
    const independent = replaySession(result.configuration, result.events, result.elapsedMs, {
      targetText: result.targetText, issuedTargetSegments: result.issuedTargetSegments,
      pauseIntervals: result.pauseIntervals,
    });
    expect(result.metrics).toEqual(independent.metrics);
    expect(result.characters).toEqual(independent.characters);
  });

  it("isolates appended target identities and independently replays issued history", () => {
    let now = 0;
    const configuration: SessionConfig = {
      clientSessionId: "word-cache-target-append", mode: "time", durationMs: 60000,
      initialTarget: "cat dog", correctionPolicy: "correct-words-locked",
    };
    const controller = new SessionController(configuration, {
      now: () => now, wallNow: () => 1_700_000_000_000 + now,
    });
    controller.input({ type: "insert", text: "cat " });
    now = 1000;
    const old = controller.snapshot();
    const retained = structuredClone(old.characters);
    const oldTarget = targetGraphemes(old.targetText);
    controller.appendTarget(" café 👩‍💻");
    now = 1100;
    controller.input({ type: "insert", text: "d" });
    const newTarget = targetGraphemes(controller.snapshot().targetText);
    expect(newTarget).not.toBe(oldTarget);
    expect(old.characters).toEqual(retained);
    expect(old.targetText).toBe("cat dog");
    expect(Object.isFrozen(old.characters[0])).toBe(true);
    now = 2000;
    const result = controller.finish("manual");
    const options = {
      targetText: result.targetText, issuedTargetSegments: result.issuedTargetSegments,
      pauseIntervals: result.pauseIntervals,
    };
    const replayed = replaySession(result.configuration, result.events, result.elapsedMs, options);
    expect(result.metrics).toEqual(replayed.metrics);
    expect(result.characters).toEqual(replayed.characters);
    expect(result.cursor).toBe(replayed.cursor);
    expect(result.finalText).toBe(replayed.finalText);
    const external = alignTranscript(graphemes(result.targetText), graphemes(result.finalText), "prose", false, [], { includeWords: true });
    expect(alignTranscript(newTarget, graphemes(result.finalText), "prose", false, [], { includeWords: true })).toEqual(external);
    expect(traceSessionWords(result.configuration, result.events, result.elapsedMs, options)).toEqual(external.words);
    expect(old.characters).toEqual(retained);
  });
});
