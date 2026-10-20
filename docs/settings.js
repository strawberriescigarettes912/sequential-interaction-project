// The Enchanted Garden — saved defaults.
// The tool panel (panel.js) edits a live copy of these values. "Copy settings" in the panel
// gives you JSON you can paste back to Claude Code to make it the new saved defaults here.
//
// PANEL_VISIBLE: false hides the tool panel on the live site. Even when hidden, it can be
// opened with the "P" key or by adding ?panel to the URL (handy for class demos).
window.PANEL_VISIBLE = false;

window.DEFAULTS = {
  palette: {
    // Rusty Lake: a dim room lit by an old lamp — tobacco darks, rust, bone, a single blood-red bloom
    bg:        '#17120d',
    ink:       '#0a0705',
    ground:    '#0f0b08',
    soil:      '#3d2b1f',
    soilHi:    '#6b4a33',
    grain:     '#8a6a4c',
    wet:       '#21170f',
    seed:      '#b29b6e',
    sclera:    '#e8dcc0',
    iris:      '#4a6b5d',
    bucket:    '#7a3a1f',
    bucketHi:  '#b0613a',
    drop:      '#8fa59a',
    stem:      '#55603a',
    leaf:      '#7d8a52',
    petal:     '#8e2219',
    petalBack: '#5b130f',
    petalHi:   '#b8402c',
    dust:      '#d4b06a',
    lamp:      '#f2c879',
  },
  plant: {
    pushSpeed:  0.28,  // burial progress per second while holding
    creepBack:  0.18,  // how fast the seed rises again if you let go early
    moundHeight: 44,   // px
  },
  water: {
    pourRate:   0.003, // growth per drop that lands on the spot
    tiltAngle:  0.7,   // radians the bucket tips while dragged
    sproutHeight: 150, // px
  },
  wake: {
    openRate:   0.30,  // petal opening per full slow circle
    shyLimit:   9,     // circling faster than this (rad/s) startles it shut
    petalCount: 8,
    bloomSize:  1.45,
  },
  mood: {
    lampGlow:   0.35,  // warm light pooled behind the scene
    vignette:   0.85,
    filmGrain:  0.07,
    inkWobble:  0.16,  // seconds between "boiling" line redraws (lower = shakier)
    lineWeight: 1.0,
  },
};
