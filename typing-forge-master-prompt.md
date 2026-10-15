# Typing Forge Premium Master Implementation Prompt

**Version:** 3  
**Research checked:** 15 October 2026  
**Project:** D:/extra/typing_updated/typing-forge  
**Scope:** Complete the existing typing platform through the ordered release gates below.

This entire document is a self-contained implementation prompt. Use it with the current repository and its current audit. The required product is an original Typing Forge experience combining fast tests, adaptive learning, useful results, coding practice, and dependable competition. Premium means clarity, precision, responsiveness, accessibility, and visual consistency.

**Continuation checkpoint, 16 October 2026:** substantial v3 implementation and the accuracy/Keyboard Lab follow-up are already in this working tree. Read [current implementation status](docs/IMPLEMENTATION_STATUS.md), [the accuracy upgrade](docs/ACCURACY_UPGRADE_2026-10-15.md), [pinned competitor research](docs/COMPETITOR_ACCURACY_RESEARCH_2026-10-15.md) and [remaining specification differences](docs/AUDIT_RESOLUTION_MATRIX.md) before continuing. Preserve existing metric versions, historical evidence and comparison cohorts. Continue the documented remaining gates rather than restarting completed phases or treating prior failed browser runs as passed.

## 1 Your assignment

Act as the staff engineer, product designer, and verification owner for this upgrade. Inspect the existing project, then implement the complete required scope in dependency order. Begin with baseline verification and result integrity.

Carry implementation through all required milestones. A plan, a new theme, a collection of mockups, or one successful phase is not completion of the whole assignment. Use checkpoints to make progress reviewable without abandoning unfinished requirements. If an external dependency blocks a check, complete independent work, record the exact blocker, and leave the affected requirement unverified.

Use the existing React, TypeScript, Vite, Tailwind, shadcn/Radix, Zustand, React Router, Recharts, Supabase, Zod, Vitest, and Playwright foundation. Upgrade supported versions when needed. Competitor technology choices do not justify a framework or database rewrite.

### Operating rules

1. Read repository instructions, the current audit, package scripts, migration history, and the working diff before editing.
2. Preserve existing user changes. Do not reset, clean, discard, or indiscriminately stage pre-existing work. Record the starting status and base commit.
3. Reuse working interface primitives and repair integration paths before adding parallel implementations.
4. Give every requirement an ID, prerequisite, implementation location, and meaningful acceptance evidence in docs/IMPLEMENTATION_STATUS.md.
5. Keep one versioned source for session replay and metric calculation. Components format outputs; they do not invent or override scores.
6. Preserve observed values. Derived averages, confidence models, and smoothed charts are legitimate when labelled; fabricated observations, fake histories, and unsupported population comparisons are prohibited.
7. Inspect returned errors from every database operation. A caught exception alone does not establish success.
8. Make completion and server side effects idempotent. Retries must not create another session or increment aggregates twice.
9. Build original code, visual assets, and content. Record third-party source and asset provenance; retain required notices for dependencies actually used.
10. Make small reviewable diffs. Do not push, publish, remotely reset a database, or apply production migrations merely because local implementation is complete.
11. Use the defaults in this specification for routine choices and document material decisions. Ask only when an unresolved choice prevents a correct implementation or an external action needs authorization.
12. Report commands actually run and their actual results. Passing a mocked browser test does not prove database authorization. Never mark a blocked check as passed.

The public name is **Typing Forge** throughout the interface and metadata. Preserve existing storage through an explicit migration from the older Typing Master names.

## 2 Research context and product direction

These are researched observations, followed by our product decisions. Repository observations are pinned to public source snapshots and may differ from the exact deployed competitor build.

### Competitor findings

| Reference | Verified lesson | Implication for Typing Forge |
| --- | --- | --- |
| Keybr | Guided training uses individual-key timing, a small alphabet, a focus key, and progression. Current source also contains tests, multiplayer, highscores, code lessons, and theme tools. | Learn from its feedback loop; do not claim that combining learning, tests, and races is unique. |
| Keybr learning | Current guided mode starts with at least six letters. Natural-word practice can be supplemented with phonetic words; confidence is a speed ratio, not the draft's capped speed-times-accuracy formula. | Use an explicit Forge mastery model with achievable thresholds and minimum evidence. |
| Monkeytype | Final raw WPM uses retained text, while attempt accuracy preserves corrected mistakes. Whole-word WPM credit differs from merely counting matching letters. | Separate final text quality, scored speed, insertion attempts, and corrections. |
| Monkeytype results | The source distinguishes cumulative speed, local burst, errors, save/eligibility states, and result-to-practice actions. | Give results a useful next action and unambiguous chart labels. |
| Typing.com | Its official product material includes adaptive problem-key practice, curriculum, tests, and games. | Adaptive practice is established competitive functionality. |
| TypingClub | Its official materials emphasize courses, alternative layouts, accessibility, replay, and progress. | Accessibility and structured learning belong in baseline quality. |
| Typing.io | Its official site focuses on practicing real programming character sequences. | Code mode needs valid syntax, indentation behavior, and separate comparisons. |
| TypeRacer and Nitro Type | Their public products foreground social typing competition. | Races need convincing interaction and trustworthy state handling, not just animated lanes. |

Sources and exact repository snapshots are in Section 20. Avoid copying competitor pages or claiming feature parity based only on marketing descriptions.

The earlier draft's “400+ Monkeytype themes” claim is not used. Its exact order-3 description of Keybr's generator is not treated as established. Current source counts and framework details are research observations, not feature-count targets for this project.

### Market interpretation

The useful opportunity is a cohesive **Test → Understand → Practice → Retest** workflow:

- A beginner can identify a weak key, practice it, and see evidence of improvement.
- An experienced typist can run a test immediately, configure the feel, and compare like with like.
- A programmer can practice syntax and punctuation without treating code scores as prose scores.
- A competitor can enter a clearly defined race and understand why a result is eligible.

These are positioning hypotheses, not proof of an uncontested market or willingness to pay. Premium experience does not authorize adding billing, subscriptions, adverts, or paywalls.

Google Trends Explore returned HTTP 429 during this research. No search volumes, growth percentages, market shares, or market-size figures have been established. Google Trends itself describes relative normalized interest, not absolute search volume.

For later demand validation, record one reproducible research sheet with:

| Comparison | Geography and window | Interpretation |
| --- | --- | --- |
| typing test, typing practice, touch typing | Worldwide, past five years and past twelve months, Web Search | Generic needs; inspect seasonality and terminology |
| monkeytype, keybr, typingclub, typing.com | Same geography, window, and search type | Brand interest; keep it separate from generic needs |
| Generic terms and local-language alternatives | A chosen target market, such as India, explicitly selected | Localization hypothesis; do not infer country demand from language alone |

Record export date, exact terms versus Topics, category, geography, and window with any CSV. Do not compare independently normalized charts as if they shared a scale. Review audience interviews and usability evidence before prioritizing monetization or school administration features.

A typing study of 168,000 volunteers found substantial variation in typing styles and meaningful letter-pair effects. This supports measuring actual input patterns; it does not prove that Forge's proposed coaching algorithm will improve everyone. Do not import research datasets into a commercial product without checking their stated usage terms.

### Product success measures

Instrument only after implementing reliable sessions. Establish a baseline before setting business targets.

- Activation: first completed test followed by opening results.
- Coaching engagement: result-to-practice launch and completion.
- Learning: change in median speed and accuracy across matched recent cohorts, with sample count.
- Retention: returning practice users, defined by actual completed sessions.
- Reliability: successful finalizations, duplicate side effects, failed saves, retry recovery.
- Experience: input responsiveness, navigation accessibility, mobile completion rate.

Use consent-aware, minimal events. Exclude raw typed text and detailed timing logs from ordinary analytics.

## 3 Existing project facts to verify again

Read CURRENT_PROJECT_AUDIT_2026-10-15.md and its evidence directory. The historical audit found:

