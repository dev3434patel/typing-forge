# Forge session and metric contract

The canonical implementation is `src/lib/typing-core`, version **forge-v3**. This is Typing Forge's explicit policy. It does not promise numerical parity with another typing site. `metrics-engine.ts`, `typing-engine.ts` and `professional-accuracy.ts` retain clearly labelled legacy-v2 adapters for old consumers; historical data is not silently promoted to v3.

## Lifecycle and evidence

`SessionController` receives a configuration and injected monotonic/wall clocks. Personal practice starts on the first committed or rejected insertion attempt. Idle time always remains in elapsed duration. `startAt(monotonicStart, wallStart)` supports a shared server-owned race start, including time missed by a late joining client. Timed deadlines do not move when input stops; inputs at or after the cutoff are excluded. A delayed timeout callback still finalizes the configured duration.

Explicit personal pauses are recorded as non-overlapping wall-time intervals. Active duration excludes those intervals, while `wallDurationMs` retains them. Inputs during pause are ignored. Paused sessions use a separate comparison key and are ineligible for ranked comparison. Races/challenges cannot pause.

`finish` returns the same deeply frozen result object on repeated calls. `checkpoint` produces immutable interim evidence without finalizing the live controller. Finite code/prose modes complete after processing all target slots; manual completion preserves a partial result and applicable missed remainder. Time/zen targets may append segments; finite and finalized targets cannot change. Retrying creates a new ID and repeated-content provenance.

An explicit `finish('timeout')` is valid only after the configured active deadline has actually been reached. It cannot start an unused timer or manufacture elapsed duration. Cloud validation accepts delayed timeout callbacks, checks finite/date-representable start and finish metadata, rejects inconsistent active duration or unknown lifecycle values, and permits up to one second of wall-clock metadata jitter. These checks do not make a client clock authoritative.

Normalized edits include sequence, monotonic offset, grapheme range, operation, text, provenance and optional composition group. Replay derives correctness; client-supplied correctness flags are not evidence. Deletions never count as insertion attempts. Non-inserting `submit` events move to the next word slot without inventing a typed separator or attempt. Physical space input is an insertion attempt; entering it early misses the untyped remainder of that word without shifting subsequent words against the wrong target.

Issued target segments carry their offset and, for newly recorded sessions, `afterSequence`: the last input event already recorded when that segment was issued. Equal timestamps therefore retain their real operation order. Older segments without that field are interpreted as issued before input at the same timestamp. Replay compares every attempt against the target available at that event; a later append cannot turn an earlier wrong attempt into a correct attempt. An append cannot modify an existing grapheme. Extension after an out-of-target attempt makes the local result ineligible for comparison.

The shared server validator independently derives the same late-extension condition from replayed attempt positions and issuance order. Such a session cannot establish a personal best even if the client submits an eligible flag. Ordinary preissued extensions remain eligible when the other personal-best requirements are satisfied.

Prose input/targets normalize to NFC. Code targets only preprocess CRLF to LF; code input preserves exact logical content and indentation. Counts use native Unicode grapheme segmentation through `Intl.Segmenter('und')`, policy `unicode-grapheme-intl-v1`. The fallback is explicitly identified and ineligible for comparison. Native Unicode segmentation can vary across runtime Unicode versions: broad cross-runtime ranked Unicode parity remains a deployment limitation. English keyboard challenges avoid this ambiguity. Multi-grapheme composition commits are valid practice; their individual key latency is unknown. Repeated composition-group delivery cannot double count a commit.

Committed edits reconcile grapheme boundaries across existing text, so separate combining marks, Indic signs and emoji joiners cannot leave final text with a contradictory retained-unit count. The range edit stays atomic and code does not acquire NFC normalization. Historical insertion attempts remain recorded; several committed insertion units can become one retained grapheme after a joining edit. Code input also normalizes CRLF to LF to match the target line-ending policy.

The portable `learningEvidenceFromResult` projection is also the server's source of per-key summaries. A latency sample requires an individual keyboard grapheme preceded by another individual keyboard grapheme, a positive interval of at most two seconds, no composition grouping, no intervening pause, and a correct current attempt. The trigger, incorrect attempt, batched commit, first key after a batch/composition, and inactivity boundary do not supply a key-speed sample. Attempts and error counts remain available independently of qualified latency.

## Counts and accuracy

| Quantity | Definition |
| --- | --- |
| correct / incorrect | Retained graphemes matching / differing from assigned expected slots |
| extra | Retained graphemes with no assigned target slot |
| missed | Processed/skipped empty slots; untouched remainder also counts for finalized finite targets |
| untyped | Untouched future target in ongoing/time sessions |
| correctAttempts / incorrectAttempts | All insertion graphemes, including retyping, rejected attempts and subsequently deleted mistakes |
| deletionActions / deletedUnits | Separate operation count and number of removed graphemes |
| retainedUnits | correct + incorrect + extra |

