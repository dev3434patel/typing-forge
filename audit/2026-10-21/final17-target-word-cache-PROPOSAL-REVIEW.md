# Bounded factory-target word metadata — source17 proposal review

**PROPOSAL ONLY. Not applied, tested or built.** Source16 remains frozen `8ac2a0d9602ec9263118`; input104/112/80ms still fails2/3. The full62-file matrix is running, and this review changes no product or test file.

This proposal supersedes the `Object.isFrozen(target)` eligibility condition in the older optional16 proposal. Arbitrary externally frozen arrays can have dynamic accessor indices. Reusing their earlier word bounds would change public `alignTranscript` behavior. Cache only dense, immutable arrays created by `targetGraphemes`, never generic mutable or frozen caller arrays.

One WeakMap stores `null` as a lazy factory marker and a frozen numeric Word array after its first computation. No WeakSet, text key, owner identifier, session input, event, score or second scoring engine is added. `targetGraphemes` registers its newly frozen array only if it has at most4,096 grapheme units. `targetWords` returns cached metadata if present; otherwise it runs the existing loop unchanged. It stores metadata only when the factory marker exists and there are at most512 Word objects. An all-space/empty-word-heavy target exceeding512 words removes its marker and uses ordinary exact fallback thereafter. These are proposed engineering bounds, not a researched optimum or measured speedup.

The resulting private Word fields remain only numeric `start`, `end`, `separator:number|null`. Freeze each Word object and its array. Keep the literal-space algorithm, including leading/trailing/consecutive-space empty words, fully unchanged. Callers currently read these fields only. A future nested/non-numeric field should require explicit review; do not cache typed strings or expose cached Word records through a new public API.

Target edits and append create a new target-array identity, so metadata is not reused across different issued content. WeakMap values contain numeric bounds only and do not reference their keys; dead keys can be collected. The existing target Map holds16 strong identities in ordinary operation, but an external caller may retain a public factory array longer: weak metadata follows that existing key lifetime. Do not claim an absolute global16-entry memory bound. Per-key length/word caps keep even such retained keys bounded. No account/owner reset or authentication policy is involved.

The [review-only patch](final17-target-word-cache-FACTORY-BOUNDED-PROPOSAL.patch) is complete against current16 `transcript.ts`. No metrics, input handling, correction range, time origin, replay sequence, target issuance or PHP formula is changed. It still adds cache lookup/registration and first-fill freezing cost. Unsupported large targets keep the original algorithm; performance can still regress there and must not be assumed improved. Existing alignment, slot allocation, word-credit scanning and final replay costs remain, so this is not proof of a latency-tail fix.

Meaningful tests after approval:

- Compare complete alignment fields plus independent final replay/metrics for ordinary factory targets, empty/leading/trailing/consecutive-space targets, code/free fallback and virtual submissions/skips/extras. Include all old canonical golden/differential vectors.
- Mutate a non-frozen public target array between calls; output must reflect its new literal-space boundaries.
- Use a frozen public array with dynamic index getters that switch between a letter and literal space. Its next alignment must reflect current getters; freezing alone must never opt it into cache.
- Exercise exact4,096/4,097 unit and512/513 word boundaries, including4,096 all-space units. Observe exact output parity, not a stopwatch assertion or implementation-only claim.
- Unicode NFC/RTL/Devanagari/emoji/ZWJ targets use canonical grapheme arrays. Target words continue to split on literal U+0020 only; IME modifies retained state, not target metadata.
- Append while active and independently replay issued-segment history; old target identity/output remains valid, new target bounds must match new content.
- Read-only metadata must not leak into publicly mutable caller arrays or change later outputs through alias mutation. Preserve source/reverse-delta review and run actual matched three-attempt latency acceptance after fresh gates/build.

No allocation percentage, privacy certification, source17 build, source17 gate or measured performance benefit is established by this review.
