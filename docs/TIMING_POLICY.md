# Typing clock policy

Personal typing time begins with the first inserted character attempt, including
an incorrect character. Opening a page, preparing a passage, focusing the input,
pressing a modifier, deleting an empty input or clicking Start does not consume
typing time. A committed IME composition starts timing when its characters are
accepted; intermediate composition previews do not count as typed attempts.

After the first attempt, idle time counts. Timed practice receives its whole
configured duration from that first attempt. Supported explicit pauses exclude
the paused interval, and paused practice remains distinguishable in evidence.
Restart creates a new controller and a fresh clock. Rates use monotonic elapsed
time rather than counting animation or timer callbacks.

| Surface | Clock origin | Scope |
| --- | --- | --- |
| Test, Learn, guided lessons, placement and private practice | First inserted character attempt | Existing canonical first-input behavior, with regression checks. |
| Local bot practice | The player's first inserted character attempt | Player and bot share the same monotonic origin; the bot stays still while the player prepares. |
| Signal Run | First inserted character attempt after preparing the field | Pre-typing focus, pause/resume, launch and empty edits keep elapsed time at zero. |
| Arcade | First inserted character attempt after preparing visible targets | The world, ghosts, bots and canonical typing clock wait together. |
| Live human races and Arena | Authoritative shared room start | One deadline and elapsed basis are required for server settlement. The user explicitly chose to retain this shared clock. |

Ranked challenges and asynchronous private duels have independent attempts, so
their first-input preparation-window policy is versioned separately from live
room timing. The exact implemented contract and verification receipts are
recorded in the release audit. Existing issued challenges retain their original
fixed-start policy; client code must never silently change their clock origin.

Browser timing and replay validation establish consistency of submitted evidence.
They do not establish the physical first key's time, human identity, or physical
mobile keyboard behavior. Lab Event Timing is reported separately from score
duration and does not constitute field INP.
