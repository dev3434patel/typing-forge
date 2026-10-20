# Keyboard viewport correction — 20 October 2026

The screenshot showed the Test page: the update notice, large vertical margins, separate session-controls row and full-height keyboard pushed the lower keyboard rows below the initial Chrome viewport. The ambient browser route named `/lessons`; the shared keyboard is also used by the course, adaptive practice and races, so those flows require regression checks.

## Behavior and scope

- Desktop Test keeps the passage and keyboard together with height-aware spacing and keycap height. The passage still displays three full lines at the selected font size. At the default 26px English setting, the whole keyboard, next/actual-input feedback and legend must fit the tested desktop windows, including a visible app-update banner and an incorrect input.
- Restart, accessible-editor, pause, finish and shortcut help share the keyboard toolbar. They remain available when the board is hidden. Keyboard and finger-guide visibility remain independent saved preferences.
- Shortcuts and precision-mode explanations are available through a native keyboard-operable Help disclosure. Its panel follows viewport changes and document scrolling; Escape closes it and returns focus to its summary. The textarea retains its screen-reader instruction reference.
- Typing, keyboard and app-update controls retain a minimum 44px height. Reference keycaps are visual indicators, not buttons; reducing their height does not reduce input targets. Their 11–13px desktop labels and stacked-legend spacing follow the available height so labels stay inside the keycap borders. Phone layouts retain the full board and ordinary document scrolling. Large typing text is retained rather than reduced to force everything into one screen.
- Desktop navigation begins at 1200px. This avoids an unnecessary second navigation row at a 1280px window when the browser subtracts scrollbar space. The verification checks the visible header groups for overlap.
- The canonical typing engine, metric calculations, PHP backend and full Three.js opening are unchanged from `e525bc1`. This is a layout and controls correction, not a new accuracy definition.

## Reproduction and browser measurement

The original 1810×900 Chrome measurement placed the keyboard at y=797 through y=1173 with the update banner visible. The board itself ended at y=1116. This reproduced the supplied screenshot without changing browser zoom.

The regression test uses the production PWA banner. Its fixture substitutes only the browser service-worker registration boundary with an `EventTarget` registration containing a waiting worker and existing controller; it does not insert a substitute banner or product layout flag. Each browser context is an isolated guest. The 3D opening is disabled only for functional layout tests so its temporary overlay cannot obscure the page being measured.

Windows Playwright WebKit initially reported a 1192×670 CSS viewport for a requested 1366×768 window, even on `about:blank`, with visual viewport scale 1. The first test compared fit against the requested size and could therefore record false passes. The corrected test calibrates the driver window size before navigation, asserts the actual CSS dimensions and scale, and compares keyboard bounds against the measured viewport. No product CSS scaling or reduced text size is used to fix the fixture. The separate blank-page receipt records both measurements.

Retained development receipts are not release acceptance:

| Receipt | Build | Observed result | Disposition |
| --- | --- | --- | --- |
| `chromium-fit.json` | Intermediate layout | 17/18 passed; a wrong-input message pushed the smallest window just below the edge | Corrected feedback spacing |
| `viewport-release.json` | `4456bab365f443710497` | 82/84 reported passed | Invalid WebKit viewport sizing; some apparent WebKit passes also exceeded the actual viewport |
| `viewport-css-pixels.json` | `4456bab365f443710497` | 83/84 passed after actual CSS viewport calibration | Exposed a real 1280×720 WebKit navigation-breakpoint overflow; corrected header breakpoint |
| `help-text-before-focus.json` | `04d9ef360f75b66c1b8c` | Clicking Help text closed the disclosure in Firefox/WebKit and crashed the Chromium/Edge renderer | Made the panel itself focusable with `tabIndex=-1`, outside the Tab sequence; clicking text now transfers focus within the disclosure, and Escape closes it with summary focus restored |

Evidence is under [`audit/keyboard-viewport-2026-10-20`](../audit/keyboard-viewport-2026-10-20/). The final build receipt identifies the exact production bundle and hashes the changed source files. Raw worktree hashes preserve the captured bytes; additional LF-normalized hashes let the verifier tolerate Git's CRLF/LF checkout conversion.

The earlier `04d9` layout passed 92 viewport and 72 existing-flow cases before the extra Help-text check exposed that focus issue. Those earlier passes are not a substitute for the final changed-source acceptance. The corrected Help behavior has its own four-browser receipt, and the final acceptance suite includes pointer interaction inside the panel as well as its resize, scroll and Escape behavior.

## Release verification

Production build: **`c6eda8be1c3db12c2b06`**. The offline public-cache allowlist contains 94 files / 2,573,366 bytes; that count is not the total hosting-package file count.