- One quote completion triggered three calculations, regenerated the target, and produced contradictory results.
- Timed metrics used the interval between keystrokes rather than the whole timed session.
- Code mode never completed, and learning never introduced the remaining eighteen letters.
- Race lifecycle, field ownership, and client-controlled leaderboard writes were unsafe or inconsistent.
- Mobile navigation, statistics labels, preferences, persistence, and test setup needed work.
- The build passed; 231 unit tests passed and 10 failed; lint had 28 errors and 14 warnings; the application typecheck had 19 diagnostics.
- Browser-suite discovery and coverage were blocked by missing packages. The dependency audit contained affected development and runtime packages.

These are baseline observations from that audit, not results of your future implementation. Re-run checks and update the status ledger. Do not blindly preserve old assertions where the new documented metric contract intentionally supersedes them.

Do not silently rewrite legacy results into v3 results. Keep a legacy metrics version and provenance; recompute only when adequate original evidence exists. Quarantine known-corrupt or unverifiable records from ranked aggregates without deleting user history.

## 4 Required product scope

| Area | Required behavior |
| --- | --- |
| Test | Time, words, quote, code, prompted zen, and custom practice |
| Learn | Progressive letters, real attempt logging, weakness targeting, review, daily goals |
| Results | Trustworthy metrics, timeline, breakdown, useful insights, matched comparison, next actions |
| Statistics | Actual practice duration, history, distributions, calendar, per-key data, honest filters |
| Competition | Human rooms, public quick match, labelled bots, shared timing, verified completion |
| Account | Safe handle, preferences, cross-device learning, export, session deletion, account deletion |
| Appearance | Eight tested themes, dark/light/system, custom theme editor, readable type, caret controls |
| Input | Physical keyboards, composition-aware practice, visible assistance and eligibility rules |
| Localization | Versioned content packs and an accessible input/layout foundation |
| Operations | Reproducible builds, migrations, meaningful tests, diagnostics, deployment runbook |

Every visible control must work. Missing data produces a helpful empty state. A staged feature must remain unadvertised or explicitly marked unavailable until its gate passes.

The primary navigation is **Test, Learn, Race, Stats**, with Profile and Settings in the account menu. Keep existing route compatibility; / may remain the main test route. Add explicit Learn and Settings routes rather than hiding everything behind test-mode state.

Optional future experiments, outside required completion: school administration, payments, social chat, generative AI coaching, elaborate cosmetic economies, and large funbox catalogs. Do not implement these by default.

## 5 Architecture and ownership

Use clear domain boundaries. Adapt names to the existing repository without creating duplicate engines.

Suggested structure:

    packages/typing-core/
      types
      replay
      transcript
      clocks
      metrics
      samples
      eligibility
      fixtures
    src/features/test/
    src/features/learn/
    src/features/results/
    src/features/race/
    src/features/stats/
    src/features/settings/
    src/services/storage/
    src/services/sync/
    src/services/api/
    src/styles/
    src/content/
    supabase/functions/
    supabase/migrations/
    supabase/tests/
    docs/

The core is runtime-neutral TypeScript: no React, DOM, localStorage, Supabase client, wall-clock calls, randomness, or network requests inside pure calculations. Inject clock and seeded randomness into controllers and generators.

Data flow:

    Input adapter
      → normalized edit or attempt event
      → session controller and replayable transcript
      → canonical metrics and immutable finalized snapshot
      → results UI + local repository + authenticated submission queue

    Authenticated submission
      → validation Edge Function using the same core
      → one restricted database transaction
      → accepted result + updated aggregate versions
      → client reconciliation

Build and verify a real shared-module packaging path for both Vite and Supabase's Edge runtime. Prefer one private workspace source with a generated deployment artifact if required by bundling. Generated copies must carry a source hash and be produced automatically; no hand-maintained formula copies. Verify the Edge bundle, not just browser imports.

Keep the input loop local and immediate. Use the application store for session metadata and selectors; publish expensive HUD/chart derivations at a bounded rate. Do not prohibit store updates categorically or delay visible characters by one hundred milliseconds.

Separate:

- Session controller: lifecycle, input ownership, and finalization.
- Metrics core: replay and calculation.
- Learning engine: versioned per-key model and lesson generation.
- Persistence repository: versioned local data.
- Sync service: ownership, retries, and reconciliation.
- Race protocol: server-owned room and participant state.
- UI: presentation and user actions.

Use one Preferences provider backed by validated local defaults and account settings. Cloud features must fail gracefully; a missing or failed backend configuration must not blank the guest typing experience.

## 6 Versioned session and input contract

Create shared schemas for configuration, events, snapshots, results, storage envelopes, and API payloads. Validate at trust boundaries.

A finalized snapshot contains at least:

    schemaVersion
    metricsVersion
    learningVersion
    clientSessionId
    ownerScope
    mode and scoringPolicy
    configuration and comparisonKey
    language, script, keyboardLayout, inputMethod
    contentRevision, generatorVersion, seed or challengeId
    initialTarget and append-only issued target segments
    finalTranscript and finalText
    ordered normalized events
    startedAtWall and finishedAtWall
    elapsedMs and explicit pause intervals
    finishReason
    assistance flags and provisional eligibility
    content provenance and privacy classification

Events require a sequence number, monotonic session-relative offset, operation type, affected range or target slot, inserted text where applicable, input provenance, and composition-group identity where applicable.

Support insertion attempts, rejected attempts, range replacement, deletion, word submission/skipping, and composition commits. A backspace is an edit action, not an incorrect insertion attempt. Do not assume one change event equals one character.

The replay engine derives correctness and final text. Any submitted expected-character or correct boolean is a convenience field, not trusted evidence.

For prose, use word-aware target slots so a short or skipped word does not shift every later word against the wrong target position. Define expected punctuation and separators. For code, preserve exact logical characters and whitespace. Cover deletion into previous words, selections, replacements, extras, and incomplete final words with fixtures.

Attempt correctness is evaluated against the expected logical slot before applying the edit. An early space that submits an unfinished word is an incorrect insertion attempt when a letter was expected; remaining skipped slots become missed. A non-inserting navigation or submit action is not an insertion attempt. Specify these transitions in the transcript fixtures.

Finite targets remain immutable. Time and prompted-zen targets may append deterministic segments before exhaustion; previously issued text, target indexes, seed, and corpus revision never change. Finalization freezes the entire issued target and transcript deeply. Results never generate new content.

finish(reason, cutoff) must finalize at most once for a given session ID and return the same immutable result on repeated calls. Start a new session only through an explicit new-test or retry action. Do not implement finalization through an effect that repeatedly reacts to mutable text, and do not replace it with a stale status-only closure.

Retry same text preserves the exact target and configuration, creates a new session ID, and records repeated-content provenance. Next test generates new content. Both reset timers, logs, pending animation work, and error indicators.

## 7 Input timing and composition

### Timing rules

- Personal tests start on the first committed insertion attempt; rejected learning attempts also start practice time.
- Use monotonic elapsed differences locally. Store wall timestamps for ordering, not as the sole elapsed clock.
- A timed deadline is fixed. Stopping typing does not pause it.
- At timeout, elapsedMs is the configured duration even when callbacks render late.
- Inputs at or after the cutoff do not enter the finalized result. Test this boundary explicitly.
- Reconcile deadlines on visibility changes and suspended-tab return. Detect clock anomalies.
- Finite modes finish when their documented target-processing condition is met; errors may remain in a normal test result.
- Code mode must automatically finish after the entire target has been processed. Manual finish creates an explicitly partial practice result.
- Prompted zen continues by appending target segments and finishes through a visible button.
- Custom free writing is a separate practice variant: target accuracy, missed characters, and target-based WPM credit are not applicable.
- Ranked challenges and races use server-owned starts/deadlines. Personal first-input timing and server-ranked timing must not be conflated.
- Explicit pause is available only for personal practice. Record wall and active duration, show the pause, and exclude paused sessions from ranked cohorts.

For explicitly paused personal practice, elapsedMs is active duration: wall duration minus recorded explicit-pause intervals. Preserve original monotonic event offsets and derive an active-time mapping for speed, consistency buckets, and five-second windows. Inputs during an explicit pause are not scored. Daily goals and practice-time summaries use this active duration. Ordinary inactivity remains in active duration; stopping typing never removes time. Also display wall duration for paused sessions and keep their comparisons separate from unpaused tests. Test pause/resume boundary events and a pause longer than the test itself.

### Input implementation

