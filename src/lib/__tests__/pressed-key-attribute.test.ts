import { describe, expect, it, vi } from "vitest";
import { PressedKeyStore } from "../pressed-key-store";
import { bindPressedKeyAttribute, syncPressedKeyAttribute } from "../pressed-key-attribute";

function keyNode(initial: Record<string, string> = {}) {
  const attributes = new Map(Object.entries(initial));
  const writes: Array<[string, string, string?]> = [];
  return {
    attributes,
    writes,
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => {
      writes.push(["set", name, value]);
      attributes.set(name, value);
    },
    removeAttribute: (name: string) => {
      writes.push(["remove", name]);
      attributes.delete(name);
    },
  };
}

describe("immediate physical key attribute ownership", () => {
  it("publishes every press and release synchronously without scheduling or coalescing", () => {
    const node = keyNode(), store = new PressedKeyStore();
    const stop = bindPressedKeyAttribute(node, store, "KeyA");
    store.replace(["KeyA"]);
    expect(node.getAttribute("data-pressed-key")).toBe("true");
    store.clear();
    expect(node.getAttribute("data-pressed-key")).toBeNull();
    store.replace(["KeyA"]);
    expect(node.getAttribute("data-pressed-key")).toBe("true");
    expect(node.writes).toEqual([
      ["set", "data-pressed-key", "true"],
      ["remove", "data-pressed-key"],
      ["set", "data-pressed-key", "true"],
    ]);
    stop();
  });

  it("preserves held chords and ignores unchanged keys, repeated events and order changes", () => {
    const a = keyNode(), b = keyNode(), store = new PressedKeyStore();
    const stopA = bindPressedKeyAttribute(a, store, "KeyA");
    const stopB = bindPressedKeyAttribute(b, store, "KeyB");
    store.replace(["KeyA", "KeyB"]);
    store.replace(["KeyB", "KeyA", "KeyA"]);
    expect(a.writes).toHaveLength(1);
    expect(b.writes).toHaveLength(1);
    store.replace(["KeyB"]);
    expect(a.getAttribute("data-pressed-key")).toBeNull();
    expect(b.getAttribute("data-pressed-key")).toBe("true");
    store.clear();
    expect(b.getAttribute("data-pressed-key")).toBeNull();
    stopA(); stopB();
  });

  it("samples an already held key on mount and clears stale markup for a released key", () => {
    const held = keyNode(), released = keyNode({ "data-pressed-key": "true" });
    const store = new PressedKeyStore(["KeyA"]);
    const stopA = bindPressedKeyAttribute(held, store, "KeyA");
    const stopB = bindPressedKeyAttribute(released, store, "KeyB");
    expect(held.getAttribute("data-pressed-key")).toBe("true");
    expect(released.getAttribute("data-pressed-key")).toBeNull();
    stopA(); stopB();
  });

  it("samples after subscribing so a mutation during subscription cannot be lost", () => {
    const node = keyNode(), store = new PressedKeyStore();
    const subscribe = store.subscribe.bind(store);
    vi.spyOn(store, "subscribe").mockImplementation((code, listener) => {
      store.replace([code]);
      return subscribe(code, listener);
    });
    const stop = bindPressedKeyAttribute(node, store, "KeyA");
    expect(node.getAttribute("data-pressed-key")).toBe("true");
    stop();
  });

  it("repairs a stale React commit without touching expected, actual, error or semantic attributes", () => {
    const node = keyNode({ "data-expected-key": "true", "data-incorrect-key": "true", "data-last-input": "true", "data-toggled": "true" });
    const store = new PressedKeyStore(["KeyA"]);
    const stop = bindPressedKeyAttribute(node, store, "KeyA");
    node.removeAttribute("data-pressed-key");
    syncPressedKeyAttribute(node, store.getSnapshot("KeyA"));
    expect(node.getAttribute("data-pressed-key")).toBe("true");
    store.clear();
    node.setAttribute("data-pressed-key", "true");
    syncPressedKeyAttribute(node, store.getSnapshot("KeyA"));
    expect(node.getAttribute("data-pressed-key")).toBeNull();
    expect(Object.fromEntries(node.attributes)).toEqual({ "data-expected-key": "true", "data-incorrect-key": "true", "data-last-input": "true", "data-toggled": "true" });
    stop();
  });

  it("performs no duplicate DOM writes when render repair agrees with physical feedback", () => {
    const node = keyNode();
    syncPressedKeyAttribute(node, false);
    syncPressedKeyAttribute(node, true);
    syncPressedKeyAttribute(node, true);
    syncPressedKeyAttribute(node, false);
    syncPressedKeyAttribute(node, false);
    expect(node.writes).toEqual([["set", "data-pressed-key", "true"], ["remove", "data-pressed-key"]]);
  });

  it("unsubscribes idempotently and ignores a callback already copied before cleanup", () => {
    const node = keyNode(), store = new PressedKeyStore();
    const subscribe = store.subscribe.bind(store);
    let queued: (() => void) | undefined;
    vi.spyOn(store, "subscribe").mockImplementation((code, listener) => {
      queued = listener;
      return subscribe(code, listener);
    });
    const stop = bindPressedKeyAttribute(node, store, "KeyA");
    stop(); stop();
    store.replace(["KeyA"]);
    queued!();
    expect(node.writes).toEqual([]);
  });

  it("reassigns a node to a new code and store without letting the old subscription overwrite it", () => {
    const node = keyNode(), first = new PressedKeyStore(["KeyA"]), second = new PressedKeyStore();
    const stopFirst = bindPressedKeyAttribute(node, first, "KeyA");
    expect(node.getAttribute("data-pressed-key")).toBe("true");
    stopFirst();
    const stopSecond = bindPressedKeyAttribute(node, second, "KeyB");
    expect(node.getAttribute("data-pressed-key")).toBeNull();
    first.clear(); first.replace(["KeyA"]);
    expect(node.getAttribute("data-pressed-key")).toBeNull();
    second.replace(["KeyB"]);
    expect(node.getAttribute("data-pressed-key")).toBe("true");
    first.clear();
    expect(node.getAttribute("data-pressed-key")).toBe("true");
    stopSecond();
  });

  it("releases a held attribute when its store is removed and the static key is unpressed", () => {
    const node = keyNode({ "data-expected-key": "true" });
    const store = new PressedKeyStore(["KeyA"]);
    const subscribe = store.subscribe.bind(store);
    let queued: (() => void) | undefined;
    vi.spyOn(store, "subscribe").mockImplementation((code, listener) => {
      queued = listener;
      return subscribe(code, listener);
    });
    const stop = bindPressedKeyAttribute(node, store, "KeyA");
    expect(node.getAttribute("data-pressed-key")).toBe("true");
    stop();
    expect(node.getAttribute("data-pressed-key")).toBeNull();
    syncPressedKeyAttribute(node, false);
    store.clear(); store.replace(["KeyA"]); queued!();
    expect(Object.fromEntries(node.attributes)).toEqual({ "data-expected-key": "true" });
  });

  it("hands a held key to static true and false states without an old store reclaiming ownership", () => {
    const node = keyNode(), store = new PressedKeyStore(["KeyA"]);
    const stop = bindPressedKeyAttribute(node, store, "KeyA");
    stop();
    syncPressedKeyAttribute(node, true);
    store.clear(); store.replace(["KeyA"]); stop();
    expect(node.getAttribute("data-pressed-key")).toBe("true");
    syncPressedKeyAttribute(node, false);
    store.clear();
    expect(node.getAttribute("data-pressed-key")).toBeNull();
  });
});
