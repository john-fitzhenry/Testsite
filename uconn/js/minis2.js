'use strict';
/* Jaret's First Day — Free Throws, Scoop Stack, Memory Match and the Jonathan selfie. */

/* ======================= Free Throws (Gampel Pavilion) ======================= */
function gymLayout(W, H) {
  const portrait = W < H;
  const fy = H * (portrait ? 0.8 : 0.84);
  return { fy, portrait, hx: W * (portrait ? 0.7 : 0.74), hy: H * (portrait ? 0.5 : 0.38), jx: W * (portrait ? 0.26 : 0.24), mx: portrait ? 26 : 40, mh: Math.min(280, H * 0.42) };
}
function drawGymBG(c, W, H, t, jump) {
  const L = gymLayout(W, H);
  const g = c.createLinearGradient(0, 0, 0, L.fy);
  g.addColorStop(0, '#0B1A40'); g.addColorStop(1, '#16306E');
  c.fillStyle = g; c.fillRect(0, 0, W, L.fy);
  // banners
  for (let i = 0; i < 5; i++) {
    const bx = W * 0.12 + i * W * 0.17, by = 70;
    c.fillStyle = '#F4F6FA'; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + 46, by); c.lineTo(bx + 46, by + 70); c.lineTo(bx + 23, by + 82); c.lineTo(bx, by + 70); c.closePath(); c.fill();
    c.fillStyle = '#13306E'; c.font = '400 9px ' + FONT.d; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('NATIONAL', bx + 23, by + 28); c.fillText('CHAMPS', bx + 23, by + 42);
  }
  // crowd
  for (let r = 0; r < 4; r++) {
    const y = (L.portrait ? 230 : L.fy * 0.42) + r * 34;
    c.fillStyle = r % 2 ? '#1E3A80' : '#24448F'; c.fillRect(0, y + 10, W, 26);
    for (let x = 14 + (r % 2) * 16; x < W; x += 32) {
      const j = jump > 0 ? -Math.abs(Math.sin(t * 14 + x)) * 10 * jump : Math.sin(t * 2 + x) * 1.2;
      c.fillStyle = ((x / 32 | 0) + r) % 3 === 0 ? '#FFFFFF' : ((x / 32 | 0) + r) % 3 === 1 ? '#C8D2E8' : '#FFC94A';
      c.beginPath(); c.arc(x, y + 6 + j, 9, 0, TAU); c.fill();
      c.fillRect(x - 9, y + 12 + j, 18, 12);
    }
  }
  c.fillStyle = '#FFFFFF'; c.font = '400 ' + Math.min(28, W * 0.045) + 'px ' + FONT.d; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('GAMPEL PAVILION', W / 2, L.portrait ? 196 : Math.max(L.fy * 0.34, 172));
  // floor
  const fg = c.createLinearGradient(0, L.fy, 0, H);
  fg.addColorStop(0, '#D9A464'); fg.addColorStop(1, '#B9844A');
  c.fillStyle = fg; c.fillRect(0, L.fy, W, H - L.fy);
  c.fillStyle = 'rgba(120,70,30,.25)'; for (let x = 0; x < W; x += 36) c.fillRect(x, L.fy, 2, H - L.fy);
  c.fillStyle = '#FFFFFF'; c.fillRect(L.jx + 30, L.fy + 4, 6, H - L.fy);
  // hoop
  c.fillStyle = '#B9C2CC'; c.fillRect(L.hx + 44, L.hy - 20, 10, L.fy - L.hy + 20);
  c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(L.hx + 32, L.hy - 86, 9, 104);
  c.strokeStyle = '#E0263F'; c.lineWidth = 3; c.strokeRect(L.hx + 32, L.hy - 50, 9, 34);
}
function drawNet(c, L, stretch) {
  c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2;
  const top = L.hy + 3, bot = L.hy + 46 + stretch * 16;
  for (let i = 0; i <= 4; i++) { const x1 = L.hx - 26 + i * 13, x2 = L.hx - 15 + i * 7.5; c.beginPath(); c.moveTo(x1, top); c.lineTo(x2, bot); c.stroke(); }
  for (let k = 1; k <= 3; k++) { const y = lerp(top, bot, k / 3.4), w = lerp(26, 16, k / 3.4); c.beginPath(); c.moveTo(L.hx - w, y); c.lineTo(L.hx + w, y); c.stroke(); }
}
function drawBall(c, x, y, rot, fire) {
  if (fire) { for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? 'rgba(255,140,40,.5)' : 'rgba(255,210,80,.5)'; c.beginPath(); c.arc(x - 6 - i * 6, y + rand(-4, 4), 14 - i * 2, 0, TAU); c.fill(); } }
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = '#E8762B'; c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.fill();
  c.strokeStyle = '#5A2A10'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(-13, 0); c.lineTo(13, 0); c.moveTo(0, -13); c.lineTo(0, 13); c.stroke();
  c.beginPath(); c.arc(-15, 0, 10, -0.9, 0.9); c.stroke(); c.beginPath(); c.arc(15, 0, 10, Math.PI - 0.9, Math.PI + 0.9); c.stroke();
  c.restore();
}
const FreeThrows = {
  title: 'Free Throws', where: 'Gampel Pavilion', length: '10 shots',
  howto: () => '<p>Open gym at Gampel, home of Huskies hoops. Ten free throws. Watch the meter and shoot when it\'s in the green zone.</p><div class="howto"><div><b>Shoot</b><span>Tap, click, or press Space</span></div><div><b>Green zone</b><span>Swish. Close to it might rattle in.</span></div><div><b>Streak</b><span>Three in a row and Jaret is on fire</span></div></div>',
  preview(c, w, h, t) { drawGymBG(c, w, h * 1.5, t, 0); },
  create() {
    return {
      shot: 0, makes: 0, streak: 0, best: 0, v: 0.5, ph: 0, state: 'aim', ball: null, net: 0, jump: 0, msg: '', msgT: 0, pops: [], L: null,
      zone() { return { c: 0.62, h: Math.max(0.06, 0.11 - this.shot * 0.006) }; },
      update(dt, W, H) {
        const L = this.L = gymLayout(W, H);
        this.net = Math.max(0, this.net - dt * 2.5); this.jump = Math.max(0, this.jump - dt * 0.8); this.msgT -= dt;
        this.pops = stepPops(this.pops, dt);
        if (this.state === 'aim') { this.ph += (2.3 + this.shot * 0.28) * dt; this.v = 0.5 + 0.5 * Math.sin(this.ph); return; }
        const b = this.ball;
        b.rot += dt * 8;
        if (this.state === 'flight') {
          b.u += dt / 0.85;
          const u = Math.min(1, b.u);
          b.x = (1 - u) * (1 - u) * b.p0.x + 2 * (1 - u) * u * b.p1.x + u * u * b.p2.x;
          b.y = (1 - u) * (1 - u) * b.p0.y + 2 * (1 - u) * u * b.p1.y + u * u * b.p2.y;
          if (b.u >= 1) this.resolveShot();
        } else if (this.state === 'rattle') {
          b.t += dt;
          b.x = L.hx + Math.sin(b.t * 30) * 10 * (1 - b.t / 0.45); b.y = L.hy - 6 + Math.abs(Math.sin(b.t * 24)) * -6;
          if (b.t >= 0.45) {
            if (b.goesIn) { this.made(); b.vx = 0; b.vy = 160; b.x = L.hx; }
            else { this.missed('Rim out!'); b.vx = 170; b.vy = -200; }
            this.state = 'after'; b.t = 0;
          }
        } else if (this.state === 'after') {
          b.t += dt;
          b.vy += 1500 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.y > L.fy - 13) { b.y = L.fy - 13; if (Math.abs(b.vy) > 80) Sound.play('bounce'); b.vy *= -0.55; b.vx *= 0.8; }
          if (b.x > L.hx + 28 && b.x < L.hx + 40 && b.y < L.hy + 10 && b.vx > 0) { b.vx = -Math.abs(b.vx) * 0.7; Sound.play('thud'); }
          if (b.t > 1.15) {
            this.shot++;
            if (this.shot >= 10) { this.over = true; this.endText = this.makes + ' / 10'; this.result = { makes: this.makes, best: this.best }; }
            else { this.state = 'aim'; this.ball = null; this.ph = rand(0, TAU); }
          }
        }
      },
      settle(dt, W, H) { this.jump = Math.max(0, this.jump - dt); this.pops = stepPops(this.pops, dt); },
      shoot() {
        if (this.state !== 'aim' || !this.L) return;
        const L = this.L, z = this.zone(), dev = this.v - z.c;
        let kind;
        if (Math.abs(dev) <= z.h) kind = 'swish';
        else if (Math.abs(dev) <= z.h * 2) kind = 'rim';
        else kind = dev < 0 ? 'short' : 'long';
        const p0 = { x: L.jx + 30, y: L.fy - 150 };
        const p2 = kind === 'swish' ? { x: L.hx, y: L.hy - 2 } : kind === 'rim' ? { x: L.hx + (dev < 0 ? -20 : 20), y: L.hy - 6 } : kind === 'short' ? { x: L.hx - 70 - Math.min(160, Math.abs(dev) * 420), y: L.hy + 30 } : { x: L.hx + 28, y: L.hy - 48 };
        const p1 = { x: (p0.x + p2.x) / 2, y: Math.min(p0.y, p2.y) - 170 - Math.abs(p2.x - p0.x) * 0.12 };
        this.ball = { p0, p1, p2, u: 0, x: p0.x, y: p0.y, rot: 0, kind, t: 0, vx: 0, vy: 0, goesIn: kind === 'rim' && Math.random() < 0.5 };
        this.state = 'flight';
        Sound.play('whoosh');
      },
      resolveShot() {
        const b = this.ball;
        b.t = 0;
        if (b.kind === 'swish') { this.made(true); b.vx = 0; b.vy = 170; this.state = 'after'; }
        else if (b.kind === 'rim') { Sound.play('rim'); this.state = 'rattle'; }
        else if (b.kind === 'short') { this.missed('Airball!'); b.vx = 90; b.vy = 160; this.state = 'after'; }
        else { Sound.play('thud'); this.missed('Off the backboard!'); b.vx = -200; b.vy = 40; this.state = 'after'; }
      },
      made(swish) {
        this.makes++; this.streak++; this.best = Math.max(this.best, this.streak);
        this.net = 1; this.jump = 1;
        Sound.play('swish'); if (this.streak >= 3) Sound.play('cheer');
        this.msg = swish ? (this.streak >= 3 ? 'ON FIRE!' : 'SWISH!') : 'Rattled in!'; this.msgT = 1;
        this.pops.push({ text: '+1', color: '#FFC94A', x: this.L.hx, y: this.L.hy - 40, t: 0, life: 0.9 });
      },
      missed(text) { this.streak = 0; this.msg = text; this.msgT = 1; Sound.play('bad'); },
      pointer(type) { if (type === 'down') this.shoot(); },
      key(k) { if (k === ' ' || k === 'Enter' || k === 'e') this.shoot(); },
      hud() { return { score: this.makes + '/' + this.shot, scoreLabel: 'Made' }; },
      draw(c, W, H, t) {
        const L = gymLayout(W, H);
        drawGymBG(c, W, H, t, this.jump);
        // Jaret
        const fire = this.streak >= 3;
        drawPerson(c, L.jx, L.fy + 2, Object.assign({}, LOOKS.jaret, { scale: 2.5 }), 'right', 0, false);
        // rim + net (back), ball, rim front
        drawNet(c, L, this.net);
        if (!this.ball && this.state === 'aim') drawBall(c, L.jx + 30, L.fy - 150 + Math.sin(t * 6) * 2, 0, fire);
        if (this.ball) drawBall(c, this.ball.x, this.ball.y, this.ball.rot, fire && this.state === 'flight');
        c.strokeStyle = '#E8562B'; c.lineWidth = 5; c.beginPath(); c.moveTo(L.hx - 27, L.hy); c.lineTo(L.hx + 32, L.hy); c.stroke();
        // meter
        const mx = L.mx, my = (H - L.mh) / 2 + 20, mw = 26, z = this.zone();
        c.fillStyle = 'rgba(7,19,50,.85)'; rrect(c, mx - 8, my - 8, mw + 16, L.mh + 16, 12); c.fill();
        c.fillStyle = '#2A3A64'; c.fillRect(mx, my, mw, L.mh);
        const zy = (v) => my + L.mh * (1 - v);
        c.fillStyle = 'rgba(255,201,74,.45)'; c.fillRect(mx, zy(z.c + z.h * 2), mw, L.mh * z.h * 4);
        c.fillStyle = '#3CC47C'; c.fillRect(mx, zy(z.c + z.h), mw, L.mh * z.h * 2);
        c.fillStyle = '#FFFFFF'; c.fillRect(mx - 6, zy(this.v) - 3, mw + 12, 6);
        c.font = '700 14px ' + FONT.c; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('POWER', mx + mw / 2, my - 22);
        c.fillText('SHOT ' + Math.min(10, this.shot + 1) + '/10', mx + mw / 2 + (W < H ? 18 : 0), my + L.mh + 26);
        if (this.msgT > 0) {
          c.globalAlpha = Math.min(1, this.msgT * 2);
          c.font = '400 ' + (W < H ? 36 : 46) + 'px ' + FONT.d; c.lineWidth = 8; c.strokeStyle = '#13306E';
          c.strokeText(this.msg, W / 2, H * 0.22 + 40); c.fillStyle = this.msg === 'ON FIRE!' ? '#FFC94A' : '#FFFFFF'; c.fillText(this.msg, W / 2, H * 0.22 + 40);
          c.globalAlpha = 1;
        }
        popTexts(c, this.pops);
      },
    };
  },
};

