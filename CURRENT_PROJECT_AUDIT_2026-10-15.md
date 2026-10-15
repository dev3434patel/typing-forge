# Typing Forge Current Project Audit

**Audit date:** 15 October 2026, Asia/Calcutta  
**Project:** `D:\extra\typing_updated\typing-forge`  
**Branch and base commit:** `main`, `4aa8c32`  
**Assessment:** A substantial typing practice MVP with a working production build, but **not ready for a reliable public production release**.

The main release blockers are corrupt and duplicated test results, inconsistent timing, an unfinished code mode, learning progression that cannot introduce new letters, and weaknesses in race authorization and score integrity. These are concrete implementation issues. The older reports that describe the application as production ready do not describe the current verified state.

This audit covers the current working tree, including the seven source and test files already modified before the audit and the existing untracked accuracy tests. Product source was preserved. This report and its supporting evidence are the audit additions.

## Project understanding

Typing Forge presents itself in the interface as **Typing Master**. It is a browser application for measuring typing speed, practicing accuracy, learning letters, racing humans or simulated opponents, and reviewing personal performance.

| Area | Current implementation |
| --- | --- |
| Frontend | React 18.3.1, TypeScript, Vite 5.4.19 |
| Interface | Tailwind CSS, shadcn and Radix components, Lucide icons, Framer Motion |
| State and navigation | Zustand typing store, React Router 7.12.0, React context for authentication |
| Charts | Recharts |
| Backend | Supabase Auth, Postgres tables and row level security, Realtime race subscriptions |
| Validation | Zod for authentication and profile forms |
| Tests | Vitest 4.0.18 and Playwright 1.57.0 |
| Repository size | 128 files under src, approximately 21,101 nonblank source lines including tests and generated types |
| Test and database assets | 14 unit test files, 6 browser test files with 25 declared tests, 9 SQL migrations |

The application is a Vite single page application. No application server or score validation endpoint is implemented in this repository. A React Query provider exists, but the principal data flows use direct Supabase queries in components and hooks.

The regular test flow is:

1. The Zustand store holds mode, settings, target text, typed text, and timestamps.
2. TypingArea handles input, live metrics, completion, and keystroke logging.
3. Index creates a separate professional report.
4. useTestResults recalculates some metrics and saves local history.
5. Signed-in results also write test sessions and update leaderboard aggregates from the browser.

Learning uses its own component state and local character storage. Racing uses another component state implementation and direct database updates. The separately tested race state machine is not imported by the race page. This separation is a major reason isolated engine tests do not establish that the actual user flows are correct.

## Feature inventory

| Route or capability | What exists | Audit assessment |
| --- | --- | --- |
| / timed tests | 15, 30, 60, and 120 second choices, options for numbers and punctuation, HUD, results | Present, but completion and timing need repair |
| / words | 25, 50, 100, and 200 word choices | Present; live accuracy and stored duration are misleading |
| / quote | Local quotes with author and category | Present; completion corruption reproduced |
| / code | Five language choices and local snippets | Target entry works; completion is missing |
| / zen | Minimal display and a Finish control after ten words | Present; capped at the initially generated text and shares completion problems |
| / learn | Character confidence, focused lessons, letter panel, results | Present; progression remains stuck at eight starting letters |
| /stats | Summaries, streaks, speed charts, key charts, calendar, filters | Substantial UI; several data claims and filters are incorrect |
| /leaderboard | Speed, accuracy, consistency, and test rankings; daily and weekly filters | Browser-controlled aggregates; time filtering does not calculate period rankings |
| /profile | Overview, test history, character data, race history, preferences | Implemented behind sign-in; preferences and data sources are inconsistent |
| /auth | Email and password sign-in and signup with client validation | Form present; logged-out profile redirect verified; full authenticated flow not exercised |
| /race and /race/:roomCode | Create and join rooms, bots, countdown, progress, results | Implemented but substantial lifecycle, authorization, and timing defects remain |
| Unknown routes | NotFound component | Route configured; production host fallback was not verified |

The code has useful foundations: reusable interface primitives, unit-tested pure calculation utilities, local guest history, basic form validation, indexes and uniqueness constraints, ownership policies for private test records, and a later migration restricting race reads. These should be retained while repairing the integration paths.

## Verification results