Use beforeinput/input and composition lifecycle events with a tested fallback for noncancelable input changes. Do not count intermediate composition updates as final insertions or move the composing caret unexpectedly.

Use user-perceived graphemes for prose counts and display/backspace behavior. Record code points or UTF-16 offsets only where an adapter needs them, with explicit mapping. Use locale-aware segmentation and pin a reproducible segmentation policy for comparable scored results.

Normalize prose consistently to NFC. Preserve code content exactly except a documented CRLF-to-LF content preprocessing step before the session begins; never silently rewrite indentation or smart punctuation during scoring.

Practice permits IME and assistive input. Classify paste, drop, autocorrection, composition, and generated indentation explicitly. A multi-grapheme composition commit is legitimate input, not automatic evidence of cheating. Per-key latency is unknown when a group does not supply an attributable interval.

Ranked cohorts declare supported methods and assistance rules. Paste/drop restrictions use input provenance and visible messaging. Reject oversized payloads as a resource limit, not as a human-authenticity verdict. Do not impose the draft's universal three-character event ban.

Warm up the live speed display for the first second rather than presenting a meaningless huge number from a near-zero denominator. Never clip an actual measured result to 350 WPM.

## 8 Exact Forge metric contract

Implement **metricsVersion forge-v3** and document these choices in docs/METRICS.md. They are Forge's explicit policies; do not call them a universal typing standard or claim exact numerical parity with another site.

Keep full precision internally and in canonical persistence. Round only for presentation. No function may return NaN or Infinity; meaningful absence is null with a reason.

### Counts and speed

Maintain these separate quantities:

| Quantity | Meaning |
| --- | --- |
| correct | Final retained graphemes matching their assigned target slots |
| incorrect | Final retained graphemes replacing an expected slot incorrectly |
| extra | Retained graphemes without an assigned target slot |
| missed | Processed or skipped expected slots without typed content; include unprocessed remainder only for a finalized finite target |
| untyped | Untouched future target; not an error in an ongoing or timed test |
| correctAttempts | Correct committed insertion graphemes, including correct retyping |
| incorrectAttempts | Incorrect insertion graphemes, including rejected learning attempts and mistakes later deleted |
| deletionActions | Count of deletion operations, with deleted-unit count stored separately |
| retainedUnits | correct + incorrect + extra |
| insertionAttempts | correctAttempts + incorrectAttempts |

For prose WPM, define creditedUnits as all characters of correctly completed target words plus their actually entered following separators. A wrong submitted word receives no whole-word credit. At timed or prompted-zen finalization, the final unfinished word receives only its leading correct prefix. A completed final target word needs no artificial trailing space.

For code WPM, creditedUnits equals matching retained code graphemes, including actually entered required whitespace. Code uses a separate scoringPolicy and comparison cohort.

- wpm = creditedUnits / 5 / elapsedMinutes.
- rawWpm = retainedUnits / 5 / elapsedMinutes.
- attemptRate = insertionAttempts / 5 / elapsedMinutes.
- correctCharacterWpm = correct / 5 / elapsedMinutes, available in details when it differs from prose WPM.
- inputAccuracy = correctAttempts / insertionAttempts × 100.
- finalTextAccuracy = correct / (correct + incorrect + extra + applicable missed) × 100, labelled separately from inputAccuracy.
- progress uses processed expected slots for ordinary tests; race correct progress follows Section 11.
- durationMs preserves exact elapsed time, such as 46,200 ms.

Backspace and modifiers do not enter the inputAccuracy denominator. Correcting a mistake can restore perfect final text while inputAccuracy remains below 100 percent.

If elapsedMs is zero, speed is null. At a real timed cutoff with no input, speed is 0 and inputAccuracy is null. Free-writing practice displays raw/attempt rate; target accuracy and target-credit WPM are null.

### Time series consistency and burst

Produce cumulative WPM and cumulative rawWpm at explicit sample cutoffs. Keep local insertion rate as a separate series labelled “local typing rate” or “burst”; it is not the final rawWpm statistic.

Partition [0, elapsedMs) into one-second buckets, including all idle buckets. The final partial bucket retains its actual duration. Its local insertion rate is normalized by that duration.

Forge rhythm consistency uses duration-weighted population mean and standard deviation of those local rates:

    consistency = clamp(100 × (1 − standardDeviation / mean), 0, 100)

Return null if elapsed time is below five seconds, there are fewer than five insertion attempts, or mean activity is zero. Display the formula and version in details. This deliberately differs from Monkeytype's current nonlinear mapping.

Peak five-second attempt rate uses complete five-second windows, evaluated on a one-second grid plus the final window ending at the cutoff. Return null for sessions shorter than five seconds. Do not label a one-second estimate as a five-second burst.

A three-second moving average may be offered as a visual overlay. Preserve the measured series and label smoothing. It must not alter final metrics, peak calculation, comparisons, or saved results.

HUD and final results must use the same calculation at the same cutoff. The last stale HUD render need not equal a result finalized at a later cutoff.

### Mandatory golden vectors

| Fixture | Expected assertion |
| --- | --- |
| Ten eligible correct units in a thirty second timed test, typed during its first second | WPM 4; elapsed 30,000 ms; no removal of idle time |
| Target abc; attempts a, x, delete, b, c; final abc; thirty seconds | WPM 1.2; raw 1.2; attemptRate 1.6; inputAccuracy 75%; finalTextAccuracy 100% |
| Prose target cat dog; final cxt dog; thirty seconds | correct 6, incorrect 1; raw 2.8; word-credit WPM 1.2; details explain the difference |
| Timed target cat dog; final cat d; thirty seconds | creditedUnits 5; WPM 2; untouched tail is not missed |
| Thirty seconds, no attempts | WPM 0; inputAccuracy null; consistency null |
| Less than five seconds | Peak five-second rate and consistency unavailable |
| Only zero-rate buckets | No nonfinite metric; no invented 100% consistency |
| IME commit, accented canonical equivalents, Indic grapheme, emoji, Arabic | One replayed commit; no UTF-16 character-count inflation or duplicated composition |
| Repeated finish, retry, reload, duplicate delivery | One finalized local session and at most one accepted cloud effect |
| Code with spaces, tabs, newline, and a correction | Exact documented whitespace accounting and a code-specific cohort |
| Event exactly at deadline | Excluded from the finished result |
| Skip a word, then type the next correctly | Later target alignment remains correct |

Add seeded property tests for replay invariants, nonfinite output, malformed ranges, event order, deletion, empty inputs, and bounded long sessions. Do not replace behavioral tests with checks that copy implementation expressions.

## 9 Local persistence and synchronization

Use IndexedDB for session records, the queue, and richer history. Use localStorage for small validated preferences and migration markers only. Provide a safe in-memory fallback when storage is blocked or full.

Namespace by schema version and owner: guest, or the authenticated user ID. Never drain one account's queue using another account's credentials.

Required queue states: local-only, queued, syncing, synced, retryable-error, auth-required, rejected. Keep ranked review/eligibility state separate from save state. Preserve an in-memory result even if local persistence fails.

Every queued entry includes owner ID, client session ID, payload version, immutable payload hash, attempt count, retry timing, and error classification.

Private custom-text sessions remain local-only and do not enter an authenticated upload queue until the user explicitly chooses cloud storage for that content or has enabled an applicable saved preference. Sharing consent and cloud-storage consent are separate. The queue must enforce this rule, not just the Share dialog.

Use bounded exponential backoff with jitter for transient transport and server errors. Validation and authorization failures need explicit handling rather than endless retries. An expired login pauses that owner's queue.

Identical accepted retries return the existing canonical result. Reusing an idempotency key with different content is a conflict. A response lost after commit must not create a second effect.

Guest results are saved locally. Offer an explicit once-only import after sign-in; show scope, deduplicate by provenance, and keep imported/unverified results out of ranked comparisons.

Legacy migration must be restartable and nondestructive. Validate schemas, retain a recoverable backup until migration succeeds, and offer a scoped reset that explains which local data will be removed.

Cloud learning state must merge through accepted per-session evidence and a server version/sequence, not last-write-wins replacement of an entire stale character map. Reconcile devices and out-of-order delivery deterministically.

## 10 Supabase architecture and data integrity

