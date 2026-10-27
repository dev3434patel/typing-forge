# Final-result hashing: bounded deferral proposal

Status: **DESIGN ONLY / NOT APPLIED / NOT TESTED**. Baseline: source16, build `8ac2a0d9602ec9263118`. The full source16 browser matrix is still running. This proposal does not alter its source, tests, artifact, deadlines, or failed receipts.

The synchronous `stableJson(payload)` call runs before the first await in `payloadIdentity`. A source15 final-input CPU capture contains work in the results-saving chunk during a slow final event. That is a diagnostic co-occurrence; it does not isolate hashing cost or establish the cause of source16's p98 failures. Deferral should therefore be a separate measured experiment, not a claimed performance fix.

## Minimal safe boundary

1. Keep generic `payloadIdentity` byte-for-byte unchanged. In particular, do not add an await before its serialization: callers may supply mutable objects and currently obtain an invocation-time snapshot.
2. Add a private module `WeakSet` brand only after `SessionController.finish` has produced its deeply frozen result. Expose only a predicate. A checkpoint, imported JSON, shallow-frozen object, or arbitrary `SessionResult` annotation cannot obtain this brand. The set adds no serialized fields and holds no strong reference to old attempts.
3. In `saveSession`, retain the synchronous capture of owner scope, reset revision, and publication version. After existing initialization/lookup, only a branded finalized result receives one bounded scheduling yield immediately before hashing. Do not defer the entire `saveSession` call, owner capture, reset revision capture, result construction, replay, or clocks.
4. Keep the existing post-hash row refetch and repository revision/tombstone checks. They prevent deleted/reset results being recreated and prevent stale save status replacing a newer result. Keep former-owner local persistence and current-owner upload guards unchanged.
5. Do not introduce a generic payload hash cache. The first experiment only changes scheduling for a factory-proven immutable final result. A future cache would require separate identity/lifetime/rejection semantics and measurement.

The companion patch is deliberately a proposal, not an applied implementation. It changes two existing source files and adds one small browser scheduling helper. It has not been compiled, executed, or benchmarked.

## Scheduling and lifecycle

For a visible browser document, request one animation frame and then a zero-delay task. This releases the current event/microtask chain and gives painting an opportunity. A 50ms timer bounds the requested wait when frames are throttled; it is not a guarantee that work begins within50ms under a blocked event loop or that a paint necessarily occurred. Hidden/SSR documents bypass the frame wait. Pagehide or becoming hidden settles the pending yield, and all timers/frame callbacks/listeners are removed exactly once.

Do not cancel the completed save merely because its React component unmounts, a new test starts, or a route changes. The immutable result already belongs to the captured owner and should still reach the existing repository policy. Reset/deletion is handled by the already-captured repository revision and tombstones. The UI must continue to say it is saving until persistence completes. A document closed before asynchronous persistence finishes remains an honest limitation; this proposal does not promise unload durability.

## Required tests before applying as a release candidate

| Boundary | Required assertion |
| --- | --- |
| Factory ownership | Finished results are branded; a running checkpoint, JSON copy, shallow-frozen clone, and arbitrary object are not. Calling finish twice returns the same branded object. |
| Canonical bytes | Existing replay goldens and both digest/fallback hash branches remain identical. The external brand adds no enumerable or JSON property. |
| Mutable generic input | Start `payloadIdentity` on a mutable nested object and mutate it before its promise settles; its hash retains the existing invocation-time serialization semantics. |
| Visible scheduling | Hashing has not begun in the final input turn or frame callback; it begins after the queued task. The helper settles once. |
| Throttled/lifecycle scheduling | Missing frame APIs, hidden document, frame never firing, timeout, pagehide, and visibility change settle without a stranded promise. Each path removes listeners and cancels pending callbacks. |
| Reset during yield | Capture the old owner revision, clear that workspace while yield is held, then release it; repository rejects the save and no old row or progression award reappears. |
| Delete during yield | Delete an existing row between lookup and hash completion; the existing refetch detects deletion and does not recreate it. Preserve another owner's row. |
| Account switch | A completed former-owner result retains its original local scope; it cannot upload using the new account or replace the new owner's visible status. |
| Rapid restart/reversed completion | Two completed saves resolve out of order; only the latest current-owner session controls the visible saving status. Both valid local rows retain their own immutable evidence. |
| Retry/expiry | An existing row updated by sync or expiry while hashing is pending is re-read and returned in its current state. Same-ID different evidence is still rejected. Crypto errors remain retryable; no rejected promise is cached. |
| Native acceptance | Run the unchanged quiet input protocol and retained WebKit failure cases at their original budgets, followed by the scoped four-engine suite and actual backend acceptance. A separate pass never overwrites the original source16 failures. |

## Source facts reviewed

- `session.ts` constructs the configuration from a JSON copy, and `buildResult` recursively freezes its copied configuration, events, replay, pause intervals, issued segments, and metadata. A final-only private brand can therefore identify the factory-owned immutable result without inspecting every nested field on the hot path.
- `saveSession` currently captures `scope`, `ownerRevision(scope)`, and `beginSave(...)` before its first await. Those lines must remain before the proposed yield.
- `SessionRepository.save` retains revision/reset-at and deletion-tombstone rejection. The existing completed-row branch re-fetches after hashing; that re-fetch must not be removed.
- Progression re-checks retained source evidence and owner/generation boundaries. Its later second hash is not changed by this proposal.

No production or E2E edits, checks, builds, browser runs, services, or performance claims were made for this proposal.
