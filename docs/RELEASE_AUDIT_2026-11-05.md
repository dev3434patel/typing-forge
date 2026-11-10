# SparowType verification — 5 November 2026

**PARTIAL — functional verification in progress; load tests on hold at the user's request.** The current source fixes a reproduced Profile confirmation-field race in WebKit and removes redundant checkpoint and Arena work. All 12 source checks passed, followed by a disclosed test-only portability correction and a passing complete Arena confirmation. The current-build Profile regression passed 8/8 across Chromium, installed Edge, Firefox and WebKit. The full 65-spec browser matrix is running serially with no retries. No current-build mobile latency, Lighthouse or capacity pass is claimed. Commit and push to `main` remain pending the paused verification.

The [source manifest](../audit/2026-11-05-followup/final36-source.json) binds 506 source files to baseline `9b21e255ea1840508cbc35b625d0ccde8f3af7cc`. The default frontend build is `d89f84d74519bf2bbae0`, with 133 published offline files and 2,964,860 bytes. Receipt timestamps use UTC; the report date uses Asia/Calcutta. Earlier evidence and failed attempts remain preserved under their original names.

## Changes and evidence

| Change | Verification | Practical limit |
| --- | --- | --- |
| Profile confirmation now clears before paint on an actual owner transition. The history-loading effect cannot erase an early `DELETE` entry. | The instrumented reproduction recorded native input followed by erasure on the same connected, focused WebKit input. The same eight diagnostic cases passed after the fix; the permanent current-build regression passed 8/8 across four engines. | This fixes the reproduced race. It does not retrospectively establish a missing stack trace for the earlier unexplained 60-second timeout. |
| Complete checkpoint publication avoids the redundant live snapshot and freezes primitive character records directly. | Existing unit contracts and a 150-case differential check preserve exact JSON, metrics, timing, replay, errors and immutability. | Lower CPU cost in an isolated diagnostic does not establish end-to-end HTTP latency or mobile INP. |
| Factory-owned target metadata covers up to 8,192 graphemes and 1,024 words. | Boundary, mutable-array, Unicode and complete 800-word checkpoint contracts pass. | The strong target map retains 16 entries. External callers may keep older immutable targets alive; the metadata bound is per target. |
| Arena reuses a locked member snapshot within one transaction and invalidates it on writes. | Differential contracts and physical database-lock checks preserve full-row locking, clocks, error behavior and independent replay. | No cross-request cache or reduced validation is introduced. Capacity remains above target. |
| Arena allocates evidence services only on routes that need them. | Genuine-autoload checks and actual index control-flow comparisons preserve strict error order, non-Arena responses, full finish validation and commit control flow. | Native current-source account and finish/history acceptance still require separate execution. |
| Full-quality 3D opening preserved. | All 21 protected brand source files and five emitted scene-quality checks match the protected reference. Frontend build reuse from source35 to source36 is byte-verified. | No new physical-device FPS, GPU endurance or performance score follows from identity checks. |

The [Profile diagnosis](../audit/2026-11-05-followup/webkit-profile-input-erasure-assessment.json), [fix assessment](../audit/2026-11-05-followup/profile-layout-fix-assessment.json), [current Profile run](../audit/2026-11-05-followup/final36-profile-current-window.json), [core differential](../audit/2026-11-05-followup/checkpoint-differential-result.json), [backend freeze](../audit/2026-11-05-followup/source36-lazy-services-freeze.json) and [frontend identity proof](../audit/2026-11-05-followup/source36-frontend-build-reuse-proof.json) retain their individual scopes. Overlapping suites are not added into a fabricated total.

## Verification ledger

