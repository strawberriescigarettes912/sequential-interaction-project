# Study 01 — Plant the Seed

Part of **The Enchanted Garden** (Project 2). Grayscale, Rusty-Lake-style interaction study.
Source artifact: https://claude.ai/artifact/P13MU4ngwu8mqGsVu2WzoA

## What the study does
A seed hovers above a mound of soil. The user **presses and holds** on the mound to push the seed into the ground. Holding too briefly lets the seed creep back up. When it is fully buried, an eye opens in the soil, blinks once, and sinks shut.

## Main visual components
| Component | Description | Code (index.html) |
|---|---|---|
| Palette | Grayscale CSS custom properties (`--bg`, `--ink`, `--soil`, `--seed`, `--sclera`…) read into `C` | lines 5, 16–17 |
| Canvas + resize | Full-screen canvas, DPR scaling; sets `cx` (centre) and `gy` (ground line, 62% height); regenerates soil specks | lines 12, 20–22 |
| Soil mound | Gaussian bump `surf(X)`, height grows 44→56px with progress; shaky ink outline, specks, hatching | lines 29–30, 54–60 |
| Seed | Ellipse with seam line; idle bob, shake while held, eased descent | lines 46–53 |
| Press dent | Ink arc on the mound while holding, narrows as `p` rises | lines 61–62 |
| Soil grains | Particles spilling off both sides while holding | lines 41, 63–65 |
| Soil eye | Opens / blinks / closes after burial | lines 66–71 |
| Atmosphere | Film grain (regenerated every 0.09s), "boil" line jitter (every 0.16s), radial vignette | lines 23–25, 38, 72–75 |
| Reset button | Fixed ↺ button bottom-right, calls `reset()` | lines 9–10, 13, 27–28 |

## User actions, feedback, states, transitions
**Input:** pointer events (mouse, touch, pen).
- `pointerdown` on the mound hit-area (`onMound`, ±160px of centre, near the surface) → `holding = true` (line 32–33).
- `pointerup` / `pointercancel` → `holding = false` (line 34).
- Dragging off the mound while holding cancels the hold (line 35).

**State variable:** `p` (0→1 burial progress), `holding`, `done`, `eye` (timer after burial).

| State | Condition | Feedback |
|---|---|---|
| Idle | `p≈0`, not holding | seed bobs gently above the mound |
| Pressing | `holding` | `p += 0.28/s` (~3.6s to bury), seed shakes, dent shown, grains spill, mound rises |
| Released early | `!holding && p>0` | `p -= 0.18/s`; seed creeps back up (line 42) |
| Buried (`done`) | `p ≥ 1` | input ignored; eye sequence: opens 0–0.6s, holds, blinks at 1.4–1.8s, holds, closes 3–3.8s, then a closed-lid line (line 67) |
| Reset | ↺ clicked | all state back to idle |

Main loop: `frame()` (lines 37–76) updates state then redraws everything each animation frame.

## Hook for sequencing
`done` becomes `true` at line 43 — the natural place to fire a "seed planted" event and advance to Study 02 (e.g. after the eye closes, `eye > 3.8`).

## Dependencies / assets
None. Single self-contained `index.html`, vanilla JavaScript + Canvas 2D. No libraries, images, fonts or network requests.

## How to run
Open `index.html` in any modern browser, or serve the folder (`npx serve .` / `python3 -m http.server`).
