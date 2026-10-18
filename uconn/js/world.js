'use strict';
/* Jaret's First Day — the Storrs campus: map data, collision, pathfinding, movement and interaction. */

const WORLD_W = 2600, WORLD_H = 1900;
const PLAYER_R = 11, GRID_R = 14, CELL = 20;

/* A stylised Storrs: Fairfield Way runs from the Library plaza to the Student Union circle,
   with Laurel Hall on its north side and Oak Hall on its south side. */
const PLACES = {
  library: { name: 'Homer Babbidge Library', short: 'Library', x: 560, y: 560, w: 360, h: 260, door: { x: 740, y: 852 }, side: 'S', roof: '#A3ABB5', wall: '#D2CCBF', wallH: 66, style: 'library' },
  laurel:  { name: 'Laurel Hall', short: 'Laurel', x: 1040, y: 650, w: 250, h: 160, door: { x: 1165, y: 842 }, side: 'S', roof: '#6FA65A', wall: '#B5643C', wallH: 54, style: 'laurel' },
  oak:     { name: 'Oak Hall', short: 'Oak', x: 1380, y: 980, w: 300, h: 180, door: { x: 1530, y: 948 }, side: 'N', roof: '#8A929E', wall: '#A85A3A', wallH: 58, style: 'brick' },
  union:   { name: 'Student Union', short: 'Union', x: 1820, y: 700, w: 360, h: 280, door: { x: 1790, y: 880 }, side: 'W', roof: '#949DAA', wall: '#DCD5C6', wallH: 66, style: 'union' },
  dairy:   { name: 'UConn Dairy Bar', short: 'Dairy Bar', x: 1340, y: 170, w: 240, h: 140, door: { x: 1460, y: 342 }, side: 'S', roof: '#B33A3A', wall: '#F3EFE7', wallH: 52, style: 'dairy' },
  gampel:  { name: 'Gampel Pavilion', short: 'Gampel', round: true, cx: 380, cy: 1010, r: 170, door: { x: 380, y: 1226 }, side: 'S' },
  dorm:    { name: 'South Campus Hall', short: 'Dorm', x: 620, y: 1360, w: 300, h: 220, door: { x: 770, y: 1334 }, side: 'N', roof: '#76625A', wall: '#A4553A', wallH: 74, style: 'brick' },
  dining:  { name: 'South Campus Dining', short: 'Dining', x: 1040, y: 1400, w: 260, h: 170, door: { x: 1170, y: 1374 }, side: 'N', roof: '#7F8A95', wall: '#CDBCA4', wallH: 52, style: 'dining' },
  hill:    { name: 'Horsebarn Hill', short: 'Hill', spot: true, door: { x: 2120, y: 352 } },
};
const BARN = { x: 2330, y: 70, w: 200, h: 130 };
const PASTURE = { x: 2250, y: 250, w: 300, h: 270 };
const LAKE = { cx: 1720, cy: 1500, rx: 290, ry: 150 };
const HILL = { cx: 2150, cy: 330, rx: 430, ry: 300 };
const FIELD = { x: 120, y: 110, w: 560, h: 330 };
const BENCH = { x: 2120, y: 326 };

