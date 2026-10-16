import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { beginCaretHandoff } from "./caret-handoff";

const source = { left: 10, top: 20, width: 3, height: 50 } as DOMRect;
class TestElement {
  className = "";
  style: Record<string, string> = { visibility: "" };
  isConnected = true;
  box = { left: 100, top: 150, width: 2, height: 28 };
  setAttribute = vi.fn();
  animate = vi.fn();
  remove = vi.fn(() => {
    this.isConnected = false;
  });
  getBoundingClientRect = () => this.box;
  getClientRects = () => (this.isConnected ? [this.box] : []);
}
class TestObserver {
  static instances: TestObserver[] = [];
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(readonly callback: () => void) {
    TestObserver.instances.push(this);
  }
  notify() {
    this.callback();
  }
}
let windowEvents: EventTarget;
let motion: EventTarget & { matches: boolean };
let nodes: TestElement[];
let target: TestElement | null;
let frames: Map<number, FrameRequestCallback>;
let frameId: number;
let finished: () => void;
let animation: { cancel: ReturnType<typeof vi.fn>; finished: Promise<void> };
function flushFrame() {
  const pending = [...frames];
  frames.clear();
  pending.forEach(([, callback]) => callback(performance.now()));
}
const mutations = () => TestObserver.instances[0];
const sizes = () => TestObserver.instances[1];
beforeEach(() => {
  vi.useFakeTimers();
  target = null;
  nodes = [];
  frames = new Map();
  frameId = 0;
  TestObserver.instances = [];
  windowEvents = new EventTarget();
  motion = Object.assign(new EventTarget(), { matches: false });
  animation = {
    cancel: vi.fn(),
    finished: new Promise<void>((resolve) => {
      finished = resolve;
    }),
  };
  vi.stubGlobal("window", windowEvents);
  vi.stubGlobal("matchMedia", () => motion);
  vi.stubGlobal("MutationObserver", TestObserver);
  vi.stubGlobal("ResizeObserver", TestObserver);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = ++frameId;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("getComputedStyle", (element: TestElement) => ({
    visibility: element.style.visibility || "visible",
  }));
  vi.stubGlobal("document", {
    body: { append: (element: TestElement) => nodes.push(element) },
    createElement: () => {
      const element = new TestElement();
      element.animate.mockReturnValue(animation);
      return element;
    },
    querySelector: () => target,
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("decorative caret readiness and ownership", () => {
  it("waits for a delayed measured caret and animates once without blocking practice", async () => {
    const controller = new AbortController();
    const handoff = beginCaretHandoff(source, controller)!;
    handoff.complete();
    handoff.complete();
    flushFrame();
    expect(nodes[0].animate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);
    target = new TestElement();
    mutations().notify();
    mutations().notify();
    expect(frames.size).toBe(1);
    flushFrame();
    expect(nodes[0].animate).toHaveBeenCalledOnce();
    expect(nodes[0].animate.mock.calls[0][1]).toMatchObject({ duration: 360 });
    expect(mutations().disconnect).toHaveBeenCalled();
    expect(sizes().disconnect).toHaveBeenCalled();
    expect(target.style.visibility).toBe("hidden");
    finished();
    await Promise.resolve();
    expect(target.style.visibility).toBe("");
    expect(nodes[0].remove).toHaveBeenCalledOnce();
    expect(controller.signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("observes a zero-size caret until layout provides a real destination", () => {
    target = new TestElement();
    target.box.width = target.box.height = 0;
    const handoff = beginCaretHandoff(source, new AbortController())!;
    handoff.complete();
    flushFrame();
    expect(sizes().observe).toHaveBeenCalledWith(target);
    expect(nodes[0].animate).not.toHaveBeenCalled();
    target.box.width = 2;
    target.box.height = 28;
    sizes().notify();
    flushFrame();
    expect(nodes[0].animate).toHaveBeenCalledOnce();
    handoff.dispose();
  });

  it("abandons an unavailable destination after 500 ms and cannot revive after disposal", () => {
    const handoff = beginCaretHandoff(source, new AbortController())!;
    handoff.complete();
    flushFrame();
    vi.advanceTimersByTime(500);
    target = new TestElement();
    mutations().notify();
    sizes().notify();
    handoff.complete();
    flushFrame();
    expect(nodes[0].animate).not.toHaveBeenCalled();
    expect(nodes[0].remove).toHaveBeenCalledOnce();
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  for (const event of ["keydown", "pointerdown", "resize", "scroll"]) {
    it(`cancels a pending destination on ${event} before a later mount`, () => {
      const handoff = beginCaretHandoff(source, new AbortController())!;
      handoff.complete();
      windowEvents.dispatchEvent(new Event(event));
      target = new TestElement();
      mutations().notify();
      flushFrame();
      expect(nodes[0].animate).not.toHaveBeenCalled();
      expect(nodes[0].remove).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    });
  }

  it("restores actual caret visibility when input cancels an active animation", () => {
    target = new TestElement();
    const handoff = beginCaretHandoff(source, new AbortController())!;
    handoff.complete();
    flushFrame();
    windowEvents.dispatchEvent(new Event("keydown"));
    expect(target.style.visibility).toBe("");
    expect(animation.cancel).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds an animation whose finished promise never settles", () => {
    target = new TestElement();
    const handoff = beginCaretHandoff(source, new AbortController())!;
    handoff.complete();
    flushFrame();
    vi.advanceTimersByTime(460);
    expect(target.style.visibility).toBe("");
    expect(nodes[0].remove).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("preserves actual caret visibility when animation creation fails", () => {
    target = new TestElement();
    const handoff = beginCaretHandoff(source, new AbortController())!;
    nodes[0].animate.mockImplementation(() => {
      throw new Error("Animation unavailable");
    });
    handoff.complete();
    flushFrame();
    expect(target.style.visibility).toBe("");
    expect(nodes[0].remove).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reduced-motion changes and aborts release pending observers and frames", () => {
    for (const reason of ["motion", "abort"]) {
      const controller = new AbortController();
      const handoff = beginCaretHandoff(source, controller)!;
      handoff.complete();
      if (reason === "motion") motion.dispatchEvent(new Event("change"));
      else controller.abort();
      expect(frames.size).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
      expect(controller.signal.aborted).toBe(true);
    }
  });

  it("invalid sources and existing reduced motion abort the caller without creating a node", () => {
    for (const dimensions of [
      { ...source, width: 0 },
      { ...source, height: NaN },
    ]) {
      const controller = new AbortController();
      expect(beginCaretHandoff(dimensions as DOMRect, controller)).toBeNull();
      expect(controller.signal.aborted).toBe(true);
    }
    motion.matches = true;
    const controller = new AbortController();
    expect(beginCaretHandoff(source, controller)).toBeNull();
    expect(controller.signal.aborted).toBe(true);
    expect(nodes).toHaveLength(0);
  });
});
