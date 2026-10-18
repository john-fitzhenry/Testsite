'use strict';
/* Jaret's First Day — campus rendering, day/night lighting, minimap and the full map. */

const EDGE_W = {};
for (const [a, b, w] of EDGES) { EDGE_W[a + '|' + b] = w; EDGE_W[b + '|' + a] = w; }

const grassTile = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = '#5E9E48'; g.fillRect(0, 0, 96, 96);
  const r = seeded(5);
  for (let i = 0; i < 280; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(36,86,28,.22)' : 'rgba(160,210,96,.18)';
    g.fillRect(r() * 96, r() * 96, 1.5, 3 + r() * 3);
  }
  return c;
})();
const lightCv = document.createElement('canvas');
const lightCtx = lightCv.getContext('2d');

for (const t of TREES) {
  const base = t.v < 0.33 ? '#3F7F3A' : t.v < 0.66 ? '#4A8C3E' : '#3A7448';
  t.c1 = base; t.c0 = shade(base, -0.2); t.pine = t.v > 0.86;
}

function lightLevels(m) {
  const h = m / 60;
  let warm = 0, dark = 0;
  if (h < 8.6) warm = (8.6 - h) * 0.1;
  if (h >= 16.5 && h < 19.6) warm = (h - 16.5) / 3.1 * 0.2;
  else if (h >= 19.6) warm = Math.max(0, 0.2 - (h - 19.6) * 0.18);
  if (h >= 19.4) dark = clamp((h - 19.4) / 1.5, 0, 1) * 0.62;
  return { warm, dark };
}