/* ======================= Scoop Stack (UConn Dairy Bar) ======================= */
const FLAVORS = [
  { name: 'Jonathan Supreme', base: '#F2E2B8', swirl: '#C98A3E', dots: '#4A2A14' },
  { name: 'Chocolate', base: '#6B3A22', dots: null },
  { name: 'Strawberry', base: '#FF9EB5', dots: '#D9405E' },
  { name: 'Mint Chip', base: '#A6E8C8', dots: '#2A1A10' },
  { name: 'Coffee', base: '#B98A62', dots: null },
  { name: 'Vanilla', base: '#F7EBCF', dots: '#2A1A10', fleck: true },
];
function drawScoop(c, x, y, R, f, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = shade(f.base, -0.15);
  c.beginPath(); c.arc(0, 2, R, 0, TAU); c.fill();
  c.fillStyle = f.base; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
  // drippy bottom edge
  c.beginPath();
  for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.05 + 0.9 * i / 8), rr = R + (i % 2 ? 6 : 1); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.75 + R * 0.25); }
  c.closePath(); c.fill();
  if (f.swirl) { c.strokeStyle = f.swirl; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.arc(-4, -2, R * 0.5, 0.3, 4); c.stroke(); }
  if (f.dots) {
    c.fillStyle = f.dots;
    const pts = [[-12, -10], [10, -14], [14, 6], [-6, 8], [2, -2], [-16, 4]];
    for (const [dx, dy] of pts) { c.beginPath(); c.arc(dx * R / 34, dy * R / 34, f.fleck ? 1.4 : 3, 0, TAU); c.fill(); }
  }
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-R * 0.35, -R * 0.4, R * 0.28, R * 0.16, -0.5, 0, TAU); c.fill();
  c.restore();
}
function drawCone(c, x, y, R) {
  c.fillStyle = '#D9993E'; c.beginPath(); c.moveTo(x - R * 0.95, y); c.lineTo(x + R * 0.95, y); c.lineTo(x, y + R * 2.6); c.closePath(); c.fill();
  c.save(); c.beginPath(); c.moveTo(x - R * 0.95, y); c.lineTo(x + R * 0.95, y); c.lineTo(x, y + R * 2.6); c.closePath(); c.clip();
  c.strokeStyle = '#B9772A'; c.lineWidth = 2.4;
  for (let i = -6; i <= 6; i++) { c.beginPath(); c.moveTo(x + i * 14 - 60, y); c.lineTo(x + i * 14 + 60, y + 120); c.stroke(); c.beginPath(); c.moveTo(x + i * 14 + 60, y); c.lineTo(x + i * 14 - 60, y + 120); c.stroke(); }
  c.restore();
  c.fillStyle = '#C98A3E'; rrect(c, x - R, y - 6, R * 2, 12, 5); c.fill();
}
function drawDairyBG(c, W, H, cam) {
  c.fillStyle = '#F7F3EA'; c.fillRect(0, 0, W, H);
  const par = cam * 0.3;
  c.fillStyle = '#C8102E'; c.fillRect(0, 60 + par, W, 14);
  // window onto Horsebarn Hill
  const wx = W * 0.08, wy = 100 + par, ww = Math.min(260, W * 0.34), wh = 150;
  c.fillStyle = '#8FD0F2'; c.fillRect(wx, wy, ww, wh);
  c.fillStyle = '#7DB45A'; c.beginPath(); c.ellipse(wx + ww * 0.6, wy + wh + 30, ww * 0.9, 90, 0, Math.PI, TAU); c.fill();
  c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip(); drawCow(c, wx + ww * 0.55, wy + wh - 18, 1, performance.now() / 1000); c.restore();
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 8; c.strokeRect(wx, wy, ww, wh); c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.stroke();
  // menu board
  const bw = Math.min(250, W * 0.32), bx = W - bw - W * 0.06, by = 96 + par;
  c.fillStyle = '#1E2A3A'; rrect(c, bx, by, bw, 190, 10); c.fill();
  c.fillStyle = '#FFC94A'; c.font = '400 18px ' + FONT.d; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('FLAVORS', bx + bw / 2, by + 24);
  c.font = '600 15px ' + FONT.b; c.fillStyle = '#FFFFFF';
  FLAVORS.forEach((f, i) => c.fillText(f.name, bx + bw / 2, by + 54 + i * 22, bw - 20));
  c.fillStyle = '#13306E'; c.font = '400 ' + Math.min(26, W * 0.05) + 'px ' + FONT.d; c.fillText('UCONN DAIRY BAR', W / 2, 34 + par);
}
const ScoopStack = {
  title: 'Scoop Stack', where: 'UConn Dairy Bar', length: 'Until it topples',
  howto: () => '<p>Ice cream made right on campus. Drop each scoop onto the cone and stack it as high as you dare. Lean too far and it all comes down.</p><div class="howto"><div><b>Drop</b><span>Tap, click, or press Space</span></div><div><b>Perfect</b><span>Line a scoop up exactly to straighten the tower</span></div><div><b>Lives</b><span>Three dropped scoops and you\'re done</span></div></div>',
  preview(c, w, h) { drawDairyBG(c, w, h * 1.4, 0); drawCone(c, w / 2, h - 40, 24); drawScoop(c, w / 2, h - 52, 26, FLAVORS[0]); drawScoop(c, w / 2 + 6, h - 86, 26, FLAVORS[2]); },
  create() {
    const R = 34, step = 46;
    return {
      R, step, stack: [], lives: 3, perfect: 0, ph: 0, fall: null, gone: [], cam: 0, pops: [], parts: [], topple: false, toppleT: 0, sway: 0, W: 640, H: 640,
      coneY() { return this.H - 118; },
      slotY(i) { return this.coneY() - R * 0.45 - i * step; },
      moverY() { return 130 + (this.safe || 0) + (this.W < 520 ? 50 : 0); },
      update(dt, W, H) {
        this.W = W; this.H = H;
        this.pops = stepPops(this.pops, dt); this.parts = stepParticles(this.parts, dt);
        const n = this.stack.length;
        const camTarget = Math.max(0, this.moverY() + 200 - this.slotY(n));
        this.cam = lerp(this.cam, camTarget, 1 - Math.pow(0.02, dt));
        this.ph += (1.7 + n * 0.13) * dt;
        const lean = n ? this.stack[n - 1].x - W / 2 : 0;
        this.sway = Math.sin(performance.now() / 300) * Math.min(0.06, Math.abs(lean) / 900) ;
        for (const g of this.gone) { g.vy += 1600 * dt; g.x += g.vx * dt; g.y += g.vy * dt; g.rot += g.vr * dt; }
        this.gone = this.gone.filter(g => g.y + this.cam < H + 120);
        if (this.topple) { this.toppleT += dt; if (this.toppleT > 1.2) this.finish('TIMBER!'); return; }
        const f = this.fall;
        if (f) {
          f.vy += 1900 * dt; f.y += f.vy * dt;
          const target = this.slotY(n);
          if (f.y >= target) {
            const baseX = n ? this.stack[n - 1].x : W / 2;
            const dx = f.x - baseX;
            if (Math.abs(dx) <= R * 0.9) {
              let x = f.x;
              if (Math.abs(dx) < 6) { x = baseX; this.perfect++; Sound.play('coin'); this.pops.push({ text: 'Perfect!', color: '#FFC94A', x, y: target - 50, t: 0, life: 0.9 }); }
              else Sound.play('pop');
              this.stack.push({ x, f: f.f });
              burst(this.parts, x, target + 10, '#FFFFFF', 6, 120);
              this.fall = null;
              const newLean = x - W / 2;
              if (Math.abs(newLean) > R * 2.3 && this.stack.length > 1) {
                this.topple = true; this.toppledAt = this.stack.length; Sound.play('splat');
                const dir = Math.sign(newLean);
                this.stack.forEach((s, i) => this.gone.push({ x: s.x, y: this.slotY(i), vx: dir * rand(120, 260), vy: rand(-300, -100), rot: 0, vr: dir * rand(2, 5), f: s.f }));
                this.stack = [];
              } else if (this.stack.length >= 25) this.finish('LEGENDARY!');
            } else {
              this.gone.push({ x: f.x, y: f.y, vx: Math.sign(dx) * 180, vy: -60, rot: 0, vr: Math.sign(dx) * 4, f: f.f });
              this.fall = null; this.lives--; Sound.play('splat');
              this.pops.push({ text: 'Splat!', color: '#FF6B7D', x: f.x, y: target - 40, t: 0, life: 0.9 });
              if (this.lives <= 0) this.finish('SPLAT!');
            }
          }
        }
      },
      finish(text) {
        if (this.over) return;
        this.over = true; this.endText = text;
        this.result = { height: this.topple ? this.toppledAt : this.stack.length, perfect: this.perfect, toppled: this.topple };
      },
      settle(dt) { for (const g of this.gone) { g.vy += 1600 * dt; g.x += g.vx * dt; g.y += g.vy * dt; g.rot += g.vr * dt; } this.pops = stepPops(this.pops, dt); },
      moverX() { const amp = Math.min(this.W * 0.36, 290); return this.W / 2 + Math.sin(this.ph) * amp; },
      drop() {
        if (this.fall || this.topple || this.over) return;
        const n = this.stack.length;
        this.fall = { x: this.moverX(), y: this.moverY() - this.cam, vy: 0, f: FLAVORS[n % FLAVORS.length] };
        Sound.play('whoosh');
      },
      pointer(type) { if (type === 'down') this.drop(); },
      key(k) { if (k === ' ' || k === 'Enter' || k === 'e') this.drop(); },
      hud() { return { score: this.topple ? this.toppledAt : this.stack.length, scoreLabel: 'Scoops', lives: this.lives, livesMax: 3 }; },
      draw(c, W, H, t) {
        this.W = W; this.H = H;
        drawDairyBG(c, W, H, this.cam);
        c.save(); c.translate(0, this.cam);
        const cy = this.coneY();
        c.fillStyle = '#C9D2DC'; c.fillRect(0, cy + 40, W, 400); c.fillStyle = '#AEB8C4'; c.fillRect(0, cy + 40, W, 8);
        c.save(); c.translate(W / 2, cy + 40); c.rotate(this.sway); c.translate(-W / 2, -(cy + 40));
        drawCone(c, W / 2, cy - 12, R);
        this.stack.forEach((s, i) => drawScoop(c, s.x, this.slotY(i), R, s.f));
        c.restore();
        for (const g of this.gone) drawScoop(c, g.x, g.y, R, g.f, g.rot);
        if (this.fall) drawScoop(c, this.fall.x, this.fall.y, R, this.fall.f);
        drawParticles(c, this.parts); popTexts(c, this.pops);
        c.restore();
        if (!this.fall && !this.topple && !this.over) {
          const mx = this.moverX(), my = this.moverY(), f = FLAVORS[this.stack.length % FLAVORS.length];
          c.strokeStyle = '#8A949E'; c.lineWidth = 4; c.beginPath(); c.moveTo(mx, my - 40); c.lineTo(mx, my - R); c.stroke();
          drawScoop(c, mx, my, R, f);
          c.font = '700 16px ' + FONT.c; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.lineWidth = 4; c.strokeStyle = '#FFFFFF'; c.strokeText(f.name, mx, my + R + 18); c.fillStyle = '#13306E'; c.fillText(f.name, mx, my + R + 18);
        }
      },
    };
  },
};