Use the current schema as the migration starting point. Inventory actual deployed names and relationships. Do not invent leaderboard_entries or races if the existing tables are leaderboards and race_sessions without an explicit migration plan.

### Transactional submission

Implement a TypeScript validation Edge Function importing the canonical core. It authenticates the caller, validates size/schema/version, replays the transcript, checks the challenge where applicable, and computes the result.

Then call one restricted database operation that atomically:

1. Checks owner/session uniqueness and immutable payload identity.
2. Inserts the immutable accepted session.
3. Writes per-session derived key evidence.
4. Updates personal aggregates and comparison-specific PBs.
5. Updates eligible ranking state.
6. Advances learning aggregate/version where appropriate.
7. Returns the canonical persisted result and aggregate versions.

Several independent Supabase API writes are not one transaction. Plain Postgres does not execute the shared TypeScript module. Do not claim otherwise.

Keep the immutable local candidate and the immutable server-accepted result as distinct versioned objects linked to the same client session. If the ranked timing policy uses a server cutoff, show acceptance/reconciliation clearly; do not rewrite the local evidence or silently patch a percentage. A discrepancy unrelated to the documented timing policy must be rejected or surfaced for investigation.

Use invoker functions when ordinary permissions suffice. Where elevated privilege is necessary, set an empty search_path, qualify objects, constrain authorization explicitly, and revoke inappropriate EXECUTE grants from PUBLIC, anon, and authenticated.

The aggregate-writing commit path must not be callable by browser roles with arbitrary “already validated” scores. Keep it in a private schema or otherwise outside public exposure, and call it through a verified trusted-server connection or a narrowly restricted server-only facade. Test the actual chosen deployment path.

Remove direct client writes to score aggregates and protected race fields. RLS is required but is not a substitute for privileged-function authorization.

### Data model requirements

Retain or evolve existing tables with explicit migrations:

- Private profile and preferences.
- Minimal public identity projection/table with validated handle and approved avatar.
- Immutable versioned test sessions, separate raw evidence retention, and per-session key summaries.
- Comparison-specific PBs or derived queries.
- Learning model state per user, language, layout, input method, and domain.
- Race rooms and participant outcomes with version and shared timing.
- Challenges and idempotency receipts.
- Explicitly opt-in public result shares.
- Retention/job bookkeeping and aggregate reconciliation where needed.

Do not expose email through a handle. Generate a collision-safe validated handle from approved metadata or a non-email fallback. Migrate old email-valued usernames.

Owner-only profile RLS plus a security-invoker view does not automatically expose other users' handles. Choose a real minimal public identity design and prove its read/write behavior.

Session deletion must update or recompute PBs, badges, calendars, rankings, and aggregates. Account deletion must include owned queues/data/shares and define treatment of completed shared race history.

Write migrations that replay from an empty disposable database and upgrade the existing schema. Do not rewrite applied migration history. Backfill version/provenance honestly, regenerate types, and test uniqueness and indexes.

### Ranked integrity

A browser log cannot prove that a human typed it. Describe ranked validation as consistency and integrity checks with residual automation risk.

Ranked sessions require a server-issued challenge bound to user, nonce, configuration, content revision/seed, scoring policy, issue time, allowed start, expiry, and consumption rules.

For timed ranked challenges, use a short server-owned ready countdown and a fixed start/deadline. Keep instant first-input personal practice available. For ranked finite tests, document the server-accepted duration and network effects; do not trust a claimed client finish timestamp to award position.

Validate authentication, challenge ownership/reuse, target reconstruction, sequence/range bounds, event order, allowed deadline, replayed final state, and resource limits. Recompute expected characters and correctness.

Do not reject corrections because event count exceeds target length. Do not make a speed ceiling, a tiny median interval, a client hash, or isTrusted alone a proof of cheating. Store explainable review flags without changing measured values or accusing the user.

Personal, assisted, paused, imported, unsupported-method, and reviewed results have explicit eligibility. The UI must show why a result is personal-only.

## 11 Race protocol

Use one tested protocol/state machine in both server handlers and client adapters. Realtime transports changes; persisted server state decides the race.

Server operations: create, join, ready/start, progress, finish, cancel/leave, reconnect, timeout settlement, and rematch. Authorize membership and operation ownership every time.

Room lifecycle:

    waiting → countdown → active → completed
        ↘ cancelled       ↘ abandoned
    countdown may cancel according to documented departure rules

Terminal states cannot restart. A rematch creates a new room/race ID and fresh challenge.

Define a room capacity and implement public quick match as an atomic server-owned queue/claim operation. Default human races are two participants. Do not silently fill a human queue with a disguised bot.

The server owns target, seed, duration, membership, countdown deadline, start, finish deadline, and accepted outcomes. A joining client must not keep its own default thirty second duration.

Use row locking or compare-and-swap versions to serialize simultaneous joins, starts, finishes, and cancels. A participant cannot overwrite opponent values. Ignore stale versions on the client.

Progress is provisional until server accepted. Calculate correct progress from correctly resolved target slots, not typed length. Timeout preserves actual progress; never force it to one hundred percent.

Victory policy:

1. First server-accepted exact completion before the deadline wins.
2. If no exact completion, settle at timeout using verified correct progress.
3. Break equal progress by the documented scored speed, then fewer incorrect attempts.
4. If still equal, return a draw; do not arbitrarily favor the host.

Receipt-based finish order has network effects; explain this honestly. Clock-offset estimates are for display, not winner authority. Estimate display offset using request midpoint and round-trip duration; use several low-latency samples.

Record participant outcomes independently from room status. On reconnect, subscribe and buffer events, wait for subscription confirmation, then fetch a current snapshot and apply only buffered events newer than its version. An equivalent subscribe-confirm-refetch protocol is acceptable if it closes the update gap. Detect version gaps and refetch rather than assuming every event arrived. Resume only within the original deadline. Test an update occurring between subscription and snapshot retrieval.

Specify disconnect grace, host departure, abandoned-room expiry, and a server-owned cleanup/timeout mechanism. A race cannot remain active forever because both browsers closed.

Gate Realtime reads to intended membership; a room code or channel name is not authorization. Public room discovery returns only necessary lobby fields.

Bots work for guest practice, are always labelled, and do not affect human rankings. Default difficulty targets are 30, 60, and 90 WPM with documented variance. Inject clock/RNG; schedule corrections at their actual simulated times. Show measured bot outcomes rather than invented final numbers.

## 12 Learning and the shared skill model

Implement learningVersion forge-learn-v3. Keep introduced, sampled, assessed, and mastered states distinct.

Fresh English learners begin with six letters from the documented frequency order. Preserve the old introduced set when migrating existing eight-letter users. Language packs define their own alphabet and frequency/order; do not reuse English order universally.

For each logical key/grapheme track recent correct/incorrect attempts, qualified latency evidence, last practiced time, sample count, smoothed latency, and mastery history. Keep layout, language, domain, and input method as model dimensions. Do not merge code-symbol timing with prose letters or infer physical-finger skill from logical characters.

Default target speed is the saved user preference, initially 35 WPM. targetMs = 60000 / (targetWpm × 5).

A qualified individual correct attempt can update latency smoothing with alpha 0.1. Exclude the trigger attempt, active composition groups without attributable timing, and intervals classified as deliberate inactivity from the learning latency estimate; all elapsed time still counts for test speed. Document the inactivity threshold and retain its classification.

Use an uncapped speedRatio = targetMs / smoothedLatency. Do not multiply a capped ratio by an accuracy factor and then require exact equality to one.

Mastery requires:

- At least twenty recent attributable attempts for the key.
- Evidence in at least two completed lessons.
- At least 97 percent accuracy in the latest up-to-fifty attempts.
- Smoothed latency at or faster than targetMs.
- The conditions satisfied at two lesson checkpoints.

Use explicit comparisons and tolerance. An old mistake must not block mastery forever. Introduce at most one next letter after all current letters reach initial mastery. Once introduced, a letter stays available; weakness can move it back into review without removing it.

Choose the weakest under-assessed or under-target introduced letter as focus. New/unmastered focus appears in every generated training word; mixed review blocks are labelled separately.

