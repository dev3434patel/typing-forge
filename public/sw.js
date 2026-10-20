/* Build template: scripts/build-offline.mjs injects immutable public asset paths. */
const BUILD_ID = "__SPAROWTYPE_BUILD__";
const PRECACHE_PATHS = /*__SPAROWTYPE_PRECACHE__*/ [];
const CACHE_PREFIX = "sparowtype-public-v1-";
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
    const shell = await publicCacheMatch("/index.html");
    if (shell) return shell;
  }
  const fallback = await publicCacheMatch("/_offline-recovery.html");
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
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    request.headers.has("authorization")
  )
    return;
  if (
    BYPASS_PREFIXES.some(
      (prefix) =>
        url.pathname === prefix || url.pathname.startsWith(prefix + "/"),
    )
  )
    return;
  if (request.mode === "navigate") {
    const pathname =
      url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : "/";
    event.respondWith(
      (async () => {
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
      /^\/assets\/[^/]+\.(?:js|css|woff2?|png|svg|webp|ico)$/.test(url.pathname)
    )
  )
    return;
  event.respondWith(
    (async () => (await publicCacheMatch(url.pathname)) || fetch(request))(),
  );
});
