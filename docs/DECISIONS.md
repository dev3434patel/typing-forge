# Implementation decisions

## ADR 2026-10-21-01 — Parallel implementation with a single integration owner

Context: the user explicitly requested all parts of the 21 October prompt pack concurrently. The pack also requires honest gates and unchanged scoring/intro quality.

Decision: run independent progression, training/analytics and arcade modules in parallel. The primary agent owns shared routes, API entry points, release checks, preferences and final integration. Serialize builds, browser acceptance and performance measurements. Earlier evidence remains associated with its original build. No copied competitor source/assets.

Consequences: source work can overlap; a slice is not PASS until its actual gates finish. Optional classroom work is included by the user's explicit request for all parts. No second backend runtime or WebSocket hosting is assumed.

Reversal: disable a new lazy route or revert its isolated module. Canonical v3 session data and existing course/race contracts remain unchanged.

## ADR 2026-10-21-02 — Preserve the established visual identity

Context: Part D explicitly makes its defaults subordinate to existing repository tokens. Earlier notes below predate the lime wordmark identity.

Decision: keep current #07070A / #C6FF3D default, Sora wordmark and existing semantic variables. Add aliases and curated choices rather than replacing user preferences. Keep the original eight theme IDs valid. Preserve all 61-key scene geometry, materials, lighting, camera and postprocessing quality.

Consequences: the pack's amber palette is a possible theme rather than an unsolicited default redesign. Accessibility contrast is verified numerically and in rendered surfaces.

Reversal: choose a different theme through preferences; no schema migration is needed.

## ADR 2026-10-21-03 — Explicit publishing origin

Context: a correct canonical URL depends on the real hosting domain. Inferring a preview hostname would publish misleading SEO metadata.

Decision: local/static builds work without a production domain; sitemap generation remains conditional. The release command first requires SPAROWTYPE_SITE_URL, matching its configured base path and using public HTTPS form.

Consequences: a missing origin blocks the release command with an actionable error. This is configuration validation, not proof of DNS/TLS/provider behavior. No deployment is performed by the release command.

Reversal: remove the release preflight only if a future hosting pipeline provides an equally explicit origin validation step.

## ADR 2026-10-21-04 — Installed public navigation uses the versioned shell

Context: the Firefox and WebKit real-outage journeys exceeded their existing 30-second budget again in a serial confirmation. The worker tried the network before reading an already installed public shell on every navigation. A failing or stalled connection should not be a prerequisite for reopening public practice.

Decision: for exact allowlisted public routes, return the app-scoped versioned shell when available. On a cache miss or unavailable cache storage, retain network navigation and existing recovery. Private/unknown documents, API requests, authorization headers, cross-origin traffic and deployment-base isolation keep their existing boundaries. Query-bearing navigation reads only the generic cached index; it does not store the query or a personalized response.

Consequences: installed public navigation stays within its current build until the existing explicit worker-update lifecycle activates a new version. Six regression cases cover stalled networks at root/subpath, frontend-only local tools, missing shell and blocked storage. The original failed browser receipts remain retained; final build acceptance is recorded separately in the master audit. The 3D renderer and typing contracts are unchanged.

Reversal: restore network-first navigation only with a bounded, tested strategy that preserves prompt offline access, version consistency and the same privacy boundaries.

## Historical decisions

- Canonical metrics are `forge-v3`. Historical results remain legacy/unverified and are never silently reclassified.
- Input accuracy counts all insertion attempts, including corrected mistakes. Retained raw speed and attempt rate are separate metrics. Idle time remains part of the session.
- Personal tests start on first input. Explicit pause is recorded and makes a session ineligible for ranked comparison. Race start comes from server time.
- The browser controller produces one immutable result; views and persistence consume that result without recalculating it.
- The default design is Forge dark with amber accents. Eight complete semantic themes, self-hosted fonts, visible focus and reduced motion are supported.
- Preferences, evidence and pending saves are scoped to guest/account. Private custom text stays local unless the user explicitly opts in to upload.
- Local correctness does not prove a human typed a session. Ranked scores require server validation; validation is not a claim of cheat-proof operation.
- Existing Supabase projects are not migrated automatically. Deployment instructions and unverified gates remain explicit.