| Check | Result | Evidence |
| --- | --- | --- |
| npm run build | **Passed**, 34.36 seconds | Build warnings and bundle sizes in [build output](D:/extra/typing_updated/typing-forge/audit/2026-10-15/build.txt) |
| npm run test:run | **Failed**: 231 passed, 10 failed, 241 total; 4 of 14 files failed | [Full unit output](D:/extra/typing_updated/typing-forge/audit/2026-10-15/unit-tests.txt) |
| npm run lint | **Failed**: 28 errors and 14 warnings | [Lint output](D:/extra/typing_updated/typing-forge/audit/2026-10-15/lint.txt) |
| npx tsc --noEmit -p tsconfig.app.json | **Failed**: 19 diagnostics, involving incompatible keystroke types in tests | Diagnostics summarized below |
| npx tsc --noEmit -p tsconfig.node.json | **Passed** | This configuration covers vite.config.ts, not the application |
| npx playwright test --list | **Blocked** before test discovery | Missing lovable-agent-playwright-config |
| npm run test:coverage -- src/lib/__tests__/typing-engine.test.ts | **Blocked** | Missing @vitest/coverage-v8 |
| npm audit --json | **36 affected packages**: 1 critical, 28 high, 7 moderate | [Full dependency audit](D:/extra/typing_updated/typing-forge/audit/2026-10-15/npm-audit.json) |
| npm audit --omit=dev --json | **23 affected packages**: 1 critical, 18 high, 4 moderate | [Production dependency classification](D:/extra/typing_updated/typing-forge/audit/2026-10-15/npm-audit-production.json) |
| Targeted engine probes | Confirmed timing divergence, blocked letter progression, and nonfinite lowest WPM | [Probe results](D:/extra/typing_updated/typing-forge/audit/2026-10-15/engine-probes.json) |
| Local browser inspection | Confirmed completion corruption, repeated completion callbacks, missing code completion, and mobile access problems | [Observation summary](D:/extra/typing_updated/typing-forge/audit/2026-10-15/check-summary.json) |

A supplementary run excluding the slow bot file produced 218 passes and 9 failures out of 227 tests. It is saved as [supplementary unit results](D:/extra/typing_updated/typing-forge/audit/2026-10-15/unit-tests-without-bot.json); the full 241-test run above is the primary result.

The ten full-suite failures consist of eight expectations for a 99.99 percent backspace cap that the current implementation intentionally removed, one empty-input accuracy disagreement, and one bot mistake-probability assertion. The bot probability test alone took approximately 405.8 seconds. These failures include contract and test-design problems; they should not all be interpreted as ten independent user-facing defects.

### Browser evidence

A quote test began with the Nelson Mandela quote and its correct first character T. The HUD displayed **1.12 percent accuracy** for that correct character because the untouched remainder was included in the denominator.

After entering the complete original quote, the completion handler ran three times, at 14:31:28.773, 14:31:28.805, and 14:31:28.835 UTC. The displayed target changed to a Harold Abelson quote. The settled report showed:

- **100 percent accuracy**
- **3 correct characters**
- **86 incorrect characters**
- **2 missed characters**
- **0 recorded keystrokes**
- **98.88 percent error rate**

The statistics page then showed three lessons and ninety seconds of activity after that one completion. The console reported an accuracy mismatch of 96.7 percentage points. This is direct evidence of a broken completion pipeline, rather than a rounding discrepancy.

In code mode, entering the full displayed JavaScript snippet left the test running with 100 percent accuracy and no completion screen. Bulk input was accepted and briefly displayed 720,000 WPM.

At a 390 by 844 viewport, the main navigation disappeared without a replacement menu, and the mode selector overflowed the screen. A separate logged-out visit to /profile correctly redirected to the sign-in form.

## Finding priorities

**P1 High:** Fix before public release; affects correctness, integrity, or authorization.  
**P2 Medium:** Fix for dependable feature behavior and maintainability.  
**P3 Low:** Resolve documentation and product completeness issues.

**Evidence labels:** Browser reproduced, engine reproduced, source confirmed, and deployment dependent. Database findings describe the committed migration chain; the deployed database was not inspected.

There are **35 findings: 10 high, 22 medium, and 3 low**.

## High priority findings

### F01 Completion changes the target and saves multiple results

**P1 High — Browser reproduced**

[TypingArea at line 84](D:/extra/typing_updated/typing-forge/src/components/typing/TypingArea.tsx:84) regenerates target text and clears keystrokes for both idle and finished status. Its separate [completion effect at line 288](D:/extra/typing_updated/typing-forge/src/components/typing/TypingArea.tsx:288) depends on those same mutable values. It therefore runs again as completion resets the data.

[Index at line 81](D:/extra/typing_updated/typing-forge/src/pages/Index.tsx:81) can overwrite report accuracy without changing its character counts, error analysis, or assessment. This compounds the corruption and explains the contradictory 100 percent report.