function drawTree(c, t, fade) {
  const s = t.s, x = t.x, y = t.y;
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x + 8 * s, y + 2, 26 * s, 9 * s, 0, 0, TAU); c.fill();
  c.fillStyle = '#6B4A2E'; c.fillRect(x - 4 * s, y - 24 * s, 8 * s, 24 * s);
  if (fade) c.globalAlpha = 0.45;
  if (t.pine) {
    for (let i = 0; i < 3; i++) {
      c.fillStyle = i % 2 ? '#2F6A3A' : '#2A5E34';
      c.beginPath(); c.moveTo(x - (30 - i * 7) * s, y - (16 + i * 18) * s); c.lineTo(x + (30 - i * 7) * s, y - (16 + i * 18) * s); c.lineTo(x, y - (50 + i * 18) * s); c.closePath(); c.fill();
    }
  } else {
    c.fillStyle = t.c0; c.beginPath(); c.arc(x, y - 42 * s, 30 * s, 0, TAU); c.fill();
    c.fillStyle = t.c1;
    c.beginPath(); c.arc(x - 12 * s, y - 47 * s, 20 * s, 0, TAU); c.arc(x + 12 * s, y - 49 * s, 19 * s, 0, TAU); c.arc(x, y - 60 * s, 20 * s, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(x - 6 * s, y - 64 * s, 9 * s, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
}

function drawLamp(c, l, on) {
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(l.x + 2, l.y, 6, 2.5, 0, 0, TAU); c.fill();
  c.fillStyle = '#2E3444'; c.fillRect(l.x - 1.6, l.y - 46, 3.2, 46);
  c.fillStyle = on ? '#FFE7A0' : '#DCE2EA'; rrect(c, l.x - 5, l.y - 54, 10, 10, 3); c.fill();
  c.fillStyle = '#2E3444'; c.fillRect(l.x - 6, l.y - 56, 12, 3);
}

function drawBench(c, b) {
  const w = b.hill ? 40 : 30;
  c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(b.x - w / 2 + 3, b.y + 1, w, 4);
  c.fillStyle = '#3A3F4E'; c.fillRect(b.x - w / 2 + 2, b.y - 8, 3, 9); c.fillRect(b.x + w / 2 - 5, b.y - 8, 3, 9);
  c.fillStyle = '#9A6A3E'; c.fillRect(b.x - w / 2, b.y - 10, w, 4); c.fillRect(b.x - w / 2, b.y - 18, w, 4);
}

function drawBuilding(c, key, b, night) {
  const roofH = b.h - b.wallH, wy = b.y + roofH;
  c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(b.x + 12, b.y + 16, b.w, b.h);
  // wall
  c.fillStyle = b.wall; c.fillRect(b.x, wy, b.w, b.wallH);
  const brick = b.style === 'brick' || b.style === 'laurel';
  if (brick) {
    c.fillStyle = 'rgba(0,0,0,.08)';
    for (let yy = wy + 6; yy < b.y + b.h; yy += 6) c.fillRect(b.x, yy, b.w, 1);
  }
  let copperW = 0;
  if (b.style === 'laurel') {
    copperW = Math.round(b.w * 0.42);
    c.fillStyle = '#C27A48'; c.fillRect(b.x, wy, copperW, b.wallH);
    c.fillStyle = 'rgba(0,0,0,.12)'; for (let xx = b.x + 12; xx < b.x + copperW; xx += 12) c.fillRect(xx, wy, 1.4, b.wallH);
    c.fillStyle = 'rgba(70,170,140,.18)'; c.fillRect(b.x, wy, copperW, 8);
  }
  if (b.style === 'library') { c.fillStyle = 'rgba(0,0,0,.1)'; for (let xx = b.x + 9; xx < b.x + b.w; xx += 18) c.fillRect(xx, wy, 3, b.wallH); }
  // windows
  const dX = b.side === 'S' ? b.door.x : -999;
  const rows = Math.max(1, Math.floor((b.wallH - 16) / 22));
  const tall = b.style === 'library' || b.style === 'dining' || b.style === 'union';
  for (let r = 0; r < rows; r++) {
    for (let xx = b.x + copperW + 12; xx + 16 < b.x + b.w - 6; xx += tall ? 24 : 28) {
      if (Math.abs(xx + 8 - dX) < 34) continue;
      const wy2 = wy + 9 + r * 22, wh = tall && rows === 1 ? b.wallH - 26 : 13;
      const lit = night && ((xx * 7 + r * 13 + key.length) % 5 !== 0);
      c.fillStyle = lit ? '#FFD97A' : night ? '#2A3550' : '#A9CBE8';
      c.fillRect(xx, wy2, tall ? 14 : 16, wh);
      if (!night) { c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(xx + 2, wy2 + 2, 3, Math.max(3, wh - 6)); }
    }
  }
  // roof
  c.fillStyle = b.roof; c.fillRect(b.x, b.y, b.w, roofH);
  if (b.style === 'laurel') {
    c.fillStyle = '#5C944A';
    const r = seeded(9);
    for (let i = 0; i < 60; i++) { c.beginPath(); c.arc(b.x + 8 + r() * (b.w - 16), b.y + 8 + r() * (roofH - 16), 3 + r() * 4, 0, TAU); c.fill(); }
    c.fillStyle = '#B87A4B'; c.fillRect(b.x, b.y, copperW, roofH);
  }
  if (b.style === 'dairy') {
    c.fillStyle = 'rgba(255,255,255,.18)'; for (let yy = b.y + 8; yy < wy; yy += 12) c.fillRect(b.x, yy, b.w, 2);
  }
  c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 4; c.strokeRect(b.x + 2, b.y + 2, b.w - 4, roofH - 4);
  c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(b.x, wy - 4, b.w, 4);
  if (b.style !== 'laurel' && b.style !== 'dairy') {
    const r = seeded(key.length * 31 + b.x);
    c.fillStyle = 'rgba(0,0,0,.14)';
    for (let i = 0; i < 3; i++) { const bx = b.x + 20 + r() * (b.w - 70), by = b.y + 14 + r() * Math.max(4, roofH - 50); c.fillRect(bx, by, 26 + r() * 16, 16 + r() * 8); }
  }
  if (b.style === 'union') { c.fillStyle = 'rgba(160,210,240,.55)'; c.fillRect(b.x + 40, b.y + roofH / 2 - 8, b.w - 80, 16); }
  // entrance
  const navy = '#13306E';
  if (b.side === 'S') {
    const dx = b.door.x, by = b.y + b.h;
    c.fillStyle = '#7A3434'; c.fillRect(dx - 20, by, 40, 6);
    c.fillStyle = night ? '#FFE3A0' : '#2E3E5C'; c.fillRect(dx - 15, by - 28, 30, 28);
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(dx - 1, by - 28, 2, 28);
    if (b.style === 'dairy') {
      for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#FFFFFF' : '#C8102E'; c.fillRect(dx - 30 + i * 10, by - 38, 10, 10); }
    } else { c.fillStyle = navy; c.fillRect(dx - 26, by - 36, 52, 8); }
  } else if (b.side === 'N') {
    const dx = b.door.x;
    c.fillStyle = '#7A3434'; c.fillRect(dx - 20, b.y - 22, 40, 8);
    c.fillStyle = navy; c.fillRect(dx - 26, b.y - 14, 52, 18);
    c.fillStyle = '#FFFFFF'; c.fillRect(dx - 26, b.y - 14, 52, 3);
  } else if (b.side === 'W') {
    const dy = b.door.y;
    c.fillStyle = '#7A3434'; c.fillRect(b.x - 26, dy - 20, 8, 40);
    c.fillStyle = navy; c.fillRect(b.x - 16, dy - 28, 20, 56);
    c.fillStyle = '#FFFFFF'; c.fillRect(b.x - 16, dy - 28, 3, 56);
  }
  if (b.style === 'dairy') drawIcon(c, 'cone', b.x + b.w / 2, b.y + roofH / 2 - 2, 42);
  // name on the roof
  const label = b.name.toUpperCase();
  c.font = '400 15px ' + FONT.d; c.textAlign = 'center'; c.textBaseline = 'middle';
  const ly = b.style === 'dairy' ? b.y + roofH - 14 : b.y + roofH / 2 + (b.style === 'union' ? 22 : 0);
  c.lineWidth = 4; c.strokeStyle = 'rgba(10,22,56,.85)'; c.strokeText(label, b.x + b.w / 2, ly);
  c.fillStyle = '#FFFFFF'; c.fillText(label, b.x + b.w / 2, ly);
}

function drawGampel(c, night) {
  const g = PLACES.gampel, x = g.cx, y = g.cy, r = g.r;
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x + 14, y + 18, r, r, 0, 0, TAU); c.fill();
  c.fillStyle = '#C9CED6'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  const gr = c.createRadialGradient(x - 50, y - 60, 10, x, y, r);
  gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.55, '#C5CEDA'); gr.addColorStop(1, '#8D99AA');
  c.fillStyle = gr; c.beginPath(); c.arc(x, y, r - 12, 0, TAU); c.fill();
  c.strokeStyle = '#13306E'; c.lineWidth = 10; c.beginPath(); c.arc(x, y, r - 6, 0, TAU); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
  for (let i = 0; i < 16; i++) { const a = i * TAU / 16; c.beginPath(); c.moveTo(x + Math.cos(a) * 22, y + Math.sin(a) * 22); c.lineTo(x + Math.cos(a) * (r - 14), y + Math.sin(a) * (r - 14)); c.stroke(); }
  c.fillStyle = '#EEF2F6'; c.beginPath(); c.arc(x, y, 22, 0, TAU); c.fill();
  // entrance on the south side
  c.fillStyle = '#7A3434'; c.fillRect(x - 22, y + r + 8, 44, 7);
  c.fillStyle = '#D9DDE3'; c.fillRect(x - 46, y + r - 22, 92, 30);
  c.fillStyle = night ? '#FFE3A0' : '#2E3E5C'; c.fillRect(x - 32, y + r - 14, 64, 22);
  c.fillStyle = '#13306E'; c.fillRect(x - 52, y + r - 26, 104, 8);
  c.font = '400 17px ' + FONT.d; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = 4; c.strokeStyle = 'rgba(10,22,56,.85)'; c.strokeText('GAMPEL PAVILION', x, y - 46);
  c.fillStyle = '#FFFFFF'; c.fillText('GAMPEL PAVILION', x, y - 46);
}

