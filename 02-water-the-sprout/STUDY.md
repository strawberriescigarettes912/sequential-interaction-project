# Study 02 — Water the Sprout

Part of **The Enchanted Garden** (Project 2). Grayscale, Rusty-Lake-style interaction study.
Source artifact: https://claude.ai/artifact/AnzLwdtubR9yCznGteU4fp

## What the study does
A rusty watering can hangs in the air above bare soil. The user **drags the can**; while held it tilts and pours. Drops that land on the planting spot feed a crooked sprout that grows, unfurls leaves and curls its tip. When fully watered, the sprout's tip turns to follow the user's pointer.

## Main visual components
| Component | Description | Code (index.html) |
|---|---|---|
| Palette | Grayscale CSS custom properties (`--soil`, `--wet`, `--can`, `--drop`, `--stem`, `--leaf`…) | lines 5, 16–17 |
| Canvas + resize | Full-screen canvas, DPR scaling; `cx` centre, `gy` ground (74% height) | lines 12, 20–21 |
| Watering can | Body, spout, rose head, highlight, rivets, rust hatching, handle; rotated by `tilt` | `drawCan()` lines 35–45 |
| Soil | Shaky ink ground line; dips (`squish`) where water lands | lines 52–54 |
| Wet patch | Dark ellipse that grows with `wet` | line 55 |
| Bubbles | Rings rising from soil as it "drinks" | lines 56–57 |
| Sprout | Double-stroked Bézier stem, height 10→160px | lines 58–66 |
| Curled tip | Spiral that unwinds after 30% growth, flips toward pointer | lines 67–69 |
| Leaves | Two leaves appear after 20% growth and open | lines 70–75 |
| Drops & splashes | Gravity particles from spout; splash if they miss | lines 76–83 |
| Atmosphere | Film grain, "boil" jitter `j()`, vignette | lines 22–24, 34, 48, 88–90 |
| Reset button | ↺ bottom-right → `reset()` | lines 9–10, 13, 26–27 |

## User actions, feedback, states, transitions
**Input:** pointer events.
- `pointerdown` within 62px of the can (`onCan`) starts a drag with offset (lines 29–30).
- `pointermove` moves the can (clamped to screen, kept above ground) and sets cursor `grab`/`grabbing`; also records `mouse` for the sprout to look at (lines 31–32).
- `pointerup` / `pointercancel` ends drag (line 33).

**State variables:** `drag`, `tilt`, `water` (0→1), `shown` (smoothed water), `wet`, `done`, `look`.

| State | Condition | Feedback |
|---|---|---|
| Idle | not dragging | can upright, sprout a tiny nub |
| Lifting | drag starts | can eases to `tilt = -0.7` (line 49) |
| Pouring | `drag && tilt < -0.45` | 2 drops/frame from spout tip `tip()` (line 50) |
| Hit | drop lands within 75px of centre | `water += 0.004`, wet patch grows, soil squishes, bubbles (line 79) |
| Miss | drop lands elsewhere | splash particles, no growth (line 80) |
| Growing | `water` rising | stem lengthens, leaves at >20%, curl at >30% (eased via `shown`) |
| Drying | not dragging | `wet` fades back toward `water*0.55` (line 85) |
| Done | `water ≥ 1` | further water ignored; sprout sway reduces and tip turns toward pointer (`look`, line 61) |
| Reset | ↺ | all state back to idle |

Main loop: `frame()` (lines 47–91).

## Hook for sequencing
`done` becomes `true` at line 86 — use it to fire a "sprout watered" event and advance to Study 03.

## Dependencies / assets
None. Single self-contained `index.html`, vanilla JavaScript + Canvas 2D. No libraries, images, fonts or network requests.

## How to run
Open `index.html` in any modern browser, or serve the folder (`npx serve .` / `python3 -m http.server`).
