# Independent ranked and private-duel timing

New independently issued attempts use `settings.timingPolicy: "first-input-v1"`
with `forge-ranked-en-v2` or `forge-social-duel-en-v2`. This is a new comparison
cohort. A server-stored issued configuration selects the policy; a submitted
client setting cannot opt into it. Issued v1 challenges keep their original exact
server start. Unknown or mismatched policy/revision pairs are rejected.

After the three-second preparation countdown, the input remains ready with its
whole duration. The first nonempty keyboard character attempt starts the clock,
including an incorrect character. Empty deletion/submission does not create
pre-start evidence. The frontend captures one monotonic response/server-wall
anchor, so later device wall-clock changes cannot move the attempt. No activation
request is made on the first character. The issued preparation timeout removes
unused input with an explicit message; an active attempt keeps running.

For stored earliest start `T`, stored expiration `E`, fixed duration `D`, submitted
first-character wall start `S`, and database receipt time `N`, new acceptance
requires:

- `T <= S <= E - D`; both endpoints are inclusive.
- A completed timeout with exactly `D` active milliseconds, no pauses or content
  extensions, unchanged target/configuration, and keyboard-only evidence.
- The first recorded edit contains a character at offset zero. Empty edits
  before that first character are rejected. Canonical replay still validates
  every edit, timestamp, character count and metric.
- `S + D <= N <= S + D + 3000`, with an absolute ceiling of `E + 3000`.
  The 3,000ms allowance matches the existing race transport allowance and never
  extends accepted input past `D`. The latest valid start therefore has a full
  duration plus delivery allowance. Early receipts are not accepted.
- A bounded scheduler tail, wall-duration consistency, and the unchanged
  competitive bulk/burst/rate limits. Existing owner locks, immutable receipt
  hashes, one-use challenge consumption and deleted-source tombstones remain.

`N` is captured once from database UTC immediately after authentication at
request dispatch, before feature rate checks, replay and feature/owner locks.
Direct service callers capture it before preflight; private-duel handling also
freezes it before taking its advisory/transaction locks. It is private to that
request's service instance, never read from the client body, and cannot be
refreshed by later processing. Slow server replay therefore does not consume a
timely request's 3,000ms delivery allowance or turn an early arrival into a valid
one. Legacy v1 keeps its original redemption-time check.

An asynchronous private duel pins both participants to the same issued cohort
under its existing duel row lock. If a pre-upgrade v1 attempt exists, a later
participant also receives v1; a new duel without issued attempts uses v2.
Repeated starts reuse the same owner-bound challenge. A v2 attempt may be
reopened only while its preparation window can still fit the full duration;
legacy resume deadlines are unchanged. An expired/consumed counted attempt is
not replaced within the same duel.

Browser evidence establishes internal consistency, not the physical time of a
key press or proof of human input. A preparation window exposes the public
passage before submission and cannot prove that the person did not rehearse it.
Network delivery beyond the allowance leaves the result local. An exact retry
of an already accepted immutable receipt remains idempotent. Live human races
and Arena retain their shared authoritative room clock.

## Verification scope

`npm run test:social-php` includes the existing legacy duel/source cases plus
actual-PHP first-input timing, canonical replay, resume, tampered-policy and
same-duel cohort predicates. A pure PDO protocol double additionally runs real
`DataService.submit` and `SessionValidator`, advances a controlled server clock
during processing/lock waits without sleeping, and checks timely, early, late,
client-forged, invalid-clock, nested-transaction and900-edit competitive-rate
paths. It makes no database connection and is not native HTTP proof. The focused TS tests exercise the frontend adapter,
wrong first character, idle duration, clock changes and expiry without a browser.
These are source checks, not SQL/HTTP lifecycle proof.

`e2e/independent-challenge-timing.spec.ts` declares eight intercepted-account
browser cases: ranked and duel full-duration input, unused preparation expiry,
foreign-owner response rejection, and unknown policy rejection. They deliberately
return an explicit unavailable replay response and leave results local. Existing
legacy countdown fixtures remain separate. Browser results must be reported
from an actual run; preparing these tests is not a pass.

The guarded `backend/tests/race-lifecycle.mjs` and
`backend/tests/pack-social-lifecycle.mjs` include new policy acceptance/rejection
and legacy compatibility scenarios. They modify only their run-owned synthetic
challenge rows after isolated-instance guards. Their earlier retained receipts
describe earlier source versions and do not verify this amendment. Fresh native
HTTP acceptance and fresh browser execution are pending the coordinated root
verification window at this source checkpoint.
