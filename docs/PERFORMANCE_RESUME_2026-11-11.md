# Source37 performance checks

These checks are prepared but unexecuted. Use the unchanged default build `d89f84d74519bf2bbae0` and existing frontend-only Vercel artifact `3d4bcb5f0a0a855c09f8`. Run one workload at a time. At least **2 GiB available RAM** is required before starting any performance workload; about 3 GiB provides setup headroom. Recheck admission between trials. Do not close unrelated applications automatically or change quality, clocks, validation, limits or database durability.

The [frontend preparation](../audit/2026-11-11/source37-frontend-performance-preparation.json) binds all seven helpers, source506, test73 and current artifact bytes. Shared PowerShell environment:

```powershell
$env:SPAROWTYPE_FINAL37_BUILD_ID = 'd89f84d74519bf2bbae0'
$env:SPAROWTYPE_FINAL37_STATIC_BUILD_ID = '3d4bcb5f0a0a855c09f8'
$env:SPAROWTYPE_SOURCE37_FRONTEND_PERFORMANCE_WINDOW = '1'
$env:SPAROWTYPE_SOURCE37_FRONTEND_PERFORMANCE_PREPARATION_SHA256 = 'e15a5bfc3b3024391fada01c6c5d6ce739b0233cbb322bb7c0307e671da6954f'
$env:SPAROWTYPE_MOBILE_STATIC_ACCEPTANCE = '1'
```

For each fresh mobile prefix ending in `-1`, `-2` and `-3`, run all three commands below. Preserve every result. A functional failure stops the window; a latency miss remains a miss and must not be retried to select a better result.

```powershell
node audit/2026-11-05-followup/run-mobile-workspaces-static-final37.mjs mobile-workspaces-final37-static-1
node audit/2026-11-05-followup/assess-final37-mobile-latency.mjs mobile-workspaces-final37-static-1
node audit/2026-11-05-followup/assess-final37-mobile-interaction-latency.mjs mobile-workspaces-final37-static-1
```

Both independent p98 gates must be strictly below 100 ms for every measured workspace in all three trials. Intro-disabled test contexts isolate typing; product intro quality remains unchanged.

Home typing requires an owned preview on4173. If that port is already occupied, verify the served build and ownership; do not replace the listener. In a separate terminal, `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` can start a new preview when the port is free. Check `/offline-build.json` matches the declared default build, then:

```powershell
$env:TYPING_BENCH_ORIGIN = 'http://127.0.0.1:4173'
node audit/2026-11-05-followup/run-input-final37.mjs final37
```

This helper runs three fresh trials with the original input, CPU throttling, rotation and quiet intervals. Exit0 establishes functional completion only. Separately assess positive event samples and strict p98<100 ms in every trial; preserve latency misses.

Full-quality Lighthouse uses three fresh normal first visits, full3D, original30-second quiet intervals and no intro-skip/reduced-motion/quality override:

```powershell
node audit/2026-11-05-followup/run-final37-lighthouse.mjs final37-mobile
```

Report every score. The existing helper has a median performance gate; an individual score below95 must still be disclosed and cannot support an unqualified every-run95+ claim. Retain original LCP, CLS, accessibility, best-practices and SEO requirements. Stop only the preview/browser processes owned by this window and verify cleanup.

Backend full/wire acceptance uses [runtime preparation v2](../audit/2026-11-10/source37-runtime-preparation-v2.json), SHA256 `2aa5adf440aad1baa4447b106a7766a0e2ee561a9c3059f7da862c2b3448cf73`, and `run-source37-ordinary-capacity.mjs`. Its exact flags and interactive `capacity37`, `capacity37-wire`, `cleanup` commands are recorded in that preparation. Full then wire retain all1,653 operations, concurrency20,50 rooms×8 and strict150 ms. Acceptance requires three independently fresh owners with every gate passing; stop repetitions after the first failed owner. Keep full and wire outcomes separate.

The [transport control](../audit/2026-11-10/transport-control-source37-readiness.json) is a separately declared producer-interference diagnostic. It is not an Arena or backend acceptance result. Never substitute it for the full/wire gate.
