# Hidden measurement marker A/B diagnosis

Frozen build: `7c03d8b602d91e4d92ac`. Date: 17 October 2026, Asia/Kolkata.

Both runs used the same 390×844 Chromium 156.0.8078.4 viewport, 4× CPU throttle, 1,239-character private custom target, assisted 800-character prefill and 150 subsequent real native input characters. Each run saved raw CPU sampling and timeline traces. Both final 950-character prefixes matched exactly with no page errors. Each owned browser closed before starting the next run; no application source changed.

The second run was an explicit diagnostic intervention: only hidden `.typing-text .forge-caret` measurement markers received `display:none`, and only their `getBoundingClientRect()` call was redirected to the real current character's first native client rectangle. The visible overlay, target glyphs, actual input, scoring and 3D source were unchanged. The geometric shim is not a production fix or an accepted benchmark. No WPM is inferred from assisted prefill or profiling runs.

| Measurement | Native baseline | Diagnostic hidden marker | Observation |
| --- | ---: | ---: | --- |
| Layout events | 301 | 290 | Count changed by approximately 4%; layout was not eliminated. |
| Total Layout duration | 1,521.0 ms | 651.8 ms | Approximately 57% lower cost. |
| Maximum Layout event | 22.60 ms | 6.30 ms | Approximately 72% lower maximum. |
| Total PrePaint duration | 937.3 ms | 221.6 ms | Approximately 76% lower cost. |
| Sampled native geometry self time | 1,321.8 ms | 459.5 ms | Baseline `getBoundingClientRect`; diagnostic combines native `getClientRects` 446.6 ms and remaining `getBoundingClientRect` 12.9 ms. |
| Native driver duration under profiling | 8,612.0 ms | 6,233.1 ms | Approximately 28% lower in this single paired diagnostic. |

The intervention supports a substantial causal contribution from the current hidden measurement marker's layout work. It does not establish an acceptance speed, universal device result, or stable p98. Browser/host variance and profiling overhead remain relevant, and timeline categories can overlap.

The prior repeated-shell-render fix is independently visible: old build `ddb953eb3a7408f509f9` sampled repeated router `Link`, URL creation and native `URL` work during the same 150-character segment. Those stacks have no samples in either new build run. The only sampled shared PreferencesContext module frame is a separate callback with 1.7–4.6 ms inclusive time. Absence of samples is not a mathematical zero-time guarantee; source ownership and the sample change support successful removal of redundant shell publications. The full 1,239-character stress benchmark nevertheless remained below the performance goal.

Raw evidence is preserved separately from the original `typing-*` profiling files:

- `after-isolation-baseline-cpu-profile.cpuprofile`
- `after-isolation-baseline-timeline-trace.json`
- `after-isolation-baseline-profile-summary.json`
- `after-isolation-hidden-marker-cpu-profile.cpuprofile`
- `after-isolation-hidden-marker-timeline-trace.json`
- `after-isolation-hidden-marker-profile-summary.json`
- `after-isolation-callframe-comparison.json`

The next production candidate should measure the existing current character directly and remove the hidden marker's layout object. Its geometry must account for RTL leading edges, newline fragments, empty/end carets, wrong/extra glyphs and all caret styles. It then needs the original full native-input benchmark, resize/rotation checks and browser flow tests. Neither these diagnostic CSS changes nor the runtime geometry shim belongs in a released benchmark.
