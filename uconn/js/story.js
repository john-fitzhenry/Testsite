'use strict';
/* Jaret's First Day — the day itself: cast, schedule, stats, clock, HUD and the scene runner. */

const P = key => (c, S, mood) => drawPortrait(c, S, LOOKS[key], mood);
Object.assign(CHARS, {
  narrator: { name: '' },
  jaret: { name: 'Jaret', portrait: P('jaret') },
  tyler: { name: 'Tyler · your roommate', portrait: P('tyler') },
  priya: { name: 'Priya', portrait: P('priya') },
  marcus: { name: 'Marcus · senior', portrait: P('marcus') },
  bella: { name: 'Bella · tour guide', portrait: P('bella') },
  prof: { name: 'Professor Whitfield', portrait: P('prof') },
  profk: { name: 'Professor Okafor', portrait: P('profk') },
  kai: { name: 'Kai', portrait: P('kai') },
  emma: { name: 'Emma', portrait: P('emma') },
  mia: { name: 'Mia · Ultimate Frisbee', portrait: P('mia') },
  leo: { name: 'Leo · Gaming Society', portrait: P('leo') },
  ava: { name: 'Ava · Improv Troupe', portrait: P('ava') },
  noah: { name: 'Noah · Outing Club', portrait: P('noah') },
  danielle: { name: 'Danielle · your RA', portrait: P('danielle') },
  sofia: { name: 'Sofia', portrait: P('sofia') },
  jordan: { name: 'Jordan', portrait: P('jordan') },
  handler: { name: "Sam · Jonathan's handler", portrait: P('handler') },
  jonathan: { name: 'Jonathan the Husky', portrait: (c, S, m) => drawHuskyPortrait(c, S, m) },
  goose: { name: 'Canada goose', portrait: (c, S) => drawGoosePortrait(c, S) },
  squirrel: { name: 'A very round squirrel', portrait: (c, S) => drawSquirrelPortrait(c, S) },
});

/* ---------------- Schedule ---------------- */
const TASKS = [
  { id: 'roommate', label: 'Meet your roommate', where: 'dorm', when: 'Dorm', start: 0, end: 1440 },
  { id: 'breakfast', label: 'Eat breakfast', where: 'dining', when: 'Until 10:30 AM · South Campus Dining', start: 420, end: 630 },
  { id: 'psych', label: 'Intro to Psychology', where: 'laurel', when: '10:00 AM · Laurel Hall', start: 570, end: 630, fixed: 600 },
  { id: 'clubfair', label: 'Club Fair', where: 'union', when: '11 AM – 4 PM · Student Union', start: 660, end: 960 },
  { id: 'jonathan', label: 'Find Jonathan the Husky', where: 'jonathan', when: '11 AM – 5 PM · Fairfield Way', start: 660, end: 1020 },
  { id: 'calc', label: 'Calculus I', where: 'oak', when: '2:00 PM · Oak Hall', start: 810, end: 870, fixed: 840 },
  { id: 'icecream', label: 'Get Dairy Bar ice cream', where: 'dairy', when: 'Noon – 9 PM · Dairy Bar', start: 720, end: 1260 },
  { id: 'hoops', label: 'Shoot hoops', where: 'gampel', when: 'Until 8 PM · Gampel Pavilion', start: 480, end: 1200 },
  { id: 'study', label: 'Study session', where: 'library', when: 'Anytime · Homer Babbidge Library', start: 480, end: 1380 },
  { id: 'sunset', label: 'Watch the sunset', where: 'hill', when: '7 – 8:15 PM · Horsebarn Hill', start: 1140, end: 1215, fixed: 1170 },
  { id: 'floor', label: 'Floor meeting', where: 'dorm', when: '9:00 PM · Dorm lounge', start: 1245, end: 1290, fixed: 1260 },
  { id: 'sleep', label: 'Get to bed', where: 'dorm', when: 'After 9 PM, by 11 PM · Dorm', start: 1260, end: 1380 },
];
const taskStatus = k => (G.done[k.id] ? 'done' : G.time > k.end ? 'missed' : 'open');

