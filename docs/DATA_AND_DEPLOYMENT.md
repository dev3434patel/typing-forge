# Data integrity and deployment

**Active backend — 19 October 2026:** SparowType now uses PHP + MySQL/MariaDB. Use [PHP/XAMPP setup](PHP_XAMPP_SETUP.md), [the phpMyAdmin SQL](../backend/schema.sql) and [the current feature audit](FEATURE_AUDIT_2026-10-19.md). The Supabase deployment instructions below are retained as a **historical reference** for the previous backend; do not apply them to configure the current PHP app.

Historical Supabase instructions below were updated **16 October 2026** for **17 migrations**. They are not the current PHP deployment guide or evidence of public deployment. See the [October 19 feature audit](FEATURE_AUDIT_2026-10-19.md) and [PHP setup guide](PHP_XAMPP_SETUP.md) for the active architecture. The retained [October 16 product audit](KEYBOARD_AWAKENS_PRODUCT_AUDIT_2026-10-16.md), [research](KEYBOARD_AWAKENS_RESEARCH_2026-10-16.md), [competitor research](COMPETITOR_ACCURACY_RESEARCH_2026-10-15.md), [period-ranking notes](PERIOD_RANKINGS_2026-10-16.md) and [offline/SEO notes](OFFLINE_SEO_AND_SECONDARY_PAGES_2026-10-16.md) keep their original dates and scope.

The browser works without cloud configuration. Personal results use a version 3, owner scoped IndexedDB repository (`guest` or an authenticated user UUID), with a memory fallback that is shown in the interface. Session evidence, the original local candidate and the accepted server summary are separate records. Corrected insertion mistakes stay in input accuracy. Summary precision is preserved; presentation alone rounds values.

`useTestResults.saveSession()` is the canonical write entry point. The retained legacy `saveResult()` saves legacy observed values locally, without pretending that old keystroke logs can reconstruct v3 metrics. The history import retains the original `typingmaster_history` key and a backup. Invalid records are skipped, imports are repeatable, and a deletion tombstone prevents deleted legacy records being reimported. Guest import is an explicit Profile action and remains unverified/personal.

## Queue and privacy

The queue stores owner ID, client ID, payload version/hash, attempts, next attempt, classified error and the states `local-only`, `queued`, `syncing`, `synced`, `retryable-error`, `auth-required`, `rejected`. A checked owner's bearer token is bound to each upload. Account changes pause the old queue. Transient failures use exponential backoff with jitter and stop automatic attempts after eight failures; manual retry remains available. Validation, conflict and authorization failures do not endlessly retry.

Custom passages and free writing are local only until the user explicitly enables cloud storage for that session. Sharing a statistics image does not enable cloud storage. Queue enforcement exists below the UI. SHA-256 is the normal immutable identity; a labelled local FNV fallback is only a change detector when Web Crypto is unavailable. The server always calculates SHA-256 and does not trust a client digest.

Raw local replay evidence expires after 90 days at startup and while the app runs. A closed browser cannot execute cleanup. Expired unsynced evidence is removed from the upload path, while summary history, comparison dimensions, PB eligibility and nullable metric values are retained. Cloud evidence expires after 90 days. Public result links expire after 30 days. Summary history lasts until owner deletion. Derived observations from generated learning lessons remain as the private learning model until owner deletion; they contain expected-key outcomes and qualified timing, rather than the original passage. Installing the actual scheduled SQL jobs is required for cloud expiry; a source file alone does not prove that the job is running.

Account preferences use validated owner-specific local envelopes and per-field pending patches. Changes apply immediately. A 650 ms debounce sends an expected server version and explicit owner UUID to the preferences RPC; a stale version returns the current state instead of overwriting it. A slow cloud read cannot replace a pending user edit, and an old acknowledgement cannot erase a newer edit. Account switches discard old UI responses; the RPC also binds the owner to the authenticated caller. Unrequested remote preference changes are deferred while typing. Settings exposes the sync state, while offline storage and retry do not block input.

Account history downloads paginate the complete owner session and learning collections. A monotonic owner data version before and after the download guards a consistent snapshot. Reconciliation removes previously synced evidence deleted on another device while preserving pending local sessions. Learning merges accepted per-session evidence and ignores stale server snapshots rather than replacing a whole character map. The React history state is owner keyed: immediately after an account switch it returns no records or prior-account errors until that owner's local history loads. Export, profile and stats cannot consume the previous account's rows during that interval; its pending local records remain intact in their own repository scope.

