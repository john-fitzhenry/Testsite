'use strict';
/* Jaret's First Day — places, people and cutscenes. */

const artOf = (fn, o) => (c, w, h, t) => { const L = 760, s = w / L; c.save(); c.scale(s, s); fn(c, L, h / s, t, o || {}); c.restore(); };
function sceneOf(fn, o) { const opts = o || {}; G.scene = (c, W, H, t) => fn(c, W, H, t, opts); if (G.mode !== 'end') G.mode = 'scene'; }
const LEAVE = { label: 'Head back outside', value: 'leave', cancel: true };
const FRIEND_KEY = { Tyler: 'tyler', Priya: 'priya', Marcus: 'marcus', Kai: 'kai', Emma: 'emma', Mia: 'mia', Leo: 'leo', Ava: 'ava', Noah: 'noah', Sofia: 'sofia', Jordan: 'jordan' };
const FRIEND_LOOK = name => LOOKS[FRIEND_KEY[name]];

function mixColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = s => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
  const A = ch(pa), B = ch(pb);
  return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',') + ')';
}

/* ---------------- Cutscene backdrops (stage units) ---------------- */
function drawDormRoom(c, W, H, t, o) {
  const night = !!o.night;
  c.fillStyle = night ? '#3E4A6A' : '#CFDAEA'; c.fillRect(0, 0, W, H);
  const fy = H * 0.66;
  const ww = Math.min(W * 0.28, 280), wh = H * 0.3, wx = W / 2 - ww / 2, wy = H * 0.1;
  const sky = c.createLinearGradient(0, wy, 0, wy + wh);
  if (night) { sky.addColorStop(0, '#071434'); sky.addColorStop(1, '#1E2E5A'); } else { sky.addColorStop(0, '#8FCDF2'); sky.addColorStop(1, '#FFE3A8'); }
  c.fillStyle = sky; c.fillRect(wx, wy, ww, wh);
  if (night) {
    c.fillStyle = '#FFF6D8'; c.beginPath(); c.arc(wx + ww * 0.72, wy + wh * 0.3, 16, 0, TAU); c.fill();
    c.fillStyle = '#FFFFFF'; for (let i = 0; i < 14; i++) c.fillRect(wx + ((i * 53) % ww), wy + ((i * 31) % (wh * 0.75)), 2, 2);
  } else { c.fillStyle = '#FFF2B8'; c.beginPath(); c.arc(wx + ww * 0.25, wy + wh * 0.72, 26, 0, TAU); c.fill(); }
  c.fillStyle = night ? '#16283E' : '#4F8E3E'; c.beginPath(); c.arc(wx + ww * 0.8, wy + wh + 10, 54, Math.PI, TAU); c.fill();
  c.strokeStyle = '#FFFFFF'; c.lineWidth = 8; c.strokeRect(wx, wy, ww, wh);
  c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.stroke();
  c.fillStyle = '#13306E'; c.fillRect(wx - 34, wy - 10, 30, wh + 30); c.fillRect(wx + ww + 4, wy - 10, 30, wh + 30);
  // pennant + poster
  const px = W * 0.07, py = H * 0.13;
  c.fillStyle = '#13306E'; c.beginPath(); c.moveTo(px, py); c.lineTo(px + 160, py + 27); c.lineTo(px, py + 54); c.closePath(); c.fill();
  c.fillStyle = '#FFFFFF'; c.font = '400 16px ' + FONT.d; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('HUSKIES', px + 12, py + 28);
  c.fillStyle = '#E2672D'; c.fillRect(W * 0.8, H * 0.12, 92, 124);
  c.fillStyle = '#FFFFFF'; c.font = '700 14px ' + FONT.c; c.textAlign = 'center'; c.fillText('BAND TOUR', W * 0.8 + 46, H * 0.12 + 104);
  c.beginPath(); c.arc(W * 0.8 + 46, H * 0.12 + 50, 26, 0, TAU); c.fill();
  // floor
  c.fillStyle = night ? '#5A4636' : '#B98A5A'; c.fillRect(0, fy, W, H - fy);
  c.fillStyle = 'rgba(0,0,0,.08)'; for (let y = fy + 20; y < H; y += 28) c.fillRect(0, y, W, 2);
  if (o.lounge) {
    c.fillStyle = '#7B5CD6'; rrect(c, W * 0.18, fy - 60, W * 0.64, 70, 18); c.fill();
    c.fillStyle = '#6A4BC2'; rrect(c, W * 0.16, fy - 20, W * 0.68, 60, 14); c.fill();
    c.fillStyle = '#8A6A44'; rrect(c, W * 0.38, fy + 70, W * 0.24, 30, 8); c.fill();
    for (let i = 0; i < 4; i++) drawIcon(c, 'cookie', W * 0.43 + i * 28, fy + 70, 26);
    const cast = [['danielle', 0.5], ['sofia', 0.28], ['jordan', 0.72], ['jaret', 0.14]];
    if (G.friends.includes('Tyler') || G.flags.tylerCold) cast.push(['tyler', 0.86]);
    for (const [k, x] of cast) drawPerson(c, W * x, fy + 54 + (k === 'danielle' ? 10 : 0), Object.assign({}, LOOKS[k], { scale: 2.5 }), 'down', 0, false);
    c.fillStyle = 'rgba(255,200,120,.12)'; c.fillRect(0, 0, W, H);
    return;
  }
  // beds
  const bed = (x, w, blanket) => {
    c.fillStyle = '#8A6A44'; c.fillRect(x, fy - 40, w, 70);
    c.fillStyle = '#F4F2EE'; c.fillRect(x + 6, fy - 52, w - 12, 30);
    c.fillStyle = blanket; rrect(c, x + 2, fy - 34, w - 4, 52, 10); c.fill();
  };
  bed(0, W * 0.3, '#13306E'); bed(W * 0.7, W * 0.3, '#E2672D');
  c.fillStyle = '#6E5236'; c.fillRect(W * 0.31, fy - 26, 70, 56);
  c.fillStyle = '#1E1E26'; rrect(c, W * 0.31 + 10, fy - 50, 50, 26, 5); c.fill();
  if (!o.alarm || Math.floor(t * 2) % 2 === 0) { c.fillStyle = '#FF4A4A'; c.font = '400 15px ' + FONT.d; c.textAlign = 'center'; c.fillText(o.clock || (night ? '11:00' : '8:00'), W * 0.31 + 35, fy - 36); }
  c.fillStyle = '#F4F6FA'; c.fillRect(W * 0.6, fy - 44, 54, 70); c.fillStyle = '#C9D2DC'; c.fillRect(W * 0.6, fy - 16, 54, 3);
  if (o.jaretInBed) {
    c.save(); c.translate(W * 0.04, fy - 136); drawPortrait(c, 120, LOOKS.jaret, o.alarm ? 'tired' : 'grin', { noBg: true }); c.restore();
    c.fillStyle = '#13306E'; rrect(c, 2, fy - 30, W * 0.3 - 4, 48, 10); c.fill();
    if (o.alarm) { c.fillStyle = '#C8102E'; c.font = '700 22px ' + FONT.c; c.textAlign = 'center'; c.fillText('BEEP BEEP', W * 0.31 + 35, fy - 72 - Math.abs(Math.sin(t * 8)) * 6); }
  } else drawPerson(c, W * 0.36, fy + 64, Object.assign({}, LOOKS.jaret, { scale: 3.2 }), 'down', 0, false);
  if (o.tyler) {
    if (night && o.jaretInBed) { c.save(); c.translate(W * 0.74, fy - 136); drawPortrait(c, 120, LOOKS.tyler, 'grin', { noBg: true }); c.restore(); c.fillStyle = '#E2672D'; rrect(c, W * 0.7 + 2, fy - 30, W * 0.3 - 4, 48, 10); c.fill(); }
    else drawPerson(c, W * 0.66, fy + 70, Object.assign({}, LOOKS.tyler, { scale: 3.2 }), 'left', 0, false);
  }
  if (night) { c.fillStyle = 'rgba(10,20,60,.25)'; c.fillRect(0, 0, W, H); }
}