const ACH = {
  early: { name: 'Rise & Shine', desc: 'Got up without hitting snooze' },
  bottomless: { name: 'Bottomless Tray', desc: 'Scored 25+ in Tray Dash' },
  teacher: { name: "Teacher's Pet", desc: 'Aced the psych pop quiz' },
  calculator: { name: 'Human Calculator', desc: 'Solved 12+ in Math Sprint' },
  ontime: { name: 'Never Late', desc: 'Made both classes on time' },
  swag: { name: 'Swag Goblin', desc: 'Scored 30+ at the Club Fair' },
  swish: { name: 'Swish City', desc: 'Made 8+ free throws' },
  freeze: { name: 'Brain Freeze', desc: 'Stacked 10+ scoops' },
  memory: { name: 'Photographic Memory', desc: 'Matched every pair in 14 tries or fewer' },
  jonathan: { name: 'Husky Selfie', desc: 'Got a photo with Jonathan' },
  sunset: { name: 'Golden Hour', desc: 'Watched the sunset on Horsebarn Hill' },
  stargazer: { name: 'Stargazer', desc: 'Saw the stars from Horsebarn Hill' },
  social: { name: 'Social Butterfly', desc: 'Made 5+ friends' },
  squirrel: { name: 'Squirrel Tax', desc: 'Paid the campus squirrel' },
  goosed: { name: 'Goose Diplomat', desc: 'Earned the respect of a goose' },
  gooser: { name: 'Outran a Goose', desc: 'Escaped a goose chase' },
  coffee: { name: 'Caffeinated', desc: 'Had three coffees' },
  lightsout: { name: 'Lights Out', desc: 'Went to bed before 11 PM' },
  nightowl: { name: 'Night Owl', desc: 'Stayed out until 11 PM' },
};

/* ---------------- Stats ---------------- */
const STAT_NAMES = { energy: 'Energy', full: 'Fullness', spirit: 'Spirit', brain: 'Brain' };
const STAT_COLORS = { energy: '#FFC94A', full: '#7FD3FF', spirit: '#FFC94A', brain: '#9FD8FF' };
function gain(g, quiet) {
  const s = G.stats;
  let i = 0;
  for (const k of ['brain', 'spirit', 'energy', 'full']) {
    const v = g[k];
    if (!v) continue;
    s[k] = k === 'energy' || k === 'full' ? clamp(s[k] + v, 0, 100) : Math.max(0, s[k] + v);
    if (!quiet) World.float((v > 0 ? '+' : '') + v + ' ' + STAT_NAMES[k], v > 0 ? STAT_COLORS[k] : '#FF6B7D', World.player.x, World.player.y - 74 - i++ * 20);
  }
  HUD.update(g);
}
function applyReward(rw) {
  if (!rw) return;
  gain(rw.gains || {}, true);
  for (const a of rw.ach || []) achieve(a);
}
function addFriend(name) {
  if (G.friends.includes(name)) return;
  G.friends.push(name);
  Sound.play('good');
  UI.toast('New friend', name + ' is now your friend.', 'friend', '♥');
  HUD.update({ friends: 1 });
  if (G.friends.length >= 5) achieve('social');
}
function achieve(id) {
  if (G.ach.includes(id) || !ACH[id]) return;
  G.ach.push(id);
  Sound.play('fanfare');
  UI.toast('Achievement', ACH[id].name + ': ' + ACH[id].desc, 'ach', '★');
}