function drawBarn(c) {
  const b = BARN;
  c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(b.x + 12, b.y + 14, b.w, b.h);
  c.fillStyle = '#A8302A'; c.fillRect(b.x, b.y + 60, b.w, b.h - 60);
  c.fillStyle = '#5A3A30'; c.fillRect(b.x, b.y, b.w, 60);
  c.fillStyle = 'rgba(255,255,255,.12)'; for (let xx = b.x + 10; xx < b.x + b.w; xx += 20) c.fillRect(xx, b.y, 2, 60);
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 3;
  const dx = b.x + b.w / 2 - 24, dy = b.y + 74;
  c.strokeRect(dx, dy, 48, b.h - 74); c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx + 48, b.y + b.h); c.moveTo(dx + 48, dy); c.lineTo(dx, b.y + b.h); c.stroke();
}

function drawFence(c, front) {
  const P = PASTURE;
  c.strokeStyle = '#E8E2D4'; c.lineWidth = 3;
  const posts = (x1, y1, x2, y2) => {
    const n = Math.max(1, Math.round(dist(x1, y1, x2, y2) / 30));
    c.beginPath(); c.moveTo(x1, y1 - 8); c.lineTo(x2, y2 - 8); c.moveTo(x1, y1 - 15); c.lineTo(x2, y2 - 15); c.stroke();
    c.fillStyle = '#8A6A4A';
    for (let i = 0; i <= n; i++) { const t = i / n; c.fillRect(lerp(x1, x2, t) - 2, lerp(y1, y2, t) - 20, 4, 20); }
  };
  if (front) posts(P.x, P.y + P.h, P.x + P.w, P.y + P.h);
  else { posts(P.x, P.y, P.x + P.w, P.y); posts(P.x, P.y, P.x, P.y + P.h); posts(P.x + P.w, P.y, P.x + P.w, P.y + P.h); }
}

