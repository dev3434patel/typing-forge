# Current-word correction verification

Verified locally on 17 October 2026 IST. Public preview build: `890be104aa3b38db119b`.

New tests, lessons, races, ranked challenges and repeated passages set
`correctionPolicy: "current-word"`. The current word stays editable until Space
advances to the next word. Previously submitted words, including wrong words,
remain locked. Code/free-writing also commit tabs and newlines.

Desktop Backspace/Delete, Ctrl/Alt word deletion, native mobile deletion,
selection/cut/undo, normalized input fallback and composition share the same
protected prefix. Blocked edits do not invent attempts or deletion counts.
Original mistakes still count toward input accuracy after valid corrections.
Legacy saved results replay under their original policy and comparison key.

| Gate | Actual result |
| --- | --- |
| Complete unit suite | 681 passed, 49 files |
| Coverage | 89.95% statements, 86.45% branches, 90.99% functions, 96.28% lines; thresholds passed |
| TypeScript | Application, build configuration, strict domain and portable core passed |
| ESLint | 0 errors, 9 existing Fast Refresh warnings |
| Production build / bundle budgets | Passed |
| New browser cases | 16 passed across Chromium and installed Microsoft Edge |
| Existing typing/caret/observer regressions | 34 passed across the same browsers |

Both final browser selections used one worker and zero retries, with no failed,
flaky or skipped cases. Native caret geometry covers four styles, LTR/RTL,
code newlines, multiline free writing, rotation, deletion and fresh sessions.
The initial new-suite run retained two failed custom-restart assumptions:
custom restart correctly reopens its private passage editor, so the final tests
explicitly start that passage again before testing the new session boundary.
Those original results remain alongside the separate final successful run.

Mobile beforeinput and IME cleanup checks use browser instrumentation; they do
not certify physical Android/iOS keyboards or native OS IMEs. Live authenticated
ranked/multiplayer transport and deployed Edge functions were not exercised.
The 3D renderer and animation quality were unchanged by this work.

See `verification-summary.json` for measured counts and SHA-256 evidence hashes,
`new-suite-final-results.json` for new behavior cases, and
`regression-results.json` for existing-flow checks. The local preview is
http://127.0.0.1:4175/.
