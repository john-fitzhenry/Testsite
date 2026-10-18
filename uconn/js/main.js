'use strict';
/* Jaret's First Day — title screen, main loop and boot. */

function drawTitleJaret() {
  const cnv = $('titleJaret'), c = cnv.getContext('2d'), S = cnv.width;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, S, S);
  c.save(); c.translate(S / 2, S / 2);
  c.fillStyle = '#13306E'; c.beginPath(); c.arc(0, 0, S * 0.48, 0, TAU); c.fill();
  c.strokeStyle = '#FFC94A'; c.lineWidth = S * 0.012; c.beginPath(); c.arc(0, 0, S * 0.462, 0, TAU); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = S * 0.005; c.beginPath(); c.arc(0, 0, S * 0.362, 0, TAU); c.stroke();
  const text = 'STORRS · CONNECTICUT · CLASS OF 2030 · GO HUSKIES · ';
  c.font = '400 ' + Math.round(S * 0.043) + 'px ' + FONT.d; c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const R = S * 0.412, total = [...text].reduce((s, ch) => s + c.measureText(ch).width, 0);
  const scale = (TAU * R) / total;
  let a = -Math.PI / 2;
  for (const ch of text) {
    const w = c.measureText(ch).width * scale, mid = a + w / 2 / R;
    c.save(); c.rotate(mid + Math.PI / 2); c.fillText(ch, 0, -R); c.restore();
    a += w / R;
  }
  c.restore();
  c.save(); c.beginPath(); c.arc(S / 2, S / 2, S * 0.355, 0, TAU); c.clip();
  const g = c.createLinearGradient(0, S * 0.15, 0, S * 0.85);
  g.addColorStop(0, '#8FCDF2'); g.addColorStop(0.62, '#D6EEF9'); g.addColorStop(0.63, '#6FAE54'); g.addColorStop(1, '#4F8E3E');
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(S * 0.32, S * 0.3, 46, 16, 0, 0, TAU); c.ellipse(S * 0.68, S * 0.24, 36, 12, 0, 0, TAU); c.fill();
  c.translate(S / 2 - S * 0.34, S * 0.115);
  drawPortrait(c, S * 0.68, LOOKS.jaret, 'happy', { noBg: true });
  c.restore();
}

const Main = {
  hudShown: null,
  showTitle() {
    G.mode = 'title'; G.scene = null; G.busy = false;
    $('title').hidden = false;
    $('hud').hidden = true; this.hudShown = false;
    const best = store.get('best', null);
    $('bestGrade').textContent = best ? 'Best report card so far: ' + best.grade + ' · score ' + best.score : '';
    const b = $('btnStart'); if (!b.disabled) b.focus({ preventScroll: true });
  },
  async start() {
    if (G.mode !== 'title' || G.busy) return;
    Sound.init(); Music.start();
    Sound.play('confirm');
    G.busy = true;
    await UI.fade(true, 450);
    G.busy = false;
    $('title').hidden = true;
    Story.reset();
    World.placePlayer(PLACES.dorm.door.x, PLACES.dorm.door.y - 6, 'up');
    G.mode = 'scene';
    await Story.run(() => Scenes.intro());
  },
  howTo() {
    Sound.init();
    UI.card({ kicker: 'How to play', title: "Jaret's First Day", html: '<p>Jaret just moved into South Campus at UConn. Get him through his first day: classes, food, friends, a husky and one great sunset.</p>' + Scenes.controlsHtml(), buttons: [{ label: 'Got it', primary: true, cancel: true }] });
  },
};
$('btnStart').addEventListener('click', () => Main.start());
$('btnHow').addEventListener('click', () => Main.howTo());

let lastT = performance.now();
function loop(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastT) / 1000));
  lastT = now;
  const t = now / 1000;
  try {
    if (G.mini) Mini.frame(ctx, dt, t);
    else if (G.scene) {
      const st = stage();
      ctx.setTransform(view.dpr * st.s, 0, 0, view.dpr * st.s, 0, 0);
      G.scene(ctx, st.W, st.H, t);
    } else {
      if (G.mode === 'title' || G.mode === 'boot') World.updateTitle(dt);
      else {
        const live = G.mode === 'world' && !G.busy && !UI.dlg && !UI.cardOpen && !BigMap.open;
        World.update(dt, live);
        if (live) Story.tick(dt);
        World.updateCamera(dt);
      }
      World.draw(ctx, t);
    }
    const wantHud = G.mode === 'world' && !G.scene && !G.mini;
    if (wantHud !== Main.hudShown) { Main.hudShown = wantHud; $('hud').hidden = !wantHud; if (wantHud) HUD.update(); }
    if (wantHud) drawMinimap();
    HUD.prompt();
  } catch (e) { console.error(e); }
  requestAnimationFrame(loop);
}

function boot(data) {
  resizeCanvas();
  World.init();
  Scenes.register();
  World.snapCamera();
  const planOpen = store.get('planOpen', window.innerWidth > 760);
  $('planToggle').setAttribute('aria-expanded', String(planOpen)); $('planList').hidden = !planOpen;
  $('btnMusic').setAttribute('aria-pressed', String(Sound.musicOn));
  $('btnSfx').setAttribute('aria-pressed', String(Sound.sfxOn));
  drawTitleJaret();
  const fontsReady = (document.fonts && document.fonts.load)
    ? Promise.all(["400 20px 'Graduate'", "600 20px 'Barlow'", "700 20px 'Barlow'", "700 20px 'Barlow Condensed'"].map(f => document.fonts.load(f).catch(() => null)))
    : Promise.resolve();
  Promise.race([fontsReady, wait(3000)]).then(() => {
    groundTiles.clear(); // re-render ground labels with the loaded fonts
    drawTitleJaret();
    const b = $('btnStart'); b.disabled = false; b.textContent = 'Start the day';
    if (G.mode === 'title') b.focus({ preventScroll: true });
  });
  const save = data && data.save;
  if (save && typeof save.time === 'number') {
    Story.restore(save);
    $('title').hidden = true;
    G.mode = 'world';
    HUD.update();
  } else Main.showTitle();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => { resizeCanvas(); World.clampCam(); });
// Audio can only start after a gesture; resume it on the first one.
const wake = () => { Sound.init(); if (G.mode !== 'title' && G.mode !== 'boot') Music.start(); };
window.addEventListener('pointerdown', wake, { once: true });
document.addEventListener('visibilitychange', () => {
  if (!Sound.ac) return;
  if (document.hidden) Sound.ac.suspend().catch(() => {});
  else Sound.ac.resume().catch(() => {});
});
window.addEventListener('keydown', wake, { once: true });

(function start() {
  const hot = window.claude && window.claude.hot;
  try { if (hot && typeof hot.snapshot === 'function') hot.snapshot(() => (Story.lastSave && G.mode === 'world' ? { save: Story.lastSave } : {})); } catch (e) { /* no hot reload here */ }
  if (hot && typeof hot.ready === 'function') hot.ready(boot);
  else boot((hot && hot.data) || {});
})();
