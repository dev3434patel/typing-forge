# Typing Forge

A typing practice workspace built with React, TypeScript, Vite, Tailwind CSS and Supabase. The v3 implementation combines timed and finite tests, exact code practice, private custom text, free writing, adaptive learning, labelled local bots and server-owned human races.

## Run locally

Use Node 22.12 or newer and npm 10 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:8080`. Guest practice and local history work without cloud credentials. Copy `.env.example` to `.env` and supply your **public** Supabase URL and publishable key to enable account connections. Never put a service-role key in browser configuration. Existing cloud projects require the v3 migrations and Edge functions before new cloud features work.

## What changed in v3

- One replayable session controller supplies live metrics, a frozen final result and persistence. Input accuracy retains corrected mistakes; raw speed counts retained text. Idle time and actual duration are recorded.
- Six test modes, ten curated language packs, seven layout references including native/unmapped, composed input, RTL display, code indentation, append-only timed targets and pause-aware personal practice.
- Adaptive lessons distinguish introduced letters from mastery. Mastery requires enough recent attempts, two lessons, target speed, 97% accuracy and two checkpoints. Owned test/race evidence can guide practice; dedicated assessments control unlocking.
- Eight semantic themes, real preferences, keyboard navigation, command search, reduced motion, accessible input and chart tables. Results include timeline, measured insights, character accounting, practice retests and JSON/PNG export.
- Native selection menus have explicit theme-colored options. Small screens use wrapping practice controls, fitted keyboard maps, stacked result metrics and keyboard-accessible evidence table scrollers.
- Results explain the actual scoring arithmetic, expose canonical word-credit traces and replay recorded edits. Precision mode stops at incorrect input while retaining its accuracy cost. Custom/private passages do not compete for cross-passage personal bests.
- Keyboard Lab observes focused browser key signals and measured transitions, with an explicit optional layout-map request and a manual fallback. It does not identify keyboard models or switches.
- Practice shows the actual wrong letter, a small expected-letter cue and immediate typed/expected feedback. Learn advances on mistakes by default; explicit stop-on-error shows rejected input. Corrections retain their original accuracy cost.
- The practice workspace follows Monkeytype's quiet text-first flow: compact controls, three visible lines, whole-word wrapping, measured caret movement, desktop focus and Tab → Enter restart. Learn uses a Keybr-style indicator → passage → optional keyboard layout, with detailed evidence available on demand.
- Races show a gray opponent caret and ghost trail on the shared passage, live WPM and an ahead/behind cue. Local bots use their actual canonical position, including corrections; humans use last server-confirmed progress. The user controls passage scrolling.
- Tab → Enter starts a fresh random-word bot race at the same difficulty, resetting the user, timer and opponent. Test and bot results support the same sequence for the next run; normal Tab/Shift+Tab navigation stays available.
- Owner-scoped IndexedDB history with visible memory fallback, retryable account queues, consent for private-text uploads, legacy import, expiry and deletion reconciliation.
- Row-locked room lifecycle, server countdown/deadline and Edge-replayed progress. Ranked challenges use fixed server content and timing. Public identities never derive from an email address.

## Verify

```sh
npm run typecheck
npm run lint
npm run test:coverage
npm run test:database
npm run test:content
npm run build
npm run check:bundle
npx playwright install chromium
npm run test:e2e
```

The content syntax gate additionally uses Python 3.11+ and Rust. The database compatibility gate replays migrations and authorization assertions under PostgreSQL/WASM with a small Supabase auth fixture. It is useful SQL evidence; it does not replace Supabase Auth/API, Realtime, scheduler or simultaneous-client tests. Browser cloud tests explicitly skip when dedicated test accounts are unavailable. Unit coverage thresholds apply to the specified business-logic modules; browser flows cover the routes.

To test a static production preview while developing, run `npm run preview -- --host 127.0.0.1 --port 4173`, then set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173` before `npm run test:e2e`.

For the cross-engine matrix, install the official Playwright browsers with `npx playwright install chromium firefox webkit`, set `PLAYWRIGHT_BROWSERS=all`, and run `npm run test:e2e -- --workers=1`. Chromium is the local default. CI selects all three engines against the production preview after building. Browser tests use isolated contexts; native hardware/IME and actual cloud-account tests remain separate gates.

## Implementation and deployment evidence

- [Current implementation ledger](docs/IMPLEMENTATION_STATUS.md)
- [Visible wrong-key feedback and default learning behavior](docs/WRONG_KEY_FEEDBACK_2026-10-16.md)
- [Accuracy upgrade and your result explained](docs/ACCURACY_UPGRADE_2026-10-15.md)
- [Detailed competitor, architecture and hardware research](docs/COMPETITOR_ACCURACY_RESEARCH_2026-10-15.md)
- [Whole-product verification inventory](docs/PRODUCT_VERIFICATION_2026-10-15.md)
- [Disposition of all 35 audit findings and remaining specification work](docs/AUDIT_RESOLUTION_MATRIX.md)
- [Metrics contract](docs/METRICS.md)
- [Data, deployment and backend verification](docs/DATA_AND_DEPLOYMENT.md)
- [Implementation decisions](docs/DECISIONS.md)
- [Research and full implementation specification](typing-forge-master-prompt.md)
- [Original audit of the pre-v3 application](CURRENT_PROJECT_AUDIT_2026-10-15.md)

Cloud migrations and Edge code are included but are not automatically deployed to an existing project. The deployment guide lists the remaining environment-dependent checks. Historical audit and accuracy reports in the root describe older code and are retained as historical evidence; the implementation ledger records current verification.
