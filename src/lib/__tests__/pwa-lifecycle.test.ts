import { afterEach, describe, expect, it, vi } from "vitest";

let stop: (() => void) | undefined;
afterEach(() => {
  stop?.();
  stop = undefined;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function fixture() {
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
      register: vi.fn(() => pending),
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
  const value = Object.assign(new EventTarget(), {
    installing: null as ServiceWorker | null,
    waiting: null,
    unregister: vi.fn(async () => true),
  });
  vi.stubGlobal("window", windowValue);
  vi.stubGlobal("navigator", navigatorValue);
  vi.stubGlobal("caches", cachesValue);
  const pwa = await import("../pwa");
  stop = pwa.startPwa(true);
  return {
    ...pwa,
    windowValue,
    navigatorValue,
    store,
    cachesValue,
    value,
    resolveRegistration: () => resolveRegistration(value as unknown as ServiceWorkerRegistration),
    rejectRegistration,
  };
}

describe("offline download lifecycle", () => {
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
