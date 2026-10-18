'use strict';
/* Jaret's First Day — mini-game framework + Tray Dash, Pop Quiz, Math Sprint and Swag Grab. */

const safeProbe = (() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;top:0;left:0;height:0;padding-top:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none'; document.body.appendChild(d); return d; })();
function safeTopPx() { return parseFloat(getComputedStyle(safeProbe).paddingTop) || 0; }

function wrapText(c, text, maxW) {
  const words = String(text).split(' '), lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (c.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
const inBox = (x, y, b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;

function gainChips(g) {
  const names = { energy: 'Energy', full: 'Fullness', spirit: 'Husky spirit', brain: 'Brain' };
  const parts = [];
  for (const k of ['brain', 'spirit', 'energy', 'full']) {
    const v = g && g[k];
    if (!v) continue;
    parts.push('<span class="badge' + (v < 0 ? ' off' : '') + '">' + (v > 0 ? '+' : '') + v + ' ' + names[k] + '</span>');
  }
  return parts.length ? '<div class="badges">' + parts.join('') + '</div>' : '';
}

const Mini = {
  async run(def, opts = {}) {
    const btns = [{ label: 'Play', sub: def.length, primary: true, value: 'play' }];
    if (opts.skip) btns.push({ label: opts.skip.label, sub: opts.skip.sub, value: 'skip', cancel: true });
    const choice = await UI.card({ kicker: 'Mini-game · ' + def.where, title: def.title, html: def.howto(opts), art: def.preview, buttons: btns });
    if (choice === 'skip') return { skipped: true };
    const inst = def.create(opts);
    inst.def = def; inst.phase = 'count'; inst.clock = 0; inst.over = false;
    const p = inst.pointer, k = inst.key;
    inst.pointer = p ? (type, x, y) => { if (inst.phase === 'play') p.call(inst, type, x, y); } : null;
    inst.key = k ? key => { if (inst.phase === 'play') k.call(inst, key); } : null;
    Music.setMode('mini');
    $('hud').hidden = true;
    G.mini = inst;
    await new Promise(res => { inst.resolve = res; });
    G.mini = null;
    Input.keys.clear();
    const rw = opts.reward ? opts.reward(inst.result) : null;
    if (rw) {
      const html = (rw.lines || []).map(l => '<p>' + esc(l) + '</p>').join('') + gainChips(rw.gains);
      await UI.card({ kicker: def.title + ' · Results', title: rw.title || 'Nice!', html, art: rw.art || null, buttons: [{ label: 'Continue', primary: true }] });
    }
    return { result: inst.result, reward: rw };
  },

  frame(c, dt, t) {
    const m = G.mini;
    const st = stage();
    c.setTransform(view.dpr * st.s, 0, 0, view.dpr * st.s, 0, 0);
    const W = st.W, H = st.H;
    m.safe = safeTopPx() / st.s;
    m.clock += dt;
    if (m.phase === 'count') {
      const n = 3 - Math.floor(m.clock / 0.7);
      if (n !== m._lastN) { m._lastN = n; Sound.play(n > 0 ? 'tick' : 'confirm'); }
      m.draw(c, W, H, t, false);
      this.hud(c, W, H, m);
      this.countdown(c, W, H, n, (m.clock % 0.7) / 0.7);
      if (m.clock >= 2.8) { m.phase = 'play'; m.clock = 0; }
    } else if (m.phase === 'play') {
      m.update(dt, W, H);
      m.draw(c, W, H, t, true);
      this.hud(c, W, H, m);
      if (m.over) { m.phase = 'end'; m.clock = 0; Sound.play('fanfare'); }
    } else {
      if (m.settle) m.settle(dt, W, H);
      m.draw(c, W, H, t, false);
      this.hud(c, W, H, m);
      this.banner(c, W, H, m.endText || 'TIME!');
      if (m.clock > 1.4 && m.resolve) { const r = m.resolve; m.resolve = null; r(); }
    }
  },

  hud(c, W, H, m) {
    const h = m.hud ? m.hud() : {};
    const y = 14 + (m.safe || 0);
    c.textBaseline = 'middle';
    const pill = (x, w, text, align, bg, fg) => {
      c.fillStyle = bg; rrect(c, x, y, w, 40, 12); c.fill();
      c.fillStyle = fg; c.textAlign = align;
      c.fillText(text, align === 'left' ? x + 14 : align === 'right' ? x + w - 14 : x + w / 2, y + 21);
    };
    c.font = '400 15px ' + FONT.d;
    const tw = Math.min(c.measureText(m.def.title).width + 28, W * 0.42);
    pill(14, tw, m.def.title, 'left', 'rgba(7,19,50,.88)', '#EEF3FB');
    if (h.score != null) {
      c.font = '700 20px ' + FONT.c;
      const label = (h.scoreLabel || 'Score') + '  ' + h.score;
      const sw = c.measureText(label).width + 28;
      pill(W - 14 - sw, sw, label, 'center', '#FFC94A', '#050E26');
    }
    if (h.time != null) {
      c.font = '400 26px ' + FONT.d;
      const txt = Math.ceil(Math.max(0, h.time)).toString();
      const urgent = h.time < 5.5 && m.phase === 'play';
      const cw = 64;
      const cx = W / 2 - cw / 2;
      const ty = W < 520 ? y + 50 : y;
      c.fillStyle = urgent ? '#E0263F' : 'rgba(7,19,50,.88)'; rrect(c, cx, ty, cw, 40, 12); c.fill();
      c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.fillText(txt, W / 2, ty + 22);
    }
    if (h.lives != null) {
      const ly = y + (W < 520 && h.time != null ? 100 : 54);
      for (let i = 0; i < h.livesMax; i++) {
        c.globalAlpha = i < h.lives ? 1 : 0.25;
        drawIcon(c, 'cone', W - 30 - i * 30, ly + 12, 24);
      }
      c.globalAlpha = 1;
    }
  },

  countdown(c, W, H, n, k) {
    c.fillStyle = 'rgba(5,14,38,' + (0.35 * (n > 0 ? 1 : 1 - k)) + ')'; c.fillRect(0, 0, W, H);
    const s = 1 + (1 - ease.out(k)) * 0.6;
    c.save(); c.translate(W / 2, H / 2); c.scale(s, s);
    c.globalAlpha = n > 0 ? 1 : 1 - k;
    c.font = '400 ' + (n > 0 ? 130 : 96) + 'px ' + FONT.d; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 10; c.strokeStyle = '#13306E'; c.strokeText(n > 0 ? String(n) : 'GO!', 0, 0);
    c.fillStyle = n > 0 ? '#FFFFFF' : '#FFC94A'; c.fillText(n > 0 ? String(n) : 'GO!', 0, 0);
    c.restore(); c.globalAlpha = 1;
  },

  banner(c, W, H, text) {
    c.fillStyle = 'rgba(5,14,38,.45)'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#13306E'; c.fillRect(0, H / 2 - 50, W, 100);
    c.fillStyle = '#FFC94A'; c.fillRect(0, H / 2 - 50, W, 5); c.fillRect(0, H / 2 + 45, W, 5);
    c.font = '400 ' + (text.length > 12 ? 40 : 56) + 'px ' + FONT.d; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#FFFFFF'; c.fillText(text, W / 2, H / 2 + 3);
  },
};

/* Small particle helper shared by the games. */
function burst(list, x, y, color, n = 12, sp = 220) {
  for (let i = 0; i < n; i++) { const a = rand(0, TAU), v = rand(sp * 0.4, sp); list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: rand(0.4, 0.8), t: 0, color, r: rand(2.5, 5) }); }
}
function stepParticles(list, dt) {
  for (const p of list) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; }
  return list.filter(p => p.t < p.life);
}
function drawParticles(c, list) {
  for (const p of list) { c.globalAlpha = 1 - p.t / p.life; c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill(); }
  c.globalAlpha = 1;
}
function popTexts(c, list) {
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const f of list) {
    const k = f.t / f.life;
    c.globalAlpha = 1 - k * k; c.font = '700 ' + (f.size || 26) + 'px ' + FONT.c;
    c.lineWidth = 5; c.strokeStyle = 'rgba(10,22,56,.9)'; c.strokeText(f.text, f.x, f.y - k * 50);
    c.fillStyle = f.color; c.fillText(f.text, f.x, f.y - k * 50);
  }
  c.globalAlpha = 1;
}
function stepPops(list, dt) { for (const f of list) f.t += dt; return list.filter(f => f.t < f.life); }

