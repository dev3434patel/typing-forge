# Brand and theme contract review — 16 October 2026

Source review and pure contrast checks, followed by a narrow contrast correction. This agent launched no browser/build; the final confirmation below incorporates the root's saved integrated results. No deployment or full accessibility audit is claimed. Original Chromium and cross-engine failure artifacts were retained.

## Identity and assets

- **Exact default dark tokens checked:** `--bg #07070A`, `--surface #0E0E14`, `--surface-2 #151520`, `--border rgba(255,255,255,.08)`, `--text #EDEDF2`, `--text-dim #8B8BA0`, `--accent #C6FF3D`, `--accent-2 #7B61FF`, `--error #FF4D6D`, `--success #3DFFA2`. Both `src/index.css` initial values and `src/lib/themes.ts` / `applyTheme` agree. Exact requested default values were preserved during this correction.
- Tailwind's HSL semantic values use `--ui-accent`, `--ui-border` and `--ui-success`; they do not overwrite the raw brand variables. `applyTheme` also updates `color-scheme`, the canonical theme ID, dark class and the browser's theme-color metadata.
- `BrandWordmark` contains only the text **SparowType**. CSS declares Sora, weight 700, `Sparow #EDEDF2`, `Type #C6FF3D`. On the two light palettes, a dark capsule preserves those exact letter colors. At full opacity on `#07070A`, the two colors have ratios **17.24:1** and **17.03:1** respectively.
- Header, footer, auth and opening import the shared wordmark. The remaining `BrandMark.tsx` filename is a compatibility path; no bird component/export remains. Search found no obsolete sky-blue/navy brand color in application source or public brand assets.
- The original `public/sparowtype.svg` review found a full typographic wordmark on a dark backing with embedded Sora WOFF2. A later strict favicon audit correctly identified that this SVG should be a plain **S**, matching PNG/ICO icons; root corrected it. Inspected `icon-192.png`, `icon-512.png` and `og-sparowtype.png`: letter **S** icons and full wordmark social image, with no bird artwork. The final served-SVG assertion belongs to the separately saved final icon/PWA confirmation, not the earlier review. Index metadata references the real 1200×630 social image.
- Fonts are self-hosted under `public/fonts/`: Sora, Inter and JetBrains Mono variable WOFF2 subsets, with their license files. All font URL targets referenced by `fonts.css` exist. CSS uses `font-display: swap`; index preloads the three Latin faces from the same paths. No remote Google Fonts request is declared. Body uses Inter; display headings Sora 600; typing text JetBrains Mono. Non-Latin packs may use OS-installed Nirmala UI/Noto/Tahoma fallbacks; these script-specific fallback families are **not** all bundled. Fallback `size-adjust:100%` is a basic declaration, not a calibrated layout-shift guarantee.

## Eight-theme contrast checks

Ratios use the WCAG sRGB relative-luminance calculation on solid color pairs. Rounded values below are informational; tests compare the unrounded ratio with 4.5 for small text and 3 for the strong input boundary. Native options use the `text`/`raised` pair.

| Theme | Text/card | Muted/card | Muted/raised | Muted/hover | Button ink/accent | Error/error panel | Native option | Secondary accent text, worst surface | Input boundary/card |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Sparow dark | 16.49 | 5.77 | 5.43 | 5.05 | 17.03 | 5.46 | 15.51 | 6.94 | 3.55 |
| Sparow light | 17.48 | 5.67 | 5.00 | 4.68 | 6.60 | 5.58 | 15.41 | 5.07 | 4.57 |
| Graphite | 15.07 | 5.70 | 5.16 | 4.71 | 14.23 | 5.46 | 13.63 | 5.99 | 4.51 |
| Midnight blue | 14.92 | 6.24 | 5.57 | 4.74 | 9.76 | 6.31 | 13.33 | 5.45 | 3.21 |
| Ember | 15.12 | 5.79 | 5.32 | 4.69 | 9.58 | 5.72 | 13.90 | 5.88 | 3.26 |
| Mono ink | 18.73 | 7.88 | 7.09 | 6.12 | 21.00 | 5.46 | 16.86 | 5.99 | 5.94 |
| Paper | 14.45 | 6.02 | 4.96 | 4.61 | 7.74 | 5.58 | 11.90 | 4.58 | 4.46 |
| Aurora | 14.49 | 6.67 | 5.89 | 4.76 | 10.64 | 7.35 | 12.78 | 4.96 | 3.12 |

The extended test covers **text, muted, secondary, accent, secondary-accent text, error, extra and success** against **page, card, raised and hover** for all eight themes: 256 foreground/background checks, in addition to the existing button/error-panel/input-boundary checks. The least ratio in that expanded text matrix is approximately **4.53:1**.

Concrete fixes from this review:

- Darkened muted text slightly in Sparow light/Paper; lightened it in Graphite/Midnight blue/Ember/Aurora. The old Aurora muted/raised pair was 4.47; old muted/hover pairs reached as low as 3.61. All now pass on the four tested surfaces.
- Lightened error/extra colors in Midnight blue, Ember and Aurora so error text also passes on their hover surfaces. The exact default `#FF4D6D` remains unchanged.
- Kept raw violet `--accent-2` as the exact decorative brand/glow color. It is not a general small-text color: on some raised/hover surfaces its ratio is below 4.5. Added the explicitly readable `accent2Text` / `--text-accent-2` contract for small text, tested across all four surfaces. Current raw-violet consumers are decorative; do not use the glow token for small labels.

## Focus, opacity and limits

- Source declares a 2px focus outline with 2px offset. The original review identified active-typing opacity reductions: header/footer .25, typing controls .35 and non-error feedback .65. Hover/focus reveal existed but did not make the dimmed state's text contrast conformant.
- Root subsequently corrected those CSS overrides to opacity **1**, preserving the exact underlying theme tokens while removing this known active-state dimming issue. The final brand browser case asserts actual active header/footer/control opacity; non-error feedback's opacity 1 is additionally confirmed in source. This fixes the identified override, not every possible opacity/overlay state or full WCAG conformance.
- The requested 8%-white separator is intentionally faint: composited over the three default dark surfaces it is approximately **1.17–1.24:1**. It must not be the sole visible boundary of an interactive input; the separately checked strong input boundary is at least 3.12:1 across these themes.
- These pair checks establish finite color contracts. They do **not** establish full WCAG conformance, native OS popup rendering, all overlays/charts/exported images, font load behavior, focus order, screen-reader behavior, or every opacity/animation state.

## Verification

- `npx vitest run src/lib/__tests__/themes.test.ts`: **21 tests passed** (13 existing tests plus eight new surface-matrix cases).
- Scoped ESLint: `src/lib/themes.ts`, `src/lib/__tests__/themes.test.ts`.
- Final root confirmation: [icon-pwa-final.json](icon-pwa-final.json) records **16 passed / 0 skipped / 0 failed** across Chromium, Firefox, Windows Playwright WebKit and installed Microsoft Edge on public build `3d714a0008e8c342f2a2`. Each project passed the three brand/theme/legacy-preference/header cases and the separate real-outage PWA case. The served SVG check requires exactly one text **S**, `#07070A` backing and no emblem elements; active header/footer/controls remain at opacity 1. This does not erase the earlier interrupted Edge matrix or certify native Safari.
- The separate final font/route confirmation records **15 passed / 0 skipped / 0 failed** (five cases each in Chromium/Firefox/WebKit). Its [font diagnosis](font-diagnostic/findings.md) explains strict exact-face receipts, one direct-load retry and two paint frames within the unchanged 10-second bound. Native script/system fallback behavior remains outside that finite check.
