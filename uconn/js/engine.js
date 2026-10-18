'use strict';
/* Jaret's First Day — engine: helpers, audio, input routing, overlays (dialogue, cards, toasts, fades). */

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const wait = ms => new Promise(r => setTimeout(r, ms));
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const ease = {
  out: t => 1 - Math.pow(1 - t, 3),
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
function seeded(s) { return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function fmtTime(min) {
  min = Math.floor(min);
  const h = Math.floor(min / 60) % 24, m = min % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return hh + ':' + String(m).padStart(2, '0') + ' ' + ap;
}
function rrect(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
const FONT = {
  d: "'Graduate', Impact, 'Arial Black', sans-serif",
  b: "'Barlow', 'Segoe UI', system-ui, sans-serif",
  c: "'Barlow Condensed', 'Arial Narrow', system-ui, sans-serif",
};
const reduceMotion = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
const store = {
  get(k, d) { try { const v = localStorage.getItem('jfd:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('jfd:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
};

/* ---------------- Canvas ---------------- */
const cv = $('cv');
const ctx = cv.getContext('2d');
const view = { w: 1, h: 1, dpr: 1 };
function resizeCanvas() {
  const r = cv.getBoundingClientRect();
  view.w = Math.max(1, r.width);
  view.h = Math.max(1, r.height);
  // Sharp on phones, but cap the pixel count so big high-DPI monitors stay smooth.
  view.dpr = Math.min(2, window.devicePixelRatio || 1, Math.max(1, Math.sqrt(3.6e6 / (view.w * view.h))));
  cv.width = Math.round(view.w * view.dpr);
  cv.height = Math.round(view.h * view.dpr);
}
/* Logical stage for full-screen scenes: the shorter side is always 640 units. */
function stage() {
  const s = Math.min(view.w, view.h) / 640;
  return { s, W: view.w / s, H: view.h / s };
}
function fitCanvas(c) {
  const r = c.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  return { w, h, dpr };
}

/* ---------------- Game state ---------------- */
const G = {
  mode: 'boot',          // boot | title | world | scene | end
  busy: false,           // a scripted scene is running
  time: 8 * 60,          // minutes since midnight
  stats: { energy: 78, full: 35, spirit: 0, brain: 0 },
  friends: [],
  done: {},              // task id -> true
  late: {},              // class id -> true when Jaret walked in late
  flags: {},             // one-off story flags
  ach: [],               // achievement ids
  swag: {},
  results: {},           // mini-game results for the report card
  photo: null,           // data URL of the Jonathan selfie
  coffees: 0,
  mini: null,            // active mini-game instance
  scene: null,           // custom canvas renderer for cutscenes
};

/* ---------------- Audio ---------------- */
const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
const Sound = {
  ac: null, master: null, sfxBus: null, musBus: null, noiseBuf: null,
  sfxOn: store.get('sfx', true), musicOn: store.get('music', true),
  init() {
    if (this.ac) { this.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      const ac = new AC();
      this.ac = ac;
      this.master = ac.createGain(); this.master.gain.value = 0.85; this.master.connect(ac.destination);
      this.sfxBus = ac.createGain(); this.sfxBus.gain.value = 1; this.sfxBus.connect(this.master);
      this.musBus = ac.createGain(); this.musBus.gain.value = 0.55; this.musBus.connect(this.master);
      const len = ac.sampleRate;
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
      this.resume();
    } catch (e) { this.ac = null; }
  },
  resume() { if (this.ac && this.ac.state === 'suspended') this.ac.resume().catch(() => {}); },
  setSfx(on) { this.sfxOn = on; store.set('sfx', on); },
  setMusic(on) { this.musicOn = on; store.set('music', on); if (on) Music.start(); else Music.stop(); },
  tone(f, dur, o = {}) {
    const ac = this.ac;
    if (!ac) return;
    const t0 = o.at != null ? o.at : ac.currentTime + (o.delay || 0);
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(f, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    const v = o.vol != null ? o.vol : 0.1, a = o.attack != null ? o.attack : 0.004;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(a + 0.01, dur));
    osc.connect(g); g.connect(o.bus || this.sfxBus);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  },
  noise(dur, o = {}) {
    const ac = this.ac;
    if (!ac || !this.noiseBuf) return;
    const t0 = o.at != null ? o.at : ac.currentTime + (o.delay || 0);
    const src = ac.createBufferSource(); src.buffer = this.noiseBuf;
    const f = ac.createBiquadFilter(); f.type = o.filter || 'bandpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.freq || 1200, t0);
    if (o.freqTo) f.frequency.exponentialRampToValueAtTime(o.freqTo, t0 + dur);
    const g = ac.createGain();
    const v = o.vol != null ? o.vol : 0.1, a = o.attack != null ? o.attack : 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(a + 0.01, dur));
    src.connect(f); f.connect(g); g.connect(o.bus || this.sfxBus);
    src.start(t0, Math.random() * 0.5); src.stop(t0 + dur + 0.05);
  },
  play(name) {
    if (!this.ac || !this.sfxOn) return;
    const T = (f, d, o) => this.tone(f, d, o), N = (d, o) => this.noise(d, o);
    switch (name) {
      case 'blip': T(rand(820, 900), 0.035, { type: 'square', vol: 0.025 }); break;
      case 'select': T(660, 0.06, { vol: 0.05 }); T(990, 0.07, { vol: 0.05, delay: 0.05 }); break;
      case 'confirm': [523, 659, 784].forEach((f, i) => T(f, 0.09, { vol: 0.06, delay: i * 0.06 })); break;
      case 'coin': T(988, 0.07, { vol: 0.06 }); T(1319, 0.16, { vol: 0.06, delay: 0.06 }); break;
      case 'good': T(660, 0.1, { type: 'triangle', vol: 0.14 }); T(880, 0.16, { type: 'triangle', vol: 0.14, delay: 0.07 }); break;
      case 'bad': T(220, 0.28, { type: 'sawtooth', vol: 0.07, to: 120 }); break;
      case 'swish': N(0.32, { freq: 2600, freqTo: 5200, q: 0.8, vol: 0.12, attack: 0.04 }); break;
      case 'rim': T(520, 0.14, { type: 'triangle', vol: 0.12 }); T(1046, 0.09, { type: 'triangle', vol: 0.06 }); break;
      case 'bounce': T(150, 0.14, { type: 'sine', vol: 0.22, to: 70 }); break;
      case 'honk': T(330, 0.26, { type: 'sawtooth', vol: 0.08, to: 270 }); T(336, 0.26, { type: 'square', vol: 0.04, to: 272 }); break;
      case 'bark': T(480, 0.11, { type: 'sawtooth', vol: 0.08, to: 240 }); N(0.08, { freq: 900, vol: 0.06 }); break;
      case 'cheer': N(1.3, { freq: 1300, q: 0.6, vol: 0.09, attack: 0.25 }); N(1.1, { freq: 2600, q: 0.8, vol: 0.05, attack: 0.3, delay: 0.1 }); break;
      case 'whoosh': N(0.35, { freq: 400, freqTo: 2400, q: 1.2, vol: 0.08, attack: 0.08 }); break;
      case 'pop': T(600, 0.07, { type: 'sine', vol: 0.12, to: 1300 }); break;
      case 'phone': T(1318, 0.09, { type: 'sine', vol: 0.08 }); T(1760, 0.16, { type: 'sine', vol: 0.08, delay: 0.1 }); break;
      case 'alarm': for (let i = 0; i < 4; i++) T(1046, 0.08, { vol: 0.05, delay: i * 0.16 }); break;
      case 'tick': T(1500, 0.02, { vol: 0.02 }); break;
      case 'thud': T(95, 0.16, { type: 'sine', vol: 0.25, to: 45 }); break;
      case 'camera': N(0.07, { filter: 'highpass', freq: 3000, vol: 0.12 }); T(2100, 0.03, { vol: 0.03, delay: 0.06 }); break;
      case 'splat': N(0.18, { filter: 'lowpass', freq: 700, vol: 0.18 }); break;
      case 'fanfare': [523, 659, 784, 1046].forEach((f, i) => T(f, i === 3 ? 0.4 : 0.12, { type: 'triangle', vol: 0.12, delay: i * 0.1 })); break;
      case 'moo': T(160, 0.7, { type: 'sawtooth', vol: 0.05, to: 120, attack: 0.15 }); break;
      case 'chirp': T(2400, 0.05, { type: 'sine', vol: 0.04, to: 3200 }); T(2600, 0.05, { type: 'sine', vol: 0.04, to: 3400, delay: 0.08 }); break;
      default: break;
    }
  },
};

/* A small looping score: C–G–Am–F, softer and slower after dark. */
const Music = {
  playing: false, mode: 'day', step: 0, nextTime: 0, timer: null,
  PROG: [48, 43, 45, 41],
  CHORD: [[60, 64, 67], [59, 62, 67], [60, 64, 69], [60, 65, 69]],
  MEL: [
    [76, 0, 79, 0, 84, 0, 83, 81], [79, 0, 74, 0, 79, 77, 76, 74], [72, 0, 76, 0, 81, 0, 79, 76], [77, 76, 74, 0, 72, 0, 74, 0],
    [76, 0, 79, 0, 84, 0, 86, 84], [83, 0, 79, 0, 74, 0, 79, 0], [81, 0, 84, 0, 88, 0, 86, 84], [83, 81, 79, 0, 0, 0, 0, 0],
  ],
  start() {
    if (!Sound.ac || this.playing || !Sound.musicOn) return;
    this.playing = true;
    this.nextTime = Sound.ac.currentTime + 0.1;
    this.timer = setInterval(() => this.tick(), 60);
  },
  stop() { this.playing = false; if (this.timer) clearInterval(this.timer); this.timer = null; },
  setMode(m) { this.mode = m; },
  tick() {
    const ac = Sound.ac;
    if (!ac || !this.playing) return;
    if (this.nextTime < ac.currentTime - 0.5) this.nextTime = ac.currentTime + 0.05; // tab was asleep
    const bpm = this.mode === 'night' ? 84 : this.mode === 'mini' ? 122 : 104;
    const spe = 60 / bpm / 2;
    while (this.nextTime < ac.currentTime + 0.3) {
      this.note(this.step, this.nextTime, spe);
      this.nextTime += spe;
      this.step = (this.step + 1) % 64;
    }
  },
  note(step, t, spe) {
    const bar = Math.floor(step / 8), s = step % 8, ci = bar % 4;
    const bus = Sound.musBus, night = this.mode === 'night';
    const T = (n, d, o) => Sound.tone(mtof(n), d, Object.assign({ at: t, bus }, o));
    const root = this.PROG[ci];
    if (s === 0 || s === 3) T(root, spe * 1.7, { type: 'triangle', vol: 0.16 });
    if (s === 4) T(root + 7, spe * 1.5, { type: 'triangle', vol: 0.13 });
    if (s === 6) T(root + 12, spe * 1.5, { type: 'triangle', vol: 0.12 });
    if (s === 2 || s === 6) this.CHORD[ci].forEach(n => T(n, spe * 1.6, { type: 'sine', vol: night ? 0.025 : 0.03, attack: 0.01 }));
    const m = this.MEL[bar][s];
    if (m) T(night ? m - 12 : m, spe * 1.8, { type: night ? 'sine' : 'triangle', vol: night ? 0.05 : 0.055, attack: 0.01 });
    if (!night) {
      if (s % 2 === 1) Sound.noise(0.03, { at: t, bus, filter: 'highpass', freq: 7000, vol: 0.025 });
      if (s === 0 || s === 4) Sound.tone(110, 0.12, { at: t, bus, type: 'sine', vol: 0.16, to: 50 });
    }
  },
};

/* ---------------- Input routing ---------------- */
const Input = { keys: new Set() };
const KEY_BLOCK = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter']);
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const onButton = document.activeElement && document.activeElement.tagName === 'BUTTON';
  // A focused button keeps native Enter/Space only on the title screen; everywhere else the game routes keys itself.
  if (KEY_BLOCK.has(e.key) && !(onButton && G.mode === 'title' && !UI.dlg && !UI.cardOpen)) e.preventDefault();
  Input.keys.add(k);
  if (e.repeat) return;
  if (UI.dlg) { UI.dlgKey(k); return; }
  if (UI.cardOpen) { UI.cardKey(k); return; }
  if (typeof BigMap !== 'undefined' && BigMap.open) { if (k === 'Escape' || k === 'm') BigMap.close(); return; }
  if (G.mini) { if (G.mini.key) G.mini.key(k); return; }
  if (G.mode === 'world' && !G.busy && typeof World !== 'undefined') World.key(k);
});
window.addEventListener('keyup', e => { Input.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key); });
window.addEventListener('blur', () => Input.keys.clear());

function canvasPoint(e) {
  const r = cv.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
let pointerDown = false;
cv.addEventListener('pointerdown', e => {
  Sound.init();
  pointerDown = true;
  try { cv.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
  const p = canvasPoint(e);
  if (G.mini) { const st = stage(); if (G.mini.pointer) G.mini.pointer('down', p.x / st.s, p.y / st.s); return; }
  if (G.mode === 'world' && !G.busy && !UI.dlg && !UI.cardOpen) World.tap(p.x, p.y);
});
cv.addEventListener('pointermove', e => {
  if (!G.mini || !G.mini.pointer) return;
  const p = canvasPoint(e), st = stage();
  G.mini.pointer(pointerDown ? 'drag' : 'move', p.x / st.s, p.y / st.s);
});
const endPointer = e => {
  if (!pointerDown) return;
  pointerDown = false;
  if (G.mini && G.mini.pointer) { const p = canvasPoint(e), st = stage(); G.mini.pointer('up', p.x / st.s, p.y / st.s); }
};
cv.addEventListener('pointerup', endPointer);
cv.addEventListener('pointercancel', endPointer);
cv.addEventListener('contextmenu', e => e.preventDefault());

/* ---------------- Overlays ---------------- */
const CHARS = {}; // filled in story.js: key -> { name, portrait(ctx, size, mood), voice }

const UI = {
  dlg: null, cardOpen: false, _card: null,

  say(who, text, mood) { return this.dialog(who, text, mood, null); },
  ask(who, text, choices, mood) { return this.dialog(who, text, mood, choices); },

  dialog(who, text, mood, choices) {
    return new Promise(resolve => {
      const ch = CHARS[who] || { name: '' };
      const el = $('dlg');
      el.hidden = false;
      el.classList.toggle('narr', !ch.portrait);
      $('dlgName').textContent = ch.name || '';
      const pc = $('dlgPortrait');
      if (ch.portrait) {
        const c = pc.getContext('2d');
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, pc.width, pc.height);
        ch.portrait(c, pc.width, mood || 'neutral');
      }
      const textEl = $('dlgText');
      textEl.textContent = '';
      const chEl = $('dlgChoices');
      chEl.innerHTML = '';
      chEl.hidden = true;
      $('dlgNext').hidden = true;
      const st = { text, shown: 0, done: false, choices, resolve, sel: 0, opened: performance.now(), voice: !!ch.portrait, last: performance.now(), raf: 0 };
      this.dlg = st;
      const finishTyping = () => {
        st.done = true;
        cancelAnimationFrame(st.raf);
        textEl.textContent = text;
        if (choices && choices.length) {
          chEl.hidden = false;
          choices.forEach((c, i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.innerHTML = '<span class="n">' + (i + 1) + '</span><span>' + esc(c) + '</span>';
            b.addEventListener('click', ev => { ev.stopPropagation(); this.dlgChoose(i); });
            b.addEventListener('mouseenter', () => { st.sel = i; this.dlgMark(); });
            chEl.appendChild(b);
          });
          this.dlgMark();
        } else {
          $('dlgNext').hidden = false;
        }
      };
      st.finishTyping = finishTyping;
      const step = now => {
        const dt = Math.min(0.05, (now - st.last) / 1000);
        st.last = now;
        const before = Math.floor(st.shown);
        st.shown += dt * (reduceMotion ? 400 : 62);
        const n = Math.floor(st.shown);
        if (n >= text.length) { finishTyping(); return; }
        if (n !== before) {
          textEl.textContent = text.slice(0, n);
          if (st.voice && n % 3 === 0 && text[n] !== ' ') Sound.play('blip');
        }
        st.raf = requestAnimationFrame(step);
      };
      st.raf = requestAnimationFrame(step);
    });
  },
  dlgMark() {
    const st = this.dlg;
    if (!st) return;
    [...$('dlgChoices').children].forEach((b, i) => b.classList.toggle('sel', i === st.sel));
  },
  dlgAdvance() {
    const st = this.dlg;
    if (!st || performance.now() - st.opened < 160) return;
    if (!st.done) { st.finishTyping(); return; }
    if (st.choices && st.choices.length) return;
    this.dlgClose(undefined);
  },
  dlgChoose(i) {
    const st = this.dlg;
    if (!st || !st.done || !st.choices || i < 0 || i >= st.choices.length) return;
    Sound.play('select');
    this.dlgClose(i);
  },
  dlgClose(v) {
    const st = this.dlg;
    if (!st) return;
    cancelAnimationFrame(st.raf);
    this.dlg = null;
    $('dlg').hidden = true;
    st.resolve(v);
  },
  dlgKey(k) {
    const st = this.dlg;
    if (!st) return;
    if (st.done && st.choices && st.choices.length) {
      const n = parseInt(k, 10);
      if (n >= 1 && n <= st.choices.length) { this.dlgChoose(n - 1); return; }
      if (k === 'ArrowDown' || k === 's') { st.sel = (st.sel + 1) % st.choices.length; this.dlgMark(); Sound.play('tick'); return; }
      if (k === 'ArrowUp' || k === 'w') { st.sel = (st.sel + st.choices.length - 1) % st.choices.length; this.dlgMark(); Sound.play('tick'); return; }
      if (k === 'Enter' || k === ' ' || k === 'e') this.dlgChoose(st.sel);
      return;
    }
    if (k === 'Enter' || k === ' ' || k === 'e' || k === 'Escape') this.dlgAdvance();
  },

  /* Card: a modal with optional animated art, html body and buttons. Resolves with the chosen button's value. */
  card(o) {
    return new Promise(resolve => {
      const el = $('card');
      el.hidden = false;
      this.cardOpen = true;
      $('cardPanel').classList.toggle('wide', !!o.wide);
      $('cardKicker').textContent = o.kicker || '';
      $('cardTitle').textContent = o.title || '';
      $('cardBody').innerHTML = o.html || '';
      const btns = $('cardBtns');
      btns.innerHTML = '';
      const st = { closed: false, raf: 0, buttons: o.buttons || [], opened: performance.now() };
      this._card = st;
      const finish = v => {
        if (st.closed) return;
        st.closed = true;
        cancelAnimationFrame(st.raf);
        el.hidden = true;
        this.cardOpen = false;
        this._card = null;
        resolve(v);
      };
      st.finish = finish;
      st.buttons.forEach((b, i) => {
        const bt = document.createElement('button');
        bt.type = 'button';
        bt.className = 'cbtn' + (b.primary ? ' primary' : '');
        bt.innerHTML = '<span class="k">' + (i + 1) + '</span><span class="l">' + esc(b.label) + '</span>' + (b.sub ? '<span class="s">' + esc(b.sub) + '</span>' : '');
        bt.disabled = !!b.disabled;
        bt.addEventListener('click', () => { if (performance.now() - st.opened < 200) return; Sound.play('select'); finish(b.value !== undefined ? b.value : i); });
        btns.appendChild(bt);
      });
      const art = $('cardArt');
      art.hidden = !o.art;
      if (o.art) {
        const t0 = performance.now();
        const loop = now => {
          if (st.closed) return;
          const f = fitCanvas(art);
          const c = art.getContext('2d');
          c.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
          c.clearRect(0, 0, f.w, f.h);
          try { o.art(c, f.w, f.h, (now - t0) / 1000); } catch (err) { console.error(err); }
          st.raf = requestAnimationFrame(loop);
        };
        st.raf = requestAnimationFrame(loop);
      }
      $('cardPanel').scrollTop = 0;
      const first = [...btns.children].find(b => !b.disabled && b.classList.contains('primary')) || [...btns.children].find(b => !b.disabled);
      if (first) { try { first.focus({ preventScroll: true }); } catch (err) { first.focus(); } }
    });
  },
  cardKey(k) {
    const st = this._card;
    if (!st || performance.now() - st.opened < 200) return;
    const n = parseInt(k, 10);
    const btnEls = [...$('cardBtns').children];
    if (n >= 1 && n <= btnEls.length) { if (!btnEls[n - 1].disabled) btnEls[n - 1].click(); return; }
    if (k === 'Escape') {
      const ci = st.buttons.findIndex(b => b.cancel);
      if (ci >= 0) btnEls[ci].click();
      return;
    }
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      const enabled = btnEls.filter(b => !b.disabled);
      if (!enabled.length) return;
      let i = enabled.indexOf(document.activeElement);
      i = k === 'ArrowDown' ? (i + 1) % enabled.length : (i - 1 + enabled.length) % enabled.length;
      enabled[i].focus();
      Sound.play('tick');
      return;
    }
    if (k === 'Enter' || k === ' ') {
      const a = document.activeElement;
      if (a && a.classList.contains('cbtn') && !a.disabled) a.click();
      else { const f = btnEls.find(b => !b.disabled); if (f) f.click(); }
    }
  },

  toast(title, msg, kind = 'info', icon = '!') {
    const wrap = $('toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = '<div class="ic">' + esc(icon) + '</div><div><b>' + esc(title) + '</b><span class="m">' + esc(msg) + '</span></div>';
    wrap.appendChild(el);
    while (wrap.children.length > 3) wrap.removeChild(wrap.firstChild);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    setTimeout(() => { el.classList.remove('in'); el.classList.add('out'); setTimeout(() => el.remove(), 450); }, 4600);
  },

  fade(on, ms = 380) {
    const f = $('fade');
    f.style.transitionDuration = ms + 'ms';
    f.classList.toggle('on', on);
    return wait(ms + 40);
  },

  /* Shows the clock rolling forward while the screen is dark. */
  async timeSkip(from, to, label) {
    const sk = $('skip');
    $('skipLbl').textContent = label || '';
    sk.hidden = false;
    const dur = reduceMotion ? 300 : 1100, t0 = performance.now();
    await new Promise(res => {
      const loop = now => {
        const t = clamp((now - t0) / dur, 0, 1);
        $('skipTm').textContent = fmtTime(lerp(from, to, ease.inOut(t)));
        if (t < 1) requestAnimationFrame(loop); else res();
      };
      requestAnimationFrame(loop);
    });
    await wait(350);
    sk.hidden = true;
  },
};

$('dlg').addEventListener('click', () => UI.dlgAdvance());
