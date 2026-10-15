# Metric conformance audit — 15 October 2026

This audit examined the portable Forge v3 engine, event replay, qualified learning projection and shared server candidate validator. It found and repaired reproducible correctness defects. The automated matrix is finite evidence of the described behavior, not a proof covering all possible browser input, Unicode versions, clocks or hostile transcripts. No metrics policy/version was silently replaced, and older results are not rewritten to appear to match new replay behavior.

## Sample arithmetic and what it establishes

The supplied display can be internally consistent if its counts mean **136 correct, 10 incorrect, 1 extra and 1 missed**, with 156 insertion attempts and 135 correct attempts in 30 seconds. The retained count is 147; 136 is the correct count in this interpretation.

| Displayed measure | Exact calculation | Presentation |
| --- | --- | --- |
| Input accuracy | 135 / 156 × 100 | 86.538461538…%, or 86.5% |
| Final text accuracy | 136 / (136 + 10 + 1 + 1) × 100 | 91.891891891…%, or 92% to a whole percent |
| Retained text | 136 + 10 + 1 | 147 graphemes |
| Correct-character WPM | 136 / 5 / 0.5 | 54.4 |
| Word WPM | 110 credited units / 5 / 0.5 | 44 |
| Raw WPM | 147 / 5 / 0.5 | 58.8, or 59 |
| Attempt rate | 156 / 5 / 0.5 | 62.4, or 62 |

Word WPM can be lower than correct-character WPM because matching characters inside an incorrect or skipped word do not receive whole-word credit. Final correct characters can exceed correct historical attempts: entering a space before the expected remaining letter is an incorrect attempt, yet the retained separator occupies its correct separator slot after the short word is submitted.

The conformance fixture constructs one **synthetic existence witness** for these exact totals. It has nine deleted incorrect insertions, one early separator, 110 credited units and the retained breakdown above. The event log, target, metrics and word trace are saved under `captures.sampleConsistencyWitness` in the evidence JSON. This demonstrates possibility; it does not identify the user's actual event history. Verifying the actual session requires its exported configuration, issued targets, normalized events, pause intervals and exact elapsed duration. If 136 instead means the entire retained count, the stated breakdown and rounded raw WPM conflict with that interpretation.

## Demonstrated defects and repairs

| Boundary | Reproduction before the fix | Current behavior |
| --- | --- | --- |
| Future target issuance | Start with target `a`, enter `ab`, append `b`, then finish. Live input accuracy was 50%; final replay could report 100% against the final target. | Replay uses the target issued at each event. Live, final, learning and server replay remain 50%. Forged 100% metrics are rejected. The server derives late-extension personal-best ineligibility independently of client flags; ordinary preissued extensions can remain eligible. |
| Equal-clock ordering | Input and append can share the same millisecond; timestamps alone cannot establish which happened first. | Optional `afterSequence` records actual order. Legacy missing values retain a documented issue-before-input interpretation. |
| Qualified key timing | Server aggregation recorded speed intervals for incorrect attempts and after composition or batched commits. | Server aggregation uses the same portable learning projection as local learning. Only qualified individual correct intervals supply latency. Attempt/error observations remain intact. |
| Lifecycle metadata | Nonfinite start/finish timestamps, unknown finish values or contradictory unstarted evidence could survive personal candidate validation. | Shared validation rejects nonfinite/date-unrepresentable metadata, unknown lifecycle values, inconsistent durations, invalid timeout claims and false finite-target completion. |
| Early timeout | Calling `finish('timeout')` before the deadline could create the configured elapsed duration, even before input started. | An early explicit timeout throws without finalizing the controller. Real and delayed deadlines still finalize at the configured active duration. |
| Unicode edit boundary | Separate `e` plus combining accent, an Indic sign or an emoji joiner could leave multiple stored units although the visible final text is one grapheme. | An atomic committed edit reconciles boundaries and prose NFC across existing text. Code retains its original code-point spelling except its declared CRLF normalization. Earlier attempts are preserved. |
| Passage comparison identity | Custom `cat` and an unrelated long private passage, or two different public quotes/code snippets, could receive identical comparison keys. | New `forge-cohorts-v2` keys include bounded public passage IDs for quote/code. Custom/private and unidentified fixed passages are isolated by session ID and excluded from client/server personal-best eligibility, even with a forged client eligible flag. Raw passage text is not retained in the key. |

Historical sessions recorded through the affected issuance or Unicode paths may now show an honest evidence mismatch. The implementation does not fabricate replacement historical attempts. Browser replay validity also does not prove that a human typed the input.

## Independent and cross-layer verification