/* Everything on the ground that never moves. It is rendered once into cached tiles. */
function drawGroundStatic(c, vx, vy, vw, vh) {
  c.fillStyle = c.createPattern(grassTile, 'repeat'); c.fillRect(vx - 2, vy - 2, vw + 4, vh + 4);
  // intramural fields
  const F = FIELD;
  for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#63A94D' : '#5BA046'; c.fillRect(F.x + i * F.w / 8, F.y, F.w / 8 + 1, F.h); }
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3;
  c.strokeRect(F.x + 10, F.y + 10, F.w - 20, F.h - 20);
  c.beginPath(); c.moveTo(F.x + F.w / 2, F.y + 10); c.lineTo(F.x + F.w / 2, F.y + F.h - 10); c.stroke();
  c.beginPath(); c.arc(F.x + F.w / 2, F.y + F.h / 2, 46, 0, TAU); c.stroke();
  c.strokeRect(F.x + 10, F.y + F.h / 2 - 70, 70, 140); c.strokeRect(F.x + F.w - 80, F.y + F.h / 2 - 70, 70, 140);
  // Horsebarn Hill
  const H = HILL;
  const hg = c.createRadialGradient(H.cx - 40, H.cy - 30, 20, H.cx, H.cy, H.rx);
  hg.addColorStop(0, '#9CCB6A'); hg.addColorStop(0.7, '#7DB45A'); hg.addColorStop(1, 'rgba(94,158,72,0)');
  c.fillStyle = hg; c.beginPath(); c.ellipse(H.cx, H.cy, H.rx, H.ry, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 2;
  for (let i = 1; i <= 4; i++) { c.beginPath(); c.ellipse(H.cx - 20, H.cy - 10, H.rx * i / 5, H.ry * i / 5, 0, 0, TAU); c.stroke(); }
  // paths
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = '#B9B2A2';
  for (const [a, b, w] of EDGES) { const A = NODES[a], B = NODES[b]; c.lineWidth = w + 6; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); }
  c.fillStyle = '#B9B2A2'; c.fillRect(517, 823, 446, 116); c.beginPath(); c.arc(1720, 880, 73, 0, TAU); c.fill();
  c.strokeStyle = '#E4DED1';
  for (const [a, b, w] of EDGES) { const A = NODES[a], B = NODES[b]; c.lineWidth = w; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); }
  c.fillStyle = '#E4DED1'; c.fillRect(520, 826, 440, 110); c.beginPath(); c.arc(1720, 880, 70, 0, TAU); c.fill();
  // brick banding on Fairfield Way + plaza grid
  c.fillStyle = 'rgba(150,80,60,.22)';
  for (let x = 620; x < 1700; x += 40) c.fillRect(x, 846, 4, 68);
  c.strokeStyle = 'rgba(0,0,0,.06)'; c.lineWidth = 1;
  for (let x = 540; x < 960; x += 30) { c.beginPath(); c.moveTo(x, 826); c.lineTo(x, 936); c.stroke(); }
  c.strokeStyle = 'rgba(150,80,60,.35)'; c.lineWidth = 6; c.beginPath(); c.arc(1720, 880, 46, 0, TAU); c.stroke();
  // Mirror Lake
  const L = LAKE;
  c.fillStyle = '#8D9C78'; c.beginPath(); c.ellipse(L.cx, L.cy, L.rx + 12, L.ry + 10, 0, 0, TAU); c.fill();
  const lg = c.createLinearGradient(0, L.cy - L.ry, 0, L.cy + L.ry);
  lg.addColorStop(0, '#64B2DC'); lg.addColorStop(1, '#2B6E9E');
  c.fillStyle = lg; c.beginPath(); c.ellipse(L.cx, L.cy, L.rx, L.ry, 0, 0, TAU); c.fill();
  c.strokeStyle = '#A8A496'; c.lineWidth = 4; c.beginPath(); c.ellipse(L.cx, L.cy, L.rx + 2, L.ry + 2, 0, 0, TAU); c.stroke();
  c.fillStyle = '#4F9A4A';
  for (const [lx, ly] of [[1490, 1520], [1510, 1555], [1470, 1470], [1930, 1560]]) { c.beginPath(); c.arc(lx, ly, 9, 0.3, TAU - 0.2); c.lineTo(lx, ly); c.fill(); }
  c.font = '400 14px ' + FONT.d; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText('MIRROR LAKE', L.cx, L.cy + 6);
  c.font = '400 13px ' + FONT.d; c.fillStyle = 'rgba(255,255,255,.7)'; c.fillText('INTRAMURAL FIELDS', F.x + F.w / 2, F.y + F.h + 18);
  c.fillStyle = 'rgba(20,50,20,.55)'; c.fillText('HORSEBARN HILL', H.cx - 40, H.cy + 70);
  c.lineCap = 'butt'; c.lineJoin = 'miter';
}

