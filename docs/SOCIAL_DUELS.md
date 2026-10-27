# Private friends and asynchronous duels

Implementation date: 21 October 2026. Status: actual frontend/backend source; pure checks and a finite isolated HTTP lifecycle passed; browser lifecycle remains pending. There are no placeholder users, fabricated opponents, simulated accepted scores or free-text chat.

## Account and privacy boundary

`/friends` is an account-only feature. Frontend-only installations show an honest account-service availability message and retain access to local practice. Requests use an exact public username, require explicit acceptance by the other account, and are capped at 200 pending/accepted relationships per participant. Contact responses expose only public ID/handle and a boolean recent-practice dot. They omit email, streak count, key evidence, personal history, passage content and raw input. The dot means accepted progression activity today/yesterday in the friend's anchored calendar zone; it is not online presence.

Blocking closes the relationship and pending/accepted private duels, prevents access/requesting in either direction, and hides completed private outcomes. Unblocking does not silently restore a previous friendship. Fixed-category reports (`spam`, `harassment`, `cheating`, `other`) are idempotent per reporter/subject/category/UTC day; no free-text message is relayed or stored. A report is recorded for operator review, without a promise of automated adjudication. No reporting dashboard or moderation service is implied.

Every mutating endpoint requires cookie identity, CSRF and `expectedOwner`. The API boundary applies the central rate limit; the service rechecks existence under an account lock. Single-database social writes have a short advisory lock to serialize block/request/duel races consistently. It is independent of live race/arena state. SQL has owner foreign keys with deletion cascades. Queries bind values; the fixed report/category enums are not user-built SQL. Friends and scores are never sent to a non-member.

## One honest counted attempt

An accepted friend can invite the other to an asynchronous duel. The opponent must explicitly accept before either starts. The duel has one server-generated original English passage shared byte-for-byte by both participants, a seven-day invitation lifetime, and an idempotent creator request key. New invitations are capped at ten per creator per UTC day.

Each person independently requests one issued attempt. This creates an owner-bound row in the existing `typing_challenges` system with a three-second preparation countdown and a complete 30-second attempt starting on the first character. Repeated start requests return the same eligible challenge; an expired/consumed attempt cannot be replaced with a fresh counted attempt in that duel. Existing issued v1 attempts retain their exact fixed-server start. The duel row lock pins a later participant to the first participant's cohort, including legacy v1, so one duel does not compare different clock policies. No second runtime, WebSocket process or altered human-race contract is required.

New configurations use `forge-social-duel-en-v2` plus immutable issued `settings.timingPolicy: "first-input-v1"`: `time`, 30,000ms, prose, English, QWERTY, individual keyboard input, `current-word` correction, public corpus, no pause/target extension. A client result must name that participant's own issued challenge and the duel's exact original target. `DataService.submit` preserves canonical replay, source/configuration identity, input bounds, competitive plausibility, account/challenge locks and immutable receipt consumption. The versioned preparation/receipt predicates are specified in [Independent challenge timing](INDEPENDENT_CHALLENGE_TIMING.md). Extra client WPM, placement, accuracy and reward assertions are not inputs to the social API. Empty pre-start edits and a timed empty attempt cannot become a scored v2 duel.

The frontend saves the canonical personal result locally first, uses the private submission endpoint, and retries the same session/evidence after a network failure. A successful acknowledgement updates only the still-present owner session record. Reset/auth-generation/source tombstones prevent a late acknowledgement from recreating cleared evidence. Server acceptance can then queue a reference-only progression claim; local evidence remains explicitly local until the server accepts it.

Both scores remain private/hidden until both canonical submissions are accepted. The winner uses higher canonical WPM, then higher original insertion accuracy for an exact speed tie; exact ties draw. This is not an ELO rating or a synthetic percentile. Source session IDs remain available for provenance. Browser transcript checks establish internal consistency, not proof of human input.