const NODES = {
  fwW: [600, 880], fwLib: [740, 880], fwS: [1000, 880], fwLau: [1165, 880], fwN: [1460, 880], fwOak: [1530, 880], fwE: [1720, 880],
  libDoor: [740, 832], lauDoor: [1165, 822], oakDoor: [1530, 962], uniDoor: [1808, 880],
  n1: [1460, 560], dairyDoor: [1460, 322], h1: [1800, 560], h2: [1980, 440], hillTop: [2120, 352],
  w1: [600, 1240], gamDoor: [380, 1240], w2: [770, 1240], s2: [770, 1300], dormDoor: [770, 1350],
  s1: [1000, 1300], s3: [1170, 1300], dinDoor: [1170, 1390], e1: [1380, 1300],
};
const EDGES = [
  ['fwW', 'fwLib', 70], ['fwLib', 'fwS', 70], ['fwS', 'fwLau', 70], ['fwLau', 'fwN', 70], ['fwN', 'fwOak', 70], ['fwOak', 'fwE', 70],
  ['fwLib', 'libDoor', 40], ['fwLau', 'lauDoor', 34], ['fwOak', 'oakDoor', 34], ['fwE', 'uniDoor', 44],
  ['fwN', 'n1', 40], ['n1', 'dairyDoor', 40], ['n1', 'h1', 34], ['h1', 'h2', 34], ['h2', 'hillTop', 34],
  ['fwW', 'w1', 40], ['w1', 'gamDoor', 40], ['w1', 'w2', 40], ['w2', 's2', 40], ['s2', 'dormDoor', 40],
  ['s2', 's1', 44], ['fwS', 's1', 44], ['s1', 's3', 44], ['s3', 'dinDoor', 34], ['s3', 'e1', 40],
];
(function buildLakeLoop() {
  const n = 16, rx = 352, ry = 212;
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + k * TAU / n;
    NODES['L' + k] = [Math.round(LAKE.cx + Math.cos(a) * rx), Math.round(LAKE.cy + Math.sin(a) * ry)];
  }
  for (let k = 0; k < n; k++) EDGES.push(['L' + k, 'L' + ((k + 1) % n), 30]);
  EDGES.push(['fwE', 'L0', 40]);
  let best = 'L0', bd = 1e9;
  for (let k = 0; k < n; k++) { const p = NODES['L' + k], d = dist(p[0], p[1], NODES.e1[0], NODES.e1[1]); if (d < bd) { bd = d; best = 'L' + k; } }
  EDGES.push(['e1', best, 34]);
})();
const ADJ = {};
for (const [a, b] of EDGES) { (ADJ[a] = ADJ[a] || []).push(b); (ADJ[b] = ADJ[b] || []).push(a); }

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function onPath(x, y, pad = 0) {
  for (const [a, b, w] of EDGES) { const A = NODES[a], B = NODES[b]; if (distToSeg(x, y, A[0], A[1], B[0], B[1]) < w / 2 + pad) return true; }
  if (x > 520 - pad && x < 960 + pad && y > 826 - pad && y < 936 + pad) return true; // library plaza
  return dist(x, y, 1720, 880) < 70 + pad; // union circle
}

/* ---------------- Obstacles ---------------- */
const RECTS = [];
for (const k in PLACES) { const p = PLACES[k]; if (!p.round && !p.spot) RECTS.push(p); }
RECTS.push(BARN, PASTURE);
const CIRCLES = [{ x: PLACES.gampel.cx, y: PLACES.gampel.cy, r: PLACES.gampel.r }];
const TREES = [];
const LAMPS = [];
const BENCHES = [{ x: 660, y: 948 }, { x: 830, y: 948 }, { x: 1300, y: 940 }, { x: 1950, y: 1270 }, { x: BENCH.x, y: BENCH.y, hill: true }];

function blockedAt(x, y, r) {
  if (x < r || y < r || x > WORLD_W - r || y > WORLD_H - r) return true;
  for (const b of RECTS) if (x > b.x - r && x < b.x + b.w + r && y > b.y - r && y < b.y + b.h + r) return true;
  for (const ci of CIRCLES) { const dx = x - ci.x, dy = y - ci.y, rr = ci.r + r; if (dx * dx + dy * dy < rr * rr) return true; }
  const lx = (x - LAKE.cx) / (LAKE.rx - 8 + r), ly = (y - LAKE.cy) / (LAKE.ry - 8 + r);
  if (lx * lx + ly * ly < 1) return true;
  for (const t of TREES) { const dx = x - t.x, dy = y - t.y, rr = 9 + r; if (dx * dx + dy * dy < rr * rr) return true; }
  return false;
}

