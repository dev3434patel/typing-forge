# Accuracy research and product upgrade

This follow-up answers the supplied result, compares the public Monkeytype and Keybr implementations, and records the changes made to Typing Forge. Research began on 15 October; final integration continued on **16 October 2026, Asia/Calcutta**. It supersedes the earlier implementation ledger where the features or verification counts differ. The full source comparison is in [the research report](COMPETITOR_ACCURACY_RESEARCH_2026-10-15.md); the route-by-route inventory is in [the product verification ledger](PRODUCT_VERIFICATION_2026-10-15.md).

## What the supplied score means

**86.5% describes your typing attempts, not the reliability of the scoring engine.** From the numbers pasted into the chat:

| Measure | Arithmetic | Finding |
| --- | --- | --- |
| Input accuracy | 135 correct insertion attempts / 156 total × 100 | 86.538…%, displayed as 86.5% |
| Final text accuracy | 136 correct / (136 correct + 10 incorrect + 1 extra + 1 missed) × 100 | 91.891…%, originally rounded to 92%; the interface now shows one decimal when needed |
| Raw speed | (136 + 10 + 1) retained units / 5 / 0.5 minutes | 58.8 WPM, displayed as 59 |
| Attempt rate | 156 inserted units / 5 / 0.5 minutes | 62.4, displayed as 62 |
| Edit balance | 156 inserted − 9 deleted | 147 retained units, consistent for this example |
| Credited WPM | Correct eligible word units / 5 / 0.5 minutes | 44 is possible, but the actual target and events are needed to verify it |
| Consistency and five-second burst | Need timestamps, bucket durations and complete windows | Cannot be audited from the pasted aggregate values alone |

An untouched timed-test tail is not a mistake; the 485 future positions are excluded from final accuracy. Deleted mistakes stay in input accuracy. Final character counts can differ from correct insertion attempts because an edit or word skip can change final alignment. A synthetic witness in the conformance fixtures demonstrates that all the supplied aggregate counts can coexist; it is explicitly **not** the original user's event history.

## Comparison conclusions

Monkeytype and Keybr do not share one universal accuracy denominator. Monkeytype counts eligible correct versus total input events. Keybr marks typo positions among accepted lesson steps, so repeated errors at one position do not create the same denominator as Forge's all-insertion policy. Forge also differs from Monkeytype in its final partial-word credit and consistency mapping. These policies are documented rather than presented as interchangeable scores.

The research inspected pinned official source and browser specifications, with separate fact-checks for TypingClub, TypeRacer, Typing.com, Ratatype and the supplied hardware table. Claims of global number-one status, universal certificate recognition, switch types guaranteeing fewer errors, and worldwide feature novelty are not established by those sources. Keybr is open source and already includes code and multiplayer. Kinesis Freestyle Pro is staggered; it is not the same columnar layout as Advantage360.

## Implemented user-facing changes

- **Every number, explained:** results display actual numerator/denominator arithmetic for input accuracy, final correctness, credited WPM, raw speed and attempt rate. Display rounding and untouched future text are explicit.
- **Word credit:** an optional paginated table shows the target word, retained input, exact word/separator credit and reason. It consumes a trace from the canonical scorer, not a second UI scoring formula.
- **Recorded-edit replay:** seek or play the observed normalized edits at 0.5×, 1× or 2×. It shows retained text and edit history, preserves corrected errors and uses lightweight snapshots rather than rebuilding the chart every frame. The slider supports fractional millisecond endpoints. Replay stops when hidden/unmounted. This is a local reproducibility check, not proof of human input or cloud acceptance.
- **Precision mode:** incorrect insertion attempts count but do not advance the caret. The user types the expected character to continue; Backspace is not required. Its comparison cohort is separate from ordinary practice.
- **Keyboard Lab:** explicit optional browser layout mapping, an honestly labelled manual fallback, observed key/code and release/repeat state, layout agreement hints, measured transition samples, pair drills and targeted Learn links. Observations stay in memory and reset on owner change/navigation. It does not fingerprint brand/switches or diagnose hardware health.
- **Clearer comparisons:** custom/private and unidentified fixed passages do not earn misleading cross-passage personal bests. Identified public quote/code exercises use their content identity; comparison keys retain no private passage text. Historical cohort keys and metrics are not rewritten.
- **Account workspace privacy:** an account change unmounts the previous route workspace, clearing unsaved private passages, in-progress input, transient results and route messages. Returning to an account can still load its own saved history. Switching accounts intentionally discards unsaved practice.
- **Stable command ownership:** one controller handles the command shortcut and lazy palette state. Holding Ctrl/Cmd+K no longer repeatedly closes/reopens the palette; composing input is excluded from the global shortcut.