function drawLectureScene(c, W, H, t) {
  drawLectureBG(c, W, H, t);
  const sw = Math.min(W * 0.6, 520), sx = W / 2 - sw / 2, sy = 40;
  c.fillStyle = '#F4F6FA'; rrect(c, sx, sy, sw, 180, 10); c.fill();
  c.fillStyle = '#13306E'; c.fillRect(sx, sy, sw, 34);
  c.fillStyle = '#FFFFFF'; c.font = '700 15px ' + FONT.c; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('LAUREL HALL · LECTURE', W / 2, sy + 18);
  c.fillStyle = '#13306E'; c.font = '400 28px ' + FONT.d; c.fillText('INTRO TO', W / 2, sy + 82); c.fillText('PSYCHOLOGY', W / 2, sy + 118);
  drawIcon(c, 'brain', W / 2, sy + 156, 32);
  drawPerson(c, Math.max(70, sx - 50), sy + 250, Object.assign({}, LOOKS.prof, { scale: 2.4 }), 'down', 0, false);
}
function drawCalcScene(c, W, H) {
  drawChalkBG(c, W, H);
  c.fillStyle = 'rgba(255,255,255,.9)'; c.font = '400 34px ' + FONT.d; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('CALCULUS I', W / 2, 150);
  c.font = '600 30px ' + FONT.b; c.fillText('f′(x) = lim (h→0) [f(x+h) − f(x)] / h', W / 2, 220, W - 80);
  c.fillText('d/dx (xⁿ) = n·xⁿ⁻¹', W / 2, 280);
  drawPerson(c, W - 80, H - 10, Object.assign({}, LOOKS.profk, { scale: 2 }), 'down', 0, false);
}
function drawFairScene(c, W, H, t) {
  drawUnionBG(c, W, H);
  swagTables(W, H, 70).forEach((tb, i) => drawSwagTable(c, tb, t, i));
}
function drawSunset(c, W, H, t, o) {
  if (o.t0 == null) o.t0 = performance.now();
  const k = o.stars ? 1 : clamp((performance.now() - o.t0) / 26000, 0, 1);
  const hz = H * 0.58;
  const sky = c.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, mixColor('#3B3F99', '#0A1236', k)); sky.addColorStop(0.55, mixColor('#E8578A', '#3A2A66', k)); sky.addColorStop(1, mixColor('#FFB347', '#C2577A', k));
  c.fillStyle = sky; c.fillRect(0, 0, W, hz + 4);
  if (k > 0.55) { c.fillStyle = 'rgba(255,255,255,' + ((k - 0.55) * 2).toFixed(2) + ')'; for (let i = 0; i < 60; i++) { const x = (i * 137) % W, y = (i * 71) % (hz * 0.8); c.fillRect(x, y, i % 7 === 0 ? 3 : 2, i % 7 === 0 ? 3 : 2); } }
  const sunY = hz - 30 + k * 110;
  const glow = c.createRadialGradient(W * 0.62, sunY, 10, W * 0.62, sunY, 220);
  glow.addColorStop(0, 'rgba(255,220,140,.75)'); glow.addColorStop(1, 'rgba(255,170,90,0)');
  c.fillStyle = glow; c.fillRect(0, 0, W, hz + 4);
  c.fillStyle = '#FFD27A'; c.beginPath(); c.arc(W * 0.62, sunY, 56, 0, TAU); c.fill();
  // far hills, barn, near hill
  c.fillStyle = mixColor('#6A3E7A', '#221A44', k); c.beginPath(); c.moveTo(0, hz); for (let x = 0; x <= W; x += 40) c.lineTo(x, hz - 30 - Math.sin(x / 140) * 22); c.lineTo(W, H); c.lineTo(0, H); c.fill();
  c.fillStyle = mixColor('#2E4A2A', '#121E18', k); c.beginPath(); c.moveTo(0, hz + 40); c.quadraticCurveTo(W * 0.5, hz - 30, W, hz + 30); c.lineTo(W, H); c.lineTo(0, H); c.fill();
  const bx = W * 0.82, by = hz + 2;
  c.fillStyle = mixColor('#3A1A1A', '#120A0A', k); c.fillRect(bx, by - 46, 70, 46); c.beginPath(); c.moveTo(bx - 6, by - 46); c.lineTo(bx + 35, by - 76); c.lineTo(bx + 76, by - 46); c.fill();
  c.fillStyle = '#121212';
  for (const cx of [0.18, 0.3, 0.7]) { c.save(); c.translate(W * cx, hz + 30); c.scale(0.9, 0.9); c.fillRect(-18, -22, 36, 16); c.fillRect(-16, -8, 4, 10); c.fillRect(12, -8, 4, 10); c.fillRect(16, -28, 12, 10); c.restore(); }
  // Jaret and friends sitting, seen from behind
  const crew = ['Jaret'].concat(o.friends || []).slice(0, 5);
  const span = Math.min(W * 0.8, 120 * crew.length);
  crew.forEach((name, i) => {
    const L = name === 'Jaret' ? LOOKS.jaret : FRIEND_LOOK(name) || LOOKS.kai;
    const x = W / 2 - span / 2 + span * (i + 0.5) / crew.length, y = Math.min(H - 30, hz + 150);
    c.fillStyle = mixColor('#1A2A4A', '#0A1020', k); rrect(c, x - 40, y - 70, 80, 90, 26); c.fill();
    c.fillStyle = mixColor(L.hair, '#0A0A12', name === 'Jaret' ? 0.08 + k * 0.3 : 0.35 + k * 0.4);
    c.beginPath(); c.arc(x, y - 96, 30, 0, TAU); c.fill();
    if (name === 'Jaret') { c.strokeStyle = 'rgba(255,220,140,' + (0.9 - k * 0.6) + ')'; c.lineWidth = 4; c.beginPath(); c.arc(x, y - 96, 30, -2.6, -0.5); c.stroke(); c.fillStyle = '#FFFFFF'; c.font = '400 14px ' + FONT.d; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('JARET', x, y - 40); }
  });
}

/* ---------------- Places + people registration ---------------- */
const LABELS = { library: 'Enter Homer Babbidge Library', laurel: 'Enter Laurel Hall', oak: 'Enter Oak Hall', union: 'Enter the Student Union', dairy: 'Enter the UConn Dairy Bar', gampel: 'Enter Gampel Pavilion', dorm: 'Enter your dorm', dining: 'Enter South Campus Dining', hill: 'Sit on Horsebarn Hill' };

