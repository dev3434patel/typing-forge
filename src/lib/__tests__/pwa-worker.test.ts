import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const template = readFileSync(
  new URL("../../../public/sw.js", import.meta.url),
  "utf8",
);
const origin = "https://example.test";
const current = "sparowtype-public-v1-test-version";
function worker(prepare = true, online?: boolean, base = "/", frontendOnly = false) {
  const listeners = new Map<string, (event: Record<string, unknown>) => void>();
  const store = new Map<string, Map<string, Response>>();
  const installations: Request[][] = [];
  const fetchNetwork = vi.fn(async () => new Response("network"));
  const skipWaiting = vi.fn(async () => undefined);
  const claim = vi.fn(async () => undefined);
  const cacheStorage = {
    keys: async () => [...store.keys()],
    match: async (path: string, options: { cacheName: string }) =>
      store.get(options.cacheName)?.get(path)?.clone(),
    delete: vi.fn(async (name: string) => store.delete(name)),
    open: async (name: string) => {
      if (!store.has(name)) store.set(name, new Map());
      const entries = store.get(name)!;
      return {
        match: async (path: string) => entries.get(path)?.clone(),
        addAll: async (requests: Request[]) => {
          installations.push(requests);
          for (const request of requests)
            entries.set(
              new URL(request.url).pathname,
              new Response(
                new URL(request.url).pathname === base + "index.html"
                  ? "public-shell"
                  : new URL(request.url).pathname === base + "_offline-recovery.html"
                    ? "public-offline"
                    : "asset",
              ),
            );
        },
      };
    },
  };
  class RelativeRequest extends Request {
    constructor(input: string, init?: RequestInit) {
      super(new URL(input, origin), init);
    }
  }
  const source = prepare
    ? template
        .replace("__SPAROWTYPE_BUILD__", "test-version")
        .replace(
          "/*__SPAROWTYPE_PRECACHE__*/ []",
          JSON.stringify([
            base + "index.html",
            base + "_offline-recovery.html",
            base + "assets/main-hash.js",
          ]),
        )
        .replace('/*__SPAROWTYPE_BASE__*/ "/"', JSON.stringify(base))
        .replace('/*__SPAROWTYPE_STATIC__*/ false', JSON.stringify(frontendOnly))
    : template;
  runInNewContext(source, {
    self: {
      location: { origin },
      navigator: { onLine: online },
      addEventListener: (
        type: string,
        listener: (event: Record<string, unknown>) => void,
      ) => listeners.set(type, listener),
      clients: { claim },
      skipWaiting,
    },
    caches: cacheStorage,
    fetch: fetchNetwork,
    URL,
    Request: RelativeRequest,
    Response,
  });
  const lifecycle = async (name: string, data?: unknown) => {
    const pending: Promise<unknown>[] = [];
    listeners.get(name)!({
      data,
      waitUntil: (promise: Promise<unknown>) => pending.push(promise),
    });
    await Promise.all(pending);
  };
  const message = (data: unknown, port?: { postMessage: (data: unknown) => void; close: () => void }) => {
    const pending: Promise<unknown>[] = [];
    listeners.get("message")!({
      data,
      ports: port ? [port] : [],
      waitUntil: (promise: Promise<unknown>) => pending.push(promise),
    });
    return pending;
  };
  function request(
    path: string,
    mode = "cors",
    method = "GET",
    headers = new Headers(),
  ) {
    let response: Promise<Response> | undefined;
    listeners.get("fetch")!({
      request: { url: new URL(path, origin).href, method, mode, headers },
      respondWith: (promise: Promise<Response>) => {
        response = promise;
      },
    });
    return response;
  }
  return {
    store,
    installations,
    fetchNetwork,
    skipWaiting,
    claim,
    cacheStorage,
    lifecycle,
    message,
    request,
  };
}
describe("actual service worker public-cache boundary", () => {
  it.each(["/", "/project/"])("answers only a fixed public-readiness boolean under waitUntil within %s", async (base) => {
    const instance = worker(true, true, base);
    await instance.lifecycle("install");
    const before = [...instance.store].map(([name, entries]) => [name, [...entries.keys()]]);
    const open = vi.spyOn(instance.cacheStorage, "open");
    const port = { postMessage: vi.fn(), close: vi.fn() };
    const pending = instance.message({ type: "SPAROWTYPE_PUBLIC_READINESS_V1", cache: "private", path: "/private" }, port);
    expect(pending).toHaveLength(1);
    await Promise.all(pending);
    expect(port.postMessage).toHaveBeenCalledExactlyOnceWith({ type: "SPAROWTYPE_PUBLIC_READINESS_V1", ready: true });
    expect(port.close).toHaveBeenCalledOnce();
    expect([...instance.store].map(([name, entries]) => [name, [...entries.keys()]])).toEqual(before);
    expect(instance.fetchNetwork).not.toHaveBeenCalled();
    expect(instance.cacheStorage.delete).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(instance.installations).toHaveLength(1);
  });

  it.each(["/", "/project/"])("requires both public documents in the same owned cache within %s", async (base) => {
    const instance = worker(true, true, base);
    const prefix = base === "/" ? "sparowtype-public-v1-" : `sparowtype-public-subpath-${encodeURIComponent(base)}-`;
    instance.store.set(prefix + "one", new Map([[base + "index.html", new Response("public")]]));
    instance.store.set(prefix + "two", new Map([[base + "_offline-recovery.html", new Response("public")]]));
    const port = { postMessage: vi.fn(), close: vi.fn() };
    await Promise.all(instance.message({ type: "SPAROWTYPE_PUBLIC_READINESS_V1" }, port));
    expect(port.postMessage).toHaveBeenCalledExactlyOnceWith({ type: "SPAROWTYPE_PUBLIC_READINESS_V1", ready: false });
    expect(port.close).toHaveBeenCalledOnce();
    expect([...instance.store.keys()]).toEqual([prefix + "one", prefix + "two"]);
    expect(instance.fetchNetwork).not.toHaveBeenCalled();
  });

  it.each(["/", "/project/"])("does not inspect foreign caches or create a cache when none is owned within %s", async (base) => {
    const instance = worker(true, true, base);
    instance.store.set("another-app-private", new Map([[base + "index.html", new Response("private")], [base + "_offline-recovery.html", new Response("private")]]));
    const open = vi.spyOn(instance.cacheStorage, "open");
    const port = { postMessage: vi.fn(), close: vi.fn() };
    await Promise.all(instance.message({ type: "SPAROWTYPE_PUBLIC_READINESS_V1" }, port));
    expect(port.postMessage).toHaveBeenCalledExactlyOnceWith({ type: "SPAROWTYPE_PUBLIC_READINESS_V1", ready: false });
    expect(open).not.toHaveBeenCalled();
    expect(instance.fetchNetwork).not.toHaveBeenCalled();
    expect([...instance.store.keys()]).toEqual(["another-app-private"]);
  });

  it.each(["/", "/project/"])("can confirm a retained complete public build without combining caches within %s", async (base) => {
    const instance = worker(true, true, base);
    await instance.lifecycle("install");
    const [name, entries] = [...instance.store][0];
    instance.store.clear();
    instance.store.set(name + "incomplete", new Map([[base + "index.html", new Response("public")]]));
    instance.store.set(name + "retained", entries);
    const port = { postMessage: vi.fn(), close: vi.fn() };
    await Promise.all(instance.message({ type: "SPAROWTYPE_PUBLIC_READINESS_V1" }, port));
    expect(port.postMessage).toHaveBeenCalledExactlyOnceWith({ type: "SPAROWTYPE_PUBLIC_READINESS_V1", ready: true });
    expect(port.close).toHaveBeenCalledOnce();
  });

  it.each(["/", "/project/"].flatMap(base => ["keys", "index-match", "recovery-match"].map(operation => ({ base, operation }))))("does not confirm readiness when worker storage $operation rejects within $base", async ({ base, operation }) => {
    const instance = worker(true, true, base);
    await instance.lifecycle("install");
    const name = [...instance.store.keys()][0];
    const before = [...instance.store.get(name)!.keys()];
    if (operation === "keys") vi.spyOn(instance.cacheStorage, "keys").mockRejectedValueOnce(new Error("storage unavailable"));
    else if (operation === "index-match") vi.spyOn(instance.cacheStorage, "match").mockRejectedValueOnce(new Error("storage unavailable"));
    else vi.spyOn(instance.cacheStorage, "match").mockResolvedValueOnce(new Response("public shell")).mockRejectedValueOnce(new Error("storage unavailable"));
    const port = { postMessage: vi.fn(), close: vi.fn() };
    await Promise.all(instance.message({ type: "SPAROWTYPE_PUBLIC_READINESS_V1" }, port));
    expect(port.postMessage).toHaveBeenCalledExactlyOnceWith({ type: "SPAROWTYPE_PUBLIC_READINESS_V1", ready: false });
    expect(port.close).toHaveBeenCalledOnce();
    expect([...instance.store.get(name)!.keys()]).toEqual(before);
    expect(instance.fetchNetwork).not.toHaveBeenCalled();
    expect(instance.cacheStorage.delete).not.toHaveBeenCalled();
  });

  it.each(["/", "/project/"])("does not recreate an owned cache removed between enumeration and readiness reads within %s", async (base) => {
    const instance = worker(true, true, base);
    await instance.lifecycle("install");
    vi.spyOn(instance.cacheStorage, "keys").mockImplementation(async () => {
      const names = [...instance.store.keys()];
      instance.store.clear();
      return names;
    });
    const open = vi.spyOn(instance.cacheStorage, "open");
    const port = { postMessage: vi.fn(), close: vi.fn() };
    await Promise.all(instance.message({ type: "SPAROWTYPE_PUBLIC_READINESS_V1" }, port));
    expect(port.postMessage).toHaveBeenCalledExactlyOnceWith({ type: "SPAROWTYPE_PUBLIC_READINESS_V1", ready: false });
    expect(open).not.toHaveBeenCalled();
    expect(instance.store.size).toBe(0);
    expect(port.close).toHaveBeenCalledOnce();
  });

  it("keeps unknown messages and missing reply ports outside the readiness protocol", async () => {
    const instance = worker();
    const keys = vi.spyOn(instance.cacheStorage, "keys");
    const port = { postMessage: vi.fn(), close: vi.fn() };
    expect(instance.message({ type: "OTHER_PROTOCOL" }, port)).toEqual([]);
    expect(instance.message({ type: "SPAROWTYPE_PUBLIC_READINESS_V1" })).toEqual([]);
    expect(keys).not.toHaveBeenCalled();
    expect(port.postMessage).not.toHaveBeenCalled();
    expect(port.close).not.toHaveBeenCalled();
  });

  it("closes a disconnected reply endpoint without rejecting the worker event", async () => {
    const instance = worker();
    const port = { postMessage: vi.fn(() => { throw new Error("client departed"); }), close: vi.fn() };
    await Promise.all(instance.message({ type: "SPAROWTYPE_PUBLIC_READINESS_V1" }, port));
    expect(port.postMessage).toHaveBeenCalledOnce();
    expect(port.close).toHaveBeenCalledOnce();
    expect(instance.fetchNetwork).not.toHaveBeenCalled();
  });

  it.each(["/", "/project/"])("opens installed public pages without waiting for a stalled network within %s", async (base) => {
    const instance = worker(true, true, base);
    await instance.lifecycle("install");
    instance.fetchNetwork.mockImplementation(() => new Promise<Response>(() => undefined));
    expect(await (await instance.request(`${base}lessons?lesson=home-anchors`, "navigate"))!.text()).toBe("public-shell");
    expect(instance.fetchNetwork).not.toHaveBeenCalled();
  });

  it.each(["/", "/project/"])("opens installed frontend-only local tools without waiting for a stalled network within %s", async (base) => {
    const instance = worker(true, true, base, true);
    await instance.lifecycle("install");
    instance.fetchNetwork.mockImplementation(() => new Promise<Response>(() => undefined));
    for (const route of ["stats", "studio", "progression", "classroom"]) {
      expect(await (await instance.request(base + route, "navigate"))!.text()).toBe("public-shell");
    }
    expect(instance.fetchNetwork).not.toHaveBeenCalled();
  });

  it("uses the network when the installed shell was removed", async () => {
    const instance = worker();
    await instance.lifecycle("install");
    instance.store.clear();
    expect(await (await instance.request("/learn", "navigate"))!.text()).toBe("network");
    expect(instance.fetchNetwork).toHaveBeenCalledOnce();
  });

  it("keeps online public navigation usable when cache storage is blocked", async () => {
    const instance = worker();
    vi.spyOn(instance.cacheStorage, "keys").mockRejectedValueOnce(new Error("cache blocked"));
    expect(await (await instance.request("/learn", "navigate"))!.text()).toBe("network");
    expect(instance.fetchNetwork).toHaveBeenCalledOnce();
  });

  it.each(
    ["/", "/project/"].flatMap(base =>
      ["keys", "open", "match"].map(operation => ({ base, operation })),
    ),
  )("fetches the unchanged public asset when cache $operation rejects within $base", async ({ base, operation }) => {
    const instance = worker(true, true, base);
    await instance.lifecycle("install");
    const cacheName = [...instance.store.keys()][0];
    const storedPaths = [...instance.store.get(cacheName)!.keys()];
    const failure = new Error("Context is stopped");
    if (operation === "keys") {
      vi.spyOn(instance.cacheStorage, "keys").mockRejectedValueOnce(failure);
    } else if (operation === "open") {
      vi.spyOn(instance.cacheStorage, "open").mockRejectedValueOnce(failure);
    } else {
      const cache = await instance.cacheStorage.open(cacheName);
      vi.spyOn(cache, "match").mockRejectedValueOnce(failure);
      vi.spyOn(instance.cacheStorage, "open").mockResolvedValueOnce(cache);
    }

    const path = base + "assets/main-hash.js";
    expect(await (await instance.request(path))!.text()).toBe("network");
    expect(instance.fetchNetwork).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        url: origin + path,
        method: "GET",
        mode: "cors",
      }),
    );
    expect([...instance.store.keys()]).toEqual([cacheName]);
    expect([...instance.store.get(cacheName)!.keys()]).toEqual(storedPaths);
    expect(await instance.store.get(cacheName)!.get(path)!.text()).toBe("asset");
    expect(instance.installations).toHaveLength(1);
  });

  it.each(["/", "/project/"])("keeps public asset cache hits off the network within %s", async base => {
    const instance = worker(true, true, base);
    await instance.lifecycle("install");
    expect(await (await instance.request(base + "assets/main-hash.js"))!.text()).toBe("asset");
    expect(instance.fetchNetwork).not.toHaveBeenCalled();
    expect(instance.installations).toHaveLength(1);
  });

  it.each(["/", "/project/"])("preserves network rejection after a public asset cache failure within %s", async base => {
    const instance = worker(true, true, base);
    await instance.lifecycle("install");
    vi.spyOn(instance.cacheStorage, "keys").mockRejectedValueOnce(new Error("cache unavailable"));
    const failure = new TypeError("network unavailable");
    instance.fetchNetwork.mockRejectedValueOnce(failure);
    await expect(instance.request(base + "assets/main-hash.js")).rejects.toBe(failure);
    expect(instance.fetchNetwork).toHaveBeenCalledOnce();
    expect(instance.installations).toHaveLength(1);
  });

  it("keeps a Pages installation inside its scope and reopens local games/stats offline", async () => {
    const instance = worker(true, false, "/project/", true);
    await instance.lifecycle("install");
    instance.fetchNetwork.mockRejectedValue(new TypeError("offline"));
    expect(await (await instance.request("/project/games", "navigate"))!.text()).toBe("public-shell");
    expect(await (await instance.request("/project/stats", "navigate"))!.text()).toBe("public-shell");
    expect(instance.request("/project/api/sessions")).toBeUndefined();
    expect(instance.request("/another-project/assets/main-hash.js")).toBeUndefined();
    expect(await (await instance.request("/project/assets/main-hash.js"))!.text()).toBe("asset");
    expect([...instance.store.keys()]).toEqual(["sparowtype-public-subpath-%2Fproject%2F-test-version"]);
  });
  it.each(["/", "/project/"])("reopens every exact public arcade route within base %s, without admitting dynamic private routes", async (base) => {
    const instance = worker(true, false, base);
    await instance.lifecycle("install");
    instance.fetchNetwork.mockRejectedValue(new TypeError("offline"));
    const routes = ["arcade", ...["word-invaders", "ghost-gp", "daily-gauntlet", "rhythm-typing", "key-tower", "snake-words", "lava-rise", "boss-duel"].map(id => `arcade/${id}`)];
    for (const route of routes) {
      expect(await (await instance.request(base + route, "navigate"))!.text()).toBe("public-shell");
    }
    for (const route of ["arcade/unknown", "arcade/ghost-gp/private", "arena", "arena/private-code", "friends", "studio", "progression", "classroom"]) {
      expect(await (await instance.request(base + route, "navigate"))!.text()).toBe("public-offline");
    }
    expect(instance.store.values().next().value?.size).toBe(3);
  });
  it.each(["/", "/project/"])("reopens local-only Studio, progression and classroom shells only in an explicit static build at %s", async (base) => {
    const instance = worker(true, false, base, true);
    await instance.lifecycle("install");
    instance.fetchNetwork.mockRejectedValue(new TypeError("offline"));
    for (const route of ["studio", "progression", "classroom"]) {
      expect(await (await instance.request(base + route, "navigate"))!.text()).toBe("public-shell");
    }
    for (const route of ["arena/private-code", "friends", "api/arena", "api/classroom"]) {
      const response = instance.request(base + route, "navigate");
      if (route.startsWith("api/")) expect(response).toBeUndefined();
      else expect(await (await response)!.text()).toBe("public-offline");
    }
    expect(instance.store.values().next().value?.size).toBe(3);
  });
  it("prepares only the exact public build list with omitted credentials", async () => {
    const instance = worker();
    await instance.lifecycle("install");
    expect(instance.installations).toHaveLength(1);
    expect(
      instance.installations[0].map((request) => new URL(request.url).pathname),
    ).toEqual([
      "/index.html",
      "/_offline-recovery.html",
      "/assets/main-hash.js",
    ]);
    expect(
      instance.installations[0].every(
        (request) => request.credentials === "omit",
      ),
    ).toBe(true);
    expect(instance.skipWaiting).not.toHaveBeenCalled();
  });
  it("refuses an unprocessed build template rather than claiming offline readiness", async () => {
    await expect(worker(false).lifecycle("install")).rejects.toThrow(
      "Offline build manifest is missing",
    );
  });
  it.each([
    "https://project.supabase.co/rest/v1/results",
    "/api/sessions",
    "/auth/v1/token",
    "/rest/v1/profile",
    "/functions/v1/submit-session",
    "/storage/v1/object/private",
    "/realtime/v1/websocket",
  ])("does not intercept API or cross-origin request %s", (path) => {
    expect(worker().request(path)).toBeUndefined();
  });
  it("does not intercept POST, authorized assets, private API data or query-bearing assets", () => {
    const instance = worker();
    expect(
      instance.request("/assets/main-hash.js", "cors", "POST"),
    ).toBeUndefined();
    expect(
      instance.request(
        "/assets/main-hash.js",
        "cors",
        "GET",
        new Headers({ authorization: "Bearer test-only" }),
      ),
    ).toBeUndefined();
    expect(
      instance.request("/assets/main-hash.js?token=private"),
    ).toBeUndefined();
    expect(instance.request("/private-result.json")).toBeUndefined();
  });
  it.each([
    "/",
    "/typing-test",
    "/learn",
    "/typing-practice",
    "/touch-typing",
    "/offline",
  ])("can reopen public app shell for %s offline", async (path) => {
    const instance = worker();
    await instance.lifecycle("install");
    instance.fetchNetwork.mockRejectedValueOnce(new Error("offline"));
    expect(await (await instance.request(path, "navigate"))!.text()).toBe(
      "public-shell",
    );
  });
  it.each([
    "/profile",
    "/auth",
    "/settings",
    "/stats",
    "/race/private-room-id",
    "/unknown",
  ])(
    "uses generic offline recovery for uncached private/unknown document %s",
    async (path) => {
      const instance = worker();
      await instance.lifecycle("install");
      instance.fetchNetwork.mockRejectedValueOnce(new Error("offline"));
      expect(await (await instance.request(path, "navigate"))!.text()).toBe(
        "public-offline",
      );
      expect(instance.store.get(current)?.has(path)).toBe(false);
    },
  );
  it("passes through online documents without caching their personalized response", async () => {
    const instance = worker(true, true);
    await instance.lifecycle("install");
    expect(await (await instance.request("/profile", "navigate"))!.text()).toBe(
      "network",
    );
    expect(instance.store.get(current)?.size).toBe(3);
    expect(instance.store.get(current)?.has("/profile")).toBe(false);
  });
  it.each([
    "/profile",
    "/auth",
    "/settings",
    "/stats",
    "/race/private-room-id",
    "/unknown",
  ])(
    "keeps explicitly offline private/unknown hard navigation %s generic even if HTTP fetch could return 200",
    async (path) => {
      const instance = worker(true, false);
      await instance.lifecycle("install");
      // The default network mock would return HTTP 200. Relying only on a
      // rejected fetch would allow a cached app shell through this boundary.
      expect(await (await instance.request(path, "navigate"))!.text()).toBe(
        "public-offline",
      );
      expect(instance.fetchNetwork).not.toHaveBeenCalled();
      expect(instance.store.get(current)?.has(path)).toBe(false);
    },
  );
  it("keeps offline API and authorization requests outside navigation recovery", async () => {
    const instance = worker(true, false);
    await instance.lifecycle("install");
    expect(instance.request("/api/session", "navigate")).toBeUndefined();
    expect(
      instance.request(
        "https://service.supabase.co/rest/v1/test_sessions",
        "navigate",
      ),
    ).toBeUndefined();
    expect(
      instance.request(
        "/profile",
        "navigate",
        "GET",
        new Headers({ authorization: "Bearer fixture" }),
      ),
    ).toBeUndefined();
    expect(instance.fetchNetwork).not.toHaveBeenCalled();
  });
  it("waits for explicit activation of an installed update", async () => {
    const instance = worker();
    await instance.lifecycle("install");
    expect(instance.skipWaiting).not.toHaveBeenCalled();
    await instance.lifecycle("message", { type: "unrelated" });
    expect(instance.skipWaiting).not.toHaveBeenCalled();
    await instance.lifecycle("message", { type: "ACTIVATE_UPDATE" });
    expect(instance.skipWaiting).toHaveBeenCalledTimes(1);
  });
  it("retains two previous public builds and never deletes another cache namespace", async () => {
    const instance = worker();
    instance.store.set("another-app-private", new Map());
    for (let i = 1; i <= 4; i++)
      instance.store.set(`sparowtype-public-v1-old-${i}`, new Map());
    await instance.lifecycle("install");
    await instance.lifecycle("activate");
    expect([...instance.store.keys()]).toEqual([
      "another-app-private",
      "sparowtype-public-v1-old-3",
      "sparowtype-public-v1-old-4",
      current,
    ]);
    expect(instance.claim).toHaveBeenCalledTimes(1);
  });
  it("serves a previously installed lazy chunk for an older open tab without a new cache write", async () => {
    const instance = worker();
    await instance.lifecycle("install");
    instance.store.set(
      "sparowtype-public-v1-old",
      new Map([["/assets/old-hash.js", new Response("previous-build")]]),
    );
    expect(await (await instance.request("/assets/old-hash.js"))!.text()).toBe(
      "previous-build",
    );
    expect(instance.fetchNetwork).not.toHaveBeenCalled();
  });
  it("has a truthful network-unavailable response when no public fallback remains", async () => {
    const instance = worker();
    instance.fetchNetwork.mockRejectedValueOnce(new Error("offline"));
    expect((await instance.request("/unknown", "navigate"))!.status).toBe(503);
  });
});