(function plantTrees() {
  const r = seeded(20260826);
  const keepClear = [[1000, 1080], [1640, 850], [820, 930], [1330, 820], [1600, 1322], [380, 1240], [2120, 352]];
  const ok = (x, y) => {
    if (x < 30 || y < 30 || x > WORLD_W - 30 || y > WORLD_H - 30) return false;
    for (const b of RECTS) if (x > b.x - 46 && x < b.x + b.w + 46 && y > b.y - 30 && y < b.y + b.h + 34) return false;
    if (dist(x, y, PLACES.gampel.cx, PLACES.gampel.cy) < PLACES.gampel.r + 50) return false;
    const lx = (x - LAKE.cx) / (LAKE.rx + 95), ly = (y - LAKE.cy) / (LAKE.ry + 95);
    if (lx * lx + ly * ly < 1) return false;
    const hx = (x - HILL.cx) / HILL.rx, hy = (y - HILL.cy) / HILL.ry;
    if (hx * hx + hy * hy < 1) return false;
    if (x > FIELD.x - 30 && x < FIELD.x + FIELD.w + 30 && y > FIELD.y - 30 && y < FIELD.y + FIELD.h + 30) return false;
    if (onPath(x, y, 26)) return false;
    for (const [kx, ky] of keepClear) if (dist(x, y, kx, ky) < 70) return false;
    for (const t of TREES) if (dist(x, y, t.x, t.y) < 46) return false;
    for (const p of Object.values(PLACES)) if (dist(x, y, p.door.x, p.door.y) < 80) return false;
    return true;
  };
  // tidy rows along Fairfield Way first, then a scattered canopy
  for (let x = 640; x <= 1700; x += 96) {
    for (const y of [812, 952]) { const jx = x + (r() - 0.5) * 18; if (ok(jx, y)) TREES.push({ x: jx, y, s: 0.85 + r() * 0.25, v: r() }); }
  }
  for (let i = 0; i < 900 && TREES.length < 170; i++) {
    const x = r() * WORLD_W, y = r() * WORLD_H;
    if (ok(x, y)) TREES.push({ x, y, s: 0.8 + r() * 0.55, v: r() });
  }
  TREES.sort((a, b) => a.y - b.y);
})();

(function placeLamps() {
  for (let k = 0; k < 16; k += 2) {
    const [nx, ny] = NODES['L' + k], a = Math.atan2(ny - LAKE.cy, nx - LAKE.cx);
    LAMPS.push({ x: nx + Math.cos(a) * 26, y: ny + Math.sin(a) * 26 });
  }
  for (const [a, b, w] of EDGES) {
    if (w < 40 || (a[0] === 'L' && b[0] === 'L')) continue;
    const A = NODES[a], B = NODES[b], len = dist(A[0], A[1], B[0], B[1]);
    if (len < 120) continue;
    const nx = -(B[1] - A[1]) / len, ny = (B[0] - A[0]) / len;
    const n = Math.max(1, Math.floor(len / 170));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, s = i % 2 ? 1 : -1;
      const x = lerp(A[0], B[0], t) + nx * (w / 2 + 10) * s, y = lerp(A[1], B[1], t) + ny * (w / 2 + 10) * s;
      if (blockedAt(x, y, 4) || LAMPS.some(l => dist(l.x, l.y, x, y) < 80)) continue;
      LAMPS.push({ x, y });
    }
  }
})();

/* ---------------- Pathfinding grid (A*) ---------------- */
const GW = Math.ceil(WORLD_W / CELL), GH = Math.ceil(WORLD_H / CELL);
const GRID = new Uint8Array(GW * GH);
for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) GRID[gy * GW + gx] = blockedAt(gx * CELL + CELL / 2, gy * CELL + CELL / 2, GRID_R) ? 1 : 0;

