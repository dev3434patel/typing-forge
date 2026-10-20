# SparowType correction and practice experience

Research and implementation date: **20 October 2026**. This report covers the correction-policy change following Git commit `497ae11`, the optional local bot accuracy challenge, and their regression checks. The final production build is `7f5214eec1843304c7a0`; the preliminary candidate was `b77fa1d75a2e27f357f7`. It does not certify every feature or every physical device.

## Research findings and decisions

Monkeytype's source was inspected at immutable revision `db0db0999746d759e57a362e8a88d85b9910955c`. Source inspection establishes the documented behavior at that revision; it is not a claim that every deployed setting or device was exercised.

| Detail | Primary evidence, accessed 20 October 2026 | SparowType decision |
| --- | --- | --- |
| A correct active word can still be edited. At an empty next word, a correct previous submission blocks Backspace. | [Monkeytype before-delete](https://github.com/monkeytypegame/monkeytype/blob/db0db0999746d759e57a362e8a88d85b9910955c/frontend/src/ts/input/handlers/before-delete.ts#L30-L68) | Lock exact correct words after submission, rather than locking every word. |
| A previous typo, incomplete word or extra-letter word can be reopened when the active input is empty. A correct word remains a barrier even if older mistakes exist. | [Monkeytype before-delete](https://github.com/monkeytypegame/monkeytype/blob/db0db0999746d759e57a362e8a88d85b9910955c/frontend/src/ts/input/handlers/before-delete.ts#L30-L68) | Reopen one immediate incorrect word at a time. Retained text determines locking, so a corrected and resubmitted word locks. |
| Ordinary backward deletion restores previous input without its commit; word deletion restores it empty. | [Monkeytype word navigation](https://github.com/monkeytypegame/monkeytype/blob/db0db0999746d759e57a362e8a88d85b9910955c/frontend/src/ts/input/helpers/word-navigation.ts#L81-L110) | Backspace removes the separator. Ctrl/Alt + Backspace clears the wrong word for retyping. |
| Empty Space is ignored; a nonempty incomplete word can be submitted in normal mode. | [Monkeytype before-insert](https://github.com/monkeytypegame/monkeytype/blob/db0db0999746d759e57a362e8a88d85b9910955c/frontend/src/ts/input/handlers/before-insert-text.ts#L55-L68), [validation](https://github.com/monkeytypegame/monkeytype/blob/db0db0999746d759e57a362e8a88d85b9910955c/frontend/src/ts/input/helpers/validation.ts#L37-L79) | Ignore accidental empty Space without attempts or clock start. Preserve intentionally required repeated spaces in custom passages and composition input. |
| Freedom, confidence, stop-on-error and difficulty are separate settings. Normal defaults do not imply instant failure. | [Monkeytype defaults](https://github.com/monkeytypegame/monkeytype/blob/db0db0999746d759e57a362e8a88d85b9910955c/frontend/src/ts/constants/default-config.ts#L22-L54), [setting metadata](https://github.com/monkeytypegame/monkeytype/blob/db0db0999746d759e57a362e8a88d85b9910955c/frontend/src/ts/config/metadata.tsx) | Preserve SparowType's existing stop-on-error option as a separate practice rule. Do not silently add confidence/max/fail-on-error modes. |
| Monkeytype restricts reopening to a previous word still rendered. | [Monkeytype before-delete](https://github.com/monkeytypegame/monkeytype/blob/db0db0999746d759e57a362e8a88d85b9910955c/frontend/src/ts/input/handlers/before-delete.ts#L30-L68) | SparowType retains its transcript and brings the active word into view; its lock rule is canonical, independent of DOM recycling. This is a deliberate implementation difference. |
| TypeRacer separates local replay timing from network/server timing. | [TypeRacer engineering article](https://blog.typeracer.com/2018/01/29/lag-on-typeracer-and-the-secret-to-unlocking-the-fastest-typeracer-scores/), published 29 January 2018, page also shows 16 June 2023 | Keep local bot feedback immediate and local. Preserve issued server contracts for competitive rooms; do not treat local animations as server-confirmed scores. The historical article does not establish current anti-cheat guarantees. |
| Z-Type's creator describes immediate, satisfying per-key feedback and deliberate targeting. A later mobile article describes changing touch hit areas. | [PhobosLab development article](https://phoboslab.org/log/2011/02/game-on-spotlight-z-type), February 2011; [mobile keyboard design](https://phoboslab.org/log/2015/07/what-makes-an-on-screen-keyboard-fun), July 2015 | Adopt clear action feedback. Preserve exact input in measured practice: game-style inferred touches must never turn an actually wrong character into a correct attempt. |
| Keyboard Jump links typed words to visible movement, with themed characters and animation. | [Typing.com release note](https://www.typing.com/whats-new/1725044115), published 10 June 2024 | Add a small optional accuracy goal within local bot practice. This is our design inference, not a copy of its gameplay or a proven learning-effect claim. |
| Nitro Type news and updates require client rendering in this research environment. | [Official updates](https://www.nitrotype.com/updates) | Do not infer current scoring, rewards or anti-cheat from an unreadable page. No market rank or search-volume claims are made. |

## Implemented behavior

New personal prose tests, adaptive lessons, the structured course and local bot practice use `correct-words-locked`.

1. Type `cat` correctly: it remains editable before Space.
2. Type `cat `: Backspace cannot cross into it.
3. Type `cxt `, `ca ` or `catx `: Backspace reopens the wrong word; a word-delete shortcut opens it empty.
4. If the current word already has text, delete that text first. Reopening occurs only at the empty boundary.
5. A correct following word prevents revisiting older mistakes. Wrong words can be traversed one boundary at a time.
6. Selection, cut, replacement, composition and malformed replay cannot bypass this boundary.
7. Original mistakes remain insertion attempts. Retyping contributes new attempts; editing cannot restore a fictional perfect input-accuracy score.

Recovery hints now describe the available action. A focus overlay during an active session states that the clock continues. Returning through that overlay or Resume restores the saved native caret/selection, then applies the current correction boundary. This fixes a confirmed WebKit case where continuation inserted before the retained final character. Deliberate selections within the current word remain usable. Code and free writing use unrestricted editing. Repeats preserve their recorded policy; historical unrestricted and strict sessions remain replayable in separate comparison cohorts.

The PHP validator independently applies the new rule. Legacy `current-word` still seals every submitted word. Human rooms and ranked challenges keep that issued strict contract in this release; their existing comparisons are not silently changed. Deploy the matching frontend and PHP files together. Older PHP will reject the new policy rather than accept unverifiable evidence, while local results remain recoverable.

## Optional gaming interaction

Local bot setup includes an **Accuracy challenge**, off by default: reach 25 consecutive correct inserted grapheme attempts, including spaces. An error resets the current chain. Deletion neither awards progress nor refunds errors. Canonical event sequences prevent timer refreshes, duplicate callbacks and IME batches from being counted twice. A completed goal remains completed for that run; restarting creates fresh challenge state.

The meter and final best chain are separate from WPM, race progress, course checkpoints and rankings. They add no artificial score, network authority or sound. This first interaction is deliberately bounded; a separate arcade world, rewards economy and claims of superior learning are not implemented.

## Validation

Build identity and the final browser/performance receipts are recorded in `audit/correction-experience-2026-10-20/`. Every status below refers to this change's measured scope.

| Area | Status | Evidence / scope |
| --- | --- | --- |
| Unit suite | PASS | 872 tests across 62 files, including new boundary and challenge tests. |
| TypeScript | PASS | App, node, domain and portable type checks. |
| ESLint | PASS WITH EXISTING WARNINGS | Zero errors; nine existing Fast Refresh warnings. |
| PHP replay | PASS | 520 cases: 495 valid references, 25 expected rejections, zero mismatches; includes seeded sequences and Unicode. |
| PHP course qualification | PASS | 139 cases, all 108 original variants, old/new policies and corrected attempts. |
| Production build and bundle budgets | PASS | Build succeeds; initial, feature and deferred-intro budgets pass. |
| Full 3D source preservation | PASS | All 16 non-test brand source files match the prior committed build after newline normalization. |
| Browser correction and input flows | PASS FINAL BUILD | 112 of 112 cases passed: 28 each in Chromium, installed Edge, Firefox and WebKit, with zero automatic retries. Includes all 25 correction/focus cases per engine, navigation, active focus and pause/resume. |
| Keyboard viewport regression | PASS, PRELIMINARY BUILD | The existing viewport matrix passed in the preliminary candidate across four engines. The final change restores selection without changing keyboard/layout CSS; this is not a claim that the full viewport matrix reran on the final build. |
| Automated accessibility | PASS, PRELIMINARY BUILD | Guest-page/results and course scans passed. The final focus change adds no new markup or styling; native screen-reader and full WCAG acceptance remain unverified. |
| Mobile Lighthouse, full intro | PASS FINAL BUILD | Performance 97 / 97 / 98; accessibility, best practices and SEO 100 in every run. Three fresh profiles, no quality overrides, no score filtering or runtime errors. LCP 2.117–2.277 seconds; CLS approximately 0.000252. |
| Typing throughput / rotation | PASS CORRECTNESS, LATENCY LIMIT REMAINS | Both final-build 495-character driver bursts retained exact text and 100% input accuracy through rotation, with no page errors or document overflow. Event Timing p98 was 32ms unthrottled and 144ms at 4× CPU. |
| Security / server replay | PASS SCOPED CHECKS | Native replay rejects forbidden prefix changes and malformed evidence. Competitive issuance and authentication code are unchanged; this is not a new penetration test or proof of human input. |
| Offline / PWA | PASS BUILD, RUNTIME UNVERIFIED THIS PASS | Versioned 94-file public cache generated and packaged. No new installed/offline-network acceptance is claimed for this release. |
| Production SEO configuration | UNVERIFIED | Local homepage Lighthouse SEO is 100. Production canonical origin and sitemap still require `SPAROWTYPE_SITE_URL`. |
| Physical mobile keyboards / native screen readers | UNVERIFIED | Browser emulation and scripted composition do not establish real device or assistive-technology behavior. |
| Production account sync, multiplayer and hosting | UNVERIFIED | This pass runs no synthetic account/data mutations against the user's main local database or a hosted deployment. Pure validation is independently tested. |

No finite suite establishes universal perfection. The earlier [keyboard viewport audit](KEYBOARD_VIEWPORT_FIX_2026-10-20.md) remains the evidence for its earlier build, including its documented throttled latency limit; scores in this report apply only to the build identified in their receipts.

The local PHP hosting package contains the exact production frontend and current private backend source, checked by file sets and hashes. It contains no local configuration, storage or tests. This is packaging verification, not hosted deployment or HTTP acceptance.

## Retained investigation results

| Build / receipt | Observed outcome | Investigation and disposition |
| --- | --- | --- |
| Preliminary `b77`, `regressions.json` | 270 of 276 passed | Two already-loaded tests still sought the old focus-button label. Four WebKit cases did not find the expected route controls. A later check exposed the navigation fixture's stale 1280px expectation; the product's 1200px breakpoint is correct. The other loading failures did not recur in the single-worker check; their precise cause is unconfirmed. |
| Preliminary `b77`, `correction-flows.json` | 298 of 304 passed | Four copies of a new test incorrectly expected perfect final accuracy after ending a finite passage early. The engine correctly counted its missed remainder; the corrected test completes the passage. Two Firefox cases timed out during automation/teardown and passed in the single-worker confirmation. |
| Preliminary `b77`, `correction-confirmation.json` | 34 of 36 passed | WebKit exposed a real toolbar-return caret movement, making later input and the goal chain wrong. Fixed with explicit saved-selection restoration. The navigation case independently confirmed the stale test breakpoint. |
| Final `7f`, `final-acceptance.json` | 112 of 112 passed | Full correction spec plus focus, navigation and pause/resume checks across Chromium, installed Edge, Firefox and WebKit. No automatic retries. |

One OS reading during the overlapping exploratory jobs recorded 343,632 KiB free of 16,454,352 KiB total memory. Resource pressure is a plausible contributor to timing failures, not an established explanation for every failure. No user application was stopped. The real caret bug and the stale expectations are treated separately from that inference.

## Performance interpretation

The final throughput protocol declares one unthrottled and one 4× CPU run before collecting results, without automatic retries. Each run uses an actual browser key-event burst, settles fonts and finite animations, and rotates from portrait to landscape halfway through the assigned text. The unthrottled burst measured approximately 1,505 character WPM; the throttled burst measured approximately 173. These describe an automated local driver workload, not human typing or device certification. The requested zero driver delay is not itself an observed typing speed.

All 495 inserted characters survived in both runs, and the midpoint retained the exact first 247 characters. Quantized observed typing-event durations had p98 / maximum values of 32 / 96ms unthrottled and 144 / 176ms at 4× CPU. The throttled sub-100ms interaction target is **not met**. Field INP, real Android/iOS input and native assistive technology remain **UNVERIFIED**. The small per-session selection restoration adds no ordinary-input or composition listener and leaves the full intro source unchanged.

The exploratory receipts span two builds. Their combined coverage summary is not a claim that every exploratory case ran again on `7f`. Final acceptance is the explicitly recorded 112-case scope; unchanged core/PHP source hashes support the separately recorded unit and replay checks.

## Reproduce the local checks

Run the preview at `http://127.0.0.1:4173` before the browser commands. These are the Windows/PowerShell checks used for this local release; installed Edge and the Playwright browser engines must be available.

```powershell
npm run typecheck
npm run lint
npm run test:run
npm run test:php
npm run test:course-php
npm run build
npm run check:bundle
node audit/correction-experience-2026-10-20/freeze-build.mjs
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:4173'
$env:PLAYWRIGHT_BROWSERS='chromium,edge,firefox,webkit'
npx playwright test e2e/current-word-correction.spec.ts e2e/typing-experience.spec.ts e2e/navigation-accessibility.spec.ts e2e/typing-course.spec.ts --grep 'current-word-correction.spec.ts|practice aliases|blur preserves|paused speed practice' --workers=2
node audit/correction-experience-2026-10-20/run-lighthouse-final.mjs
node audit/correction-experience-2026-10-20/run-typing.mjs
node scripts/package-php-hosting.mjs
node audit/correction-experience-2026-10-20/verify-hosting-package.mjs
```