/* The moving parts of Mirror Lake: glints and swimming geese. */
function drawLakeLive(c, t) {
  const L = LAKE;
  c.save(); c.beginPath(); c.ellipse(L.cx, L.cy, L.rx - 4, L.ry - 4, 0, 0, TAU); c.clip();
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    const px = L.cx - L.rx + ((i * 97 + t * 14) % (L.rx * 2)), py = L.cy - L.ry + 20 + (i * 53) % (L.ry * 2 - 30);
    c.beginPath(); c.moveTo(px, py); c.lineTo(px + 18, py); c.stroke();
  }
  c.restore();
  for (const g of World.geese) {
    const gx = L.cx + Math.cos(g.a) * L.rx * g.rr, gy = L.cy + Math.sin(g.a) * L.ry * g.rr;
    drawGoose(c, gx, gy + 6, Math.cos(g.a) * g.sp < 0 ? 1 : -1, g.t, true);
  }
}

/* Ground tiles: 256 device pixels square, anchored to the world, rebuilt when the zoom changes. */
const GTILE = 256;
const groundTiles = new Map();
let groundScale = 0, groundFrame = 0;
function groundTile(i, j, scale) {
  const key = i + ',' + j;
  let tile = groundTiles.get(key);
  if (!tile) {
    tile = document.createElement('canvas');
    tile.width = tile.height = GTILE;
    const g = tile.getContext('2d');
    g.setTransform(scale, 0, 0, scale, -i * GTILE, -j * GTILE);
    drawGroundStatic(g, i * GTILE / scale, j * GTILE / scale, GTILE / scale, GTILE / scale);
    groundTiles.set(key, tile);
    if (groundTiles.size > 160) {
      let oldK = null, oldU = Infinity;
      for (const [k, v] of groundTiles) if (v._u < oldU) { oldU = v._u; oldK = k; }
      groundTiles.delete(oldK);
    }
  }
  tile._u = groundFrame;
  return tile;
}