Deletion requests carry explicit owner intent and the captured account bearer. `forge_delete_session_for_owner(owner, clientId)` checks the JWT owner before invoking the existing transactional deletion; browser execution of the old owner-implicit RPC is revoked. The account-deletion Edge function requires an `expectedOwner` matching its authenticated user as well as the confirmation phrase. The client checks identity again before local removal and sign-out; a late acknowledgement cannot clear or sign out the next account. If the account changes after a remote deletion was acknowledged, the UI reports that partial outcome and leaves the new workspace untouched. Destructive confirmation is reset on a Profile owner change.

## Trusted writes and races

`submit-session` authenticates the user with Supabase Auth, bounds request/event/text resources, validates schema, owner, event sequence, ranges, pauses and issue times, replays the shared `src/lib/typing-core` module, compares the immutable local result and computes the accepted result. Custom content requires a cloud-consent flag. Cloud validation currently accepts up to ten minutes, 20,000 events and a 2 MB envelope; longer local practice remains available.

The service-only `forge_commit_session` RPC holds an owner advisory lock and atomically writes the receipt, immutable session, expiring evidence, per-key summaries and derived comparisons/learning aggregate version. Browser roles cannot execute this facade or directly mutate score, aggregate, evidence or protected room tables. Idempotency receipts persist after evidence expiry; deletion creates a tombstone so a delayed retry cannot resurrect a session. Deletion reconciles derived comparisons, rankings and learning summaries.

`/ranked` requests an owner-bound, one-use timed challenge with a nonce and server start/deadline. Its corpus, mode, duration, layout, input method and target are fixed. Full duration is required; an early finish stays personal locally. Paused, imported, custom, bot and assisted sessions cannot enter ranked comparisons. A browser transcript cannot prove that a human typed it. These checks validate consistency and server-owned timing, with residual automation risk.

Races use the existing `race_sessions` table. Membership and protected fields change only through authenticated row-locked RPCs. A human room has two slots. Join means ready and starts a three second server countdown; waiting rooms expire after ten minutes. The server owns duration and timing. `race-operation` replays progress, checks the exact shared target/start/duration, and records correct target slots. Realtime is a notification; subscribe-confirm-fetch plus versioned polling reads persisted state. A receipt arriving after the deadline cannot claim an exact first finish. On timeout, the last accepted progress wins, then speed, then fewer incorrect attempts; exact ties draw. Receipt order has network effects. Closing a tab has the original race deadline as its disconnect grace; explicit Leave forfeits an active room. The one minute cleanup job settles closed rooms. Rematch creates a fresh room. Bots stay labelled local practice and never rank.

Human final session history commits inside the same database race RPC transaction and is a separate comparison from timed ranked tests. The `(owner,race)` unique index prevents multiple final session effects. An identical retry returns the receipt. Terminal room outcomes cannot restart. Completed host-owned rooms are removed when their host deletes their account; other hosts' retained room history anonymizes the deleted opponent/winner.

## Historical verification — owner-intent/privacy checkpoint, 15–16 October

The following entries describe the earlier fifteen-migration checkpoint. They are retained as historical evidence and are not relabelled as the newest source or a hosted deployment result.

- `npx vitest run src/services/__tests__ src/integrations/supabase/__tests__/client.test.ts`: 41 tests passed at the owner-intent/privacy audit checkpoint; logs are in `audit/accuracy-research-2026-10-15/services.txt`. Eighteen new audit cases cover replay attacks, correction history, streamed payload bounds, upload/deletion races, expired private evidence, account-switch deletion intent and owner-keyed history visibility. Five owner-intent regressions failed against the prior source and passed after the fix.
- `deno check --node-modules-dir=none --no-lock supabase/functions/submit-session/index.ts supabase/functions/race-operation/index.ts supabase/functions/delete-account/index.ts`: passed using a temporary Deno install outside this repository.
- `node supabase/tests/compatibility-check.mjs <installed-pglite-package-path>` with **@electric-sql/pglite 0.5.10**: replayed all fifteen migrations from empty and passed the executable SQL integrity assertions. A separate upgrade fixture preserves legacy history, quarantines legacy scores, replaces email handles and cancels rooms lacking trustworthy timing. The runner creates a minimal Supabase Auth fixture and checks PostgreSQL syntax, RLS, grants, owner/stranger reads, safe identities, join/third-member behavior, duplicate commits, conflicts, preference versions/ownership, precision, deletion reconciliation and cleanup invocation. `trust-boundary-audit.sql` additionally checks owner-explicit deletion across identical client IDs, rejection of stale owner intent, matching/reusing rooms only for the requested duration, and single consumption of ranked challenges. Logs are in `audit/accuracy-research-2026-10-15/database.txt`.

