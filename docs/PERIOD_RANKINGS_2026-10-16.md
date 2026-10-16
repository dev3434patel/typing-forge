# Period ranking implementation — 16 October 2026

The leaderboard now offers **All time**, **Today** and **This week**. It uses accepted results in the selected comparison; it never fills empty periods with example entries. Comparison choices and their participant counts remain explicitly all time.

All time continues to call the existing `forge_rankings` RPC. Today and This week call the new `forge_rankings_period(p_comparison_key, p_period, p_limit, p_offset)` function. Accepted period values are `day`, `week` and `alltime`; invalid and null periods return SQLSTATE `22023`. A server missing this migration returns its actual error, and the all-time control remains available.

The new RPC reads only server-owned `public.test_sessions` with `metrics_version = 'forge-v3'`, `eligibility->>'eligible' = 'true'` and a non-null net WPM. Day means the current UTC calendar day. Week means the current Monday-based ISO week in UTC. Bounds are lower-inclusive and upper-exclusive; they use server insertion time, not a user's browser clock. All period metrics—best WPM, average input accuracy and accepted test count—come from those filtered rows. Tied best WPM and average accuracy share a rank, with stable user-ID ordering for pagination. [PostgreSQL date and time functions](https://www.postgresql.org/docs/current/functions-datetime.html)

The security-definer function uses an empty search path and explicitly qualified tables. It joins only approved `public_identities`, returning the same eight public fields as the existing endpoint: position, user ID, approved handle, best WPM, average accuracy, test count, participant total and whether this is the requester. It does not return email, passage text, replay, raw input or private profile fields. Its execute grant is limited to the existing anonymous/authenticated public read roles. Existing denials on browser score writes remain intact. This server acceptance checks replay consistency; it cannot prove human input.

The migration adds a partial comparison/date index for eligible non-null forge-v3 scores. It does not rewrite stored sessions, metric versions, comparison keys, old aggregates or the legacy ranking endpoint. Apply it through the normal database migration process; no hosted migration was performed in this task.

## Verification status

- **PASS:** scoped Leaderboard ESLint and application TypeScript checks at implementation time.
- **PASS — local PostgreSQL/WASM:** `npm run test:database` replayed all 17 current migrations and passed the original integrity/trust-boundary fixtures, new period fixture and legacy-upgrade fixture. `supabase/tests/period-rankings.sql` is wired into `compatibility-check.mjs`. It includes 40 direct assertions plus valid-pack, rejected-period, invalid-preference and denied-write loops. Cases cover independently calculated UTC boundaries, caller timezone changes, excluded legacy/ineligible/missing-score/private-identity rows, ties, rank gaps, actual 105-participant pagination/cap behavior, null/negative pagination, empty periods, anonymous/authenticated RLS, exact public result fields and compatibility with the existing all-time RPC. New presentation preference checks also verify all five sound packs, boolean reduced motion, owner isolation, stale-version conflicts and preservation of existing fields. [Command evidence](../audit/keyboard-awakens-2026-10-16/database.txt)
- **UNVERIFIED:** hosted migration deployment, hosted Auth/PostgREST behavior, production index planning/scale and live multi-user competition. Local PostgreSQL/WASM fixture results do not certify these gates.
- **UNVERIFIED:** current-build browser interaction for period controls until the integrated browser suite exercises it.

Synthetic fixture rows are transaction-scoped and rolled back. They are database tests, never application seed data or fallback leaderboard content.