World.draw = function (c, t) {
  const z = this.cam.zoom, dpr = view.dpr, scale = z * dpr;
  // snap the camera to whole device pixels so the cached ground tiles line up exactly
  const ox = Math.round(this.cam.x * scale), oy = Math.round(this.cam.y * scale);
  if (scale !== groundScale) { groundTiles.clear(); groundScale = scale; }
  groundFrame++;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#4A8538'; c.fillRect(0, 0, cv.width, cv.height);
  for (let j = Math.floor(oy / GTILE); j <= Math.floor((oy + cv.height) / GTILE); j++)
    for (let i = Math.floor(ox / GTILE); i <= Math.floor((ox + cv.width) / GTILE); i++) c.drawImage(groundTile(i, j, scale), i * GTILE - ox, j * GTILE - oy);
  c.setTransform(scale, 0, 0, scale, -ox, -oy);
  const vx = ox / scale, vy = oy / scale, vw = view.w / z, vh = view.h / z;
  const vis = (x, y, m) => x > vx - m && x < vx + vw + m && y > vy - m && y < vy + vh + m;
  const lv = lightLevels(G.time);
  const night = lv.dark > 0.2;
  drawLakeLive(c, t);

  const list = [];
  const add = (y, fn) => list.push({ y, fn });
  for (const k in PLACES) {
    const b = PLACES[k];
    if (b.spot) continue;
    if (b.round) { if (vis(b.cx, b.cy, b.r + 60)) add(b.cy + b.r * 0.5, () => drawGampel(c, night)); continue; }
    if (b.x < vx + vw + 60 && b.x + b.w > vx - 60 && b.y < vy + vh + 120 && b.y + b.h > vy - 60) add(b.y + b.h, () => drawBuilding(c, k, b, night));
  }
  if (vis(BARN.x + 100, BARN.y + 100, 200)) {
    add(BARN.y + BARN.h, () => drawBarn(c));
    add(PASTURE.y, () => drawFence(c, false));
    add(PASTURE.y + PASTURE.h, () => drawFence(c, true));
    for (const cow of this.cows) add(cow.y, () => drawCow(c, cow.x, cow.y, cow.face, cow.t));
  }
  const p = this.player;
  for (const tr of TREES) if (vis(tr.x, tr.y - 40, 70)) {
    const fade = Math.abs(p.x - tr.x) < 32 * tr.s && p.y < tr.y && p.y > tr.y - 86 * tr.s;
    add(tr.y, () => drawTree(c, tr, fade));
  }
  for (const l of LAMPS) if (vis(l.x, l.y - 30, 40)) add(l.y, () => drawLamp(c, l, lv.dark > 0.05));
  for (const b of BENCHES) if (vis(b.x, b.y, 40)) add(b.y, () => drawBench(c, b));
  for (const w of this.walkers) {
    if (w.hidden) continue;
    const A = NODES[w.a], B = NODES[w.b], ew = EDGE_W[w.a + '|' + w.b] || 40;
    const len = Math.max(1, dist(A[0], A[1], B[0], B[1]));
    const nx = -(B[1] - A[1]) / len, ny = (B[0] - A[0]) / len, off = w.off * (ew - 18);
    const x = lerp(A[0], B[0], w.t) + nx * off, y = lerp(A[1], B[1], w.t) + ny * off;
    if (!vis(x, y, 60)) continue;
    const dx = B[0] - A[0], dy = B[1] - A[1];
    const dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    add(y, () => drawPerson(c, x, y, w.look, dir, w.anim, true));
  }
  for (const s of this.squirrels) if (vis(s.x, s.y, 30)) add(s.y, () => drawSquirrel(c, s.x, s.y, s.face, s.t, s.moving));
  for (const n of this.npcs) {
    if (n.visible && !n.visible()) continue;
    if (!vis(n.x, n.y, 70)) continue;
    add(n.y, () => {
      if (n.kind === 'goose') drawGoose(c, n.x, n.y, n.face || 1, t, false);
      else if (n.kind === 'squirrel') drawSquirrel(c, n.x, n.y, n.face || 1, t, false);
      else drawPerson(c, n.x, n.y, n.look, n.dir || 'down', n.anim || 0, !!n.moving);
      if (n.fresh && n.fresh()) drawBubble(c, n.x, n.y - (n.kind === 'person' || !n.kind ? 72 : 34), t);
    });
  }
  if (this.jonVisible()) {
    const j = this.jon;
    add(j.y, () => drawHusky(c, j.x, j.y, j.dir, j.anim, j.moving, 1));
    add(j.hy, () => drawPerson(c, j.hx, j.hy, LOOKS.handler, j.hdir, j.hanim, j.hmoving));
    if (!G.done.jonathan) add(j.y + 1, () => drawBubble(c, j.x + j.dir * 18, j.y - 56, t));
  }
  if (G.mode !== 'title') add(p.y, () => drawPerson(c, p.x, p.y, LOOKS.jaret, p.dir, p.anim, p.moving));
  list.sort((a, b) => a.y - b.y);
  for (const d of list) d.fn();

  // tap marker
  if (this.tapMark) {
    const m = this.tapMark; m.t += 1 / 60;
    if (m.t > 0.7) this.tapMark = null;
    else { c.strokeStyle = 'rgba(255,201,74,' + (1 - m.t / 0.7) + ')'; c.lineWidth = 3; c.beginPath(); c.ellipse(m.x, m.y, 10 + m.t * 26, 4 + m.t * 10, 0, 0, TAU); c.stroke(); }
  }
  // objective marker
  const obj = G.mode === 'world' && typeof Story !== 'undefined' ? Story.objective() : null;
  if (obj && vis(obj.x, obj.y, -20)) {
    const bob = Math.sin(t * 4) * 5, oy = obj.y - 78 + bob;
    c.fillStyle = '#FFC94A'; c.strokeStyle = '#13306E'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(obj.x - 12, oy - 12); c.lineTo(obj.x + 12, oy - 12); c.lineTo(obj.x, oy + 4); c.closePath(); c.stroke(); c.fill();
  }
  // floating text
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 18px ' + FONT.c;
  for (const f of this.fx) {
    const k = f.t / f.life;
    c.globalAlpha = 1 - k * k;
    c.lineWidth = 4; c.strokeStyle = 'rgba(10,22,56,.9)'; c.strokeText(f.text, f.x, f.y - k * 40);
    c.fillStyle = f.color; c.fillText(f.text, f.x, f.y - k * 40);
  }
  c.globalAlpha = 1;

  // lighting (screen space)
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (lv.warm > 0.005) { c.fillStyle = 'rgba(255,140,60,' + lv.warm.toFixed(3) + ')'; c.fillRect(0, 0, view.w, view.h); }
  if (lv.dark > 0.005) {
    // the light map is soft, so render it at half resolution and scale it up
    const lw = Math.ceil(cv.width / 2), lh = Math.ceil(cv.height / 2), ls = dpr / 2;
    if (lightCv.width !== lw || lightCv.height !== lh) { lightCv.width = lw; lightCv.height = lh; }
    const L = lightCtx;
    L.setTransform(1, 0, 0, 1, 0, 0);
    L.globalCompositeOperation = 'source-over';
    L.clearRect(0, 0, lightCv.width, lightCv.height);
    L.fillStyle = 'rgba(8,16,50,' + lv.dark.toFixed(3) + ')';
    L.fillRect(0, 0, lightCv.width, lightCv.height);
    L.globalCompositeOperation = 'destination-out';
    const hole = (wx, wy, r, a) => {
      const s = this.toScreen(wx, wy), R = r * z;
      if (s.x < -R || s.y < -R || s.x > view.w + R || s.y > view.h + R) return;
      const gx = s.x * ls, gy = s.y * ls, gr = R * ls;
      const g = L.createRadialGradient(gx, gy, 0, gx, gy, gr);
      g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
      L.fillStyle = g; L.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
    };
    for (const l of LAMPS) hole(l.x, l.y - 30, 120, 0.85);
    for (const k in PLACES) { const b = PLACES[k]; hole(b.door.x, b.door.y - 10, 110, 0.8); }
    hole(p.x, p.y - 24, 90, 0.7);
    c.drawImage(lightCv, 0, 0, view.w, view.h);
    c.globalCompositeOperation = 'lighter';
    for (const l of LAMPS) {
      const s = this.toScreen(l.x, l.y - 50);
      if (s.x < -60 || s.y < -60 || s.x > view.w + 60 || s.y > view.h + 60) continue;
      const g = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, 46 * z);
      g.addColorStop(0, 'rgba(255,200,110,' + (0.35 * lv.dark).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,200,110,0)');
      c.fillStyle = g; c.fillRect(s.x - 46 * z, s.y - 46 * z, 92 * z, 92 * z);
    }
    c.globalCompositeOperation = 'source-over';
  }
  // off-screen objective arrow
  if (obj && !vis(obj.x, obj.y, -20)) {
    const s = this.toScreen(obj.x, obj.y);
    const cx = view.w / 2, cy = view.h / 2, a = Math.atan2(s.y - cy, s.x - cx);
    const mx = view.w / 2 - 40, my = view.h / 2 - 40;
    const k = Math.min(Math.abs(mx / Math.cos(a)), Math.abs(my / Math.sin(a)));
    const ax = cx + Math.cos(a) * k, ay = cy + Math.sin(a) * k;
    c.save(); c.translate(ax, ay); c.rotate(a);
    c.fillStyle = '#FFC94A'; c.strokeStyle = '#13306E'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(16, 0); c.lineTo(-10, -13); c.lineTo(-5, 0); c.lineTo(-10, 13); c.closePath(); c.stroke(); c.fill();
    c.restore();
  }
};

