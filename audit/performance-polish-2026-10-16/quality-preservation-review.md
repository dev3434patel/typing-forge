# Independent 3D quality preservation review

Reviewed on 16 October 2026 against the previous delivery archive and the current working-tree source. This review used source reads, a read-only ZIP inspection, and local geometry construction. It did not launch a browser, run a build, extract the archive over the workspace, or change application code.

## Evidence identity

- Previous archive at review time: `delivery/SparowType-source.zip`.
- Archive size: **9,651,701 bytes**.
- Archive SHA-256: **`e447be065f2a3a3c7df68738364fdf9c3df7efdef450d55d3bf71358236ac158`**.
- ZIP root: `SparowType/`; 568 archive entries.
- Previous and current Three.js dependency: **0.186.1**.

The archive must be retained under another name before regenerating the delivery. The hash above identifies the old evidence even after the original delivery path is replaced.

Compared prior archive entries:

- `SparowType/src/components/brand/keyboard-scene.ts`
- `SparowType/src/components/brand/keyboard-bloom.ts`
- `SparowType/src/components/brand/keyboard-layout.ts`
- `SparowType/package.json`

Compared current files:

- `src/components/brand/keyboard-scene.ts`
- `src/components/brand/keyboard-model.ts`
- `src/components/brand/keyboard-bloom.ts`
- `src/components/brand/keyboard-environment.ts`
- `src/components/brand/keyboard-layout.ts`
- `src/components/brand/keyboard-framing.ts`
- `audit/performance-polish-2026-10-16/package-source.py`

The old archive has no separate `keyboard-model.ts`, `keyboard-environment.ts`, or `keyboard-framing.ts`; their previous responsibilities were inside the scene and bloom files.

## Retained rendering settings

| Property | Prior archive | Current source | Assessment |
|---|---|---|---|
| Physical layout | 61 ANSI keys, five rows, pitch 0.37 | Same | Layout file is byte-identical. |
| Keycap instancing | One 61-instance keycap mesh | Same | Preserved. |
| Desktop cap material | `MeshPhysicalMaterial`, color `#151520`, roughness 0.38, metalness 0.1, clearcoat 0.6, clearcoat roughness 0.25 | Same | Preserved. |
| Mobile cap material | `MeshStandardMaterial` with the same base color, roughness and metalness | Same | Existing mobile material policy is preserved. |
| Case | `#0E0E14`, metalness 0.9, roughness 0.3; dimensions 5.86 × 0.23 × 2.16 | Same | Preserved. |
| Tone mapping | ACES filmic, exposure 1.15; sRGB output | Same | Preserved. |
| Antialiasing | Enabled on desktop; disabled for the existing low-power tier | Same | Preserved. |
| Configured DPR cap | Desktop 1.5, mobile 1 | Same | No configured resolution reduction. |
| Desktop shadows | PCFSoft, 2048 × 2048 | Same | Preserved. |
| Mobile shadows / post FX | Disabled under the existing low-power policy | Same | This difference between tiers predates this work. |
| Legend atlas | Desktop 1024², mobile 512²; linear filtering; no mipmaps | Same | Atlas resolution and sampling retained. |
| Perspective FOV | 32° | Same | Preserved. |
| Bloom | Strength 0.55, radius 0.8, threshold 0.82 | Same | Constructor settings identical. |
| Chromatic shader offset | `(vUv - 0.5) * 0.0012` | Same | Shader expression identical. |
| Vignette | Strength 0.35 with the same smoothstep range | Same | Shader expression identical. |
| Film grain | 0.035 with the same time-dependent noise expression | Same | Shader expression identical. |
| Key emissive expression | Key glow × 1.1, dissolve edge × 0.85 | Same | Preserved. |
| Choreography | Catmull-Rom assembly, physical presses, 4.2-second timeline, noise dissolve | Same sequence and durations | No shortened animation was used for Lighthouse. |

The desktop post-processing settings were compared directly in both files. Moving environment ownership out of the bloom module does not remove it: the current scene initializes the shared environment explicitly.

## Geometry measurements and changes

Triangle and vertex counts were obtained by constructing the relevant geometry with the installed pinned Three.js version. The new keycap deformation changes positions and normals without changing topology.

