import { describe, expect, it } from "vitest";
import {
  SessionController,
  graphemes,
  replaySnapshot,
  type NormalizedEdit,
  type SessionConfig,
  type SessionSnapshot,
} from "..";

function session(overrides: Partial<SessionConfig> = {}) {
  let now = 0;
  const controller = new SessionController(
    {
      clientSessionId: "live-projection",
      mode: "time",
      durationMs: 60000,
      initialTarget: "calm hands",
      correctionPolicy: "correct-words-locked",
      ...overrides,
    },
    { now: () => now, wallNow: () => 1_700_000_000_000 + now },
  );
  return {
    controller,
    at: (value: number) => {
      now = value;
    },
  };
}

function expectCanonicalPublication(
  controller: SessionController,
  snapshot: SessionSnapshot,
) {
  expect(Object.isFrozen(snapshot.characters)).toBe(true);
  for (const character of snapshot.characters)
    expect(Object.isFrozen(character)).toBe(true);
  const replayed = replaySnapshot(
    controller.configuration,
    snapshot.events,
    snapshot.elapsedMs,
    { targetText: snapshot.targetText },
  );
  expect(snapshot.characters).toEqual(replayed.characters);
  expect(snapshot.cursor).toBe(replayed.cursor);
  expect(snapshot.finalText).toBe(replayed.finalText);
  expect(snapshot.metrics).toEqual(replayed.metrics);
}