function drawBubble(c, x, y, t) {
  const by = y + Math.sin(t * 3 + x) * 2;
  c.fillStyle = '#FFFFFF'; c.strokeStyle = '#13306E'; c.lineWidth = 2;
  rrect(c, x - 9, by - 18, 18, 18, 6); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(x - 4, by); c.lineTo(x, by + 6); c.lineTo(x + 4, by); c.fill();
  c.fillStyle = '#13306E'; c.font = '700 14px ' + FONT.c; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', x, by - 8.5);
}

/* ---------------- Maps ---------------- */
function drawMap(c, w, h, big) {
  const s = Math.min(w / WORLD_W, h / WORLD_H), ox = (w - WORLD_W * s) / 2, oy = (h - WORLD_H * s) / 2;
  c.fillStyle = '#2E5A2E'; c.fillRect(0, 0, w, h);
  c.save(); c.translate(ox, oy); c.scale(s, s);
  c.fillStyle = '#4F8E3E'; c.fillRect(0, 0, WORLD_W, WORLD_H);
  c.fillStyle = '#6FAE54'; c.beginPath(); c.ellipse(HILL.cx, HILL.cy, HILL.rx, HILL.ry, 0, 0, TAU); c.fill();
  c.fillStyle = '#5BA046'; c.fillRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h);
  c.fillStyle = '#3F8FC4'; c.beginPath(); c.ellipse(LAKE.cx, LAKE.cy, LAKE.rx, LAKE.ry, 0, 0, TAU); c.fill();
  c.strokeStyle = '#E4DED1'; c.lineCap = 'round';
  for (const [a, b, ew] of EDGES) { const A = NODES[a], B = NODES[b]; c.lineWidth = Math.max(ew, big ? 26 : 34); c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); }
  c.fillStyle = '#E4DED1'; c.fillRect(520, 826, 440, 110);
  const obj = typeof Story !== 'undefined' ? Story.objective() : null;
  for (const k in PLACES) {
    const b = PLACES[k];
    if (b.spot) continue;
    const isObj = obj && obj.key === k;
    c.fillStyle = isObj ? '#FFC94A' : '#E9EEF6';
    if (b.round) { c.beginPath(); c.arc(b.cx, b.cy, b.r, 0, TAU); c.fill(); }
    else c.fillRect(b.x, b.y, b.w, b.h);
  }
  c.fillStyle = '#A8302A'; c.fillRect(BARN.x, BARN.y, BARN.w, BARN.h);
  if (World.jonVisible()) { c.fillStyle = '#FFFFFF'; c.strokeStyle = '#13306E'; c.lineWidth = 14; c.beginPath(); c.arc(World.jon.x, World.jon.y, 30, 0, TAU); c.fill(); c.stroke(); }
  if (obj) {
    const pulse = 40 + (performance.now() / 12) % 60;
    c.strokeStyle = 'rgba(255,201,74,.9)'; c.lineWidth = 14; c.beginPath(); c.arc(obj.x, obj.y, pulse, 0, TAU); c.stroke();
  }
  const p = World.player;
  c.fillStyle = '#FFC94A'; c.strokeStyle = '#13306E'; c.lineWidth = big ? 10 : 16;
  c.beginPath(); c.arc(p.x, p.y, big ? 30 : 46, 0, TAU); c.fill(); c.stroke();
  if (!big) {
    const z = World.cam.zoom;
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 10; c.strokeRect(World.cam.x, World.cam.y, view.w / z, view.h / z);
  }
  c.restore();
  if (big) {
    c.font = '400 ' + Math.max(10, Math.round(13 * Math.min(1.4, s * 3))) + 'px ' + FONT.d;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const labelAt = (text, x, y) => {
      const sx = ox + x * s, sy = oy + y * s;
      c.lineWidth = 4; c.strokeStyle = 'rgba(10,22,56,.9)'; c.strokeText(text, sx, sy);
      c.fillStyle = '#FFFFFF'; c.fillText(text, sx, sy);
    };
    const small = WORLD_W * s < 760;
    for (const k in PLACES) {
      const b = PLACES[k], nm = small ? b.short : b.name;
      if (b.round) labelAt(nm, b.cx, b.cy);
      else if (b.spot) labelAt(nm, b.door.x, b.door.y - 60);
      else labelAt(nm, b.x + b.w / 2, b.y + b.h / 2);
    }
    labelAt(small ? 'Lake' : 'Mirror Lake', LAKE.cx, LAKE.cy);
    if (!small) labelAt('Fairfield Way', 1180, 920);
    labelAt('You', p.x, p.y - 60);
    if (World.jonVisible()) labelAt('Jonathan', World.jon.x, World.jon.y - 60);
  }
  return { s, ox, oy };
}

