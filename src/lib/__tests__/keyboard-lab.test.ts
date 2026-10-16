import { describe, expect, it, vi } from "vitest";
import {
  LAB_PAIR_SAMPLE_LIMIT,
  REFERENCE_MAPS,
  buildTransitionDrill,
  compareLabLayouts,
  createLabState,
  median,
  observeLabKeyDown,
  observeLabKeyUp,
  readBrowserLayout,
  releaseLabFocus,
  transitionSummary,
  type LabState,
} from "../keyboard-lab";

function type(
  state: LabState,
  key: string,
  at: number,
  code = `Key${key.toUpperCase()}`,
) {
  return observeLabKeyDown(state, { key, code, at });
}
describe("focused keyboard observations", () => {
  it("records actual logical characters separately from physical codes without mutating history", () => {
    const before = createLabState();
    const after = type(before, "a", 10, "KeyQ");
    expect(before.keys).toEqual({});
    expect(after.keys.KeyQ).toEqual({
      presses: 1,
      repeats: 0,
      releases: 0,
      pressed: true,
      logicalKeys: ["a"],
    });
    expect(after.mapping).toEqual({ KeyQ: "a" });
  });
  it("records keyup without inventing a press for unseen keys", () => {
    const before = type(createLabState(), "a", 10);
    const after = observeLabKeyUp(before, "KeyA");
    expect(before.keys.KeyA.pressed).toBe(true);
    expect(after.keys.KeyA).toMatchObject({ pressed: false, releases: 1 });
    expect(observeLabKeyUp(after, "KeyQ")).toBe(after);
  });
  it("clears held state and transition continuity on blur without inventing releases", () => {
    const state = releaseLabFocus(type(createLabState(), "a", 10));
    expect(state.keys.KeyA).toMatchObject({ pressed: false, releases: 0 });
    expect(state.previous).toBeNull();
    expect(transitionSummary(type(state, "b", 100))).toEqual([]);
  });
  it("excludes repeat events from transition evidence and clears continuity", () => {
    let state = type(createLabState(), "a", 10);
    state = observeLabKeyDown(state, {
      key: "a",
      code: "KeyA",
      at: 20,
      repeat: true,
    });
    state = type(state, "b", 100);
    expect(state.repeats).toBe(1);
    expect(state.keys.KeyA).toMatchObject({ presses: 1, repeats: 1 });
    expect(transitionSummary(state)).toEqual([]);
  });
  it.each([
    { isComposing: true },
    { ctrlKey: true },
    { altKey: true },
    { metaKey: true },
  ])("excludes composition or shortcuts: %j", (modifiers) => {
    let state = type(createLabState(), "a", 10);
    state = observeLabKeyDown(state, {
      key: "b",
      code: "KeyB",
      at: 20,
      ...modifiers,
    });
    state = type(state, "c", 100);
    expect(transitionSummary(state)).toEqual([]);
    expect(state.mapping.KeyB).toBeUndefined();
  });
  it.each([
    "Dead",
    "Process",
    "Tab",
    "Escape",
    "Shift",
    " ",
    "ArrowLeft",
    "Backspace",
  ])("does not make %s a measured printable transition", (key) => {
    const state = observeLabKeyDown(type(createLabState(), "a", 10), {
      key,
      code: "KeyQ",
      at: 100,
    });
    expect(state.previous).toBeNull();
    expect(transitionSummary(state)).toEqual([]);
  });
  it("normalizes letter case for pair aggregation and ignores shifted keys for layout inference", () => {
    let state = type(createLabState(), "a", 0);
    state = observeLabKeyDown(state, {
      key: "B",
      code: "KeyB",
      at: 100,
      shiftKey: true,
    });
    expect(transitionSummary(state)[0]).toMatchObject({
      from: "a",
      to: "b",
      samplesMs: [100],
    });
    expect(state.mapping.KeyB).toBeUndefined();
    expect(state.keys.KeyB.logicalKeys).toEqual(["B"]);
  });
  it("accepts actual Unicode characters while keeping named keys out", () => {
    let state = type(createLabState(), "é", 0, "KeyE");
    state = type(state, "ü", 150, "KeyU");
    expect(transitionSummary(state)[0]).toMatchObject({
      from: "é",
      to: "ü",
      medianMs: 150,
    });
  });
  it("keeps unknown codes visible as an uncertainty count instead of inventing physical keys", () => {
    const state = type(createLabState(), "a", 20, "Unidentified");
    expect(state.unidentifiedEvents).toBe(1);
    expect(state.keys).toEqual({});
  });
  it("rejects object prototype names as physical codes without crashing", () => {
    let state = type(createLabState(), "a", 10, "constructor");
    state = type(state, "b", 20, "toString");
    expect(state.keys).toEqual({});
    expect(state.unidentifiedEvents).toBe(2);
    expect(observeLabKeyUp(state, "constructor")).toBe(state);
  });
  it.each([Number.NaN, Infinity, -1])(
    "ignores invalid timestamps: %s",
    (at) => {
      const state = createLabState();
      expect(type(state, "a", at)).toBe(state);
    },
  );
  it.each([0, -10, 2001])(
    "excludes zero, reversed and idle intervals: %s ms",
    (interval) => {
      expect(
        transitionSummary(
          type(type(createLabState(), "a", 100), "b", 100 + interval),
        ),
      ).toEqual([]);
    },
  );
  it("includes the two-second boundary and replaces the interval anchor after an idle gap", () => {
    let state = type(type(createLabState(), "a", 0), "b", 2000);
    expect(transitionSummary(state)[0].medianMs).toBe(2000);
    state = type(state, "c", 5000);
    state = type(state, "d", 5150);
    expect(
      transitionSummary(state).find((pair) => pair.from === "c")?.medianMs,
    ).toBe(150);
    expect(
      transitionSummary(state).find((pair) => pair.from === "b"),
    ).toBeUndefined();
  });
  it("qualifies a pair only after three observations and bounds retained samples", () => {
    let state = createLabState();
    for (let i = 0; i < LAB_PAIR_SAMPLE_LIMIT + 4; i++) {
      state = type(state, "a", i * 300);
      state = type(state, "b", i * 300 + 100);
    }
    const pair = transitionSummary(state).find((pair) => pair.from === "a")!;
    expect(pair.qualified).toBe(true);
    expect(pair.samplesMs).toHaveLength(LAB_PAIR_SAMPLE_LIMIT);
    expect(pair.medianMs).toBe(100);
  });
  it("labels one or two pair observations as insufficient for a suggestion", () => {
    let state = createLabState();
    for (let i = 0; i < 2; i++) {
      state = type(state, "a", i * 300);
      state = type(state, "b", i * 300 + 100);
    }
    expect(
      transitionSummary(state).find((pair) => pair.from === "a")?.qualified,
    ).toBe(false);
    state = type(state, "a", 600);
    state = type(state, "b", 700);
    expect(
      transitionSummary(state).find((pair) => pair.from === "a")?.qualified,
    ).toBe(true);
  });
  it("uses an actual median, with null for no finite positive measurements", () => {
    expect(median([300, 100, 200])).toBe(200);
    expect(median([400, 100, 200, 300])).toBe(250);
    expect(median([0, -5, Number.NaN, Infinity])).toBeNull();
  });
  it("builds a deterministic original pair drill and rejects named keys", () => {
    expect(buildTransitionDrill("e", "r")).toBe("er er re ere er re er");
    expect(buildTransitionDrill("Tab", "r")).toBe("");
    expect(buildTransitionDrill(" ", "r")).toBe("");
  });
});
describe("reference layout agreement remains an incomplete hint", () => {
  it("matches standard Workman physical key positions rather than QWERTY labels", () => {
    const observed={KeyW:'d',KeyE:'r',KeyD:'h',KeyF:'t',KeyJ:'n',KeyC:'m'};
    expect(compareLabLayouts(observed).find(layout=>layout.layout==='workman')).toMatchObject({checked:6,matched:6,mismatches:[]});
    expect(REFERENCE_MAPS.workman).toMatchObject({KeyP:';',Semicolon:'i',KeyZ:'z',KeyC:'m',KeyN:'k',KeyM:'l',Comma:',',Period:'.',Slash:'/'});
    expect(compareLabLayouts(observed).find(layout=>layout.layout==='qwerty')?.mismatches).toContain('KeyW');
  });
  it("has no evidence before mappings are observed", () => {
    expect(compareLabLayouts({}).every((layout) => layout.checked === 0)).toBe(
      true,
    );
  });
  it("distinguishes physical-code mapping from the character itself", () => {
    const results = compareLabLayouts({
      KeyQ: "a",
      KeyW: "z",
      KeyA: "q",
      KeyZ: "w",
      KeyS: "s",
      KeyD: "d",
    });
    expect(results[0]).toMatchObject({
      layout: "azerty",
      checked: 6,
      matched: 6,
      mismatches: [],
    });
    expect(
      results.find((result) => result.layout === "qwerty")?.mismatches,
    ).toContain("KeyQ");
  });
  it("keeps ambiguity between QWERTY and QWERTZ when distinguishing keys are absent", () => {
    const results = compareLabLayouts({
      KeyA: "a",
      KeyS: "s",
      KeyD: "d",
      KeyF: "f",
      KeyG: "g",
      KeyH: "h",
    });
    expect(
      results
        .filter((result) => result.checked === 6 && !result.mismatches.length)
        .map((result) => result.layout),
    ).toEqual(expect.arrayContaining(["qwerty", "qwertz"]));
  });
  it("ignores symbols and codes outside partial reference maps in agreement counts", () => {
    const result = compareLabLayouts({
      Digit1: "1",
      KeyA: "a",
      Space: " ",
      KeyQ: "'",
    }).find((result) => result.layout === "qwerty")!;
    expect(result).toMatchObject({ checked: 1, matched: 1 });
  });
  it.each(Object.keys(REFERENCE_MAPS))(
    "recognizes its documented partial reference: %s",
    (layout) => {
      const result = compareLabLayouts(REFERENCE_MAPS[layout]).find(
        (result) => result.layout === layout,
      )!;
      expect(result.checked).toBeGreaterThan(20);
      expect(result.mismatches).toEqual([]);
    },
  );
});
describe("explicit browser layout access", () => {
  it("does not call the browser API in an insecure context", async () => {
    const getLayoutMap = vi.fn();
    expect(
      await readBrowserLayout({ keyboard: { getLayoutMap } }, false),
    ).toMatchObject({ status: "insecure" });
    expect(getLayoutMap).not.toHaveBeenCalled();
  });
  it("falls back when the API or method is missing", async () => {
    expect(await readBrowserLayout({}, true)).toMatchObject({
      status: "unsupported",
    });
    expect(await readBrowserLayout({ keyboard: {} }, true)).toMatchObject({
      status: "unsupported",
    });
  });
  it("reads only a bounded map and discards unsafe or unidentified code entries", async () => {
    const getLayoutMap = vi.fn(
      async () =>
        new Map([
          ["KeyQ", "a"],
          ["Unidentified", "x"],
          ["__proto__", "pollute"],
          ["KeyW", "z"],
        ]),
    );
    expect(
      await readBrowserLayout({ keyboard: { getLayoutMap } }, true),
    ).toEqual({ status: "available", mapping: { KeyQ: "a", KeyW: "z" } });
    expect(getLayoutMap).toHaveBeenCalledTimes(1);
  });
  it.each(["SecurityError", "NotAllowedError"])(
    "provides a manual fallback after %s",
    async (name) => {
      expect(
        await readBrowserLayout(
          {
            keyboard: {
              getLayoutMap: async () => {
                throw { name };
              },
            },
          },
          true,
        ),
      ).toMatchObject({ status: "blocked" });
    },
  );
  it("handles unexpected browser errors without claiming a detected layout", async () => {
    expect(
      await readBrowserLayout(
        {
          keyboard: {
            getLayoutMap: async () => {
              throw new Error("device lost");
            },
          },
        },
        true,
      ),
    ).toMatchObject({ status: "failed" });
  });
  it("also catches a blocked keyboard capability getter", async () => {
    const navigatorValue = Object.defineProperty({}, "keyboard", {
      get() {
        throw { name: "SecurityError" };
      },
    });
    expect(await readBrowserLayout(navigatorValue, true)).toMatchObject({
      status: "blocked",
    });
  });
});
