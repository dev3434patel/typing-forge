# SparowType mobile, games and static deployment audit

Work began on 20 October 2026 and continued on 21 October in Asia/Calcutta. Final web build: `e4d36e64f41584da25a9` (after6). Baseline: `7f5214eec1843304c7a0`, committed as `dcf4580`. Receipts are in `audit/mobile-games-static-2026-10-20/`; private configurations and raw browser trace archives are excluded from Git.

## Responsiveness

The input profile found native layout measurement and repeated React passage/keyboard work. Physical key press/release observation now lives inside the keyboard guide. Moving the measured caret writes its own CSS properties rather than scheduling another session render. Clock ticks reuse an immutable alignment projection until an edit or target extension invalidates it; timing and rates still refresh. Final results and server validation reconstruct canonical evidence independently. ASCII input avoids unnecessary `Intl.Segmenter` iteration; CR and Unicode retain canonical segmentation. No input debounce, dropped-event filter, metric shortcut or simulated speed increase was introduced.

Race and Ranked now refresh their route clock only during an actual countdown. Untimed game play has no idle presentation timer, and the decorative game scene updates only when a gate changes. The existing controller still measures active time from a monotonic clock.

The approach follows [React's memoization guidance](https://react.dev/reference/react/memo) and [Google's guidance on interaction work and layout](https://web.dev/articles/optimize-inp/). These sources explain the mechanisms; the measurements below are local evidence, not a claim made by those sources.

Three runs were declared before collecting each baseline/candidate series, with fresh profiles, settled fonts and finite animations, zero driver delay, 4× CPU throttling and a real portrait-to-landscape resize halfway through 495 inserted characters. All runs are retained; there were no automatic retries or score filtering. The following table describes the first integrated checkpoint `79afcab63fc1f50e68d1` (after1); final-build confirmation is recorded separately.

| Measurement | Baseline runs | Candidate runs |
| --- | --- | --- |
| Observed typing-event p98 | 128 / 120 / 120 ms | 80 / 80 / 72 ms |
| Observed event maximum | 304 / 384 / 312 ms | 136 / 136 / 120 ms |
| Exact retained text | 495 / 495 characters in every run | 495 / 495 characters in every run |
| Input accuracy for the assigned text | 100% in every run | 100% in every run |
| Rotation retained the exact prefix | Yes, all runs | Yes, all runs |
| Page errors / document overflow | None | None |

The median p98 decreased from 120 to 80 ms. The candidate met the sub-100 ms p98 goal in all three runs. This does not mean every event takes under 100 ms or that a physical phone has been certified. Event Timing is thresholded and quantized; it is not a field INP measurement.

A separate predeclared, single-run-per-workspace mobile/touch emulation checked that after1 checkpoint with unchanged clocks, fresh contexts and 4× CPU throttling:

| Workspace | Typed units | Event p98 | Observed maximum | Correctness |
| --- | --- | --- | --- | --- |
| Adaptive Learn | 125 | 80 ms | 152 ms | Exact exported text and attempt count; 100% assigned-input accuracy |
| Guided course | 59 | 80 ms | 104 ms | Exact exported text and attempt count; 100% assigned-input accuracy |
| Local bot | 100 | 72 ms | 168 ms | Exact exported prefix and attempt count; 100% assigned-input accuracy |
| Signal Run | 101 | 24 ms | 32 ms | All 18 gates; exact attempts; no raw game text stored |

There were no page errors, console errors or horizontal overflow in those four runs. Individual worst-case spikes still exist. Native Android/iOS soft keyboards, OS autocorrect, candidate windows, assistive technology and field INP remain unverified.

## Full 3D introduction

Fifteen of the 16 non-test files under `src/components/brand/` match the prior commit after newline normalization. The deliberately changed bridge terminates a cancelled, not-yet-ready worker synchronously after recording disposal intent. Ready scenes retain their disposal acknowledgement and 200 ms watchdog. Geometry, materials, lighting, camera choreography, postprocessing, renderer tiers and quality thresholds were not reduced. The opening route helper also gained base-path handling for project hosting.

Three declared fresh-profile mobile Lighthouse runs at the after1 checkpoint used the normal first-visit introduction, with no quality override, intro skip, reduced-motion override, score filtering or automatic retry.

| Run | Performance | Accessibility | Best practices | SEO | LCP | TBT |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 98 | 100 | 100 | 100 | 2.266 s | 8 ms |
| 2 | 98 | 100 | 100 | 100 | 2.268 s | 13 ms |
| 3 | 98 | 100 | 100 | 100 | 2.117 s | 19 ms |

CLS was approximately 0.000252 in each run. These are local Lighthouse 13.5.0 measurements, not guaranteed hosted scores. The rendering scene, bloom and Three.js chunks are byte-identical between static targets/checkpoints. The bridge comparison separately normalizes its changing bootstrap import filename; it is not falsely described as raw-byte identity.

## Games and input details

[Signal Run research and design](GAMING_RESEARCH_2026-10-20.md) records verified primary sources and deliberate differences from other typing games. The implementation is an original local word-gate journey, with three stages, 18 gates, calm and 60-active-second modes, native input, IME, pause/resume, clean gates and separate local bests. It does not publish game WPM or verified rankings. Original wrong attempts remain in accuracy after correction. Assisted, empty and manually ended runs cannot create a local best.

Fresh storage reads and owner-specific storage events protect a better local best from an older tab. Same-document workspace clears discard game memory too. Exports sanitize game summaries and explicitly select the owner, including workspaces with games but no typing sessions. Workspace reset and acknowledged account deletion remove the matching game key. Other owners' data is preserved.

Adaptive practice now preserves `insertReplacementText` as autocorrect assistance, so a native replacement cannot acquire fabricated physical-key latency or qualify as an unassisted assessment. The existing focus preference is honestly labelled for adaptive support panels. Full correction, native input, focus and caret behavior remain covered by the regression suite.

## Frontend-only hosting

[Deployment commands and hosting guide](FRONTEND_DEPLOYMENT.md) describe root Vercel and GitHub Pages project/account/custom-domain builds. Static commands compile API transport off, including when a developer environment contains an API URL. Local tests, adaptive practice, course checkpoints, bots, games, history, statistics, preferences, export and installed offline practice remain available. Accounts, ranked challenges, public server rankings and human rooms clearly require a server.

GitHub Pages receives actual supported-route directory entries, a correct router/asset base, scoped service worker/cache, font paths, manifest, recovery links and metadata. Unknown URLs retain a real HTTP404. The manual Pages workflow uses five verified official Action pins; no extra deployment token or database secret is required. No external deployment was performed.

Final static artifacts: Vercel `58cb916b8e935b5513e1`; GitHub Pages `f1ad3223c9b023efde27`. Their after5 functional acceptance passed 40/40 checks across Chromium, installed Edge, Firefox and WebKit with no retries, page errors, API calls, external requests or out-of-base requests. Four full-default axe cases supplied 12 ready/playing/completed readings across both targets at 390 and 1440 px, with zero violations. Asset/base/privacy checks passed 28/28, and 97 distinct focused deployment/PWA/transport/plugin checks passed across eight files. The 229-file static source snapshot was unchanged during acceptance. Fresh guest screenshots at the preceding checkpoint were visually reviewed at 390 and 1440 px. This is automated and visual browser acceptance, not full WCAG or native-device certification. Earlier after1 and after4 receipts were copied and hash-recorded before final outputs were replaced.

The final after5 game screenshots were also visually inspected at 390 and 1440 px. Normal full-page scrolling is available; physical soft-keyboard viewport behavior remains a separate device limit.

A controlled nonsecret canary exposed development-file access to private storage under Vite's default rules. The repair preserves all four installed default deny patterns and adds six narrowly scoped private configuration/storage/hosting-output patterns. All eight tested normal/query/encoded/`@fs` canary URLs then returned HTTP403 without the marker. Eleven path-policy checks passed, while the public course catalog and an isolated `/api` proxy fixture still returned HTTP200. Real credentials or account files were never requested. Vercel's Permissions-Policy was restored and 14 response-configuration assertions passed; actual provider-delivered headers remain unverified.

## Engineering gates

The initial eight sequential gates passed: app/node/domain/portable TypeScript; ESLint; coverage; isolated historical PostgreSQL/WASM compatibility; content; native PHP replay; native PHP course qualification; and production dependency audit. That first checkpoint had 948 unit tests. After the final startup and owner-readiness fixes, TypeScript, lint and full configured coverage were rerun: 992 tests passed. The final source-gate receipt is `checks-final-source-summary-20261020T194153Z.json`. Unchanged native replay/course, content, historical SQL and dependency checks retain their earlier timestamped receipts; they are not presented as newly executed final-source runs.

| Gate | Result |
| --- | --- |
| Unit suite | Final post-fix 992 tests across 70 files passed |
| Configured coverage | 92.13% statements, 89.31% branches, 93.25% functions, 96.94% lines; thresholds passed |
| ESLint | Zero errors; nine existing Fast Refresh warnings |
| Native PHP replay | 520 cases, zero mismatches; 495 accepted references and 25 expected rejections |
| Native PHP course | 139 cases, zero failures; 122 accepted and 17 expected rejections |
| Portable historical SQL | Isolated compatibility assertions passed |
| Content | 20 unique examples verified |
| Production dependency audit | Zero reported vulnerabilities |
| Production build / gzip budgets | Passed; 101 public offline files, 2,613,001 bytes; initial practice JS 146,845 gzip bytes, deferred intro 168,001 gzip bytes |

## Verification boundaries and retained findings

Initial static history assertions expected `75%`; the correct product output was `75.0%`. Those test expectations were fixed and their failing receipt retained. A consumed `Response` in a new CacheStorage test double was fixed to clone like the browser API. Full Playwright collection then exposed a genuine plain-Node import failure in the deployment helper; guarded environment access and a subprocess regression fixed it. The guard compiled to the same tested public artifact. No failure receipt was removed to improve reported results.

The initial broad browser attempt was interrupted after 200 observed cases: 192 passed, four failed, four backend opt-ins skipped; the other 864 cases were not completed. Three failures exposed laptop keyboard clipping with an update banner. The compact single-row desktop navigation repair passed a separate 108-case confirmation across all four engines. One native startup-reload case observed a 1205.5 ms shutdown delay. Its unchanged quiet confirmation passed, but that did not erase the failure: pending startup cancellation was then changed to terminate in the same task, with nine bridge units and strengthened native instrumentation. A separate game review fixed same-value replacement assistance without inventing attempts; three added regressions bring the final unit count to 953.

PHP packaging initially hit a transient Windows `EPERM` while publishing a fully copied staging directory. The stage was preserved and safely published after the lock cleared. The helper now retries only the same atomic rename for bounded Windows permission/busy errors; it never merges packages or deletes a destination. A fresh package then passed lint and a 110-file public-byte comparison, with 134 packaged files and no local configuration or storage. This packaging-only script change does not change the tested web assets.

The first live PHP acceptance setup was blocked: the configured database account returned SQLSTATE 42000 before creating a dedicated audit database. No grants, application schema, user data or rate counters in the user's existing instance were changed; no test fell back to that application database.

A separate approach then initialized a wholly new, non-service MariaDB instance in an ignored audit directory, on fresh loopback ports, with its own schema, DML-only app account, session namespace and synthetic fixtures. Real PHP HTTP/PDO acceptance passed 15 data checks, 10 course checks, 10 race checks and password-policy checks. Three initial ephemeral readiness attempts exposed a new harness mistake (`Response.ok` is a boolean in Node fetch); that was fixed before the successful run. Those failed-attempt receipts remain available. These are actual local API/database checks, distinct from browser API fixtures, physical human input and destination-host acceptance.

Automatic approval review rejected deletion of two stopped failed-attempt directories, reporting only “blocked by policy.” They remain private and ignored under `backend/storage/mobile-games-instance-a259364bf1489e3a` and `backend/storage/mobile-games-instance-461ff9ad9d349a88`. Their processes are stopped; they contain no user data. The original PHP/MariaDB listeners remain at their original process identities and are not used by the new tests.

Hosted Vercel/Pages deployment, remote Actions execution, DNS/TLS, destination production database/account/multiplayer acceptance, native screen readers, physical mobile keyboards and field performance remain **UNVERIFIED**. Competitive server-issued rooms/challenges retain their existing strict correction contract. Guest imports and browser data remain subject to origin/storage boundaries described in the deployment and privacy guides.

Email delivery, email verification, password recovery and OAuth integration are **NOT IMPLEMENTED** in the existing PHP backend. They need a configured mail/provider service, as described in the [backend setup guide](PHP_XAMPP_SETUP.md). No working third-party login or recovery flow is advertised. Signal Run currently supplies one English, solo, three-stage game with local unverified records; it does not supply multiplayer games, cloud game sync or evidence of educational effectiveness. Neither automated accessibility scans nor browser-input fixtures establish full WCAG conformance or every installed IME's behavior.

The complete after4 ordinary browser sweep retained 868 outcomes: 833 passed, 19 failed, 16 backend opt-ins skipped and zero flaky results. Chromium and installed Edge each passed all 213 enabled cases; Firefox had six failures and WebKit thirteen. Startup and protocol waits are not presumed to have a shared cause. The old isolated group was interrupted before its first reported case so that its full execution could target the final after5 artifact instead; its uncompleted protocol and short log remain intact.

One deterministic dependency defect was repaired: unrelated routes such as Auth and Stats no longer wait for the unused home-page chunk. The actual home route retains concurrent App/Index preparation; shared loading and retry behavior remain. Six focused loader units cover caching, rejection retry and root/project-subpath route selection. A browser regression blocks the real home chunk, checks independent account/history access, then verifies that Home actually encounters the blocked asset as a positive control.

ESLint now ignores generated static/hosting builds, hosting archives/staging directories and private backend storage. All application and test source remains included. The previous slow gate completed successfully and is retained; a separate final gate after the ignore change also passed. No interrupted gate or source exclusion was invented.

The after5 serial confirmation passed all 19 original ordinary failures, including the real uninterrupted 30-second checkpoint. Its complete outcome was 33/34: a separate Chromium accessibility scan sampled Auth's entry fade rather than the final painted colors. The test-only settlement helper now waits two actual frames before collecting finite browser animations and checks the real Auth panel's final opacity when Framer drives it with JavaScript. Animations and contrast assertions remain enabled. Affected all-page checks then passed 8/8, covering 19 page/result states at each of two widths in four engines. Both receipts remain distinct; no runtime contrast change was needed.

A later real PHP account check progressed beyond sign-in and successful server-backed result saving, then found the lesson preview again after Start. Source review found a shared reachable initial-owner race: local guest data could become ready before cookie authentication, allowing practice to start before the required owner-key remount. Deterministic delayed-account and delayed-guest checks failed against the old artifact as expected; their snapshots show an interactive test/lesson while identity was unresolved. They do not establish the exact scheduling of the earlier native failure.

The repair is central in `AccountWorkspace`: owner-scoped interactive routes mount after initial authentication settles. Actual later owner changes retain the existing privacy reset. Public information/auth/ranking pages remain available during that check. Backend-disabled builds bypass it immediately, preserving frontend-only startup; a failed PHP session read still falls back to guest operation through the existing bounded request behavior. This avoids starting and then discarding Test, adaptive, course, game, bot or keyboard-lab controllers under a provisional guest identity. Thirty-three component tests cover route aliases, case/encoding/trailing slash behavior, dynamic rooms, public routes, stable owners and the backend-disabled bypass. Their tests are part of the 992 total; they are outside the configured business-logic coverage percentage denominator.
