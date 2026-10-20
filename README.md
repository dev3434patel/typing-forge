# SparowType

A typing practice workspace built with React, TypeScript, Vite, Tailwind CSS, PHP and MySQL/MariaDB. The v3 implementation combines timed and finite tests, exact code practice, private custom text, free writing, adaptive learning, a structured typing course, labelled local bots and server-owned human races.

## Run locally

Use Node 22.12 or newer and npm 10 or newer.

```sh
npm ci
npm run backend:dev
# In a second terminal:
npm run dev
```

Open `http://localhost:8080`. Import [backend/schema.sql](backend/schema.sql) through XAMPP phpMyAdmin and configure the private `backend/config.php` first. Follow the [PHP/XAMPP and hosting guide](docs/PHP_XAMPP_SETUP.md) for database users, extensions, ports and deployment. Guest typing and device history remain available when the API is offline.

The default API path is `/api`; Vite forwards it to PHP on port 8081. No database password belongs in a `VITE_` variable. Email/password authentication, account history, preferences, ranking challenges and human races use the PHP backend. The old `supabase/` tree is retained for historical SQL and portable replay-reference checks; it is not the active backend.

Build a PHP hosting package with `npm run build:hosting`. Upload its `public_html` contents to the document root and keep `sparowtype-private` outside it. The package contains no local credentials.

## SparowType identity

SparowType uses a typographic wordmark with self-hosted Sora, Inter and JetBrains Mono. The default dark theme uses #07070A, lime #C6FF3D and violet #7B61FF; light mode and six alternatives are available. The Keyboard Awakens opening assembles a 61-key Three.js keyboard, presses the brand letters, then dissolves into practice. It is deferred, skippable and optional, with a shorter returning visit, reduced motion and a CSS keyboard fallback. Existing v3 storage, metric versions and backend identifiers preserve compatible saved history.

This is a local implementation. The [latest viewport correction](docs/KEYBOARD_VIEWPORT_FIX_2026-10-20.md) and [learning release audit](docs/LEARNING_UPGRADE_AUDIT_2026-10-20.md) record executable evidence, observed failures and remaining hosted/native acceptance. A finite test suite does not establish universal correctness or educational superiority.

**Viewport correction — 20 October 2026:** full-intro mobile Lighthouse performance **98 / 98 / 98**, with the other three categories **100** throughout. The [viewport report](docs/KEYBOARD_VIEWPORT_FIX_2026-10-20.md) records 164 unique browser scenarios confirmed across the initial run and affected accessibility confirmation, installed Google Chrome screenshots at 100% scale, 824 passing unit tests, retained failures and remaining latency/device limits.

**Learning release verification — 20 October 2026:** **824 unit tests**, **393 PHP replay parity cases with zero mismatches**, **136 native PHP course cases covering all 108 passages**, and native course/account/race/Apache acceptance passed. The [learning upgrade audit](docs/LEARNING_UPGRADE_AUDIT_2026-10-20.md) records that release's build identities, browser coverage, performance measurements, retained failures and remaining gates.

That learning release's mobile Lighthouse with the full normal intro scored **98 / 98 / 97 performance**, with **100 accessibility, best practices and SEO** in all three runs. Its accessibility/navigation confirmation passed 24/24 cases across Chromium, installed Edge, Firefox and WebKit; the broader selected existing-flow scope has 203 passing confirmations and one capability skip across its documented runs. Exact-input lab checks retained every character at 4× CPU, including a viewport rotation. These are finite local checks, with native-device, manual accessibility and production gates still explicit in the audit.

**Previous baseline — 19 October 2026:** 723 unit tests and full-intro mobile Lighthouse performance 97 / 97 / 98, with the other three categories 100 in each run. Those scores describe the earlier build. The [previous feature audit](docs/FEATURE_AUDIT_2026-10-19.md) retains its exact coverage and limitations.

## Structured learning and live keyboard

Open `/lessons` for 36 lessons in six chapters, with 108 original passages. Thirty sequential foundations progress from home-row anchors through the alphabet, capitals, numbers and punctuation. A separate six-lesson speed ladder runs from 15 to 80 WPM, with its first lesson available immediately. Each lesson needs two qualifying, distinct passage variants; corrected mistakes still count against input accuracy. A speed checkpoint requires a complete, uninterrupted 30-second assessment. English / US QWERTY is the first formal course; adaptive practice retains its existing language and layout options.

The live keyboard below practice distinguishes the expected character, the actual physical key held and an incorrect committed character. It provides layout references and finger hints without claiming to detect real finger placement. Keyboard and finger-guide visibility are independent saved preferences. The same component serves tests, races, adaptive practice and the course.

The [keyboard viewport correction](docs/KEYBOARD_VIEWPORT_FIX_2026-10-20.md) records the subsequent Chrome 100% layout fix, desktop sizing with update notices, consolidated session controls and cross-browser regression evidence. Its build-specific performance results supersede the earlier learning-build scores for this correction.

Course progress comes from owned session evidence and server-accepted receipts, survives permitted replay expiry, and reconciles session/account deletion. Local checkpoints remain visibly unverified until account acceptance. The [research and implementation plan](docs/LEARNING_UPGRADE_PLAN_2026-10-20.md) explains the progression and source material.

