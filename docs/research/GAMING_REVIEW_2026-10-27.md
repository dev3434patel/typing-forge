# SparowType gaming and input review

Research date: 27 October 2026 (client date). Sources below were opened during this review. This is a primary-source feature and interaction review; no Google Trends search-volume data or global market-rank claim was verified. The live Monkeytype About page required JavaScript in the research reader, so its public implementation was used instead. No competitor code, art, audio or text collection was copied.

## Verified findings

| Primary source | What was verified | SparowType decision |
| --- | --- | --- |
| [ZType, creator-linked browser game](https://zty.pe/) and [PhobosLab games catalogue](https://phoboslab.org/games) | The creator identifies ZType as a type-to-shoot space game and links this exact domain. | Keep the direct relationship between an exact character and visible target feedback. Use original SparowType art and rules. |
| [PhobosLab: What makes an On-Screen Keyboard Fun?](https://phoboslab.org/log/2015/07/what-makes-an-on-screen-keyboard-fun), published 9 July 2015 | The developer explains avoiding simultaneous targets with the same initial, spreading valid initials across the keyboard, and adapting touch areas to likely keys in the iPhone version. It explicitly distinguishes the original web version from the mobile redesign. | Unambiguous target selection is valuable. Adaptive touch areas would alter what a measured key means, so they are not appropriate for silently improving trainer accuracy. A future assisted touch game must identify assistance and keep its scores separate. |
| [Monkeytype test lifecycle source](https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/src/ts/test/test-logic.ts) | Test start activates its timer and optional pace caret. Restart guards prevent overlapping restarts/results; repeat-passage and missed-word practice are explicit options. | Keep start, restart and result ownership explicit. Responsiveness includes safe rapid restart and recovery, not just a smooth visual caret. |
| [Monkeytype event statistics source](https://raw.githubusercontent.com/monkeytypegame/monkeytype/master/frontend/src/ts/test/events/stats.ts) | Accuracy counts correct and incorrect input events. Timing and character categories are computed separately; the source also handles composition-related normalization. | Keep game score separate from canonical typing metrics. Wrong attempts remain counted after correction. Compare named definitions rather than assuming two displayed WPM numbers mean the same thing. |
| [Keybr official help implementation](https://raw.githubusercontent.com/aradzie/keybr.com/master/packages/page-help/lib/HelpPage.tsx) | Lessons use per-key typing statistics and generated pronounceable words. A small initial alphabet expands with progress, and a weak target letter is deliberately included in generated words. The help also supplies a keyboard/finger-zone illustration. | Games can complement guided practice. They should not replace measured per-key instruction or pretend an arcade score proves mastery. Offer focused practice based on real retained attempt evidence. |

The ZType mobile article is historical design evidence, not proof that its 2015 iPhone behavior is unchanged in the 2026 browser game. Direct interactive ZType gameplay and physical iPhone behavior were not exercised by this subtask. Unverified fan-site descriptions and a similarly named domain were excluded.

## Current SparowType findings and bounded fixes

| Finding | Evidence in current code | Change in this review | Verification scope |
| --- | --- | --- | --- |
| Backspace emitted a success tone without a correct insertion. | `NativeGameInput.commit` called `onCorrect(!machine.incorrectKey)` for deletion edits too. | `ArcadeMachine.edit` now returns `true` or `false` only for recorded insertion feedback; deletion and ignored edits return `null`. The input adapter plays no insertion tone for `null`. Final word-completing letters retain their sound even though automatic submission clears last-event input feedback. | Five real-machine tests cover correct/final letters, wrong target and in-word attempts, deletion after a miss, composition and paused/deadline/finished guards. |
| The target itself did not show typed progress. | `ArcadeScene` drew one uniformly colored target; the retained draft lived in a separate textarea. | The current target shows the matched prefix and underlines the next grapheme. All remaining letters stay readable. An equivalent DOM target/count provides a text alternative. | Six presentation tests cover empty/partial/complete/deleted/mismatched prefixes, combining graphemes, mirrored RTL clip geometry and phantom masking. Browser visuals are a separate acceptance step. |
| Per-game decorative accent is not a general text-contrast guarantee. | Arcade accents identify worlds and borders; some bright colors also need different treatment in light themes. | New matched-prefix text uses the existing theme's `--accent` text token. Remaining target text retains `--text`. | This preserves established theme ink selection. It does not independently certify every Canvas pixel or every theme's contrast. |
| Complex text must keep its shaping. | Drawing each target fragment separately can disturb kerning or joined script forms. | Canvas progress repaints the complete label through a clip; the word is not reconstructed as separately drawn letter runs. The next-character cue is an underline and does not move the label. | Unit drawing assertions verify full-label repaint and mirrored RTL bounds. Physical/native RTL rendering remains unverified. Current editorial targets are English. |
| Hidden memory targets must stay hidden. | Phantom targets intentionally replace later letters with dots. | Both the visible label and DOM progress keep the displayed mask; only the actual matched-unit count advances. | A masked label is asserted not to repaint the unmasked word. |

The new target segmentation is memoized by the short current target/draft. The renderer does not read or segment the complete retained transcript every animation frame. Existing canvas, reduced-motion, focus, timing, attempt accounting and power-up ownership are retained. No 3D intro file, effect, geometry, camera setting or asset was changed by this review.

## Tests performed by this subtask

One focused Vitest invocation used the existing test environment and `--maxWorkers=1`:

```text
npx vitest run src/games/engine/__tests__/edit-feedback.test.ts src/games/ui/__tests__/target-feedback.test.ts src/games/engine/__tests__/canonical.test.ts src/games/ui/__tests__/native-game-guards.test.ts src/games/engine/__tests__/first-input.test.ts --maxWorkers=1
```

Result: **79 tests passed in five files**, zero failures; Vitest duration 2.69 seconds. This includes the final masked DOM-label assertion. `git diff --check -- src/games` returned zero errors. These checks are not a browser, performance, physical-device, assistive-technology or whole-product acceptance result.

The opt-in script `audit/2026-10-21/final19-arcade-mobile.mjs` is prepared for the frozen source19 preview. It uses real native typing against dynamic visible Word Invaders targets, a fresh 390 × 844 context, four-times CPU throttling, a retained-prefix rotation, exact canonical export checks and separate thresholded Event Timing results. It also produces controlled guest 390 px and 1440 px partial-target screenshots. Its structured test repeats real prefix corrections to reach at least 150 correct insertion attempts within a bounded run. It does not fabricate elapsed time, dispatch synthetic typing events, reduce game quality or claim physical-device INP. At preparation time this script is **NOT-RUN**; the root acceptance receipts must supply its actual outcome.

## Follow-up work, not completed claims

1. **Unambiguous waves:** consider unique live first letters for the beginner shooting game. Today the nearest matching target wins deterministically, which is valid but can surprise a beginner. Any change needs seeded generation and boss/splitter/target-pool tests; it was not folded into this hotfix.
2. **Pause efficiency:** the present animation loop continues drawing while paused or waiting for first input. Stopping/restarting that loop could reduce mobile work, but must preserve first-frame drawing, theme/resize invalidation, resume ownership and timed outcomes. It was not changed without that wider validation.
3. **Readable threat composition:** crowded labels currently have no overlap solver. A later design pass can use measured label bounds and deterministic lanes, with no teleporting or physics changes during a word.
4. **A richer original shooter:** add recognizable original enemy silhouettes, stable hit and destruction feedback, and a restrained player craft. Keep decorative combat separate from accuracy/WPM and offer quiet/reduced-motion variants. A richer scene is not complete merely because eight mode names exist.
5. **Learning transfer:** add a post-run focused practice action based on measured weak keys and mistakes. Avoid invented improvement percentages and do not unlock mastery from game score alone.
6. **Competitive depth:** verified daily boards, Arena seasons/ELO, sustained capacity, physical mobile keyboards and native assistive-technology journeys remain separate work. Local practice records must stay clearly identified.

No release should call these remaining items complete, or call all browsers/devices perfect, based on this bounded game polish.
