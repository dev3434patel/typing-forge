# SparowType learning and live keyboard upgrade

Plan recorded before implementation on 20 October 2026. Baseline: main commit `9fc87e2`, public build `e2078121727b20cfc4d5`. This is an upgrade to the existing React/PHP product, preserving its canonical `forge-v3` metrics and the full 3D intro.

## Findings and decisions

| Observed gap / primary research | Implementation decision |
| --- | --- |
| Test/Race have no active live keyboard; adaptive Learn treats the last input as a held key. | One shared keyboard below the passage. Separate actual physical holds, next logical character and the last committed mistake. Never use physical key codes for scoring. |
| [Keybr](https://github.com/aradzie/keybr.com) describes per-key evidence, weak-key practice and gradual introduction. Checked 20 October 2026. | Retain adaptive learning as its own path; add consistent visual guidance and honest observed-input feedback. Implement original components rather than copying its source or assets. |
| [TypingClub difficulty guidance](https://typing.typingclub.com/docs/class-management/class-settings/adjust-class-difficulty.html) describes progressively increasing speed/accuracy requirements. Checked 20 October 2026. | Publish each lesson's criteria before practice and explain every unmet check afterward. The thresholds below are our product policy, not a claim of a universal learning standard. |
| [Typing.com curriculum](https://www.typing.com/resources/learn-to-type/scope-sequence-the-typing-com-guide-to-classroom-standards.pdf) separates key skills, capitalization, numbers, punctuation and assessment. Checked 20 October 2026. | A new structured course, distinct from adaptive drills: keys first, applied text next, sustained speed last. Write original practice passages. |
| Raw replay expires; a newly downloaded result lacks its original configuration. | Store a small durable course assessment with the normal local/session receipt. PHP independently derives `accepted.course`; no separate invented completion counter or schema migration. |

## Scope and ownership

1. **Live keyboard agent:** shared geometry, held-state lifecycle, renderer, finger-reference hints, Learn/Test/Race adapters, persistent visibility controls and targeted tests. Input is observed only in the active typing field; release/blur/visibility cleanup prevents stuck keys. IME and unmapped layouts must not invent physical-key evidence.
2. **Curriculum agent:** one shared catalog, pure grading/progress model, original lessons, local durable assessment integration and regression tests.
3. **Backend integrity agent:** catalog validation, server-derived durable assessment, frontend/PHP agreement, adaptive-assessment isolation, preference validation and deployment packaging.
4. **Primary agent:** course map/practice/result experience, navigation and SEO, research documentation, integration review, browser/accessibility/responsive/performance acceptance and final delivery.

## Course contract

- **36 lessons, six chapters, three original variants per lesson.** Chapters cover home row, upper row, lower row, capitals/numbers, punctuation, then 15/25/35/45/60/80 WPM training.
- The first course explicitly teaches **English / US QWERTY**. Existing adaptive practice retains other language/layout options. Do not imply that the app detects the user's fingers, keyboard model or operating-system layout.
- Foundations form a sequential 30-lesson path. The six-step speed path starts independently, allowing experienced typists to train speed without repeating every introductory drill.
- Two qualifying attempts on **different variants** complete a lesson. A repeated variant, early finish, rejected submission or unrelated test cannot create a second checkpoint.
- Finite drills require completed correct text, sufficient insertion evidence/duration and the stated input-accuracy threshold. Corrected mistakes remain in input accuracy. Early lessons prioritize accuracy; later lessons add speed requirements.
- Speed assessments use the real first-input clock and a complete **30 seconds**, including idle time. They use deterministic public text expanded to at least 2,400 ASCII characters, avoiding target-extension ambiguity. A manual finish or paused speed test cannot qualify.
- Only individual keyboard evidence qualifies for the keyboard course. Composition/virtual input can remain an honestly labelled practice attempt; it cannot be relabelled as physical keyboard mastery.
- A shared catalog lives at `backend/resources/typing-course-v1.json`; the browser and PHP validate the same lesson, variant and thresholds.
- `settings.course` carries bounded course/lesson/variant/assessment identifiers. A lesson/variant-specific content revision isolates personal-best comparisons. The server verifies the actual target rather than trusting client pass flags.
- Progress rebuilds from owner-scoped session records and accepted receipts. Deleting evidence removes its contribution. Legacy/guest-import/rejected rows do not establish course completion. Local progress remains local-unverified until server acceptance; course achievements are not public ranked scores or certificates.
- Course drills retain ordinary per-key practice observations but do not masquerade as adaptive-key unlock assessments.

## Experience

- New **Lessons** navigation and `/lessons` page with an accessible chapter map, explicit locked/available/in-progress/completed states, a useful next step and separate speed entry.
- Lesson preview explains technique, current keys, accuracy/speed/evidence criteria and the two-variant requirement.
- Practice uses the existing canonical typing controller and shared keyboard. No second scoring engine, fake completion timer or keyboard-specific input interception.
- Results show the measured outcome, each pass criterion, checkpoint count, retry and next recommended variant/lesson. Detailed session results remain available without overwhelming the teaching flow.
- Keyboard visibility and finger guidance persist through the existing validated preference/sync system. Keycaps are visual references, not dozens of unnecessary Tab stops.
- Mobile layouts fit at 320–390 px and landscape; chapter navigation, visible focus, contrast and reduced motion remain usable in all themes.

## Verification and release boundary

Run pure grading/replay/owner/retention tests, frontend/PHP parity, preference and input lifecycle regressions, complete source gates, then browser tests for the new course and shared keyboard on Chromium, installed Edge, Firefox and WebKit. Inspect real desktop/mobile screenshots and run accessibility checks on map, preview, active lesson and results. Exercise real PHP course upload/download against an isolated audit database. Verify the packaged shared catalog under Apache.

Check bundle budgets and repeat normal full-intro mobile Lighthouse after the final build. Scene quality must remain unchanged. Record actual results and capability skips; old scores do not certify a new build. Native devices/IME, assistive technologies, public hosting, field INP and universal educational outcomes remain separate checks. Neither finite tests nor marketing language establish "1000% accuracy."