The distinctive practice path is transparent: observed mistake or transition → focused practice → matched repeated retest. Repeated-text improvement is labelled and is not presented as proof of improvement on unseen content.

## Demonstrated defects repaired

1. Appending a target could retroactively change earlier wrong attempts into correct attempts during final replay. Replay now uses the target actually issued for each event, including event-relative ordering for equal timestamps. Late extensions after overtyping cannot grant personal-best eligibility on either client or server.
2. An early `timeout` finish could manufacture the full configured elapsed duration. The controller now rejects a timeout before the actual deadline.
3. Joining Unicode edits could leave internal retained units inconsistent with whole-string grapheme segmentation. Boundary reconciliation preserves the final logical transcript without erasing historical attempts.
4. Server key aggregates used timing rules different from the qualified learning projection. They now share the portable projection and exclude unsuitable timing around incorrect, composed and multi-grapheme events.
5. Server candidate lifecycle metadata admitted malformed timestamps/finish states. Consistency checks now reject those malformed candidates; they do not pretend a client wall clock is authoritative.
6. Account/session deletion could follow the newly active account rather than the original owner's intent. Operations now bind the expected owner and captured bearer; old acknowledgements cannot clear the new account's data. No real account was deleted during testing.
7. History could briefly expose the previous owner's cached records during an account switch. Owner-keyed visibility now returns an empty/loading view until the matching owner data is ready.
8. Quick match could return the requester's existing room with a different duration. The SQL path now matches the requested duration, with a regression fixture.
9. An account switch could leave the previous account's unsaved custom passage visible. The new route workspace is keyed by owner. A browser regression reproduced the exposure before the fix and checks that the passage and input disappear after an intercepted cross-tab account change. Fixture identities and requests never reach a real cloud service.
10. Holding the command shortcut could reopen a palette that the first keydown had closed. The repeat-event browser regression fails on the archived older build and passes with the single controlled shortcut owner in all three engines. This fixes repeat behavior; it does not claim to fix the separate observed runtime/loading delays.

See [metric conformance](METRIC_CONFORMANCE_2026-10-15.md), [Keyboard Lab](KEYBOARD_LAB.md) and [data/deployment](DATA_AND_DEPLOYMENT.md) for contracts and detailed evidence. The new owner-intent migration is additive; no remote migration was performed.

## Verification and limits

The latest integrated counts and exits are saved in [verification-summary.json](../audit/accuracy-research-2026-10-15/verification-summary.json) and the linked implementation ledger. The final current-build Chromium suite passed **50 cases with two cloud skips**. The Firefox guest-profile comparator passed **one case** with tracing disabled; normal tracing remains enabled and the earlier teardown failure is retained. The conformance matrix includes **13,640 independent prose word vectors**, **15,000 randomized ASCII edits** and **5,000 randomized Unicode range edits**, plus explicit server forgery and ownership fixtures. These are finite tested cases, not a mathematical proof of all possible interactions.

The browser inventory covers all six practice modes, five code languages, ten language-pack input adapters, learning, history, themes/preferences, commands, mobile navigation, guest/account gates, local bots, result export, evidence replay, precision mode and Keyboard Lab across selected engines. Synthetic committed/composition events are adapter evidence; they are not native operating-system IME certification or physical typing measurements.

Browser verification is not uniformly green. The rebuilt 156-case matrix passed **149**, skipped **six** credential-dependent cases, and failed **one WebKit shortcut case**. The trace captured the shortcut being pressed before React's workspace mounted. Waiting for a visible command control repairs that test sequence, but repeated checks still exposed runtime stalls. After the controlled repeat fix, all three engines passed the updated command behavior in the 12-case profile suite; that run had **11 passes and one Firefox context-teardown timeout**, with snapshot/Juggler errors in the browser log. Final Chromium and Firefox comparator results are recorded in the machine summary. Failed traces and [diagnostic probes](WEBKIT_VERIFICATION_2026-10-15.md) are retained; isolated passing runs do not erase earlier failures. Playwright WebKit on Windows is not certification of Safari on Apple devices.

Live Supabase Auth/HTTP/Realtime, independent concurrent connections, actual scheduler execution and real account deletion remain deployment gates. No production database, account or public site was modified. Native devices/IMEs, assistive technologies and field performance need further real-world acceptance. Extended specification items such as custom themes, settings import, onboarding and public result-link UI remain tracked separately. Universal “10000000% accuracy” is not a defensible software guarantee; reproducible evidence, explicit policies and visible failure states are the release standard.