`src/lib/typing-core/__tests__/conformance.test.ts` contains the following finite matrix:

| Matrix | Scope | Vectors |
| --- | --- | ---: |
| Independent short prose reference | One/two-word targets from `a`, `b`, `ab`, `ba`; every transcript of length 0–4 over `a`, `b`, `x`, space; live and finite final accounting | 13,640 |
| Independent ASCII code edits | 150 fixed seeds × 50 range insertions, replacements and deletions; separate string-splice/positional reference | 7,500 |
| Independent ASCII prose edits | 150 fixed seeds × 50 range edits; separate word-string and historical attempt reference | 7,500 |
| Independent Unicode edits | 100 fixed seeds × 50 range edits containing accents, Indic signs, ZWJ emoji and regional indicators; direct string-splice reference and native segmentation | 5,000 |

The ASCII reference does not call canonical alignment or reuse its word-credit loop. The Unicode string reference independently applies code-point-preserving splices; segmentation itself intentionally uses the platform Unicode segmenter. This checks boundary handling, not the correctness of the runtime's Unicode database.

Additional regressions check target availability and equal-clock order, live/server/learning replay agreement, forged metric rejection, partial playback before/after appends, exact word-credit trace sums, independent final/attempt accuracy, pauses and inactivity in latency, batch/composition attribution, malformed wall metadata, delayed callbacks, early timeouts, combining/emoji/Indic deletion, snapshot/full-replay agreement, private comparison isolation and identified public passage cohorts. Existing golden tests cover exact deadline exclusion, rejected attempts, finite completion, shared race starts, frozen idempotence, explicit word submission, zero/absent evidence, long idle buckets and free writing.

The full verification run after the passage-comparison follow-up passed **431 tests in 27 files**. App, Node/tooling, strict domain and portable-only typechecks passed. Scoped lint over the core, learning projection and shared validator passed. Root release checks may add further tests; the saved log is the authority for this specific run.

Evidence files:

- `audit/accuracy-research-2026-10-15/core-conformance.json`: finite vector totals plus synthetic sample and issuance event evidence.
- `audit/accuracy-research-2026-10-15/core-suite.log`: complete unit-suite output.
- `audit/accuracy-research-2026-10-15/core-typecheck.log`: all TypeScript gates.
- `audit/accuracy-research-2026-10-15/core-lint.log`: scoped lint output; an empty file indicates a clean command.

Reproduction from the project root in PowerShell:

```powershell
$env:FORGE_AUDIT_ARTIFACT_DIR = 'audit/accuracy-research-2026-10-15'
npm run test:run
npm run typecheck
.\node_modules\.bin\eslint.cmd src/lib/typing-core src/lib/learning-evidence.ts supabase/functions/_shared/validation.ts
```

## Boundaries and limits

- This matrix is bounded. It does not enumerate every edit history, script, IME/browser delivery sequence, device layout or timestamp magnitude.
- The independent word reference uses nonempty target words separated by ASCII spaces. Prose currently recognizes ASCII space as its word delimiter; tabs/newlines and other whitespace retain literal grapheme behavior. Code has a separate positional policy. Repeated/leading empty prose word slots are outside the independent word-credit reference matrix.
- Insertion attempts describe committed insertion units, not physical keydown count. A composition batch cannot supply individual key timing. A later joining edit can reduce retained grapheme count without deleting an earlier attempt, so `attempts - deletedUnits = retainedUnits` is not a universal Unicode identity.
- Native segmentation depends on runtime Unicode data. The code-point fallback is identified and comparison-ineligible; broad cross-runtime ranked Unicode equivalence is not claimed.
- Older target segments without issuance sequence metadata cannot recover equal-clock order that was never recorded. The documented compatibility interpretation is explicit rather than inferred.
- Wall timestamps are presentation metadata checked for finite values and consistency, with a one-second jitter tolerance. Replay cannot establish trustworthy personal elapsed time from a client alone. Server-issued challenge/race timing is a separate authority.
- Local eligibility remains provisional. Server personal-best filtering and ranked challenge rules are distinct from replayed metric correctness. Ranked challenges prohibit target extensions; the shared validator independently excludes late extensions and unstandardized/private content from personal-best eligibility.
- Public passage IDs are editorial content identities, not cryptographic assertions about arbitrary caller content. Custom/private sessions deliberately lose cross-session PB badges rather than retaining raw text indefinitely or trusting a user-assigned content ID. Historical comparison keys and observed metrics are left intact; new policy keys form separate cohorts.
- Real authenticated deployment, synchronization and two-device behavior require a configured backend and credentials. Passing portable replay/validator tests does not claim such a deployment was exercised.