| Department | Status | Test performed and result |
| --- | --- | --- |
| TypeScript, lint and dependencies | PASS-SCOPED | All commands in the [12-check gate](../audit/2026-11-05-followup/final36-source-gates.json) exited zero. Lint retains nine existing warnings and zero errors; the recorded production dependency audit reports zero vulnerabilities. |
| Typing engine and input contracts | PASS-SCOPED PURE TESTS | 2,883 unit tests in 115 files passed. Coverage: 90.52% statements, 86.69% branches, 92.12% functions and 96.15% lines. Full browser input, correction, composition and first-character timing acceptance is pending the matrix. |
| PHP metric and replay authority | PASS-SCOPED PURE TESTS | 560 unique candidates and 578 executed rows produced zero mismatches, including full canonical, checkpoint and chart projections. |
| PHP Arena contracts | PASS-SCOPED WITH DISCLOSED TEST REVISION | The original 12-check run passed 1,175 Arena checks. A subsequent test-only missing-storage portability correction was followed by a complete [1,175/1,175 confirmation](../audit/2026-11-05-followup/source36-arena-storage-confirmation.json). The original gate is retained; it was not rerun after that test edit. |
| Course, progression, classroom, social and race clocks | PASS-SCOPED PURE TESTS | The separate PHP contracts in the 12-check gate passed. Practice retains first-character start; live human races retain the shared authoritative clock. Hosted behavior is not certified by these tests. |
| Profile reset and owner changes | PASS-SCOPED BROWSER TESTS | Eight permanent cases passed across Chromium, installed Edge, Firefox and WebKit, without failures, skips or retries. Source, build and all 73 guarded test dependencies stayed unchanged. |
| Full browser coverage | RUNNING | All 65 specs are scheduled exactly once across four engines, one worker and zero retries. Native-credential and capability skips must remain explicit. |
| Home/test and results | PENDING MATRIX | Current-source end-to-end coverage is running. Earlier-build scores and passed fixtures are not relabeled as current acceptance. |
| Learn and structured lessons | PENDING MATRIX | Includes existing progression, weak-key practice, correction, save/reset and first-input contracts. Physical mobile keyboards remain unverified. |
| Race, local bots and Arena | PENDING MATRIX / NATIVE | Fixture-based functional coverage is running. Fresh native account/human-race and finish/history checks remain separate. |
| Signal Run and eight arcade modes | PENDING MATRIX | Includes game input, owner isolation, offline behavior and first-input contracts. Local game scores do not certify competitive results. |
| Live keyboard, layouts and Keyboard Lab | PENDING MATRIX | Viewport, physical press ownership, wrong-key feedback, layout and caret contracts are included. Hardware-model and finger-placement detection are not claimed. |
| Stats, progression, friends and classrooms | PENDING MATRIX | Local and owned-fixture flows are included. Full production moderation, competition and classroom deployment remain unverified. |
| Settings, Studio, themes and sound | PENDING MATRIX | Persistence, imports, focus and appearance contracts are included. Real hardware audio and assistive technology require physical checks. |
| About, privacy, terms and 404 | PENDING MATRIX | Route and semantic checks are included. Production origin and hosted deep routes remain unverified. |
| Accessibility and responsiveness | PENDING CURRENT-SOURCE ACCEPTANCE | Browser geometry, focus and semantics are included. Separate static accessibility checks and physical screen-reader/device checks remain outstanding. |
| SEO, PWA and frontend-only deployment | PENDING CURRENT-SOURCE ACCEPTANCE | Separate root/subpath builds and local deployment correctness checks remain to run. No backend is required for local guest practice; account sync and human multiplayer still require PHP. |
| Dedicated native lifecycle/browser and legacy CI acceptance | PENDING | Fresh owned account/human-race and finish/history acceptance, plus exact PGlite/Deno CI commands, remain separate scheduled work. The capacity trial already exercised native Apache/PDO/MariaDB operation accounting. |
| Mobile typing latency and Lighthouse | ON HOLD / UNVERIFIED | No current-build measurement is claimed. Historical 97/96/96 Lighthouse scores and prior sub-100-ms typing results belong to the earlier build. The 3D quality inputs remain preserved. |
| Uncached/full-payload capacity | FAILED; FURTHER TESTS ON HOLD | The latest ordinary source36 trial measured full 333.1376 ms and wire 270.2455 ms p95, both above the unchanged strict 150-ms target. Functional operation accounting passed. |
| Security and privacy | PARTIAL | Replay, error-ordering, locking and declared source checks pass in their stated scopes. Hosted headers, cookies, TLS, provider configuration, penetration testing and physical device privacy behavior remain unverified. |
| Git delivery | PENDING | Current work is uncommitted. Commit/push to `main` is held pending the paused verification; no remote synchronization claim is made. |

## Capacity and the hold

The [source35 trial](../audit/2026-11-05-followup/source35-ordinary-capacity-trial1-assessment.json) measured full 166.6268 ms p95 (failed) and wire 140.5566 ms (passed after the full workload on the same owner). The [source36 trial](../audit/2026-11-05-followup/source36-ordinary-capacity-trial1-assessment.json) measured full 333.1376 ms and wire 270.2455 ms (both failed). These sequential, differently timed trials do not establish that the lazy allocation change caused the difference. Node-only evidence preparation also slowed during the later run. Each workload retained all 1,653 operations, 400 occupied seats, 400 accepted submissions and 400 accepted leaves, with zero unexpected statuses.

A frozen A-B-B-A diagnostic compares eager and lazy index allocation without changing validation, database durability, request concurrency or the target. Its initial entry stopped at the declared memory gate before creating services or sending requests. The exact rejected memory sample was not recorded; no byte value is invented. The subsequent explicit user instruction, **“Keep load tests on hold for now,”** prevents automatic resumption when memory changes. The [hold receipt](../audit/2026-11-05-followup/source36-current-state-user-load-hold.json) records the current state.

Capacity bursts, the A-B-B-A comparison, CPU-throttled mobile latency trials and Lighthouse remain paused. Functional tests continue serially. All previous failures remain evidence; no timeout, assertion, concurrency, threshold or 3D quality setting is relaxed to obtain a pass.

## Remaining work

1. Finish the current full functional matrix, preserve its actual failures and skips, and address any reproducible defects before a scoped confirmation.
2. Run separate native account/human-race, native Arena finish/history, root/subpath deployment, accessibility and exact database/Deno CI checks, one heavy job at a time.
3. When the user resumes load testing, run the frozen resource-guarded allocation comparison, resolve any supported cause, then execute the unchanged ordinary acceptance protocol. Run fresh mobile latency and full-quality Lighthouse trials separately.
4. Retain unverified capability gaps, physical Android/iOS input, OS IMEs, assistive technology, GPU endurance, field INP and hosted behavior as explicit limitations. Configured OAuth/mail recovery, verified daily competition, complete localization and public Arena seasons/ELO remain broader product gaps.
5. Review the final public evidence and source, exclude private configuration/runtime material, then commit and sync `main` once the release verification is resolved. Verify remote equality and a clean working tree separately.

The [4 November audit](RELEASE_AUDIT_2026-11-04.md) remains a historical release record. Its passes, failures and conditional OPcache result are not overwritten by this working report.
