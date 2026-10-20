// The Enchanted Garden: one continuous sequence built from three studies.
//   1. Plant  (Study 01): press and hold the soil to push the seed in; letting go early lets it creep back up.
//   2. Water  (Study 02): a rusty bucket lowers on a rope; drag it, it tips and pours; drops on the spot grow the sprout.
//   3. Wake   (Study 03): a bud forms on the sprout; circle slowly around it to open it; too fast startles it.
// The same seed → sprout → flower persists. Each step unlocks only when the previous one completes.
//
// Scene coordinates: origin at the centre of the ground line, y negative upwards, scaled by k to fit the screen.

const c = document.getElementById('c'), x = c.getContext('2d');
const hintEl = document.getElementById('hint');
// Colours and tunable values come from settings.js via the live copy S (edited by the tool panel).
const C = {};
const CMAP = { '--bg':'bg','--ink':'ink','--ground':'ground','--soil':'soil','--soil-hi':'soilHi','--grain':'grain','--wet':'wet',
  '--seed':'seed','--sclera':'sclera','--iris':'iris','--can':'bucket','--can-hi':'bucketHi','--drop':'drop','--stem':'stem','--leaf':'leaf',
  '--petal':'petal','--petal-back':'petalBack','--petal-hi':'petalHi','--dust':'dust','--lamp':'lamp' };