Default text generation uses licensed natural words constrained to available letters and focus. A seeded phonetic generator supplements sparse sets. Its exact model order is a Forge choice documented with corpus/version; do not claim an unverified Keybr algorithm.

Guarantee termination, nonempty output, bounded word lengths, allowed alphabet, and focus-key inclusion. Provide a deterministic pronounceable-pattern fallback when transitions are sparse. Never substitute a punctuation placeholder as a supposed training word.

Learning defaults to allowing errors and corrections: insert the actual wrong character, advance the cursor, show that character with an expected-letter cue, and retain the original attempt in accuracy. Stop-on-error is an explicit option; it must show the rejected character and expected character while keeping the cursor in place. Backspace does not erase error history. Use committed canonical input outcomes for feedback, including mixed multi-grapheme batches. Speed and accuracy measurements remain separate.

Test and race results may provide context-qualified review evidence. Dedicated learning assessments determine initial mastery; keep transfer between domains explicit.

Persist real per-session character evidence sufficient to rebuild learning state when a session is removed. Cross-device updates use accepted session identity and server version/sequence. Stale devices must not overwrite newer state.

Required learning UI:

- Available and locked keys with readable labels and status.
- Focus key, recent speed versus target, recent accuracy, and evidence count.
- Daily minutes goal and actual completed-practice progress.
- Clear introduction milestone.
- Per-key history from actual sessions.
- “Practice these keys” launched from a result, retaining source result and language/layout context.
- Matched retest action after targeted practice.

Progression tests must construct the exact samples needed for mastery. Do not assume that an arbitrary ten lessons always unlock a particular letter.

## 13 Premium visual system

Create semantic tokens and shared components before restyling pages. The default is **Forge Dark**, with restrained amber accents, readable text, quiet surfaces, and clear keyboard focus.

### Default semantic palettes

| Token | Forge Dark | Forge Light | Role |
| --- | --- | --- | --- |
| bg | #0B0D12 | #F6F7FA | Main background |
| surface | #11141B | #FFFFFF | Panels |
| raised | #171B24 | #EDF1F6 | Inputs and raised controls |
| hover | #1F2430 | #E4EAF2 | Hover state |
| border | #2D3746 | #C9D2DE | Decorative separation |
| borderStrong | #65758B | #67778D | Controls where boundary contrast is needed |
| text | #EEF1F7 | #121A26 | Main text |
| secondary | #AAB6C6 | #4F5D70 | Secondary text |
| muted | #8796A8 | #5F6C7E | Target text and chart labels |
| accent | #F5B544 | #9B5700 | Accent text and focus |
| accentHover | #FFC568 | #814600 | Hover accent |
| accentInk | #201404 | #FFFFFF | Text on filled accent |
| correct | #EEF1F7 | #202B3C | Correct typed text |
| error | #FF7A85 | #B42336 | Incorrect text |
| errorSurface | #351C25 | #FDE9ED | Error background |
| extra | #E88891 | #9F2B42 | Extra input |
| success | #55D6A0 | #12683D | Positive change |
| info | #70B7FF | #175FA8 | Secondary chart series |
| caret | #F5B544 | #9B5700 | Active cursor |

These are starting tokens, not an exemption from contrast tests. Actual foreground/background combinations, including hover and error surfaces, must pass.

The selected dark muted/surface pair is approximately 6.11:1, dark error/surface 7.35:1, and light muted/white 5.34:1 by the WCAG luminance calculation. The earlier draft's muted text failed its own normal-text contrast requirement.

Ship eight complete themes: Forge Dark, Forge Light, Graphite, Midnight Blue, Ember, Mono Ink, Paper, and Aurora. Every theme supplies all semantic roles. Add a ten-control custom editor for background, surface, main text, muted text, accent, caret, error, extra, success, and info. Derive dependent states predictably and show contrast warnings; do not inject arbitrary user CSS.

Default dark/light/system behavior follows saved preference and OS changes appropriately. Theme import/export is schema validated. Load the saved theme early enough to avoid a bright flash.

### Typography and layout

- UI: self-hosted Inter Variable.
- Typing and numerals: self-hosted JetBrains Mono where glyph coverage is adequate, with ligatures disabled.
- Provide appropriately licensed script-aware fallbacks for Devanagari, Arabic, and any supported script. Monospace is not more important than correct shaping.
- Use tabular numerals for changing metrics.
- Type scale: 12/16 captions, 14/20 secondary, 16/24 body, 20/28 section text, 28/36 subheads, 40/48 page heading, and responsive 56–72 result hero numerals.
- Typing size options: 16, 20, 24, 28, 32 px; line height must be measured from the selected font/size.
- Four pixel spacing grid; primary gaps 8, 12, 16, 24, 32, 48.
- Content max width 1200 px; normal typing stage around 960 px.
- Radii: 6 px input, 10 px button, 14 px panel, 20 px modal.
- Use fine borders and modest elevation; avoid glow-heavy panels, excessive nested cards, and gradients behind typing text.

### Motion and interaction

Use fast/base/slow durations of 120/200/320 ms and an ease-out curve such as cubic-bezier(0.22, 1, 0.36, 1). The normal typing path animates only caret position and restrained error feedback.

Honor reduced motion with immediate state transitions where practical. Caret feedback must remain responsive; decorative reveal animations must not block input or actions.

Provide visible focus, hover, pressed, disabled, loading, success, and error states for every shared control. Prefer skeletons for content loading and a compact progress indicator inside pending-action buttons.

Contrast tests cover the actual semantic pair matrix, with alpha compositing: normal text at least 4.5:1, qualifying large text at least 3:1, and necessary non-text control indicators at least 3:1. Do not demand every arbitrary token pair pass, or assume twenty-pixel regular text is large text.

## 14 Typing screen and interaction specification

Desktop layout: compact header, mode/config row, centered typing stage, restrained HUD, and discoverable footer shortcuts.

Top-level Test modes: time, words, quote, code, zen, custom. Learn is a first-class destination.

- Timed presets: 15, 30, 60, 120 seconds.
- Word presets: 25, 50, 100, 200.
- Content options: language pack, punctuation, numbers, difficulty/corpus where actually available.
- Code: JavaScript, TypeScript, Python, SQL, Rust.
- Quote: source/author/category from the exact frozen content record.
- Custom: private by default; pasted target text is allowed as setup, not treated as typed input.
- Prompted zen: finite visual window over append-only content, with visible Finish.
- Practice-only free writing: clearly different metrics and no target accuracy.

Show three readable lines, keeping the active line visible with font-aware measurements. Render only the necessary text window for long sessions while retaining the logical transcript. Support a trailing caret after the final visible character.

Correct, incorrect, extra, missed, and untyped states need distinct presentation. Errors also use underline or shape, not color alone. Code preserves indentation and line breaks; syntax colors must never override correctness readability.

Caret styles: line, block, outline, underline. Provide optional pace caret based on a matched PB, recent average, or explicit custom speed. Label its source and hide it when no valid comparison exists.

HUD options: off, minimal, full. Default includes time/words remaining, WPM, and input accuracy. Do not show missing accuracy as 100 percent.

Focus mode reduces visual distraction after typing starts. Restore controls for keyboard focus and pointer interaction. Do not leave invisible focusable controls at opacity zero. The browser's real textarea remains focusable, labelled, and usable for composition.

On blur, show a click/keyboard-reachable focus affordance without globally capturing arbitrary keys or stealing focus from another input. Timed/ranked time continues according to its timing policy.

### Shortcut map

| Context | Default |
| --- | --- |
| Anywhere appropriate | Ctrl/Cmd+K opens the command palette |
| Typing | Tab and Shift+Tab navigate normally |
| Typing | Ctrl/Cmd+Enter retries, unless an active composition/dialog owns the input |
| Typing | Esc closes top overlay; otherwise exits typing focus to a visible control |
| Personal practice | Pause through a labelled control; optional configurable chord |
| Results container | Enter next test; R retry; S share; H heatmap, when enabled and focus-scoped |
| Focused button/form field | Native activation/editing wins over result shortcuts |

Provide remapping/disable controls. Optional Tab restart is opt-in, scoped to the typing surface, and supplies a documented Esc exit. Do not implement conflicting local and global handlers. Printable shortcuts must be scoped or switchable.

