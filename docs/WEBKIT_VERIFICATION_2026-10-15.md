# WebKit navigation verification gate

This records an unresolved local browser result, not an established cause or a Safari-wide defect. The environment is Windows with Playwright 1.64.1. Its installed browser registry identifies WebKit revision 2370, version 27.2. Playwright WebKit on Windows is not Safari on macOS or iOS.

## Completed observations

The 150-case serial production-preview run in `audit/accuracy-research-2026-10-15/browser-all.txt` passed 142 cases, skipped six credential-dependent cases and failed two WebKit cases: command-palette navigation and mobile navigation. Chromium and Firefox each passed their 48 applicable cases. WebKit passed 46 and failed two. A prior three-worker run had more loading failures. These results remain evidence even when an unchanged isolated rerun passes.

The focused Keyboard Lab initially had one intermittent Learn-link failure, then passed all eight cases unchanged in a serial rerun. This establishes that those cases can work; it does not establish reliable navigation across the entire product.

Separate audit-only probes against an isolated static production snapshot are retained under `audit/keyboard-lab-2026-10-15/loading-probe/`:

| Probe | Result | Scope |
| --- | --- | --- |
| Baseline versus `page.bringToFront()` | 15 passed / 3 failed, 18 cases | Three mobile-route failures: one baseline, two foreground. Six direct Learn loads and six command flows passed. |
| MessageChannel delivery observation | 3 passed / 5 failed, 8 cases | Mobile startup/route checks with additional channel and DOM observers. The instrumentation can affect scheduling and timings. |

Network traces include responses with HTTP 200 and short transfer durations before the UI becomes ready. In one mobile probe the URL had changed to `/learn` while the title and rendered view still showed Practice; the Learn module request began several seconds later. The document remained `visible`. Bringing it to the foreground did not remove the failures. No page error was recorded in the eight channel-observer cases.

The channel observer records repeated scheduler message deliveries while a view is delayed. Across those eight cases the largest observed post-to-delivery interval in each case ranged from 129 to 908 milliseconds. A single lost message is therefore not established as the cause. Observation overhead, runtime scheduling and the application workload may interact. Local React Scheduler source uses MessageChannel and cooperative yielding, but that source inspection alone does not prove why these runs stalled.

## Later integration and a separate shortcut fix

The rebuilt 156-case matrix finished with **149 passes, six cloud skips and one WebKit shortcut failure** in 6.5 minutes. Chromium and Firefox each passed all 50 applicable cases; WebKit passed 49. In that failed trace, the root was empty immediately before the keyboard shortcut was pressed. `shortcut-race-evidence.json` records the relevant timestamps. The test now waits for the actual command control before pressing keys; this is a readiness assertion, not a longer timeout.

Readiness alone did not make repeated checks uniformly green: nine focused runs yielded five passes, three WebKit dialog failures and one Firefox timeout. In a WebKit failure the command module was requested and returned HTTP 200 in approximately 11 ms, yet the dialog was still absent at the assertion deadline. This is counterevidence to treating every failure as a pre-mount key event.

A separate genuine interaction defect was reproduced on the archived older build: once the palette was interactive, holding Ctrl/Cmd+K closed it on the first keydown and reopened it on the repeat. `shortcut-repeat-before.txt` records the failing regression. The current implementation gives one root controller ownership of shortcut/open state, ignores composing input and suppresses repeated toggles. The same repeat assertion passed in Chromium, Firefox and WebKit in the rebuilt profile suite.

That 12-case profile suite finished with **11 passes and one Firefox context-teardown timeout**. The error context explicitly reports teardown exceeding 30 seconds; its browser output includes `ariaSnapshotJSON`, Juggler and debugging-pipe failures. It is retained as a failed run. The final Chromium suite passed **50 cases with two cloud skips** on the current build. A separate Firefox guest-profile comparator with tracing disabled passed **one case, zero failures, in 10.1 seconds total**, recorded in `firefox-no-trace.json`. That diagnostic does not change normal tracing configuration or establish universal browser stability.

## Disposition

No production scheduler override, browser-specific timing patch, relaxed assertion or increased expectation timeout was introduced. The controlled shortcut repair fixes the demonstrated repeat behavior and is not presented as a scheduler fix. Intermittent loading and test-runtime failures remain a verification gate requiring reproduction on a clean environment and intended Apple devices, with profiling that distinguishes application work from runtime/test overhead. Later passing runs must be reported alongside earlier failures rather than relabelling them as fixed.

The complete checkpoints and current-build fingerprint are recorded in [the implementation ledger](IMPLEMENTATION_STATUS.md) and `audit/accuracy-research-2026-10-15/verification-summary.json`. Verification continued into 16 October 2026 in the user's Asia/Calcutta timezone. No historical failure or probe has been deleted to produce a clean-looking report.
