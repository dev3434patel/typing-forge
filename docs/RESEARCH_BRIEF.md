# PART B — RESEARCH BRIEF (paste after Part A)

> **Source-quality note (important):** this brief was assembled on 21 Oct 2026 from (a) the project's own audits (which cite Monkeytype source at commit `db0db09…`, TypeRacer's engineering article, PhobosLab's Z-Type articles, Typing.com's release notes), (b) general product knowledge of each site, and (c) a few secondary pages about Keybr-style adaptive training. Nitro Type's current scoring/reward/anti-cheat could NOT be read in the earlier research environment (client-rendered). Items marked **[VERIFY]** must be re-checked by opening the live site before the AI relies on them. No traffic ranks, search volumes or "#1" claims are used as design inputs.

```
RESEARCH BRIEF — what the best typing sites do, what we adopt, how we beat them

1) MONKEYTYPE (monkeytype.com) — the analytics + customization benchmark
Strengths to match: time/words/quote/zen/custom modes; live WPM/accuracy/burst display; result chart with raw vs WPM vs errors; consistency; personal bests per mode; word lists/languages; punctuation/numbers toggles; many themes + custom themes; caret styles; sound packs; stop-on-error / confidence modes; challenges; leaderboards (daily/all-time); account stats, tags; minimalist UI that never blocks typing.
Weaknesses to beat: no teaching (no curriculum, no finger guide); no structured progression; engagement loop is light.
Adopt: all result-screen depth (Part D §8). Beat: tie every analytic to an ACTION ("your weakest bigram is 'th' → start a 3-minute drill").
Rule from our own audit: Monkeytype lets you edit a correct active word but locks a correct submitted word; reopens one previous wrong word at an empty boundary. SparowType already implements `correct-words-locked`. Keep it.

2) KEYBR (keybr.com) — the adaptive-training benchmark
Behavior (from public descriptions): starts with a small letter set; unlocks letters progressively as every active letter reaches a confidence threshold (speed AND accuracy); generates pronounceable pseudo-words (phonetic Markov model) biased toward the focus/weak key; per-key speed heatmap; multiplayer; free. No lessons, no finger guide, no progression system, no meta-game.
Adopt (original implementation, NOT copied): per-key confidence; progressive unlock; weak-key weighting (cap 4×); phonetic text; spaced review.
Beat: add the missing layers — finger guide, curriculum, quests, games, and an explanation of WHY a key is locked.

3) TYPINGCLUB (typingclub.com) — structured pedagogy
Strengths: 600+ staged lessons [VERIFY count], finger/hand overlay, star ratings, gamified lessons, teacher/classroom tooling.
Weaknesses (per secondary reviews): ads, generic content, no adaptive difficulty, kid-oriented feel.
Adopt: staged curriculum with stars (1–3) from accuracy+speed, finger overlay (toggleable, never penalized), clear gating with "practice assist" after 2 failures (never hard-block).
Beat: adult/professional tone + adaptive routing from a placement test + skill map.

4) TYPING.COM — classroom + games + certificates
Strengths: curriculum, games (e.g., Keyboard Jump, which links words to visible movement per their 10 Jun 2024 release note), certificates, teacher dashboard [VERIFY current game list].
Adopt: shareable certificate (client-rendered PNG/PDF) for milestones (e.g., 40/60/80 WPM at ≥95%); accessible keyboard-operable games.
Beat: no ads, no accounts required, zero-tracking.

5) NITRO TYPE — competition + collection loop [VERIFY everything about scoring/rewards]
Pattern: short races, cars, garage customization, seasons, teams, leaderboards.
Adopt (pattern only): cosmetic garage, seasons, teams (later), race feel.
Beat: verified-score integrity, non-monetary economy, accuracy-weighted placements, no pay-to-win.

6) TYPERACER (typeracer.com) — quote racing
From their engineering article (29 Jan 2018): local replay timing is separated from network/server timing. Adopt: immediate local feedback; server-authoritative results. Do not infer current anti-cheat guarantees from that article.
Beat: original/public-domain quotes with attribution; accuracy-weighted ranking.

7) 10FASTFINGERS — the 60-second common-words test
Adopt: a "Classic 60s · top-200 words" preset and fast-restart (Tab/Enter) ergonomics.

8) ZTYPE / PHOBOSLAB — arcade feel
From the creator's writing: immediate, satisfying per-key feedback; deliberate target locking. Adopt: target-lock mechanic (first typed letter locks the nearest matching enemy), per-key hit feedback. Constraint from our audit: input stays exact; no inferred touches.

9) DUOLINGO-STYLE HABIT LOOPS — apply ethically
Adopt: daily quests, streaks with freezes, XP, leagues of ~30 with proximity boards, milestone celebrations.
Do NOT claim retention numbers (e.g., "21% churn reduction") without a primary source [VERIFY or omit]. Zero-shame copy.

10) POSITIONING STATEMENT
"SparowType = Keybr's brain + TypingClub's teaching + Monkeytype's analytics + Nitro Type's competition + ZType's arcade — with receipts." The differentiator is VERIFIABLE accuracy and an honest, action-oriented analytics layer, not feature count.

11) OPEN RESEARCH TASKS FOR THE AI (do these first, document in docs/research/2026-10-xx.md with URL + access date)
- Open each competitor's live site and record: modes, game list, progression mechanics, cosmetics, privacy/ads posture. Mark anything you could not load as UNVERIFIED.
- Check licenses (believed: Monkeytype GPL-3.0, Keybr AGPL-3.0 — VERIFY) and confirm the "no code copying" rule.
- Pick 6 public-domain/CC0 text sources for passages (e.g., Project Gutenberg works, with attribution) and a CC0 word-frequency list per language shipped.
```

---
---
