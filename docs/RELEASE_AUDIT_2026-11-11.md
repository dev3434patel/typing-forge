# SparowType verified checkpoint — 11 November 2026

**PARTIAL: functional fixes verified; performance acceptance remains open.** Source37 adds an Arena request-memory reduction to the previously verified WebKit confirmation, typing-checkpoint and transaction-cache fixes. All 12 fresh source checks and all 32 fresh native Arena checks pass. The frontend and full 3D assets are unchanged. Current-build mobile latency, Lighthouse and source37 capacity have not been measured successfully; they must not be described as passing.

This checkpoint is prepared for `main` with those limits documented. Commit/push and remote equality are verified separately at delivery. This report does not certify a defect-free product or completion of the remaining performance targets.

## What changed

- Profile confirmation clears before paint on actual account changes, preserving early native `DELETE` input during initial loading. The reproduced WebKit race and original course/reset scenario have passing regressions.
- Complete typing checkpoints avoid a redundant live snapshot. Bounded immutable target metadata covers issued 800-word passages. Existing metrics, timing, JSON order and public immutability remain unchanged in the declared differential checks.
- Arena reuses locked member rows within one transaction, with write/error/rollback invalidation. It defers unused evidence-service allocation while retaining native prepared statements, rate limits, clocks and independent authoritative replay.
- The new source37 change releases raw JSON and replaces only existing client `characters`, `timeSeries` and `cursor` values with `null` after complete JSON decoding. The validator regenerates them before canonical output/persistence. Metric claims and unknown fields remain intact, and existing key positions preserve canonical JSON order.

The last change passed [113 semantic comparisons](../audit/2026-11-10/full-payload-semantics-result.json), including 30 full-finish/persistence projections, rejection ordering, Unicode, malformed JSON and invalid metric claims. An independent [source review](../audit/2026-11-10/full-payload-index-independent-review.json) confirms the exact change boundary.

The [24-process diagnostic](../audit/2026-11-10/full-payload-cpu-result.json) measured retained PHP memory of approximately **8.57 MB → 5.35 MB per representative request**, with a modest validation CPU reduction. It was a small isolated diagnostic under limited resources, not an HTTP capacity pass. All compared canonical raw JSON, property order, hashes and authoritative replay results matched.

## Source and evidence identity

The [source37 manifest](../audit/2026-11-05-followup/final37-source.json) binds 506 source files to baseline `9b21e255ea1840508cbc35b625d0ccde8f3af7cc`. Default frontend build: **`d89f84d74519bf2bbae0`**, with 133 published offline assets / 2,964,860 bytes.

The [frontend reuse proof](../audit/2026-11-10/source37-frontend-artifact-reuse-proof.json) verifies all **468 frontend source hashes** and **142 default artifact hashes** unchanged from source36. All 21 protected brand sources and original emitted scene checks remain unchanged. Vercel build `3d4bcb5f0a0a855c09f8` and Pages build `0319f2c5735dc794eed5` retain their verified published bytes. The proof explicitly qualifies historical extra-file metadata; it does not invent an old complete static hash map.

Audit folder dates identify continuing checkpoints. Each receipt contains its actual UTC execution time; this report uses the client's Asia/Calcutta date. Older failures, partial runs and setup corrections remain preserved.

## Verification table