PGlite is PostgreSQL/WASM evidence, not a Supabase API, Auth, Realtime or multi-connection concurrency test. At that historical checkpoint, Supabase CLI, Docker and native PostgreSQL were not installed on the host. Deno was installed temporarily outside the repository for the check above. Real two-browser human races, concurrent join/finish clients, scheduled jobs, hosted Auth and the service credential deployment path remain unverified until a local or staging Supabase environment is provided. Nothing was remotely migrated, published or deployed by those checks.

## Current local database checkpoint — 16 October

`npm run test:database` has now replayed **all 17 migrations**, passed the original integrity and trust-boundary fixtures, the new period/preference fixture and the legacy-upgrade fixture; exit 0. [Current database command evidence](../audit/keyboard-awakens-2026-10-16/database.txt). This includes UTC day/ISO-week boundaries, exact public ranking fields, hard pagination limits, invalid periods, browser score-write denial, all five valid sound packs, invalid preference types, owner isolation, stale version conflicts and preservation of existing preference fields. It still uses a minimal Auth fixture under PostgreSQL/WASM; hosted services and real concurrent clients remain **UNVERIFIED**.

## Current deployment sequence

### Review the whole migration chain

Back up the chosen staging environment and check its migration history against **all files in `supabase/migrations`, in timestamp order**. The current chain is:

| Migration group                                     | Count | Purpose / compatibility                                                                                                                             |
| --------------------------------------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing `20260112…` through `20260209…` migrations |     9 | Original schema, policies and earlier feature tables; retained in the chain rather than replaced by a new empty schema.                             |
| `20261015090000_forge_v3_integrity.sql`             |     1 | V3 evidence/trusted writes, safe identities, owner/private data and legacy quarantine.                                                              |
| `20261015091000_forge_race_protocol.sql`            |     1 | Server-owned race lifecycle and validated transactional progress/finish.                                                                            |
| `20261015092000_forge_account_cleanup.sql`          |     1 | Retention, cleanup and account data handling.                                                                                                       |
| `20261015093000_forge_ranking_reads.sql`            |     1 | Existing public cohort/all-time ranking read contract.                                                                                              |
| `20261015094000_forge_preference_versions.sql`      |     1 | Owner/version-bound preference updates.                                                                                                             |
| `20261015095000_forge_owner_intent.sql`             |     1 | Explicit-owner deletion and current account/race trust-boundary fixes.                                                                              |
| `20261016143000_sparow_preferences.sql`             |     1 | Adds validated `soundPack` and boolean `reducedMotion` to the existing preferences RPC without changing owner/version semantics.                    |
| `20261016150000_sparow_period_rankings.sql`         |     1 | Adds the indexed, approved-public-field `forge_rankings_period` RPC for server UTC day/ISO-week aggregates; the old all-time RPC remains unchanged. |

The visible brand changes do not rename `forge-v3`, historical comparison keys or owner storage. A frontend containing the new preference fields needs the 1430 migration; an older server can otherwise reject those keys. Today/This week require the 1500 RPC. A missing period RPC displays the actual error, while All time continues to use the older endpoint. Do not hide such errors with local or sample rankings.

Run the local repository checks before any remote write:

```sh
npm ci
npm run typecheck
npm run lint
npm run test:coverage
npm run test:database
npm run test:content
```

