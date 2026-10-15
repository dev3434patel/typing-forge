import { describe, expect, it } from "vitest";
import {
  alignTranscript,
  graphemes,
  SessionController,
  type CharacterSlot,
  type ScoringPolicy,
} from "../typing-core";
import { groupTypingSlots, orderTypingSlots } from "../typing-passage";

function slots(text: string): CharacterSlot[] {
  return graphemes(text).map((expected, index) => ({
    index,
    expected,
    typed: null,
    status: "untyped",
  }));
}

const groupText = (group: ReturnType<typeof groupTypingSlots>[number]) =>
  group.slots.map((slot) => slot.expected ?? slot.typed).join("");

describe("typing passage groups", () => {
  it("groups complete prose words without changing text or slot order", () => {
    const source = slots("small words flow");
    const groups = groupTypingSlots(source);
    expect(groups.map((group) => [group.kind, groupText(group)])).toEqual([
      ["word", "small"],
      ["whitespace", " "],
      ["word", "words"],
      ["whitespace", " "],
      ["word", "flow"],
    ]);
    expect(groups.flatMap((group) => group.slots)).toEqual(source);
    expect(groups.flatMap((group) => group.slots)[4]).toBe(source[4]);
    expect(groups.map(groupText).join("")).toBe("small words flow");
  });

  it("uses expected word boundaries when wrong spaces or wrong letters were typed", () => {
    const source = slots("cat dog");
    source[1] = { ...source[1], typed: " ", status: "incorrect" };
    source[3] = { ...source[3], typed: "x", status: "incorrect" };
    const groups = groupTypingSlots(source);
    expect(groups.map(groupText)).toEqual(["cat", " ", "dog"]);
    expect(groups[0].slots[1].typed).toBe(" ");
    expect(groups[1].slots[0].typed).toBe("x");
  });

  it("preserves consecutive separators, tabs and newlines exactly", () => {
    const text = "  one\t\n two  ";
    const groups = groupTypingSlots(slots(text));
    expect(groups.map(groupText)).toEqual(["  ", "one", "\t\n ", "two", "  "]);
    expect(groups.map(groupText).join("")).toBe(text);
  });

  it("keeps nonbreaking spaces within words", () => {
    const text = "a\u00a0b c\u202fd e\u2007f";
    expect(groupTypingSlots(slots(text)).map(groupText)).toEqual([
      "a\u00a0b",
      " ",
      "c\u202fd",
      " ",
      "e\u2007f",
    ]);
  });

  it("keeps joining scripts and multicodepoint graphemes intact", () => {
    const text = "مرحبا بالعالم 👩🏽‍💻 café";
    const source = slots(text);
    const groups = groupTypingSlots(source);
    expect(groups.map(groupText).join("")).toBe(text);
    expect(
      groups.filter((group) => group.kind === "word").map(groupText),
    ).toEqual(["مرحبا", "بالعالم", "👩🏽‍💻", "café"]);
    expect(
      groups.find((group) => groupText(group) === "👩🏽‍💻")?.slots,
    ).toHaveLength(1);
  });

  it("groups unprompted extra input by its actual units", () => {
    const source = slots("a b").map((slot) => ({
      ...slot,
      expected: null,
      typed: slot.expected,
      status: "extra" as const,
    }));
    expect(groupTypingSlots(source).map(groupText)).toEqual(["a", " ", "b"]);
  });

  it("bypasses prose grouping for exact-whitespace code", () => {
    const source = slots("if (ok) {\n\treturn true;\n}");
    const groups = groupTypingSlots(source, true);
    expect(groups).toHaveLength(1);
    expect(groups[0].kind).toBe("code");
    expect(groups[0].slots).toBe(source);
    expect(groupText(groups[0])).toBe("if (ok) {\n\treturn true;\n}");
  });

  it("returns no groups for an empty passage in either mode", () => {
    expect(groupTypingSlots([])).toEqual([]);
    expect(groupTypingSlots([], true)).toEqual([]);
  });

  it("does not mutate frozen canonical input", () => {
    const source = Object.freeze(
      slots("one two").map((slot) => Object.freeze(slot)),
    );
    const groups = groupTypingSlots(source);
    expect(groups.flatMap((group) => group.slots)).toEqual(source);
    expect(groups.map((group) => group.key)).toEqual([0, 3, 4]);
  });
});

