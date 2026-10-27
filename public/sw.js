/* Build template: scripts/build-offline.mjs injects immutable public asset paths. */
const BUILD_ID = "__SPAROWTYPE_BUILD__";
const PRECACHE_PATHS = /*__SPAROWTYPE_PRECACHE__*/ [];
const APP_BASE_PATH = /*__SPAROWTYPE_BASE__*/ "/";
const FRONTEND_ONLY = /*__SPAROWTYPE_STATIC__*/ false;
const appPath = (path) => APP_BASE_PATH + path.replace(/^\/+/, "");
const CACHE_PREFIX = APP_BASE_PATH === "/" ? "sparowtype-public-v1-" : `sparowtype-public-subpath-${encodeURIComponent(APP_BASE_PATH)}-`;
const CACHE_NAME = CACHE_PREFIX + BUILD_ID;
const PUBLIC_ROUTES = new Set([
  "/",
  "/typing-test",
  "/learn",
  "/lessons",
  "/typing-practice",
  "/practice",
  "/touch-typing",
  "/keyboard-lab",
  "/about",
  "/privacy",
  "/terms",
  "/offline",
  "/race",
  "/leaderboard",
  "/games",
  "/arcade",
  "/arcade/word-invaders",
  "/arcade/ghost-gp",
  "/arcade/daily-gauntlet",
  "/arcade/rhythm-typing",
  "/arcade/key-tower",
  "/arcade/snake-words",
  "/arcade/lava-rise",
  "/arcade/boss-duel",
  ...(FRONTEND_ONLY
    ? ["/stats", "/settings", "/profile", "/auth", "/ranked", "/studio", "/progression", "/classroom"]
    : []),
]);
const BYPASS_PREFIXES = [
  "/api",
  "/auth/v1",
  "/rest/v1",
  "/functions/v1",
  "/storage/v1",
  "/realtime/v1",
];

async function publicCacheMatch(path) {
  // Only this app's public build caches are read; personal browser caches are excluded.
  const names = await caches.keys();
  const ordered = [
    CACHE_NAME,
    ...names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .reverse(),
  ];
  for (const name of ordered) {
    const cache = await caches.open(name);
    const response = await cache.match(path, { ignoreSearch: false });
    if (response) return response;
  }
  return undefined;
}
async function documentFallback(pathname) {
  if (PUBLIC_ROUTES.has(pathname)) {
    const shell = await publicCacheMatch(appPath("/index.html"));
    if (shell) return shell;
  }
  const fallback = await publicCacheMatch(appPath("/_offline-recovery.html"));
  return (
    fallback ||
    new Response(
      "This page needs a connection. Reopen SparowType while online to prepare offline practice.",
      {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    )
  );
}
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      if (BUILD_ID.startsWith("__") || PRECACHE_PATHS.length < 3)
        throw new Error("Offline build manifest is missing.");
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(
        PRECACHE_PATHS.map(
          (path) => new Request(path, { cache: "reload", credentials: "omit" }),
        ),
      );
      // An update waits for an explicit user action or for all old tabs to close.
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const versions = (await caches.keys()).filter(
        (name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME,
      );
      // Keep two previous public builds for older tabs that still need lazy chunks.
      await Promise.all(
        versions
          .slice(0, Math.max(0, versions.length - 2))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE")
    event.waitUntil(self.skipWaiting());
  if (
    event.data?.type === "SPAROWTYPE_PUBLIC_READINESS_V1" &&
    event.ports?.[0]
  ) {
    const port = event.ports[0];
    event.waitUntil(
      (async () => {
        let ready = false;
        try {
          for (const name of (await caches.keys()).filter((name) =>
            name.startsWith(CACHE_PREFIX),
          )) {
            if (
              (await caches.match(appPath("/index.html"), { cacheName: name })) &&
              (await caches.match(appPath("/_offline-recovery.html"), { cacheName: name }))
            ) {
              ready = true;
              break;
            }
          }
        } catch {
          // Storage failures never confirm a public download.
        }
        try {
          port.postMessage({ type: "SPAROWTYPE_PUBLIC_READINESS_V1", ready });
        } catch {
          // A departing client can close its reply endpoint before this read ends.
        } finally {
          port.close();
        }
      })(),
    );
  }
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (!url.pathname.startsWith(APP_BASE_PATH)) return;
  const localPath = "/" + url.pathname.slice(APP_BASE_PATH.length);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    request.headers.has("authorization")
  )
    return;
  if (
    BYPASS_PREFIXES.some(
      (prefix) =>
        localPath === prefix || localPath.startsWith(prefix + "/"),
    )
  )
    return;
  if (request.mode === "navigate") {
    const pathname =
      localPath.length > 1 ? localPath.replace(/\/+$/, "") : "/";
    event.respondWith(
      (async () => {
        // Installed public pages use this worker's versioned app shell. Waiting
        // for a failed network on every hard navigation makes offline practice
        // slow even though all required public files are already installed.
        // New builds still enter through the explicit worker update lifecycle.
        if (PUBLIC_ROUTES.has(pathname)) {
          try {
            const shell = await publicCacheMatch(appPath("/index.html"));
            if (shell) return shell;
          } catch {
            // Unavailable cache storage must not prevent an online navigation.
          }
        }
        // An explicitly offline browser can still satisfy fetch from its HTTP
        // cache. Keep private/unknown hard navigations on generic recovery;
        // the public SPA can still expose its local practice/history links.
        if (!PUBLIC_ROUTES.has(pathname) && self.navigator?.onLine === false)
          return documentFallback(pathname);
        try {
          return await fetch(request);
        } catch {
          return documentFallback(pathname);
        }
      })(),
    );
    return;
  }
  // Query-bearing or unknown requests are never cached. Public build responses
  // enter the cache only during installation from the generated exact allowlist.
  if (
    url.search ||
    !(
      PRECACHE_PATHS.includes(url.pathname) ||
      /^\/assets\/[^/]+\.(?:js|css|woff2?|png|svg|webp|ico)$/.test(localPath)
    )
  )
    return;
  event.respondWith(
    (async () => {
      try {
        const cached = await publicCacheMatch(url.pathname);
        if (cached) return cached;
      } catch {
        // Unavailable cache storage must not prevent an online public asset.
      }
      return fetch(request);
    })(),
  );
});