/* ======================= Tray Dash (dining hall) ======================= */
const MEALS = {
  breakfast: ['pancakes', 'waffle', 'egg', 'bacon', 'banana', 'oj', 'muffin'],
  lunch: ['pizza', 'burger', 'taco', 'salad', 'apple', 'cookie'],
  dinner: ['pizza', 'burger', 'taco', 'salad', 'cookie', 'apple'],
};
function drawDiningBG(c, W, H, t) {
  c.fillStyle = '#F2E3C6'; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(160,110,60,.08)';
  for (let x = 0; x < W; x += 40) c.fillRect(x, 0, 2, H * 0.55);
  // serving counter
  c.fillStyle = '#B9C2CC'; c.fillRect(0, 70, W, 60);
  c.fillStyle = '#8A949E'; c.fillRect(0, 126, W, 10);
  c.fillStyle = 'rgba(200,230,255,.35)'; c.fillRect(0, 48, W, 26);
  const signW = Math.min(300, W * 0.5);
  for (let x = 30; x < W - 40; x += 110) {
    if (x + 84 > W / 2 - signW / 2 - 8 && x < W / 2 + signW / 2 + 8) continue;
    c.fillStyle = '#6E7884'; c.fillRect(x, 82, 84, 34); c.fillStyle = ['#E6A75A', '#FFD35A', '#5BBF4A', '#C8352A'][Math.floor(x / 110) % 4]; c.fillRect(x + 6, 88, 72, 22);
  }
  c.fillStyle = '#13306E'; c.fillRect(0, 0, W, 46);
  c.fillStyle = '#13306E'; rrect(c, W / 2 - signW / 2, 80, signW, 38, 8); c.fill();
  c.font = '400 ' + (signW < 260 ? 15 : 19) + 'px ' + FONT.d; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('SOUTH CAMPUS DINING', W / 2, 100, signW - 16);
  // floor
  const fy = H * 0.62;
  for (let y = fy; y < H; y += 44) for (let x = 0; x < W; x += 44) { c.fillStyle = ((x + y) / 44) % 2 ? '#D9CDB8' : '#E8DDCA'; c.fillRect(x, y, 44, 44); }
}
const TrayDash = {
  title: 'Tray Dash', where: 'South Campus Dining', length: '25 seconds',
  howto: o => '<p>The dining hall is slammed. Catch the good food on Jaret\'s tray and dodge the burnt toast and mystery casserole.</p><div class="howto"><div><b>Move</b><span>Drag, move the mouse, or use ← → / A D</span></div><div><b>Golden waffle</b><span>Worth 5 points. Grab it!</span></div><div><b>Bad food</b><span>−2 and it breaks your combo</span></div></div>',
  preview(c, w, h, t) { drawDiningBG(c, w, h * 1.6, t); ['pancakes', 'waffle', 'egg', 'toast', 'golden'].forEach((k, i) => drawIcon(c, k, w * (0.15 + i * 0.175), 92 + ((t * 60 + i * 37) % 70), 40, t)); },
  create(opts) {
    return {
      meal: opts.meal || 'breakfast', time: 25, score: 0, items: [], spawn: 0.4, trayX: 320, targetX: 320, caught: [], good: 0, bad: 0, combo: 0, shake: 0, parts: [], pops: [], init: false,
      update(dt, W, H) {
        if (!this.init) { this.trayX = this.targetX = W / 2; this.init = true; }
        this.time -= dt;
        const K = Input.keys;
        const kv = ((K.has('ArrowRight') || K.has('d')) ? 1 : 0) - ((K.has('ArrowLeft') || K.has('a')) ? 1 : 0);
        if (kv) this.targetX += kv * 620 * dt;
        this.targetX = clamp(this.targetX, 70, W - 70);
        this.trayX = lerp(this.trayX, this.targetX, 1 - Math.pow(0.0005, dt));
        this.spawn -= dt;
        const prog = 1 - this.time / 25;
        if (this.spawn <= 0 && this.time > 0.6) {
          this.spawn = lerp(0.62, 0.36, prog);
          const r = Math.random();
          const kind = r < 0.04 ? 'golden' : r < 0.26 ? (this.meal === 'breakfast' ? 'toast' : pick(['mystery', 'toast'])) : pick(MEALS[this.meal]);
          this.items.push({ kind, x: rand(50, W - 50), y: 130, vy: rand(200, 300) * (1 + prog * 0.6) * Math.max(1, H / 760), rot: rand(-1, 1), vr: rand(-2, 2) });
        }
        const ty = H - 108;
        for (const it of this.items) {
          it.y += it.vy * dt; it.rot += it.vr * dt;
          if (!it.done && it.y > ty - 14 && it.y < ty + 24 && Math.abs(it.x - this.trayX) < 82) {
            it.done = true;
            const bad = it.kind === 'toast' || it.kind === 'mystery';
            if (bad) {
              this.score = Math.max(0, this.score - 2); this.bad++; this.combo = 0; this.shake = 0.3;
              Sound.play('splat'); burst(this.parts, it.x, ty, '#5A6A3A', 14);
              this.pops.push({ text: '−2', color: '#FF6B7D', x: it.x, y: ty - 30, t: 0, life: 0.8 });
            } else {
              const pts = it.kind === 'golden' ? 5 : 1;
              this.combo++;
              const bonus = this.combo % 5 === 0 ? 1 : 0;
              this.score += pts + bonus; this.good++;
              this.caught.push(it.kind); if (this.caught.length > 7) this.caught.shift();
              Sound.play(it.kind === 'golden' ? 'fanfare' : 'coin'); burst(this.parts, it.x, ty, it.kind === 'golden' ? '#FFC94A' : '#FFFFFF', 8, 160);
              this.pops.push({ text: '+' + (pts + bonus) + (bonus ? ' combo!' : ''), color: '#FFC94A', x: it.x, y: ty - 30, t: 0, life: 0.8 });
            }
          }
        }
        this.items = this.items.filter(it => !it.done && it.y < H + 40);
        this.parts = stepParticles(this.parts, dt); this.pops = stepPops(this.pops, dt);
        this.shake = Math.max(0, this.shake - dt);
        if (this.time <= 0) { this.time = 0; this.over = true; this.result = { score: this.score, good: this.good, bad: this.bad, meal: this.meal }; }
      },
      settle(dt) { this.parts = stepParticles(this.parts, dt); this.pops = stepPops(this.pops, dt); },
      pointer(type, x) { if (type !== 'up') this.targetX = x; },
      hud() { return { score: this.score, time: this.time }; },
      draw(c, W, H, t) {
        c.save();
        if (this.shake > 0) c.translate(rand(-6, 6) * this.shake * 3, rand(-6, 6) * this.shake * 3);
        drawDiningBG(c, W, H, t);
        for (const it of this.items) { c.save(); c.translate(it.x, it.y); c.rotate(it.rot); drawIcon(c, it.kind, 0, 0, 52, t); c.restore(); }
        const x = this.init ? this.trayX : W / 2, ty = H - 108;
        // Jaret from behind holding the tray
        c.fillStyle = '#13306E'; c.beginPath(); c.ellipse(x, H + 30, 120, 90, 0, Math.PI, TAU); c.fill();
        c.fillStyle = '#13306E'; rrect(c, x - 104, ty + 8, 30, 70, 12); c.fill(); rrect(c, x + 74, ty + 8, 30, 70, 12); c.fill();
        c.fillStyle = LOOKS.jaret.skin; c.beginPath(); c.arc(x - 88, ty + 10, 13, 0, TAU); c.arc(x + 88, ty + 10, 13, 0, TAU); c.fill();
        c.fillStyle = '#9AA3AE'; rrect(c, x - 96, ty - 4, 192, 18, 6); c.fill();
        c.fillStyle = '#C2CAD3'; rrect(c, x - 92, ty - 8, 184, 12, 5); c.fill();
        this.caught.forEach((k, i) => drawIcon(c, k, x - 72 + i * 24, ty - 18 - (i % 2) * 6, 34, t));
        c.fillStyle = LOOKS.jaret.skin; c.beginPath(); c.ellipse(x, H - 18, 46, 50, 0, 0, TAU); c.fill();
        c.fillStyle = LOOKS.jaret.hair; c.beginPath(); c.ellipse(x, H - 26, 48, 50, 0, 0, TAU); c.fill();
        c.strokeStyle = LOOKS.jaret.hairDark; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x - 20, H - 66); c.quadraticCurveTo(x - 12, H - 40, x - 18, H - 10); c.moveTo(x + 14, H - 70); c.quadraticCurveTo(x + 22, H - 40, x + 16, H - 8); c.stroke();
        c.strokeStyle = LOOKS.jaret.hairHi; c.lineWidth = 5; c.beginPath(); c.moveTo(x - 24, H - 62); c.quadraticCurveTo(x, H - 74, x + 24, H - 62); c.stroke();
        drawParticles(c, this.parts); popTexts(c, this.pops);
        if (this.combo >= 3) { c.font = '700 22px ' + FONT.c; c.textAlign = 'center'; c.fillStyle = '#13306E'; c.fillText('COMBO x' + this.combo, x, ty - 52); }
        c.restore();
      },
    };
  },
};

