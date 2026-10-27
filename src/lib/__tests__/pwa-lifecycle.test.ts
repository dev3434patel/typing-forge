import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

let stop: (() => void) | undefined;
afterEach(() => {
  stop?.();
  stop = undefined;
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

class FixturePort {
  peer!: FixturePort;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  closed = false;
  close = vi.fn(() => { this.closed = true; });
  postMessage = vi.fn((data: unknown) => {
    queueMicrotask(() => {
      if (!this.closed && !this.peer.closed) this.peer.onmessage?.({ data });
    });
  });
}
async function fixture(bootstrap = false, throwsOnRegistration = false) {
  vi.resetModules();
  let resolveRegistration!: (value: ServiceWorkerRegistration) => void;
  let rejectRegistration!: (cause: Error) => void;
  const pending = new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    resolveRegistration = resolve;
    rejectRegistration = reject;
  });
  const windowValue = Object.assign(new EventTarget(), {
    isSecureContext: true,
    matchMedia: () => ({ matches: false }),
  });
  const navigatorValue = {
    onLine: true,
    serviceWorker: Object.assign(new EventTarget(), {
      controller: null,
      register: vi.fn(() => {
        if (throwsOnRegistration) throw new Error("native registration unavailable");
        return pending;
      }),
    }),
  };
  const store = new Map([
    ["sparowtype-public-v1-test", new Set(["/index.html", "/_offline-recovery.html"])],
    ["another-app", new Set(["/private"])],
  ]);
  const cachesValue = {
    keys: vi.fn(async () => [...store.keys()]),
    open: vi.fn(async (name: string) => ({
      match: async (path: string) =>
        store.get(name)?.has(path) ? new Response("public") : undefined,
    })),
    delete: vi.fn(async (name: string) => store.delete(name)),
  };
  const channels: { port1: FixturePort; port2: FixturePort }[] = [];
  class FixtureChannel {
    port1 = new FixturePort();
    port2 = new FixturePort();
    constructor() {
      this.port1.peer = this.port2;
      this.port2.peer = this.port1;
      channels.push(this);
    }
  }
  const worker = Object.assign(new EventTarget(), {
    state: "activated",
    postMessage: vi.fn((_message: unknown, ports: FixturePort[]) => {
      ports[0].postMessage({
        type: "SPAROWTYPE_PUBLIC_READINESS_V1",
        ready: [...store].some(([name, paths]) =>
          name.startsWith("sparowtype-public-v1-") &&
          paths.has("/index.html") && paths.has("/_offline-recovery.html"),
        ),
      });
    }),
  });
  const value = Object.assign(new EventTarget(), {
    installing: null as ServiceWorker | null,
    waiting: null,
    active: worker,
    unregister: vi.fn(async () => true),
    update: vi.fn(async () => undefined),
  });
  vi.stubGlobal("window", windowValue);
  vi.stubGlobal("navigator", navigatorValue);
  vi.stubGlobal("caches", cachesValue);
  vi.stubGlobal("MessageChannel", FixtureChannel);
  const pwa = await import("../pwa");
  stop = bootstrap ? pwa.startPwaDocumentLifetime(true) : pwa.startPwa(true);
  return {
    ...pwa,
    windowValue,
    navigatorValue,
    store,
    cachesValue,
    worker,
    channels,
    value,
    resolveRegistration: () => resolveRegistration(value as unknown as ServiceWorkerRegistration),
    rejectRegistration,
  };
}