**Repair:** Freeze an immutable session snapshot before finishing. Generate new text only when starting or resetting a test. Finalize and persist a session once, using a stable session ID and a database uniqueness guard. Remove the percentage override.

**Acceptance:** One completed test creates exactly one local record and one cloud record; the target, keystroke log, displayed metrics, and saved metrics agree.

### F02 Timed WPM excludes the time after the last keystroke

**P1 High — Engine reproduced and source confirmed**

[computeSessionMetrics at line 224](D:/extra/typing_updated/typing-forge/src/lib/metrics-engine.ts:224) measures duration between the first and last keystrokes. It receives no session deadline or actual finish timestamp. A user who types briefly and then waits through the remaining timed test can receive a score calculated from only the typing burst.

The probe entered ten correct characters over one second in a thirty second test. The canonical engine returned **120 WPM**; calculating over the full test returned **4 WPM**. The professional report accepts a separate duration and returned 4, so even the two final calculation paths disagree.

The live HUD also uses a memoized elapsed time whose dependencies do not include a clock tick, allowing WPM to remain stale while the user pauses.

**Repair:** Pass authoritative session start and finish timestamps into one metric calculation. Use the deadline for timed tests and update live elapsed time independently of typing.

### F03 Code mode cannot complete

**P1 High — Browser reproduced**

The [completion condition at line 276](D:/extra/typing_updated/typing-forge/src/components/typing/TypingArea.tsx:276) covers words and quote mode. Code mode has no timer, no inclusion in that condition, and no Finish control. The input stops growing at the target length, leaving a completed snippet in running status indefinitely.

**Repair:** Include code mode in the intended completion contract and verify every language through an actual input-to-result test.

### F04 Learning cannot introduce any new letters

**P1 High — Engine reproduced**

[Lesson generation at line 300](D:/extra/typing_updated/typing-forge/src/lib/keybr-engine.ts:300) strictly limits targets to unlocked letters. [Progress updates at line 170](D:/extra/typing_updated/typing-forge/src/lib/keybr-engine.ts:170) only unlock characters present in practiced metrics. No operation introduces the next locked letter into a lesson.

After ten perfect, fast lessons, the probe still had only **a, e, i, n, o, r, s, t** available and **18 letters locked**. The engine reported h as next but never made it available.

**Repair:** Separate introduced letters from mastered letters. When the current set reaches the chosen threshold, explicitly introduce the next letter and include it in future lessons.

### F05 Leaderboard scores are controlled by the browser

**P1 High — Source confirmed and deployment dependent**

[useTestResults at line 120](D:/extra/typing_updated/typing-forge/src/hooks/useTestResults.tsx:120) directly inserts computed scores and writes leaderboard totals. The [initial leaderboard policies at line 125](D:/extra/typing_updated/typing-forge/supabase/migrations/20260112190721_53980950-5de5-4ad8-87b3-363ab88b497e.sql:125) permit users to insert and update their own aggregate values.

Ownership checks prevent writing another user's row; they do not establish that a score is genuine. No deployed validation handler is present. verifyMetrics exists only as an unused library export. Comments describing these browser calculations as server authoritative are inaccurate.

**Repair:** Restrict aggregate writes to a controlled database function or backend. Validate session identity, timing, metric bounds, and replay behavior, and derive leaderboard values there. Treat client keystroke logs as untrusted input too.

### F06 Race policies do not protect individual fields

**P1 High — Source confirmed and deployment dependent**

The [progress policies at line 11](D:/extra/typing_updated/typing-forge/supabase/migrations/20260112195233_30e84053-274e-4d7b-a11e-2fd6f53ef710.sql:11) contain expressions such as host_id = host_id and opponent_wpm IS NOT DISTINCT FROM opponent_wpm. These compare a value to itself. They do not compare the old and new records, so they cannot enforce the stated requirement that identity and opponent statistics remain unchanged.

The [host management policy at line 11](D:/extra/typing_updated/typing-forge/supabase/migrations/20260112195838_f15b4374-e640-484c-b853-b1e7d11f0358.sql:11) repeats this pattern.

**Repair:** Use narrowly scoped database operations and explicit OLD versus NEW validation in triggers where required. Test host, opponent, unrelated user, and anonymous access, including attempted changes to the other participant's fields.

