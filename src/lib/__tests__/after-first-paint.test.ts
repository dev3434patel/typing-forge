import { describe, expect, it, vi } from "vitest";
import { scheduleAfterFirstPaint } from "../after-first-paint";

function environment() {
  const timers = new Map<number, { callback: () => void; delay: number }>();
  const idle = new Map<number, { callback: () => void; timeout: number }>();
  let sequence = 0;
  let publish: (entries: Array<{ name: string }>) => void = () => {};
  const observer = { observe: vi.fn(), disconnect: vi.fn() };
  const host = {
    paintEntries: vi.fn(() => [] as Array<{ name: string }>),
    observerTypes: ["paint"],
    createObserver: vi.fn((callback: typeof publish) => {
      publish = callback;
      return observer;
    }),
    setTimeout: vi.fn((callback: () => void, delay: number) => {
      const id = ++sequence;
      timers.set(id, { callback, delay });
      return id;
    }),
    clearTimeout: vi.fn((id: number) => {
      timers.delete(id);
    }),
    requestIdle: vi.fn((callback: () => void, timeout: number) => {
      const id = ++sequence;
      idle.set(id, { callback, timeout });
      return id;
    }),
    cancelIdle: vi.fn((id: number) => {
      idle.delete(id);
    }),
  };
  return {
    host,
    timers,
    idle,
    observer,
    paint: () => publish([{ name: "first-contentful-paint" }]),
    publish: (name: string) => publish([{ name }]),
  };
}

describe("workspace preparation after useful paint", () => {
  it("waits for actual contentful paint, then uses an idle deadline of 400 ms exactly once", () => {
    const env = environment(),
      prepare = vi.fn();
    const dispose = scheduleAfterFirstPaint(prepare, env.host);
    env.publish("first-paint");
    expect(env.idle.size).toBe(0);
    env.paint();
    env.paint();
    expect(env.observer.disconnect).toHaveBeenCalled();
    expect(env.timers.size).toBe(0);
    expect(env.idle.size).toBe(1);
    const task = [...env.idle.values()][0];
    expect(task.timeout).toBe(400);
    task.callback();
    expect(prepare).toHaveBeenCalledOnce();
    dispose();
  });

  it("recognizes a buffered contentful paint before subscribing", () => {
    const env = environment();
    env.host.paintEntries.mockReturnValue([{ name: "first-contentful-paint" }]);
    scheduleAfterFirstPaint(vi.fn(), env.host);
    expect(env.host.createObserver).not.toHaveBeenCalled();
    expect(env.idle.size).toBe(1);
  });

  for (const missing of [
    "constructor",
    "supportedEntryTypes",
    "paint entry type",
  ] as const) {
    it(`retains the one-second fallback without ${missing}`, () => {
      const env = environment();
      const host = {
        ...env.host,
        ...(missing === "constructor"
          ? { createObserver: undefined }
          : {
              observerTypes:
                missing === "supportedEntryTypes" ? undefined : ["mark"],
            }),
      };
      scheduleAfterFirstPaint(vi.fn(), host);
      expect(env.host.createObserver).not.toHaveBeenCalled();
      const fallback = [...env.timers.values()][0];
      expect(fallback.delay).toBe(1000);
      fallback.callback();
      expect(env.idle.size).toBe(1);
    });
  }

  it("disconnects a failing paint observer and keeps the original fallback", () => {
    const env = environment();
    env.observer.observe.mockImplementation(() => {
      throw new Error("Unsupported buffered observation");
    });
    expect(() => scheduleAfterFirstPaint(vi.fn(), env.host)).not.toThrow();
    expect(env.observer.disconnect).toHaveBeenCalledOnce();
    expect([...env.timers.values()].map((task) => task.delay)).toEqual([1000]);
    [...env.timers.values()][0].callback();
    expect(env.idle.size).toBe(1);
  });

  it("cancels an idle job by the same API that scheduled it", () => {
    const env = environment();
    const dispose = scheduleAfterFirstPaint(vi.fn(), env.host);
    env.paint();
    const id = [...env.idle.keys()][0];
    dispose();
    expect(env.host.cancelIdle).toHaveBeenCalledWith(id);
    expect(env.idle.size).toBe(0);
  });

  it("uses and clears a normal timer when the idle API is partial", () => {
    const env = environment();
    const dispose = scheduleAfterFirstPaint(vi.fn(), {
      ...env.host,
      cancelIdle: undefined,
    });
    env.paint();
    expect(env.host.requestIdle).not.toHaveBeenCalled();
    const [id, task] = [...env.timers][0];
    expect(task.delay).toBe(0);
    dispose();
    expect(env.host.clearTimeout).toHaveBeenCalledWith(id);
    expect(env.timers.size).toBe(0);
  });

  it("falls back to a normal task if requesting idle work throws", () => {
    const env = environment();
    env.host.requestIdle.mockImplementation(() => {
      throw new Error("Disabled idle API");
    });
    scheduleAfterFirstPaint(vi.fn(), env.host);
    expect(() => env.paint()).not.toThrow();
    expect([...env.timers.values()].map((task) => task.delay)).toEqual([0]);
  });

  it("does not prepare after disposal even if a cancelled callback is delivered late", () => {
    const env = environment(),
      prepare = vi.fn();
    const dispose = scheduleAfterFirstPaint(prepare, env.host);
    const lateFallback = [...env.timers.values()][0].callback;
    env.paint();
    const lateIdle = [...env.idle.values()][0].callback;
    dispose();
    lateFallback();
    lateIdle();
    env.paint();
    expect(prepare).not.toHaveBeenCalled();
    expect(env.timers.size).toBe(0);
    expect(env.idle.size).toBe(0);
  });
});