function registerWorld() {
  World.onActivate = t => { if (t.act) Story.run(() => t.act()); };
  for (const key in PLACES) {
    const p = PLACES[key];
    World.targets.push({
      key, x: p.door.x, y: p.door.y, r: 58, label: LABELS[key],
      hit: (wx, wy, pad = 0) => p.spot ? dist(wx, wy, BENCH.x, BENCH.y - 16) < 80 + pad : p.round ? dist(wx, wy, p.cx, p.cy) < p.r + pad : wx > p.x - pad && wx < p.x + p.w + pad && wy > p.y - pad - 20 && wy < p.y + p.h + pad + 10,
      act: () => Scenes[key](),
    });
  }
  World.targets.push({
    key: 'jonathan', r: 62, label: 'Meet Jonathan the Husky',
    get x() { return World.jon.x; }, get y() { return World.jon.y; },
    visible: () => World.jonVisible(),
    hit: (wx, wy, pad = 0) => dist(wx, wy, World.jon.x, World.jon.y - 18) < 40 + pad,
    act: () => Scenes.jonathan(),
  });
  const npc = o => Object.assign({ npc: true, kind: 'person', r: 52, anim: 0, fresh() { return !G.flags['met_' + this.id]; } }, o);
  World.npcs.push(
    npc({ id: 'priya', look: LOOKS.priya, x: 1000, y: 1080, dir: 'down', label: 'Talk to Priya', act: () => Scenes.priya() }),
    npc({ id: 'marcus', look: LOOKS.marcus, x: 1640, y: 846, dir: 'left', label: 'Talk to Marcus', act: () => Scenes.marcus() }),
    npc({ id: 'squirrel', kind: 'squirrel', x: 1330, y: 824, face: -1, r: 46, label: 'Inspect the squirrel', act: () => Scenes.squirrel() }),
    npc({ id: 'goose', kind: 'goose', x: 1600, y: 1322, face: 1, r: 50, label: 'Approach the goose', act: () => Scenes.goose(),
      update(dt) { const p = World.player; this.face = p.x > this.x ? 1 : -1; } }),
  );
  const bella = npc({ id: 'bella', look: LOOKS.bella, x: 820, y: 930, dir: 'left', label: 'Talk to the tour guide', vx: 22, pause: 0, act: () => Scenes.bella(),
    update(dt) {
      if (G.busy && World.near === this) { this.moving = false; return; }
      if (this.pause > 0) { this.pause -= dt; this.moving = false; return; }
      this.x += this.vx * dt; this.anim += Math.abs(this.vx) * dt / 7; this.moving = true;
      if (this.x > 930 || this.x < 690) { this.vx = -this.vx; this.x = clamp(this.x, 690, 930); this.pause = 2.5; }
      this.dir = this.vx > 0 ? 'left' : 'right';
    } });
  World.npcs.push(bella);
  const r = seeded(404);
  for (let i = 0; i < 3; i++) {
    const look = randomLook(r);
    World.npcs.push({ inert: true, kind: 'person', look, x: 760, y: 922 + (i % 2) * 12, anim: 0, dir: 'right',
      update(dt) {
        const dirS = Math.sign(bella.vx) || 1, tx = bella.x - dirS * (46 + i * 30), ty = 918 + (i % 2) * 14;
        const d = tx - this.x;
        if (Math.abs(d) > 1 && bella.moving) { const s = Math.sign(d) * Math.min(Math.abs(d), 30 * dt); this.x += s; this.anim += Math.abs(s) / 7; this.moving = true; } else this.moving = false;
        this.y = ty; this.dir = bella.x > this.x ? 'right' : 'left';
      } });
  }
}

/* ---------------- Scenes ---------------- */
let photoImg = null;
function photoArt() {
  if (G.photo && (!photoImg || photoImg.src !== G.photo)) { photoImg = new Image(); photoImg.src = G.photo; }
  return (c, w, h, t) => {
    c.fillStyle = '#13306E'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { c.fillStyle = ['#FFC94A', '#FFFFFF', '#FF7FA6', '#9FD8FF'][i % 4]; const x = (i * 97 + t * 40 * (1 + i % 3)) % w, y = (i * 53 + t * 60) % h; c.fillRect(x, y, 6, 3); }
    if (photoImg && photoImg.complete && photoImg.naturalWidth) {
      const ph = h - 24, pw = ph * 1.2;
      c.save(); c.translate(w / 2, h / 2); c.rotate(-0.04);
      c.fillStyle = '#FFFFFF'; c.fillRect(-pw / 2 - 8, -ph / 2 - 6, pw + 16, ph + 12);
      c.drawImage(photoImg, -pw / 2, -ph / 2 + 2, pw, ph - 8);
      c.restore();
    }
  };
}
function swagLine(items) {
  const names = { tshirt: 'T-shirt', sticker: 'sticker', bottle: 'water bottle', lanyard: 'lanyard', pizza: 'pizza slice', finger: 'foam finger', hoodie: 'free hoodie' };
  const parts = Object.keys(names).filter(k => items[k]).map(k => items[k] + ' ' + names[k] + (items[k] > 1 ? 's' : ''));
  return parts.length ? 'Haul: ' + parts.join(', ') + '.' : 'Haul: one sore wrist and zero freebies.';
}
function timeTag(k) { return k.when.split(' · ')[0]; }
function card(kicker, title, html, buttons, art) {
  return UI.card({ kicker: fmtTime(G.time) + ' · ' + kicker, title, html, buttons, art });
}

