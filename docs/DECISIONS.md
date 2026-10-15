# Implementation decisions

- Canonical metrics are `forge-v3`. Historical results remain legacy/unverified and are never silently reclassified.
- Input accuracy counts all insertion attempts, including corrected mistakes. Retained raw speed and attempt rate are separate metrics. Idle time remains part of the session.
- Personal tests start on first input. Explicit pause is recorded and makes a session ineligible for ranked comparison. Race start comes from server time.
- The browser controller produces one immutable result; views and persistence consume that result without recalculating it.
- The default design is Forge dark with amber accents. Eight complete semantic themes, self-hosted fonts, visible focus and reduced motion are supported.
- Preferences, evidence and pending saves are scoped to guest/account. Private custom text stays local unless the user explicitly opts in to upload.
- Local correctness does not prove a human typed a session. Ranked scores require server validation; validation is not a claim of cheat-proof operation.
- Existing Supabase projects are not migrated automatically. Deployment instructions and unverified gates remain explicit.
