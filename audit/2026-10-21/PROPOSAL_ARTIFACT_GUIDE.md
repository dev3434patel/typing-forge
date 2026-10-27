# Public proposal artifact guide

This index labels retained proposals; it is not an instruction to apply them.

| Artifact | Current meaning |
| --- | --- |
| [Flat-alignment freezer16 proposal](final16-flat-alignment-freezer-PROPOSAL.patch) | Historical proposal. Actual16 source adds a compile-time flat-leaf guard and has a separate [reverse-edit/source review](final16-flat-alignment-source-review.json). The proposal is not the authoritative production file. |
| [Original optional word-cache16 proposal](final16-target-words-cache-OPTIONAL-PROPOSAL.patch) | **SUPERSEDED / DO NOT APPLY.** Generic `Object.isFrozen` eligibility permits stale bounds for dynamic accessor-backed public arrays. Retained only to explain the later review correction. |
| [Factory-only bounded17 candidate](final17-target-word-cache-FACTORY-BOUNDED-PROPOSAL.patch) | **REVIEW ONLY / NOT APPLIED / NOT TESTED / NOT BUILT.** Single WeakMap factory marker, proposed4096-unit/512-word limits and exact fallback; no measured speedup or approval established. |

The three UTF-8 diff files contain only the named local source-function changes; [finite staging review](final16-proposal-links-staging-review.json) records exact hashes and narrow secret-pattern scope. The curated extension allowlist omits `.patch`; staging these exact paths explicitly preserves their Markdown/JSON references. Do not broadly stage generated patches or historical user working-tree diffs. No staging/deployment was performed by this review.