const Scenes = {
  register: registerWorld,

  planHtml() {
    const rows = TASKS.map(k => '<div><b>' + esc(timeTag(k)) + '</b><span>' + esc(k.label) + '</span></div>').join('');
    return '<div class="howto">' + rows + '</div>';
  },
  controlsHtml() {
    return '<div class="howto"><div><b>Walk</b><span>Tap or click where you want to go, or use WASD / arrow keys. Hold Shift to jog.</span></div><div><b>Go in / talk</b><span>Tap a building or person, or walk up and press E</span></div><div><b>Map</b><span>Tap the minimap or press M. Tap a place to walk there.</span></div><div><b>Clock</b><span>Each second you walk is one minute of game time. Activities take longer.</span></div><div><b>Goal</b><span>Finish the plan, keep Energy and Fullness up, and collect Friends, Husky spirit and Brain for your report card.</span></div></div>';
  },

  async intro() {
    sceneOf(drawDormRoom, { alarm: true, jaretInBed: true });
    await UI.fade(false, 700);
    Sound.play('alarm');
    await UI.say('narrator', '8:00 AM. Storrs, Connecticut. Day one of freshman year at UConn.');
    const s = await UI.ask('jaret', 'Mmmf… five more minutes…', ['Hit snooze', "Get up. It's the first day!"], 'tired');
    if (s === 0) { Story.advance(10, false); gain({ energy: 5 }, true); Sound.play('alarm'); await UI.say('narrator', 'BEEP BEEP BEEP. The alarm clock has opinions.'); }
    else { achieve('early'); gain({ spirit: 2 }, true); }
    sceneOf(drawDormRoom, { tyler: true });
    Sound.play('pop');
    await UI.say('tyler', "Yo! You must be Jaret. I'm Tyler. Sorry I got in so late. The door slams on its own, I swear.", 'happy');
    const r = await UI.ask('jaret', 'Hey, Tyler!', ['No worries! Want to grab dinner later?', 'Is that a mini-fridge full of energy drinks?', 'Please be quieter tonight.'], 'happy');
    if (r === 0) { await UI.say('tyler', "Bet. South Campus Dining, around six. I'll text you.", 'happy'); addFriend('Tyler'); }
    else if (r === 1) { await UI.say('tyler', "It's called being prepared. Here, take one for the road.", 'grin'); gain({ energy: 8 }, true); addFriend('Tyler'); }
    else { await UI.say('tyler', "Fair. My bad, man. Won't happen again.", 'worried'); G.flags.tylerCold = true; }
    G.done.roommate = true;
    await UI.say('tyler', 'Nice shirt, by the way. Very Husky of you.', 'happy');
    await UI.say('jaret', 'First day. Gotta rep the Huskies.', 'grin');
    await UI.say('tyler', 'Ha. Okay, check your schedule. Day one goes fast.', 'neutral');
    await UI.card({ kicker: "Jaret's phone · " + fmtTime(G.time), title: "Today's plan", html: '<p>You don\'t have to do everything. The more you do, the better your first-day report card.</p>' + this.planHtml() + '<p></p>' + this.controlsHtml(), buttons: [{ label: "Let's go, Huskies", primary: true }] });
    await UI.fade(true, 450);
    G.scene = null; G.mode = 'world';
    World.placePlayer(PLACES.dorm.door.x, PLACES.dorm.door.y - 6, 'up');
    HUD.update();
    await UI.fade(false, 450);
    UI.toast('Tip', 'Follow the gold arrow. Breakfast first, at South Campus Dining!', 'info', '→');
  },

  async dorm() {
    const t = G.time;
    const btns = [];
    const floorOpen = !G.done.floor && t >= 1245 && t <= 1290;
    if (floorOpen) btns.push(t < 1260 ? { label: 'Wait in the lounge for the floor meeting', sub: 'Starts at 9:00 PM', value: 'floor', primary: true } : { label: 'Join the floor meeting', sub: t > 1262 ? 'It already started. Slip in!' : 'Lounge · 30 min', value: 'floor', primary: true });
    const soon = TASKS.find(k => k.fixed && !G.done[k.id] && k.fixed > t && k.fixed < t + 100 && k.id !== 'floor');
    btns.push({ label: 'Take a nap', sub: G.stats.energy >= 85 ? "You're not tired" : t >= 1200 ? 'Too late for a nap. Go to sleep instead.' : '+35 energy · 90 min' + (soon ? ' · You might miss ' + soon.label + '!' : ''), value: 'nap', disabled: G.stats.energy >= 85 || t >= 1200 });
    btns.push({ label: 'Go to sleep', sub: t >= 1260 ? 'Ends the day and shows your report card' : 'Unlocks at 9:00 PM', value: 'sleep', disabled: t < 1260, primary: t >= 1260 && !floorOpen });
    btns.push(LEAVE);
    const flavor = t < 1200 ? (G.friends.includes('Tyler') ? "Tyler's side of the room already looks lived in. Your side has one pennant and a lot of potential." : "Tyler has his earbuds in. The room is quiet.") : 'The hallway smells like microwave popcorn. Somebody down the hall is learning guitar.';
    const v = await card('South Campus', 'Your dorm room', '<p>' + esc(flavor) + '</p>', btns, artOf(drawDormRoom, { night: t >= 1200, tyler: true }));
    if (v === 'nap') { await Story.skipTo(t + 90, 'Power nap'); gain({ energy: 35 }); UI.toast('Nap', 'Jaret wakes up refreshed. Mostly.', 'info', 'z'); }
    else if (v === 'floor') await this.floorMeeting();
    else if (v === 'sleep') await this.endDay(false);
  },

  async floorMeeting() {
    if (G.time < 1260) await Story.skipTo(1260, 'Waiting in the lounge');
    const late = G.time > 1262;
    sceneOf(drawDormRoom, { night: true, lounge: true });
    if (late) await UI.say('narrator', 'Jaret slips into the lounge. Everyone is sitting in a circle on the carpet.');
    await UI.say('danielle', "Welcome to the floor, everyone! I'm Danielle, your RA. Icebreaker time: name, major and one fun fact.", 'happy');
    await UI.say('sofia', "I'm Sofia, nursing. Fun fact: I've never seen a real snowstorm.", 'happy');
    await UI.say('jordan', "Jordan. Undecided. I can solve a Rubik's cube in under a minute.", 'neutral');
    const facts = [];
    if (G.done.jonathan) facts.push(['I got a selfie with Jonathan the Husky today.', "No way! He's basically famous."]);
    if (G.results.hoops && G.results.hoops.makes >= 3) facts.push(['I made ' + G.results.hoops.makes + ' of 10 free throws at Gampel.', G.results.hoops.makes >= 7 ? 'Okay, you are on our intramural team. Not a question.' : 'Shooting at Gampel on day one? Respect.']);
    if (G.results.scoop && G.results.scoop.height >= 3) facts.push(['I stacked ' + G.results.scoop.height + ' scoops at the Dairy Bar.', 'That is an engineering achievement.']);
    facts.push(["I'm undecided too. But I'm very decided about the Huskies.", 'Ha! Good answer.']);
    const choices = facts.slice(0, 3);
    const i = await UI.ask('jaret', "I'm Jaret! Fun fact…", choices.map(f => f[0]), 'happy');
    await UI.say('sofia', choices[i][1], 'happy');
    addFriend('Sofia'); addFriend('Jordan');
    if (G.flags.tylerCold && !G.friends.includes('Tyler')) {
      await UI.say('tyler', 'Hey, roomie. Sorry again about last night. Truce?', 'worried');
      const k = await UI.ask('jaret', 'Truce?', ['Truce.', 'Only if you share the energy drinks.'], 'neutral');
      await UI.say('tyler', k === 0 ? 'Deal.' : 'Hard bargain. Deal.', 'grin');
      addFriend('Tyler');
    }
    await UI.say('danielle', 'Quiet hours start at 11. Cookies are on the table. Welcome home, everybody!', 'happy');
    gain({ spirit: 6, full: 6 }, true);
    G.done.floor = true;
    Story.advance(30, false);
  },

  async dining() {
    const t = G.time;
    const meal = t >= 420 && t < 630 ? 'breakfast' : t >= 660 && t < 870 ? 'lunch' : t >= 990 && t < 1200 ? 'dinner' : null;
    const MN = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner' };
    const btns = [];
    let html;
    if (meal && !G.flags['ate_' + meal]) {
      html = '<p>' + (meal === 'breakfast' ? 'Breakfast' : meal === 'lunch' ? 'Lunch' : 'Dinner') + ' is being served and the line is long. Time to fill a tray.</p>';
      btns.push({ label: 'Eat ' + MN[meal] + ' (Tray Dash)', sub: 'Mini-game · 40 min', value: 'play', primary: true });
      btns.push({ label: 'Grab a quick plate', sub: '+25 fullness · 20 min', value: 'quick' });
    } else if (meal) {
      html = '<p>You already had ' + MN[meal] + '. The cookie tray is calling, though.</p>';
      btns.push({ label: 'Grab a cookie for the road', sub: G.flags.cookie === meal ? 'One cookie per meal. Rules are rules.' : '+6 fullness · 5 min', value: 'cookie', disabled: G.flags.cookie === meal });
    } else {
      const next = t < 660 ? 'Lunch starts at 11:00 AM.' : t < 990 ? 'Dinner starts at 4:30 PM.' : 'The kitchen is closed for the night.';
      html = '<p>Between meals. ' + next + ' The grab-and-go case is still open.</p>';
      const recent = G.flags.snackAt != null && t - G.flags.snackAt < 120;
      btns.push({ label: 'Grab a snack', sub: recent ? 'You just had one' : '+12 fullness · 10 min', value: 'snack', disabled: recent });
    }
    btns.push(LEAVE);
    const v = await card('South Campus', 'South Campus Dining', html, btns, artOf(drawDiningBG));
    if (v === 'play') {
      const out = await Mini.run(TrayDash, { meal, reward: r => ({ title: r.score >= 25 ? 'Bottomless tray!' : r.score >= 15 ? 'Solid haul!' : 'Light snack.', lines: ['You caught ' + r.good + ' good item' + (r.good === 1 ? '' : 's') + (r.bad ? ' and ' + r.bad + ' questionable one' + (r.bad === 1 ? '' : 's') + '.' : '.'), 'Score: ' + r.score], gains: { full: clamp(15 + r.score * 2, 15, 60), energy: 8 }, ach: r.score >= 25 ? ['bottomless'] : [] }) });
      applyReward(out.reward); G.results.tray = out.result;
      Story.advance(40, false);
      await this.ate(meal);
    } else if (v === 'quick') { gain({ full: 25, energy: 4 }); Story.advance(20, false); await this.ate(meal); }
    else if (v === 'cookie') { G.flags.cookie = meal; gain({ full: 6 }); Story.advance(5, false); }
    else if (v === 'snack') { G.flags.snackAt = t; gain({ full: 12 }); Story.advance(10, false); }
  },
  async ate(meal) {
    G.flags['ate_' + meal] = true;
    if (meal === 'breakfast') G.done.breakfast = true;
    if (meal === 'dinner' && G.friends.includes('Tyler') && !G.flags.dinnerTyler) {
      G.flags.dinnerTyler = true;
      await UI.say('tyler', 'Told you six was the move. Wait, is that your third plate?', 'grin');
      gain({ spirit: 3 });
    }
  },

  checkOnTime() { if (G.done.psych && G.done.calc && !G.late.psych && !G.late.calc) achieve('ontime'); },

  async classroom(o) {
    const t = G.time, k = TASKS.find(x => x.id === o.id);
    if (G.done[o.id] || t > k.end) {
      const missed = !G.done[o.id];
      await card(o.place, o.place, missed ? '<p>' + esc(o.label) + ' already let out. The room is empty except for a forgotten water bottle.</p>' : '<p>' + esc(o.after) + '</p>', [{ label: 'Head back outside', value: 'leave', primary: true, cancel: true }], artOf(o.bg));
      return;
    }
    let v;
    if (t < k.start) v = await card(o.place, o.place, '<p>' + esc(o.label) + ' starts at ' + fmtTime(k.fixed) + '. You\'re early.</p>', [{ label: 'Grab a seat and wait', sub: 'Skip ahead to ' + fmtTime(k.fixed - 10), value: 'wait', primary: true }, LEAVE], artOf(o.bg));
    else v = await card(o.place, o.place, t <= k.fixed ? '<p>The room is filling up. ' + esc(o.label) + ' starts at ' + fmtTime(k.fixed) + '.</p>' : '<p>Class started at ' + fmtTime(k.fixed) + '. You can still slip in the back…</p>', [{ label: t <= k.fixed ? 'Find a seat' : 'Sneak in late', sub: 'Class until ' + fmtTime(o.ends), value: 'go', primary: true }, LEAVE], artOf(o.bg));
    if (v !== 'wait' && v !== 'go') return;
    if (v === 'wait') await Story.skipTo(k.fixed - 10, 'Waiting for class');
    const late = G.time > k.fixed;
    sceneOf(o.bg, {});
    if (late) { G.late[o.id] = true; await UI.say('narrator', 'Jaret slips in at ' + fmtTime(G.time) + '. Every head turns.'); await UI.say(o.prof, o.lateLine, 'happy'); }
    else { await o.seatmate(); await UI.say(o.prof, o.hello, 'happy'); }
    const out = await Mini.run(o.game, { late, tired: G.stats.energy < 25, reward: o.reward });
    applyReward(out.reward); G.results[o.id] = out.result;
    sceneOf(o.bg, {});
    await UI.say(o.prof, o.bye(out.result), 'happy');
    G.done[o.id] = true;
    if (G.time < o.ends) Story.advance(o.ends - G.time, false);
    this.checkOnTime();
  },

  laurel() {
    return this.classroom({
      id: 'psych', place: 'Laurel Hall', label: 'Intro to Psychology', ends: 675, bg: drawLectureScene, prof: 'prof', game: PopQuiz,
      after: 'Two big lecture halls and a lot of classrooms. Nothing else on your schedule here today.',
      lateLine: "Ah, a latecomer! You're just in time for the pop quiz.",
      hello: "Good morning, and welcome to Intro to Psychology! I'm Professor Whitfield. Let's wake up those frontal lobes with a quick quiz.",
      seatmate: async () => {
        await UI.say('kai', "Hey, is this seat taken? I'm Kai.", 'happy');
        const c = await UI.ask('jaret', 'Oh, hey!', ["Go for it! I'm Jaret.", 'Only if you promise to share notes.'], 'happy');
        await UI.say('kai', c === 0 ? 'Nice to meet you, Jaret. Cool shirt.' : "Ha, deal. I'm a great note-taker.", 'happy');
        addFriend('Kai');
      },
      reward: r => ({ title: r.correct === r.total ? 'Perfect score!' : r.correct >= r.total - 1 ? 'Great job!' : r.correct >= 2 ? 'Not bad!' : 'Rough start.', lines: ['You got ' + r.correct + ' of ' + r.total + ' right.'], gains: { brain: r.points, energy: -6 }, ach: r.correct === r.total && r.total === 5 ? ['teacher'] : [] }),
      bye: r => (r.correct >= 3 ? 'Impressive! Read chapter one before next class.' : "We'll get there. Read chapter one before next class!"),
    });
  },
  oak() {
    return this.classroom({
      id: 'calc', place: 'Oak Hall', label: 'Calculus I', ends: 915, bg: drawCalcScene, prof: 'profk', game: MathSprint,
      after: 'Classrooms, offices and a very nice courtyard. Nothing else on your schedule here today.',
      lateLine: 'Welcome! Grab a seat anywhere. We are already warming up.',
      hello: "Welcome to Calculus I. I'm Professor Okafor. Calculus is the math of change, so let's change you into calculus students. Warm-up time!",
      seatmate: async () => {
        await UI.say('emma', "Hi! I'm Emma. Calc makes me nervous. Study buddies?", 'worried');
        const c = await UI.ask('jaret', 'Study buddies?', ['Definitely!', 'Only if you explain limits to me.'], 'happy');
        await UI.say('emma', c === 0 ? 'Yay. Deal!' : "I'll try. No promises.", 'happy');
        addFriend('Emma');
      },
      reward: r => ({ title: r.solved >= 12 ? 'Human calculator!' : r.solved >= 7 ? 'Nice work!' : 'Warming up.', lines: ['Solved ' + r.solved + ' problem' + (r.solved === 1 ? '' : 's') + (r.wrong ? ', ' + r.wrong + ' wrong.' : '.'), 'Best streak: ' + r.best + '.'], gains: { brain: Math.min(48, r.solved * 4), energy: -6 }, ach: r.solved >= 12 ? ['calculator'] : [] }),
      bye: () => 'See you next class. Bring a pencil and an open mind.',
    });
  },

  async union() {
    const t = G.time;
    const btns = [];
    if (G.done.clubfair) btns.push({ label: 'Club Fair', sub: 'You already worked the tables', value: 'x', disabled: true });
    else if (t < 660) btns.push({ label: 'Club Fair', sub: 'Opens at 11:00 AM. Tables are still being set up.', value: 'x', disabled: true });
    else if (t > 960) btns.push({ label: 'Club Fair', sub: 'Packed up for the day', value: 'x', disabled: true });
    else btns.push({ label: 'Hit the Club Fair (Swag Grab)', sub: 'Mini-game · 45 min', value: 'fair', primary: true });
    btns.push({ label: 'Grab a coffee', sub: G.coffees >= 3 ? "Jaret's hands are already shaking" : '+' + (G.coffees === 2 ? 15 : 20) + ' energy · 10 min', value: 'coffee', disabled: G.coffees >= 3 });
    btns.push(LEAVE);
    const v = await card('Student Union', 'Student Union', '<p>The heart of campus: food, lounges and, today, a lot of people holding clipboards.</p>', btns, artOf(drawFairScene));
    if (v === 'coffee') {
      G.coffees++;
      gain({ energy: G.coffees === 3 ? 15 : 20 });
      Story.advance(10, false);
      if (G.coffees === 3) achieve('coffee');
      return;
    }
    if (v !== 'fair') return;
    const out = await Mini.run(SwagGrab, { reward: r => ({ title: r.score >= 30 ? 'Swag goblin!' : r.score >= 18 ? 'Great haul!' : 'A few freebies.', lines: [swagLine(r.items), 'Score: ' + r.score + (r.bad ? ' (and ' + r.bad + ' accidental crew sign-up' + (r.bad === 1 ? '' : 's') + ')' : '')], gains: { spirit: Math.min(25, Math.round(r.score * 0.8)), full: r.pizzas * 4, energy: -5 }, ach: r.score >= 30 ? ['swag'] : [] }) });
    applyReward(out.reward); G.swag = out.result.items; G.results.swag = out.result;
    sceneOf(drawFairScene, {});
    const CL = [['mia', 'Mia', 'Yes! Pickup games on the intramural fields every week. Bring cleats!'], ['leo', 'Leo', 'Welcome to the party. Tournament night is this weekend.'], ['ava', 'Ava', "Amazing. Rule one of improv: always say 'yes, and.'"], ['noah', 'Noah', 'Awesome. First group hike is this weekend. Bring snacks.']];
    const c = await UI.ask('jaret', 'Okay. One sign-up sheet. Which club?', ['Ultimate Frisbee', 'Gaming Society', 'Improv Troupe', 'Outing Club'], 'happy');
    await UI.say(CL[c][0], CL[c][2], 'happy');
    addFriend(CL[c][1]);
    G.flags.club = CL[c][1];
    G.done.clubfair = true;
    Story.advance(45, false);
  },

  async library() {
    const btns = [];
    btns.push(G.done.study ? { label: 'Study session', sub: 'Done for today. Your brain is full.', value: 'x', disabled: true } : { label: 'Study session (Memory Match)', sub: 'Mini-game · 1 hour', value: 'study', primary: true });
    btns.push({ label: 'Rest your eyes in a quiet corner', sub: G.flags.libRest ? 'You already did. A librarian is watching.' : '+15 energy · 30 min', value: 'rest', disabled: !!G.flags.libRest });
    btns.push(LEAVE);
    const v = await card('Homer Babbidge Library', 'Homer Babbidge Library', '<p>Floors of books, group study rooms and the quietest seats on campus.</p>', btns, artOf(drawLibraryBG));
    if (v === 'rest') { G.flags.libRest = true; await Story.skipTo(G.time + 30, 'Resting your eyes'); gain({ energy: 15 }); return; }
    if (v !== 'study') return;
    const out = await Mini.run(MemoryMatch, { reward: r => ({ title: r.pairs === 8 ? (r.moves <= 14 ? 'Photographic memory!' : 'All matched!') : 'Out of time!', lines: ['Matched ' + r.pairs + ' of 8 pairs in ' + r.moves + ' tr' + (r.moves === 1 ? 'y' : 'ies') + '.'], gains: { brain: r.pairs === 8 ? clamp(Math.round(36 - (r.moves - 8) * 1.2), 12, 32) : r.pairs * 3, energy: -8 }, ach: r.pairs === 8 && r.moves <= 14 ? ['memory'] : [] }) });
    applyReward(out.reward); G.results.memory = out.result;
    G.done.study = true;
    Story.advance(60, false);
  },

  async gampel() {
    const t = G.time;
    const open = t >= 480 && t < 1200;
    const btns = [];
    if (G.done.hoops) btns.push({ label: 'Shoot free throws', sub: 'You already shot today. Your arms agree.', value: 'x', disabled: true });
    else if (!open) btns.push({ label: 'Shoot free throws', sub: 'Open gym ended at 8:00 PM', value: 'x', disabled: true });
    else btns.push({ label: 'Shoot free throws', sub: 'Mini-game · 30 min', value: 'play', primary: true });
    btns.push(LEAVE);
    const v = await card('Gampel Pavilion', 'Gampel Pavilion', '<p>Home of Huskies basketball. Championship banners hang from the rafters, and the open-gym hoop is free.</p>', btns, artOf((c, W, H, tt) => drawGymBG(c, W, H * 1.3, tt, 0)));
    if (v !== 'play') return;
    const out = await Mini.run(FreeThrows, { reward: r => ({ title: r.makes >= 8 ? 'Swish City!' : r.makes >= 5 ? 'Nice shooting!' : 'Brick by brick.', lines: ['Made ' + r.makes + ' of 10.' + (r.best >= 3 ? ' Best streak: ' + r.best + '.' : '')], gains: { spirit: r.makes * 3, energy: -8 }, ach: r.makes >= 8 ? ['swish'] : [] }) });
    applyReward(out.reward); G.results.hoops = out.result;
    G.done.hoops = true;
    Story.advance(30, false);
  },

  async dairy() {
    const t = G.time;
    const open = t >= 720 && t < 1260;
    const btns = [];
    if (!open) btns.push({ label: 'Order a cone', sub: t < 720 ? 'Opens at noon' : 'Closed for the night', value: 'x', disabled: true });
    else if (!G.done.icecream) btns.push({ label: 'Order a cone (Scoop Stack)', sub: 'Mini-game · 30 min', value: 'play', primary: true });
    else btns.push({ label: 'One more scoop of Jonathan Supreme', sub: G.flags.single ? 'Even Jaret has limits' : '+12 fullness · 15 min', value: 'single', disabled: !!G.flags.single });
    btns.push(LEAVE);
    const v = await card('Horsebarn Hill Road', 'UConn Dairy Bar', '<p>Ice cream made right here on campus. The famous flavor is Jonathan Supreme: a peanut butter swirl with chocolate-covered peanuts.</p>', btns, artOf((c, W, H) => drawDairyBG(c, W, H * 1.2, 0)));
    if (v === 'single') { G.flags.single = true; gain({ full: 12, spirit: 2 }); Story.advance(15, false); return; }
    if (v !== 'play') return;
    const out = await Mini.run(ScoopStack, { reward: r => ({ title: r.height >= 10 ? 'Brain freeze!' : r.height >= 5 ? 'Tall order!' : 'Single-scoop energy.', lines: ['You stacked ' + r.height + ' scoop' + (r.height === 1 ? '' : 's') + '.' + (r.perfect ? ' ' + r.perfect + ' perfect drop' + (r.perfect === 1 ? '' : 's') + '.' : '')], gains: { spirit: Math.min(25, r.height * 2), full: 15, energy: 4 }, ach: r.height >= 10 ? ['freeze'] : [] }) });
    applyReward(out.reward); G.results.scoop = out.result;
    G.done.icecream = true;
    Story.advance(30, false);
  },

  async hill() {
    const t = G.time;
    if (G.done.sunset || G.flags.stargazed) {
      await card('Horsebarn Hill', 'Horsebarn Hill', G.done.sunset ? "<p>The best view on campus. You already caught tonight's sunset here.</p>" : '<p>The stars are still out. The cows have gone to bed.</p>', [{ label: 'Head back', value: 'leave', primary: true, cancel: true }], artOf(drawSunset, { stars: t >= 1215 }));
      return;
    }
    if (t >= 1140 && t <= 1215) { await this.sunset(); return; }
    if (t > 1215) {
      sceneOf(drawSunset, { stars: true });
      await UI.say('narrator', 'The sun already set, but the sky over Horsebarn Hill is full of stars. Way more than back home.');
      gain({ spirit: 8 }, true); achieve('stargazer'); G.flags.stargazed = true;
      Story.advance(20, false);
      return;
    }
    const btns = [];
    if (t >= 1050) btns.push({ label: 'Wait for the sunset', sub: 'Skip ahead to 7:10 PM', value: 'wait', primary: true });
    btns.push({ label: 'Lie in the grass and watch clouds', sub: G.flags.relaxed ? 'You already did. The cows were judging.' : '+8 energy · 30 min', value: 'relax', disabled: !!G.flags.relaxed });
    btns.push({ label: 'Head back', value: 'leave', cancel: true });
    const tip = G.friends.includes('Marcus') ? 'Marcus said this is THE sunset spot.' : 'People say this is the best sunset spot on campus.';
    const v = await card('Horsebarn Hill', 'Horsebarn Hill', '<p>Rolling pasture, a big red barn and some very calm cows. ' + esc(tip) + ' Sunset is around 7:30 PM.</p>', btns, artOf(drawSunset, {}));
    if (v === 'wait') { await Story.skipTo(1150, 'Waiting for sunset'); await this.sunset(); }
    else if (v === 'relax') { G.flags.relaxed = true; await Story.skipTo(t + 30, 'Cloud watching'); gain({ energy: 8 }); }
  },
  async sunset() {
    const crew = G.friends.slice(0, 4);
    sceneOf(drawSunset, { friends: crew });
    Sound.play('moo');
    await UI.say('narrator', 'The sky over Horsebarn Hill turns orange, then pink, then purple. Somewhere behind the barn, a cow moos.');
    if (crew.length >= 2) {
      await UI.say(FRIEND_KEY[crew[0]], 'Okay. This was worth the walk.', 'happy');
      await UI.say('jaret', 'First day: survived.', 'grin');
      await UI.say(FRIEND_KEY[crew[1]], 'Survived? You crushed it.', 'happy');
    } else if (crew.length === 1) {
      await UI.say(FRIEND_KEY[crew[0]], 'Good call coming up here.', 'happy');
      await UI.say('jaret', 'Not a bad first day. Not bad at all.', 'happy');
    } else await UI.say('jaret', 'Not a bad first day. Not bad at all.', 'happy');
    gain({ spirit: 20 + Math.min(10, G.friends.length * 2), energy: 6 }, true);
    achieve('sunset');
    G.done.sunset = true;
    Story.advance(45, false);
  },

  async jonathan() {
    if (!World.jonVisible()) return;
    const j = World.jon;
    j.pause = 999;
    try {
      if (G.done.jonathan) { Sound.play('bark'); await UI.say('handler', 'He remembers you! Jonathan says hi again.', 'happy'); return; }
      await UI.say('handler', "Hey there! Want to meet Jonathan? He's UConn's live husky mascot.", 'happy');
      Sound.play('bark');
      await UI.say('jonathan', 'Arf!', 'grin');
      const c = await UI.ask('jaret', 'Whoa. Hi, buddy!', ['Can I get a selfie with him?', 'Why is he named Jonathan?'], 'happy');
      if (c === 1) await UI.say('handler', "Every UConn husky has been named Jonathan, after Jonathan Trumbull, Connecticut's governor during the American Revolution. Selfie?", 'neutral');
      await UI.say('narrator', "Jonathan sniffs Jaret's HUSKIES shirt and wags his tail. Approved.");
      const out = await Mini.run(Selfie, { reward: r => ({ title: r.quality === 'great' ? 'Frame-worthy!' : r.quality === 'okay' ? 'Cute!' : 'Blurry, but it counts.', lines: ["This one's going on the report card."], gains: { spirit: 15 + (r.quality === 'great' ? 5 : 0) }, ach: ['jonathan'], art: photoArt() }) });
      applyReward(out.reward); G.results.selfie = out.result;
      G.done.jonathan = true;
      await UI.say('handler', 'He likes you! Welcome to UConn.', 'happy');
      Story.advance(15, false);
    } finally { j.pause = 1; }
  },

  async priya() {
    if (G.flags.met_priya) { await UI.say('priya', G.friends.includes('Priya') ? "Jaret! I found Laurel Hall. You're officially my campus GPS." : 'Found it, by the way. It was on Fairfield Way.', 'happy'); return; }
    G.flags.met_priya = true;
    await UI.say('priya', 'Um, hi. Sorry. Do you know where Laurel Hall is? My map app keeps spinning in circles.', 'worried');
    const c = await UI.ask('jaret', 'Laurel Hall? Let me think…', ["It's on Fairfield Way, across from Oak Hall!", "Pretty sure it's by Mirror Lake?", "No idea. I'm new too!"], 'neutral');
    if (c === 0) { await UI.say('priya', "You're a lifesaver! I'm Priya, engineering. See you around!", 'happy'); addFriend('Priya'); gain({ spirit: 3 }); }
    else if (c === 1) await UI.say('priya', 'Hmm, my map says Fairfield Way… but thanks anyway!', 'neutral');
    else { await UI.say('priya', "Ha, same! Let's figure it out together sometime. I'm Priya.", 'happy'); addFriend('Priya'); }
  },
  async marcus() {
    if (G.flags.met_marcus) { await UI.say('marcus', "Remember: sunset, Horsebarn Hill, around 7:30. Don't make me say it twice.", 'grin'); return; }
    G.flags.met_marcus = true;
    await UI.say('marcus', "First day? I can tell. You've got the lost-freshman glow.", 'grin');
    const c = await UI.ask('jaret', 'Is it that obvious?', ['Any advice for a freshman?', 'Is the HUSKIES shirt too much?'], 'grin');
    if (c === 1) await UI.say('marcus', 'Too much? Never. Wear it with pride.', 'happy');
    await UI.say('marcus', 'Three things. One: the Dairy Bar is elite. Two: do NOT mess with the geese. Three: watch the sunset from Horsebarn Hill tonight, around 7:30.', 'happy');
    addFriend('Marcus'); gain({ spirit: 3 });
  },
  async bella() {
    const b = World.npcs.find(n => n.id === 'bella');
    b.pause = 999;
    try {
      if (G.flags.met_bella) { await UI.say('bella', 'Fun fact number two: Mirror Lake is not for swimming. Ask me how I know.', 'grin'); return; }
      G.flags.met_bella = true;
      await UI.say('bella', '…and behind me, Homer Babbidge Library! Oh, hi! Are you on my tour?', 'happy');
      const c = await UI.ask('jaret', "I'm a freshman, actually.", ['Why do tour guides walk backwards?', 'Any secret spots on campus?'], 'happy');
      if (c === 0) await UI.say('bella', "So we can see our group! I've only backed into a bush twice. Okay, three times.", 'grin');
      else await UI.say('bella', "Horsebarn Hill at sunset. And get the Jonathan Supreme at the Dairy Bar. You're welcome.", 'happy');
      gain({ spirit: 3 });
    } finally { b.pause = 1; }
  },
  async squirrel() {
    if (G.flags.met_squirrel) { await UI.say('narrator', 'The squirrel ignores you. You have already been processed.'); return; }
    G.flags.met_squirrel = true;
    await UI.say('narrator', 'A suspiciously round squirrel blocks the path. It is staring at the granola bar in your backpack.');
    const c = await UI.ask('squirrel', '…', ['Hand over the granola bar', 'Back away slowly', 'Have a staring contest'], 'neutral');
    if (c === 0) { Sound.play('chirp'); await UI.say('squirrel', '*chomp chomp chomp*', 'neutral'); gain({ full: -5, spirit: 2 }); achieve('squirrel'); }
    else if (c === 1) await UI.say('narrator', 'The squirrel lets you pass. This time.');
    else { await UI.say('narrator', 'Jaret blinks first. The squirrel wins. The squirrel always wins.'); gain({ spirit: 1 }); }
  },
  async goose() {
    if (G.flags.met_goose) { await UI.say('narrator', 'The goose watches you from a safe distance. Respectfully.'); return; }
    G.flags.met_goose = true;
    Sound.play('honk');
    await UI.say('goose', 'HONK.', 'neutral');
    const c = await UI.ask('goose', 'HONK HONK.', ['Honk back', 'Walk away calmly', 'Run!'], 'neutral');
    const chase = async () => {
      Sound.play('honk');
      await UI.say('narrator', 'The goose charges! Jaret sprints halfway around Mirror Lake before it gives up.');
      gain({ energy: -6, spirit: 2 }); achieve('gooser');
    };
    if (c === 0) {
      Sound.play('honk');
      if (Math.random() < 0.6) { await UI.say('narrator', 'The goose tilts its head… and nods. You have earned its respect.'); gain({ spirit: 4 }); achieve('goosed'); }
      else await chase();
    } else if (c === 1) await UI.say('narrator', 'You walk away calmly. The goose follows you for ten feet, then loses interest.');
    else await chase();
  },

  async passOut() {
    await UI.say('narrator', 'Jaret is completely out of gas. He sits down on the nearest bench "for one second"…');
    await Story.skipTo(G.time + 60, 'Accidental nap');
    G.stats.energy = Math.max(G.stats.energy, 30);
    HUD.update();
    UI.toast('Oops', 'Jaret woke up an hour later with a crick in his neck.', 'warn', 'z');
  },

  async endDay(forced) {
    if (G.mode === 'end') return;
    G.mode = 'end';
    await UI.fade(true, 500);
    sceneOf(drawDormRoom, { night: true, jaretInBed: true, tyler: G.friends.includes('Tyler'), clock: fmtTime(G.time).split(' ')[0] });
    await UI.fade(false, 500);
    if (forced) { await UI.say('narrator', "It's 11 PM. Jaret drags himself back to South Campus and face-plants into bed."); achieve('nightowl'); }
    else { G.done.sleep = true; achieve('lightsout'); await UI.say('narrator', "Jaret's head hits the pillow at " + fmtTime(G.time) + '.'); }
    if (G.friends.includes('Tyler')) await UI.say('tyler', 'Night, roomie. Big day tomorrow too.', 'tired');
    await UI.say('jaret', 'Day one: done. Go Huskies.', 'tired');
    this.checkOnTime();
    if (G.friends.length >= 5) achieve('social');
    await wait(600);
    const again = await this.reportCard();
    Story.reset();
    if (again) {
      await UI.fade(true, 400);
      World.placePlayer(PLACES.dorm.door.x, PLACES.dorm.door.y - 6, 'up');
      G.mode = 'scene';
      await this.intro();
    } else {
      await UI.fade(true, 300);
      G.scene = null;
      Main.showTitle();
      await UI.fade(false, 400);
    }
  },

  async reportCard() {
    const sc = dayScore(), gr = gradeFor(sc);
    const best = store.get('best', null);
    const isBest = !best || sc > best.score;
    if (isBest) store.set('best', { score: sc, grade: gr.grade });
    const done = TASKS.filter(k => G.done[k.id]).length;
    const R = G.results, lines = [];
    if (R.psych) lines.push('Psych pop quiz: ' + R.psych.correct + '/' + R.psych.total);
    if (R.calc) lines.push('Math Sprint: ' + R.calc.solved + ' solved');
    if (R.memory) lines.push('Memory Match: ' + R.memory.pairs + '/8 pairs');
    if (R.hoops) lines.push('Free throws: ' + R.hoops.makes + '/10');
    if (R.scoop) lines.push('Scoop Stack: ' + R.scoop.height + ' scoop' + (R.scoop.height === 1 ? '' : 's'));
    if (R.tray) lines.push('Tray Dash: ' + R.tray.score + ' points');
    if (R.swag) lines.push(swagLine(R.swag.items));
    const missed = TASKS.filter(k => !G.done[k.id]).map(k => k.label);
    const badges = Object.keys(ACH).map(id => '<span class="badge' + (G.ach.includes(id) ? '' : ' off') + '" title="' + esc(ACH[id].desc) + '">' + esc(ACH[id].name) + '</span>').join('');
    const photo = G.photo ? '<div class="polaroid"><img src="' + esc(G.photo) + '" alt="Jaret\'s selfie with Jonathan the Husky"><span>Day 1 with Jonathan</span></div>' : '';
    const html = '<div class="report">' +
      '<div class="grade-row"><div class="grade">' + esc(gr.grade) + '</div><div><h3>' + esc(gr.title) + '</h3><p>Day score ' + sc + '. ' + (isBest ? 'New personal best!' : 'Best so far: ' + esc(best.grade) + ' (' + best.score + ').') + '</p></div></div>' +
      '<div class="tally"><div><b>' + G.friends.length + '</b><span>Friends</span></div><div><b>' + G.stats.spirit + '</b><span>Husky spirit</span></div><div><b>' + G.stats.brain + '</b><span>Brain</span></div><div><b>' + done + '/' + TASKS.length + '</b><span>Plan done</span></div></div>' +
      '<div class="rc-split"><div><div class="rc-label">Highlights</div><p>' + (lines.length ? lines.map(esc).join('<br>') : 'A quiet day. Tomorrow is another one.') + '</p>' +
      '<div class="rc-label">Friends made</div><p>' + (G.friends.length ? esc(G.friends.join(', ')) : 'None yet. Tomorrow!') + '</p>' +
      (missed.length ? '<div class="rc-label">Missed</div><p>' + esc(missed.join(', ')) + '</p>' : '') + '</div>' + photo + '</div>' +
      '<div><div class="rc-label">Achievements ' + G.ach.length + '/' + Object.keys(ACH).length + '</div><div class="badges">' + badges + '</div></div></div>';
    const art = (c, w, h, t) => {
      c.fillStyle = '#13306E'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { c.fillStyle = ['#FFC94A', '#FFFFFF', '#FF7FA6', '#9FD8FF'][i % 4]; const x = (i * 97 + Math.sin(t + i) * 20) % w, y = (i * 53 + t * 50 * (1 + i % 3)) % h; c.fillRect(x, y, 7, 3); }
      const S = Math.min(h * 1.05, 220);
      c.save(); c.translate(w / 2 - S / 2, h - S * 0.92); drawPortrait(c, S, LOOKS.jaret, 'grin', { noBg: true }); c.restore();
    };
    $('toasts').innerHTML = '';
    Sound.play('fanfare');
    const v = await UI.card({ kicker: "Jaret's First Day · Report card", title: 'Day one, graded', html, art, wide: true, buttons: [{ label: 'Play the day again', value: 'again', primary: true }, { label: 'Back to the title screen', value: 'title' }] });
    return v === 'again';
  },
};
