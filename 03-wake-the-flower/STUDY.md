# Study 03 — Wake the Flower

Part of **The Enchanted Garden** (Project 2). Grayscale, Rusty-Lake-style interaction study.
Source artifact: https://claude.ai/artifact/DCZ3Ma6L9Cw7QWUuVi5Vxb

## What the study does
A sleeping flower droops on a thorny stem. The user **slowly circles the pointer around it** to coax it awake: the head lifts, petals spread and an eye opens in the centre. Circling **too fast** startles it — it flinches and closes a little. Fully awake, it releases dust, blinks occasionally and its pupil follows the pointer.

## Main visual components
| Component | Description | Code (index.html) |
|---|---|---|
| Palette | Grayscale CSS custom properties (`--petal`, `--petal-back`, `--petal-hi`, `--stem`, `--sclera`, `--dust`…) | lines 5, 16–17 |
| Canvas + resize | Full-screen canvas, DPR scaling; flower centre `fx,fy` (40% height), ground `gy` (82%) | lines 12, 18–20 |
| Ground | Dark shaky band | lines 60–61 |
| Guide ring | Dotted circle (r=130) fades in when pointer is in the active zone | lines 62–63 |
| Pointer trail | Fading ink specks along the pointer path | lines 34, 64–65 |
| Stem | Quadratic curve with 4 thorns; straightens as it wakes | lines 71–76 |
| Flower head | 3 sepals + 8 petals (back row then front row), drawn by `petal()` with ink hatching | `petal()` lines 43–51, head lines 66–85 |
| Eye | Appears when openness > 0.45; lid, sclera, iris, pupil tracking pointer, highlight, blinking | lines 86–102 |
| Dust | Burst of 40 particles on waking, then gentle drift | lines 56, 103–105 |
| Atmosphere | Film grain, "boil" jitter, vignette | lines 21–24, 54, 106–109 |
| Reset button | ↺ bottom-right → `reset()` | lines 9–10, 13, 27–28 |

## User actions, feedback, states, transitions
**Input:** pointer movement only (no click needed) — `pointermove` handler lines 29–40, `pointerleave` line 41.
- Active zone: 30–260px from the flower centre. Outside it, tracking resets.
- Entering the zone triggers a small `twitch` (line 33).
- Angular change between moves adds to `open`: one full circle ≈ +0.3 (≈ 3.3 slow circles to wake, line 39).
- Angular speed > 9 rad/s → `shy = 1` and `open -= 0.035` (line 38).

**State variables:** `open` (target 0→1), `shown` (smoothed), `o` (eased display value minus shyness), `shy`, `twitch`, `near`, `done`, `blink`.

| State | Condition | Feedback |
|---|---|---|
| Asleep | `open = 0` | head hangs down/right, petals closed, sepals visible |
| Noticed | pointer enters zone | twitch jitter, guide ring + trail appear |
| Waking | slow circling | head lifts and grows (scale 0.9→1.45), petals spread and lengthen, stem straightens |
| Startled | circling too fast | head jitters, rotation shakes, eye lid snaps shut, loses some openness |
| Eye opening | `o > 0.45` | eye fades in, pupil tracks pointer |
| Awake (`done`) | `open ≥ 1` (line 56) | dust burst, continuous dust drift, random blinks every 2.5–5.5s, input no longer changes openness |
| Reset | ↺ | all state back to asleep |

Main loop: `frame()` (lines 53–110).

## Hook for sequencing
`done` becomes `true` at line 56 — the end of the garden sequence (or the trigger for a following scene).

## Dependencies / assets
None. Single self-contained `index.html`, vanilla JavaScript + Canvas 2D. No libraries, images, fonts or network requests.

## How to run
Open `index.html` in any modern browser, or serve the folder (`npx serve .` / `python3 -m http.server`).
