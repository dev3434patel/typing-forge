# SparowType verification — 9 November 2026

**PARTIAL — functional, native, deployment and CI acceptance complete; performance verification resumed.** The reproduced WebKit Profile input-erasure race is fixed. Complete checkpoint publication avoids redundant work, and Arena reuses transaction-local locked member rows and allocates evidence services only when needed. The full 3D scene and quality settings are preserved. The recovered 65-spec browser coverage records **1,495 passes, 29 explicit skips and zero failures**, with no retries. Native Arena finish/history acceptance passed **32/32**; separate real account/human-race browser acceptance passed **20/20**. Capacity previously failed its target; new capacity, mobile latency and Lighthouse measurements remain pending. This report does not claim that every requested performance issue is resolved.

The default frontend is `d89f84d74519bf2bbae0`, with 133 published offline files and 2,964,860 bytes. The [source manifest](../audit/2026-11-05-followup/final36-source.json) binds 506 source files to `9b21e255ea1840508cbc35b625d0ccde8f3af7cc`. All 73 guarded browser/config dependencies match their approved digest. Receipt timestamps are UTC; this report uses the client's Asia/Calcutta date. Older audit directory dates identify checkpoints, not new execution dates.

## Changes

| Change | Evidence and scope |
| --- | --- |
| Profile confirmation clears before paint on owner changes. | A reproduced WebKit race erased early native `DELETE` input on the same focused field. The fix preserves initial input and still clears confirmation on A → B → A account transitions. The permanent four-engine regressions and the original course/reset scenario pass in the recovered matrix. The older stackless timeout remains historical evidence, without an invented retrospective stack trace. |
| Checkpoint publication avoids a redundant snapshot. | Full output, metrics, timing, errors, JSON property order and immutable publications match 150 differential cases. Primitive character records remain frozen; configuration, events and results retain deep immutability. |
| Immutable target metadata covers issued 800-word passages. | Factory metadata is bounded per target at 8,192 graphemes / 1,024 words. Boundary, Unicode, mutable-array and full checkpoint contracts pass. The strong target map retains 16 entries; callers may keep older factory targets alive. |
| Arena caches locked member rows within one transaction. | Full-row queries, room locks, database clocks and authoritative replay are retained. Writes invalidate the cache; it clears on success, failure and rollback. Differential and physical lock tests preserve the existing behavior. |
| Arena defers unused evidence-service allocation. | Non-submission routes avoid constructing validator/persistence services. Checkpoints retain validation; finishes retain validation and persistence. Autoload/control-flow comparisons preserve errors and non-Arena routes; current native finish/history/retry checks pass. |
| 3D quality remains unchanged. | All 21 protected brand source files and five emitted scene checks match the reference. The browser matrix exercises startup, teardown, returning visits and context-loss recovery. Physical GPU endurance and field frame rates remain unverified. |

## Verification