/* ======================= Memory Match (Homer Babbidge Library) ======================= */
const MEM_ICONS = ['brain', 'book', 'pencil', 'coffee', 'paw', 'atom', 'bulb', 'calc'];
function drawLibraryBG(c, W, H) {
  c.fillStyle = '#3A2A1E'; c.fillRect(0, 0, W, H);
  for (let s = 0; s < 2; s++) {
    const y = 8 + s * 46;
    c.fillStyle = '#5A3E28'; c.fillRect(0, y + 38, W, 6);
    for (let x = 6; x < W; x += 13) { c.fillStyle = ['#C8102E', '#13306E', '#3E6B3A', '#D9993E', '#7B5CD6', '#E8E2D4'][(x * 7 + s * 3) % 6]; c.fillRect(x, y + 6 + ((x * 13) % 9), 10, 32 - ((x * 13) % 9)); }
  }
  const g = c.createRadialGradient(W / 2, H * 0.55, 40, W / 2, H * 0.55, Math.max(W, H) * 0.7);
  g.addColorStop(0, '#9A6A3E'); g.addColorStop(1, '#5A3A20');
  c.fillStyle = g; c.fillRect(0, 100, W, H - 100);
  c.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 110; y < H; y += 26) c.fillRect(0, y, W, 2);
}
function drawCardBack(c, x, y, w, h) {
  c.fillStyle = '#13306E'; rrect(c, x, y, w, h, 10); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; rrect(c, x + 6, y + 6, w - 12, h - 12, 7); c.stroke();
  c.save(); c.globalAlpha = 0.9; c.translate(x + w / 2, y + h / 2); c.scale(-1, 1);
  c.fillStyle = '#FFFFFF';
  const s = Math.min(w, h) / 40;
  c.beginPath(); c.ellipse(0, 4 * s, 7 * s, 6 * s, 0, 0, TAU); c.ellipse(-9 * s, -3 * s, 3 * s, 4 * s, -0.3, 0, TAU); c.ellipse(-4 * s, -9 * s, 3 * s, 4 * s, 0, 0, TAU); c.ellipse(4 * s, -9 * s, 3 * s, 4 * s, 0, 0, TAU); c.ellipse(9 * s, -3 * s, 3 * s, 4 * s, 0.3, 0, TAU); c.fill();
  c.restore();
}
const MemoryMatch = {
  title: 'Memory Match', where: 'Homer Babbidge Library', length: '80 seconds',
  howto: () => '<p>Study session! Flip the flashcards two at a time and find all eight pairs. Fewer tries means more Brain.</p><div class="howto"><div><b>Flip</b><span>Tap a card, or use the arrow keys and Space</span></div><div><b>Goal</b><span>Match all 8 pairs before time runs out</span></div></div>',
  preview(c, w, h) { drawLibraryBG(c, w, h * 1.3); for (let i = 0; i < 4; i++) { const x = w / 2 - 150 + i * 78; if (i % 2) drawCardBack(c, x, 106, 64, 70); else { c.fillStyle = '#FFFFFF'; rrect(c, x, 106, 64, 70, 10); c.fill(); drawIcon(c, MEM_ICONS[i], x + 32, 141, 40); } } },
  create() {
    const deck = shuffle(MEM_ICONS.concat(MEM_ICONS)).map(icon => ({ icon, up: false, matched: false, flip: 0 }));
    return {
      deck, first: -1, lock: 0, moves: 0, pairs: 0, time: 80, cursor: 0, boxes: [], pops: [], pending: null,
      update(dt) {
        this.time -= dt;
        this.pops = stepPops(this.pops, dt);
        for (const cd of this.deck) cd.flip = clamp(cd.flip + (cd.up || cd.matched ? 1 : -1) * dt * 6, 0, 1);
        if (this.lock > 0) {
          this.lock -= dt;
          if (this.lock <= 0 && this.pending) { for (const i of this.pending) this.deck[i].up = false; this.pending = null; }
        }
        if (this.pairs === 8) { this.over = true; this.endText = 'ALL MATCHED!'; }
        else if (this.time <= 0) { this.time = 0; this.over = true; this.endText = 'TIME!'; }
        if (this.over) this.result = { pairs: this.pairs, moves: this.moves, time: Math.round(80 - this.time) };
      },
      settle(dt) { for (const cd of this.deck) cd.flip = clamp(cd.flip + (cd.up || cd.matched ? 1 : -1) * dt * 6, 0, 1); },
      flipAt(i) {
        const cd = this.deck[i];
        if (!cd || cd.up || cd.matched || this.lock > 0 || this.over) return;
        cd.up = true; Sound.play('tick');
        if (this.first < 0) { this.first = i; return; }
        const a = this.deck[this.first];
        this.moves++;
        if (a.icon === cd.icon) {
          a.matched = cd.matched = true; a.up = cd.up = false; this.pairs++;
          Sound.play(this.pairs === 8 ? 'fanfare' : 'good');
          const b = this.boxes[i]; if (b) this.pops.push({ text: 'Match!', color: '#FFC94A', x: b.x + b.w / 2, y: b.y, t: 0, life: 0.8 });
        } else { this.lock = 0.75; this.pending = [this.first, i]; }
        this.first = -1;
      },
      pointer(type, x, y) { if (type !== 'down') return; this.boxes.forEach((b, i) => { if (inBox(x, y, b)) { this.cursor = i; this.flipAt(i); } }); },
      key(k) {
        const c = this.cursor;
        if (k === 'ArrowRight' || k === 'd') this.cursor = (c + 1) % 16;
        else if (k === 'ArrowLeft' || k === 'a') this.cursor = (c + 15) % 16;
        else if (k === 'ArrowDown' || k === 's') this.cursor = (c + 4) % 16;
        else if (k === 'ArrowUp' || k === 'w') this.cursor = (c + 12) % 16;
        else if (k === ' ' || k === 'Enter' || k === 'e') this.flipAt(c);
        this.showCursor = true;
      },
      hud() { return { score: this.pairs + '/8', scoreLabel: 'Pairs', time: this.time }; },
      draw(c, W, H, t) {
        drawLibraryBG(c, W, H);
        const top = 112 + (this.safe || 0) + (W < 520 ? 40 : 0), gap = 12;
        const cw = Math.min((W - 40 - gap * 3) / 4, ((H - top - 30) - gap * 3) / 4 / 1.12, 120), ch = cw * 1.12;
        const x0 = (W - (cw * 4 + gap * 3)) / 2;
        this.boxes = this.deck.map((cd, i) => ({ x: x0 + (i % 4) * (cw + gap), y: top + Math.floor(i / 4) * (ch + gap), w: cw, h: ch }));
        this.deck.forEach((cd, i) => {
          const b = this.boxes[i];
          const sx = Math.abs(Math.cos(cd.flip * Math.PI));
          c.save(); c.translate(b.x + b.w / 2, b.y + b.h / 2); c.scale(Math.max(0.02, sx), 1); c.translate(-b.w / 2, -b.h / 2);
          c.fillStyle = 'rgba(0,0,0,.3)'; rrect(c, 2, 5, b.w, b.h, 10); c.fill();
          if (cd.flip > 0.5) {
            c.fillStyle = cd.matched ? '#FFF6DC' : '#FFFFFF'; rrect(c, 0, 0, b.w, b.h, 10); c.fill();
            if (cd.matched) { c.strokeStyle = '#3CC47C'; c.lineWidth = 4; rrect(c, 2, 2, b.w - 4, b.h - 4, 9); c.stroke(); }
            drawIcon(c, cd.icon, b.w / 2, b.h / 2, b.w * 0.6, t);
          } else drawCardBack(c, 0, 0, b.w, b.h);
          c.restore();
          if (this.showCursor && i === this.cursor) { c.strokeStyle = '#FFC94A'; c.lineWidth = 4; rrect(c, b.x - 4, b.y - 4, b.w + 8, b.h + 8, 12); c.stroke(); }
        });
        c.font = '700 16px ' + FONT.c; c.fillStyle = 'rgba(255,255,255,.75)'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('TRIES: ' + this.moves, W / 2, top - 18);
        popTexts(c, this.pops);
      },
    };
  },
};