/* ---------------- HUD ---------------- */
const HUD = {
  lastMin: -1, planKey: '', promptKey: '', touch: (() => { try { return matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } })(),
  update(changed) {
    const s = G.stats;
    const set = (bar, val, v) => { $(bar).style.width = v + '%'; $(bar).classList.toggle('low', v < 20); $(val).textContent = Math.round(v); };
    set('barEnergy', 'valEnergy', s.energy);
    set('barFull', 'valFull', s.full);
    const ctr = (id, v, key) => {
      const el = $(id), b = el.querySelector('b');
      if (b.textContent !== String(v)) { b.textContent = v; if (changed && changed[key]) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } }
    };
    ctr('ctrFriends', G.friends.length, 'friends');
    ctr('ctrSpirit', s.spirit, 'spirit');
    ctr('ctrBrain', s.brain, 'brain');
    this.clock(true);
    this.plan();
  },
  clock(force) {
    const m = Math.floor(G.time);
    if (!force && m === this.lastMin) return;
    this.lastMin = m;
    const t = fmtTime(m).split(' ');
    $('clockTime').innerHTML = esc(t[0]) + '<small>' + esc(t[1]) + '</small>';
    const o = Story.objective();
    $('nextUp').textContent = o ? 'Next: ' + o.task.label : 'Free time. Explore campus!';
    if (m % 5 === 0 || force) this.plan();
    // meters drift with time; keep numbers honest
    const s = G.stats;
    $('barEnergy').style.width = s.energy + '%'; $('valEnergy').textContent = Math.round(s.energy); $('barEnergy').classList.toggle('low', s.energy < 20);
    $('barFull').style.width = s.full + '%'; $('valFull').textContent = Math.round(s.full); $('barFull').classList.toggle('low', s.full < 20);
  },
  plan() {
    const o = Story.objective();
    const rows = TASKS.map(k => ({ k, st: taskStatus(k) }));
    const key = rows.map(r => r.st[0]).join('') + (o ? o.task.id : '');
    $('planCount').textContent = TASKS.filter(k => G.done[k.id]).length + '/' + TASKS.length;
    if (key === this.planKey) return;
    this.planKey = key;
    $('planList').innerHTML = rows.map(({ k, st }) =>
      '<li data-id="' + k.id + '" class="' + st + (o && o.task.id === k.id ? ' next' : '') + '"><span class="box">' + (st === 'done' ? '✓' : st === 'missed' ? '×' : '') + '</span><span><span class="t">' + esc(k.label) + '</span><span class="w">' + esc(k.when) + '</span></span></li>').join('');
  },
  prompt() {
    const show = G.mode === 'world' && !G.busy && !G.scene && !UI.dlg && !UI.cardOpen && !BigMap.open && World.near;
    const key = show ? World.near.label : '';
    if (key === this.promptKey) return;
    this.promptKey = key;
    const el = $('prompt');
    el.hidden = !show;
    if (show) el.innerHTML = (this.touch ? '' : '<kbd>E</kbd>') + '<span>' + esc(World.near.label) + '</span>';
  },
};
$('prompt').addEventListener('click', e => { e.currentTarget.blur(); if (World.near) World.activate(World.near); });
$('planToggle').addEventListener('click', e => {
  const b = e.currentTarget, open = b.getAttribute('aria-expanded') !== 'true';
  b.setAttribute('aria-expanded', String(open)); $('planList').hidden = !open; b.blur();
  store.set('planOpen', open);
});
$('planList').addEventListener('click', e => {
  const li = e.target.closest('li');
  if (!li || G.mode !== 'world' || G.busy) return;
  const k = TASKS.find(t => t.id === li.dataset.id);
  if (!k || taskStatus(k) !== 'open') return;
  const tgt = World.interactables().find(t => t.key === k.where);
  if (tgt) World.walkTo(tgt.x, tgt.y + (tgt.npc ? 24 : 0), tgt);
});
$('btnMusic').addEventListener('click', e => { Sound.init(); Sound.setMusic(!Sound.musicOn); e.currentTarget.setAttribute('aria-pressed', String(Sound.musicOn)); e.currentTarget.blur(); });
$('btnSfx').addEventListener('click', e => { Sound.init(); Sound.setSfx(!Sound.sfxOn); e.currentTarget.setAttribute('aria-pressed', String(Sound.sfxOn)); e.currentTarget.blur(); });