Supabase documents that USING checks existing rows and WITH CHECK checks resulting rows; it does not turn a self-comparison into a previous-value guard. See the [official row level security reference](https://supabase.com/docs/guides/database/postgres/row-level-security).

### F07 The multiplayer lifecycle does not match the database policies

**P1 High — Source confirmed and deployment dependent**

[Race countdown at line 129](D:/extra/typing_updated/typing-forge/src/pages/Race.tsx:129) changes local UI state to racing without persisting an active status. Joining writes countdown. The opponent progress policy requires an active row, so normal opponent progress can be blocked.

[Race finalization at line 271](D:/extra/typing_updated/typing-forge/src/pages/Race.tsx:271) submits completed status. None of the final UPDATE policy checks permit a resulting completed row: host management allows waiting, countdown, or active, while progress policies require active. The winner trigger does not remove those restrictions.

**Repair:** Implement the complete waiting-to-countdown-to-active-to-completed lifecycle in controlled database operations, including cancellation and timeout handling. Add database tests against the complete migration chain.

### F08 Race finalization uses stale component state

**P1 High — Source confirmed**

The [race timer at line 107](D:/extra/typing_updated/typing-forge/src/pages/Race.tsx:107) depends only on status and captures the finishRace function from the start of racing. That function initially sees empty typed text and initial opponent statistics, so timeout results can use those stale values.

The [typing handler at line 398](D:/extra/typing_updated/typing-forge/src/pages/Race.tsx:398) calls setTypedText and then finishRace in the same event. finishRace reads the previous render's text, potentially excluding the final character.

**Repair:** Finalize from explicit current input and timestamps, or a current session ref. Ensure timer completion uses that same snapshot and is idempotent.

### F09 Signup stores email addresses as broadly readable usernames

**P1 High — Source confirmed and deployment dependent**

The [current signup trigger at line 14](D:/extra/typing_updated/typing-forge/supabase/migrations/20260112193515_c5a2e5f1-914c-4d56-a567-a4febdf06ede.sql:14) stores NEW.email as the profile username. It ignores the username sent in signup metadata.

The [profile read policy at line 5](D:/extra/typing_updated/typing-forge/supabase/migrations/20260112202820_6c0a35f1-976e-478b-9408-63db6356f5ea.sql:5) allows all authenticated users to read profiles. If these migrations are deployed, registered users can access email-valued usernames, and the signed-in leaderboard can display them.

**Repair:** Use a validated handle or generated non-email name, migrate existing email-valued usernames, and expose only intended public profile fields. Guest leaderboard reads should use a safe public identity source.

### F10 Dependencies include a critical development server advisory

**P1 High — Registry scan confirmed**

The installed graph reports 36 affected packages. Vitest 4.0.18 is flagged for a critical advisory involving arbitrary file access and execution when its UI server is listening. The project includes a test:ui script. This condition is described in the [Vitest maintainer advisory](https://github.com/vitest-dev/vitest/security/advisories/GHSA-5xrq-8626-4rwp).

Vite 5.4.19 and React Router 7.12.0 also appear in the audit. Some router advisories concern SSR or RSC features that this BrowserRouter application does not use; the scan does not prove those attacks apply here.

**Repair:** Upgrade affected direct dependencies and their transitives through reviewed changes, then repeat the project checks. Move test tooling out of runtime dependencies. Assess each advisory's actual use path; do not apply a forced dependency rewrite without compatibility checks.

The counts are affected package entries, including propagated transitive findings. They are not 36 separately demonstrated exploits in the public app. The omit-dev result still includes test tooling because Vitest and Playwright are declared as dependencies.

## Medium priority findings

### F11 Live accuracy measures completion in several modes

**P2 Medium — Browser reproduced**

[TypingArea at line 191](D:/extra/typing_updated/typing-forge/src/components/typing/TypingArea.tsx:191) counts every untouched target character as missed unless the mode is time. A perfectly typed first character of an 89-character quote therefore displays 1.12 percent accuracy.

**Repair:** Measure live accuracy against attempted characters. Keep completion percentage separate. Apply missing-character penalties only at the appropriate finalization boundary.

### F12 Accuracy policy disagrees across code tests and interface text

**P2 Medium — Source and test confirmed**

The current canonical function permits 100 percent after correcting errors. Eight existing assertions still require a 99.99 percent cap, the start overlay says Backspace = accuracy penalty, and existing audit documents describe different contracts.

An empty non-time report also returns 0 percent while the no-keystroke canonical branch returns 100 percent.

**Repair:** Decide the product definition once, document it, and align live display, final reports, persistence, tests, and interface guidance. A final-text accuracy policy is a valid choice; inconsistent application of that policy is the defect.

### F13 Stored practice duration uses a setting instead of actual elapsed time

**P2 Medium — Source confirmed**

[Index at line 94](D:/extra/typing_updated/typing-forge/src/pages/Index.tsx:94) saves settings.duration for regular tests even in words, quote, and zen modes. [The database insert at line 123](D:/extra/typing_updated/typing-forge/src/hooks/useTestResults.tsx:123) stores that value as duration_seconds.

A quote taking 46.2 seconds can therefore count as thirty seconds of practice. This distorts total practice time and calendar activity.

**Repair:** Persist actual elapsed duration, with the configured time limit stored separately.

### F14 Cloud write failures can be silently treated as success

**P2 Medium — Source confirmed**

Most writes in [useTestResults](D:/extra/typing_updated/typing-forge/src/hooks/useTestResults.tsx:120) and race progress/finalization await Supabase query results without checking their error property. A try/catch does not handle ordinary returned errors unless they are explicitly thrown. The hook can return a local result even when cloud persistence failed.

**Repair:** Inspect every write result, report synchronization status, and provide an idempotent retry path. Do not update aggregates after a failed session insert. Supabase's [insert documentation](https://supabase.com/docs/reference/javascript/insert) shows errors as part of the returned result.

### F15 Leaderboard aggregate updates are not atomic

**P2 Medium — Source confirmed**

[useTestResults at line 134](D:/extra/typing_updated/typing-forge/src/hooks/useTestResults.tsx:134) reads existing totals and then replaces them from the browser. Concurrent completions or browser tabs can lose updates. A session insert and aggregate update can also succeed independently. Deleting a session has no corresponding aggregate rebuild in the repository.

**Repair:** Derive aggregates transactionally on the database side. Establish a reconciliation operation for existing totals and session deletion.

### F16 Race progress and completion can reward incorrect text

**P2 Medium — Source confirmed**

[Race at line 433](D:/extra/typing_updated/typing-forge/src/pages/Race.tsx:433) calculates progress from input length. At line 456 it finishes when that length reaches the target, even if the text is incorrect. Finalization forces progress to 100 even for timeout completion.

This differs from the metrics engine's correct-character progress function and can produce a winner who did not correctly finish the passage.

**Repair:** Define race completion and timeout ranking explicitly, calculate progress from that definition, preserve actual timeout progress, and enforce the same rule in the backend.

### F17 Multiplayer duration and countdown are not shared reliably

**P2 Medium — Source confirmed**

raceDuration is local component state. The create request does not store a duration, and joining clients keep their own default. The database has no duration field in the reviewed migrations.

Although countdown_started_at exists, the page starts a new local three second interval when it receives the event instead of deriving a shared deadline. Reloading an active room resets startTime to now.

**Repair:** Persist duration, countdown deadline, and start/end times. Derive every client's display from those shared timestamps, including reconnects.

### F18 Learning discards mistakes and frequently restarts its sampler

**P2 Medium — Source confirmed**

[KeybrLessonMode at line 268](D:/extra/typing_updated/typing-forge/src/components/keybr/KeybrLessonMode.tsx:268) rejects wrong characters before logging them; accepted keystrokes are always marked correct. Character accuracy therefore cannot represent the rejected attempts used to judge learning.

The [sampling effect at line 90](D:/extra/typing_updated/typing-forge/src/components/keybr/KeybrLessonMode.tsx:90) recreates its one second interval whenever typedText changes. Continuous typing faster than once a second can repeatedly reset the timer and leave WPM history empty, producing a default consistency score.

**Repair:** Record all attempts independently from accepted text, and use a stable sampling timer reading current refs.

### F19 Local learning progress is shared across accounts and not restored from cloud data

**P2 Medium — Source confirmed**

[The learning engine at line 158](D:/extra/typing_updated/typing-forge/src/lib/keybr-engine.ts:158) uses one keybr_character_data storage key. Regular history similarly uses one typingmaster_history key. Signing out does not partition or clear these account-derived histories.

The learning engine reads local state, while the profile reads character_confidence from Supabase. No cloud-to-local learning hydration exists. Another account in the same browser can inherit progress, and the same account on another device can start over despite having cloud records.

**Repair:** Namespace account and guest data, define guest-history migration, and synchronize one canonical learning state across devices.

### F20 Statistics filters do not match the saved data

**P2 Medium — Source confirmed**

[Stats at line 87](D:/extra/typing_updated/typing-forge/src/pages/Stats.tsx:87) filters mode names using includes(contentType). The selector emits quotes, but records use quote, so that selection excludes quote results.

The language selector updates state but does not affect the query or filtered data, and saved sessions do not contain the selected language. The default Letters label actually shows all test modes.

**Repair:** Use explicit mode identifiers, persist relevant dimensions, implement language filtering, and make the default label reflect its actual scope.

### F21 Personal history is presented as a global comparison

**P2 Medium — Source and browser confirmed**

[calculatePercentile at line 204](D:/extra/typing_updated/typing-forge/src/lib/stats-utils.ts:204) compares a user's average speed against that same user's sessions. The displayed text claims to compare the user with all other people. The histogram is likewise generated from personal sessions.

The daily and weekly leaderboard filters use updated_at on lifetime aggregates, so an old personal best can appear as a daily best merely because the user completed a test today.

**Repair:** Label personal distributions accurately or calculate anonymized population statistics. Build period rankings from sessions within the period.

### F22 Character charts display constructed history as measured progress

**P2 Medium — Source confirmed**

[Stats at line 129](D:/extra/typing_updated/typing-forge/src/pages/Stats.tsx:129) sets last, top, and average key speeds to the same current local value and creates a one-point history. Its key-progress chart repeats that current value across earlier lessons.

Session per_char_metrics is not populated by the saveResult insert. Key views read local data even for signed-in users, while other panels use cloud sessions.

**Repair:** Save actual per-session character measurements and calculate historical charts from them. Hide unsupported historical views until real data exists.

### F23 Saved theme and target speed preferences do not control behavior

**P2 Medium — Source confirmed**

[ProfileSettings](D:/extra/typing_updated/typing-forge/src/components/profile/ProfileSettings.tsx:120) stores the target WPM and theme. App always adds dark mode. Learning and character saving use a hard-coded 35 WPM threshold, and stats charts also use 35.

**Repair:** Load and apply preferences through a shared configuration context, including confidence calculations, unlock thresholds, charts, and theme.

### F24 Mobile users lose navigation and some mode controls

**P2 Medium — Browser reproduced**

[Header at line 49](D:/extra/typing_updated/typing-forge/src/components/layout/Header.tsx:49) hides navigation below the medium breakpoint and supplies no mobile menu. The mode controls sit in a non-wrapping row whose content exceeds a narrow screen.

At 390 pixels wide, Race, Stats, and Leaderboard navigation were absent and the mode row clipped controls at both ends.

**Repair:** Provide mobile navigation and an intentionally wrapping or horizontally scrollable mode selector. Verify access at narrow widths, including focused control visibility.

### F25 Keyboard handling traps normal navigation

**P2 Medium — Source confirmed**

[TypingArea at line 580](D:/extra/typing_updated/typing-forge/src/components/typing/TypingArea.tsx:580) intercepts Tab globally while a test is not finished. Learning does something similar. This blocks normal keyboard movement through navigation and controls. Local and global listeners also handle the same bubbling events.

The hidden typing inputs have no accessible name; several icon-only links and controls are unnamed.

**Repair:** Limit shortcuts to the typing area, offer a way to leave it, avoid duplicate handling, and label every input and icon control. Add focus and screen-reader checks.

### F26 The quality gates are incomplete and currently failing

**P2 Medium — Command confirmed**

The build runs Vite without TypeScript checking. The application configuration disables strict typing and several useful checks. The explicit application check reports nineteen errors: eighteen object literals pass key to the learning Keystroke type, and one test passes a professional Keystroke array whose optional isCorrect is incompatible with the required learning field.

Playwright's configuration and fixture import an undeclared package. Coverage names a provider that is not installed. No CI workflow exists in the repository.

**Repair:** Define a shared keystroke contract, repair the test setup, add a typecheck script, and make build, types, lint, unit tests, and meaningful browser tests release gates. Adopt stricter TypeScript settings incrementally.

### F27 Existing browser tests can pass without exercising the claimed behavior

**P2 Medium — Source confirmed**

[typing-test.spec.ts at line 90](D:/extra/typing_updated/typing-forge/e2e/typing-test.spec.ts:90) supplies expected metric values when extracting results fails and makes cross-page assertions conditional on finding matching text.

[race-mode.spec.ts at line 33](D:/extra/typing_updated/typing-forge/e2e/race-mode.spec.ts:33) accepts a button count greater than or equal to zero. The auth redirect test writes a mock sessionStorage token that is not a real Supabase session and accepts either the auth page or home.

**Repair:** Require deterministic targets, actual completion, exact persisted-record counts, and real assertions about rendered metrics. Use isolated authenticated test fixtures and two separate clients for races. Missing expected UI should fail a test.

### F28 Storage failures have no recovery boundary

**P2 Medium — Source confirmed**

[getTestHistory at line 139](D:/extra/typing_updated/typing-forge/src/lib/typing-engine.ts:139) and getCharacterData parse storage without validation or exception handling. Writes do not handle quota or blocked storage errors. Local saving happens before cloud saving.

Malformed history can break the statistics or learning flow; a local write failure can prevent the later cloud write. No application error boundary provides a recoverable fallback.

**Repair:** Validate stored schemas, recover safely from corrupt data, handle storage exceptions, and add an application error boundary with a useful recovery path.

### F29 Every route ships in a large initial JavaScript bundle

**P2 Medium — Build confirmed**

The build emits one JavaScript asset of **1,407.01 kB**, **400.41 kB gzip**, plus **71.25 kB CSS**, **12.43 kB gzip**. [App](D:/extra/typing_updated/typing-forge/src/App.tsx:9) eagerly imports every page, including chart-heavy statistics and profile screens.

**Repair:** Split routes with lazy loading and separate expensive chart/report features. Measure startup and input responsiveness on a mobile device after reducing the bundle. The audit measured bundle output, not Core Web Vitals.

### F30 All-zero speed history produces a nonfinite report metric

**P2 Medium — Engine reproduced**

[Professional accuracy at line 453](D:/extra/typing_updated/typing-forge/src/lib/professional-accuracy.ts:453) applies Math.min to WPM history after filtering out zeros. A history of [0, 0] leaves an empty array, producing Infinity.

**Repair:** Check the filtered array before calculating a minimum and validate all numeric report fields, including nested fields.

### F31 Bot timing and probability checks do not describe the same model

**P2 Medium — Source and test confirmed**

Bot correction records are stamped in the future but their correction and retyped text are applied immediately inside simulateKeystroke. The interactive scheduler does not wait for the recorded correction sequence.

The failing probability test counts every noncorrect event, including backspaces, against the configured typo probability. It also busy-waits on real performance.now for twenty races, consuming approximately 405.8 seconds.

**Repair:** Model correction events on a consistent timeline, define separate typo and correction rates, inject a clock and seeded randomness, and make simulation tests deterministic and fast.

### F32 Longer timed tests can exhaust their target text

**P2 Medium — Source confirmed**

[TypingArea at line 105](D:/extra/typing_updated/typing-forge/src/components/typing/TypingArea.tsx:105) always generates two hundred words for a timed test. A user typing faster than one hundred words per minute can exhaust that target during a two minute test. The [time-mode input path at line 497](D:/extra/typing_updated/typing-forge/src/components/typing/TypingArea.tsx:497) permits more input but does not extend the displayed target, so subsequent characters are counted as extras and reduce accuracy.

**Repair:** Extend the target before the user reaches its end, preserving completed text and word boundaries. Verify sustained fast input for the longest advertised duration.

## Lower priority findings

### F33 Repository guidance does not describe the current project

**P3 Low — Source confirmed**

README still contains the default Lovable template and a replacement project ID. Multiple existing audit reports make conflicting accuracy and production-readiness claims. The package name is still vite_react_shadcn_ts, while the repository, interface, and reports use different product names.

There is no environment example, Node version declaration, deployment runbook, or documented database setup. Both npm and Bun lockfiles exist without a stated package-manager policy. The tracked .env contains browser Supabase configuration, and .gitignore does not exclude ordinary .env files.

**Repair:** Establish one current README and architecture/metric contract, identify old reports as historical, document setup and deployment, and choose a lockfile policy. Provide a safe environment example and protect future private environment files. Supabase publishable keys are intended for browser use; their presence alone is not evidence of a leaked service-role secret.

### F34 Content metadata and some programming examples are inaccurate

**P3 Low — Source confirmed**

The commonWords1000 list contains **1,234 entries but 929 unique words**. Repetition changes selection probabilities, and the name/comment implies a different dataset. The active quote source contains twenty local quotes despite another database-backed quote helper.

Several Python examples place compound statements on invalid single lines, such as the class, try/except, and decorated-function samples. They are typeable strings but poor examples of valid Python.

**Repair:** Deduplicate or document intentional weighting, identify the canonical content source, and validate programming examples. The older claim that the list has only 210 words is no longer accurate.

### F35 Some visible controls are unfinished

**P3 Low — Source confirmed**

[The Share button at line 599](D:/extra/typing_updated/typing-forge/src/components/typing/ProfessionalResultsScreen.tsx:599) has no action. Footer social links point to #.

**Repair:** Implement the controls or remove them until they have useful behavior.

## Operational and implementation observations

The build reports a CSS ordering warning because the Google Fonts import appears after Tailwind statements in index.css. Move the import to a valid position or use an appropriate font link and verify the actual font request.

Production builds retain extensive per-character diagnostic logging, including typed and target samples. Replace this with opt-in development diagnostics and concise operational events. Several fetch flows also turn failed queries into empty results without a visible error, making an outage resemble missing user data.

Stats fetches have no pagination, while profile history is limited to one hundred sessions. Local history is also capped at one hundred. These different windows need explicit labels and an aggregate strategy so larger histories do not produce contradictory totals.

The repository contains no production host configuration for SPA fallback, security headers, cache policy, monitoring, or deployment rollback. A successful local Vite build establishes that assets can be packaged; it does not verify those production concerns.

Zen mode generates a fixed two-hundred-word target and rejects input beyond its length. If unlimited practice is intended, the target must extend or the mode must permit open input.

## Recommended repair sequence

### Phase one restore trustworthy results

1. Fix F01 using one immutable completion snapshot and one stable session ID.
2. Fix F02 and F13 using explicit session timing and actual elapsed duration.
3. Complete code mode and settle live versus final accuracy semantics.
4. Repair letter introduction and preserve rejected learning attempts.
5. Add browser regressions for one completion, one save, paused timed tests, corrections, code completion, and letter progression.

**Completion criteria:** A user can finish every advertised typing mode; the HUD, results, history, and stored values agree; repeating a completion request cannot duplicate a result.

### Phase two enforce backend integrity

1. Rebuild race updates around controlled state transitions and field ownership.
2. Verify race policies with host, opponent, unrelated authenticated user, and anonymous roles.
3. Persist shared race timing and fix timeout and final-character snapshots.
4. Move leaderboard calculation to a transactional controlled path.
5. Migrate email-valued usernames and check the safe public identity view.
6. Check every database error and expose retryable synchronization status.

**Completion criteria:** Both race clients see the same start and finish; invalid transitions and opponent-field changes are rejected; fabricated aggregate writes are denied; failed saves are visible and retryable.

### Phase three complete the product and release checks

1. Upgrade vulnerable tooling and dependencies with compatibility verification.
2. Repair TypeScript, lint, coverage, browser configuration, and weak tests.
3. Add CI with mandatory checks and database policy tests.
4. Correct statistics labels, filters, and historical charts.
5. Apply preferences and restore learning state consistently across accounts/devices.
6. Fix mobile navigation, keyboard access, route loading, and unfinished controls.
7. Replace template documentation with setup, metric contracts, and deployment procedures.

**Completion criteria:** The project passes its documented checks from a clean install, core browser flows have meaningful assertions, and a staging deployment passes production configuration and accessibility checks.

## Release acceptance checklist

- [ ] One test produces exactly one persisted session.
- [ ] Completed target text and keystrokes remain unchanged during result generation.
- [ ] Accuracy, character breakdown, and error counts agree.
- [ ] Timed scores use the complete elapsed test duration, including pauses.
- [ ] Words, quote, code, zen, and learn modes have verified completion behavior.
- [ ] Learning introduces new letters and records incorrect attempts.
- [ ] Cloud save failures are visible and retry safely.
- [ ] Score aggregates cannot be edited arbitrarily by clients.
- [ ] Race transitions, timing, progress, completion, and reconnect behavior pass two-client tests.
- [ ] Database policy tests cover anonymous, unrelated user, host, and opponent roles.
- [ ] Profile identities do not expose email addresses through public display fields.
- [ ] Types, lint, unit, browser, and coverage commands work from a clean installation.
- [ ] Relevant dependency advisories are resolved or their nonapplicability is documented.
- [ ] Mobile navigation and ordinary keyboard navigation work.
- [ ] Production routing, headers, caching, monitoring, and rollback are verified in staging.

## Scope and limitations

The review combined repository inspection, the complete unit suite, lint and compiler checks, a production build, current dependency registry scans, local browser interactions, mobile viewport inspection, and isolated engine probes.

The browser checks ran as a guest against the local application. They exercised guest local history and changed test data only in the audit browser's local origin. No account was created, no authenticated cloud write or destructive operation was performed, and no deployed policy change was made.

The migration findings require comparison with the actual deployed schema before claiming that a live service has the same policy state. No direct production database inspection, authenticated multiplayer session, email delivery test, load test, Lighthouse measurement, or production hosting/header test was completed.

The existing modified product files were preserved. Audit artifacts live in this report and the [evidence directory](D:/extra/typing_updated/typing-forge/audit/2026-10-15). Engine probes can be repeated with `node audit/2026-10-15/engine-probes.mjs` from the repository root. Their storage is isolated to that Node process.

The practical recommendation is to treat the project as an MVP under active development. Repair result integrity and backend enforcement first; visual polish and additional features should follow those foundations.