/* ======================= Selfie with Jonathan ======================= */
function drawSelfieScene(c, W, H, t) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#9FD6F5'); g.addColorStop(0.55, '#D6EEF9'); g.addColorStop(0.56, '#6FAE54'); g.addColorStop(1, '#4F8E3E');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = '#B5643C'; c.fillRect(W * 0.1, H * 0.22, W * 0.5, H * 0.34);
  c.fillStyle = '#C27A48'; c.fillRect(W * 0.1, H * 0.22, W * 0.18, H * 0.34);
  c.fillStyle = '#A9CBE8'; for (let x = W * 0.31; x < W * 0.58; x += 34) for (let y = H * 0.27; y < H * 0.5; y += 30) c.fillRect(x, y, 20, 16);
  for (const [tx, s] of [[0.04, 1.2], [0.72, 1.4], [0.9, 1.1], [0.62, 0.9]]) { c.fillStyle = '#3F7F3A'; c.beginPath(); c.arc(W * tx, H * 0.36, 60 * s, 0, TAU); c.fill(); c.fillStyle = '#6B4A2E'; c.fillRect(W * tx - 6, H * 0.36 + 40 * s, 12, 60); }
  c.fillStyle = '#E4DED1'; c.beginPath(); c.moveTo(W * 0.3, H); c.lineTo(W * 0.45, H * 0.56); c.lineTo(W * 0.6, H * 0.56); c.lineTo(W * 0.85, H); c.fill();
}
function jonPos(t, W, H, k) {
  return { x: W * 0.66 + Math.sin(t * (1.6 + k * 0.3)) * W * 0.17 + Math.sin(t * 3.3) * 24, y: H * 0.5 + Math.sin(t * (2.2 + k * 0.4)) * H * 0.12 };
}
function renderSelfie(quality) {
  const w = 360, h = 300, cnv = document.createElement('canvas');
  cnv.width = w * 2; cnv.height = h * 2;
  const c = cnv.getContext('2d'); c.scale(2, 2);
  drawSelfieScene(c, w, h, 0);
  const shots = quality === 'blurry' ? [[-10, 0, 0.35], [10, 4, 0.35], [0, 0, 0.5]] : [[0, 0, 1]];
  c.save(); c.translate(-6, h - 210); drawPortrait(c, 230, LOOKS.jaret, 'grin', { noBg: true }); c.restore();
  for (const [dx, dy, a] of shots) { c.globalAlpha = a; c.save(); c.translate(200 + dx, 90 + dy); drawHuskyPortrait(c, 150, 'grin', true); c.restore(); }
  c.globalAlpha = 1;
  try { return cnv.toDataURL('image/jpeg', 0.85); } catch (e) { return null; }
}
const Selfie = {
  title: 'Husky Selfie', where: 'Fairfield Way', length: '3 tries',
  howto: () => '<p>Jonathan is a very good boy who will not hold still. Snap the selfie when he bounces into the focus square.</p><div class="howto"><div><b>Snap</b><span>Tap, click, or press Space</span></div><div><b>Tries</b><span>Three. A blurry one still counts as a memory.</span></div></div>',
  preview(c, w, h, t) { drawSelfieScene(c, w, h, t); const p = jonPos(t, w, h, 0); c.save(); c.translate(p.x - 45, p.y - 45); drawHuskyPortrait(c, 90, 'grin', true); c.restore(); },
  create() {
    return {
      tries: 3, flash: 0, msg: '', msgT: 0, k: 0, tt: 0,
      update(dt) { this.tt += dt; this.flash = Math.max(0, this.flash - dt * 2.5); this.msgT -= dt; },
      focus(W, H) { const s = Math.min(W, H) * 0.3; return { x: W * 0.66 - s / 2, y: H * 0.5 - s / 2, s }; },
      snap() {
        if (this.over || this.flash > 0.2) return;
        const W = this.W, H = this.H, f = this.focus(W, H), p = jonPos(this.tt, W, H, this.k);
        const d = dist(p.x, p.y, f.x + f.s / 2, f.y + f.s / 2);
        this.flash = 1; Sound.play('camera');
        const q = d < f.s * 0.28 ? 'great' : d < f.s * 0.55 ? 'okay' : 'blurry';
        this.tries--;
        if (q !== 'blurry' || this.tries <= 0) {
          G.photo = renderSelfie(q);
          this.over = true; this.endText = q === 'great' ? 'PERFECT SHOT!' : q === 'okay' ? 'NICE SHOT!' : 'BLURRY…';
          this.result = { quality: q, tries: 3 - this.tries };
          if (q !== 'blurry') Sound.play('bark');
        } else { this.msg = 'Blurry! Jonathan moved.'; this.msgT = 1.3; this.k++; Sound.play('bad'); }
      },
      pointer(type) { if (type === 'down') this.snap(); },
      key(k) { if (k === ' ' || k === 'Enter' || k === 'e') this.snap(); },
      hud() { return { score: this.tries, scoreLabel: 'Tries left' }; },
      draw(c, W, H, t) {
        this.W = W; this.H = H;
        drawSelfieScene(c, W, H, t);
        const f = this.focus(W, H), p = jonPos(this.tt, W, H, this.k);
        const js = Math.min(W, H) * 0.28;
        c.save(); c.translate(p.x - js / 2, p.y - js / 2 + Math.abs(Math.sin(this.tt * 8)) * -8); drawHuskyPortrait(c, js, 'grin', true); c.restore();
        const ps = Math.min(W * 0.55, H * 0.62);
        c.save(); c.translate(-ps * 0.06, H - ps * 0.92); drawPortrait(c, ps, LOOKS.jaret, 'grin', { noBg: true }); c.restore();
        const inside = dist(p.x, p.y, f.x + f.s / 2, f.y + f.s / 2) < f.s * 0.28;
        c.strokeStyle = inside ? '#3CC47C' : '#FFFFFF'; c.lineWidth = 5;
        const L = f.s * 0.22;
        for (const [cx, cy, sx, sy] of [[f.x, f.y, 1, 1], [f.x + f.s, f.y, -1, 1], [f.x, f.y + f.s, 1, -1], [f.x + f.s, f.y + f.s, -1, -1]]) { c.beginPath(); c.moveTo(cx, cy + L * sy); c.lineTo(cx, cy); c.lineTo(cx + L * sx, cy); c.stroke(); }
        // phone UI
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, H - 90, W, 90);
        c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(W / 2, H - 45, 30, 0, TAU); c.fill();
        c.strokeStyle = '#13306E'; c.lineWidth = 4; c.beginPath(); c.arc(W / 2, H - 45, 24, 0, TAU); c.stroke();
        if (this.msgT > 0) { c.font = '700 26px ' + FONT.b; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 6; c.strokeStyle = '#13306E'; c.strokeText(this.msg, W / 2, H * 0.2 + 40); c.fillStyle = '#FFFFFF'; c.fillText(this.msg, W / 2, H * 0.2 + 40); }
        if (this.flash > 0) { c.fillStyle = 'rgba(255,255,255,' + this.flash + ')'; c.fillRect(0, 0, W, H); }
      },
    };
  },
};
