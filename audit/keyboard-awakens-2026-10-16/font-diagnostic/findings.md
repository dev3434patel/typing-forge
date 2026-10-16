# WebKit font-readiness diagnosis — 16 October 2026

Scope: local Playwright WebKit on Windows, production build `3d714a0008e8c342f2a2`, served at `http://127.0.0.1:4175`. This diagnoses the layout-test readiness predicate. It does not establish behavior on physical Safari/iOS devices.

## Preserved failing evidence

The original `e2e/layout-fonts.ts` called `FontFaceSet.load` once, discarded its fulfilled values/rejections, then required both `FontFaceSet.check` and an enumerated face reporting `loaded`. Its timeout was 10 seconds.

`run.txt` preserves the original three diagnostic cases: two failed and one passed. `identity-run.txt` preserves a second unsigned `/ranked` case which still fails that original helper. These runs were deliberately not relabeled as passes after gathering further diagnostic data. Traces and screenshots remain in `artifacts/` and `identity-artifacts/`.

The passive baseline records actual font and stylesheet requests, their outcomes, exact load-promise results, and later face identity/state. Computed styles, direct retries, and independent font-copy measurements run only after the original helper finishes. They cannot turn its original outcome into a pass.

## What was observed

- The three required Latin WOFF2 files and the font stylesheet returned HTTP 200. The records show no font-request failure or load-promise rejection explaining the 10-second readiness failure.
- In the cold-root case, the three exact-family load promises fulfilled with matching `loaded` faces near the start of the wait; later `check`/enumerated state reported them unavailable while the page was visible.
- In the identity run on unsigned `/ranked`, Inter and Sora fulfilled with `loaded` faces. The first unused JetBrains Mono receipt already reported `unloaded` when its fulfilled promise was inspected. A subsequent set load and a direct `FontFace.load` both produced `loaded` receipts. That same Mono object remained in the set but later reported `unloaded` again. There was no visible Mono text on this unsigned page.
- The probe retained actual returned face references: identity and set-membership checks rule out an unrelated face with the same family name being mistaken for the returned face.
- Canvas metrics for each original CSS family exactly matched a separately named `FontFace` loaded from the actual self-hosted WOFF2 bytes. Width, ascent, and descent matched for all three probe strings, before and after the independent copy was added. Arial and the generic monospace controls differed. These are measured browser text metrics, not a claim of pixel comparison or native-device certification.

First probe string at 400/32px: `SparowType keyboard rhythm 0123456789 iIlWwm`.

| Face | Original width (px) | Independently loaded copy (px) | Arial control (px) | Generic mono control (px) |
| --- | ---: | ---: | ---: | ---: |
| Inter Variable | 771.171875 | 771.171875 | 723.921875 | 671.421875 |
| Sora | 816.6716918945312 | 816.6716918945312 | 723.921875 | 671.421875 |
| JetBrains Mono Variable | 844.80029296875 | 844.80029296875 | 723.921875 | 671.421875 |

The other probe strings were `iiiiWWWWgypQ` and `The quick brown fox jumps`; the full metrics and exact returned-face references are in `signed-out-ranked-page-records-unused-mono-versus-requested-font-readiness.json`. The initial root and race/learning evidence is in the other route-named JSON files.

The evidence supports a false negative in this WebKit readiness predicate. It does not identify a precise WebKit engine defect or prove that every font-related failure is harmless. Empty receipts, rejected downloads, wrong families, and real geometry failures must continue to fail.

## Bounded harness repair and verification status

The harness now inspects nonempty exact-family registered load receipts rather than a later global/check snapshot, and allows two animation frames before measuring layout. A Node-owned deadline retains the original total 10-second budget, including paint, even when a test pauses the browser clock. The controlled-clock viewport caller explicitly supplies `page.clock.runFor(50)` instead of waiting for paused real RAFs.

If the initial exact registered receipt reports `unloaded`, the helper retries those exact objects once with `FontFace.load`, preserving both receipt snapshots. That retry must produce an actual `loaded` receipt and remain inside the same budget. There is no timeout increase, unconditional success, or removal of overflow/caret/layout assertions. Application source and font assets are unchanged.

Scoped ESLint passed for the final receipt/retry helper and controlled-clock caller.

The parent-coordinated final production confirmation completed with **15 passed, 0 failed, 0 skipped in 36.4 seconds** on this same build. `../repairs-confirmation.json` and `../repairs-confirmation.txt` preserve the result. Each of Chromium, Firefox, and WebKit ran these five cases:

1. Keyboard command palette: concrete theme change and route navigation.
2. Mobile navigation: Test/Learn/Race/Stats visibility and no horizontal overflow.
3. All 11 local routes in the original 320px viewport case.
4. Race and learning through landscape/narrow resizing, including QWERTZ learning.
5. The 360px intro/home/wrong-key-caret/restart case with an explicitly controlled browser clock.

This confirms the bounded readiness repair against the actual failing responsive flows while retaining their geometry and caret assertions. It is a focused repair confirmation, not a full-suite or physical-device Safari certification. The original diagnostic failures and their traces remain preserved above. No browser processes from this diagnostic remain active.