function nearestFreeCell(x, y) {
  const cx = clamp(Math.floor(x / CELL), 0, GW - 1), cy = clamp(Math.floor(y / CELL), 0, GH - 1);
  if (!GRID[cy * GW + cx]) return cy * GW + cx;
  for (let rad = 1; rad < 14; rad++) {
    let best = -1, bd = 1e9;
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
      const gx = cx + dx, gy = cy + dy;
      if (gx < 0 || gy < 0 || gx >= GW || gy >= GH || GRID[gy * GW + gx]) continue;
      const d = dist(gx * CELL + CELL / 2, gy * CELL + CELL / 2, x, y);
      if (d < bd) { bd = d; best = gy * GW + gx; }
    }
    if (best >= 0) return best;
  }
  return -1;
}

function findPath(sx, sy, tx, ty) {
  const s = nearestFreeCell(sx, sy), t = nearestFreeCell(tx, ty);
  if (s < 0 || t < 0) return null;
  const N = GW * GH;
  const g = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const heap = [];
  const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  const tx0 = t % GW, ty0 = Math.floor(t / GW);
  const h = i => { const dx = Math.abs(i % GW - tx0), dy = Math.abs(Math.floor(i / GW) - ty0); return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy); };
  g[s] = 0; push(h(s), s);
  let found = false;
  while (heap.length) {
    const [, cur] = pop();
    if (closed[cur]) continue;
    if (cur === t) { found = true; break; }
    closed[cur] = 1;
    const cx = cur % GW, cy = Math.floor(cur / GW);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const ni = ny * GW + nx;
      if (GRID[ni] || closed[ni]) continue;
      if (dx && dy && (GRID[cy * GW + nx] || GRID[ny * GW + cx])) continue;
      const ng = g[cur] + (dx && dy ? Math.SQRT2 : 1);
      if (ng < g[ni]) { g[ni] = ng; from[ni] = cur; push(ng + h(ni), ni); }
    }
  }
  if (!found) return null;
  const cells = [];
  for (let i = t; i !== -1; i = from[i]) cells.push(i);
  cells.reverse();
  const pts = cells.map(i => ({ x: (i % GW) * CELL + CELL / 2, y: Math.floor(i / GW) * CELL + CELL / 2 }));
  if (!blockedAt(tx, ty, PLAYER_R + 1)) pts.push({ x: tx, y: ty });
  // string-pull: skip waypoints that are directly visible
  const out = [];
  let ax = sx, ay = sy, i = 0;
  while (i < pts.length) {
    let j = pts.length - 1;
    while (j > i && !lineClear(ax, ay, pts[j].x, pts[j].y)) j--;
    out.push(pts[j]);
    ax = pts[j].x; ay = pts[j].y; i = j + 1;
  }
  return out;
}
function lineClear(ax, ay, bx, by) {
  const d = dist(ax, ay, bx, by), n = Math.ceil(d / 6);
  for (let k = 1; k <= n; k++) { const t = k / n; if (blockedAt(lerp(ax, bx, t), lerp(ay, by, t), PLAYER_R + 1)) return false; }
  return true;
}