describe("extra character presentation alignment", () => {
  function align(
    target: string,
    typed: string,
    policy: ScoringPolicy = "prose",
    submissions: number[] = [],
  ) {
    const alignment = alignTranscript(
      graphemes(target),
      graphemes(typed),
      policy,
      false,
      submissions,
    );
    const before = JSON.stringify(alignment);
    const ordered = orderTypingSlots(alignment.characters, alignment.cursor);
    // Presentation must retain every canonical object and each original index.
    expect(new Set(ordered)).toEqual(new Set(alignment.characters));
    expect(ordered).toHaveLength(alignment.characters.length);
    expect(
      ordered
        .filter((slot) => slot.expected !== null)
        .map((slot) => slot.expected)
        .join(""),
    ).toBe(target);
    expect(
      ordered
        .filter((slot) => slot.typed !== null)
        .map((slot) => slot.typed)
        .join(""),
    ).toBe(typed);
    expect(JSON.stringify(alignment)).toBe(before);
    return {
      ...alignment,
      ordered,
      display: ordered.map((slot) => slot.expected ?? slot.typed).join(""),
    };
  }

  it("places overtyped letters at their word instead of after the whole passage", () => {
    const result = align("cat dog", "catx");
    expect(result.display).toBe("catx dog");
    expect(result.ordered.map((slot) => slot.index)).toEqual([
      0, 1, 2, 10, 3, 4, 5, 6,
    ]);
    expect(result.cursor).toBe(3);
    expect(
      groupTypingSlots(result.characters, false, result.cursor).map(groupText),
    ).toEqual(["catx", " ", "dog"]);
  });

  it("handles several extra characters across different words", () => {
    expect(align("cat dog sun", "catxy dogz sunq").display).toBe(
      "catxy dogz sunq",
    );
  });

  it("retains skipped target letters when an early space precedes overtyping", () => {
    const result = align("cat dog sun", "c dogxy s");
    expect(result.display).toBe("cat dogxy sun");
    expect(result.ordered.find((slot) => slot.index === 1)?.status).toBe(
      "missed",
    );
  });

  it("handles explicit short-word submission without inventing a typed separator", () => {
    expect(align("cat dog", "cdogx", "prose", [1]).display).toBe("cat dogx");
  });

  it("uses the end cursor when all words were submitted without mapped input", () => {
    expect(align("cat dog", "x", "prose", [0, 0]).display).toBe("cat dogx");
  });

  it("anchors extras before an initial empty target word's separator", () => {
    expect(align(" cat", "x c").display).toBe("x cat");
  });

  it("decodes offsets in graphemes for joined emoji and non-Latin input", () => {
    expect(align("👩🏽‍💻好 نعم", "👩🏽‍💻好xy نعمz").display).toBe("👩🏽‍💻好xy نعمz");
  });

  it("retains exact code whitespace and terminal extra input", () => {
    const result = align("let x\n", "let x\n\tz", "code");
    expect(result.display).toBe("let x\n\tz");
    expect(
      groupTypingSlots(result.characters, true, result.cursor)[0].slots,
    ).toEqual(result.ordered);
  });

  it("retains free-writing order when there are no target slots", () => {
    expect(align("", "👩🏽‍💻 x", "free").display).toBe("👩🏽‍💻 x");
  });

  it("reanchors retained extras after edits and target extension", () => {
    const controller = new SessionController(
      {
        clientSessionId: "presentation-only",
        mode: "zen",
        initialTarget: "cat dog",
        scoringPolicy: "prose",
      },
      { now: () => 1000, wallNow: () => 1000 },
    );
    controller.input({ type: "insert", text: "catxy" });
    controller.input({ type: "delete", start: 3, end: 4 });
    controller.appendTarget(" sun");
    const before = controller.snapshot();
    expect(
      orderTypingSlots(before.characters, before.cursor)
        .map((slot) => slot.expected ?? slot.typed)
        .join(""),
    ).toBe("caty dog sun");
    expect(controller.snapshot()).toEqual(before);
    expect(before.metrics.extra).toBe(1);
    expect(before.metrics.insertionAttempts).toBe(5);
    expect(before.metrics.deletedUnits).toBe(1);
  });
});
