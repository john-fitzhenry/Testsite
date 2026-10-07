/* ============================================================================
 * MOTION REEL ’26
 * A 15-second, 128 BPM motion-graphics showreel drawn entirely in Canvas 2D.
 *
 * Every pixel is a pure function of time, so the same code can
 *   • play live in a browser (open reel/index.html), or
 *   • be rendered offline frame-by-frame with true sub-frame motion blur
 *     (tools/render.js drives window.REEL.renderFrame()).
 *
 * Time is expressed in beats: 1 beat = 60/128 s, 32 beats = 15 s, 8 scenes of
 * one bar each. Scenes hand off to each other with match cuts — every ending
 * is the next beginning.
 * ========================================================================== */
(() => {
'use strict';

const W = 1920, H = 1080, CX = W / 2, CY = H / 2;
const BPM = 128, BEAT = 60 / BPM, BEATS = 32, DURATION = BEATS * BEAT;
const FPS = 60, TAU = Math.PI * 2;

/* ---------------------------------------------------------------- palette */
const HEX = { ink: '#0B0B0D', paper: '#F3EFE6', orange: '#FF4F1A', cobalt: '#2A44FF', lime: '#D4FF3A' };
const RGB = Object.fromEntries(Object.entries(HEX).map(([k, h]) => [k, [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))]));
const rgba = (c, a = 1) => { const v = RGB[c]; return `rgba(${v[0]},${v[1]},${v[2]},${a})`; };
const mix = (c1, c2, t, a = 1) => {
  const A = RGB[c1], B = RGB[c2];
  return `rgba(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)},${a})`;
};

/* ------------------------------------------------------------------- math */
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (x, a, b) => clamp((x - a) / (b - a));
const frac = x => x - Math.floor(x);
const ease = {
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inCubic: t => t * t * t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: t => 1 - Math.pow(1 - t, 4),
  inQuart: t => t * t * t * t,
  outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: t => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inBack: t => { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
  inOutBack: t => {
    const c2 = 1.70158 * 1.525;
    return t < 0.5 ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
                   : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  outBounce: t => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};
/* damped-spring step response; dt in beats, freq in cycles per beat */
function spring(dt, freq = 2, zeta = 0.4) {
  if (dt <= 0) return 0;
  const w = TAU * freq, wd = w * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w * dt) * (Math.cos(wd * dt) + (zeta * w / wd) * Math.sin(wd * dt));
}
/* kick-drum envelope: 1 on every downbeat, decaying */
const kick = (b, k = 6) => Math.exp(-frac(b) * k);
function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (x, y = 0) => frac(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
const noise1 = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); };

/* ------------------------------------------------------------------- text */
const DISPLAY = 'Archivo', MONO = '"JetBrains Mono", monospace';
let CAP = 0.72;            // cap-height / em, measured once fonts are loaded
let I_W = 160, I_H = 520;  // ink box of the giant "I"
const I_SIZE = 720;
const layoutCache = new Map();
function layout(ctx, str, size, weight = 900, tracking = 0) {
  const key = `${str}|${size}|${weight}|${tracking}`;
  let L = layoutCache.get(key);
  if (L) return L;
  ctx.save();
  ctx.font = `${weight} ${size}px ${DISPLAY}`;
  ctx.letterSpacing = '0px';
  const xs = [], ws = [];
  for (let i = 0; i < str.length; i++) {
    xs.push(ctx.measureText(str.slice(0, i)).width + tracking * i);
    ws.push(ctx.measureText(str[i]).width);
  }
  L = { xs, ws, width: ctx.measureText(str).width + tracking * (str.length - 1) };
  ctx.restore();
  layoutCache.set(key, L);
  return L;
}
function measureMetrics(ctx) {
  ctx.save();
  ctx.font = `900 1000px ${DISPLAY}`;
  CAP = ctx.measureText('H').actualBoundingBoxAscent / 1000;
  ctx.font = `900 ${I_SIZE}px ${DISPLAY}`;
  const m = ctx.measureText('I');
  I_W = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  I_H = m.actualBoundingBoxAscent;
  ctx.restore();
}
function mono(ctx, str, x, y, size, color, { weight = 500, align = 'left', spacing = 0, alpha = 1 } = {}) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${MONO}`;
  ctx.letterSpacing = `${spacing}px`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.fillText(str, align === 'center' ? x + spacing / 2 : x, y);
  ctx.restore();
}

/* ---------------------------------------------------------------- drawing */
function bg(ctx, c) { ctx.fillStyle = HEX[c] || c; ctx.fillRect(-2, -2, W + 4, H + 4); }
function circle(ctx, x, y, r, fill) { if (r <= 0) return; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill(); }
function superellipse(ctx, x, y, a, b, n, seg = 120) {
  ctx.beginPath();
  for (let i = 0; i < seg; i++) {
    const t = (i / seg) * TAU, c = Math.cos(t), s = Math.sin(t);
    ctx.lineTo(x + a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), y + b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n));
  }
  ctx.closePath();
}
function withTransform(ctx, x, y, rot, sx, sy, fn) {
  ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx, sy); fn(); ctx.restore();
}

/* "frame beat": discrete choices (hard cuts) follow the frame's own time,
 * so motion-blur sub-samples never straddle a cut. */
let FB = 0;

/* ============================================================== 01 PHYSICS
 * A ball drops, obeys gravity (e = 0.5, every bounce halves on the beat
 * grid: 1, 1.5, 1.75, 1.875 …), squashes & stretches, then crouches and
 * launches itself into the stem of a giant letter I. */
const FLOOR = 720, BALL_R = 44, GRAV = 4160, DROP_H = 520;
const LANDS = (() => {
  const a = [{ t: 1, v: GRAV * 0.5 }];
  let t = 1, d = 0.5;
  while (d > 0.02) { t += d; a.push({ t, v: (GRAV * d) / 2 }); d /= 2; }
  return a;
})();
function ballState(b) {
  if (b < 0.5) return { h: DROP_H, v: 0 };
  if (b < 1) { const s = b - 0.5; return { h: DROP_H - 0.5 * GRAV * s * s, v: -GRAV * s }; }
  for (let k = 0; k < LANDS.length - 1; k++) {
    const t0 = LANDS[k].t, t1 = LANDS[k + 1].t;
    if (b < t1) { const d = t1 - t0, s = b - t0, v0 = (GRAV * d) / 2; return { h: v0 * s - 0.5 * GRAV * s * s, v: v0 - GRAV * s }; }
  }
  return { h: 0, v: 0 };
}
function ballSquash(b) {
  let s = 0;
  for (const L of LANDS) {
    const x = b - L.t;
    if (x >= 0 && x < 0.3) s += 0.5 * (L.v / 2080) * Math.exp(-x / 0.045) * Math.cos(x * 28);
  }
  return clamp(s, -0.15, 0.5);
}
/* ball → I : returns superellipse params (centre, half extents, exponent) */
function ballShape(b) {
  const pop = b < 0.4 ? ease.outBack(prog(b, 0.06, 0.3)) : 1;
  const { h, v } = ballState(b);
  let sq = ballSquash(b);
  let st = clamp((Math.abs(v) / GRAV) * 0.55, 0, 0.45) * clamp(h / 30);
  sq += 0.14 * Math.sin(Math.PI * prog(b, 0.32, 0.5));          // anticipation before the drop
  if (b > 2 && b < 2.6) sq += 0.035 * Math.sin(TAU * 2 * (b - 2)); // idle breath
  sq += 0.4 * ease.inOutCubic(prog(b, 2.6, 3.2));                  // crouch
  const sy = (1 + st) * (1 - sq), sx = 1 / sy;
  let a = BALL_R * pop * sx, c = BALL_R * pop * sy, y = FLOOR - h - c, n = 2;
  if (b >= 3.2) {
    const m = spring(b - 3.2, 1.7, 0.42);
    a = lerp(a, I_W / 2, m);
    c = lerp(c, I_H / 2, m);
    y = lerp(y, CY, m);
    n = lerp(2, 60, ease.inQuad(prog(b, 3.2, 3.9)));
  }
  return { x: CX, y, a, c, n };
}
function graphPanel(ctx, b, alpha) {
  if (alpha <= 0) return;
  const x0 = 1430, y0 = 770, w = 400, h = 150, span = 2.4;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = rgba('paper', 0.18); ctx.lineWidth = 1.5;
  ctx.strokeRect(x0, y0, w, h);
  ctx.setLineDash([3, 6]);
  for (let k = 1; k < 5; k++) { const x = x0 + (k * 0.5 / span) * w; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + h); ctx.stroke(); }
  ctx.setLineDash([]);
  mono(ctx, 'GRAPH EDITOR — POSITION Y', x0, y0 - 14, 13, rgba('paper', 0.7), { spacing: 1.5 });
  mono(ctx, 'e = 0.50', x0 + w, y0 - 14, 13, HEX.orange, { align: 'right', spacing: 1.5 });
  const end = Math.min(b, span);
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const bb = (i / 200) * end, s = ballState(bb);
    ctx.lineTo(x0 + (bb / span) * w, y0 + h - 10 - (s.h / DROP_H) * (h - 24));
  }
  ctx.strokeStyle = HEX.orange; ctx.lineWidth = 2.5; ctx.stroke();
  for (const L of LANDS) {
    if (L.t > end || L.t > span) continue;
    withTransform(ctx, x0 + (L.t / span) * w, y0 + h - 10, Math.PI / 4, 1, 1, () => { ctx.fillStyle = HEX.paper; ctx.fillRect(-4.5, -4.5, 9, 9); });
  }
  const px = x0 + (end / span) * w;
  ctx.fillStyle = HEX.orange; ctx.fillRect(px - 1, y0 - 4, 2, h + 8);
  ctx.restore();
}
function scenePhysics(ctx, b) {
  bg(ctx, 'ink');
  // floor: draws on, deflects on impact, retracts on launch
  const half = 1060 * ease.outExpo(prog(b, 0.3, 0.85)) * (1 - ease.inOutCubic(prog(b, 3.15, 3.55)));
  const sq = ballSquash(b);
  if (half > 1) {
    const dip = Math.max(0, sq) * 34;
    ctx.beginPath();
    ctx.moveTo(CX - half, FLOOR);
    ctx.lineTo(CX - Math.min(half, 260), FLOOR);
    ctx.quadraticCurveTo(CX, FLOOR + dip * 2, CX + Math.min(half, 260), FLOOR);
    ctx.lineTo(CX + half, FLOOR);
    ctx.strokeStyle = HEX.paper; ctx.lineWidth = 3; ctx.stroke();
    // ticks along the floor
    ctx.fillStyle = rgba('paper', 0.35);
    for (let x = -1000; x <= 1000; x += 80) if (Math.abs(x) < half - 10 && x !== 0) ctx.fillRect(CX + x - 1, FLOOR + 14, 2, 10);
  }
  // shock rings + dust at each landing
  LANDS.forEach((L, li) => {
    const x = b - L.t, k = L.v / 2080;
    if (x < 0 || x > 0.7 || k < 0.1) return;
    const p = x / 0.55;
    if (p < 1) {
      const rx = lerp(BALL_R, BALL_R + 340 * k, ease.outCubic(p));
      ctx.beginPath(); ctx.ellipse(CX, FLOOR, rx, rx * 0.16, 0, 0, TAU);
      ctx.strokeStyle = rgba('paper', (1 - p) * 0.8 * k); ctx.lineWidth = 2.5; ctx.stroke();
    }
    const r = rng(91 + li * 17), n = Math.round(16 * k) + 2;
    for (let i = 0; i < n; i++) {
      const dir = r() < 0.5 ? -1 : 1, sp = (260 + r() * 900) * k, ang = 0.2 + r() * 0.95, size = 2 + r() * 4;
      const px = CX + dir * (BALL_R * 0.9 + Math.cos(ang) * sp * x), py = FLOOR - Math.sin(ang) * sp * x + 2600 * x * x;
      if (py > FLOOR) continue;
      circle(ctx, px, py, size * (1 - x / 0.7 * 0.6), rgba('paper', (1 - x / 0.7) * 0.9));
    }
  });
  // the ball
  const s = ballShape(b);
  ctx.fillStyle = HEX.paper;
  if (s.n <= 2.001) { ctx.beginPath(); ctx.ellipse(s.x, s.y, Math.max(0, s.a), Math.max(0, s.c), 0, 0, TAU); ctx.fill(); }
  else { superellipse(ctx, s.x, s.y, s.a, s.c, s.n); ctx.fill(); }
  graphPanel(ctx, b, prog(b, 0.15, 0.4) * (1 - prog(b, 3.0, 3.4)));
}

/* ================================================================= 02 TYPE
 * I · MAKE · THINGS · MOVE — one word per beat, four typographic systems. */
function sceneType(ctx, b) {
  const w = Math.floor(clamp(FB, 4, 7.9999));
  b = clamp(b, w, w + 0.9999);
  if (w === 4) typeI(ctx, b);
  else if (w === 5) typeMake(ctx, b);
  else if (w === 6) typeThings(ctx, b);
  else typeMove(ctx, b);
}
function typeI(ctx, b) {
  bg(ctx, 'ink');
  const s = ballShape(b);
  const fall = ease.inQuad(prog(b, 4.5, 5.0)) * (Math.PI / 2);
  const px = s.x + s.a, py = s.y + s.c;
  ctx.save();
  ctx.translate(px, py); ctx.rotate(fall); ctx.translate(-px, -py);
  ctx.fillStyle = HEX.paper;
  superellipse(ctx, s.x, s.y, s.a, s.c, s.n); ctx.fill();
  ctx.restore();
  const cap = '← formerly a ball';
  const n = Math.floor(prog(b, 4.06, 4.4) * cap.length + 0.0001);
  if (n > 0) mono(ctx, cap.slice(0, n) + (n < cap.length ? '▍' : ''), CX + I_W / 2 + 44, CY + I_H / 2 - 6, 26, HEX.paper, { alpha: 1 - prog(b, 4.42, 4.58) });
}
function typeMake(ctx, b) {
  bg(ctx, 'orange');
  const S = 450, word = 'MAKE', base = CY + (CAP * S) / 2 - 20;
  const wts = [...word].map((_, i) => lerp(900, 160, ease.inOutCubic(prog(b, 5.42 + i * 0.06, 5.84 + i * 0.06))));
  ctx.save();
  const ws = wts.map((wt, i) => { ctx.font = `${wt} ${S}px ${DISPLAY}`; return ctx.measureText(word[i]).width; });
  const track = -4, total = ws.reduce((a, c) => a + c, 0) + track * (word.length - 1);
  let x = CX - total / 2;
  ctx.beginPath(); ctx.rect(0, 0, W, base + 6); ctx.clip();
  ctx.fillStyle = HEX.ink; ctx.textBaseline = 'alphabetic';
  for (let i = 0; i < word.length; i++) {
    const p = ease.outExpo(prog(b, 5 + i * 0.045, 5.42 + i * 0.045));
    ctx.font = `${wts[i]} ${S}px ${DISPLAY}`;
    ctx.fillText(word[i], x, base + (1 - p) * S * 0.95);
    x += ws[i] + track;
  }
  ctx.restore();
  // variable-font readout
  const a = prog(b, 5.2, 5.35), avg = wts.reduce((p, c) => p + c, 0) / wts.length;
  const ry = base + 92, rw = 360;
  ctx.globalAlpha = a;
  ctx.fillStyle = rgba('ink', 0.3); ctx.fillRect(CX - rw / 2, ry, rw, 3);
  const kx = CX - rw / 2 + ((avg - 100) / 800) * rw;
  ctx.fillStyle = HEX.ink; ctx.fillRect(CX - rw / 2, ry, kx - (CX - rw / 2), 3);
  circle(ctx, kx, ry + 1.5, 11, HEX.ink);
  mono(ctx, 'wght', CX - rw / 2, ry - 18, 20, HEX.ink, { weight: 800, spacing: 1 });
  mono(ctx, String(Math.round(avg)), CX + rw / 2, ry - 18, 20, HEX.ink, { weight: 800, align: 'right', spacing: 1 });
  ctx.globalAlpha = 1;
}
function typeThings(ctx, b) {
  bg(ctx, 'cobalt');
  const S = 400, word = 'THINGS', L = layout(ctx, word, S, 900, -6);
  const base = CY + (CAP * S) / 2 - 20, x0 = CX - L.width / 2, cy = base - (CAP * S) / 2;
  const ext = Math.round(30 * ease.outCubic(prog(b, 6.36, 6.85)));
  const letters = [...word].map((ch, i) => {
    const r = rng(300 + i * 13);
    const dx = (r() - 0.5) * 1500, dy = (r() - 0.5) * 900, rot = (r() - 0.5) * TAU * 0.7, s0 = 0.15 + r() * 0.4;
    const p = spring(b - 6 - i * 0.035, 2.3, 0.45);
    return { ch, x: x0 + L.xs[i] + L.ws[i] / 2 + lerp(dx, 0, p), y: cy + lerp(dy, 0, p), rot: lerp(rot, 0, p), s: Math.max(0, lerp(s0, 1, p)) };
  });
  ctx.font = `900 ${S}px ${DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  if (ext > 0) {
    ctx.fillStyle = '#1B2BB8';
    for (let k = ext; k >= 1; k--) for (const l of letters) withTransform(ctx, l.x + k * 2.6, l.y + k * 2.6, l.rot, l.s, l.s, () => ctx.fillText(l.ch, 0, (CAP * S) / 2));
  }
  ctx.fillStyle = HEX.paper;
  for (const l of letters) withTransform(ctx, l.x, l.y, l.rot, l.s, l.s, () => ctx.fillText(l.ch, 0, (CAP * S) / 2));
  ctx.textAlign = 'left';
}
function moveLayout(ctx) {
  const S = 450, L = layout(ctx, 'MOVE', S, 900, -6);
  const base = CY + (CAP * S) / 2 - 20, x0 = CX - L.width / 2;
  return { S, L, base, x0, ox: x0 + L.xs[1] + L.ws[1] / 2, oy: base - (CAP * S) / 2, or: L.ws[1] / 2 };
}
function typeMove(ctx, b) {
  bg(ctx, 'paper');
  const M = moveLayout(ctx), { S, L, base, x0 } = M;
  const zp = prog(b, 7.55, 8.0);
  const zmax = 80, z = Math.exp(Math.log(zmax) * ease.inCubic(zp));
  const q = (1 - 1 / z) / (1 - 1 / zmax);
  ctx.save();
  // zoom into the counter of the O
  ctx.translate(lerp(M.ox, CX, q), lerp(M.oy, CY, q)); ctx.scale(z, z); ctx.translate(-M.ox, -M.oy);
  ctx.font = `900 ${S}px ${DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = HEX.ink;
  for (let i = 0; i < 4; i++) {
    const p = prog(b, 7 + i * 0.055, 7.44 + i * 0.055);
    const dy = -(1 - ease.outBounce(p)) * 700;
    const bump = c => Math.exp(-Math.pow((p - c) / 0.035, 2));
    const sq = 0.28 * bump(0.3636) + 0.13 * bump(0.7272) + 0.05 * bump(0.909);
    const lx = x0 + L.xs[i] + L.ws[i] / 2;
    withTransform(ctx, lx, base + dy, 0, 1 + sq * 0.8, 1 - sq, () => ctx.fillText('MOVE'[i], 0, 0));
  }
  const ir = ease.outCubic(prog(b, 7.44, 7.6)) * (M.or + 6);
  circle(ctx, M.ox, M.oy, ir, HEX.ink);
  ctx.restore();
  ctx.textAlign = 'left';
  const r = 230 * ease.outBack(prog(b, 7.7, 8.0));
  circle(ctx, lerp(M.ox, CX, q), lerp(M.oy, CY, q), r, HEX.orange);
}

/* ================================================================ 03 MORPH
 * One closed path, 360 radial samples: circle → square → triangle → star →
 * square, sprung (the overshoot makes the shapes bulge), with time-echo
 * trails, orbiting satellites and sonar pulses. Ends as a 120px tile. */
const NP = 360;
const SH = (() => {
  const angles = Array.from({ length: NP }, (_, i) => -Math.PI / 2 + (i / NP) * TAU);
  const ray = (verts, a) => {
    const dx = Math.cos(a), dy = Math.sin(a);
    let best = Infinity;
    for (let i = 0; i < verts.length; i++) {
      const [x1, y1] = verts[i], [x2, y2] = verts[(i + 1) % verts.length];
      const ex = x2 - x1, ey = y2 - y1, det = ex * dy - dx * ey;
      if (Math.abs(det) < 1e-12) continue;
      const t = (ex * y1 - ey * x1) / det, u = (dx * y1 - dy * x1) / det;
      if (t > 0 && u >= -1e-9 && u <= 1 + 1e-9) best = Math.min(best, t);
    }
    return best;
  };
  const poly = verts => angles.map(a => ray(verts, a));
  const regular = (n, R, a0) => Array.from({ length: n }, (_, i) => [R * Math.cos(a0 + (i * TAU) / n), R * Math.sin(a0 + (i * TAU) / n)]);
  const star = Array.from({ length: 10 }, (_, i) => { const R = i % 2 ? 0.5 : 1.22, a = -Math.PI / 2 + (i * TAU) / 10; return [R * Math.cos(a), R * Math.sin(a)]; });
  return {
    angles,
    circle: angles.map(() => 1),
    square: poly(regular(4, 0.86 * Math.SQRT2, -Math.PI / 4)),
    triangle: poly(regular(3, 1.25, -Math.PI / 2)),
    star: poly(star),
  };
})();
const MORPH_KEYS = [
  { b: 8, s: 'circle', c: 'orange' },
  { b: 9, s: 'square', c: 'cobalt' },
  { b: 10, s: 'triangle', c: 'lime' },
  { b: 11, s: 'star', c: 'paper' },
  { b: 11.5, s: 'square', c: 'paper' },
];
function morphState(b) {
  let k = 0;
  for (let i = 1; i < MORPH_KEYS.length; i++) if (b >= MORPH_KEYS[i].b - 0.1) k = i;
  const cur = MORPH_KEYS[k], prev = MORPH_KEYS[Math.max(0, k - 1)];
  const m = k === 0 ? 1 : spring(b - (cur.b - 0.1), 2.4, 0.34);
  const colT = k === 0 ? 1 : clamp((b - (cur.b - 0.05)) / 0.12);
  let rot = 0;
  for (let i = 1; i <= k; i++) rot += (Math.PI / 2) * spring(b - (MORPH_KEYS[i].b - 0.1), 2.0, 0.45);
  const scale = b < 11.4 ? 230 : lerp(230, 60 / 0.86, spring(b - 11.4, 2.4, 0.6));
  return { A: SH[prev.s], B: SH[cur.s], m, rot, prevC: prev.c, curC: cur.c, colT, scale };
}
function shapePath(ctx, st, b) {
  const kk = b < 11.35 ? kick(b) : 0;
  ctx.beginPath();
  for (let i = 0; i < NP; i++) {
    const a = SH.angles[i];
    const r = lerp(st.A[i], st.B[i], st.m) * st.scale * (1 + 0.06 * kk * Math.sin(5 * a + b * 5));
    ctx.lineTo(CX + r * Math.cos(a + st.rot), CY + r * Math.sin(a + st.rot));
  }
  ctx.closePath();
}
function gridDots(ctx, alpha, r = 3) {
  if (alpha <= 0) return;
  ctx.fillStyle = rgba('paper', alpha);
  for (let j = -4; j <= 4; j++) for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.arc(CX + i * 120, CY + j * 120, r, 0, TAU); ctx.fill(); }
}
function sceneMorph(ctx, b) {
  bg(ctx, 'ink');
  gridDots(ctx, 0.14 * prog(b, 8.2, 8.8) + 0.2 * prog(b, 11.4, 11.9));
  // sonar pulses
  for (let k = 8; k <= 11; k++) {
    const p = prog(b, k, k + 1.3);
    if (p <= 0 || p >= 1) continue;
    ctx.beginPath(); ctx.arc(CX, CY, lerp(250, 1300, ease.outCubic(p)), 0, TAU);
    ctx.strokeStyle = rgba('paper', (1 - p) * 0.35); ctx.lineWidth = 2; ctx.stroke();
  }
  // satellites
  const sats = [0, 1, 2].map(k => {
    const ph = b * Math.PI * (0.9 + 0.35 * k) + k * 2.1;
    const shrink = 1 - ease.inBack(prog(b, 11.1, 11.45));
    const A = (390 + 70 * k) * shrink, B = (110 + 34 * k) * shrink, tilt = -0.35 + 0.42 * k;
    const ex = A * Math.cos(ph), ey = B * Math.sin(ph);
    return { x: CX + ex * Math.cos(tilt) - ey * Math.sin(tilt), y: CY + ex * Math.sin(tilt) + ey * Math.cos(tilt), z: Math.sin(ph), r: (12 + 5 * Math.sin(ph)) * shrink * prog(b, 8.1, 8.4), c: ['paper', 'lime', 'cobalt'][k] };
  });
  for (const s of sats) if (s.z < 0) circle(ctx, s.x, s.y, s.r, HEX[s.c]);
  // time echo
  for (let k = 6; k >= 1; k--) {
    const bb = b - k * 0.045;
    if (bb < 8) continue;
    const st = morphState(bb);
    shapePath(ctx, st, bb);
    ctx.strokeStyle = mix(st.prevC, st.curC, st.colT, 0.55 * (1 - k / 7));
    ctx.lineWidth = 3; ctx.stroke();
  }
  const st = morphState(b);
  shapePath(ctx, st, b);
  ctx.fillStyle = mix(st.prevC, st.curC, st.colT); ctx.fill();
  for (const s of sats) if (s.z >= 0) circle(ctx, s.x, s.y, s.r, HEX[s.c]);
}

/* ============================================================== 04 SYSTEMS
 * 17×9 Truchet tiles. Spawn ripple → arcs draw on → rotation waves →
 * diagonal card-flip wave → collapse to dots. */
const T = 120, ARC = (Math.PI / 2) * (T / 2);
const TILES = [];
for (let j = -4; j <= 4; j++) for (let i = -8; i <= 8; i++) TILES.push({ i, j, x: CX + i * T, y: CY + j * T, d: Math.hypot(i, j), o: hash(i + 0.37, j + 0.71) < 0.5 ? 0 : 1 });
function sceneSystems(ctx, b) {
  bg(ctx, 'ink');
  const live = [];
  for (const t of TILES) {
    const spawn = t.d === 0 ? 1 : ease.outBack(prog(b, 12 + (t.d - 1) * 0.045, 12.36 + (t.d - 1) * 0.045));
    const collapse = ease.inBack(prog(b, 15.5 + t.d * 0.02, 15.74 + t.d * 0.02));
    const s = spawn * (1 - collapse);
    if (collapse > 0) circle(ctx, t.x, t.y, 7 * clamp(collapse * 1.4), HEX.orange);
    if (Math.abs(s) < 0.002) continue;
    const w1 = prog(b, 13 + t.d * 0.05, 13.4 + t.d * 0.05);
    const w2 = ((t.i + t.j) & 1) ? 0 : prog(b, 13.5, 13.86);
    const w3 = prog(b, 15 + (t.i + 8) * 0.03, 15.38 + (t.i + 8) * 0.03);
    const fl = ease.inOutCubic(prog(b, 14 + (t.i + 8 + t.j + 4) * 0.026, 14.36 + (t.i + 8 + t.j + 4) * 0.026));
    live.push({
      t, s, back: fl > 0.5, sx: s * Math.max(0.001, Math.abs(Math.cos(Math.PI * fl))),
      draw: ease.outCubic(prog(b, 12.3 + t.d * 0.03, 12.7 + t.d * 0.03)),
      rot: t.o + ease.inOutBack(w1) + ease.inOutBack(w2) + ease.inOutBack(w3),
      act: Math.max(Math.sin(Math.PI * w1), Math.sin(Math.PI * w2), Math.sin(Math.PI * w3)),
    });
  }
  // pass 1: tile faces; pass 2: arcs (so no face ever clips a neighbour's arc)
  for (const L of live) {
    ctx.save(); ctx.translate(L.t.x, L.t.y); ctx.scale(L.sx, L.s);
    ctx.fillStyle = L.back ? HEX.ink : HEX.paper;
    ctx.fillRect(-T / 2 - 0.6, -T / 2 - 0.6, T + 1.2, T + 1.2);
    ctx.restore();
  }
  ctx.lineWidth = T * 0.2;
  const o = 0.025; // overshoot the tile edge a hair so neighbouring arcs fuse
  for (const L of live) {
    ctx.save(); ctx.translate(L.t.x, L.t.y); ctx.scale(L.sx, L.s); ctx.rotate((L.rot * Math.PI) / 2);
    ctx.strokeStyle = L.back ? mix('orange', 'lime', L.act) : mix('ink', 'orange', L.act);
    if (L.draw < 1) ctx.setLineDash([ARC * L.draw + 0.01, ARC * 2]);
    ctx.beginPath(); ctx.arc(-T / 2, -T / 2, T / 2, -o, Math.PI / 2 + o); ctx.stroke();
    ctx.beginPath(); ctx.arc(T / 2, T / 2, T / 2, Math.PI - o, Math.PI * 1.5 + o); ctx.stroke();
    ctx.restore();
  }
}

/* =================================================================== 05 3D
 * The dots are revealed to be a plane in perspective: it tilts into a floor,
 * ripples, wraps into a sphere, knots into a torus, then turns to face the
 * camera so its rings become the seven lines of the next scene. */
const F3 = 1600, RS = 360, RT = 320, rt = 120;
const PTS = [];
for (let j = -13; j <= 13; j++) for (let i = -24; i <= 24; i++) {
  const lon = (TAU * (i + 24)) / 49, lat = (j / 13) * 1.35, v = (TAU * (j + 13)) / 27;
  PTS.push({
    i, j, orig: i % 3 === 0 && j % 3 === 0, d: Math.hypot(i, j) / 3,
    sp: [RS * Math.cos(lat) * Math.sin(lon), RS * Math.sin(lat), RS * Math.cos(lat) * Math.cos(lon)],
    to: [(RT + rt * Math.cos(v)) * Math.sin(lon), rt * Math.sin(v), (RT + rt * Math.cos(v)) * Math.cos(lon)],
  });
}
const SEL = [-13, -11, -9, -7, -5, -3, -1];
const LINE_COLS = ['paper', 'orange', 'lime', 'cobalt', 'paper', 'orange', 'lime'];
const RING_R = SEL.map(j => { const v = (TAU * (j + 13)) / 27; return ((RT + rt * Math.cos(v)) * F3) / (F3 + rt * Math.sin(v)); });
const DEPTH_COLS = Array.from({ length: 64 }, (_, k) => { const t = k / 63; return t < 0.5 ? mix('paper', 'orange', t * 2) : mix('orange', 'cobalt', (t - 0.5) * 2); });
const P3 = new Float32Array(PTS.length * 4), ORDER = PTS.map((_, k) => k);
function scene3D(ctx, b) {
  bg(ctx, 'ink');
  const L = b - 16;
  const tilt = 1.02 * ease.inOutCubic(prog(L, 0.15, 1.3));
  const yaw = 0.45 * ease.inOutCubic(prog(L, 0.3, 1.8));
  const drop = 90 * ease.inOutCubic(prog(L, 0.15, 1.3)) * (1 - ease.inOutCubic(prog(L, 1.45, 2.0)));
  const waveA = 80 * ease.inOutCubic(prog(L, 0.35, 1.0)) * (1 + 0.7 * kick(b)) * (1 - ease.inOutCubic(prog(L, 1.45, 1.9)));
  const m1 = ease.inOutCubic(prog(L, 1.45, 2.0));
  const m2 = ease.inOutCubic(prog(L, 2.45, 3.0));
  const face = ease.inOutCubic(prog(L, 3.4, 3.95));
  const spin = 0.9 * L, objTilt = lerp(0.42, Math.PI / 2, face);
  const pulse = 1 + 0.04 * kick(b) * m1 * (1 - face);
  const ct = Math.cos(-tilt), stt = Math.sin(-tilt), cy_ = Math.cos(yaw), sy_ = Math.sin(yaw);
  const cs = Math.cos(spin), ss = Math.sin(spin), co = Math.cos(objTilt), so = Math.sin(objTilt);
  for (let k = 0; k < PTS.length; k++) {
    const p = PTS[k];
    // plane (tilted about X, then yawed)
    let x = 40 * p.i, y = 40 * p.j, z = waveA * Math.sin(Math.hypot(x, y) / 110 - L * 7);
    let y1 = y * ct - z * stt, z1 = y * stt + z * ct;
    let ax = x * cy_ + z1 * sy_, az = -x * sy_ + z1 * cy_, ay = y1 + drop;
    // sphere / torus (spin about own axis, then tilt)
    const sx = lerp(p.sp[0], p.to[0], m2) * pulse, sy = lerp(p.sp[1], p.to[1], m2) * pulse, sz = lerp(p.sp[2], p.to[2], m2) * pulse;
    const rx = sx * cs + sz * ss, rz = -sx * ss + sz * cs;
    const by = sy * co - rz * so, bz = sy * so + rz * co;
    x = lerp(ax, rx, m1); y = lerp(ay, by, m1); z = lerp(az, bz, m1);
    const zc = z + F3, f = F3 / zc;
    P3[k * 4] = CX + x * f; P3[k * 4 + 1] = CY + y * f; P3[k * 4 + 2] = zc; P3[k * 4 + 3] = f;
  }
  // row lines (latitudes → torus rings → the seven lines)
  const la = prog(L, 2.25, 2.8) * 0.5;
  if (la > 0) {
    ctx.lineJoin = 'round';
    for (let j = -13; j <= 13; j++) {
      const si = SEL.indexOf(j);
      const a = si >= 0 ? lerp(la, 1, face) : la * (1 - face);
      if (a <= 0.005) continue;
      ctx.beginPath();
      for (let i = 0; i < 49; i++) { const k = (j + 13) * 49 + i; ctx.lineTo(P3[k * 4], P3[k * 4 + 1]); }
      ctx.closePath();
      ctx.strokeStyle = si >= 0 ? mix('paper', LINE_COLS[si], face, a) : rgba('paper', a);
      ctx.lineWidth = si >= 0 ? lerp(1.5, 14, face) : 1.5;
      ctx.stroke();
    }
  }
  ORDER.sort((a, c) => P3[c * 4 + 2] - P3[a * 4 + 2]);
  const fade = 1 - ease.inOutCubic(prog(L, 3.45, 3.95));
  if (fade <= 0) return;
  for (const k of ORDER) {
    const p = PTS[k];
    const base = p.orig ? lerp(7, 4.4, prog(L, 0.4, 1.0)) : 4.4 * clamp(ease.outBack(prog(L, 0.02 + p.d * 0.035, 0.3 + p.d * 0.035)), 0, 2);
    const r = base * P3[k * 4 + 3] * fade;
    if (r < 0.3) continue;
    const t = clamp(0.5 + (P3[k * 4 + 2] - F3) / 800);
    circle(ctx, P3[k * 4], P3[k * 4 + 1], r, DEPTH_COLS[Math.round(t * 63)]);
  }
}

/* ================================================================== 06 LINE
 * Seven stroked paths with animated trim: spinning arcs → a 3:2 Lissajous
 * knot (snakes chasing) → a travelling waveform → flat stripes. */
function lineCurve(k, s, L, m1, m2, m3) {
  const a = TAU * s;
  let x = CX + RING_R[k] * Math.cos(a), y = CY - RING_R[k] * Math.sin(a);
  if (m1 > 0) {
    const lx = CX + (560 - k * 20) * Math.sin(3 * a + Math.PI / 2 + k * 0.17), ly = CY + (300 - k * 12) * Math.sin(2 * a);
    x = lerp(x, lx, m1); y = lerp(y, ly, m1);
  }
  if (m2 > 0) {
    const amp = (70 + 60 * kick(L + 20, 5)) * (1 - m3);
    const wx = lerp(-140, W + 140, s);
    const wy = lerp(CY + (k - 3) * 80, (k + 0.5) * (H / 7), m3) + amp * Math.sin(TAU * 1.5 * s - L * 5 + k * 0.45);
    x = lerp(x, wx, m2); y = lerp(y, wy, m2);
  }
  return [x, y];
}
function sceneLine(ctx, b) {
  bg(ctx, 'ink');
  const L = b - 20;
  const m3 = ease.inOutCubic(prog(L, 3.4, 3.92));
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let k = 0; k < 7; k++) {
    const m1 = ease.inOutCubic(prog(L, 0.95 + k * 0.035, 1.5 + k * 0.035));
    const m2 = ease.inOutCubic(prog(L, 1.95 + k * 0.035, 2.5 + k * 0.035));
    const dir = k % 2 ? -1 : 1;
    const head = Lh => dir * Lh * (0.5 + 0.1 * k) + k * 0.13;
    let s0, len;
    if (L < 2) {
      s0 = head(L);
      len = lerp(1, 0.26 + 0.06 * (k % 3), ease.outCubic(prog(L, 0.1, 0.55)));
      len = lerp(len, 0.45, ease.inOutCubic(prog(L, 1.0, 1.4)));
    } else {
      const e = ease.inOutCubic(prog(L, 2.0, 2.55));
      s0 = lerp(frac(head(2)), 0, e);
      len = lerp(0.45, 1, e);
    }
    const N = 320;
    ctx.beginPath();
    let prevF = -1;
    for (let n = 0; n <= N; n++) {
      const s = s0 + (len * n) / N;
      let fs = frac(s);
      if (len >= 0.9999 && n === N) fs = 1; // close full loops / reach the end of open lines
      const [x, y] = lineCurve(k, fs, L, m1, m2, m3);
      if (n === 0 || fs < prevF) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      prevF = fs;
    }
    ctx.strokeStyle = HEX[LINE_COLS[k]];
    ctx.lineWidth = lerp(14, (H / 7) * 0.5, m3);
    ctx.stroke();
  }
  // trim readout
  const a = prog(L, 0.2, 0.4) * (1 - prog(L, 3.2, 3.4));
  if (a > 0) {
    const v = L < 2 ? lerp(1, 0.32, ease.outCubic(prog(L, 0.1, 0.55))) : lerp(0.45, 1, ease.inOutCubic(prog(L, 2.0, 2.55)));
    mono(ctx, `TRIM PATHS  end ${v.toFixed(2)}  offset ${frac(L * 0.6).toFixed(2)}`, 48, 980, 15, HEX.paper, { alpha: a * 0.7, spacing: 1.5 });
  }
}

/* ================================================================ 07 RHYTHM
 * Seven half-beat cuts, each entering through a different transition mask,
 * then a wall of every scene so far that implodes into a single dot. */
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
function cutStripes(ctx, lt) {
  bg(ctx, 'ink');
  const hh = (H / 7) * 0.5, gap = lerp(-hh * 1.2, 70, ease.outCubic(prog(lt, 0, 0.15)));
  for (let k = 0; k < 7; k++) {
    const y = (k + 0.5) * (H / 7), seg = 360 + 110 * (k % 3), dir = k % 2 ? -1 : 1;
    const off = dir * lt * (1500 + 260 * k), period = seg + gap;
    ctx.fillStyle = HEX[LINE_COLS[k]];
    let x0 = (((off % period) + period) % period) - period * 2;
    for (let x = x0; x < W + period; x += period) roundRect(ctx, x, y - hh / 2, seg, hh, hh / 2);
  }
}
function cutTunnel(ctx, lt) {
  bg(ctx, 'cobalt');
  const total = lt * 3.2, f = frac(total), fl = Math.floor(total);
  ctx.save(); ctx.translate(CX, CY);
  for (let n = 16; n >= 0; n--) {
    const s = 26 * Math.pow(1.34, n + f);
    if (s < 4) continue;
    ctx.save(); ctx.rotate(Math.PI / 4 + (n + f) * 0.07 + lt * 0.8);
    ctx.fillStyle = (n + fl) % 2 ? HEX.cobalt : HEX.paper;
    ctx.fillRect(-s, -s, s * 2, s * 2);
    ctx.restore();
  }
  ctx.restore();
}
function cutHalftone(ctx, lt) {
  bg(ctx, 'lime');
  ctx.fillStyle = HEX.ink;
  const sp = 54;
  for (let y = sp / 2 - 6; y < H + sp; y += sp) for (let x = sp / 2 - 12; x < W + sp; x += sp) {
    const d = Math.hypot(x - CX, y - CY), d2 = Math.hypot(x - W * 0.85, y - H * 0.2);
    const r = 24 * (0.5 + 0.25 * Math.sin(d / 70 - lt * 16) + 0.25 * Math.sin(d2 / 110 - lt * 9));
    if (r > 0.8) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  }
}
function cutGlitch(ctx, lt) {
  bg(ctx, 'ink');
  const S = 560, base = CY + (CAP * S) / 2;
  const seed = Math.floor(lt * 18), spike = Math.pow(hash(seed, 3.3), 3);
  ctx.font = `900 ${S}px ${DISPLAY}`; ctx.textAlign = 'center';
  const dx = 10 + 40 * spike;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = HEX.orange; ctx.fillText('2026', CX - dx, base);
  ctx.fillStyle = HEX.cobalt; ctx.fillText('2026', CX + dx, base + dx * 0.3);
  ctx.globalCompositeOperation = 'source-over';
  const bands = 11, bh = H / bands;
  for (let i = 0; i < bands; i++) {
    const o = (hash(i, seed) - 0.5) * 220 * (hash(i + 9, seed) > 0.55 ? 1 : 0.08);
    ctx.save(); ctx.beginPath(); ctx.rect(0, i * bh, W, bh + 1); ctx.clip();
    ctx.fillStyle = HEX.paper; ctx.fillText('2026', CX + o, base);
    ctx.restore();
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = rgba('paper', 0.06);
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2);
  mono(ctx, `RENDER_${String(seed * 7919 % 10000).padStart(4, '0')}.EXR`, CX, base + 80, 18, HEX.paper, { align: 'center', alpha: 0.7, spacing: 3 });
}
function cutSunburst(ctx, lt) {
  bg(ctx, 'paper');
  const n = 20, rot = lt * 1.4 + ease.outExpo(prog(lt, 0, 0.5)) * 0.6;
  ctx.fillStyle = HEX.orange;
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i * TAU) / n, a1 = a0 + (TAU / n) * 0.5;
    ctx.beginPath(); ctx.moveTo(CX, CY); ctx.arc(CX, CY, 1400, a0, a1); ctx.closePath(); ctx.fill();
  }
  circle(ctx, CX, CY, 150 + 20 * Math.sin(lt * 20), HEX.ink);
  ctx.save(); ctx.translate(CX, CY); ctx.rotate(-rot * 2);
  ctx.beginPath();
  for (let i = 0; i < 16; i++) { const r = i % 2 ? 26 : 74, a = (i * TAU) / 16; ctx.lineTo(r * Math.cos(a), r * Math.sin(a)); }
  ctx.closePath(); ctx.fillStyle = HEX.paper; ctx.fill();
  ctx.restore();
}
function cutChecker(ctx, lt) {
  bg(ctx, 'ink');
  const c = 96, warp = (x, y) => [x + 46 * Math.sin(y / 150 + lt * 10), y + 40 * Math.sin(x / 170 + lt * 8)];
  ctx.fillStyle = HEX.paper;
  for (let j = -1; j < 13; j++) for (let i = -1; i < 22; i++) {
    if ((i + j) & 1) continue;
    const x = i * c, y = j * c;
    const p1 = warp(x, y), p2 = warp(x + c, y), p3 = warp(x + c, y + c), p4 = warp(x, y + c);
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.lineTo(p4[0], p4[1]); ctx.closePath(); ctx.fill();
  }
}
function cutLoader(ctx, lt) {
  bg(ctx, 'cobalt');
  const pct = Math.round(100 * ease.outCubic(clamp(lt / 0.48)));
  const segs = 24, lit = Math.round((pct / 100) * segs), rot = lt * 1.2;
  ctx.lineWidth = 34; ctx.lineCap = 'butt';
  for (let i = 0; i < segs; i++) {
    const a0 = -Math.PI / 2 + rot + (i * TAU) / segs + 0.03, a1 = a0 + TAU / segs - 0.06;
    ctx.beginPath(); ctx.arc(CX, CY, 290, a0, a1);
    ctx.strokeStyle = i < lit ? HEX.paper : rgba('paper', 0.16); ctx.stroke();
  }
  ctx.save();
  ctx.font = `800 150px ${MONO}`; ctx.textAlign = 'center'; ctx.fillStyle = HEX.paper;
  ctx.fillText(String(pct).padStart(2, '0'), CX - 20, CY + 52);
  ctx.font = `800 60px ${MONO}`; ctx.fillText('%', CX + (pct >= 100 ? 150 : 110), CY + 50);
  ctx.restore();
  mono(ctx, 'RENDERING REEL', CX, CY + 400, 20, HEX.paper, { align: 'center', spacing: 6, alpha: 0.8 });
}
const CUTS = [cutStripes, cutTunnel, cutHalftone, cutGlitch, cutSunburst, cutChecker, cutLoader];
const MASKS = [null, 'iris', 'diag', 'blinds', 'clock', 'squares', 'doors'];
function maskPath(ctx, type, p) {
  ctx.beginPath();
  if (type === 'iris') ctx.arc(CX, CY, p * 1120, 0, TAU);
  else if (type === 'diag') { const x = lerp(-520, W + 520, p); ctx.moveTo(-10, -10); ctx.lineTo(x + 260, -10); ctx.lineTo(x - 260, H + 10); ctx.lineTo(-10, H + 10); }
  else if (type === 'blinds') { const n = 9, bh = H / n; for (let i = 0; i < n; i++) { const hh = bh * clamp(p * 1.35 - i * 0.04); ctx.rect(0, i * bh + (bh - hh) / 2, W, hh); } }
  else if (type === 'clock') { ctx.moveTo(CX, CY); ctx.arc(CX, CY, 1300, -Math.PI / 2, -Math.PI / 2 + TAU * p); ctx.closePath(); }
  else if (type === 'squares') { const s = 120; for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) { const d = Math.hypot(x + s / 2 - CX, y + s / 2 - CY) / 1100; const q = clamp(p * 1.7 - d * 0.7) * s; ctx.rect(x + (s - q) / 2, y + (s - q) / 2, q, q); } }
  else if (type === 'doors') { const w = p * W; ctx.rect(CX - w / 2, 0, w, H); }
}
function drawCut(ctx, k, lt) {
  const pz = k > 0 ? 1 + 0.045 * (1 - ease.outCubic(clamp(lt / 0.3))) : 1;
  ctx.save();
  if (pz !== 1) { ctx.translate(CX, CY); ctx.scale(pz, pz); ctx.translate(-CX, -CY); }
  CUTS[k](ctx, lt);
  ctx.restore();
}
function withFB(t, fn) { const keep = FB; FB = t; fn(); FB = keep; }
const WALL = [
  (c, lt) => withFB(1.0 + lt, () => scenePhysics(c, 1.0 + lt)),
  (c, lt) => withFB(5.25 + lt, () => sceneType(c, 5.25 + lt)),
  (c, lt) => withFB(9.55 + lt, () => sceneMorph(c, 9.55 + lt)),
  (c, lt) => withFB(13.2 + lt, () => sceneSystems(c, 13.2 + lt)),
  (c, lt) => cutLoader(c, 0.5 + lt),
  (c, lt) => withFB(18.3 + lt, () => scene3D(c, 18.3 + lt)),
  (c, lt) => withFB(21.4 + lt, () => sceneLine(c, 21.4 + lt)),
  (c, lt) => cutGlitch(c, 0.2 + lt),
  (c, lt) => cutSunburst(c, 0.2 + lt),
];
function wall(ctx, lt) {
  bg(ctx, 'ink');
  const cw = 576, ch = 324, g = 24;
  const z = lerp(W / cw, 1, ease.outExpo(prog(lt, 0, 0.17)));
  const q = ease.inBack(prog(lt, 0.25, 0.46));
  const Z = z * (1 - q);
  if (Z > 0.002) {
    ctx.save();
    ctx.translate(CX, CY); ctx.rotate(q * 0.5); ctx.scale(Z, Z); ctx.translate(-CX, -CY);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c, x = CX + (c - 1) * (cw + g) - cw / 2, y = CY + (r - 1) * (ch + g) - ch / 2;
      const delay = idx === 4 ? 0 : 0.02 + 0.01 * Math.hypot(r - 1, c - 1);
      const appear = idx === 4 ? 1 : ease.outCubic(prog(lt, delay, delay + 0.12));
      if (appear <= 0) continue;
      ctx.save();
      ctx.translate(x + cw / 2, y + ch / 2); ctx.scale(appear, appear); ctx.translate(-cw / 2, -ch / 2);
      ctx.beginPath(); ctx.roundRect(0, 0, cw, ch, idx === 4 ? lerp(0, 12, prog(lt, 0, 0.1)) : 12); ctx.clip();
      ctx.scale(cw / W, ch / H);
      WALL[idx](ctx, lt);
      ctx.restore();
    }
    ctx.restore();
  }
  circle(ctx, CX, CY, 22 * ease.outBack(prog(lt, 0.36, 0.5)), HEX.orange);
}
function sceneRhythm(ctx, b) {
  const k = Math.floor((clamp(FB, 24, 27.9999) - 24) * 2);
  if (k >= 7) return wall(ctx, clamp(b, 27.5, 27.9999) - 27.5);
  const lt = clamp(b - (24 + k * 0.5), 0, 0.4999), TIN = 0.16;
  if (k > 0 && lt < TIN) {
    drawCut(ctx, k - 1, lt + 0.5);
    ctx.save(); maskPath(ctx, MASKS[k], ease.outCubic(lt / TIN)); ctx.clip();
    drawCut(ctx, k, lt);
    ctx.restore();
  } else drawCut(ctx, k, lt);
}

/* ================================================================= 08 HELLO
 * Impact. The letters burst out of the dot; the dot arcs over and lands as
 * the full stop. */
const TAGS = ['PHYSICS', 'TYPE', 'MORPH', 'SYSTEMS', '3D', 'LINE', 'RHYTHM'];
let titleLayer = null;
function sceneHello(ctx, b) {
  const L = b - 28;
  bg(ctx, 'ink');
  const shake = 18 * Math.exp(-L * 5);
  ctx.save();
  ctx.translate(shake * (noise1(L * 38) - 0.5) * 2, shake * (noise1(L * 38 + 70) - 0.5) * 2);
  // shockwaves
  [[0, 'paper', 70], [0.07, 'orange', 40]].forEach(([d, c, w0]) => {
    const p = prog(L, d, d + 0.75);
    if (p <= 0 || p >= 1) return;
    ctx.beginPath(); ctx.arc(CX, CY, lerp(20, 1500, ease.outCubic(p)), 0, TAU);
    ctx.strokeStyle = rgba(c, 1 - p); ctx.lineWidth = lerp(w0, 2, p); ctx.stroke();
  });
  // title on its own layer so the glint can be masked to the letters
  const S = 300, word = 'CLAUDE', Lw = layout(ctx, word, S, 900, -8);
  const R = 25, gap = 16, total = Lw.width + gap + R * 2;
  const base = CY + 40, x0 = CX - total / 2, cy = base - (CAP * S) / 2;
  if (!titleLayer) { titleLayer = document.createElement('canvas'); titleLayer.width = W; titleLayer.height = H; }
  const tc = titleLayer.getContext('2d');
  tc.setTransform(1, 0, 0, 1, 0, 0);
  tc.clearRect(0, 0, W, H);
  tc.font = `900 ${S}px ${DISPLAY}`; tc.textAlign = 'center'; tc.textBaseline = 'alphabetic'; tc.fillStyle = HEX.paper;
  for (let i = 0; i < word.length; i++) {
    const r = rng(800 + i * 7);
    const p = spring(L - 0.022 * Math.abs(i - 2.5), 2.0, 0.5);
    const tx = x0 + Lw.xs[i] + Lw.ws[i] / 2;
    const s = Math.max(0, lerp(0.08, 1, p));
    tc.save();
    tc.translate(lerp(CX, tx, p), lerp(CY, cy, p)); tc.rotate((r() - 0.5) * 1.6 * (1 - clamp(p)));
    tc.scale(s, s); tc.fillText(word[i], 0, (CAP * S) / 2);
    tc.restore();
  }
  const gp = prog(L, 3.0, 3.55);
  if (gp > 0 && gp < 1) {
    const gx = lerp(x0 - 300, x0 + total + 300, ease.inOutCubic(gp));
    const grad = tc.createLinearGradient(gx - 160, 0, gx + 160, 0);
    grad.addColorStop(0, rgba('orange', 0)); grad.addColorStop(0.5, rgba('orange', 1)); grad.addColorStop(1, rgba('orange', 0));
    tc.globalCompositeOperation = 'source-atop';
    tc.fillStyle = grad; tc.fillRect(0, 0, W, H);
    tc.globalCompositeOperation = 'source-over';
  }
  ctx.drawImage(titleLayer, 0, 0);
  // underline
  const u = ease.outExpo(prog(L, 0.55, 1.05));
  if (u > 0) { ctx.fillStyle = HEX.orange; ctx.fillRect(CX - (total / 2 + 20) * u, base + 44, (total + 40) * u, 6); }
  // the dot → full stop
  const px = x0 + Lw.width + gap + R, py = base - R;
  let bx, by, sx = 1, sy = 1, ang = 0;
  if (L < 1) {
    const s = L;
    bx = lerp(CX, px, s); by = lerp(CY, py, s) - 1500 * s * (1 - s);
    const vx = px - CX, vy = py - CY - 1500 * (1 - 2 * s), sp = Math.hypot(vx, vy);
    ang = Math.atan2(vy, vx); sx = 1 + clamp(sp / 3000) * 0.5; sy = 1 / sx;
  } else {
    bx = px; by = py;
    const hops = [[1, 0.25, 34], [1.25, 0.125, 9], [3.3, 0.3, 46]];
    for (const [t0, d, hgt] of hops) if (L >= t0 && L < t0 + d) { const s = (L - t0) / d; by -= hgt * 4 * s * (1 - s); }
    let sq = 0;
    for (const [t, k] of [[1, 0.42], [1.25, 0.2], [1.375, 0.08], [3.6, 0.22]]) { const x = L - t; if (x >= 0 && x < 0.3) sq += k * Math.exp(-x / 0.05) * Math.cos(x * 26); }
    sy = 1 - sq; sx = 1 / sy; by += R * (1 - sy);
  }
  const rp = ease.outBack(prog(L, 0, 0.08));
  ctx.save(); ctx.translate(bx, by); ctx.rotate(ang); ctx.scale(sx * rp, sy * rp);
  circle(ctx, 0, 0, R, HEX.orange); ctx.restore();
  // subtitle — tracking in
  const ta = prog(L, 0.85, 1.1);
  if (ta > 0) mono(ctx, 'MOTION DESIGNER', CX, base + 124, 40, HEX.paper, { weight: 800, align: 'center', spacing: lerp(46, 16, ease.outExpo(prog(L, 0.85, 1.7))), alpha: ta });
  // tags
  ctx.save();
  ctx.font = `500 19px ${MONO}`; ctx.letterSpacing = '3px';
  const sep = '   /   ', full = TAGS.join(sep), fw = ctx.measureText(full).width;
  let tx = CX - fw / 2;
  TAGS.forEach((t, i) => {
    const p = ease.outCubic(prog(L, 1.45 + i * 0.065, 1.75 + i * 0.065));
    ctx.globalAlpha = p * 0.7; ctx.fillStyle = HEX.paper;
    ctx.fillText(t, tx, base + 190 + (1 - p) * 16);
    tx += ctx.measureText(t).width;
    if (i < TAGS.length - 1) { ctx.globalAlpha = p * 0.35; ctx.fillText(sep, tx, base + 190 + (1 - p) * 16); tx += ctx.measureText(sep).width; }
  });
  ctx.restore();
  ctx.restore(); // shake
  // marquee
  const mw = ease.outExpo(prog(L, 2.0, 2.4));
  if (mw > 0) {
    const y0 = 890, hh = 54;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, y0, W * mw, hh); ctx.clip();
    ctx.fillStyle = HEX.orange; ctx.fillRect(0, y0, W, hh);
    ctx.font = `800 24px ${MONO}`; ctx.letterSpacing = '4px'; ctx.fillStyle = HEX.ink;
    const unit = 'AVAILABLE FOR WORK  ●  SHOWREEL 2026  ●  ', uw = ctx.measureText(unit).width;
    for (let x = -frac((L * 240) / uw) * uw; x < W; x += uw) ctx.fillText(unit, x, y0 + 36);
    ctx.restore();
  }
  // impact flash
  const fl = 0.3 * Math.exp(-L * 34);
  if (fl > 0.01) { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgba('orange', fl); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
}

/* ============================================================== sequencing */
const SCENES = [
  { b0: 0, b1: 4, name: 'PHYSICS', draw: scenePhysics },
  { b0: 4, b1: 8, name: 'TYPE', draw: sceneType },
  { b0: 8, b1: 12, name: 'MORPH', draw: sceneMorph },
  { b0: 12, b1: 16, name: 'SYSTEMS', draw: sceneSystems },
  { b0: 16, b1: 20, name: '3D', draw: scene3D },
  { b0: 20, b1: 24, name: 'LINE', draw: sceneLine },
  { b0: 24, b1: 28, name: 'RHYTHM', draw: sceneRhythm },
  { b0: 28, b1: 32, name: 'HELLO', draw: sceneHello },
];
const sceneIndex = b => clamp(Math.floor(b / 4), 0, 7);

function drawSub(ctx, b, fb) {
  const sc = SCENES[sceneIndex(fb)];
  const bb = clamp(b, sc.b0, sc.b1 - 1e-4);
  FB = fb;
  ctx.save();
  if (fb >= 8 && fb < 24) { const e = 1 + 0.012 * kick(bb, 7); ctx.translate(CX, CY); ctx.scale(e, e); ctx.translate(-CX, -CY); }
  sc.draw(ctx, bb);
  ctx.restore();
}

/* background luminance → HUD colour */
function hudInk(b) {
  if (b >= 5 && b < 6) return true;
  if (b >= 7 && b < 7.75) return true;
  if (b >= 12.25 && b < 14.4) return true;
  if (b >= 25 && b < 25.5) return true;
  if (b >= 26 && b < 26.5) return true;
  return false;
}
function hud(ctx, t) {
  const b = t / BEAT, fr = Math.round(t * FPS);
  const col = hudInk(b) ? HEX.ink : HEX.paper;
  const intro = ease.outCubic(clamp(t / 0.5));
  ctx.save();
  // crop marks
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.globalAlpha = 0.85;
  const m = 32, len = 26 * intro;
  [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, dx, dy]) => {
    ctx.beginPath(); ctx.moveTo(x + dx * len, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * len); ctx.stroke();
  });
  ctx.globalAlpha = intro;
  mono(ctx, 'CLAUDE', 72, 66, 15, col, { weight: 800, spacing: 3 });
  mono(ctx, '— MOTION REEL ’26', 150, 66, 15, col, { spacing: 2, alpha: 0.75 });
  const ss = String(Math.floor(fr / FPS)).padStart(2, '0'), ff = String(fr % FPS).padStart(2, '0');
  mono(ctx, `TC 00:00:${ss}:${ff}`, W - 72, 66, 15, col, { align: 'right', spacing: 2 });
  // scene label with slot roll
  const si = sceneIndex(b), sb = b - si * 4, roll = si > 0 ? ease.outExpo(clamp(sb / 0.3)) : 1;
  ctx.save();
  ctx.beginPath(); ctx.rect(60, H - 84, 420, 30); ctx.clip();
  const label = i => `${String(i + 1).padStart(2, '0')} / 08   ${SCENES[i].name}`;
  if (roll < 1 && si > 0) mono(ctx, label(si - 1), 72, H - 62 - roll * 30, 15, col, { spacing: 2 });
  mono(ctx, label(si), 72, H - 62 + (1 - roll) * 30, 15, col, { spacing: 2, weight: 800 });
  ctx.restore();
  // tempo + beat squares
  mono(ctx, '128 BPM', W - 72 - 4 * 18 - 18, H - 62, 15, col, { align: 'right', spacing: 2 });
  const beatInBar = Math.floor(b) % 4;
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = intro * (i === beatInBar ? 1 : 0.3);
    ctx.fillStyle = col; ctx.fillRect(W - 72 - (4 - i) * 18 + 6, H - 74, 11, 11);
  }
  // progress
  ctx.globalAlpha = intro * 0.25; ctx.fillStyle = col; ctx.fillRect(72, H - 44, W - 144, 1);
  ctx.globalAlpha = intro; ctx.fillRect(72, H - 45, (W - 144) * clamp(t / DURATION), 3);
  ctx.restore();
}

/* ================================================================ renderer */
const canvas = document.getElementById('reel');
const main = canvas.getContext('2d', { alpha: false });
const sub = document.createElement('canvas'); sub.width = W; sub.height = H;
const sctx = sub.getContext('2d', { alpha: false });
const grp = document.createElement('canvas'); grp.width = W; grp.height = H;
const gctx = grp.getContext('2d', { alpha: false });
const vignette = (() => {
  const v = document.createElement('canvas'); v.width = W; v.height = H;
  const c = v.getContext('2d');
  const g = c.createRadialGradient(CX, CY, H * 0.55, CX, CY, W * 0.62);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.16)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  return v;
})();

/* Render one output frame. With samples > 1 the frame is the average of
 * `samples` sub-frames spread across a `shutter` fraction of the frame
 * interval — real temporal motion blur, the way a camera sees it. */
function renderAt(t, samples = 1, shutter = 0.5) {
  const fb = t / BEAT;
  if (samples <= 1) { drawSub(main, fb, fb); }
  else {
    // two-level running average (groups of ~√n) keeps 8-bit rounding error to a couple of levels
    const G = Math.ceil(Math.sqrt(samples)), groups = Math.ceil(samples / G);
    let k = 0;
    for (let g = 0; g < groups; g++) {
      const n = Math.min(G, samples - g * G);
      for (let j = 0; j < n; j++, k++) {
        const ts = clamp(t + ((k + 0.5) / samples - 0.5) * (shutter / FPS), 0, DURATION - 1e-6);
        drawSub(sctx, ts / BEAT, fb);
        gctx.globalAlpha = 1 / (j + 1);
        gctx.drawImage(sub, 0, 0);
      }
      main.globalAlpha = n / (g * G + n); // weight the group by its share of the samples
      main.drawImage(grp, 0, 0);
    }
    main.globalAlpha = 1;
  }
  main.drawImage(vignette, 0, 0);
  hud(main, t);
}

const fontsReady = Promise.all([
  document.fonts.load(`900 100px ${DISPLAY}`),
  document.fonts.load(`200 100px ${DISPLAY}`),
  document.fonts.load(`500 20px ${MONO}`),
  document.fonts.load(`800 20px ${MONO}`),
]).then(() => document.fonts.ready).then(() => { measureMetrics(main); });

/* the fastest moves (zoom through the O, the montage, the impact) get 3× the
 * sub-frames so their blur stays smooth instead of stepping */
const blurBoost = b => ((b >= 7.5 && b < 8.05) || (b >= 23.9 && b < 28.35) ? 3 : 1);

window.REEL = {
  W, H, FPS, BPM, BEAT, DURATION, FRAMES: Math.round(DURATION * FPS),
  ready: fontsReady,
  renderFrame: (frame, samples = 8, shutter = 0.5) => renderAt(frame / FPS, samples * blurBoost(frame / FPS / BEAT), shutter),
  renderTime: (t, samples = 1, shutter = 0.5) => renderAt(t, samples, shutter),
};

/* ---------------------------------------------------------------- live mode */
const params = new URLSearchParams(location.search);
if (params.has('render')) { document.body.classList.add('render'); return; }

fontsReady.then(() => {
  const audio = new Audio('../media/soundtrack.m4a');
  audio.preload = 'auto';
  let playing = false, t0 = 0, offset = 0, hasAudio = true;
  audio.addEventListener('error', () => { hasAudio = false; });
  const now = () => (playing ? (hasAudio && !audio.paused ? audio.currentTime : offset + (performance.now() - t0) / 1000) : offset);
  const play = () => {
    playing = true; t0 = performance.now(); document.body.classList.add('playing');
    if (hasAudio) { audio.currentTime = offset; audio.play().catch(() => { hasAudio = false; }); }
  };
  const pause = () => { offset = now(); playing = false; audio.pause(); document.body.classList.remove('playing'); };
  const seek = t => { offset = clamp(t, 0, DURATION - 1e-3); t0 = performance.now(); if (hasAudio) audio.currentTime = offset; };
  canvas.addEventListener('click', () => (playing ? pause() : play()));
  addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    if (e.code === 'ArrowRight') seek(now() + BEAT);
    if (e.code === 'ArrowLeft') seek(now() - BEAT);
  });
  const loop = () => {
    let t = now();
    if (t >= DURATION) { offset = 0; t = 0; if (playing) { t0 = performance.now(); if (hasAudio) { audio.currentTime = 0; audio.play().catch(() => {}); } } }
    renderAt(t, 2, 0.5);
    requestAnimationFrame(loop);
  };
  loop();
});
})();