## Source and installation

- Migration: `backend/migrations/004_social.sql`, after the base schema and progression migration002. No user database migration has been run during source implementation.
- Backend: `SocialService(PDO, SessionValidator, DataService)`, `SocialDuelRules`.
- Authenticated routes: GET `/social`; POST `/social/{request,accept,remove,block,unblock,report,duel-create,duel-accept,duel-cancel,duel-start,duel-submit}`. GET remains expected-owner bound; POST uses the central CSRF/rate guards plus the service's owner check.
- Frontend: `SocialApi(ownerId)`, `Friends.tsx`, `DuelAttempt.tsx`, pure `domain/progression/social.ts`. The central application wires the lazy `/friends` route and API entry points.

An authenticated installation missing the feature tables returns a targeted HTTP503 explaining the required progression002/social004 migrations. Other database errors are not disguised as installation failures. This check does not install or change the user's database.

Private relationships, reports and duel outcomes remain server-side until removal/account deletion according to their feature controls. Duel target text is generated public practice content, not a copy of a user's private passage. Original submitted raw replay follows the existing session-retention policy; social contacts receive no raw replay. This implementation adds no analytics tracker, third-party chat, email lookup, push service or external runtime.

## Actual checks

- Earlier combined pure domain/service/transport checkpoint: **375/375 PASS**, seven files, including 65 duel-rule cases and five owner-bound social API cases. Receipt `audit/implementation-pack-2026-10-21/progression-social-transport-reset-source.json`; earlier checkpoint receipts remain preserved. These retained counts precede the v2 timing amendment.
- Native PHP duel rules/source binding: **60 PASS** (50 accepted, 10 rejected), receipt `audit/implementation-pack-2026-10-21/social-duel-php.json`. This verifies comparison and issued-source predicates, **not SQL/HTTP lifecycle**.
- Isolated native HTTP lifecycle: **7/7 grouped checks PASS**, receipt `audit/2026-10-21/pack-backend-cf3ca6cb25abe4f2-social.json`. The guarded synthetic run verified three real accounts, private friendship acceptance, owner/stranger denial, identical issued passage, exact retry and one-counted-attempt behavior, hidden early scores, canonical winner, fixed reporting, block/unblock behavior and owner deletion cascade. Only its generated synthetic accounts were removed; no rate counters were reset.
- Scoped lint passed for all new progression/social/transport source and native harness files. The central final source gates supersede these checkpoint counts.

The guarded native lifecycle at `backend/tests/pack-social-lifecycle.mjs` was executed only after coordinated isolated-instance authorization. It requires `SPAROWTYPE_PACK_HTTP_ACCEPTANCE=1`, explicit config/API URL, a fresh reserved ephemeral `_audit` schema with its matching private cookie namespace, and refuses normal app/database ports. It creates only three unique synthetic accounts, uses guarded owned-only challenge timestamp retiming to test exact 30-second canonical evidence, and removes only those exact run accounts. It resets no rate counters and reads no default/private application configuration. Its PASS is synthetic native acceptance; it is not proof of real typing or unaltered wall-clock browser acceptance. The owned API/database processes stopped gracefully and their temporary directory was removed; cleanup receipt `audit/2026-10-21/pack-backend-cf3ca6cb25abe4f2-cleanup.json`.

Five intercepted-backend browser cases are prepared in `e2e/friends.spec.ts`: owner-bound contact removal/blocking, request acceptance/fixed reporting, rejection of a mismatched response owner, an explicit503 error state, and the strict issued-duel countdown. They are **NOT RUN** at this checkpoint and do not replace native acceptance.

Still **UNVERIFIED/NOT-RUN**: simultaneous opposite friendship/block requests, actual browser countdown/correction/mobile input, expired-attempt browser recovery, same-origin multi-tab account reset and hosted availability. The root's final audit must distinguish these from the finite native lifecycle and pure-source checks.
