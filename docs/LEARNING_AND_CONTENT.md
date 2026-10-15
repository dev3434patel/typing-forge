# Adaptive learning and content contract

Version: `forge-learn-v3`. Implementation: `src/lib/keybr-engine.ts`, portable accepted-session projection: `src/lib/learning-evidence.ts`.

## Measurements and progression

Learn defaults to allowing mistakes and corrections. Actual wrong characters remain visible and advance the cursor, with an expected-letter cue and immediate typed/expected feedback. Explicit stop-on-error instead displays the rejected input while waiting at the expected character. Whole committed input batches stay atomic; see [the feedback update](WRONG_KEY_FEEDBACK_2026-10-16.md).

The canonical session replay supplies every expected/typed logical grapheme. Rejected attempts remain in input accuracy. Deletions do not count as insertion attempts. Test scores come from the shared typing core; per-key speed is a separately labelled latency estimate.

The first committed attempt starts practice time, including a rejected attempt. Only correct individual attempts after the trigger can update the key latency estimate. Intervals longer than 2,000 ms, intervals crossing explicit pauses, simultaneous composition commits and their following transition are excluded from key timing. Their elapsed practice time remains in the session clock.

A key's recent evidence window is its latest 50 attempts. Qualified latency smoothing uses alpha 0.1. Speed ratio is target latency divided by smoothed latency, with no cap. Initial mastery uses dedicated assessments only: at least 20 attributable recent attempts, evidence in two completed lessons, at least 97% accuracy, target key speed or faster, and two consecutive qualifying lesson checkpoints. Initial mastery is evaluated at each assessment's saved target. A later target change or weak performance can place a mastered key in review.

New English users begin with `e t a o i n`. A valid old unscoped `keybr_character_data` map migrates to guest with the old `e t a o i n s r` introduced set. Legacy summary values are unassessed; they cannot invent latency samples or mastery. Once introduced, a key remains available. At most one next key is introduced after a completed assessment when all previous available keys have initial mastery.

Matched ordinary tests and races can inform review and focus selection. They cannot supply the dedicated evidence needed for initial mastery. Layout, language, prose/code domain and actual input method remain separate model dimensions. Composition groups supply committed-grapheme accuracy; they cannot establish individual-key speed.

## Persistence, sync and deletion

Learning data is namespaced `typingforge:v3:${owner}:learning`; an owner is `guest` or an authenticated account UUID. Per-session evidence is immutable and identified by the canonical client session ID. A repeated ID cannot replace different observations. Stable comparison tolerates JSON property ordering. Storage failure retains learning evidence in memory for the current visit and displays the durability failure.

History can be rebuilt from session evidence. Session deletion removes its evidence; introduced keys stay available. A complete cloud reconciliation removes previously accepted sessions missing after deletion while preserving pending local evidence. Monotonic cloud versions and local deletion tombstones prevent stale responses from reintroducing deleted evidence. Clear/reset is scoped to its owner.

The portable `learningEvidenceFromResult` has no DOM, local storage, network, clock, random generator or content-pack dependency and can be used by the authenticated submission function. Full-corpus replay retention and the compact derived learning evidence have separate retention policies in the account-data documentation.

## Original content inventory

`src/lib/content-packs.ts` contains ten small, original curated vocabulary compilations: English, Spanish, French, German, Portuguese, Italian, Russian, Hindi, Arabic, and Gujarati transliteration in Latin script. The newly compiled corpora and authored passages are designated CC0-1.0. Each pack has a stable revision, NFC policy, grapheme segmentation, script/direction/font metadata, capabilities and an editorial introduction order. Introduction order is not presented as a measured frequency ranking. Gujarati transliteration is explicitly named and is not Gujarati-script typing.

The generator selects natural words constrained to available keys and the focus key. Sparse sets retain available natural words and supplement them with a seeded alternating vowel/consonant sound-pattern fallback, bounded to 3–6 graphemes. Generated patterns are labelled in the lesson. A focused lesson includes its focus in every word; mixed review is separately labelled. Resource limits bound requested lesson length to 1–2,000 words.

The keyboard views are QWERTY, Dvorak, Colemak, Colemak-DH, AZERTY and QWERTZ. Native/unmapped is an explicit view for other scripts. Color requires observations; no default confidence or fabricated history is displayed. Physical-finger proficiency is not inferred from these logical-character views.

`src/lib/quotes.ts` supplies twelve original authored practice passages with source, author, license and revision. The former unverified famous-person attributions were replaced. `curatedCommonWords` is the unique English base vocabulary; the old `commonWords1000` export is a deprecated compatibility alias with no size claim.

`src/lib/content-library.ts` supplies twenty original code exercises, four each for JavaScript, TypeScript, Python, Rust and SQL. Exercises carry stable IDs, revision, source/license and complete-program/standalone-query classification. SQL is a portable SELECT/CTE subset targeting PostgreSQL 15+.

## Evidence and limits

- `npx vitest run src/lib/__tests__/keybr-engine.test.ts src/lib/__tests__/content-packs.test.ts src/lib/__tests__/content-library.test.ts src/lib/__tests__/learning-evidence.test.ts`: 69 tests passed in the focused run on 15 October 2026.
- `npm run test:content`: all 20 examples passed. Node v22.20.0 parsed JavaScript without execution; TypeScript 5.9.3 performed strict semantic compilation; Python 3.11.9 parsed ASTs; Rust 1.91.0 emitted metadata only. All four SQL exercises passed both SQLite EXPLAIN and PostgreSQL 18.6 EXPLAIN through PGlite 0.5.10. The PostgreSQL check uses a disposable in-memory instance, plans the original SELECT/CTE exercises without executing them, and closes the instance in `finally`. This establishes PostgreSQL/WASM parser/planner compatibility; a real Supabase database, HTTP/Auth/Realtime integration and multi-connection concurrency remain separate release gates. The actual output is saved in [content.txt](../audit/implementation-2026-10-15/content.txt).
- `e2e/learning-v3.spec.ts` covers exact rejected-attempt count/accuracy and one persisted session, reload, keyboard Tab exit, Arabic RTL and simultaneous composition, plus committed input through all ten packs. These browser fixtures simulate committed input and composition events. Native operating-system IME testing and native-speaker editorial review remain separate manual checks.
- Pack `ranked` capabilities remain false pending backend language-cohort validation. Content/input tests do not establish a claim of native-language editorial certification or validated physical layouts for Hindi/Arabic/Russian.