/* ======================= Pop Quiz (Laurel Hall lecture) ======================= */
const QUIZ_PSYCH = [
  { q: "Pavlov's dogs learned to drool at the sound of a…", a: ['Bell', 'Trumpet', 'Vacuum cleaner', 'Car horn'] },
  { q: 'Which lobe of the brain does most of the planning and decision-making?', a: ['Frontal lobe', 'Occipital lobe', 'Temporal lobe', 'Parietal lobe'] },
  { q: 'The fight-or-flight response is powered mostly by which hormone?', a: ['Adrenaline', 'Melatonin', 'Insulin', 'Serotonin'] },
  { q: 'Abraham Maslow is famous for the…', a: ['Hierarchy of needs', 'Stanford prison study', 'Bobo doll study', 'Theory of relativity'] },
  { q: 'B. F. Skinner is best known for studying…', a: ['Operant conditioning', 'Dream analysis', 'Hypnosis', 'Handwriting'] },
  { q: 'Your most vivid dreams usually happen during…', a: ['REM sleep', 'Stage 1 sleep', 'Deep (stage 3) sleep', 'This lecture'] },
  { q: "The classic 'magic number' for short-term memory is…", a: ['7 ± 2 items', '3 ± 1 items', '20 ± 5 items', '100 items'] },
  { q: 'Who founded psychoanalysis?', a: ['Sigmund Freud', 'Carl Rogers', 'Ivan Pavlov', 'Jean Piaget'] },
  { q: 'Jean Piaget is known for studying…', a: ["How children's thinking develops", 'Rats in mazes', 'Color blindness', 'Sleepwalking'] },
];
const QUIZ_HUSKY = [
  { q: "Icebreaker! UConn's live husky mascot is always named…", a: ['Jonathan', 'Rex', 'Blizzard', 'Max'] },
  { q: "Icebreaker! UConn's main campus is in…", a: ['Storrs', 'Hartford', 'New Haven', 'Stamford'] },
  { q: "Icebreaker! UConn's school colors are navy blue and…", a: ['White', 'Orange', 'Maroon', 'Green'], quip: { Orange: "Orange? That's Syracuse, my friend." } },
  { q: "Icebreaker! The Dairy Bar's famous Jonathan Supreme has a peanut butter swirl and…", a: ['Chocolate-covered peanuts', 'Gummy bears', 'Pretzel bites', 'Rainbow sprinkles'] },
];
function drawLectureBG(c, W, H, t) {
  c.fillStyle = '#3E3A4A'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#4A4558'; for (let x = 0; x < W; x += 60) c.fillRect(x, 0, 30, H * 0.6);
  // seats rising toward the viewer
  for (let r = 0; r < 4; r++) {
    const y = H - 40 - r * 46;
    c.fillStyle = r % 2 ? '#7A2E2E' : '#8A3636'; c.fillRect(0, y, W, 34);
    for (let x = 30 + (r % 2) * 40; x < W; x += 80) {
      if (r === 0 && Math.abs(x - W * 0.5) < 50) continue;
      const lk = LOOKS[['kai', 'emma', 'leo', 'ava', 'noah', 'sofia', 'jordan', 'mia'][(x / 80 + r * 3 | 0) % 8]];
      c.fillStyle = lk.hair; c.beginPath(); c.ellipse(x, y - 4 + Math.sin(t * 1.5 + x) * 1.2, 20, 22, 0, 0, TAU); c.fill();
    }
  }
}
const PopQuiz = {
  title: 'Pop Quiz', where: 'Laurel Hall', length: '5 questions',
  howto: o => '<p>Day one and the professor is already springing a "no-pressure" quiz. Answer fast: quicker answers earn more Brain.</p><div class="howto"><div><b>Answer</b><span>Tap a choice, or press 1–4</span></div><div><b>Timer</b><span>' + (o.tired ? '9 seconds a question (Jaret is sleepy)' : '12 seconds a question') + '</span></div></div>',
  preview(c, w, h, t) { drawLectureBG(c, w, h * 1.4, t); c.fillStyle = '#F4F6FA'; rrect(c, w * 0.2, 16, w * 0.6, 84, 8); c.fill(); c.fillStyle = '#13306E'; c.font = '400 18px ' + FONT.d; c.textAlign = 'center'; c.fillText('PSYC · DAY 1', w / 2, 58); },
  create(opts) {
    const pickN = (arr, n) => shuffle(arr.slice()).slice(0, n);
    const qs = pickN(QUIZ_PSYCH, opts.late ? 3 : 4).concat(pickN(QUIZ_HUSKY, 1)).map(q => ({ q: q.q, correct: q.a[0], opts: shuffle(q.a.slice()), quip: q.quip }));
    const per = opts.tired ? 9 : 12;
    return {
      qs, qi: 0, per, left: per, pick: -1, fb: 0, correct: 0, points: 0, boxes: [], bubble: null, pops: [],
      update(dt) {
        this.pops = stepPops(this.pops, dt);
        if (this.pick === -1) {
          this.left -= dt;
          if (this.left <= 0) { this.left = 0; this.pick = -2; this.fb = 1.4; this.bubble = "Time's up!"; Sound.play('bad'); }
        } else {
          this.fb -= dt;
          if (this.fb <= 0) {
            this.qi++;
            if (this.qi >= this.qs.length) { this.over = true; this.endText = this.correct + ' / ' + this.qs.length; this.result = { correct: this.correct, total: this.qs.length, points: this.points }; return; }
            this.pick = -1; this.left = this.per; this.bubble = null;
          }
        }
      },
      answer(i) {
        if (this.pick !== -1 || this.over) return;
        const q = this.qs[this.qi];
        this.pick = i; this.fb = 1.25;
        if (q.opts[i] === q.correct) {
          const pts = 6 + Math.round(4 * this.left / this.per);
          this.correct++; this.points += pts; Sound.play('good');
          this.bubble = pick(['Correct!', 'Exactly right.', 'Nice!', 'Somebody did the reading.']);
          const b = this.boxes[i]; if (b) this.pops.push({ text: '+' + pts, color: '#FFC94A', x: b.x + b.w / 2, y: b.y, t: 0, life: 0.9 });
        } else {
          Sound.play('bad');
          this.bubble = (q.quip && q.quip[q.opts[i]]) || 'Not quite. It\'s "' + q.correct + '".';
        }
      },
      pointer(type, x, y) { if (type !== 'down') return; this.boxes.forEach((b, i) => { if (inBox(x, y, b)) this.answer(i); }); },
      key(k) { const n = parseInt(k, 10); if (n >= 1 && n <= 4) this.answer(n - 1); },
      hud() { return { score: this.points, scoreLabel: 'Brain', time: this.pick === -1 ? this.left : null }; },
      draw(c, W, H, t) {
        drawLectureBG(c, W, H, t);
        const q = this.qs[Math.min(this.qi, this.qs.length - 1)];
        const portrait = W < H;
        const top = 70 + (this.safe || 0) + (W < 520 ? 50 : 0);
        const bw = Math.min(W - 40, 820), bx = (W - bw) / 2;
        // projector screen
        c.font = '600 ' + (portrait ? 24 : 26) + 'px ' + FONT.b;
        const lines = wrapText(c, q.q, bw - 60);
        const bh = 74 + lines.length * 32;
        c.fillStyle = '#F4F6FA'; rrect(c, bx, top, bw, bh, 10); c.fill();
        c.fillStyle = '#13306E'; c.fillRect(bx, top, bw, 30);
        c.font = '700 14px ' + FONT.c; c.fillStyle = '#FFFFFF'; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText('INTRO TO PSYCHOLOGY · QUESTION ' + (Math.min(this.qi, this.qs.length - 1) + 1) + ' OF ' + this.qs.length, bx + 16, top + 16);
        c.font = '600 ' + (portrait ? 24 : 26) + 'px ' + FONT.b; c.fillStyle = '#0A1638';
        lines.forEach((l, i) => c.fillText(l, bx + 30, top + 58 + i * 32));
        if (this.pick === -1) { c.fillStyle = '#FFC94A'; c.fillRect(bx, top + bh - 6, bw * (this.left / this.per), 6); }
        // professor
        const px = portrait ? W - 60 : bx - 10;
        if (!portrait) drawPerson(c, Math.max(60, px - 40), top + bh + 120, Object.assign({}, LOOKS.prof, { scale: 2 }), 'down', 0, false);
        if (this.bubble) {
          c.font = '700 20px ' + FONT.b;
          const tw = Math.min(c.measureText(this.bubble).width + 30, W - 40);
          const by = top + bh + 14;
          const bxx = portrait ? (W - tw) / 2 : clamp(Math.max(60, px - 40) + 30, 20, W - tw - 20);
          c.fillStyle = '#FFFFFF'; rrect(c, bxx, by, tw, 40, 12); c.fill();
          c.fillStyle = '#0A1638'; c.textAlign = 'center'; c.fillText(this.bubble, bxx + tw / 2, by + 21, tw - 20);
        }
        // answers
        const cols = portrait ? 1 : 2, gap = 14;
        const aTop = top + bh + 66;
        const aw = cols === 1 ? Math.min(W - 40, 560) : Math.min(380, (bw - gap) / 2);
        const ah = portrait ? 60 : 66;
        const totalW = cols * aw + (cols - 1) * gap, ax0 = (W - totalW) / 2;
        this.boxes = q.opts.map((o, i) => ({ x: ax0 + (i % cols) * (aw + gap), y: aTop + Math.floor(i / cols) * (ah + gap), w: aw, h: ah }));
        q.opts.forEach((o, i) => {
          const b = this.boxes[i];
          let bg = '#FFFFFF', fg = '#0A1638';
          if (this.pick !== -1) {
            if (o === q.correct) { bg = '#3CC47C'; fg = '#04230F'; }
            else if (i === this.pick) { bg = '#FF6B7D'; fg = '#3A0410'; }
            else { bg = 'rgba(255,255,255,.55)'; }
          }
          c.fillStyle = 'rgba(0,0,0,.25)'; rrect(c, b.x, b.y + 4, b.w, b.h, 12); c.fill();
          c.fillStyle = bg; rrect(c, b.x, b.y, b.w, b.h, 12); c.fill();
          c.fillStyle = '#13306E'; rrect(c, b.x + 12, b.y + b.h / 2 - 15, 30, 30, 8); c.fill();
          c.fillStyle = '#FFFFFF'; c.font = '700 18px ' + FONT.c; c.textAlign = 'center'; c.fillText(String(i + 1), b.x + 27, b.y + b.h / 2 + 1);
          c.fillStyle = fg; c.font = '600 19px ' + FONT.b; c.textAlign = 'left';
          c.fillText(o, b.x + 54, b.y + b.h / 2 + 1, b.w - 66);
        });
        popTexts(c, this.pops);
      },
    };
  },
};

