import { describe, expect, it } from "vitest";
import { alignTranscript, graphemes, type CharacterSlot } from "@/lib/typing-core";
import {
  buildTypingPassageModel,
  type TypingPassageModel,
} from "./typing-passage-model";

const slots = (text: string): CharacterSlot[] =>
  graphemes(text).map((expected, index) => ({
    index,
    expected,
    typed: null,
    status: "untyped",
  }));
const allGroups = (model: TypingPassageModel) => model.blocks.flatMap((block) => block.groups);
const allChunks = (model: TypingPassageModel) => allGroups(model).flatMap((group) => group.chunks);
const allViews = (model: TypingPassageModel) => allChunks(model).flatMap((chunk) => chunk.views);
const viewsByIndex = (model: TypingPassageModel) => new Map(allViews(model).map((view) => [view.slot.index, view]));

describe("bounded typing passage updates", () => {
  it("reuses every block when equivalent snapshots and callback closures are recreated", () => {
    const text = "calm hands build steady rhythm ".repeat(40).trim();
    const first = buildTypingPassageModel(slots(text), {
      cursor: 0,
      marker: "caret",
      renderBefore: () => null,
    });
    const next = buildTypingPassageModel(slots(text), {
      cursor: 0,
      marker: "caret",
      renderBefore: () => null,
    }, first);
    expect(next.blocks.length).toBeLessThan(24);
    expect(next.blocks.every((block, index) => block === first.blocks[index])).toBe(true);
    expect(allViews(next)).toHaveLength(1239);
    expect(next.targetCount).toBe(1239);
  });

  it("updates only the affected bounded blocks while all 1239 target characters stay mounted", () => {
    const target = graphemes("calm hands build steady rhythm ".repeat(40).trim());
    const initial = alignTranscript(target, target.slice(0, 611), "prose");
    const first = buildTypingPassageModel(initial.characters, { cursor: initial.cursor, marker: "caret" });
    const advanced = alignTranscript(target, target.slice(0, 612), "prose");
    const next = buildTypingPassageModel(advanced.characters, { cursor: advanced.cursor, marker: "caret" }, first);
    const changed = next.blocks.filter((block, index) => block !== first.blocks[index]);
    expect(changed.length).toBeGreaterThan(0);
    expect(changed.length).toBeLessThanOrEqual(2);
    expect(changed.reduce((sum, block) => sum + block.groups.reduce((count, group) => count + group.size, 0), 0)).toBeLessThanOrEqual(128);
    const before = viewsByIndex(first), after = viewsByIndex(next);
    expect([...after.keys()]).toEqual([...before.keys()]);
    expect(after.get(610)).toBe(before.get(610));
    expect(after.get(611)).not.toBe(before.get(611));
    expect(after.get(611)?.slot).toMatchObject({ typed: target[611], status: "correct" });
    expect(after.get(612)?.current).toBe(true);
    expect(after.get(1000)).toBe(before.get(1000));
  });

  it("does not hide correction, rejected input, or moving pace and opponent annotations", () => {
    const source = slots("a ".repeat(100));
    source[4] = { ...source[4], typed: "x", status: "incorrect" };
    const first = buildTypingPassageModel(source, {
      cursor: 5, marker: "caret",
      renderBefore: (slot) => slot.index === 80 ? "pace" : null,
      renderAfter: (slot) => slot.index === 90 ? "old feedback" : null,
      characterClassName: (slot) => slot.index < 100 ? "opponent-passed" : undefined,
    });
    const corrected = source.map((slot) => slot.index === 4 ? { ...slot, typed: "a", status: "correct" as const } : { ...slot });
    const next = buildTypingPassageModel(corrected, {
      cursor: 5, marker: "caret",
      renderBefore: (slot) => slot.index === 81 ? "pace" : null,
      renderAfter: (slot) => slot.index === 90 ? "new feedback" : null,
      characterClassName: (slot) => slot.index < 101 ? "opponent-passed" : undefined,
    }, first);
    const before = viewsByIndex(first), after = viewsByIndex(next);
    expect(after.get(4)?.slot).toMatchObject({ typed: "a", status: "correct" });
    expect(after.get(5)?.current).toBe(true);
    expect(after.get(80)?.before).toBeNull();
    expect(after.get(81)?.before).toBe("pace");
    expect(after.get(90)?.after).toBe("new feedback");
    expect(after.get(100)?.className).toBe("opponent-passed");
    expect(after.get(150)).toBe(before.get(150));
  });

  it("preserves extra-character insertion order and every canonical slot index", () => {
    const result = alignTranscript(graphemes("cat dog"), graphemes("catxy"), "prose");
    const model = buildTypingPassageModel(result.characters, { cursor: result.cursor, marker: "caret" });
    const views = allViews(model);
    expect(views.map((view) => view.slot.index)).toEqual([0, 1, 2, 10, 11, 3, 4, 5, 6]);
    expect(views.filter((view) => view.slot.status === "extra").map((view) => view.slot.typed)).toEqual(["x", "y"]);
    expect(views.find((view) => view.current)?.slot.index).toBe(3);
    expect(model.targetCount).toBe(7);
  });

  it("bounds oversized code fragments without splitting or normalizing composed input", () => {
    const target = graphemes("const café = '👩🏽‍💻';\n\treturn किताब;\n".repeat(12));
    const result = alignTranscript(target, target.slice(0, 130), "code");
    const first = buildTypingPassageModel(result.characters, { cursor: result.cursor, marker: "caret", preserveWhitespace: true });
    expect(allGroups(first)).toHaveLength(1);
    expect(allGroups(first)[0].kind).toBe("code");
    expect(allChunks(first).every((chunk) => chunk.views.length <= 64)).toBe(true);
    expect(allViews(first).map((view) => view.slot.expected)).toEqual(target);
    expect(allViews(first).filter((view) => view.slot.expected === "\n")).toHaveLength(24);
    const advanced = alignTranscript(target, target.slice(0, 131), "code");
    const next = buildTypingPassageModel(advanced.characters, { cursor: advanced.cursor, marker: "caret", preserveWhitespace: true }, first);
    expect(allChunks(next).filter((chunk, i) => chunk !== allChunks(first)[i])).toHaveLength(1);
  });

  it("keeps a long unbroken word in one wrapper while only its edited inner fragment changes", () => {
    const source = slots("a".repeat(1000));
    const first = buildTypingPassageModel(source, { cursor: 210, marker: "caret" });
    const edited = source.map((slot) => slot.index === 210 ? { ...slot, typed: "x", status: "incorrect" as const } : { ...slot });
    const next = buildTypingPassageModel(edited, { cursor: 211, marker: "caret" }, first);
    expect(allGroups(next)).toHaveLength(1);
    expect(allGroups(next)[0].kind).toBe("word");
    expect(allChunks(next).every((chunk) => chunk.views.length <= 64)).toBe(true);
    expect(allChunks(next).filter((chunk, i) => chunk !== allChunks(first)[i])).toHaveLength(1);
    expect(allViews(next)).toHaveLength(1000);
    expect(allViews(first)[210].slot.typed).toBeNull();
  });
});
