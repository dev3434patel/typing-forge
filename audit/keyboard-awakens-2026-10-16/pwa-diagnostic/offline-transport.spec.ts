import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type Response,
} from "@playwright/test";
import { createServer } from "node:http";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const upstream = "http://127.0.0.1:4175";
const evidencePath = path.resolve(import.meta.dirname, "observations.json");

async function observe(context: BrowserContext, page: Page, origin: string) {
  await page.addInitScript(() =>
    localStorage.setItem("sparowtype.opening-animation.enabled", "false"),
  );
  // Passive observation only. Request interception changes Firefox offline
  // behavior, so it must not be used to diagnose this service-worker boundary.
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const observed = new URL(request.url());
    if (observed.origin !== origin)
      externalRequests.push(observed.origin + observed.pathname);
  });
  await page.goto(`${origin}/offline`);
  await expect(
    page.getByRole("heading", { name: "Your offline workspace", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Public download: available/)).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  const before = await page.evaluate(() => ({
    online: navigator.onLine,
    controller: navigator.serviceWorker.controller?.scriptURL,
  }));
  await context.setOffline(true);
  const offline = await page.evaluate(() => navigator.onLine);
  const pageNetworkProbe = await page.evaluate(async () => {
    try {
      const response = await fetch(`/pwa-probe-${Date.now()}`, {
        cache: "no-store",
      });
      return { returned: true, status: response.status };
    } catch (error) {
      return { returned: false, error: String(error) };
    }
  });
  let response: Response | null = null;
  let navigationError: string | null = null;
  try {
    response = await page.goto(`${origin}/profile`, {
      waitUntil: "domcontentloaded",
    });
  } catch (error) {
    navigationError = String(error);
  }
  if (!navigationError) await expect(page.locator("h1")).toBeVisible();
  return {
    origin,
    before,
    windowOnlineAfterOfflineEmulation: offline,
    pageNetworkProbe,
    navigationError,
    externalRequests,
    profileStatus: response?.status(),
    profileResponseHeaders: {
      cacheControl: response?.headers()["cache-control"],
      upstreamHit: response?.headers()["x-pwa-diagnostic-upstream-hit"],
    },
    finalHeading: await page.locator("h1").allTextContents(),
    genericRecovery:
      (await page
        .getByRole("heading", {
          name: "This page needs a connection.",
          exact: true,
        })
        .count()) === 1,
    publicCachePaths: await page.evaluate(async () => {
      if (!("caches" in window)) return [];
      const names = (await caches.keys()).filter((name) =>
        name.startsWith("sparowtype-public-v1-"),
      );
      return (
        await Promise.all(
          names.map(async (name) =>
            (await (await caches.open(name)).keys()).map(
              (request) => new URL(request.url).pathname,
            ),
          ),
        )
      ).flat();
    }),
  };
}

test("diagnoses actual offline private-navigation transport without accepting an app shell", async ({
  browser,
  context,
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  const build = await (
    await fetch(`${upstream}/offline-build.json`, { cache: "no-store" })
  ).json();
  const direct = await observe(context, page, upstream);
  await context.close();

  const hits: {
    path: string;
    method: string;
    sequence: number;
    receivedAt: string;
    upstreamStatus?: number;
  }[] = [];
  const server = createServer(async (request, response) => {
    const target = new URL(request.url || "/", upstream);
    if (target.origin !== upstream) {
      response.writeHead(400).end();
      return;
    }
    const hit = {
      path: target.pathname,
      method: request.method || "GET",
      sequence: hits.length + 1,
      receivedAt: new Date().toISOString(),
      upstreamStatus: undefined as number | undefined,
    };
    hits.push(hit);
    try {
      const forwarded = await fetch(target, {
        headers: { "accept-encoding": "identity" },
        cache: "no-store",
      });
      hit.upstreamStatus = forwarded.status;
      const headers = Object.fromEntries(forwarded.headers.entries());
      delete headers["content-length"];
      delete headers["content-encoding"];
      delete headers["transfer-encoding"];
      headers["cache-control"] = "no-store";
      headers["x-pwa-diagnostic-upstream-hit"] = String(hit.sequence);
      response.writeHead(forwarded.status, headers);
      response.end(Buffer.from(await forwarded.arrayBuffer()));
    } catch (error) {
      response
        .writeHead(502, { "content-type": "text/plain" })
        .end(String(error));
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Diagnostic server has no TCP address");
  const origin = `http://127.0.0.1:${address.port}`;
  const proxyContext = await browser.newContext({ serviceWorkers: "allow" });
  let proxy;
  try {
    proxy = await observe(proxyContext, await proxyContext.newPage(), origin);
  } finally {
    await proxyContext.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  const observations = {
    checkedAt: new Date().toISOString(),
    scope:
      "One Firefox process, current 4175 build, guest-only. Forwarder serves the same upstream bytes and forces no-store; it changes no worker/app source.",
    build,
    direct,
    noStoreForwarder: proxy,
    profileUpstreamHits: hits.filter((hit) => hit.path === "/profile"),
    allForwarderHits: hits,
    productAcceptance:
      "Generic recovery is still required. The assertion below deliberately remains unchanged; a diagnostic reproduction is not a product pass.",
  };
  await writeFile(evidencePath, JSON.stringify(observations, null, 2));
  await testInfo.attach("offline-transport-observations", {
    path: evidencePath,
    contentType: "application/json",
  });
  console.log(
    JSON.stringify({
      build: build.version,
      directRecovery: direct.genericRecovery,
      proxyRecovery: proxy.genericRecovery,
      profileUpstreamHits: observations.profileUpstreamHits.length,
    }),
  );
  expect(proxy.windowOnlineAfterOfflineEmulation).toBe(false);
  expect(proxy.externalRequests).toEqual([]);
  expect(proxy.pageNetworkProbe.returned).toBe(false);
  expect(proxy.genericRecovery).toBe(true);
});