/* ---------------- Clock, timers and the scene runner ---------------- */
const TIMERS = [
  { id: 'mom1', at: 520, fn: () => UI.toast('Mom', G.done.breakfast ? 'So proud of you!! Have the best first day.' : 'Good luck today sweetie!! Did you eat breakfast??', 'info', 'M') },
  { id: 'psych', at: 585, until: 600, when: () => !G.done.psych, fn: () => UI.toast('Reminder', 'Intro to Psychology starts at 10:00 AM in Laurel Hall.', 'warn', '!') },
  { id: 'fair', at: 660, until: 900, when: () => !G.done.clubfair, fn: () => UI.toast('Student Union', 'The Club Fair is open until 4 PM. Free stuff!', 'info', '★') },
  { id: 'jon', at: 668, until: 1000, when: () => !G.done.jonathan, fn: () => UI.toast('Husky alert', 'Jonathan the Husky was spotted on Fairfield Way!', 'info', 'J') },
  { id: 'tyler', at: 750, until: 1100, when: () => G.friends.includes('Tyler') && !G.done.icecream, fn: () => UI.toast('Tyler', 'yo the dairy bar is open. jonathan supreme is elite', 'info', 'T') },
  { id: 'calc', at: 825, until: 840, when: () => !G.done.calc, fn: () => UI.toast('Reminder', 'Calculus I starts at 2:00 PM in Oak Hall.', 'warn', '!') },
  { id: 'jonlast', at: 990, until: 1015, when: () => !G.done.jonathan, fn: () => UI.toast('Husky alert', 'Last call: Jonathan heads home at 5 PM.', 'warn', 'J') },
  { id: 'sunset', at: 1125, until: 1190, when: () => !G.done.sunset, fn: () => G.friends.includes('Marcus') ? UI.toast('Marcus', 'sunset at horsebarn hill around 7:30. trust me', 'info', 'M') : UI.toast('Weather', 'Sunset tonight around 7:30 PM. Horsebarn Hill is the spot.', 'info', '☀') },
  { id: 'ra', at: 1235, until: 1275, when: () => !G.done.floor, fn: () => UI.toast('Danielle (RA)', 'Floor meeting at 9 in the lounge. There will be cookies!', 'info', 'D') },
  { id: 'mom2', at: 1320, fn: () => UI.toast('Mom', 'Get some sleep!! Love you. Tell me everything tomorrow.', 'info', 'M') },
  { id: 'late', at: 1350, fn: () => UI.toast('Reminder', "It's 10:30 PM. Get back to your dorm and into bed by 11.", 'warn', '!') },
];
const MISSED = { psych: 'You missed Intro to Psychology.', calc: 'You missed Calculus I.', clubfair: 'The Club Fair packed up for the day.', jonathan: 'Jonathan went home for the day.', sunset: 'The sun has set over Horsebarn Hill.', floor: 'The floor meeting wrapped up without you.' };