The final product build has **164 unique browser scenarios confirmed** across Chromium, installed Edge, Firefox and WebKit. The combined run passed 163/164; one Firefox course scan observed the 180ms entrance fade. Reported foreground colors consistently matched approximately 19% opacity over the dark background, an inference from their shared blending rather than a captured computed-opacity value. The test fixture now waits for loaded fonts and finite animations before static accessibility readings, retaining infinite caret animations. All **16 affected accessibility scenarios** then passed on the unchanged product build, with active workspace opacity recorded as 1. The other **148 passing scenarios** remain applicable. This is not a claim that the initial combined run passed every case. All browser runs used zero automatic retries.

| Area | Status | Test and result |
| --- | --- | --- |
| Desktop Test viewport | PASS | Default 26px English text; 1240×720, 1280×720, 1366×768, 1440×900, 1536×864, 1810×900 and 1920×900; banner absent/present; ready, incorrect and corrected states; full board and feedback onscreen with no initial scroll |
| Passage and controls | PASS | Three full text lines retained; all five keyboard rows and 61 keys; controls at least 44px; header groups do not overlap; legends stay inside keycap borders |
| Phone / large text | PASS | 390×844, 844×390 landscape and 40px text at 1440×900; every row and both keyboard footers reachable by normal document scrolling; no cropped internal keyboard scroller |
| Installed Google Chrome | PASS | Chrome 155.0.8059.82; five viewport screenshots with the actual update banner, measured scale 1; Home, a visible mistake at 1280×720, active course and phone keyboard |
| Keyboard / Help interaction | PASS | Held and wrong keys, IME provenance, preferences, race pace, restart, Tab → Enter, hidden-board controls, Help text click, scroll/resize placement and Escape focus return |
| Existing page accessibility | PASS, automated scope | 16 settled accessibility confirmations; course overview, preview, practice, technique disclosure and results, plus existing guest pages and completed results; incomplete rules still need manual review |
| Exact typing input | PASS, finite lab scope | All 247 input units retained at 4× CPU throttle, 100% input accuracy and no page errors; latency is reported separately below |
| Typing latency | MEASURED; throttled target NOT MET | Immediate 4× CPU p98 120ms; matched quiet previous/current p98 both 120ms. Current quiet driver throughput was 193 versus previous 170 WPM. A distinct unthrottled observation retained all 247 inputs with p98 24ms, maximum 32ms and no long tasks. These are synthetic local Event Timing readings, not field INP or physical-device certification |
| Mobile Lighthouse | PASS, local lab | Three predeclared sequential fresh-profile runs: **98 / 98 / 98 performance**, **100 accessibility / best practices / SEO** throughout; full normal intro, no reduced-quality override, skipping or result-based retries |
| Lighthouse layout stability | MEASURED | CLS approximately **0.000252** in each run; LCP 2.12 / 2.12 / 2.27 seconds; total blocking time 39.7 / 51 / 54ms |
| Unit / type / lint / bundle | PASS with existing warnings | 824 unit tests in 59 files; all type checks; lint has zero errors and nine existing Fast Refresh warnings; initial practice JS 142,280 bytes gzip, deferred intro JS 167,996 bytes gzip |
| Engine / full 3D / PHP source | UNCHANGED | Exact source comparison against `e525bc1`; no metric, input-engine, backend or Three.js quality change; no new native database or Apache acceptance claimed |
| Hosting package | PASS, local artifact | Fresh package hashes match frozen dist and allowed backend files; 105 public / 20 private files; no local private config, storage or tests included; no rebuild during packaging |
| Native devices / manual AT | UNVERIFIED | Physical Android/iOS keyboards, native macOS/iOS Safari and manual assistive-technology acceptance remain outside this local run |
| Hosted deployment | UNVERIFIED | Package prepared locally; destination hosting was not changed |

The raw initial run, affected confirmation, build hashes, installed-Chrome screenshots, Lighthouse JSON and typing measurements are retained in the evidence folder. Lighthouse results are laboratory measurements, not field INP or a universal score guarantee.

The slow throttled result was retained and investigated instead of discarded. A predeclared matched pair used the archived `5c8082579f9884ef34fc` public package on an owned temporary preview and the corrected package, with the same 390×844 viewport, passage, Chromium, settled fonts/finite animations and 4× CPU throttle after 20-second quiet periods. Both preserved every character and showed the same p98; this pair did not show a throughput regression from the layout change. One pair does not establish a universal causal performance improvement. The temporary preview was stopped afterward. The sub-100ms target on the throttled lab profile remains unmet and should be a separate optimization acceptance gate. The unthrottled result describes a different profile and does not replace it.

## Limits

The acceptance scope is finite. Increased operating-system text sizes, browser zoom, longer translated strings, extra warnings, custom passages and windows shorter than the tested desktop sizes may need ordinary page scrolling. The document must remain scrollable and all keyboard rows reachable; it must not crop the board to force a fit. A Windows WebKit engine run does not certify native macOS/iOS Safari or physical mobile soft keyboards. Manual screen-reader, physical-device and production-host acceptance remain as described in the learning audit.

Use **Reload to update** after finishing an active practice session to replace an older service-worker bundle. Reloading a stale open tab is necessary before judging the corrected layout.