describe("offline download lifecycle", () => {
  it("wires document startup before React creates the lazy application root", () => {
    const entry = readFileSync(new URL("../../main.tsx", import.meta.url), "utf8");
    const startup = entry.indexOf("startPwaDocumentLifetime();");
    expect(startup).toBeGreaterThan(0);
    expect(startup).toBeLessThan(entry.indexOf("createRoot(document."));
  });

  it("keeps bootstrap usable when native registration throws synchronously", async () => {
    const f = await fixture(true, true);
    expect(f.navigatorValue.serviceWorker.register).toHaveBeenCalledOnce();
    expect(f.getPwaState().phase).toBe("error");
    expect(f.channels).toHaveLength(0);
    expect(f.cachesValue.keys).not.toHaveBeenCalled();
    f.windowValue.dispatchEvent(new Event("pagehide"));
    f.windowValue.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: true }));
    expect(f.navigatorValue.serviceWorker.register).toHaveBeenCalledTimes(2);
    expect(f.getPwaState().phase).toBe("error");
  });

  it("confirms automatic readiness through the worker without opening document caches", async () => {
    const f = await fixture();
    f.resolveRegistration();
    await vi.waitFor(() => expect(f.getPwaState().phase).toBe("ready"));
    expect(f.worker.postMessage).toHaveBeenCalledExactlyOnceWith(
      { type: "SPAROWTYPE_PUBLIC_READINESS_V1" },
      [f.channels[0].port2],
    );
    expect(f.cachesValue.keys).not.toHaveBeenCalled();
    expect(f.cachesValue.open).not.toHaveBeenCalled();
    expect(f.channels[0].port1.close).toHaveBeenCalledOnce();
    expect(f.channels[0].port2.close).toHaveBeenCalledOnce();
  });

  it("keeps a negative worker response unconfirmed", async () => {
    const f = await fixture();
    f.store.delete("sparowtype-public-v1-test");
    f.resolveRegistration();
    await vi.waitFor(() => expect(f.worker.postMessage).toHaveBeenCalledOnce());
    await Promise.resolve();
    expect(f.getPwaState().phase).toBe("preparing");
    expect(f.channels[0].port1.closed).toBe(true);
    expect(f.channels[0].port2.closed).toBe(true);
  });

  it("bounds unknown old workers without falling back to document CacheStorage", async () => {
    vi.useFakeTimers();
    const f = await fixture();
    f.worker.postMessage.mockImplementation(() => undefined);
    f.resolveRegistration();
    await vi.advanceTimersByTimeAsync(2_999);
    expect(f.channels[0].port1.closed).toBe(false);
    expect(f.getPwaState().phase).toBe("preparing");
    await vi.advanceTimersByTimeAsync(1);
    expect(f.channels[0].port1.closed).toBe(true);
    expect(f.channels[0].port2.closed).toBe(true);
    expect(f.getPwaState().phase).toBe("preparing");
    expect(f.cachesValue.keys).not.toHaveBeenCalled();
    expect(f.cachesValue.open).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    { type: "OTHER_PROTOCOL", ready: true },
    { type: "SPAROWTYPE_PUBLIC_READINESS_V1", ready: "true" },
    null,
  ])("does not invent readiness from malformed response %j", async (response) => {
    vi.useFakeTimers();
    const f = await fixture();
    f.worker.postMessage.mockImplementation((_message, ports) => ports[0].postMessage(response));
    f.resolveRegistration();
    await vi.advanceTimersByTimeAsync(3_000);
    expect(f.getPwaState().phase).toBe("preparing");
    expect(f.channels[0].port1.closed).toBe(true);
    expect(f.channels[0].port2.closed).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["postMessage", "messageerror", "constructor"])("closes bounded readiness work on %s failure", async (failure) => {
    vi.useFakeTimers();
    const f = await fixture();
    f.worker.postMessage.mockImplementation(() => { if (failure === "postMessage") throw new Error("stopped worker"); });
    if (failure === "constructor") vi.stubGlobal("MessageChannel", class { constructor() { throw new Error("unavailable"); } });
    f.resolveRegistration();
    await vi.advanceTimersByTimeAsync(0);
    if (failure === "messageerror") f.channels[0].port1.onmessageerror?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(f.getPwaState().phase).toBe("preparing");
    for (const channel of f.channels) {
      expect(channel.port1.closed).toBe(true);
      expect(channel.port2.closed).toBe(true);
    }
    expect(vi.getTimerCount()).toBe(0);
    expect(f.cachesValue.keys).not.toHaveBeenCalled();
  });

  it("does not revive readiness observers when registration settles after pagehide", async () => {
    const f = await fixture(true);
    expect(f.navigatorValue.serviceWorker.register).toHaveBeenCalledOnce();
    f.windowValue.dispatchEvent(new Event("pagehide"));
    f.resolveRegistration();
    await Promise.resolve();
    await Promise.resolve();
    expect(f.worker.postMessage).not.toHaveBeenCalled();
    expect(f.cachesValue.keys).not.toHaveBeenCalled();
    f.value.dispatchEvent(new Event("updatefound"));
    expect(f.worker.postMessage).not.toHaveBeenCalled();
  });

  it("bootstrap owns synchronous registration while lazy component cleanup is a no-op", async () => {
    const f = await fixture(true);
    const componentCleanup = f.startPwa(true);
    componentCleanup();
    expect(f.navigatorValue.serviceWorker.register).toHaveBeenCalledOnce();
    f.resolveRegistration();
    await vi.waitFor(() => expect(f.getPwaState().phase).toBe("ready"));
    f.windowValue.dispatchEvent(new Event("beforeunload"));
    // A canceled departure has no sticky stop flag and needs no timed retry.
    f.navigatorValue.onLine = false;
    f.windowValue.dispatchEvent(new Event("offline"));
    expect(f.getPwaState().offline).toBe(true);
    expect(f.navigatorValue.serviceWorker.register).toHaveBeenCalledOnce();
  });

  it("restarts exactly once on persisted pageshow after pagehide and closes old channels", async () => {
    vi.useFakeTimers();
    const f = await fixture(true);
    f.worker.postMessage.mockImplementation(() => undefined);
    f.resolveRegistration();
    await vi.advanceTimersByTimeAsync(0);
    f.windowValue.dispatchEvent(new Event("pagehide"));
    f.windowValue.dispatchEvent(new Event("pagehide"));
    f.startPwa(true)();
    f.windowValue.dispatchEvent(Object.assign(new Event("pageshow"), { persisted: false }));
    expect(f.navigatorValue.serviceWorker.register).toHaveBeenCalledOnce();
    expect(f.channels[0].port1.closed).toBe(true);
    expect(f.channels[0].port2.closed).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    const show = Object.assign(new Event("pageshow"), { persisted: true });
    f.windowValue.dispatchEvent(show);
    f.windowValue.dispatchEvent(show);
    await vi.advanceTimersByTimeAsync(0);
    expect(f.navigatorValue.serviceWorker.register).toHaveBeenCalledTimes(2);
    expect(f.channels).toHaveLength(2);
    f.windowValue.dispatchEvent(new Event("pagehide"));
    expect(f.channels[1].port1.closed).toBe(true);
    expect(f.channels[1].port2.closed).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops the replacement generation after manual clear and reprepare", async () => {
    vi.useFakeTimers();
    vi.stubEnv("PROD", true);
    const f = await fixture(true);
    f.resolveRegistration();
    await vi.advanceTimersByTimeAsync(0);
    await f.clearPwaDownload();
    f.worker.postMessage.mockImplementation(() => undefined);
    await f.checkPwaDownload();
    await vi.advanceTimersByTimeAsync(0);
    expect(f.navigatorValue.serviceWorker.register).toHaveBeenCalledTimes(2);
    expect(f.channels.at(-1)!.port1.closed).toBe(false);
    f.windowValue.dispatchEvent(new Event("pagehide"));
    expect(f.channels.at(-1)!.port1.closed).toBe(true);
    expect(f.channels.at(-1)!.port2.closed).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    expect([...f.store.keys()]).toEqual(["another-app"]);
  });

  it("ignores late replies after current-generation cancellation", async () => {
    const f = await fixture();
    f.worker.postMessage.mockImplementation(() => undefined);
    f.resolveRegistration();
    await vi.waitFor(() => expect(f.channels).toHaveLength(1));
    const late = f.channels[0].port1.onmessage!;
    f.stopCurrentPwa();
    const state = f.getPwaState();
    late({ data: { type: "SPAROWTYPE_PUBLIC_READINESS_V1", ready: true } });
    await Promise.resolve();
    expect(f.getPwaState()).toBe(state);
    expect(f.channels[0].port1.close).toHaveBeenCalledOnce();
    expect(f.channels[0].port2.close).toHaveBeenCalledOnce();
  });

  it("does not regress a newer ready result when an older probe replies false later", async () => {
    const f = await fixture();
    f.worker.postMessage.mockImplementation(() => undefined);
    f.resolveRegistration();
    await vi.waitFor(() => expect(f.channels).toHaveLength(1));
    const oldReply = f.channels[0].port1.onmessage!;
    f.value.installing = f.worker as unknown as ServiceWorker;
    f.value.dispatchEvent(new Event("updatefound"));
    expect(f.channels).toHaveLength(2);
    expect(f.channels[0].port1.closed).toBe(true);
    expect(f.channels[0].port2.closed).toBe(true);
    f.channels[1].port1.onmessage!({ data: { type: "SPAROWTYPE_PUBLIC_READINESS_V1", ready: true } });
    await Promise.resolve();
    expect(f.getPwaState().phase).toBe("ready");
    const latest = f.getPwaState();
    oldReply({ data: { type: "SPAROWTYPE_PUBLIC_READINESS_V1", ready: false } });
    await Promise.resolve();
    expect(f.getPwaState()).toBe(latest);
  });

  it("manual checking supersedes an automatic probe without allowing its late ready reply", async () => {
    const f = await fixture();
    f.worker.postMessage.mockImplementationOnce(() => undefined);
    f.resolveRegistration();
    await vi.waitFor(() => expect(f.channels).toHaveLength(1));
    const oldReply = f.channels[0].port1.onmessage!;
    let finishUpdate!: () => void;
    f.value.update.mockImplementation(() => new Promise<void>(resolve => { finishUpdate = resolve; }));
    f.store.delete("sparowtype-public-v1-test");
    const checking = f.checkPwaDownload();
    expect(f.channels[0].port1.closed).toBe(true);
    oldReply({ data: { type: "SPAROWTYPE_PUBLIC_READINESS_V1", ready: true } });
    await Promise.resolve();
    expect(f.getPwaState().phase).toBe("preparing");
    finishUpdate();
    await checking;
    expect(f.getPwaState().phase).toBe("preparing");
    expect(f.getPwaState().message).toContain("still being prepared");
  });

  it("a newer automatic result owns status when a manual worker probe settles later", async () => {
    const f = await fixture();
    f.resolveRegistration();
    await vi.waitFor(() => expect(f.getPwaState().phase).toBe("ready"));
    f.worker.postMessage.mockImplementationOnce(() => undefined);
    const checking = f.checkPwaDownload();
    await vi.waitFor(() => expect(f.channels).toHaveLength(2));
    const manualReply = f.channels[1].port1.onmessage!;
    f.value.installing = f.worker as unknown as ServiceWorker;
    f.value.dispatchEvent(new Event("updatefound"));
    await vi.waitFor(() => expect(f.worker.postMessage).toHaveBeenCalledTimes(3));
    await Promise.resolve();
    const latest = f.getPwaState();
    expect(latest.phase).toBe("ready");
    manualReply({ data: { type: "SPAROWTYPE_PUBLIC_READINESS_V1", ready: false } });
    await checking;
    expect(f.getPwaState()).toBe(latest);
    expect(f.cachesValue.keys).not.toHaveBeenCalled();
  });

  it("does not begin a manual cache read after its update completes in a stopped document", async () => {
    const f = await fixture(true);
    f.resolveRegistration();
    await vi.waitFor(() => expect(f.getPwaState().phase).toBe("ready"));
    let finishUpdate!: () => void;
    f.value.update.mockImplementation(() => new Promise<void>(resolve => { finishUpdate = resolve; }));
    const checking = f.checkPwaDownload();
    f.windowValue.dispatchEvent(new Event("pagehide"));
    finishUpdate();
    await checking;
    expect(f.cachesValue.keys).not.toHaveBeenCalled();
    expect(f.channels).toHaveLength(1);
  });

  it("does not enter native update or readiness APIs when manual checking starts after pagehide", async () => {
    const f = await fixture(true);
    f.resolveRegistration();
    await vi.waitFor(() => expect(f.getPwaState().phase).toBe("ready"));
    f.windowValue.dispatchEvent(new Event("pagehide"));
    await f.checkPwaDownload();
    expect(f.value.update).not.toHaveBeenCalled();
    expect(f.worker.postMessage).toHaveBeenCalledOnce();
    expect(f.channels).toHaveLength(1);
    expect(f.cachesValue.keys).not.toHaveBeenCalled();
  });

  it("keeps automatic readiness unconfirmed when MessageChannel is unavailable", async () => {
    const f = await fixture();
    vi.stubGlobal("MessageChannel", undefined);
    f.resolveRegistration();
    await Promise.resolve();
    await Promise.resolve();
    expect(f.getPwaState().phase).toBe("preparing");
    expect(f.channels).toHaveLength(0);
    expect(f.cachesValue.keys).not.toHaveBeenCalled();
  });

  it("selects waiting/active/installing workers without losing current public readiness", async () => {
    const f = await fixture();
    const waiting = Object.assign(new EventTarget(), { postMessage: f.worker.postMessage });
    f.value.waiting = waiting;
    f.value.active = null;
    f.resolveRegistration();
    await vi.waitFor(() => expect(f.getPwaState().phase).toBe("ready"));
    expect(waiting.postMessage).toHaveBeenCalledOnce();
    f.value.waiting = null;
    f.value.installing = f.worker as unknown as ServiceWorker;
    f.value.dispatchEvent(new Event("updatefound"));
    await vi.waitFor(() => expect(f.worker.postMessage).toHaveBeenCalledTimes(2));
    expect(f.cachesValue.keys).not.toHaveBeenCalled();
  });

  it("waits for a pending registration, unregisters it, and then removes only public files", async () => {
    const f = await fixture();
    let finished = false;
    const removing = f.clearPwaDownload().then(() => { finished = true; });
    await Promise.resolve();
    expect(finished).toBe(false);
    expect(f.cachesValue.delete).not.toHaveBeenCalled();
    f.resolveRegistration();
    await removing;
    expect(f.value.unregister).toHaveBeenCalledOnce();
    expect([...f.store.keys()]).toEqual(["another-app"]);
    expect(f.getPwaState().phase).toBe("idle");
    // Removing files must not stop connection feedback in the current tab.
    f.navigatorValue.onLine = false;
    f.windowValue.dispatchEvent(new Event("offline"));
    expect(f.getPwaState().offline).toBe(true);
  });

  it("waits for an active installer to finish writing before reporting removal", async () => {
    const f = await fixture();
    const worker = Object.assign(new EventTarget(), { state: "installing" });
    f.value.installing = worker as unknown as ServiceWorker;
    f.resolveRegistration();
    await vi.waitFor(() => expect(f.getPwaState().phase).toBe("ready"));
    const removing = f.clearPwaDownload();
    await vi.waitFor(() => expect(f.value.unregister).toHaveBeenCalledOnce());
    expect(f.cachesValue.delete).not.toHaveBeenCalled();
    // cache.addAll can complete after unregister has resolved.
    f.store.set("sparowtype-public-v1-new", new Set(["/index.html"]));
    worker.state = "installed";
    worker.dispatchEvent(new Event("statechange"));
    await removing;
    expect([...f.store.keys()]).toEqual(["another-app"]);
    expect(f.getPwaState().phase).toBe("idle");
  });

  it("does not claim removal when an installer fails to settle", async () => {
    vi.useFakeTimers();
    const f = await fixture();
    const worker = Object.assign(new EventTarget(), { state: "installing" });
    f.value.installing = worker as unknown as ServiceWorker;
    f.resolveRegistration();
    await Promise.resolve();
    const removing = f.clearPwaDownload();
    await vi.advanceTimersByTimeAsync(10_000);
    await removing;
    expect(f.getPwaState().phase).toBe("error");
    expect(f.cachesValue.delete).not.toHaveBeenCalled();
    expect(f.getPwaState().message).toContain("could not be removed");
    // The unregistered installer is still owned by removal until it settles.
    worker.state = "installed";
    worker.dispatchEvent(new Event("statechange"));
    await f.clearPwaDownload();
    expect(f.value.unregister).toHaveBeenCalledTimes(2);
    expect([...f.store.keys()]).toEqual(["another-app"]);
    expect(f.getPwaState().phase).toBe("idle");
  });

  it("bounds a stuck registration and can remove its late result on retry", async () => {
    vi.useFakeTimers();
    const f = await fixture();
    const removing = f.clearPwaDownload();
    await vi.advanceTimersByTimeAsync(10_000);
    await removing;
    expect(f.getPwaState().phase).toBe("error");
    expect(f.getPwaState().message).toContain("Retry removal");
    expect(f.value.unregister).not.toHaveBeenCalled();
    expect(f.cachesValue.delete).not.toHaveBeenCalled();
    f.resolveRegistration();
    await vi.advanceTimersByTimeAsync(0);
    expect(f.getPwaState().phase).toBe("error");
    await f.clearPwaDownload();
    expect(f.value.unregister).toHaveBeenCalledOnce();
    expect([...f.store.keys()]).toEqual(["another-app"]);
    expect(f.getPwaState().phase).toBe("idle");
  });

  it("can clear old public files even if the pending registration fails", async () => {
    const f = await fixture();
    const removing = f.clearPwaDownload();
    f.rejectRegistration(new Error("offline"));
    await removing;
    expect(f.value.unregister).not.toHaveBeenCalled();
    expect([...f.store.keys()]).toEqual(["another-app"]);
    expect(f.getPwaState().phase).toBe("idle");
  });
});