Code Tab indentation is opt-in and assistance-labelled where it inserts multiple spaces. Default Tab remains navigation.

On mobile, provide a real navigation drawer and a mode row that scrolls or wraps without clipping controls. Support virtual keyboard composition. A dismissible physical-keyboard hint must not block typing.

Settings include behavior, content, input/corrections, caret/pace, appearance, sound, privacy, and advanced diagnostics. Optional sounds default off, load on demand, and respect mute/volume settings.

## 15 Professional results screen

This is a primary product feature, not a developer diagnostic dump. Consume only SessionResult plus explicitly scoped historical/comparison data. No result component recomputes or patches a score.

### Visual hierarchy

Desktop:

    [result context and eligibility]       [save state]
    [WPM hero] [accuracy] [matched delta]  [timeline chart]
    [raw] [consistency] [characters] [time] [mode] [5s peak]
    [up to three evidence-based insights] [practice action]
    [keyboard detail / word detail / replay tabs]
    [Next test] [Retry exact text] [Practice weakness] [Share] [Export]

At narrow widths, stack the hero, chart, details, and actions. Keep the primary next action visible without covering content or keyboard focus. Do not force six tiny cards into a mobile row.

### Hero

WPM is the primary value; input accuracy is the secondary value. Show mode, configuration, language, scoring policy, and duration nearby.

For code, identify code scoring. For free writing, lead with raw/attempt rate and omit target-based claims.

A comparison chip uses the mean or median of the previous twenty comparable eligible sessions, excluding the current one. State which statistic and sample count. Hide a delta until at least five matching prior sessions exist.

A personal best belongs to the full comparison key, not all tests. A pending server submission may show “Possible personal best”; accepted comparisons update after reconciliation. Practice-only and legacy results never silently enter ranked PBs.

Avoid unsupported “professional”, “IQ”, “talent”, or scientific skill-rating claims. Prefer measured values and a useful practice recommendation.

### Timeline

Default series: cumulative WPM, cumulative raw WPM, local insertion rate, and error markers. Use explicit legend labels. Allow series toggles with keyboard access.

- X-axis is elapsed seconds from zero to the actual cutoff.
- Include idle periods.
- WPM accent solid; raw info dashed; local rate muted secondary line; errors use a distinct symbol.
- Tooltip includes timestamp, cumulative values, local rate, and incorrect attempts in the bucket.
- Unsmooth measured data remains available; a smoothing overlay is labelled.
- Display a full chart only with enough meaningful samples; otherwise show a compact short-session explanation.
- Provide a readable text summary and data table or export alternative.
- Loading, no input, insufficient samples, and expired raw evidence each have distinct states.

### Detail statistics

1. Raw WPM, with its final-retained-text formula.
2. Rhythm consistency, formula/version and insufficient-sample explanation.
3. Correct/incorrect/extra/missed counts, with a legend and explanation of word-credit WPM.
4. Actual elapsed time, preserving tenths in display and milliseconds in data.
5. Mode/configuration/language/input method.
6. Peak five-second attempt rate, accurately labelled.
7. Optional expanded details: attempts, corrections, corrected mistakes, final-text accuracy, and correct-character WPM.

Use informative tooltips and accessible formula details. Null renders as an em dash with a reason. Zero remains zero.

### Actionable insights

Show at most three concise observations derived from qualified data:

- Slowest keys with at least five attributable intervals each.
- Frequent incorrect substitutions with counts and denominators.
- Slow words with a documented word-timing policy.
- Rhythm variation when there is sufficient measured history.
- Relevant difference from the user's matched recent baseline.

State the sample size where it changes interpretation. Do not assign a latency to every character in a simultaneous IME commit. Do not present repeated current values as historical learning.

Each actionable insight links to an actual targeted practice configuration. “Practice weak keys” must retain language, layout, domain, and source evidence; then offer a matched retest.

### Keyboard words and replay

The keyboard heatmap has speed/accuracy controls, readable key labels, minimum evidence handling, a legend, and a text/table equivalent. Match the selected layout; unknown mappings remain unknown.

A collapsible word table shows the slowest or most error-prone words from the actual transcript with counts. Separate submitted wrong words, corrected words, skipped words, and incomplete timed words.

Replay uses real recorded events and timing, with play/pause/speed controls. It is available only while retained evidence exists. Do not synthesize a replay from summary scores.

### Save and eligibility states

Examples:

- Guest: “Saved on this device” with optional sign-in.
- Local-storage failure: “Not saved locally · Export result”; do not call an in-memory fallback saved. If cloud storage independently succeeds, show “Saved to account · Local cache unavailable”.
- Pending: “Saved on this device · Syncing”.
- Transient failure: “Cloud save failed · Retry”.
- Authentication: “Sign in again to sync this account”.
- Rejected ranked submission: personal result retained, clear eligibility reason.
- Insufficient/empty input: “No input recorded”, without a PB celebration.
- Aborted/partial practice: neutral completion context, no ranked award.
- Extreme-speed review: measured values retained, neutral “Pending review” label.

### Actions and sharing

Primary Next test; secondary Retry exact text; Practice weakness; Share; Export JSON; View history.

Share creates an original 1200×630 PNG using canvas with the chosen theme, main metrics, mode/configuration, and an optional chosen handle. Offer download and copy-image with a fallback when clipboard permission/API support is absent.

Public link creation is explicit opt-in. Use an unguessable public share identifier that exposes only an approved summary. Private custom text, email, raw events, and private owner identifiers are excluded by default. Support revocation.

Results CSV/JSON exports have documented schemas, escaping, and spreadsheet-formula injection handling. Export all history is account-scoped and paginated.

Percentiles require a real anonymized cohort with a defined window, scoring policy, content, eligibility, and sample count. If the claim says users, compare one defined statistic per unique user; session distributions must say sessions. A minimum of one thousand samples is a product gate, not proof of representativeness.

Do not invent an overall rating or global percentile when evidence is absent.

## 16 Other screens and complete feature behavior

### Learn

Use a large lesson stage and a compact progress panel. Show focus key, available set, target speed, evidence quality, mastery checkpoints, and daily goal. Results reuse shared result components. Enter can begin the next prepared lesson when the result container owns focus.

Daily goals count actual completed practice time using the saved display timezone. Explain what counts toward streaks. Timezone changes must not manufacture duplicate practice days.

### Stats

Use real session and key data. Include tests completed, actual time, matched best/average speed, input accuracy, twelve-month activity, speed trend, and per-key history.

Filters use explicit mode, duration/word count, language, layout, content, eligibility, and metric-version values. Quote and quotes cannot be mismatched strings.

Keep personal distributions labelled personal. Provide paginated or server-aggregated totals instead of mixing the latest one hundred records with lifetime leaderboards. Sort chronology explicitly and handle timezone boundaries.

### Leaderboards

Period filters are actual period session queries or verified aggregates, not “lifetime score updated today”. State daily/weekly UTC boundaries or a chosen documented ranking timezone.

Separate time presets, word counts, code language, corpus, scoring version, punctuation/numbers, and assistance cohorts. Rank only accepted eligible submissions.

Use safe handles, pagination, explicit tie rules, own-rank highlighting, and real loading/error/empty states. Do not derive public identity from private profiles/email.

### Profile

Show handle, approved avatar, join context, scoped PBs, history, actual learning state, race outcomes, and preferences.

Badges are deterministic from accepted eligible evidence: first speed milestones, completed-test totals, documented practice streaks, and sustained accuracy. They must be recomputed or invalidated when evidence is deleted.

History supports sorting, filters, pagination, export, and session deletion with clear consequences. Account deletion is a separate explicit destructive flow.

### Race

Lobby, create/join, public quick match, labelled bot practice, ready/countdown, lanes, timeout, reconnect, draw, rematch, and error states must all be implemented.

Lane motion interpolates the latest accepted progress for presentation only. It must not invent progress or conceal connection loss. Show the shared remaining time and participant connection state.

### Settings and onboarding

Apply preferences immediately and persist them with safe fallback. Add searchable settings and import/export with schema version.

Provide a skippable first-use guide to test, understand a result, and try Learn. Never block the first typing action behind registration or a long tour.

## 17 Content language and layout support