## What changed in v3

- One replayable session controller supplies live metrics, a frozen final result and persistence. Input accuracy retains corrected mistakes; raw speed counts retained text. Idle time and actual duration are recorded.
- Six test modes, quote lengths, ten curated language packs, eight layout references including Workman and native/unmapped, composed input, RTL display, code indentation, append-only timed targets and pause-aware personal practice.
- Adaptive lessons distinguish introduced letters from mastery. Mastery requires enough recent attempts, two lessons, target speed, 97% accuracy and two checkpoints. Owned test/race evidence can guide practice; dedicated assessments control unlocking.
- Eight semantic themes, five procedural sound options, four caret styles, real preferences, keyboard navigation, command search, reduced motion, accessible input and chart tables. Results include timeline, measured insights, character accounting, practice retests and JSON/PNG export.
- Native selection menus have explicit theme-colored options. Small screens use wrapping practice controls, fitted keyboard maps, stacked result metrics and keyboard-accessible evidence table scrollers.
- Results explain the actual scoring arithmetic, expose canonical word-credit traces and replay recorded edits. Precision mode stops at incorrect input while retaining its accuracy cost. Custom/private passages do not compete for cross-passage personal bests.
- Keyboard Lab observes focused browser key signals and measured transitions, with an explicit optional layout-map request and a manual fallback. It does not identify keyboard models or switches.
- Practice shows the actual wrong letter, a small expected-letter cue and immediate typed/expected feedback. Learn advances on mistakes by default; explicit stop-on-error shows rejected input. Corrections retain their original accuracy cost.
- The practice workspace follows Monkeytype's quiet text-first flow: compact controls, three visible lines, whole-word wrapping, measured caret movement, desktop focus and Tab → Enter restart. Learn uses a Keybr-style indicator → passage → optional keyboard layout, with detailed evidence available on demand.
- Races show a gray opponent caret and ghost trail on the shared passage, live WPM and an ahead/behind cue. Local bots use their actual canonical position, including corrections; humans use last server-confirmed progress. The user controls passage scrolling.
- Tab → Enter starts a fresh random-word bot race at the same difficulty, resetting the user, timer and opponent. Test and bot results support the same sequence for the next run; normal Tab/Shift+Tab navigation stays available.
- Owner-scoped IndexedDB history with visible memory fallback, retryable account queues, consent for private-text uploads, legacy import, expiry and deletion reconciliation.
- Row-locked room lifecycle, server countdown/deadline and PHP-replayed progress. Ranked challenges use fixed server content and timing. Public identities never derive from an email address.
- Server-filtered UTC daily/weekly rankings, with the existing all-time endpoint preserved. Import the included MySQL schema before using account endpoints.
- Privacy, Terms, a touch-typing guide, route metadata and a versioned public offline download. The worker does not cache personalized API responses. Set `SPAROWTYPE_SITE_URL` to the real deployment origin during build to emit a sitemap.

## Verify

```sh
npm run typecheck
npm run lint
npm run test:coverage -- --maxWorkers=2
npm run test:php
npm run test:course-php
npm run test:content
npm run build
npm run check:bundle
npx playwright install chromium
npm run test:e2e
```

The content syntax gate additionally uses Python 3.11+ and Rust. `test:php` runs the portable TypeScript/native PHP replay differential corpus; `test:course-php` verifies shared-catalog course grading. Native HTTP/database and Apache acceptance harnesses are under `backend/tests`; their guarded SQL fixtures require a separate `_audit` or `_test` database. Follow the setup guide before running `test:course-http`. `npm run test:database` retains the historical PostgreSQL/WASM compatibility check. Browser acceptance for synthetic PHP accounts is opt-in with `PHP_E2E_ACCEPTANCE=1`; two-account race browser checks additionally need dedicated credentials. Scoped coverage applies to named business modules, not every UI line.
To test a static production preview while developing, run `npm run preview -- --host 127.0.0.1 --port 4173`, then set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173` before `npm run test:e2e`.

For the cross-engine matrix, install the official Playwright browsers with `npx playwright install chromium firefox webkit`, set `PLAYWRIGHT_BROWSERS=all`, and run `npm run test:e2e -- --workers=1`. Chromium is the local default. CI selects all three engines against the production preview after building. Browser tests use isolated contexts; native hardware/IME and actual cloud-account tests remain separate gates.

## Implementation and deployment evidence

- [Keyboard viewport correction and regression evidence](docs/KEYBOARD_VIEWPORT_FIX_2026-10-20.md)
- [Current learning and keyboard audit](docs/LEARNING_UPGRADE_AUDIT_2026-10-20.md)
- [Learning research and implementation plan](docs/LEARNING_UPGRADE_PLAN_2026-10-20.md)
- [Previous feature and PHP migration audit](docs/FEATURE_AUDIT_2026-10-19.md)
- [XAMPP/phpMyAdmin setup and PHP hosting](docs/PHP_XAMPP_SETUP.md)
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

The PHP package must be configured on the destination host; no hosting deployment is performed automatically. The setup guide and current audit list environment-dependent checks. Historical Supabase migrations and Edge sources are retained as reference. Historical audit and accuracy reports in the root describe older code and are retained as historical evidence; the implementation ledger records current verification.