const Story = {
  lastSave: null, saveT: 0,

  objective() {
    if (G.mode !== 'world') return null;
    const t = G.time;
    const open = TASKS.filter(k => !G.done[k.id] && t <= k.end && k.id !== 'roommate');
    let k = open.find(x => x.fixed && t >= x.fixed - 50);
    if (!k) k = open.find(x => !x.fixed && x.id !== 'sleep' && t >= x.start);
    if (!k) k = open.find(x => x.id === 'sleep' && t >= x.start);
    if (!k) k = open.filter(x => t < x.start).sort((a, b) => a.start - b.start)[0];
    if (!k) return null;
    if (k.where === 'jonathan') {
      if (!World.jonVisible()) return { key: 'jonathan', task: k, x: 1200, y: 880 };
      return { key: 'jonathan', task: k, x: World.jon.x, y: World.jon.y };
    }
    const p = PLACES[k.where];
    return { key: k.where, task: k, x: p.door.x, y: p.door.y };
  },

  tick(dt) {
    this.advance(dt, true);
    this.saveT += dt;
    if (this.saveT > 2) { this.saveT = 0; this.lastSave = this.serialize(); }
    if (G.time >= 1380) { this.run(() => Scenes.endDay(true)); return; }
    if (G.stats.energy <= 0) this.run(() => Scenes.passOut());
  },

  advance(mins, live) {
    const before = G.time;
    G.time = Math.min(1380, G.time + mins);
    const m = G.time - before;
    const s = G.stats;
    s.full = clamp(s.full - m * 0.08, 0, 100);
    s.energy = clamp(s.energy - m * 0.05 * (s.full < 10 ? 2 : 1), 0, 100);
    for (const tm of TIMERS) {
      if (G.flags['t_' + tm.id] || G.time < tm.at) continue;
      G.flags['t_' + tm.id] = true;
      if ((tm.until == null || G.time <= tm.until) && (!tm.when || tm.when())) { tm.fn(); Sound.play('phone'); }
    }
    for (const id in MISSED) {
      const k = TASKS.find(x => x.id === id);
      if (!G.done[id] && G.time > k.end && !G.flags['m_' + id]) { G.flags['m_' + id] = true; if (live) UI.toast('Missed', MISSED[id], 'warn', '×'); }
    }
    if (s.energy < 15 && !G.flags.lowE) { G.flags.lowE = true; UI.toast('Low energy', 'Jaret is running on fumes. Nap, coffee or food!', 'warn', 'z'); }
    if (s.energy > 30) G.flags.lowE = false;
    if (s.full < 15 && !G.flags.lowF) { G.flags.lowF = true; UI.toast('Hungry', "Jaret's stomach growls. Loudly.", 'warn', '!'); }
    if (s.full > 30) G.flags.lowF = false;
    Music.setMode(G.mini ? 'mini' : G.time >= 1200 ? 'night' : 'day');
    HUD.clock(false);
  },

  /* Jump the clock with a fade, e.g. for naps or waiting for class. */
  async skipTo(to, label) {
    const from = G.time;
    if (to <= from) return;
    await UI.fade(true, 350);
    await UI.timeSkip(from, to, label);
    this.advance(to - from, false);
    await UI.fade(false, 350);
  },

  async run(fn) {
    if (G.busy) return;
    G.busy = true;
    HUD.prompt();
    try { await fn(); }
    catch (e) {
      console.error(e);
      if (UI.dlg) UI.dlgClose(undefined);
      if (UI._card) UI._card.finish(undefined);
      G.mini = null;
      $('fade').classList.remove('on'); $('skip').hidden = true;
    } finally {
      G.scene = null;
      G.busy = false;
      if (G.mode === 'scene') G.mode = 'world';
      Music.setMode(G.time >= 1200 ? 'night' : 'day');
      HUD.update();
      if (G.mode === 'world') {
        if (G.time >= 1380) setTimeout(() => this.run(() => Scenes.endDay(true)), 0);
        else if (G.stats.energy <= 0) setTimeout(() => this.run(() => Scenes.passOut()), 0);
      }
    }
  },

  serialize() {
    const p = World.player;
    return JSON.parse(JSON.stringify({ time: G.time, stats: G.stats, friends: G.friends, done: G.done, late: G.late, flags: G.flags, ach: G.ach, swag: G.swag, results: G.results, photo: G.photo, coffees: G.coffees, px: p.x, py: p.y }));
  },
  restore(s) {
    Object.assign(G, { time: s.time, stats: s.stats, friends: s.friends, done: s.done, late: s.late, flags: s.flags, ach: s.ach, swag: s.swag, results: s.results, photo: s.photo, coffees: s.coffees });
    World.placePlayer(s.px, s.py, 'down');
  },
  reset() {
    Object.assign(G, { time: 8 * 60, stats: { energy: 78, full: 35, spirit: 0, brain: 0 }, friends: [], done: {}, late: {}, flags: {}, ach: [], swag: {}, results: {}, photo: null, coffees: 0, mini: null, scene: null });
    this.lastSave = null;
    HUD.planKey = '';
  },
};

/* Score + letter grade for the report card. */
function gradeFor(score) {
  const T = [[400, 'A+', 'Husky Legend'], [360, 'A', 'Big Dog on Campus'], [325, 'A−', 'Certified Husky'], [290, 'B+', 'Husky in Training'], [255, 'B', 'Solid First Day'], [225, 'B−', 'Finding His Way'], [195, 'C+', 'Fashionably Late'], [165, 'C', 'Still Lost on Fairfield Way'], [135, 'C−', 'Survived. Barely.'], [100, 'D', 'Needs a Nap'], [-1, 'F', 'Day One Disaster']];
  for (const [min, g, title] of T) if (score >= min) return { grade: g, title };
  return { grade: 'F', title: 'Day One Disaster' };
}
function dayScore() {
  const done = TASKS.filter(k => G.done[k.id]).length;
  return Math.round(G.stats.brain + G.stats.spirit + G.friends.length * 8 + done * 5 + G.ach.length * 3);
}