Also replay the chain in a disposable native/local Supabase installation and run `supabase/tests/integrity.sql`, `supabase/tests/trust-boundary-audit.sql` and `supabase/tests/period-rankings.sql` there as the database operator. These fixtures roll back synthetic rows. Inspect grants/RLS for anonymous, authenticated, unrelated-owner and service roles. Review the partial ranking index/query plan against representative staging volume. Regenerate database types from the reviewed migrated schema and inspect the resulting diff; the checked-in legacy generated snapshot is not proof of the hosted schema.

### Apply only to an already linked, reviewed staging project

The following are **operator-run remote write commands**, not commands executed during this audit. Use them only from a checkout that is already linked to the staging project whose identity, backup and migration plan have been reviewed. A checked-in `project_id`, public browser project variable or copied project reference is not verification of the CLI's linked destination. If the destination is not established, stop and resolve it with the environment owner; do not invent a project ID or use migration-history repair to bypass a mismatch.

First inspect the plan; the dry run does not apply migrations:

```sh
supabase db push --linked --dry-run
```

After reviewing that exact plan for the established staging target:

```sh
supabase db push --linked
supabase functions deploy submit-session
supabase functions deploy race-operation
supabase functions deploy delete-account
```

These commands use the linked project. Deploy only the named functions and retain JWT verification; do not add `--no-verify-jwt` or `--prune`. Confirm the deployed functions still validate the caller through Auth and that their server environment supplies the Supabase URL, public API key and service-role credential expected by the source. Keep the service-role credential and Google client secret out of `VITE_` variables, browser bundles, logs and exports. The Edge runtime imports the same portable core as the frontend. Promote the owner-intent client, SQL and deletion endpoint together. [Official CLI command reference](https://supabase.com/docs/reference/cli/supabase-db-push), [Edge deployment guide](https://supabase.com/docs/guides/functions/deploy)

### Configure real browser and OAuth destinations

Supply the real staging Supabase URL and public publishable key through `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` at frontend build time. The retained `VITE_SUPABASE_ANON_KEY` alias is supported by the client. These are public client configuration; the API's RLS/grants remain the data boundary. Missing configuration intentionally leaves guest practice usable.

For Google sign-in, configure the Google Auth Platform web client with the actual app origin, consent-screen audience/scopes and the **Supabase callback URL copied from this staging project's Google provider page**. Enable the provider in Supabase and put the client ID/secret there. Do not substitute the app's `/auth` route for Google's Supabase callback URI. [Official Google provider setup](https://supabase.com/docs/guides/auth/social-login/auth-google)

In Supabase Auth URL Configuration, set Site URL to the real app origin and allow the exact current-origin `/auth` callback used by `signInWithOAuth`; also allow the current-origin `/` email-confirmation destination used by signup. Configure only the actual development/staging/production destinations you intend to support. The Google → Supabase callback and Supabase → app redirect are separate settings. [Official redirect URL guidance](https://supabase.com/docs/guides/auth/redirect-urls)

Test a dedicated staging account through real provider success, cancellation, provider-disabled/error, sign-out and a second independent account. Confirm the returned session, safe public handle, owner-scoped data and rejected cross-owner reads. An intercepted OAuth transport test does not establish real provider acceptance. Keep hosted OAuth marked **UNVERIFIED** until these checks run.

### Build and route the public site and offline files

Set `SPAROWTYPE_SITE_URL` in the build environment to the **actual root HTTPS origin** before building if a sitemap is wanted. It is separate from Supabase Auth's Site URL setting. The build omits a sitemap when no origin is configured; it does not invent a production hostname. Canonicals/social image URLs use the actual page origin. This implementation assumes hosting at the origin root; a subdirectory deployment requires explicit base/scope/routing work and new checks.

```sh
npm run build
npm run check:bundle
npm run preview -- --host 127.0.0.1 --port 4175 --strictPort
```

An optional **installed Microsoft Edge** project is available explicitly; it uses Playwright's Desktop Edge profile with Chromium channel `msedge`. The default stays Chromium, and `PLAYWRIGHT_BROWSERS=all` still selects the existing Chromium/Firefox/WebKit matrix so CI does not require native Edge. In a separate PowerShell terminal, test discovery alone can be checked without launching a browser:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4175'
$env:PLAYWRIGHT_BROWSERS = 'edge'
npm run test:e2e -- --list --project=edge
```

When native Edge execution is part of an explicitly scheduled verification run, use `npm run test:e2e -- --project=edge --workers=1` with those settings. This option does not install Edge. On 16 October 2026, read-only executable metadata found Microsoft Edge **155.0.4283.45** locally; discovery/configuration is not a passing browser run. Edge is Chromium-based and does not replace independent Firefox/WebKit coverage or native device/IME checks.

`npm run build` runs the `postbuild` generator. Publish its complete `dist` output. Do not publish `public/sw.js` directly: it is a template; generated `dist/sw.js` contains the actual content version and file allowlist. Inspect `dist/offline-build.json`, and the generated sitemap/robots when enabled.

The host must serve real static files before the SPA rewrite, including `/sw.js`, `/_offline-recovery.html`, `/site.webmanifest`, `/assets/…`, `/fonts/…`, icons and `/og-sparowtype.png`. Preserve correct JavaScript, CSS, font, image and manifest MIME types. Route known app paths such as `/offline` and `/auth` to the application shell. **Do not emit or serve a static `offline.html` alongside routed `/offline`: clean-URL hosts can resolve that file first and hide the app's real offline controls.** The generated generic recovery document is deliberately named `/_offline-recovery.html`.

Use revalidation/no-cache for mutable shell, worker and manifest responses; `/sw.js` already has a no-cache rule in `_headers`. Content-hashed Vite assets can receive long immutable caching. Public font files with stable names must follow a cache policy that permits updates. Verify actual CDN responses, not just configuration files. Ensure a missing asset is a real error rather than an HTML shell with status 200.

Review the target host's supported header/rewrite format. `_headers`/Vite preview and `vercel.json` are host-specific and currently have different CSP connection allowances; copying both files does not prove that either is applied. Keep scripts/fonts/assets same-origin, permit the required worker/manifest and the actual HTTPS/WSS Supabase endpoint, and test CSP with the WebGL fallback, JSON-LD, audio, exports and OAuth return. Preserve `nosniff`, restrictive framing, referrer and disabled unused-device permissions. Do not remove security headers to hide a failed check. Private/operational routes have client `noindex`; consider host `X-Robots-Tag` rules as well. Crawl controls are not access controls.

Verify from a real secure staging origin that an initial download completes, guest practice/guide reopen offline, private hard navigation gives generic recovery, Supabase/API/auth responses are not added to CacheStorage, download removal preserves history, and update activation requires the user action. Test older open tabs, interrupted installation, eviction and reconnection. Install UI and actual OS shortcuts remain native-browser gates. See [offline architecture and limits](OFFLINE_SEO_AND_SECONDARY_PAGES_2026-10-16.md).

### Enable actual retention jobs and accept the integrated service

As an operator, enable pg_cron and review/apply `supabase/install-scheduled-jobs.sql` on the chosen environment. Inspect both `cron.job` entries, actual `cron.job_run_details` and `forge_private.job_runs` after execution. Test expired raw evidence with retained summary history and human rooms whose clients have both closed; invoking a function manually does not prove its schedule runs.

Run two authenticated browser contexts against the actual service: create/join/countdown, concurrent third join, matching duration, correction progress, first completion, timeout/draw, dropped response/retry, stale version, reconnect, leave and rematch. Test direct REST/RPC attacks as anonymous, unrelated owner and owner users. Check period rankings around UTC boundaries and confirm no raw session text/evidence/email is returned. Test all five sound packs and reduced motion through real preference saves/conflicts and account switches.

Test account deletion only with disposable staging accounts and explicit confirmation. Confirm Auth deletion/cascades, retained shared-room anonymization, queue clearing and no implicit cross-account import. Record any real hosted side effects and test account identities in protected operational evidence, not public fixtures.

Promote the reviewed SQL/Edge/client bundle only after those gates pass. A rollback should first stop new writes and revert the application as planned; retain v3 tables, history, receipts and tombstones until a reviewed forward migration reconciles data. Never restore permissive browser score/race grants. Hosted Auth/API/Realtime/cron, native devices and production SEO/security/cache headers remain **UNVERIFIED** until their own evidence is recorded.

The implementation follows the official [Supabase Edge authentication guidance](https://supabase.com/docs/guides/functions/auth), [database function security guidance](https://supabase.com/docs/guides/database/functions), and [pg_cron documentation](https://supabase.com/docs/guides/database/extensions/pg_cron).
