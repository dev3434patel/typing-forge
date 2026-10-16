import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const template = readFileSync(
  new URL("../../../public/sw.js", import.meta.url),
  "utf8",
);
const origin = "https://example.test";
const current = "sparowtype-public-v1-test-version";
function worker(prepare = true, online?: boolean) {
  const listeners = new Map<string, (event: Record<string, unknown>) => void>();
  const store = new Map<string, Map<string, Response>>();
  const installations: Request[][] = [];
  const fetchNetwork = vi.fn(async () => new Response("network"));
  const skipWaiting = vi.fn(async () => undefined);
  const claim = vi.fn(async () => undefined);
  const cacheStorage = {
    keys: async () => [...store.keys()],
    delete: vi.fn(async (name: string) => store.delete(name)),
    open: async (name: string) => {
      if (!store.has(name)) store.set(name, new Map());
      const entries = store.get(name)!;
      return {
        match: async (path: string) => entries.get(path),
        addAll: async (requests: Request[]) => {
          installations.push(requests);
          for (const request of requests)
            entries.set(
              new URL(request.url).pathname,
              new Response(
                new URL(request.url).pathname === "/index.html"
                  ? "public-shell"
                  : new URL(request.url).pathname === "/_offline-recovery.html"
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
            "/index.html",
            "/_offline-recovery.html",
            "/assets/main-hash.js",
          ]),
        )
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
    request,
  };
}
describe("actual service worker public-cache boundary", () => {
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
