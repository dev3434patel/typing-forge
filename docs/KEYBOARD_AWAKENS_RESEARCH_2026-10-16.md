# SparowType — research and creative direction

Reviewed **16 October 2026**, Asia/Calcutta. This research guides the current source implementation. It is not a popularity ranking or proof of global uniqueness.

## Phase 0: findings before implementation

| Source | Verified finding | Adopt | Improve in SparowType |
| --- | --- | --- | --- |
| [Monkeytype About](https://monkeytype.com/about) and [official source](https://github.com/monkeytypegame/monkeytype) | Quiet text-led practice; distinct WPM/raw/accuracy/consistency definitions and many test preferences. | Actual wrong glyphs, measured caret, immediate restart, a clear results hierarchy. | Explain denominators, corrections, eligibility and a direct weak-key practice/retest loop. Preserve explicit formula/version differences. |
| [Keybr official repository](https://github.com/aradzie/keybr.com) and [help source](https://github.com/aradzie/keybr.com/blob/master/packages/page-help/lib/HelpPage.tsx) | Per-key observations, weaker-key generated lessons and progressive letter introduction. | Small initial alphabet, focused practice and per-key evidence. | Distinguish introduced, observed and mastered; show why a key needs practice. No claim that our confidence numbers equal Keybr's. |
| [TypingClub](https://www.typingclub.com/) | Structured instruction, hand guidance and progress activities. | A readable beginner route, manageable goals and finger/layout guidance. | Link instruction to measured sessions. A full school curriculum and educational outcome study remain absent. |
| [10FastFingers](https://10fastfingers.com/typing-test) | Fast timed tests, languages and competition paths. | Direct test entry and readable settings. | Clearly separate local bots, server-confirmed opponents and accepted scores. |
| [Typing.com](https://www.typing.com/) and [official support](https://support.typing.com/en/articles/9047425) | Guided lessons and controlled tests serve learners with different starting ability. | Beginner setup and explicit test controls. | Explain accuracy without conflating final corrected text and historical errors. No certification equivalence is asserted. |
| [Codrops 3D typing effects](https://tympanus.net/codrops/2022/11/08/3d-typing-effects-with-three-js/), published 8 Nov 2022 | Typography and physical motion can form one interaction. | Let physical key presses produce the HTML wordmark. | Use an actual ANSI keyboard and keep practice input independent from animation clocks. |
| [Codrops dissolve effects](https://tympanus.net/codrops/2025/02/17/implementing-a-dissolve-effect-with-shaders-and-particles-in-three-js/), published 17 Feb 2025 | Shader thresholds and edge emission create a controlled dissolve. | Noise-driven removal with a restrained accent edge. | Dispose the scene and let the wordmark survive the object transition. |
| [Codrops UNTILLABS particle case study](https://tympanus.net/codrops/2025/12/10/simulating-life-in-the-browser-creating-a-living-particle-system-for-the-untillabs-website/), published 10 Dec 2025 | A coordinated particle system can make a site feel alive. | Curved assembly, light propagation and depth. | A finite, skippable opening with reduced motion and a usable fallback. These references are verified demos/case studies; award status was not independently verified. |

## Google Trends: requested scope and unavailable evidence

Requested rolling window: **16 October 2025–16 October 2026**. Regions: **Worldwide, India, United States**. The [Google Trends interface](https://trends.google.com/explore) was reachable, but the requested comparison data could not be obtained through the research interface. A reachable homepage is not a verified export. Every rising-query result below is **UNVERIFIED**; no invented volumes, growth percentages or country comparisons are supplied.

| Exact term | Worldwide | India | United States | Intent-based product/SEO implication, not a measured trend |
| --- | --- | --- | --- | --- |
| typing test | UNVERIFIED | UNVERIFIED | UNVERIFIED | `/typing-test` aliases the real test workspace; direct duration/mode controls. |
| typing practice | UNVERIFIED | UNVERIFIED | UNVERIFIED | `/typing-practice` and `/practice` open actual learning. |
| monkeytype alternative | UNVERIFIED | UNVERIFIED | UNVERIFIED | Explain interaction and formula differences in research; do not publish a thin comparison landing page. |
| keybr alternative | UNVERIFIED | UNVERIFIED | UNVERIFIED | Show measured adaptive practice and progression; do not claim algorithm equivalence. |
| typing speed test | UNVERIFIED | UNVERIFIED | UNVERIFIED | Include speed-test intent in useful test copy and metric explanations. |
| touch typing | UNVERIFIED | UNVERIFIED | UNVERIFIED | `/touch-typing` provides an actual beginner practice loop. |

[Google's explanation of related/rising queries](https://support.google.com/trends/answer/4355000) defines the measure. It does not supply observations for these terms. A future export should preserve the exact terms or topics, geography, date range, category and search type before any comparison. Search interest is normalized, not a count of users or revenue.

## Implemented creative direction: The Keyboard Awakens

One lime signal becomes a keyboard, a keyboard becomes ten keystrokes, and ten keystrokes become **SparowType**. The case stays dark, violet light defines its depth, and a narrow lime readiness wave illuminates real assembly progress. The keys physically press S, P, A, R, O, W, T, Y, P, E as the HTML wordmark types. Noise dissolves the instrument; the wordmark caret then moves into the test when the automatic opening completes. Any typing interaction cancels that decorative movement immediately.

The scene uses deferred Three.js, GSAP and a separately loaded desktop postprocessing module. A single keycap InstancedMesh contains 61 ANSI positions; a separate instanced legend atlas keeps labels readable. Readiness records preferences, actual practice content, font loading and scene creation. There is no fictional WASM task. Sound is optional, synthesized and unlocked by an explicit gesture. A CSS keyboard preserves the composition if WebGL fails. It is not claimed to use the same WebGL shader in fallback mode.

The full sequence is 4.2 seconds, returning sequence 0.9 seconds and reduced-motion wordmark 0.3 seconds. Deep links bypass the opening. Real device performance, native browser audio/IME behavior and sustained FPS require their own evidence. No animation can establish universal visual originality.

## Engineering references and acceptance boundaries

- [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html), [rounded geometry](https://threejs.org/docs/pages/RoundedBoxGeometry.html), [EffectComposer](https://threejs.org/docs/pages/EffectComposer.html), [UnrealBloomPass](https://threejs.org/docs/pages/UnrealBloomPass.html), [cleanup](https://threejs.org/manual/en/cleanup.html): batching, physical geometry, effects and explicit disposal.
- [GSAP Timeline](https://gsap.com/docs/v3/GSAP/Timeline/): a controlled choreography clock, separate from score timing.
- [Workman official layout](https://workmanlayout.org/) and [official X.Org mapping](https://raw.githubusercontent.com/workman-layout/Workman/master/xorg/workman): layout reference, not automatic identification of physical switches or hardware.
- [Largest Contentful Paint](https://web.dev/articles/lcp) and [LCP optimization](https://web.dev/articles/optimize-lcp): visible intro text can become an LCP candidate. A 4.2-second showpiece does not, by itself, meet an added-LCP budget of 150ms. Record actual lab results and retain failed targets as failures.

The [product audit](KEYBOARD_AWAKENS_PRODUCT_AUDIT_2026-10-16.md) records current implementation, finite tests and open deployment/native gates. No competitor code was copied into the implementation.