| Department | Status | Test and result |
| --- | --- | --- |
| Source checks | PASS-SCOPED | All [12 source commands](../audit/2026-11-05-followup/final36-source-gates.json) passed on the unchanged source. The recorded lint result has nine existing warnings and zero errors. |
| Unit correctness | PASS-SCOPED | 2,883 tests / 115 files; coverage 90.52% statements, 86.69% branches, 92.12% functions and 96.15% lines. |
| PHP replay and metrics | PASS-SCOPED | 560 unique / 578 executed candidates, zero mismatches, including canonical, checkpoint and chart projections. |
| Arena pure contracts | PASS-SCOPED WITH DISCLOSED TEST EDIT | Original gate passed 1,175 checks. A later test-only missing-storage portability correction passed a separate complete [1,175/1,175 confirmation](../audit/2026-11-05-followup/source36-arena-storage-confirmation.json); the original 12-command run was not repeated after that test edit. |
| Full browser scope | PASS-SCOPED COMPOSITE | [Recovered coverage](../audit/2026-11-09/source36-functional-recovery.json): all 65 specs covered, 1,495 passes / 29 skips / zero failures. Chromium, installed Edge and Firefox: 376 passes / five skips each. WebKit: 367 passes / 14 skips. One worker, no retries or changed assertions/timeouts. |
| Home, modes, results and correction | PASS-SCOPED BROWSER | Time, words, quote, code, custom and zen; completion/export, wrong-key display, caret, correct-word locking and reopening previous incorrect words are covered. Corrected mistakes remain in input accuracy. |
| Learn and structured lessons | PASS-SCOPED BROWSER / PURE PHP | Adaptive practice, 36-lesson catalog, locked previews, progression, save ordering, full 30-second assessment, reload and reset flows pass in their declared fixtures. |
| Timing | PASS-SCOPED | The separately completed final 32 cases pass across all four engines. Practice starts on the first qualifying character; live human races retain the shared clock. Non-text preparation keys and incorrect first characters are covered. |
| Live keyboard and Keyboard Lab | PASS-SCOPED BROWSER | Press ownership, wrong-key feedback, blur/restart cleanup, fonts, layouts, narrow/desktop viewports and rotation contracts pass. Real hardware model/finger-placement detection is not claimed. |
| Games, bots and Arena interface | PASS-SCOPED BROWSER | The feature batch passed 204/204. Includes original arcade modes, local/owner isolation, offline behavior and Arena fixtures. These are functional checks, not proof of competitive or educational superiority. |
| Stats, Profile and progression | PASS-SCOPED BROWSER | History, owner boundaries, early confirmation retention, account-switch clearing, durable guest reset and appearance persistence pass in the declared contexts. |
| Studio, settings, friends and classroom | PASS-SCOPED BROWSER / PURE PHP | Declared preference, import, focus, progression and owned-fixture contracts pass. Deployed provider and moderation behavior remains unverified. |
| About, privacy, terms, 404 and PWA | PASS-SCOPED BROWSER | Routes, semantics, offline recovery, blocked-storage behavior, snapshot/update consistency and lifecycle contracts are included. Hosted configuration is separate. |
| Native Arena lifecycle | PASS-SCOPED 32/32 | [Independent assessment](../audit/2026-11-09/native-arena32-assessment.json) binds fresh Apache/PDO/MariaDB acceptance: original 29 lifecycle assertions plus full finish chart/history/retry. Source and owned configuration hashes match. Three fixture accounts and three sessions are removed. Apache and DB shut down gracefully, with no forced stops or residual PIDs. |
| Real account/human-race browser acceptance | PASS-SCOPED 20/20 | [Native browser report](../audit/2026-11-05-followup/final36-native-browser.json) and [73-dependency guard](../audit/2026-11-05-followup/source36-native20-dependency-guard.json): five original cases per engine across four fresh backends, no failures/skips/retries, with verified graceful cleanup. Source/build/dependencies remain unchanged. The matrix's original 20 credential skips remain skips in its report. |
| Frontend-only deployment and accessibility | PASS-SCOPED | [Static report](../audit/2026-11-05-followup/final36-static-process.json): normal root/subpath builds, 67 artifact assertions, 56 deployment cases and 16 game accessibility cases pass. Source, default build and tools remain unchanged. |
| Database and legacy-reference CI | PASS-SCOPED | [Actual CI commands](../audit/2026-11-05-followup/final36-ci-extra.json): PGlite compatibility and exact three-entry Deno 2.9.8 typecheck passed. No handlers deployed or external database contacted. |
| Production dependency audit and bundle budgets | PASS-SCOPED | [Fresh release checks](../audit/2026-11-09/source36-release-checks.json): zero reported production vulnerabilities; default-artifact bundle budgets pass. Source/build/73 dependencies remain unchanged. |
| Capacity | PREVIOUS TRIAL FAILED; NEW VERIFICATION QUEUED | Latest ordinary full/wire p95: **333.1376 / 270.2455 ms**, above strict 150 ms. Each workload retained 1,653 operations, 400 accepted submissions and 400 accepted leaves, with zero unexpected statuses. |
| Mobile latency and Lighthouse | UNVERIFIED ON THIS BUILD | Fresh measurements are pending after resumed load testing. Prior 97/96/96 Lighthouse scores and sub-100-ms results belong to the older frontend and are not relabeled. No 3D quality reduction was made. |
| Git delivery | PENDING | Final public-evidence review, indexed-byte scan, commit and remote synchronization remain to complete. |

## Interrupted-run recovery

The first three batches had already closed successfully before interruption: 204 feature passes, 1,040 existing-flow passes / 20 skips, and 219 isolated passes / nine skips. Their source/build/test guards still match the current files, including all 142 retained artifact hashes. The fourth batch had no recorded outcomes, only an incomplete protocol and startup log. Its complete 32-case file was executed on 9 November with the original assertions and all four engines.

The recovery ledger binds those three closed batches and the fresh final 32. The original parent remains `PARTIAL`; its fourth protocol and log remain unchanged. **This is complete scoped coverage assembled from disclosed runs, not one newly uninterrupted full-suite execution.** The 29 skips consist of 20 native-credential cases and nine WebKit runner-capability gaps. Separate native acceptance can cover the credential flows without relabeling their original skipped outcomes.

## Remaining limits

The source35 ordinary trial measured full 166.6268 ms p95 (failed) and wire 140.5566 ms (passed after full on the same owner). The later source36 trial measured 333.1376 / 270.2455 ms (both failed). These differently timed trials do not establish that lazy allocation caused the difference; Node-only preparation also slowed. A frozen A-B-B-A allocation diagnostic is prepared, but its first entry stopped before creating services or sending requests because the resource gate failed.

The user previously paused load tests. On resumption of work on 9 November, the machine had about 1.1 GiB available, below the declared 2 GiB minimum. The user then explicitly resumed load/performance testing and freed memory. The [readiness check](../audit/2026-11-09/index-abba-resume-readiness.json) observed about 2.8 GiB available and unchanged frozen inputs; startup and every workload phase still require a fresh successful resource check. No reduced memory gate, weaker validation, request filtering, database durability change, relaxed latency threshold or animation-quality override is used.

Physical Android/iOS keyboards, native OS IMEs, screen readers, actual Safari devices, GPU memory/FPS endurance, field INP and hosted TLS/cookie/provider behavior remain unverified. Broader product gaps include configured OAuth/mail recovery, verified daily competition, full localization and public Arena seasons/ELO. Finite tests do not establish universal correctness.

The [5 November working report](RELEASE_AUDIT_2026-11-05.md) and [4 November release audit](RELEASE_AUDIT_2026-11-04.md) remain historical records. Failed and interrupted attempts are preserved.