/* ======================= Math Sprint (Oak Hall calculus) ======================= */
const SUP = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' };
function xPow(coef, n) {
  if (n === 0) return String(coef);
  return (coef === 1 ? '' : coef) + 'x' + (n === 1 ? '' : SUP[n]);
}
function makeProblem(level) {
  const type = pick(level < 3 ? ['mult', 'add', 'pct', 'sqrt'] : ['mult', 'add', 'pct', 'lin', 'deriv', 'sqrt', 'deriv', 'lin']);
  let q, ans, near;
  if (type === 'mult') { const a = randi(3, 12), b = randi(3, 12); q = a + ' × ' + b; ans = a * b; near = [ans + a, ans - b, ans + 10, ans - 1, ans + 2]; }
  else if (type === 'add') { const a = randi(14, 89), b = randi(12, 79); q = a + ' + ' + b; ans = a + b; near = [ans + 10, ans - 10, ans + 1, ans - 1, ans + 9]; }
  else if (type === 'pct') { const p = pick([10, 20, 25, 50]), n = pick([40, 60, 80, 120, 200, 240]); q = p + '% of ' + n; ans = n * p / 100; near = [ans * 2, ans + 5, ans - 5, ans + 10, n - ans]; }
  else if (type === 'sqrt') { const k = randi(4, 15); q = '√' + (k * k); ans = k; near = [k + 1, k - 1, k * 2, k + 2]; }
  else if (type === 'lin') { const a = randi(2, 5), x = randi(1, 9), b = randi(1, 12); q = 'Solve: ' + a + 'x + ' + b + ' = ' + (a * x + b); ans = 'x = ' + x; near = ['x = ' + (x + 1), 'x = ' + (x - 1), 'x = ' + (x + 2), 'x = ' + (a * x)]; }
  else { const n = randi(2, 5); q = 'd/dx of ' + xPow(1, n); ans = xPow(n, n - 1); near = [xPow(1, n - 1), xPow(n, n), xPow(n - 1, n), xPow(n + 1, n - 1)]; }
  const ansStr = String(ans);
  const set = new Set([ansStr]);
  for (const v of shuffle(near.slice())) { const s = String(v); if (set.size < 4 && s !== ansStr && !s.includes('-') && s !== '0') set.add(s); }
  let bump = 2;
  while (set.size < 4) { if (typeof ans === 'number') set.add(String(ans + bump)); else set.add(ansStr + '·' + bump); bump++; }
  return { q, ans: ansStr, opts: shuffle([...set]) };
}
function drawChalkBG(c, W, H) {
  c.fillStyle = '#5C4A3A'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#6E5A48'; for (let y = 0; y < H; y += 28) c.fillRect(0, y, W, 2);
  const m = 18;
  c.fillStyle = '#8A6A44'; rrect(c, m - 8, m + 40, W - m * 2 + 16, H * 0.62 + 16, 10); c.fill();
  c.fillStyle = '#2F5A46'; rrect(c, m, m + 48, W - m * 2, H * 0.62, 6); c.fill();
  c.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(W * (0.15 + i * 0.15), m + 48 + H * 0.3, 80, 30, 0.3, 0, TAU); c.fill(); }
}
const MathSprint = {
  title: 'Math Sprint', where: 'Oak Hall', length: '40 seconds',
  howto: o => '<p>Calc I warm-up. Solve as many as you can before the bell. A wrong answer costs 3 seconds, and a streak shows off.</p><div class="howto"><div><b>Answer</b><span>Tap a choice, or press 1–4</span></div><div><b>Time</b><span>' + (o.late ? '30 seconds (you walked in late)' : '40 seconds') + '</span></div></div>',
  preview(c, w, h) { drawChalkBG(c, w, h * 1.4); c.font = '700 34px ' + FONT.b; c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('d/dx of x³ = ?', w / 2, h * 0.55); },
  create(opts) {
    const dur = opts.late ? 30 : 40;
    return {
      time: dur, cur: makeProblem(0), solved: 0, wrong: 0, streak: 0, best: 0, flash: 0, flashGood: true, boxes: [], pops: [], shake: 0,
      update(dt) {
        this.time -= dt; this.flash = Math.max(0, this.flash - dt); this.shake = Math.max(0, this.shake - dt);
        this.pops = stepPops(this.pops, dt);
        if (this.time <= 0) { this.time = 0; this.over = true; this.endText = this.solved + ' SOLVED'; this.result = { solved: this.solved, wrong: this.wrong, best: this.best }; }
      },
      answer(i) {
        const o = this.cur.opts[i]; if (o == null || this.over) return;
        const b = this.boxes[i];
        if (o === this.cur.ans) {
          this.solved++; this.streak++; this.best = Math.max(this.best, this.streak);
          Sound.play(this.streak % 5 === 0 ? 'fanfare' : 'good'); this.flash = 0.25; this.flashGood = true;
          if (b) this.pops.push({ text: this.streak >= 3 ? 'Streak ' + this.streak + '!' : '+1', color: '#FFC94A', x: b.x + b.w / 2, y: b.y, t: 0, life: 0.8 });
        } else {
          this.wrong++; this.streak = 0; this.time -= 3; Sound.play('bad'); this.flash = 0.3; this.flashGood = false; this.shake = 0.25;
          if (b) this.pops.push({ text: '−3s', color: '#FF6B7D', x: b.x + b.w / 2, y: b.y, t: 0, life: 0.8 });
        }
        this.cur = makeProblem(this.solved);
      },
      pointer(type, x, y) { if (type !== 'down') return; this.boxes.forEach((b, i) => { if (inBox(x, y, b)) this.answer(i); }); },
      key(k) { const n = parseInt(k, 10); if (n >= 1 && n <= 4) this.answer(n - 1); },
      hud() { return { score: this.solved, scoreLabel: 'Solved', time: this.time }; },
      draw(c, W, H, t) {
        c.save();
        if (this.shake) c.translate(rand(-5, 5), 0);
        drawChalkBG(c, W, H);
        const boardTop = 66, boardH = H * 0.62;
        const top = boardTop + (this.safe || 0) + (W < 520 ? 50 : 0) + 20;
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = '700 15px ' + FONT.c; c.fillStyle = 'rgba(255,255,255,.6)';
        c.fillText('CALC I WARM-UP · ' + (this.streak >= 3 ? 'STREAK ' + this.streak : 'KEEP IT ROLLING'), W / 2, top + 20);
        c.font = '700 ' + (W < 520 ? 44 : 56) + 'px ' + FONT.b; c.fillStyle = '#F4F6FA';
        c.fillText(this.cur.q, W / 2, top + 84, W - 60);
        if (this.flash) { c.fillStyle = this.flashGood ? 'rgba(60,196,124,' + this.flash * 2 + ')' : 'rgba(255,107,125,' + this.flash * 2 + ')'; c.fillRect(18, boardTop - 18 + 48, W - 36, boardH); }
        const portrait = W < H, cols = portrait ? 2 : 4, gap = 14;
        const aw = Math.min(portrait ? (W - 40 - gap) / 2 : 200, 240), ah = 70;
        const totalW = cols * aw + (cols - 1) * gap, ax0 = (W - totalW) / 2;
        const aTop = Math.max(top + 140, boardTop + 48 + boardH - (portrait ? 2 * ah + gap + 24 : ah + 24));
        this.boxes = this.cur.opts.map((o, i) => ({ x: ax0 + (i % cols) * (aw + gap), y: aTop + Math.floor(i / cols) * (ah + gap), w: aw, h: ah }));
        this.cur.opts.forEach((o, i) => {
          const b = this.boxes[i];
          c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3; rrect(c, b.x, b.y, b.w, b.h, 10); c.stroke();
          c.fillStyle = 'rgba(255,255,255,.08)'; c.fill();
          c.font = '700 14px ' + FONT.c; c.fillStyle = 'rgba(255,255,255,.6)'; c.textAlign = 'left'; c.fillText(String(i + 1), b.x + 10, b.y + 14);
          c.font = '700 28px ' + FONT.b; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.fillText(o, b.x + b.w / 2, b.y + b.h / 2 + 2, b.w - 24);
        });
        // desk + professor
        const deskY = boardTop + 48 + boardH + 18;
        c.fillStyle = '#8A6A44'; c.fillRect(0, deskY, W, H - deskY);
        c.fillStyle = '#6E5236'; c.fillRect(0, deskY, W, 8);
        if (H - deskY > 60) drawPerson(c, W - 70, H - 6, Object.assign({}, LOOKS.profk, { scale: 1.6 }), 'down', 0, false);
        drawIcon(c, 'calc', 60, deskY + 40, 44);
        popTexts(c, this.pops);
        c.restore();
      },
    };
  },
};

