# PART D — DESIGN SPECIFICATION (save as docs/DESIGN_SPEC.md)

> Defaults below apply ONLY where the repo has no existing token. If a token exists, keep it and map to these names. Verify every color pair with a script (text ≥4.5:1, UI ≥3:1) — do not trust this table without running it.

**§1 Principles:** typing area is sacred (no motion, popups or layout shift while typing); one primary accent; generous spacing; content-first; every animation has a purpose and a reduced-motion twin.

**§2 Typography**
- UI: Inter (variable, self-hosted subset, `font-display: swap`, size-adjusted fallback to system-ui) · Wordmark: Sora 700 only.
- Typing text: JetBrains Mono (fallbacks: ui-monospace, Menlo, Consolas, monospace); default 26 px (existing 3-line passage rule stays), line-height 1.6, letter-spacing 0.
- Scale (px / line-height): 12/16, 14/20, 16/24, 18/28, 20/28, 24/32, 32/40, 48/56 (results WPM headline 72/72, weight 700, `font-variant-numeric: tabular-nums`).

**§3 Color tokens (dark default "Forge Night")**
| Token | Hex | Use |
|---|---|---|
| --bg | #0A0C10 | page |
| --surface-1 | #11141A | cards |
| --surface-2 | #181C24 | raised / modals |
| --border | #262B36 | hairlines |
| --text | #E8EAF0 | primary text |
| --text-muted | #9AA3B2 | secondary |
| --accent | #F5B83D | primary action (forge amber) |
| --accent-ink | #1A1304 | text on accent |
| --correct | #34D399 | correct char |
| --error | #F87171 | error char (always paired with underline/shape) |
| --warning | #FBBF24 | caution |
| --info | #60A5FA | info |
Light "Daylight": --bg #F7F8FA, --surface-1 #FFFFFF, --surface-2 #F0F2F6, --border #D9DEE7, --text #12151C, --text-muted #4B5563, --accent #B45309, --accent-ink #FFFFFF, --correct #047857, --error #B91C1C.
High-contrast: pure #000/#FFF, 2 px borders, focus ring 3 px.
Finger palette (color-blind-safe, plus pattern/label so color is never the only cue): L-pinky #E69F00, L-ring #56B4E9, L-middle #009E73, L-index #F0E442, R-index #0072B2, R-middle #D55E00, R-ring #CC79A7, R-pinky #999999, thumbs #FFFFFF at 60%.
Game accents: Invaders #7C5CFF, GP #FF5C5C, Rhythm #22D3EE, Tower #84CC16, Snake #10B981, Lava #FB923C, Duel #E879F9.

**§4 Spacing / radius / elevation**
Space: 4, 8, 12, 16, 24, 32, 48, 64. Radius: 6 (inputs), 10 (cards), 16 (modals), 999 (pills). Elevation: e1 `0 1px 2px rgba(0,0,0,.35)`, e2 `0 6px 20px rgba(0,0,0,.40)`, e3 `0 18px 48px rgba(0,0,0,.55)`. Focus ring: 2 px solid var(--accent) with 2 px offset (3 px in high-contrast).

**§5 Motion (all disabled or reduced to ≤1 opacity step when prefers-reduced-motion)**
Durations: 90 ms (press), 160 ms (hover/state), 240 ms (panel), 360 ms (modal/enter), 600 ms (celebration max).
Easings: `--ease-standard: cubic-bezier(0.2, 0, 0, 1)`; `--ease-decel: cubic-bezier(0.05, 0.7, 0.1, 1)`; `--ease-accel: cubic-bezier(0.3, 0, 0.8, 0.15)`; `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` (celebrations only).
Key-press ripple: scale .6→1.4, opacity .35→0, 240 ms standard. Caret smooth style: 70 ms linear translate. Level-up: card scale .94→1 with spring 360 ms; confetti ≤60 pieces, 1,200 ms max.

**§6 Components** (each with states default/hover/focus-visible/active/disabled/loading/error): button (primary/secondary/ghost, min-height 44), segmented control, toggle, slider (thumb ≥24 px with 44 px hit area), tabs, card, modal (focus trap, return focus, Esc), toast (polite live region, 5 s, pause on hover), progress bar (role=progressbar with text value), data table (sortable headers, sticky first column on mobile), tooltip (hover + focus; never the only place for information).

**§7 Layout:** max content width 1200 px; typing workspace max 1040 px; breakpoints 480 / 768 / 1024 / 1200 (nav switch stays at 1200 per existing audit); bottom nav on phones; safe-area insets honored.

**§8 Results screen (professional spec)**
Top row: WPM (72 px) · accuracy · consistency · raw WPM · time, each with a PB delta chip (▲/▼ + number, not color alone). Middle: WPM/raw/errors chart (canvas, 60 fps, table alternative). Under: keyboard heatmap (speed or accuracy toggle) and per-finger bars; error classification chips; "Next best action" card with one button (start the suggested drill). Actions: Retry (Enter), New text (Tab), Share image, Export JSON. Every number has a hover/focus explanation linking to METRICS.md. No confetti unless a real PB or level-up.

---
---