describe("live presentation without redundant alignment work", () => {
  it("refreshes time-based rates while preserving exact retained evidence", () => {
    const { controller, at } = session();
    controller.input({ type: "insert", text: "calm " });
    at(1000);
    const first = controller.tick();
    at(2000);
    const second = controller.tick();
    expect(first.metrics.wpm).toBe(60);
    expect(second.metrics.wpm).toBe(30);
    expect(second.metrics.insertionAttempts).toBe(5);
    expect(second.characters).toBe(first.characters);
    expect(second.finalText).toBe("calm ");
    expectCanonicalPublication(controller, second);
    expect(() => {
      second.characters.push({ ...second.characters[0] });
    }).toThrow();
    expect(() => {
      second.characters[0] = { ...second.characters[0], typed: "x" };
    }).toThrow();
    expect(() => {
      second.characters[0].typed = "x";
    }).toThrow();
    expect(controller.snapshot().characters[0].typed).toBe("c");
  });

  it("invalidates presentation for edits, target extension and final finite misses", () => {
    const { controller, at } = session();
    controller.input({ type: "insert", text: "c" });
    expect(controller.snapshot().characters[0].status).toBe("correct");
    controller.input({ type: "replace", start: 0, end: 1, text: "x" });
    expect(controller.snapshot().characters[0].status).toBe("incorrect");
    controller.appendTarget(" rest");
    expect(
      controller
        .snapshot()
        .characters.map((slot) => slot.expected)
        .join(""),
    ).toBe("calm hands rest");
    at(1000);
    const result = controller.finish("manual");
    expect(result.metrics.insertionAttempts).toBe(2);
    expect(result.metrics.correctAttempts).toBe(1);
    expect(result.metrics.incorrectAttempts).toBe(1);
    const finite = session({ mode: "words", durationMs: undefined }).controller;
    finite.input({ type: "insert", text: "c" });
    expect(finite.snapshot().characters[1].status).toBe("untyped");
    expect(finite.finish("manual").characters[1].status).toBe("missed");
  });

  it("keeps old publications immutable through virtual submission, correction and target extension", () => {
    const { controller, at } = session({ initialTarget: "cat dog" });
    const publications: Array<{
      snapshot: SessionSnapshot;
      characters: string;
      target: string;
    }> = [];
    const publish = () => {
      const snapshot = controller.snapshot();
      expectCanonicalPublication(controller, snapshot);
      publications.push({
        snapshot,
        characters: JSON.stringify(snapshot.characters),
        target: snapshot.targetText,
      });
      return snapshot;
    };
    let now = 100;
    const edit = (value: NormalizedEdit) => {
      at(now);
      now += 100;
      controller.input(value);
      return publish();
    };
    const ready = publish();
    const wrong = edit({ type: "insert", text: "cax" });
    expect(wrong.characters[2]).toMatchObject({ typed: "x", status: "incorrect" });
    const submitted = edit({ type: "submit" });
    expect(submitted.characters[3].status).toBe("missed");
    const reopened = edit({ type: "delete", start: 3, end: 3 });
    expect(reopened.finalText).toBe("cax");
    expect(reopened.characters[3].status).toBe("untyped");
    edit({ type: "delete", start: 2, end: 3 });
    const corrected = edit({ type: "insert", text: "t " });
    expect(corrected.finalText).toBe("cat ");
    expect(corrected.metrics.incorrectAttempts).toBe(1);
    expect(corrected.metrics.inputAccuracy).toBe(80);
    const laterWord = edit({ type: "insert", text: "d" });
    at(now);
    controller.appendTarget(" rest");
    const extended = publish();
    expect(extended.characters).not.toBe(laterWord.characters);
    expect(extended.characters).toHaveLength(graphemes("cat dog rest").length);
    expect(ready.characters[0].status).toBe("untyped");
    for (const publication of publications) {
      expect(JSON.stringify(publication.snapshot.characters)).toBe(
        publication.characters,
      );
      expect(publication.snapshot.targetText).toBe(publication.target);
      expect(Object.isFrozen(publication.snapshot.characters)).toBe(true);
      for (const character of publication.snapshot.characters)
        expect(Object.isFrozen(character)).toBe(true);
    }
  });

  it.each<{
    name: string;
    configuration: Partial<SessionConfig>;
    text: string;
  }>([
    {
      name: "code with tabs, newline and a retained error",
      configuration: {
        mode: "code",
        scoringPolicy: "code",
        correctionPolicy: undefined,
        initialTarget: "a\tb\nc",
      },
      text: "a\tx\n",
    },
    {
      name: "free writing with extra-character slots",
      configuration: {
        mode: "zen",
        scoringPolicy: "free",
        correctionPolicy: undefined,
        initialTarget: "",
      },
      text: "free 👩🏽‍💻 text",
    },
    {
      name: "prose containing empty words and separators",
      configuration: { initialTarget: " a  b ", correctionPolicy: undefined },
      text: " a ",
    },
    {
      name: "mixed Unicode graphemes and normalized accents",
      configuration: { initialTarget: "café 👩🏽‍💻 हिन्दी" },
      text: "cafe\u0301 👩🏽‍💻 ",
    },
  ])("preserves canonical publication for $name", ({ configuration, text }) => {
    const { controller, at } = session(configuration);
    const first = controller.input({ type: "insert", text });
    expectCanonicalPublication(controller, first);
    const retained = JSON.stringify(first.characters);
    at(1200);
    const later = controller.tick();
    expect(later.characters).toBe(first.characters);
    expectCanonicalPublication(controller, later);
    expect(JSON.stringify(first.characters)).toBe(retained);
  });

  it("does not mutate an earlier slot when later input joins a Unicode grapheme", () => {
    const { controller, at } = session({ initialTarget: "é 👩‍💻" });
    const beforeMerge = controller.input({ type: "insert", text: "e" });
    expect(beforeMerge.characters[0]).toMatchObject({
      typed: "e",
      status: "incorrect",
    });
    const original = JSON.stringify(beforeMerge.characters);
    at(100);
    const merged = controller.input({
      type: "composition",
      text: "\u0301",
      compositionId: "accent",
    });
    expectCanonicalPublication(controller, merged);
    expect(merged.characters[0]).toMatchObject({ typed: "é", status: "correct" });
    expect(merged.metrics.incorrectAttempts).toBe(2);
    expect(merged.characters).not.toBe(beforeMerge.characters);
    expect(JSON.stringify(beforeMerge.characters)).toBe(original);
    expect(Object.isFrozen(beforeMerge.characters[0])).toBe(true);
  });

  it("preserves live untyped slots while independently finalizing partial finite text", () => {
    const { controller, at } = session({
      mode: "words",
      durationMs: undefined,
      settings: { display: { enabled: true } },
    });
    controller.input({ type: "insert", text: "calm h" });
    at(1200);
    const live = controller.snapshot();
    expectCanonicalPublication(controller, live);
    const retained = JSON.stringify(live.characters);
    const result = controller.finish("manual");
    const replayed = replaySnapshot(
      controller.configuration,
      result.events,
      result.elapsedMs,
      { targetText: result.targetText, finiteFinal: true },
    );
    expect(result.characters).toEqual(replayed.characters);
    expect(result.metrics.correct).toBe(replayed.metrics.correct);
    expect(result.metrics.missed).toBe(4);
    expect(result.metrics.creditedUnits).toBe(5);
    expect(result.characters).not.toBe(live.characters);
    expect(JSON.stringify(live.characters)).toBe(retained);
    expect(live.characters[6].status).toBe("untyped");
    expect(result.characters[6].status).toBe("missed");
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.characters)).toBe(true);
    expect(Object.isFrozen(result.events)).toBe(true);
    expect(Object.isFrozen(result.events[0])).toBe(true);
    expect(Object.isFrozen(result.configuration)).toBe(true);
    expect(Object.isFrozen(result.configuration.settings?.display)).toBe(true);
  });
});

describe("canonical segmentation in the ASCII input fast path", () => {
  it("matches native grapheme boundaries across ASCII controls and mixed Unicode", () => {
    const native = new Intl.Segmenter("und", { granularity: "grapheme" });
    const vectors = [
      Array.from({ length: 128 }, (_, i) => String.fromCharCode(i)).join(""),
      "calm hands\nsteady\tkeys",
      "\r\n\r\n",
      "e\u0301 café 👩🏽‍💻 🇮🇳\r\n",
      "क्‍ष عربي",
    ];
    for (const text of vectors)
      expect(graphemes(text)).toEqual(
        Array.from(native.segment(text), (part) => part.segment),
      );
  });
});
