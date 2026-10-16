# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: offline-transport.spec.ts >> diagnoses actual offline private-navigation transport without accepting an app shell
- Location: audit\keyboard-awakens-2026-10-16\pwa-diagnostic\offline-transport.spec.ts:101:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  95  |         )
  96  |       ).flat();
  97  |     }),
  98  |   };
  99  | }
  100 | 
  101 | test("diagnoses actual offline private-navigation transport without accepting an app shell", async ({
  102 |   browser,
  103 |   context,
  104 |   page,
  105 | }, testInfo) => {
  106 |   test.setTimeout(60_000);
  107 |   const build = await (
  108 |     await fetch(`${upstream}/offline-build.json`, { cache: "no-store" })
  109 |   ).json();
  110 |   const direct = await observe(context, page, upstream);
  111 |   await context.close();
  112 | 
  113 |   const hits: {
  114 |     path: string;
  115 |     method: string;
  116 |     sequence: number;
  117 |     receivedAt: string;
  118 |     upstreamStatus?: number;
  119 |   }[] = [];
  120 |   const server = createServer(async (request, response) => {
  121 |     const target = new URL(request.url || "/", upstream);
  122 |     if (target.origin !== upstream) {
  123 |       response.writeHead(400).end();
  124 |       return;
  125 |     }
  126 |     const hit = {
  127 |       path: target.pathname,
  128 |       method: request.method || "GET",
  129 |       sequence: hits.length + 1,
  130 |       receivedAt: new Date().toISOString(),
  131 |       upstreamStatus: undefined as number | undefined,
  132 |     };
  133 |     hits.push(hit);
  134 |     try {
  135 |       const forwarded = await fetch(target, {
  136 |         headers: { "accept-encoding": "identity" },
  137 |         cache: "no-store",
  138 |       });
  139 |       hit.upstreamStatus = forwarded.status;
  140 |       const headers = Object.fromEntries(forwarded.headers.entries());
  141 |       delete headers["content-length"];
  142 |       delete headers["content-encoding"];
  143 |       delete headers["transfer-encoding"];
  144 |       headers["cache-control"] = "no-store";
  145 |       headers["x-pwa-diagnostic-upstream-hit"] = String(hit.sequence);
  146 |       response.writeHead(forwarded.status, headers);
  147 |       response.end(Buffer.from(await forwarded.arrayBuffer()));
  148 |     } catch (error) {
  149 |       response
  150 |         .writeHead(502, { "content-type": "text/plain" })
  151 |         .end(String(error));
  152 |     }
  153 |   });
  154 |   await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  155 |   const address = server.address();
  156 |   if (!address || typeof address === "string")
  157 |     throw new Error("Diagnostic server has no TCP address");
  158 |   const origin = `http://127.0.0.1:${address.port}`;
  159 |   const proxyContext = await browser.newContext({ serviceWorkers: "allow" });
  160 |   let proxy;
  161 |   try {
  162 |     proxy = await observe(proxyContext, await proxyContext.newPage(), origin);
  163 |   } finally {
  164 |     await proxyContext.close();
  165 |     await new Promise<void>((resolve) => server.close(() => resolve()));
  166 |   }
  167 |   const observations = {
  168 |     checkedAt: new Date().toISOString(),
  169 |     scope:
  170 |       "One Firefox process, current 4175 build, guest-only. Forwarder serves the same upstream bytes and forces no-store; it changes no worker/app source.",
  171 |     build,
  172 |     direct,
  173 |     noStoreForwarder: proxy,
  174 |     profileUpstreamHits: hits.filter((hit) => hit.path === "/profile"),
  175 |     allForwarderHits: hits,
  176 |     productAcceptance:
  177 |       "Generic recovery is still required. The assertion below deliberately remains unchanged; a diagnostic reproduction is not a product pass.",
  178 |   };
  179 |   await writeFile(evidencePath, JSON.stringify(observations, null, 2));
  180 |   await testInfo.attach("offline-transport-observations", {
  181 |     path: evidencePath,
  182 |     contentType: "application/json",
  183 |   });
  184 |   console.log(
  185 |     JSON.stringify({
  186 |       build: build.version,
  187 |       directRecovery: direct.genericRecovery,
  188 |       proxyRecovery: proxy.genericRecovery,
  189 |       profileUpstreamHits: observations.profileUpstreamHits.length,
  190 |     }),
  191 |   );
  192 |   expect(proxy.windowOnlineAfterOfflineEmulation).toBe(false);
  193 |   expect(proxy.externalRequests).toEqual([]);
  194 |   expect(proxy.pageNetworkProbe.returned).toBe(false);
> 195 |   expect(proxy.genericRecovery).toBe(true);
      |                                 ^ Error: expect(received).toBe(expected) // Object.is equality
  196 | });
  197 | 
```