/* ---------------- World state ---------------- */
const World = {
  player: { x: 770, y: 1300, dir: 'down', anim: 0, moving: false, path: null, pending: null, stuck: 0 },
  cam: { x: 0, y: 0, zoom: 1 },
  npcs: [],          // interactive NPCs registered by story.js
  targets: [],       // door/spot interactables registered by story.js
  near: null,
  fx: [],
  tapMark: null,
  walkers: [],
  squirrels: [],
  geese: [],
  cows: [],
  jon: { x: 900, y: 902, dir: 1, anim: 0, moving: false, pause: 0, goal: 1600, hx: 860, hy: 872, hdir: 'right', hanim: 0 },
  titlePan: 0,
  onActivate: null,  // set by story.js: async (target) => {}

  init() {
    const r = seeded(77);
    const nodeKeys = Object.keys(NODES);
    for (let i = 0; i < 18; i++) {
      const a = nodeKeys[Math.floor(r() * nodeKeys.length)], nb = ADJ[a];
      const b = nb[Math.floor(r() * nb.length)];
      this.walkers.push({ look: randomLook(r), a, b, t: r(), off: (r() - 0.5), speed: 40 + r() * 30, anim: r() * 6, night: i % 2 === 0 });
    }
    const homes = TREES.filter((t, i) => i % 9 === 0).slice(0, 9);
    for (const t of homes) this.squirrels.push({ x: t.x + 20, y: t.y + 14, hx: t.x + 20, hy: t.y + 14, tx: t.x + 20, ty: t.y + 14, face: 1, t: r() * 5, wait: r() * 3 });
    for (let i = 0; i < 4; i++) this.geese.push({ a: r() * TAU, rr: 0.35 + r() * 0.45, sp: (0.05 + r() * 0.05) * (r() < 0.5 ? -1 : 1), t: r() * 5 });
    for (let i = 0; i < 4; i++) this.cows.push({ x: PASTURE.x + 40 + r() * (PASTURE.w - 80), y: PASTURE.y + 50 + r() * (PASTURE.h - 70), tx: 0, ty: 0, face: r() < 0.5 ? -1 : 1, wait: r() * 4, t: r() * 5 });
    this.cows.forEach(c => { c.tx = c.x; c.ty = c.y; });
  },

  zoomFor() { return clamp(Math.min(view.w, view.h) / 660, 0.5, 1.6); },

  placePlayer(x, y, dir) {
    const p = this.player;
    p.x = x; p.y = y; p.dir = dir || 'down'; p.path = null; p.pending = null; p.moving = false;
    this.snapCamera();
  },
  snapCamera() {
    const z = this.zoomFor();
    this.cam.zoom = z;
    this.cam.x = this.player.x - view.w / z / 2;
    this.cam.y = this.player.y - view.h / z / 2;
    this.clampCam();
  },
  clampCam() {
    const z = this.cam.zoom, vw = view.w / z, vh = view.h / z;
    this.cam.x = vw >= WORLD_W ? (WORLD_W - vw) / 2 : clamp(this.cam.x, 0, WORLD_W - vw);
    this.cam.y = vh >= WORLD_H ? (WORLD_H - vh) / 2 : clamp(this.cam.y, 0, WORLD_H - vh);
  },
  toWorld(sx, sy) { return { x: this.cam.x + sx / this.cam.zoom, y: this.cam.y + sy / this.cam.zoom }; },
  toScreen(wx, wy) { return { x: (wx - this.cam.x) * this.cam.zoom, y: (wy - this.cam.y) * this.cam.zoom }; },

  jonVisible() { return G.time >= 660 && G.time < 1020; },

  interactables() {
    const list = [];
    for (const t of this.targets) if (!t.visible || t.visible()) list.push(t);
    for (const n of this.npcs) if (!n.inert && (!n.visible || n.visible())) list.push(n);
    return list;
  },

  update(dt, live) {
    const p = this.player;
    this.updateAmbient(dt);
    if (!live) { p.moving = false; this.near = null; return; }

    let mx = 0, my = 0;
    const K = Input.keys;
    if (K.has('arrowleft') || K.has('ArrowLeft') || K.has('a')) mx -= 1;
    if (K.has('arrowright') || K.has('ArrowRight') || K.has('d')) mx += 1;
    if (K.has('arrowup') || K.has('ArrowUp') || K.has('w')) my -= 1;
    if (K.has('arrowdown') || K.has('ArrowDown') || K.has('s')) my += 1;
    const speed = (G.stats.energy < 20 ? 125 : 175) * (K.has('Shift') ? 1.35 : 1);
    let moved = false;
    if (mx || my) {
      p.path = null; p.pending = null;
      const l = Math.hypot(mx, my);
      moved = this.moveBy(mx / l * speed * dt, my / l * speed * dt);
      this.face(mx, my);
    } else if (p.path && p.path.length) {
      const wp = p.path[0];
      const dx = wp.x - p.x, dy = wp.y - p.y, d = Math.hypot(dx, dy);
      const step = speed * dt;
      if (d <= step) {
        if (!blockedAt(wp.x, wp.y, PLAYER_R)) { p.x = wp.x; p.y = wp.y; }
        p.path.shift();
        moved = d > 0.01;
      } else {
        moved = this.moveBy(dx / d * step, dy / d * step);
        this.face(dx, dy);
      }
      if (!moved && d > step) { p.stuck += dt; if (p.stuck > 0.4) { p.path = null; p.stuck = 0; } } else p.stuck = 0;
      if (p.path && !p.path.length) {
        p.path = null;
        const tgt = p.pending;
        p.pending = null;
        if (tgt && dist(p.x, p.y, tgt.x, tgt.y) < (tgt.r || 56) + 10) { this.activate(tgt); }
      }
    }
    p.moving = moved;
    if (moved) p.anim += speed * dt / 7;

    // nearest interactable
    let best = null, bd = 1e9;
    for (const t of this.interactables()) {
      const d = dist(p.x, p.y, t.x, t.y);
      if (d < (t.r || 56) && d < bd) { bd = d; best = t; }
    }
    this.near = best;
  },

  moveBy(dx, dy) {
    const p = this.player;
    const ox = p.x, oy = p.y;
    if (!blockedAt(p.x + dx, p.y + dy, PLAYER_R)) { p.x += dx; p.y += dy; }
    else {
      if (!blockedAt(p.x + dx, p.y, PLAYER_R)) p.x += dx;
      if (!blockedAt(p.x, p.y + dy, PLAYER_R)) p.y += dy;
    }
    return Math.abs(p.x - ox) + Math.abs(p.y - oy) > 0.01;
  },
  face(dx, dy) {
    const p = this.player;
    if (Math.abs(dx) > Math.abs(dy) * 1.1) p.dir = dx < 0 ? 'left' : 'right';
    else if (Math.abs(dy) > 0.01) p.dir = dy < 0 ? 'up' : 'down';
  },

  updateCamera(dt) {
    const z = this.zoomFor();
    this.cam.zoom = z;
    const vw = view.w / z, vh = view.h / z;
    const tx = this.player.x - vw / 2, ty = this.player.y - vh / 2;
    const k = 1 - Math.pow(0.0015, dt);
    this.cam.x = lerp(this.cam.x, tx, k);
    this.cam.y = lerp(this.cam.y, ty, k);
    this.clampCam();
  },

  updateTitle(dt) {
    this.titlePan += dt;
    const z = this.zoomFor();
    this.cam.zoom = z;
    const t = this.titlePan * 0.035;
    this.cam.x = 600 + Math.sin(t) * 520 - view.w / z / 2 + 500;
    this.cam.y = 900 + Math.sin(t * 0.7) * 260 - view.h / z / 2;
    this.clampCam();
    this.updateAmbient(dt);
  },

  updateAmbient(dt) {
    const night = G.time >= 21 * 60;
    for (const w of this.walkers) {
      w.hidden = night && w.night;
      const A = NODES[w.a], B = NODES[w.b];
      const len = Math.max(1, dist(A[0], A[1], B[0], B[1]));
      w.t += w.speed * dt / len;
      w.anim += w.speed * dt / 7;
      if (w.t >= 1) {
        const opts = ADJ[w.b].filter(n => n !== w.a);
        const next = opts.length ? opts[Math.floor(Math.random() * opts.length)] : w.a;
        w.a = w.b; w.b = next; w.t = 0;
      }
    }
    const p = this.player;
    for (const s of this.squirrels) {
      s.t += dt;
      const flee = dist(s.x, s.y, p.x, p.y) < 70;
      if (flee && !s.fleeing) {
        const a = Math.atan2(s.y - p.y, s.x - p.x) + rand(-0.6, 0.6);
        s.tx = clamp(s.x + Math.cos(a) * 110, 20, WORLD_W - 20); s.ty = clamp(s.y + Math.sin(a) * 110, 20, WORLD_H - 20);
        s.fleeing = true;
      }
      const d = dist(s.x, s.y, s.tx, s.ty);
      if (d > 2) {
        const sp = s.fleeing ? 240 : 120;
        s.x += (s.tx - s.x) / d * Math.min(d, sp * dt); s.y += (s.ty - s.y) / d * Math.min(d, sp * dt);
        s.face = s.tx > s.x ? 1 : -1; s.moving = true;
      } else {
        s.moving = false; s.fleeing = false;
        s.wait -= dt;
        if (s.wait <= 0) { s.wait = rand(1.5, 5); s.tx = s.hx + rand(-60, 60); s.ty = s.hy + rand(-40, 40); }
      }
    }
    for (const g of this.geese) { g.a += g.sp * dt; g.t += dt; }
    for (const c of this.cows) {
      c.t += dt;
      const d = dist(c.x, c.y, c.tx, c.ty);
      if (d > 2) { c.x += (c.tx - c.x) / d * Math.min(d, 14 * dt); c.y += (c.ty - c.y) / d * Math.min(d, 14 * dt); c.face = c.tx > c.x ? 1 : -1; }
      else { c.wait -= dt; if (c.wait <= 0) { c.wait = rand(4, 9); c.tx = PASTURE.x + 40 + Math.random() * (PASTURE.w - 80); c.ty = PASTURE.y + 50 + Math.random() * (PASTURE.h - 70); } }
    }
    // Jonathan patrols Fairfield Way with his handler
    const j = this.jon;
    if (j.pause > 0) { j.pause -= dt; j.moving = false; }
    else {
      const dx = j.goal - j.x;
      if (Math.abs(dx) < 2) { j.pause = rand(2, 4.5); j.goal = j.goal > 1200 ? rand(760, 1000) : rand(1450, 1680); }
      else { const s = Math.sign(dx) * Math.min(Math.abs(dx), 40 * dt); j.x += s; j.dir = Math.sign(dx); j.moving = true; j.anim += 40 * dt / 5; }
    }
    const hx = j.x - j.dir * 34, hy = 872;
    const hd = Math.hypot(hx - j.hx, hy - j.hy);
    if (hd > 1) { const s = Math.min(hd, 46 * dt); j.hx += (hx - j.hx) / hd * s; j.hy += (hy - j.hy) / hd * s; j.hdir = hx > j.hx ? 'right' : 'left'; j.hanim += s / 7; j.hmoving = true; }
    else j.hmoving = false;
    for (const n of this.npcs) if (n.update) n.update(dt);
    this.fx = this.fx.filter(f => (f.t += dt) < f.life);
  },

  float(text, color, x, y) {
    this.fx.push({ text, color: color || '#FFC94A', x: x != null ? x : this.player.x, y: y != null ? y : this.player.y - 70, t: 0, life: 1.6 });
  },

  key(k) {
    if (k === 'e' || k === 'Enter' || k === ' ') { if (this.near) this.activate(this.near); return; }
    if (k === 'm') BigMap.show();
  },

  tap(sx, sy) {
    const w = this.toWorld(sx, sy);
    let hit = null;
    for (const t of this.interactables()) {
      if (t.hit ? t.hit(w.x, w.y) : dist(w.x, w.y, t.x, t.y - 26) < 34) { hit = t; break; }
    }
    if (hit && dist(this.player.x, this.player.y, hit.x, hit.y) < (hit.r || 56)) { this.activate(hit); return; }
    const gx = hit ? hit.x : w.x, gy = hit ? hit.y + (hit.npc ? 24 : 0) : w.y;
    this.walkTo(gx, gy, hit);
  },

  walkTo(x, y, target) {
    const p = this.player;
    const path = findPath(p.x, p.y, x, y);
    if (!path) { Sound.play('bad'); return false; }
    p.path = path; p.pending = target || null; p.stuck = 0;
    this.tapMark = { x: target ? target.x : x, y: target ? target.y : y, t: 0 };
    Sound.play('tick');
    return true;
  },

  activate(t) {
    if (G.busy || !this.onActivate) return;
    this.player.path = null; this.player.pending = null; this.player.moving = false;
    this.onActivate(t);
  },
};
