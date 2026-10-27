# Native backend verification — 21 October 2026

This report covers guarded, disposable, loopback audit instances. It is not a production-host capacity claim. The application database, private user configuration and existing services on ports 3308, 8081 and 4173 were not opened for fixture writes, reconfigured, stopped or migrated. Each instance used a new `sparow_pack_<id>_audit` database, its own random synthetic credentials/session namespace, ignored configuration/logs and exact PID/path ownership checks. No Windows service was installed. Public receipts contain no passwords, cookies or private configuration bodies.

## Functional scope

Earlier fresh-schema native HTTP checks passed progression **7**, social **7** and classroom **9** grouped checks. These use guarded synthetic fixtures; their precise receipt/source boundary is recorded in the central [pack audit](MEGA_PACK_AUDIT_2026-10-21.md). Pure replay/progression parity and source coverage are separate gates and do not stand in for live HTTP checks.

The threaded runtime proof confirms installed Apache `apache2handler`, thread-safe PHP, 64 request threads, a private ini/configuration, and a separately owned MariaDB capped at 64 connections. Existing hosting settings were unchanged. Initial threaded Arena lifecycle **27/27** checks and password-policy checks passed on `d8941fa00279093f`. After the confirmed first-host creation repair, fresh instance `4678b38b84a8bd3f` passed **29/29** HTTP checks, including three concurrent distinct room creations and each host's own slot0. The ordinary-clock deadline/reconnect checks were retained. Full receipt: `audit/2026-10-21/pack-backend-4678b38b84a8bd3f-arena-http-raw.json`.

Password verification checks retained equal real/dummy bcrypt cost12 and meaningful long-password suffix handling. Synthetic account provisioning for the load harness does not measure signup throughput or establish that accounts belong to real humans.

## Native browser runs

All runs use four engines where declared, one worker, zero retries, trace disabled, native API/cookies and ordinary Playwright key events. The selected specs disable the separately tested opening animation. They do not inject replay transcripts or mock the API.

| Declared run | Build | Result | Precise boundary |
| --- | --- | --- | --- |
| `d8941fa00279093f-1792589183900` | `b269bcf94045fe6da4f5` | **12/16 passed** | All account lifecycle/sign-in/API race authorization checks passed; all four human-race checks failed at peer progress. A stale countdown snapshot shifted wall time relative to monotonic duration; server validation correctly rejected it. |
| `fee54c8191badf00-1792589930765` | `3ffaa0a179b47e336a2d` | **15/16 passed** | All four account lifecycles, real sign-ins and API race authorization checks passed. Chromium, Edge and Firefox completed the two-context human race with accepted progress in both directions and server-settled 30-second results. WebKit failed before room creation at the existing five-second Account-link assertion after its peer signed in; the DOM retained a successful sign-in toast and the lazy-home `Suspense` fallback. |
| `fee54c8191badf00-1792590307253` | Same final6 build | **1/1 passed** | Separately declared WebKit-only diagnostic, same accounts/assertions/budgets, no retries: both directions of confirmed progress and ordinary-clock settlement passed. The earlier cold-home delay did not reproduce. |

Each prefix has preserved `-protocol.json`, `-provenance.json`, `-browser.json` and `-summary.json` under `audit/2026-10-21/`. The repaired human-race flow has therefore passed in all four engines across declared runs. There is **no single clean 16/16 result**, and the earlier 15/16 run remains failed. The cold-home delay's cause remains **unproven**; failure-only diagnostic resource capture was not triggered in the passing diagnostic. It is not attributed to authentication, service-worker precaching or a fixture without evidence. No timeout was extended to obtain that pass.

The clock repair uses the parent's calibrated server offset to establish a single authoritative start-wall/monotonic anchor; it preserves idle time and changes no validation tolerance, issuance or scoring formula. Focused tests: four clock units; the actual pure PHP validator accepts four repaired checkpoints/timeouts and rejects the old-clock witness (**5/5**). Receipts: `race-sse-clock-units.json`, `race-sse-clock-php.json`. The native account lifecycle includes signup, canonical replay upload, course progress, independent-device history/preferences and account deletion on synthetic accounts only.

## Capacity: target failed

The declared target remains p95 ≤150ms. Every failed attempt is retained.

| Attempt | Runtime | Outcome |
| --- | --- | --- |
| `097e029bc5ccfaa2` | Single-worker PHP CLI server | **FAILED**, 1,653 requests, p95 943.1102ms. A runner artifact bug replaced the detailed report with stdout summary; that loss and the original failure are explicitly recorded. |
| `5a4d5a7e38200394` | Single-worker PHP CLI server | **FAILED**, 1,653 requests, successful-response p95 936.0943ms, 360 deadline409 responses; full raw report retained. |
| `d8941fa00279093f` | Threaded Apache | **FAILED**, 1,525 requests, successful-response p95 670.9726ms. Four create conflicts were confirmed as an empty-member-range InnoDB deadlock. Actual allocation was **46 rooms/368 seats**; a sparse-array assertion wrongly reported all50. The separate correction receipt preserves this discrepancy without modifying the raw report. Also retained: 71 submit422s and 328 leave429s. |
| `4678b38b84a8bd3f` | Threaded Apache, separately declared repaired trial | **FAILED**, exactly **50 rooms/400 seats** and no create conflicts/evidence422s; 1,653 requests, successful-response p95 **767.406ms**, 345 accepted submissions, **55 submit429s and 400 leave429s**. |

The final trial's single-IP workload exceeds the unchanged 1,200 requests/IP/minute policy. No counter, deadline, validation rule, rate limit or timeout was relaxed. A subsequent synthetic browser-account setup on the saturated instance returned429 before any browser launch; that infrastructure setup failure is retained, and the runner stopped its services. Native browser acceptance then used the separately declared fresh `fee54…` instance with no load run or counter reset.

Source inspection identifies SQL serialization at the shared-IP rate bucket and room/member locks around canonical validation/response serialization. The repaired trial's successful-submit nearest-rank p95 was868.314ms; create103.3766ms, join88.3203ms and ready95.8423ms. This comparison locates the slower operation; it does not isolate CPU, database and lock costs. Dedicated hot-path profiling and hosted/multi-region/SSE worker-capacity tests are **not run**.

## Cleanup and residuals

Final native instance `fee54c8191badf00` cleanup completed **2026-10-21T13:47:02.078Z**: its DB, Apache parent/worker and preview stopped gracefully, no forced stop, no Apache residual PID, and its owned temporary directory was removed. Receipt: `pack-backend-fee54c8191badf00-cleanup.json`.

Prior failed instance processes were also stopped under their guards; their ignored private diagnostic directories remain intentionally retained where `KEEP_FAILURE` applied. These include the owned startup failure `4d47849a9b6dd258`, `d8941fa00279093f` and `4678b38b84a8bd3f`. Their random audit secrets are not public artifacts. Two earlier policy-denied folders were not touched or retried: `mobile-games-instance-a259364bf1489e3a` and `mobile-games-instance-461ff9ad9d349a88`. No native/browser/load job remains active from this verification agent.