Build versioned packs with provenance, normalization policy, tokenizer/segmentation settings, layout mappings, script fonts, and capability flags. Separate UI language, content language, keyboard layout, and input method.

Required tested content packs: English, Spanish, French, German, Portuguese, Italian, Russian, Hindi, Arabic, and a clearly named Gujarati transliteration pack. Transliteration is not Gujarati-script typing and must not be marketed as such.

English is the first fully verified pack; enable each additional pack only after its own content/input gate passes. Final full-scope completion requires every required pack's actual validation, not a selector containing ten labels.

Required layout views: QWERTY, Dvorak, Colemak, Colemak-DH, AZERTY, QWERTZ. Also support an unmapped/native layout state; these six Latin layouts do not supply a complete Hindi/Arabic keyboard mapping.

Practice must handle IME and RTL. Keep code regions LTR where appropriate. Prevent bilingual punctuation/caret regressions. Do not pool incomparable input methods in ranked cohorts.

Replace the misleading word-list name with a genuinely curated unique base list or a clearly documented weighted corpus. Store intentional frequency weights explicitly. Record quote authors/sources and licensing.

Validate code examples without executing untrusted snippets. Use parsing/compilation in controlled fixtures appropriate to each language and distinguish complete programs from labelled fragments. Pick a SQL dialect. Preserve exact snippet IDs and content revisions.

Custom imported text and code are escaped plain text. Syntax presentation must not introduce HTML injection or execute the snippet.

## 18 Quality performance privacy and operations

### Tests and scripts

Provide documented scripts: typecheck, lint, test:run, test:coverage, test:e2e, test:db, build, verify:local, and verify:release.

- verify:local runs types, lint, deterministic unit/integration tests, coverage, and production build.
- verify:release also runs browser tests, database tests, clean-install verification, deployment-bundle checks, and the documented staging checks.
- Missing Docker/Supabase infrastructure produces a clear blocked release check, not a skipped success.
- Remove undeclared Lovable-only test dependencies or replace them with standard Playwright configuration.
- Install matching coverage tooling explicitly and move test tools to devDependencies.
- Enable strict typing in new domain modules, then repair application typing incrementally without broad any casts.
- Require at least 85 percent lines and 80 percent branches in the domain core; exclusions cannot hide business logic.
- Use golden vectors and behavior tests beyond coverage percentages.

Use injected clocks and seeded RNG. The deterministic bot suite should complete within five seconds on documented CI hardware; do not busy-wait real races. Measure the whole suite separately rather than promising an arbitrary universal runtime.

Browser tests must fail on missing expected UI, complete real flows, and assert exact persisted record counts. Do not substitute expected metrics when extraction fails.

Database tests cover grants, direct table access, privileged RPCs, anonymous/unrelated/owner roles, host/opponent, concurrent joins, repeated finishes, duplicate retries, deletion, and full migration replay. Two browser contexts must exercise an actual local backend race.

Add browser coverage for corrections, deadline cutoffs, target extension, route changes, account switching with queued data, reload/retry, IME, RTL, mobile navigation, keyboard-only operation, and reduced motion.

Keep dev seeds and fixture controls out of production and ranked content selection.

### Performance

Measure a named browser, machine/CI profile, viewport, network, and percentile.

- Immediate text/caret feedback aims for the next display frame on a representative 60 Hz laptop. Report observed latency distributions and the method; a handler benchmark alone is not input-to-paint proof.
- Publish expensive derived HUD updates at about 100 ms without throttling visible input.
- Keep charts, share rendering, theme editor, and large language packs off the initial typing path.
- Target initial application JavaScript at most 200 kB gzip, lazy feature chunks at most 150 kB gzip, and record actual CSS/font/content transfers separately.
- If an existing dependency prevents the target, report measured totals and implement a concrete reduction; do not merely raise the warning threshold.
- Target mobile lab Lighthouse performance at least 90 under a pinned preset, with reproducible artifacts.
- Track field LCP at or below 2.5 seconds, INP at or below 200 ms, and CLS at or below 0.1 at the 75th percentile when enough real data exists.
- Treat lab and field results as different evidence. Do not infer field performance from Lighthouse.

### Accessibility

Meet the relevant WCAG 2.2 AA requirements with both automated and manual verification. Cover keyboard exit, visible/nonobscured focus, labels, target sizing, text contrast, zoom/reflow, reduced motion, error identification, and accessible authentication.

Provide chart alternatives and meaningful status announcements. Do not announce every character or frame through a live region. Do not disable password-manager paste.

### Security and privacy

Keep service credentials server-side. Public Supabase configuration is not a service secret. Supply .env.example, protect private environment files, and handle already tracked configuration deliberately.

Set explicit API schemas, size/rate limits, authorization, safe public projections, and restricted function grants. Do not rely on a client-hidden button as enforcement.

Raw transcripts/events are private. Retain them for a documented default of ninety days in both cloud and local storage, then purge or reduce to necessary aggregates. Explain that replay expires. Custom text is not uploaded or publicly shared without the relevant choice.

Implement cloud retention through an actual scheduled backend job and test it. Apply local evidence expiry at app startup and during use; a closed browser cannot run this cleanup. Expired unsynced evidence must not be silently uploaded later: retain the personal summary, remove expired raw payloads, and show that cloud validation is no longer available. Test expiry independently for summaries, replay, raw custom content, and queues. Keep useful non-text aggregate history without claiming that retention alone establishes legal compliance.

Use redacted structured logs and a correlation ID. Production logs must not print typed text, emails, tokens, or detailed keystroke samples. Debug mode must not expose secrets or bypass ranking rules.

Run current dependency audits for the full development graph and production graph. Resolve exploitable high/critical findings; document any remaining nonapplicability with evidence, owner, and review date. An omit-dev scan does not assess exposed development servers.

### Deployment

Provide a real README, Node/package-manager version policy, one authoritative npm lockfile, architecture, metrics, learning, security, privacy/retention, decisions, and deployment/rollback documentation.

Implement SPA fallback and appropriate cache headers for the selected actual host. Use a restrictive tested CSP, MIME sniffing protection, referrer and permissions policy, and secure transport appropriate to that host. Verify Supabase connections/fonts/worker behavior under CSP.

A static frontend health path only proves asset hosting. Define a separate dependency/readiness check if backend availability is claimed.

Deploy database changes through reversible or forward-repairable migrations after staging verification. Preserve backups and avoid destructive reset shortcuts.

## 19 Execution milestones and acceptance

Keep all requirements in the ledger. These are ordered delivery gates, not permission to stop after the first one.

| Milestone | Required work | Exit evidence |
| --- | --- | --- |
| M0 Baseline | Read instructions/diff/audit, run actual checks, create requirement ledger and decisions | Recorded current results and preservation plan |
| M1 Trustworthy sessions | Controller, transcript, timing, metric contract, idempotent finish, all existing mode completion | Golden vectors; one-completion regression; deadline/pause/extension/code tests |
| M2 Durable accounts | Local migration, queue ownership, shared Edge core, atomic commit, safe profiles, deletion | Retry/lost-response/account-switch tests; grants/RLS/RPC tests |
| M3 Adaptive learning | Achievable mastery, introduction/review, real errors, deterministic generation, cross-device state | Seeded progression, old-error recovery, storage merge and per-key history tests |
| M4 Premium test and results | Tokens, dark/light foundation, accessible typing interaction, complete results flow and actions | Visual and keyboard verification; real insight-to-practice-to-retest flow |
| M5 Dependable competition | Human rooms, quick match, bot scheduling, shared timing, settlement/reconnect | Two-client backend/browser race and concurrency tests |
| M6 Complete experience | Honest stats, leaderboards, profile/settings, eight themes, language/layout packs, sharing/export | Feature-specific data, accessibility, content and privacy gates |
| M7 Release | CI, clean install, migration upgrade/replay, dependency review, performance, staging/runbook | Actual verify:release evidence and explicit unresolved blockers |

### Audit coverage ledger

Map every audited finding to requirements and regressions:

| Audit finding | Required home |
| --- | --- |
| F01 repeated completion and regenerated target | M1 immutable finalization and idempotency |
| F02 timing excludes inactivity | M1 fixed deadline and canonical clock |
| F03 code cannot finish | M1 code completion |
| F04 learning cannot introduce letters | M3 progression |
| F05 client-controlled scores | M2 restricted validated commit |
| F06 race field self-comparisons | M2/M5 operation authorization and policy tests |
| F07 invalid race lifecycle | M5 server transitions |
| F08 stale finalization state | M1/M5 explicit current snapshot |
| F09 email usernames | M2 private profile/public identity migration |
| F10 dependencies | M0/M7 current full-graph review |
| F11 live accuracy counts future text | M1 attempted-input accuracy |
| F12 conflicting accuracy definitions | M1 versioned contract and migrated assertions |
| F13 configured rather than actual duration | M1 exact elapsedMs persistence |
| F14 silent write failure | M2 error classification and retry |
| F15 non-atomic aggregates | M2 one transaction and reconciliation |
| F16 length-only race progress | M5 correct progress and exact completion |
| F17 unshared race clocks/duration | M5 server timestamps |
| F18 lost learning mistakes and sampler resets | M1/M3 attempts and stable sampling |
| F19 account-mixed local progress | M2/M3 owner namespaces and merge |
| F20 broken filters | M6 typed dimensions |
| F21 false population/time-period comparisons | M6 real cohorts |
| F22 fabricated key histories | M3/M6 actual session evidence |
| F23 ignored preferences | M4/M6 shared preferences |
| F24 mobile navigation/clipping | M4 responsive navigation |
| F25 keyboard traps | M4 shortcut/focus contract |
| F26 failing quality setup | M0/M7 standard tooling and typing |
| F27 weak assertions | All milestones meaningful tests |
| F28 fragile local storage | M2 validated migration/fallback |
| F29 large initial bundle | M4/M7 measured lazy loading |
| F30 nonfinite report fields | M1 finite/null invariants |
| F31 bot time/model mismatch | M5 injected clock and scheduled edits |
| F32 timed target exhaustion | M1 append-only content |
| F33 stale project documentation | M7 maintained docs |
| F34 duplicate corpus/invalid code examples | M6 content validation |
| F35 unfinished controls | M4/M6 implemented actions |

### Definition of done

- All required ledger items are implemented and verified, or visibly blocked with a concrete external reason; blocked means the full release is not complete.
- Existing user work is preserved and changes are reviewable.
- The canonical core reproduces every documented metric and returns finite values or meaningful nulls.
- One completion creates one local identity and at most one accepted cloud effect; identical retries are safe.
- Every required mode completes, time includes inactivity, and issued targets never mutate.
- Learning introduces letters through evidence and can recover after mistakes.
- Real historical data drives comparisons and charts.
- Browser roles cannot bypass trusted aggregate/race writes.
- Human races pass creation, join concurrency, countdown, completion, timeout, reconnect, and rematch checks.
- Safe handles, public sharing, queue ownership, deletion, and retention work as specified.
- All eight themes, required packs/layouts, mobile controls, and keyboard paths pass their gates.
- The required scripts pass from a clean install with actual local backend tests.
- Performance measurements, dependency review, staging checks, and deployment instructions are accurate.
- No fake metrics, placeholder links, unimplemented advertised buttons, or unsupported “production ready” claims remain.

After each milestone, report completed IDs, changed files, exact checks and results, unresolved risks, and the next dependency. Update the ledger as you work.

Begin with M0, then execute M1. Continue through M7 in order. If a prerequisite fails, fix it before depending on it; continue independent tasks where safe. Finish with the real release state and evidence.

## 20 Research sources and interpretation

Research date: 15 October 2026. Product requirements above are original proposed Forge decisions unless explicitly identified as a competitor observation.

### Keybr primary sources

Public repository snapshot: [Keybr 05a37bc](https://github.com/aradzie/keybr.com/tree/05a37bc5265f65ff538c59c613db29442f345d51).

- [Guided lesson progression and generation](https://github.com/aradzie/keybr.com/blob/05a37bc5265f65ff538c59c613db29442f345d51/packages/keybr-lesson/lib/guided.ts): small initial alphabet, focus selection, recovery policy, natural-word supplementation.
- [Target confidence calculation](https://github.com/aradzie/keybr.com/blob/05a37bc5265f65ff538c59c613db29442f345d51/packages/keybr-lesson/lib/target.ts): target-time to observed-time ratio.
- [Lesson capabilities](https://github.com/aradzie/keybr.com/blob/05a37bc5265f65ff538c59c613db29442f345d51/packages/keybr-lesson/lib/lessontype.ts): multiple exercise types.
- [Input settings](https://github.com/aradzie/keybr.com/blob/05a37bc5265f65ff538c59c613db29442f345d51/packages/keybr-textinput/lib/settings.ts): configurable error/correction policies.
- [Keybr repository and architecture](https://github.com/aradzie/keybr.com/tree/05a37bc5265f65ff538c59c613db29442f345d51/packages): domain packages, pages, and multiplayer implementation.

### Monkeytype primary sources

Public repository snapshot: [Monkeytype 01545f4](https://github.com/monkeytypegame/monkeytype/tree/01545f4ff1c2a4a51aa84f081cc77e10254ad369).

- [Final calculation](https://github.com/monkeytypegame/monkeytype/blob/01545f4ff1c2a4a51aa84f081cc77e10254ad369/frontend/src/ts/test/test-logic.ts): retained-text raw WPM and completion metrics.
- [Attempt accuracy and event statistics](https://github.com/monkeytypegame/monkeytype/blob/01545f4ff1c2a4a51aa84f081cc77e10254ad369/frontend/src/ts/test/events/stats.ts): insertion correctness and timing.
- [Character and word credit](https://github.com/monkeytypegame/monkeytype/blob/01545f4ff1c2a4a51aa84f081cc77e10254ad369/frontend/src/ts/utils/strings.ts): word-credit behavior.
- [Result chart](https://github.com/monkeytypegame/monkeytype/blob/01545f4ff1c2a4a51aa84f081cc77e10254ad369/frontend/src/ts/components/pages/test/result/ResultChart.tsx): separate chart series and interactions.
- [Result actions](https://github.com/monkeytypegame/monkeytype/blob/01545f4ff1c2a4a51aa84f081cc77e10254ad369/frontend/src/ts/components/pages/test/result/ResultButtons.tsx): retry/practice/replay/share actions.
- [Frontend stack](https://github.com/monkeytypegame/monkeytype/blob/01545f4ff1c2a4a51aa84f081cc77e10254ad369/frontend/package.json) and [backend stack](https://github.com/monkeytypegame/monkeytype/blob/01545f4ff1c2a4a51aa84f081cc77e10254ad369/backend/package.json): useful separation of responsibilities, not a required Forge migration.

### Market and research references

- [Typing.com adaptive problem-key practice](https://support.typing.com/en/articles/13785089).
- [Typing.com curriculum](https://www.typing.com/en-gb/curriculum).
- [TypingClub product capabilities](https://www.typingclub.com/).
- [Typing.io programming practice](https://typing.io/).
- [TypeRacer](https://play.typeracer.com/) and [Nitro Type](https://www.nitrotype.com/).
- [Google Trends data methodology](https://support.google.com/trends/answer/4365533?hl=en): relative sampled search-interest data, not market size.
- [Observations on Typing from 136 Million Keystrokes](https://userinterfaces.aalto.fi/136Mkeystrokes/): primary typing study; implications for Forge coaching are hypotheses.

### Engineering and accessibility references

- [Supabase database-function privileges](https://supabase.com/docs/guides/database/functions).
- [Supabase row level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions).
- [PostgREST request transactions](https://postgrest.org/en/stable/references/transactions.html).
- [Supabase Realtime authorization](https://supabase.com/docs/guides/realtime/authorization).
- [MDN beforeinput behavior](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event).
- [W3C Input Events](https://www.w3.org/TR/input-events-2/).
- [Unicode text segmentation](https://unicode.org/reports/tr29/).
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
- [Google Core Web Vitals guidance](https://developers.google.com/search/docs/appearance/core-web-vitals).
- [Playwright clock control](https://playwright.dev/docs/clock).

Do not treat a source link as an instruction to copy implementation, content, branding, or licensing assumptions. Verify compatibility and deployment behavior while implementing.