| Page, feature or department | Status | Test performed / result |
| --- | --- | --- |
| TypeScript, lint, content and dependencies | PASS-SCOPED, FRESH37 | All [12 source commands](../audit/2026-11-05-followup/final37-source-gates.json) exited zero. Zero lint errors; nine existing warnings. Recorded production dependency audit: zero reported vulnerabilities. |
| Typing engine | PASS-SCOPED, FRESH37 | 2,883 unit tests / 115 files passed. PHP replay: 560 unique / 578 executed candidates, zero mismatches. Metric formulas and corrected-attempt costs are retained. |
| Arena pure contracts | PASS-SCOPED, FRESH37 | Complete 1,175-check Arena suite passes, including the actual index-routing contracts. |
| New request-memory behavior | PASS-SCOPED | 113 raw-body semantic cases, 30 finish projections and 24 isolated CPU/allocation samples; exact canonical output and rejection comparisons. No actual SQL persistence claim is made by this pure probe. |
| Native Arena backend | PASS-SCOPED 32/32, FRESH37 | [Assessment](../audit/2026-11-11/source37-native-arena32-assessment.json): original 29 HTTP lifecycle checks plus full finish/chart/history/retry. Source/config guards match; three fixture accounts and sessions removed; Apache/database shutdown graceful, no forced stops or residual PIDs. |
| Full client browser coverage | PASS-SCOPED REUSE | [Recovered source36 coverage](../audit/2026-11-09/source36-functional-recovery.json): all 65 specs, 1,495 passes / 29 explicit skips / zero failures. Three original closed batches plus a separately completed final 32 after interruption; not one uninterrupted rerun. Exact unchanged frontend proof permits client evidence reuse. |
| Home/test modes and results | PASS-SCOPED CLIENT REUSE | Time, words, quote, code, custom, zen, completion/export, caret, correction and result contracts are covered. Correct submitted words lock; previous incorrect words can reopen. |
| Learn and structured course | PASS-SCOPED CLIENT / FRESH PURE PHP | Adaptive practice, 36 lessons, progression, locked previews, save ordering, full 30-second assessment, reload/reset and first-character timing are covered. |
| Race, bots and games | PASS-SCOPED CLIENT REUSE | Feature batch 204/204; includes original arcade modes, local isolation, offline behavior, bot pace and Arena fixtures. Practice starts on the first qualifying character; live human races retain their shared clock. |
| Keyboard and Keyboard Lab | PASS-SCOPED CLIENT REUSE | Wrong-key feedback, press ownership, focus/blur/restart, layouts/fonts, narrow/desktop geometry and rotation are covered. Literal WebKit viewport sizes have the qualification below. |
| Stats, Profile, progression, settings and Studio | PASS-SCOPED CLIENT REUSE | History, account boundaries, confirmation, durable guest reset, appearance persistence, imports and focus contracts are covered. |
| Friends and classroom | PASS-SCOPED CLIENT / FRESH PURE PHP | Existing owned-fixture and pure PHP contracts pass. Production deployments, providers and moderation remain outside this evidence. |
| About, metrics, privacy, terms, 404 and PWA | PASS-SCOPED CLIENT REUSE | Routes, semantics, offline/cache/update recovery and blocked-storage behavior are included in the retained client coverage. |
| Native account/human races | SCOPED SOURCE36 REUSE | [20/20 native cases](../audit/2026-11-09/native20-assessment.json) passed across four fresh backends with graceful cleanup. Exact original 20 credential-skip pairs were mapped to these passes. Source37 changes only the Arena-submit branch; fresh actual-index contracts preserve the other routes. This is not a fresh37 native20 execution. |
| Frontend-only Vercel/Pages | PASS-SCOPED REUSE | Normal builds, 67 artifact checks, 56 deployment cases and 16 game accessibility cases passed across Chromium, installed Edge, Firefox and WebKit. Local practice works without PHP; accounts and human multiplayer require it. |
| Database/Deno CI and bundle budgets | PASS-SCOPED REUSE | Exact PGlite and three-entry Deno 2.9.8 commands passed on unchanged inputs. Default artifact bundle budgets pass; this is separate from hosted GitHub CI status. |
| Full 3D intro quality | PRESERVED | Protected source and emitted scene hashes match. Startup, teardown, returning visits and context-loss contracts are covered. No new GPU endurance or physical-device FPS claim. |
| Capacity | UNVERIFIED ON SOURCE37; PRIOR GATES FAILED | Source36 A-B-B-A full p95: 195.28 / 175.74 / 162.80 / 175.26 ms; all miss strict 150 ms. All 6,612 operations matched expectations. No source37 capacity pass is claimed. |
| Mobile typing latency / Lighthouse | NOT RUN ON CURRENT BUILD | All reserved trials remain unexecuted. Prior older-build scores are not relabeled as current results. Full-quality Lighthouse and both strict sub-100-ms typing assessments remain required. |
| Physical accessibility, browsers and hosting | UNVERIFIED | Real iOS/Android input and OS IMEs, actual Safari devices, screen readers, field INP, hosted TLS/cookies/providers and sustained distributed capacity require separate evidence. |

## Performance work that remains

The previous [controlled allocation comparison](../audit/2026-11-09/index-abba-resume-assessment.json) retains every phase and its failed latency gate. The lazy-service variant is descriptively lower in that run; this does not establish server-only causality. Startup/phase memory gates passed, while in-phase RAM dips and unavailable CIM observations remain disclosed.

The original load producer creates checkpoints synchronously inside its 20-worker HTTP pool before each request timer starts. Other actors' checkpoint work can therefore run while earlier HTTP timers are open. A separately declared [transport control](../audit/2026-11-10/transport-control-source37-readiness.json) is prepared to measure that interference, preserving exact request bytes, 400 requests and concurrency20. It is unexecuted and cannot substitute for Arena acceptance.

The user authorized resuming load/performance tests. Available RAM subsequently fell well below the declared **2 GiB** minimum, including approximately 0.6 GiB at resumption on 11 November. No load, mobile-latency or Lighthouse gate is lowered to work around that constraint. No unrelated application is closed, and no OS memory setting, database durability rule, rate limit, validation rule or 3D quality setting is changed.

When resources permit, remaining work is: run the transport control; execute source37 full/wire capacity with the original accounting and strict target; run all three mobile trials with both independent p98 assessments, all three home trials and all three normal first-visit full-quality Lighthouse trials. Input benchmarks isolate typing by disabling the intro in their test contexts; Lighthouse uses the full normal intro. This is a benchmark-scope distinction, not a product quality reduction.

## WebKit and broader limitations

The reproduced Profile input-erasure race is fixed. The old stackless timeout remains historical evidence; its original course/reset scenario and the new early-input regressions passed in complete retained coverage.

The [separate viewport diagnostic](../audit/2026-11-09/webkit-capture-diagnostic/result.json) observed WebKit requested390 → client334 and requested1440 → client1250, with DPR2.291667 despite requested2. Main/card bounds fit the effective viewport; no document horizontal overflow was established. Exact nominal390/1440 WebKit coverage is therefore **UNVERIFIED**, and host-DPI causality remains unverified. [Playwright documents viewport and device scale as emulation controls](https://playwright.dev/docs/emulation); the mismatch was measured rather than assumed to be an application CSS defect.

Nine WebKit audio/worker runner-capability cases remain explicitly skipped. Other known product gaps include configured OAuth/mail recovery, verified daily competition, complete localization and public Arena seasons/ELO. The [9 November report](RELEASE_AUDIT_2026-11-09.md) retains the wider feature ledger; this checkpoint does not erase its limitations.