`inputAccuracy = correctAttempts / insertionAttempts × 100`. Backspace/modifier actions do not enter the denominator. `finalTextAccuracy = correct / (correct + incorrect + extra + applicable missed) × 100`. Corrected text may have 100% final accuracy while input accuracy remains below 100%. An empty attempt denominator is unavailable (`null`), never an invented perfect input score.

## Speed and timing

Prose `creditedUnits` contains complete, correct words and their actually typed following separators. A wrong submitted word earns no whole-word credit. At time/zen cutoff, an unfinished last word earns only its leading correct prefix. A complete final target word needs no trailing space. Code credits matching retained graphemes, including required entered whitespace, in a separate cohort.

For positive elapsed duration in minutes:

- `wpm = creditedUnits / 5 / elapsedMinutes`
- `rawWpm = retainedUnits / 5 / elapsedMinutes`
- `attemptRate = insertionAttempts / 5 / elapsedMinutes`
- `correctCharacterWpm = correct / 5 / elapsedMinutes`

Canonical values retain full precision. Presentation alone rounds. Zero elapsed duration yields null speed. No input at a real timed cutoff yields speed 0 with null input accuracy. Free writing has raw/attempt rates but no target WPM, target accuracy or missed-target count. Results are never clipped to an arbitrary maximum WPM. HUD presentation warms up for one second.

Time-series cutoffs contain cumulative credited WPM and cumulative retained raw WPM. Local typing rate is a separate attempt measure: one-second buckets include all idle periods, and the final partial bucket is normalized by its actual duration. Rhythm consistency is duration-weighted `clamp(100 × (1 − populationSD / mean), 0, 100)`. It is null before five seconds, below five attempts or when mean activity is zero. The five-second burst uses complete windows on a one-second grid plus the final window ending at cutoff; sessions shorter than five seconds have no five-second burst.

Comparison keys are generated from version, scoring policy, mode, duration/word count, language/script/layout, actual input method, punctuation/numbers, code language, corpus revision, generator version, segmentation policy, rejection policy, repeated content and pauses. Arbitrary supplied comparison keys do not override this. Sessions containing composition use a composition cohort, separate from keyboard-only practice. Client eligibility is provisional; only authenticated server validation decides ranked eligibility.

New keys also contain `comparisonPolicy: forge-cohorts-v2`. Public quote/code sessions include their stable `settings.contentId`, alongside the corpus revision, so different passages/snippets cannot claim a shared personal best. The ID must be a bounded identifier (1–128 ASCII letters/digits or `._:-`, starting with a letter/digit). Missing/invalid identities are isolated by session ID and personal-best ineligible. Custom, private and free-writing sessions always use session isolation, ignore any supplied content ID and cannot establish personal bests. Their raw text is never put in the persistent comparison key. Existing historical keys/metrics stay unchanged and do not compare against the new cohorts. This deliberately forgoes cross-session custom-content PB badges instead of storing private text or introducing an unverified text fingerprint. Content IDs identify editorial public content; they do not prove human input or confer ranked trust.

## Reproducible verification

`npm run typecheck:domain` enforces TypeScript strict mode, including implicit-any and null checks, for the canonical core, learning engine/evidence, content, bots, metric/stat helpers, and history/repository/sync modules through `tsconfig.domain.json`. A second pass through `tsconfig.portable.json` compiles the canonical core, learning evidence and content packs using only ECMAScript/Intl libraries, with browser and Node globals unavailable. The normal `npm run typecheck`, `npm run check` and CI typecheck step include both passes. The application has its own broader compatibility configuration.

`src/lib/typing-core/__tests__/session.test.ts` covers golden metric vectors, the exact deadline boundary, pause/resume and idle time, word skipping, selections/deletions, IME/NFC and multiple scripts, finite code completion, retries/idempotence, immutable interim checkpoints, shared race starts and seeded edit histories. The browser suite reads actual exported session evidence and compares UI outcomes without manufacturing expected observations.

Key vectors at 30 seconds: ten credited units produce 4 WPM; `a,x,delete,b,c` on `abc` produces 1.2 WPM, 1.2 raw, 1.6 attempt rate, 75% input accuracy and 100% final accuracy; `cxt dog` on `cat dog` produces 6 correct/1 incorrect, 2.8 raw and 1.2 word WPM; timed `cat d` credits 5 units, produces 2 WPM and does not mark the untouched tail as missed.

The additional finite conformance matrix, reproduced sample arithmetic and demonstrated fixes are recorded in [METRIC_CONFORMANCE_2026-10-15.md](METRIC_CONFORMANCE_2026-10-15.md). Per-word diagnostics are generated inside the existing credit loop via `traceSessionWords`; they do not maintain a second scoring formula. Playback uses `replaySnapshot`, the same normalized replay and alignment without rebuilding an unused timeline for each frame.