| Geometry | Prior archive | Current source |
|---|---:|---:|
| Desktop cap vertices per shared geometry | 1,764 | 1,764 |
| Desktop cap triangles per cap | 588 | 588 |
| Desktop cap triangles across 61 instances | 35,868 | 35,868 |
| Mobile cap vertices per shared geometry | 900 | 900 |
| Mobile cap triangles per cap | 300 | 300 |
| Mobile cap triangles across 61 instances | 18,300 | 18,300 |
| Case triangles | 588 | 588 |
| Legend triangles across 61 planes | 122 | 122 |
| Underglow geometry triangles | 300 | 224 |

These component counts exclude repeated shadow/post-processing passes and temporary studio-environment rendering. They are not GPU frame-cost or frame-rate measurements.

The **300-to-224 underglow change is real**. A solid, protruding rounded plate became a narrow, hollow, recessed perimeter band. Its dimensions also changed from 5.92 × 0.025 × 2.22 to a 5.84 × 0.014 × 2.14 band with a 0.012 wall thickness. This is an intentional visual shape redesign. A claim that every mesh is geometrically identical would be inaccurate.

Keycaps gain a taper, a subtle dish and world-unit bevel dimensions. Cap height changes from the previous scaled 0.14 to 0.16; the current shared geometry uses a 0.028 bevel radius. Long keys expand through a width attribute instead of stretching the complete rounded cap, preserving their bevel proportions. The custom depth material applies the same width and dissolve rules, improving shadow agreement with the visible caps.

Legends use cropped glyph bounds, proportional planes and a common physical em size. The old variable-width planes stretched square atlas cells. The atlas dimensions are unchanged; the glyph proportions and punctuation sizing are deliberately corrected.

## Lighting and camera

The original white key light at 2.2, violet rim at 3.0, ambient light at 0.15 and hemisphere light at 0.25 remain. The current scene adds a soft front fill at 0.5. Desktop retains the same RoomEnvironment/PMREM setup at intensity 0.35; mobile now receives that real environment too. The PMREM source uses the same 0.04 blur parameter.

Nominal camera elevations, calculated from the configured position toward the scene target near y = 0.02:

| Camera point | Prior archive | Current source |
|---|---:|---:|
| Start | 33.60° | 34.85° |
| Settled product view | 32.26° | 35.05° |
| Exit | 61.25° | 34.99° |

The current view maintains approximately 11–14° of horizontal yaw. This replaces the former steep overhead exit with a consistent three-quarter product view. Pointer parallax and touch drift remain.

The new framing helper uses an off-axis view offset on wide screens: an upward framing shift of 14% of viewport height, or 22% on short landscape screens; portrait has no shift. It preserves FOV and configured render resolution. This is a composition change, and the image is not pixel-identical to the old camera path.

## Quality retention under load

The old scene automatically removed bloom and repeatedly lowered DPR, with a floor of 0.75, when its sampled frame rate dropped below 45 FPS. That branch is removed. The current scene reports measured slow frames while retaining the configured visual settings. Its initial FPS diagnostic is zero until a real sample is available.

Worker rendering, smaller startup work, stable fallback-key rendering and idempotent canvas resizing address document-thread work and unnecessary buffer clearing. They do not require a lower cap segment count, a smaller legend atlas, weaker desktop post effects, or lower configured DPR. A genuine unsupported/lost WebGL context still uses the documented recovery/fallback paths.

## Packaging confirmation

The current collector in `audit/performance-polish-2026-10-16/package-source.py` walks the project root with `os.walk(ROOT)`. Its exclusions do not include `build/`, and no separate top-level allowlist omits that directory. Both current plugin files are therefore included by the collector:

- `build/keyboard-worker-plugin.ts`
- `build/opening-critical-plugin.ts`

This confirms the collector's source behavior. Verification of the newly generated ZIP, its manifest and its payload hashes remains a separate packaging gate.

## Conclusion and limits

The comparison supports this statement: **the performance work retains the configured keycap detail, resolution, material finish, desktop shadows and post effects; it adds lighting and model refinements, and deliberately redesigns the camera composition and underglow shape.**

It does not establish identical pixels, universal 60 FPS, physical-device GPU memory behavior, or identical quality between desktop and mobile tiers. Those tiers already differ in the prior archive. Runtime full-quality assertions, native context recovery, responsive captures and repeated Lighthouse measurements must be assessed using their separate browser evidence.
