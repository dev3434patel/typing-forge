# Keyboard lab

Implemented 2026-10-15. Route: `/keyboard-lab`.

The lab adds a focused input compatibility check and an original transition studio. It does not participate in session scores, personal bests, ranking, achievements or mastery. It is a practical bridge from input setup to deliberate practice.

## What the feature measures

- The physical code and logical key reported by each keyboard event inside either focused lab textarea.
- Keydown, keyup and repeat observations, including an explicitly uncertain state when focus loss clears a held key without receiving keyup.
- The Caps Lock state reported by the latest event, without treating it as a permanently monitored device state.
- Browser keydown-to-keydown intervals for printable pairs. Only intervals greater than zero and no longer than 2,000 ms are retained. A pair needs at least three samples before the interface can suggest it.
- A median interval and the number of observations for each pair. At most 60 recent samples per pair, 256 pairs and 128 physical codes are retained in memory.

Repeat events, named control keys, spaces, shortcuts, dead keys and composition events cannot produce pair timings. Focus changes and composition boundaries break continuity. Real keyboard timings and event delivery depend on the browser, operating system, timer precision and scheduling; these numbers are not switch latency measurements. Faster does not mean more accurate.

The pair drill is generated from measured characters. Before enough observations exist, it uses an explicitly labelled editorial starter pair from the current language pack. The drill does not infer which finger was used or award an accuracy score. The Learn link includes only repeatedly observed characters that belong to the current language pack, and leaves actual assessment to a lesson.

## Browser layout capability

`getLayoutMap()` is invoked only by “Read browser layout”. The code checks secure context and feature availability, catches blocked or failed requests, and keeps the manual survey usable. It never calls Keyboard Lock, WebHID or a permissions probe. Browser map support is limited and the API requires a secure context. [MDN: Keyboard.getLayoutMap](https://developer.mozilla.org/en-US/docs/Web/API/Keyboard/getLayoutMap)

The physical `code` and logical `key` are deliberately separate: a code can refer to a different character on another layout, and a virtual or accessibility input may approximate physical codes. [MDN: KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code)

Partial desktop reference maps cover QWERTY, Dvorak, Colemak, Colemak-DH, AZERTY and QWERTZ. The lab compares observed **letter mappings**, ignores unsupported reference positions, and displays the denominator. Multiple matching references remain ambiguous. Locale variants and remapping can disagree with these partial maps. A fresh browser snapshot replaces older manual layout hints; subsequent unmodified manual observations take precedence. No detected hint changes preferences automatically. The user must press “Use this practice layout”, which changes the app’s virtual reference and does not change the operating system.

Composition is identified through both the input’s composition boundaries and `KeyboardEvent.isComposing`. This avoids inventing physical pair timing from composed text. [MDN: isComposing](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing)

Repeat events have their own counter and do not become independent transition evidence. [MDN: repeat](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat)

## Privacy and accessibility

Lab observations, typed text and browser mappings exist only in component memory. They are cleared by reset, reload, navigation that unmounts the route, or an account change. They are not stored in IndexedDB or localStorage, uploaded, or merged into learning history. Only a separately confirmed practice-layout preference uses the existing account-scoped preferences mechanism.

All key handlers belong to the two explicit textarea controls. No window or document keyboard listener is added. Tab and Shift+Tab keep native navigation; Escape blurs the current lab input. Blur stops capture, clears held states, and breaks timing continuity. Live announcements are limited to capture state, explicit layout requests and preference confirmation; per-keystroke output is not an aria-live stream. The keyboard view includes text labels and a horizontally scrollable diagram that does not widen the page on mobile.

The browser cannot establish keyboard brand, model, switch type, finger placement, hardware health or the authenticity of the source of an event. This lab makes none of those claims. Missing observations never diagnose a faulty key. It is not a hardware benchmark, biometric classifier or medical assessment.

## Source and verification

- `src/lib/keyboard-lab.ts`: portable model and explicit browser capability adapter.
- `src/lib/__tests__/keyboard-lab.test.ts`: 48 focused unit cases passed. Covers immutable observations, key/code differences, held state, repeats, composition, shortcut exclusion, Unicode, unknown codes, timing boundaries, insufficient evidence, bounded samples, medians, original drill generation, reference ambiguity and secure/unavailable/blocked browser API paths.
- `src/pages/KeyboardLab.tsx`: accessible setup and transition studio.
- `e2e/keyboard-lab.spec.ts`: all eight browser cases passed on Chromium (7.1 seconds), Firefox (16.0 seconds) and WebKit (14.8 seconds) against a static production build: 24 successful case/engine combinations. Covers focus scope and navigation, explicit capability access, unavailable/blocked fallback, manual confirmation, measured drill and Learn link, composition/repeat exclusions, ephemeral reset/reload, and mobile overflow. Browser capability outcomes are controlled test fixtures; these checks do not claim physical hardware access was approved or validated.

Focused type checking passed with the repository’s app, Node, domain and portable configurations. Scoped ESLint passed with zero errors and zero warnings.

Evidence is saved under `audit/keyboard-lab-2026-10-15/`: `unit-tests.txt`, `browser-tests.txt`, `firefox-browser-tests.txt`, `webkit-browser-tests-final.txt`, `lint.txt`, `typecheck.txt` and `preview-build.txt`. Empty lint files denote successful commands with no diagnostics. A Vite development run initially exposed the mobile overflow issue and then reloaded during other shared edits; the final browser evidence uses a static build to avoid those reloads. The fixed map keeps each visually hidden key label positioned within its own key cell, so screen-reader text cannot escape the scroll container and widen the page.

One initial two-worker WebKit run stayed on the lab page after a Learn-link click. The same flow passed unchanged in an isolated rerun and the complete one-worker suite. Both the initial result and final evidence are retained. The cause of that intermittent navigation failure is not established; no product patch or weakened assertion was introduced to hide it. Physical devices, native IMEs, accessibility tools and browser performance still need release verification.

`playwright.config.ts` retains Chromium as the default. Set `PLAYWRIGHT_BROWSERS=firefox`, `webkit`, a comma-separated selection, or `all` for additional engines. Invalid names fail explicitly. The existing external `PLAYWRIGHT_BASE_URL` behavior remains unchanged. All-engine discovery correctly lists 24 lab case/engine combinations; the config passes scoped lint. Firefox availability was confirmed using the official Playwright install command; WebKit was already available locally. Playwright’s WebKit on Windows is not a certification of Safari on macOS or iOS.

Reproduce the focused checks:

```powershell
npx vitest run src/lib/__tests__/keyboard-lab.test.ts
npx eslint src/lib/keyboard-lab.ts src/pages/KeyboardLab.tsx src/lib/__tests__/keyboard-lab.test.ts e2e/keyboard-lab.spec.ts
npm run typecheck
npm run build
# With a separate npm run preview -- --host 127.0.0.1 --port 4173 process:
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:4173'
npx playwright test e2e/keyboard-lab.spec.ts --workers=2
# Optional cross-engine verification (install the corresponding Playwright binaries first):
$env:PLAYWRIGHT_BROWSERS='all'
npx playwright test e2e/keyboard-lab.spec.ts --workers=1
```

These checks do not certify behavior on every physical keyboard, mobile input method, assistive technology or browser. The manual fallback is the supported path when browser mapping is absent; real devices and native IMEs remain part of release validation.