const BigMap = {
  open: false, xf: null, raf: 0,
  show() {
    if (G.mode !== 'world' || G.busy) return;
    this.open = true;
    $('bigmap').hidden = false;
    Sound.play('select');
    const loop = () => {
      if (!this.open) return;
      const f = fitCanvas($('bigmapCv'));
      const c = $('bigmapCv').getContext('2d');
      c.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
      this.xf = drawMap(c, f.w, f.h, true);
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  },
  close() {
    this.open = false;
    cancelAnimationFrame(this.raf);
    $('bigmap').hidden = true;
  },
  click(e) {
    if (!this.xf) return;
    const r = $('bigmapCv').getBoundingClientRect();
    const wx = (e.clientX - r.left - this.xf.ox) / this.xf.s, wy = (e.clientY - r.top - this.xf.oy) / this.xf.s;
    let target = null, bd = 1e9;
    for (const t of World.interactables()) {
      const inside = t.hit && t.hit(wx, wy, 40);
      const d = inside ? 0 : dist(wx, wy, t.x, t.y);
      if ((inside || d < 110) && d < bd) { bd = d; target = t; }
    }
    this.close();
    if (target) World.walkTo(target.x, target.y + (target.npc ? 24 : 0), target);
    else World.walkTo(clamp(wx, 20, WORLD_W - 20), clamp(wy, 20, WORLD_H - 20), null);
  },
};
$('bigmapCv').addEventListener('click', e => BigMap.click(e));
$('bmClose').addEventListener('click', () => BigMap.close());
$('minimap').addEventListener('click', () => BigMap.show());
$('btnMap').addEventListener('click', e => { e.currentTarget.blur(); BigMap.show(); });

let miniFrame = 0;
function drawMinimap() {
  if ((miniFrame++ % 3) !== 0) return;
  const m = $('minimap');
  const f = fitCanvas(m);
  const c = m.getContext('2d');
  c.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
  drawMap(c, f.w, f.h, false);
}
