# Firefox offline transport diagnostic — 16 October 2026

The generic-private-recovery assertion remains **FAILED under Playwright offline emulation** on build `3574d07a5677c0221eb9`. This diagnostic does not relabel it as a product pass.

The passive-observation run used one Firefox process and two isolated guest contexts. The first loaded the current production preview at port 4175. The second loaded the same upstream bytes through a temporary local forwarding server. Every forwarded response had `Cache-Control: no-store`; the forwarder logged actual incoming requests and added an `x-pwa-diagnostic-upstream-hit` sequence marker. The worker/application bytes were unchanged. No external/backend requests were observed. The browser and temporary forwarding server were closed at completion.

After `context.setOffline(true)` in both contexts:

- The page's `navigator.onLine` was **false**.
- An ordinary page `fetch()` to an uncached probe with `cache: 'no-store'` rejected with a network error.
- A controlled hard navigation to `/profile` nevertheless returned **HTTP 200** and rendered **Guest workspace**, rather than generic recovery.
- In the forwarding context, the server received an actual **GET /profile**, logged sequence **80**, fetched the current 4175 document and returned HTTP 200. The navigation response contained that same sequence marker and `Cache-Control: no-store`.

This proves that the successful private-document response was **not merely an old HTTP-cache response**. A worker-associated navigation reached the live server even while the page's ordinary network stack was emulated offline. It explains why a `fetch()`-rejection fallback was not entered. It does not directly measure `WorkerNavigator.onLine`; the worker-state hint remains unobserved.

Adding `cache: 'no-store'` alone is not a supported repair for this reproduction: the forwarding experiment already excluded reusable HTTP caching and still observed a real server request. At this diagnostic checkpoint, a true server/network outage, native Firefox device behavior and actual worker connectivity-state propagation were **UNVERIFIED**. Those checks need an actual unavailable server/network, not a physical disconnection inferred from this emulation flag. A later true-server-outage checkpoint is recorded below.

The first exploratory run registered catch-all request interception and changed the outcome to `NS_ERROR_OFFLINE` before completing the diagnostic. It is retained in `intercepted-run.txt` as an instrumentation difference, not causal evidence for the original Profile response. The final passive run is `run.txt`; observations and all actual forwarder hits are in `observations.json`. The final test intentionally fails its original recovery assertion after writing the evidence.

No application or worker source was changed by this diagnostic. No browser assertion was weakened, timeout extended to hide a failure, backend deployed or native Edge process launched.

## Later real-server-outage verification

The production integration spec now starts its own static `dist` HTTP server at a fresh localhost origin, carries that origin through the Playwright `baseURL` fixture into all typing helpers, and applies the built deployment CSP headers. The server sends no-store responses so an HTTP cache cannot manufacture a success. It then stops accepting connections and closes active sockets after service-worker installation/control. An independent Node fetch must reject before the browser outage assertions run. No `context.setOffline()` or request interception is used.

The original two corrected-session, guide, private generic-recovery, cache-clear and two 75.0% history-row assertions are retained. The server resumes at the same origin before clearing downloads/history inspection. Browser contexts and owned servers close in fixture teardown. The helper is `e2e/pwa-static-server.ts`; the integration spec remains `e2e/offline-pwa.spec.ts` with an explicit real-server-outage test title.

Build **43055d5993917617527d** (64 public files, 2,705,226 bytes) completed **4 passed / 0 skipped / 0 failed**, exit 0, 55.6s overall, one worker sequentially:

| Project                  | Case duration | Result |
| ------------------------ | ------------: | ------ |
| Chromium                 |          5.3s | PASS   |
| Firefox                  |         18.5s | PASS   |
| WebKit                   |         15.7s | PASS   |
| Installed Microsoft Edge |          7.8s | PASS   |

[Complete text](../pwa-true-outage.txt) and [structured report](../pwa-true-outage.json) retain actual per-case build/transport attachments. No application-source change was required to repair the test transport. This is positive evidence for the actual server-outage journey, not a passing offline-emulation run. The earlier reproduction above stays failed. Physical device network loss, native OS installation/eviction, multiple-version updates and hosted backend behavior remain **UNVERIFIED**.