function syncColors() { for (const k in CMAP) C[k] = S.palette[CMAP[k]] }
syncColors();
const LW = v => v * S.mood.lineWeight;
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})` };
const cardEl = document.getElementById('card'), resetEl = document.getElementById('reset');
const cardTitle = document.getElementById('cardTitle'), cardSub = document.getElementById('cardSub');

const FY = -260;                       // centre of the awake flower head
let W, H, D, cx, gy, k, speck = [];
const rnd = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s) };
const halfW = () => W / 2 / k, topY = () => -gy / k, botY = () => (H - gy) / k;
function size() {
  D = devicePixelRatio || 1; W = innerWidth; H = innerHeight; c.width = W * D; c.height = H * D;
  cx = W / 2; gy = H * 0.72;
  k = Math.max(0.5, Math.min(1, (gy - 30) / 390, W / 440));
  speck = [];
  for (let i = 0; i < 260; i++) speck.push({ x: (Math.random() - .5) * 2 * halfW(), y: -70 + Math.random() * (botY() + 70), s: Math.random() * 2 + 1, l: Math.random() < .5 });
}
addEventListener('resize', size); size();
const world = () => x.setTransform(D * k, 0, 0, D * k, D * cx, D * gy);
const screen = () => x.setTransform(D, 0, 0, D, 0, 0);
const toWorld = e => ({ x: (e.clientX - cx) / k, y: (e.clientY - gy) / k });

// film grain
const g = document.createElement('canvas'); g.width = g.height = 160; const gx = g.getContext('2d');
function grain() { const im = gx.createImageData(160, 160); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255 } gx.putImageData(im, 0, 0) }
grain();

const ease = v => v < .5 ? 2 * v * v : 1 - ((-2 * v + 2) ** 2) / 2;
const easeOut = v => 1 - Math.pow(1 - v, 3), lerp = (a, b, s) => a + (b - a) * s;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

let hintText = '';
function setHint(s) {
  if (s === hintText) return; hintText = s;
  if (s) hintEl.textContent = s;   // when clearing, keep the old words while they fade out
  hintEl.classList.toggle('on', !!s);
}

// ---- state ----
// phase: plant → planted (soil eye) → water → grown (bucket leaves) → wake → awake
let phase, phaseT, t, boil, mouse;
let p, holding, eye, shake, grains, settle;                                              // plant
let bucket, drag, off, tilt, drops, splash, bubbles, water, wet, shown, squish, look,
    lower, hooked, ropeX, ropeEnd, gone;                                                  // water
let bud, open, fshown, lastA, lastT, trail, shy, near, twitch, blink, nextBlink, inside, dust; // wake
function go(ph) { phase = ph; phaseT = 0 }
function reset() {
  go('plant'); t = 0; boil = 0; mouse = { x: 0, y: FY + 200 };
  p = 0; holding = false; eye = 0; shake = 0; grains = []; settle = 0;
  bucket = { x: 0, y: 0 }; drag = false; off = { x: 0, y: 0 }; tilt = 0; drops = []; splash = []; bubbles = [];
  water = 0; wet = 0; shown = 0; squish = 0; look = 0; lower = 0; hooked = true; ropeX = 0; ropeEnd = 0; gone = false;
  bud = 0; open = 0; fshown = 0; lastA = null; trail = []; shy = 0; near = 0; twitch = 0; blink = 0; nextBlink = 2; inside = false; dust = [];
  setHint('');
}
reset();
document.getElementById('reset').onclick = reset;

// scene jumps for the tool panel: start any step with the earlier steps already finished
window.garden = {
  jump(ph) {
    reset(); t = 6;
    if (ph === 'plant') return;
    p = 1; eye = 6; settle = 1;
    if (ph === 'water') { go('water'); bucket = { x: hangX(), y: topY() - 120 }; ropeX = hangX(); return }
    water = shown = 1; wet = .55; gone = true;
    go('wake');
    if (ph === 'awake') { bud = 1; open = fshown = 1; go('awake'); phaseT = 3 }
  }
};


// ---- ground: Study 01's mound, which settles once the seed is planted ----
const moundH = () => phase === 'plant' ? S.plant.moundHeight + p * 12 : lerp(S.plant.moundHeight + 12, 26, ease(settle));
const surf = X => -moundH() * Math.exp(-((X / 85) ** 2)) + (Math.abs(X) < 80 ? squish * (1 - Math.abs(X) / 80) : 0);
const onMound = w => Math.abs(w.x) < 160 && w.y > surf(w.x) - 70 && w.y < 90;

// ---- bucket (replaces Study 02's watering can) ----
const hangX = () => -Math.min(230, halfW() - 80), hangY = () => Math.max(-300, topY() + 110);
const onBucket = w => Math.hypot(w.x - bucket.x, w.y - bucket.y) < 62;
const handleY = () => bucket.y - 53;
const lip = () => { const lx = -37, ly = -30, s = Math.sin(tilt), co = Math.cos(tilt); return { x: bucket.x + lx * co - ly * s, y: bucket.y + lx * s + ly * co } };

// ---- input ----
c.addEventListener('pointerdown', e => {
  const w = toWorld(e); mouse = w;
  if (phase === 'plant' && onMound(w)) { holding = true; c.setPointerCapture(e.pointerId) }
  else if (phase === 'water' && lower > .5 && onBucket(w)) {
    drag = true; hooked = false; off = { x: w.x - bucket.x, y: w.y - bucket.y }; c.setPointerCapture(e.pointerId);
  }
  wakeMove(e, w);
});
c.addEventListener('pointermove', e => {
  const w = toWorld(e); mouse = w;
  if (holding && !onMound(w)) holding = false;
  if (drag) { bucket.x = clamp(w.x - off.x, -halfW() + 50, halfW() - 50); bucket.y = clamp(w.y - off.y, topY() + 60, -120) }
  c.style.cursor = phase === 'plant' ? (onMound(w) ? 'pointer' : 'default')
    : phase === 'water' ? (drag ? 'grabbing' : onBucket(w) ? 'grab' : 'default') : 'default';
  wakeMove(e, w);
});
const up = () => { holding = false; drag = false };
c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
c.addEventListener('pointerleave', () => { lastA = null; inside = false });

// Study 03: slow circling around the flower opens it; too fast startles it shut a little.
function wakeMove(e, w) {
  if (phase !== 'wake' || bud < 1) return;
  const dx = w.x, dy = w.y - FY, r = Math.hypot(dx, dy), now = performance.now() / 1000;
  if (r < 30 || r > 260) { lastA = null; inside = false; return }
  if (!inside) { inside = true; twitch = 1 }
  near = 1; trail.push({ x: w.x, y: w.y, l: 1 });
  const a = Math.atan2(dy, dx);
  if (lastA !== null) {
    let d = a - lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
    const sp = Math.abs(d) / Math.max(.008, now - lastT);
    if (sp > S.wake.shyLimit) { shy = 1; open = Math.max(0, open - 0.035) }
    else open = Math.min(1, open + Math.abs(d) / (2 * Math.PI) * S.wake.openRate);
  }
  lastA = a; lastT = now;
}

// ---- drawing helpers ----
const j = (n, a = 1.5) => (rnd(n + boil * 7) - .5) * a * 2;   // "boil" jitter for shaky ink

function drawSeed() {
  const top = surf(0) - 10, bot = 30, sy = top + (bot - top) * ease(p);
  const jx = shake * (Math.random() - .5) * 3;
  const rot = lerp(1.35, -.25, Math.min(1, p * 3)) + Math.sin(t * 1.7) * .04;   // lying on its side, tips upright as it is pushed
  x.save(); x.translate(jx, sy); x.rotate(rot);
  x.fillStyle = C['--seed']; x.strokeStyle = C['--ink']; x.lineWidth = LW(2.5);
  x.beginPath(); x.ellipse(0, 0, 10 + (rnd(boil) - .5), 16 + (rnd(boil + 3) - .5), 0, 0, 7); x.fill(); x.stroke();
  x.lineWidth = LW(1.2); x.beginPath(); x.moveTo(-1, -12); x.quadraticCurveTo(4 + (rnd(boil + 5) - .5) * 2, 0, -1, 12); x.stroke();
  x.restore();
}

function drawSoil() {
  const L = -halfW() - 10, R = halfW() + 10, B = botY() + 10;
  x.beginPath(); x.moveTo(L, B);
  for (let X = L; X <= R; X += 8) x.lineTo(X, surf(X) + (rnd(X * .1 + boil) - .5) * 2.2);
  x.lineTo(R, B); x.closePath();
  x.fillStyle = C['--soil']; x.fill(); x.strokeStyle = C['--ink']; x.lineWidth = LW(2.5); x.stroke();
  for (const s of speck) if (s.y > surf(s.x) + 4) { x.fillStyle = s.l ? C['--soil-hi'] : C['--ink']; x.fillRect(s.x, s.y, s.s, s.s) }
  x.strokeStyle = C['--ink']; x.globalAlpha = .5; x.lineWidth = LW(1); x.beginPath();
  for (let n = 0; n < 9; n++) { const X = -70 + n * 17, y0 = surf(X) + 8; x.moveTo(X + (rnd(n + boil) - .5) * 2, y0); x.lineTo(X - 8, y0 + 14) }
  x.stroke(); x.globalAlpha = 1;
  if (wet > 0) { x.fillStyle = C['--wet']; x.globalAlpha = Math.min(.9, wet); x.beginPath(); x.ellipse(0, surf(0) + 12, 50 + wet * 35, 10 + wet * 7, 0, 0, 7); x.fill(); x.globalAlpha = 1 }
}

// Study 01's soil eye: opens, blinks once, sinks shut.
function drawSoilEye() {
  const ey = surf(0) + 26, e = eye;
  const s = e < .6 ? e / .6 : e < 1.4 ? 1 : e < 1.6 ? 1 - (e - 1.4) / .2 : e < 1.8 ? (e - 1.6) / .2 : e < 3 ? 1 : Math.max(0, 1 - (e - 3) / .8);
  x.globalAlpha = 1 - settle; x.strokeStyle = C['--ink']; x.lineWidth = LW(2);
  if (s > .03) {
    x.save(); x.beginPath(); x.ellipse(0, ey, 18, 10 * s, 0, 0, 7); x.clip(); x.fillStyle = C['--sclera']; x.fillRect(-20, ey - 12, 40, 24);
    x.fillStyle = C['--ink']; x.beginPath(); x.arc(0, ey, 5.5, 0, 7); x.fill(); x.restore();
    x.beginPath(); x.ellipse(0, ey, 18, 10 * s, 0, 0, 7); x.stroke();
  } else { x.beginPath(); x.moveTo(-18, ey); x.quadraticCurveTo(0, ey + 4, 18, ey); x.stroke() }
  x.globalAlpha = 1;
}

function drawRope() {
  const y0 = topY() - 5, y1 = ropeEnd;
  if (y1 <= y0 + 2) return;
  x.strokeStyle = C['--ink']; x.lineWidth = LW(3); x.beginPath(); x.moveTo(ropeX, y0);
  for (let y = y0; y < y1; y += 18) x.lineTo(ropeX + j(y * .3, 1), y);
  x.lineTo(ropeX, y1); x.stroke();
  x.strokeStyle = C['--can-hi']; x.lineWidth = LW(1); x.beginPath(); x.moveTo(ropeX + 1, y0); x.lineTo(ropeX + 1, y1); x.stroke();
  // hook
  x.strokeStyle = C['--ink']; x.lineWidth = LW(2.5); x.beginPath(); x.arc(ropeX + 5, y1 + 4, 6, Math.PI, Math.PI * .1, true); x.stroke();
}

function drawBucket() {
  x.save(); x.translate(bucket.x, bucket.y); x.rotate(tilt);
  x.strokeStyle = C['--ink']; x.lineWidth = LW(2.5); x.lineJoin = 'round';
  // handle (bail), drawn first so the body sits in front of its lower ends
  x.lineWidth = LW(6); x.beginPath(); x.moveTo(-35, -26); x.quadraticCurveTo(j(30, 2), -80, 35, -26); x.stroke();
  x.lineWidth = LW(3); x.strokeStyle = C['--can']; x.beginPath(); x.moveTo(-35, -26); x.quadraticCurveTo(j(30, 2), -80, 35, -26); x.stroke();
  x.strokeStyle = C['--ink']; x.lineWidth = LW(2.5); x.fillStyle = C['--can'];
  // body
  x.beginPath(); x.moveTo(-36 + j(1), -30); x.lineTo(36 + j(2), -30); x.lineTo(27 + j(3), 32); x.lineTo(-27 + j(4), 32); x.closePath(); x.fill(); x.stroke();
  x.lineWidth = LW(1.5); x.beginPath(); x.moveTo(-34, -14 + j(5, 1)); x.lineTo(34, -14 + j(6, 1)); x.moveTo(-30, 17 + j(7, 1)); x.lineTo(30, 17 + j(8, 1)); x.stroke();
  x.fillStyle = C['--can-hi']; x.globalAlpha = .6; x.fillRect(-26, -24, 7, 50); x.globalAlpha = 1;
  // rim with dark water inside
  x.lineWidth = LW(2.5); x.fillStyle = C['--can-hi']; x.beginPath(); x.ellipse(0, -30, 37, 7, 0, 0, 7); x.fill(); x.stroke();
  x.fillStyle = water < 1 ? C['--wet'] : C['--ink']; x.beginPath(); x.ellipse(0, -29, 31, 4.5, 0, 0, 7); x.fill();
  x.fillStyle = C['--ink']; for (const [a, b] of [[-33, -24], [33, -24], [-29, 26], [27, 26]]) { x.beginPath(); x.arc(a, b, 1.8, 0, 7); x.fill() }
  x.globalAlpha = .5; x.lineWidth = LW(1); x.beginPath(); for (let n = 0; n < 6; n++) { x.moveTo(4 + n * 4, 20 + j(9 + n)); x.lineTo(n * 4, 30) } x.stroke(); x.globalAlpha = 1;
  x.restore();
}

// one stem for sprout and flower: Study 02's double-stroked crooked Bézier, ending at the tip or the flower head
function stemPath(base, c1x, c1y, c2x, c2y, tx, ty) { x.beginPath(); x.moveTo(0, base); x.bezierCurveTo(c1x, c1y, c2x, c2y, tx, ty) }
const bez = (a, b, cc, d, s) => (1 - s) ** 3 * a + 3 * (1 - s) ** 2 * s * b + 3 * (1 - s) * s * s * cc + s ** 3 * d;

function petal(L, w, seed, fill) {   // Study 03
  const jj = n => (rnd(seed * 13 + n + boil * 7) - .5) * Math.max(2, w * .12);
  x.beginPath(); x.moveTo(0, 0);
  x.bezierCurveTo(-w * .95 + jj(1), -L * .2 + jj(2), -w * .55 + jj(3), -L * .85 + jj(4), jj(5), -L);
  x.bezierCurveTo(w * .55 + jj(6), -L * .85 + jj(7), w * .95 + jj(8), -L * .2 + jj(9), 0, 0);
  x.fillStyle = fill; x.fill(); x.strokeStyle = C['--ink']; x.lineWidth = LW(2); x.stroke();
  x.lineWidth = LW(1); x.globalAlpha = .55; x.beginPath();
  for (let n = 0; n < 5; n++) { const sx = (n - 2) * w * .18; x.moveTo(sx + jj(10 + n), -L * .06); x.lineTo(sx * .6 + jj(20 + n), -L * (.3 + rnd(seed + n) * .15)) }
  x.stroke(); x.globalAlpha = 1;
}

function drawPlant() {
  const gr = Math.min(1, shown), h = 10 + gr * S.water.sproutHeight, base = surf(0) + 2;
  const b = easeOut(Math.min(1, bud));
  const o = easeOut(Math.max(0, fshown - shy * .25));
  // sprout tip (Study 02), and where the flower head sits (Study 03); the bud moves the end of the stem from one to the other
  const sway = Math.sin(t * 1.1) * (phase === 'water' ? 4 : 2);
  const tipX = sway + look * 40, tipY = base - h;
  const jit = (shy + twitch * .6) * (Math.random() - .5) * 6, fsway = Math.sin(t * .9) * (3 + o * 3);
  const headX = lerp(46, 0, o) + fsway + jit, headY = lerp(FY + 70, FY, o);
  const ex = lerp(tipX, headX, b), ey = lerp(tipY, headY, b);
  const c1x = 30 * gr, c1y = base - h * .35, c2x = lerp(-34 * gr, -10, o), c2y = lerp(base - h * .7, (base + FY) / 2, o * b);
  x.lineCap = 'round';
  x.strokeStyle = C['--ink']; x.lineWidth = LW(7); stemPath(base, c1x, c1y, c2x, c2y, ex, ey); x.stroke();
  x.strokeStyle = C['--stem']; x.lineWidth = LW(3.5); stemPath(base, c1x, c1y, c2x, c2y, ex, ey); x.stroke();
  // thorns grow in with the bud (Study 03)
  if (b > 0) {
    x.strokeStyle = C['--ink']; x.lineWidth = LW(2);
    for (let n = 1; n < 5; n++) {
      const s = .25 + n * .13, px = bez(0, c1x, c2x, ex, s), py = bez(base, c1y, c2y, ey, s), d = n % 2 ? 1 : -1;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + d * 9 * b, py - 6 * b); x.stroke();
    }
  }
  // curled tip unwinds with growth, then folds away into the bud
  const curl = gr > .3 ? (gr - .3) / .7 * (1 - b) : 0;
  if (curl > .02) {
    x.strokeStyle = C['--ink']; x.lineWidth = LW(2.5); x.beginPath();
    for (let s = 0; s <= 1; s += .05) { const a = s * Math.PI * 2.2 * curl, r = 14 * curl * (1 - s * .7), px = ex + (look >= 0 ? 1 : -1) * (Math.sin(a) * r), py = ey - Math.cos(a) * r + r; s ? x.lineTo(px, py) : x.moveTo(px, py) }
    x.stroke();
  }
  // leaves, attached along the stem
  const leaf = Math.max(0, (gr - .2) / .8);
  if (leaf > 0) for (const [s, yy] of [[-1, .3], [1, .45]]) {
    const lx = bez(0, c1x, c2x, ex, yy), ly = bez(base, c1y, c2y, ey, yy);
    x.save(); x.translate(lx, ly); x.rotate(s * (1.6 - leaf * .7) + Math.sin(t + s) * .05);
    x.beginPath(); x.moveTo(0, 0);
    x.bezierCurveTo(-11 * leaf + j(20 + s), -10 * leaf, -8 * leaf, -28 * leaf, j(22 + s), -34 * leaf);
    x.bezierCurveTo(8 * leaf, -28 * leaf, 11 * leaf + j(24 + s), -10 * leaf, 0, 0);
    x.fillStyle = C['--leaf']; x.fill(); x.strokeStyle = C['--ink']; x.lineWidth = LW(2); x.stroke();
    x.lineWidth = LW(1); x.beginPath(); x.moveTo(0, -2); x.lineTo(0, -30 * leaf); x.stroke(); x.restore();
  }
  if (b <= 0) return;
  // flower head (Study 03): hangs down asleep, lifts and opens as it wakes
  const rot = lerp(2.5, 0, o) + Math.sin(t * 1.3) * .04 + shy * (Math.random() - .5) * .3, sc = lerp(.9, S.wake.bloomSize, o) * b;
  x.save(); x.translate(ex, ey); x.rotate(rot); x.scale(sc, sc);
  const N = Math.round(S.wake.petalCount), spread = lerp(.1, Math.PI * 2 / N, o), L = lerp(46, 82, o), w = lerp(16, 30, o);
  x.globalAlpha = 1 - o * .7; for (const s of [-1, 0, 1]) { x.save(); x.rotate(s * .5 + Math.PI); petal(22, 8, 40 + s, C['--stem']); x.restore() } x.globalAlpha = 1;
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < N; i++) {
    const back = i % 2 === 0; if ((pass === 0) !== back) continue;
    const a = (i - (N - 1) / 2) * spread + Math.sin(t * .7 + i) * .03 * o;
    x.save(); x.rotate(a); petal(L * (back ? 1.05 : .95), w, i, back ? C['--petal-back'] : (i % 3 ? C['--petal'] : C['--petal-hi'])); x.restore();
  }
  x.restore();
  // the eye in the middle; follows the pointer, blinks once awake
  if (o > .45) {
    const s = (o - .45) / .55, er = 17 * sc * s;
    const lid = Math.max(0, (shy > .3 ? 0 : 1) * s * (1 - Math.sin(blink * Math.PI)));
    x.save(); x.translate(ex, ey);
    x.fillStyle = C['--ink']; x.beginPath(); x.ellipse(0, 0, er + 5, er * .75 + 5, 0, 0, 7); x.fill();
    if (lid > .03) {
      x.save(); x.beginPath(); x.ellipse(0, 0, er, er * .7 * lid, 0, 0, 7); x.clip();
      x.fillStyle = C['--sclera']; x.fillRect(-er, -er, er * 2, er * 2);
      const ang = Math.atan2(mouse.y - ey, mouse.x - ex), dist = Math.min(er * .45, Math.hypot(mouse.x - ex, mouse.y - ey) * .05);
      const px = Math.cos(ang) * dist, py = Math.sin(ang) * dist;
      x.fillStyle = C['--iris']; x.beginPath(); x.arc(px, py, er * .55, 0, 7); x.fill();
      x.fillStyle = C['--ink']; x.beginPath(); x.arc(px, py, er * .28, 0, 7); x.fill();
      x.fillStyle = C['--sclera']; x.beginPath(); x.arc(px - er * .12, py - er * .14, er * .08, 0, 7); x.fill();
      x.restore();
    }
    x.strokeStyle = C['--ink']; x.lineWidth = LW(2); x.beginPath(); x.ellipse(0, 0, er, er * .7 * Math.max(lid, .04), 0, 0, 7); x.stroke();
    x.restore();
  }
  if (phase === 'awake' && Math.random() < dtNow * 4) dust.push({ x: ex + (Math.random() - .5) * 60, y: ey, vx: (Math.random() - .5) * 20, vy: -10 - Math.random() * 20, l: 3 });
}

// ---- main loop ----
let last = performance.now(), gt = 0, bt = 0, dtNow = 0;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); dtNow = dt; last = now; t += dt; phaseT += dt; gt += dt; bt += dt;
  cx = document.body.classList.contains('panel-on') && W > 760 ? 310 + (W - 310) / 2 : W / 2;   // keep the garden clear of the tool panel
  if (gt > .09) { grain(); gt = 0 } if (bt > S.mood.inkWobble) { boil++; bt = 0 }
  syncColors();

  // 1. plant
  if (phase === 'plant') {
    if (holding) {
      p = Math.min(1, p + dt * S.plant.pushSpeed); shake = 1;
      for (let i = 0; i < 3; i++) { const sd = Math.random() < .5 ? -1 : 1, X = sd * (25 + Math.random() * 75); grains.push({ x: X, y: surf(X) - 2, vx: -sd * (20 + Math.random() * 40), vy: -Math.random() * 20, l: 1 }) }
    } else if (p > 0) p = Math.max(0, p - dt * S.plant.creepBack);   // let go early: the seed creeps back up
    if (p >= 1) { holding = false; eye = .001; go('planted') }
    setHint(p < .02 && !holding && phaseT > 2.5 ? 'press and hold the soil' : '');
  } else if (phase === 'planted') {
    eye += dt; if (eye > 3.8) settle = Math.min(1, (eye - 3.8) / 1.4);
    if (eye > 5.4) { go('water'); bucket = { x: hangX(), y: topY() - 120 }; ropeX = hangX() }
  }
  shake *= Math.pow(.01, dt);

  // 2. water
  if (phase === 'water' || phase === 'grown') {
    if (phase === 'water' && hooked) {   // lowering on the rope, then swaying gently
      lower = Math.min(1, lower + dt / 2.4);
      ropeX = hangX() + Math.sin(t * 1.2) * 5 * lower;
      bucket.x = ropeX; bucket.y = lerp(topY() - 120, hangY(), easeOut(lower)) + Math.sin(t * 2) * 1.5 * lower;
      ropeEnd = handleY();
      tilt = Math.sin(t * 1.2 + .6) * .03 * lower;
    } else if (phase === 'water' || drag) {   // unhooked: the rope pulls back up
      ropeEnd += (topY() - 5 - ropeEnd) * Math.min(1, dt * 3);
      tilt += ((drag ? -S.water.tiltAngle : 0) - tilt) * Math.min(1, dt * 5);
    }
    if (drag && tilt < -S.water.tiltAngle * .64) { const q = lip(); for (let i = 0; i < 3; i++) drops.push({ x: q.x + (Math.random() - .5) * 12, y: q.y, vx: -40 - Math.random() * 30, vy: 20 + Math.random() * 20 }) }
    if (phase === 'water') setHint(!drag && water < .02 && lower >= 1 && phaseT > 4 ? 'drag the bucket and pour' : '');
    if (phase === 'water' && water >= 1) { go('grown'); setHint('') }
    if (phase === 'grown' && !drag && !gone) {   // the rope comes back down for the bucket and hauls it away
      tilt += (0 - tilt) * Math.min(1, dt * 4);
      ropeX += (bucket.x - ropeX) * Math.min(1, dt * 8);
      if (!hooked) { ropeEnd += (handleY() - ropeEnd) * Math.min(1, dt * 3); if (Math.abs(ropeEnd - handleY()) < 4) hooked = true }
      else { bucket.y -= dt * 180; bucket.x += (hangX() - bucket.x) * Math.min(1, dt * 1.5); ropeX = bucket.x; ropeEnd = handleY(); if (bucket.y < topY() - 140) gone = true }
    }
    if (phase === 'grown' && gone && phaseT > 1.5) go('wake');
  }
  shown += (water - shown) * Math.min(1, dt * 3);
  const tipTurn = phase === 'grown' ? clamp(mouse.x / 200, -1, 1) : 0;   // fully watered: the tip turns toward you
  look += (tipTurn - look) * Math.min(1, dt * 3);
  if (!drag) wet = Math.max(water * .55, wet - dt * .05);
  squish *= Math.pow(.02, dt);

  // 3. wake
  if (phase === 'wake' || phase === 'awake') {
    bud = Math.min(1, bud + dt / 1.6);
    fshown += (open - fshown) * Math.min(1, dt * 2.2);
    if (phase === 'wake' && open >= 1) {
      go('awake'); setHint('');
      const hy = FY; for (let i = 0; i < 40; i++) dust.push({ x: 0, y: hy, vx: (Math.random() - .5) * 120, vy: -Math.random() * 80, l: 2 + Math.random() * 2 });
    }
    if (phase === 'wake') setHint(bud >= 1 && open < .02 && phaseT > 3.5 ? 'circle slowly around the bud' : '');
    if (phase === 'awake') { nextBlink -= dt; if (nextBlink < 0) { blink = 1; nextBlink = 2.5 + Math.random() * 3 } }
    blink = Math.max(0, blink - dt * 5);
  }
  // title card at the start; a closing line once the flower has been awake a while
  const titleOn = phase === 'plant' && t > .4 && t < 5.5 && !holding && p < .02;
  const endOn = phase === 'awake' && phaseT > 2.5;
  if (endOn && cardEl.dataset.mode !== 'end') { cardEl.dataset.mode = 'end'; cardTitle.textContent = 'the garden is awake'; cardSub.textContent = '↺  plant another' }
  if (!endOn && phase !== 'awake' && cardEl.dataset.mode !== 'start') { cardEl.dataset.mode = 'start'; cardTitle.textContent = 'The Enchanted Garden'; cardSub.textContent = 'something is waiting in the soil' }
  cardEl.classList.toggle('on', titleOn || endOn); cardEl.classList.toggle('end', cardEl.dataset.mode === 'end');
  resetEl.classList.toggle('call', endOn);
  shy *= Math.pow(.04, dt); near *= Math.pow(.2, dt); twitch *= Math.pow(.01, dt);

  // ---- draw ----
  screen(); x.fillStyle = C['--bg']; x.fillRect(0, 0, W, H);
  // one warm lamp somewhere above the garden
  if (S.mood.lampGlow > 0) {
    const ly = gy - 230 * k, lr = Math.max(W, H) * .6, lg = x.createRadialGradient(cx, ly, 0, cx, ly, lr);
    lg.addColorStop(0, rgba(C['--lamp'], S.mood.lampGlow * .55)); lg.addColorStop(.35, rgba(C['--lamp'], S.mood.lampGlow * .18)); lg.addColorStop(1, rgba(C['--lamp'], 0));
    x.fillStyle = lg; x.fillRect(0, 0, W, H);
  }
  world();
  // Study 03's guide ring and ink-speck trail
  if (phase === 'wake' && near > .02) { x.strokeStyle = C['--dust']; x.globalAlpha = near * .3; x.lineWidth = LW(1); x.setLineDash([2, 7]); x.beginPath(); x.arc(0, FY, 130 + (rnd(boil) - .5) * 3, 0, 7); x.stroke(); x.setLineDash([]); x.globalAlpha = 1 }
  x.fillStyle = C['--dust']; trail = trail.filter(q => { q.l -= dt * 1.4; x.globalAlpha = Math.max(0, q.l) * .4; x.fillRect(q.x, q.y, 2, 2); return q.l > 0 }); x.globalAlpha = 1;
  if (phase === 'plant' || phase === 'planted') drawSeed();   // drawn first so the soil covers it once buried
  if (phase !== 'plant' && phase !== 'planted') drawPlant();
  drawSoil();
  // the press dent
  if (holding) { x.strokeStyle = C['--ink']; x.lineWidth = LW(2); x.beginPath(); x.ellipse(0, surf(0) + 5, 28 - p * 12, 5, 0, 0, Math.PI); x.stroke() }
  x.fillStyle = C['--grain'];
  grains = grains.filter(q => { q.vy += 300 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.l -= dt * 1.4; if (q.y > surf(q.x) + 3 || q.l <= 0) return false; x.fillRect(q.x, q.y, 2.5, 2.5); return true });
  if (phase === 'planted') drawSoilEye();
  // bubbles: the soil drinking
  x.strokeStyle = C['--drop']; x.lineWidth = LW(1);
  bubbles = bubbles.filter(q => { q.l -= dt; q.r += dt * 4; x.globalAlpha = Math.max(0, q.l) * .7; x.beginPath(); x.arc(q.x, q.y, q.r, 0, 7); x.stroke(); x.globalAlpha = 1; return q.l > 0 });
  // drops and splashes
  x.fillStyle = C['--drop'];
  drops = drops.filter(d => {
    d.vy += 520 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
    if (d.y >= surf(d.x)) {
      if (Math.abs(d.x) < 75) {
        if (phase === 'water') {
          water = Math.min(1, water + S.water.pourRate); wet = Math.min(1.2, wet + .008); squish = Math.min(5, squish + .3);
          if (Math.random() < .15) bubbles.push({ x: (Math.random() - .5) * 90, y: surf(0) + 10 + Math.random() * 10, r: 1.5, l: .8 });
        }
      } else for (let i = 0; i < 3; i++) splash.push({ x: d.x, y: surf(d.x), vx: (Math.random() - .5) * 90, vy: -60 - Math.random() * 60, l: .4 });
      return false;
    }
    x.beginPath(); x.ellipse(d.x, d.y, 2, 3.5, 0, 0, 7); x.fill(); return d.y < botY();
  });
  splash = splash.filter(s => { s.vy += 500 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.l -= dt; x.globalAlpha = Math.max(0, s.l * 2.5); x.fillRect(s.x, s.y, 2, 2); x.globalAlpha = 1; return s.l > 0 });
  if ((phase === 'water' || phase === 'grown') && !gone) { drawRope(); drawBucket() }
  // dust after waking
  x.fillStyle = C['--dust'];
  dust = dust.filter(q => { q.l -= dt; q.vy -= 8 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .98; x.globalAlpha = Math.max(0, Math.min(1, q.l)) * .5; x.fillRect(q.x, q.y, 2, 2); return q.l > 0 });
  x.globalAlpha = 1;
  // vignette + grain
  screen();
  const vg = x.createRadialGradient(W / 2, H * .5, Math.min(W, H) * .2, W / 2, H * .5, Math.max(W, H) * .75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${S.mood.vignette})`); x.fillStyle = vg; x.fillRect(0, 0, W, H);
  x.globalAlpha = S.mood.filmGrain; x.fillStyle = x.createPattern(g, 'repeat'); x.fillRect(0, 0, W, H); x.globalAlpha = 1;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