/* ======================= Swag Grab (Student Union club fair) ======================= */
const SWAG = [
  { k: 'tshirt', pts: 3, w: 18, name: 'T-shirt' }, { k: 'sticker', pts: 1, w: 22, name: 'Sticker' }, { k: 'bottle', pts: 2, w: 14, name: 'Water bottle' },
  { k: 'lanyard', pts: 1, w: 14, name: 'Lanyard' }, { k: 'pizza', pts: 2, w: 12, name: 'Pizza slice' }, { k: 'finger', pts: 3, w: 10, name: 'Foam finger' },
  { k: 'hoodie', pts: 8, w: 3, name: 'Free hoodie' }, { k: 'clipboard', pts: -3, w: 16, name: '5 AM crew sign-up' },
];
const CLUBS = [
  { name: 'Ultimate Frisbee', color: '#F2B134' }, { name: 'Gaming Society', color: '#7B5CD6' }, { name: 'Improv Troupe', color: '#13A39A' },
  { name: 'Outing Club', color: '#3E6B3A' }, { name: 'Ballroom Dance', color: '#E94F7A' }, { name: 'Robotics', color: '#5E8FD9' },
];
function pickSwag() {
  const total = SWAG.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  for (const s of SWAG) { if ((r -= s.w) < 0) return s; }
  return SWAG[0];
}
function swagTables(W, H, top) {
  const portrait = W < H, cols = portrait ? 2 : 3, rows = portrait ? 3 : 2;
  const gx = 18, avail = H - top - 30;
  const tw = Math.min((W - gx * (cols + 1)) / cols, 300), th = Math.min((avail - 20 * (rows - 1)) / rows, 210);
  const x0 = (W - (cols * tw + (cols - 1) * gx)) / 2;
  const out = [];
  for (let i = 0; i < 6; i++) out.push({ x: x0 + (i % cols) * (tw + gx), y: top + Math.floor(i / cols) * (th + 20), w: tw, h: th, club: CLUBS[i] });
  return out;
}
function drawUnionBG(c, W, H) {
  c.fillStyle = '#DCD5C6'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#C9C1B0'; for (let x = 0; x < W; x += 80) c.fillRect(x, 0, 40, H);
  c.fillStyle = 'rgba(19,48,110,.9)'; c.fillRect(0, 0, W, 8);
}
function drawSwagTable(c, tb, t, i) {
  const recruiter = LOOKS[['mia', 'leo', 'ava', 'noah', 'emma', 'kai'][i]];
  const headY = tb.y + tb.h * 0.42;
  c.fillStyle = recruiter.shirt; rrect(c, tb.x + tb.w / 2 - 26, headY + 10, 52, 40, 14); c.fill();
  c.fillStyle = recruiter.skin; c.beginPath(); c.arc(tb.x + tb.w / 2, headY, 16, 0, TAU); c.fill();
  c.fillStyle = recruiter.hair; c.beginPath(); c.ellipse(tb.x + tb.w / 2, headY - 8, 17, 10, 0, Math.PI, TAU); c.fill();
  // banner
  c.fillStyle = tb.club.color; rrect(c, tb.x + 8, tb.y, tb.w - 16, 34, 6); c.fill();
  c.font = '700 ' + (tb.w < 170 ? 15 : 18) + 'px ' + FONT.c; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(tb.club.name.toUpperCase(), tb.x + tb.w / 2, tb.y + 18, tb.w - 28);
  // table
  const ty = tb.y + tb.h * 0.62;
  c.fillStyle = shade(tb.club.color, -0.25); c.fillRect(tb.x, ty, tb.w, tb.h - (ty - tb.y));
  c.fillStyle = tb.club.color; c.fillRect(tb.x, ty, tb.w, 12);
  c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(tb.x, ty + 12, tb.w, 3);
}
const SwagGrab = {
  title: 'Swag Grab', where: 'Student Union', length: '25 seconds',
  howto: () => '<p>The club fair is giving away free stuff. Tap swag the moment it pops up on a table, before someone else grabs it.</p><div class="howto"><div><b>Grab</b><span>Tap or click an item</span></div><div><b>Free hoodie</b><span>Rare and worth 8 points</span></div><div><b>Avoid</b><span>The 5 AM crew sign-up clipboard (−3)</span></div></div>',
  preview(c, w, h, t) { drawUnionBG(c, w, h); const tb = swagTables(w, h * 2.2, 20).slice(0, 3); tb.forEach((x, i) => drawSwagTable(c, x, t, i)); },
  create() {
    return {
      time: 25, score: 0, pops: [], parts: [], active: [], spawn: 0.3, items: {}, pizzas: 0, bad: 0, tables: [],
      update(dt, W, H) {
        this.time -= dt;
        this.pops = stepPops(this.pops, dt); this.parts = stepParticles(this.parts, dt);
        const prog = 1 - this.time / 25;
        for (const a of this.active) a.t += dt;
        this.active = this.active.filter(a => a.t < a.life);
        this.spawn -= dt;
        if (this.spawn <= 0 && this.time > 0.5 && this.tables.length) {
          this.spawn = lerp(0.62, 0.38, prog);
          const free = [0, 1, 2, 3, 4, 5].filter(i => !this.active.some(a => a.table === i));
          if (free.length) { const s = pickSwag(); this.active.push({ table: pick(free), s, t: 0, life: lerp(1.9, 1.25, prog) }); }
        }
        if (this.time <= 0) { this.time = 0; this.over = true; this.result = { score: this.score, items: this.items, pizzas: this.pizzas, bad: this.bad }; }
      },
      settle(dt) { this.pops = stepPops(this.pops, dt); this.parts = stepParticles(this.parts, dt); },
      itemPos(a) { const tb = this.tables[a.table]; const k = clamp(a.t / 0.18, 0, 1); return { x: tb.x + tb.w / 2, y: tb.y + tb.h * 0.62 - 26 - ease.back(k) * 18 }; },
      pointer(type, x, y) {
        if (type !== 'down') return;
        for (const a of this.active) {
          const p = this.itemPos(a);
          if (dist(x, y, p.x, p.y) < 48) {
            this.active.splice(this.active.indexOf(a), 1);
            const s = a.s;
            this.score = Math.max(0, this.score + s.pts);
            if (s.pts < 0) { this.bad++; Sound.play('bad'); this.pops.push({ text: 'Signed up for 5 AM crew!', color: '#FF6B7D', x: p.x, y: p.y - 30, t: 0, life: 1.2, size: 20 }); }
            else {
              this.items[s.k] = (this.items[s.k] || 0) + 1; if (s.k === 'pizza') this.pizzas++;
              Sound.play(s.k === 'hoodie' ? 'fanfare' : 'pop'); burst(this.parts, p.x, p.y, s.k === 'hoodie' ? '#FFC94A' : '#FFFFFF', 10, 200);
              this.pops.push({ text: '+' + s.pts + ' ' + s.name, color: '#FFC94A', x: p.x, y: p.y - 30, t: 0, life: 0.9, size: 22 });
            }
            return;
          }
        }
      },
      hud() { return { score: this.score, time: this.time }; },
      draw(c, W, H, t) {
        drawUnionBG(c, W, H);
        const top = 74 + (this.safe || 0) + (W < 520 ? 50 : 0);
        this.tables = swagTables(W, H, top);
        this.tables.forEach((tb, i) => drawSwagTable(c, tb, t, i));
        for (const a of this.active) {
          const p = this.itemPos(a), left = 1 - a.t / a.life;
          c.strokeStyle = left < 0.3 ? '#E0263F' : '#13306E'; c.lineWidth = 5;
          c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.arc(p.x, p.y, 36, 0, TAU); c.fill();
          c.beginPath(); c.arc(p.x, p.y, 38, -Math.PI / 2, -Math.PI / 2 + TAU * left); c.stroke();
          drawIcon(c, a.s.k, p.x, p.y, 50, t);
        }
        drawParticles(c, this.parts); popTexts(c, this.pops);
      },
    };
  },
};
