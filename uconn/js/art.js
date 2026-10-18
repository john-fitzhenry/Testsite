'use strict';
/* Jaret's First Day — drawing: people, animals, portraits and item icons. Everything is vector canvas art. */

const TAU = Math.PI * 2;

const LOOKS = {
  jaret:   { skin: '#F7D2B2', hair: '#F2CE5E', hairDark: '#CFA23A', hairHi: '#FFF1A8', style: 'jaret', eyes: '#36A85A', brow: '#C8973A', shirt: '#13306E', text: 'HUSKIES', pants: '#33507E', shoes: '#F4F5F7', pack: '#C8102E', bg: '#1C3A80', seed: 1 },
  tyler:   { skin: '#C98E66', hair: '#2B1B12', style: 'curly', eyes: '#4A2E18', brow: '#22140C', shirt: '#E2672D', pants: '#2C2C36', shoes: '#26262E', bg: '#7A3418', seed: 2 },
  priya:   { skin: '#B97E58', hair: '#1E1412', style: 'long', eyes: '#3A2414', brow: '#1E1412', shirt: '#7B5CD6', pants: '#2F3E64', shoes: '#F0F0F0', glasses: true, bg: '#3E2F7A', seed: 3 },
  marcus:  { skin: '#7A4A2E', hair: '#141010', style: 'buzz', eyes: '#2A1A10', brow: '#141010', shirt: '#2E8C5A', pants: '#C9B48A', shoes: '#333', bg: '#1F5A3C', seed: 4 },
  bella:   { skin: '#F1C8A8', hair: '#A0522D', style: 'ponytail', eyes: '#2F6FA8', brow: '#7A3E20', shirt: '#0E2D6E', pants: '#2A2A2A', shoes: '#FFFFFF', bg: '#16306E', seed: 5 },
  prof:    { skin: '#E9BE9C', hair: '#B8B8BE', style: 'bald', eyes: '#3B4A5A', brow: '#8F8F96', shirt: '#6B4A33', pants: '#3A3A44', shoes: '#2A1A10', glasses: true, beard: '#B8B8BE', bg: '#4A3526', seed: 6 },
  profk:   { skin: '#8D5A3B', hair: '#18110E', style: 'bun', eyes: '#2A1A10', brow: '#18110E', shirt: '#2B6CB0', pants: '#2A2A38', shoes: '#2A2A2A', glasses: true, bg: '#1D4A7A', seed: 7 },
  kai:     { skin: '#E3B48C', hair: '#1A1A1E', style: 'short', eyes: '#2B2018', brow: '#1A1A1E', shirt: '#F2F2F2', pants: '#4B5563', shoes: '#C8102E', bg: '#4B5563', seed: 8 },
  emma:    { skin: '#F4CDB0', hair: '#5A3A22', style: 'long', eyes: '#4E7A3A', brow: '#4A2E18', shirt: '#E94F7A', pants: '#273B66', shoes: '#F4F4F4', bg: '#8A2C4E', seed: 9 },
  mia:     { skin: '#D9A47C', hair: '#2A1A12', style: 'ponytail', eyes: '#3A2414', brow: '#2A1A12', shirt: '#F2B134', pants: '#1F2A44', shoes: '#F4F4F4', bg: '#8A5A10', seed: 10 },
  leo:     { skin: '#F2CBA6', hair: '#C2562C', style: 'curly', eyes: '#3D6E8C', brow: '#9A3E1C', shirt: '#2A2A34', pants: '#3E4A5E', shoes: '#8DE0FF', glasses: true, bg: '#2A2A40', seed: 11 },
  ava:     { skin: '#6B4128', hair: '#141010', style: 'bun', eyes: '#2A1A10', brow: '#141010', shirt: '#13A39A', pants: '#2C2C36', shoes: '#FFD24A', bg: '#0F5E5A', seed: 12 },
  noah:    { skin: '#E8BC96', hair: '#6B4A2A', style: 'cap', cap: '#3E6B3A', eyes: '#4A3A20', brow: '#5A3A20', shirt: '#A65A2E', pants: '#55603E', shoes: '#6B4A2A', bg: '#3E5A2A', seed: 13 },
  danielle:{ skin: '#A86E48', hair: '#2A1A12', style: 'curlylong', eyes: '#3A2414', brow: '#2A1A12', shirt: '#0F7BD8', pants: '#1F2A44', shoes: '#F4F4F4', bg: '#0F4E8A', seed: 14 },
  sofia:   { skin: '#E6B994', hair: '#2E1C12', style: 'long', eyes: '#5A3A1E', brow: '#2E1C12', shirt: '#F0E6D6', pants: '#3A4A6E', shoes: '#C8102E', bg: '#6E5A3E', seed: 15 },
  jordan:  { skin: '#C08A62', hair: '#E9E2D2', style: 'short', eyes: '#2A1A10', brow: '#8A7A60', shirt: '#5E3FA8', pants: '#2A2A2A', shoes: '#F4F4F4', bg: '#3E2A70', seed: 16 },
  handler: { skin: '#F0C6A2', hair: '#3A2A1A', style: 'cap', cap: '#0E2D6E', eyes: '#3A2A1A', brow: '#3A2A1A', shirt: '#0E2D6E', pants: '#C9B48A', shoes: '#2A2A2A', bg: '#16306E', seed: 17 },
  mom:     { skin: '#F4CFB2', hair: '#E3BE5C', style: 'long', eyes: '#36A85A', brow: '#B8893A', shirt: '#4FA3D9', pants: '#333', shoes: '#333', bg: '#2E6E9A', seed: 18 },
};

/* Random looks for the crowds of students on the paths. */
function randomLook(r) {
  const skins = ['#F7D2B2', '#EBC09A', '#D9A47C', '#B9805A', '#8D5A3B', '#6B4128'];
  const hairs = ['#1A1412', '#2E1C12', '#5A3A22', '#8A5A2A', '#C2562C', '#E3BE5C', '#141010', '#3A2A1A'];
  const shirts = ['#13306E', '#E2672D', '#2E8C5A', '#7B5CD6', '#E94F7A', '#F2B134', '#13A39A', '#F2F2F2', '#2A2A34', '#A65A2E', '#C8102E', '#5E8FD9'];
  const pants = ['#2C2C36', '#33507E', '#4B5563', '#C9B48A', '#1F2A44', '#55603E'];
  const styles = ['short', 'long', 'bun', 'curly', 'buzz', 'ponytail', 'cap', 'curlylong'];
  const p = a => a[Math.floor(r() * a.length)];
  const hair = p(hairs);
  return { skin: p(skins), hair, brow: hair, eyes: '#2A1A10', style: p(styles), cap: p(['#13306E', '#C8102E', '#2A2A2A', '#F2F2F2']), shirt: p(shirts), pants: p(pants), shoes: p(['#F4F4F4', '#2A2A2A', '#C8102E']), glasses: r() < 0.2, pack: r() < 0.6 ? p(['#2A2A34', '#C8102E', '#3E6B3A', '#7B5CD6', '#13306E']) : null, seed: Math.floor(r() * 1000) };
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; } else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
}

function blinkNow(seed) {
  const t = performance.now() / 1000 + seed * 1.37;
  return (t % 3.7) < 0.12;
}

/* ---------------- World sprite: feet at (x, y) ---------------- */
function drawPerson(c, x, y, L, dir, anim, moving) {
  const sc = L.scale || 1;
  c.save();
  c.translate(x, y);
  c.scale(sc, sc);
  c.fillStyle = 'rgba(0,0,0,.22)';
  c.beginPath(); c.ellipse(0, 0, 14, 5, 0, 0, TAU); c.fill();
  const sw = moving ? Math.sin(anim) : 0;
  const bob = moving ? -Math.abs(Math.sin(anim)) * 1.6 : 0;
  const side = dir === 'left' || dir === 'right';
  if (dir === 'left') c.scale(-1, 1);
  c.translate(0, bob);

  // legs + shoes
  const leg = (lx, lift, dark) => {
    c.fillStyle = dark ? shade(L.pants, -0.25) : L.pants;
    c.fillRect(lx, -17 - lift, 6, 13);
    c.fillStyle = dark ? shade(L.shoes, -0.2) : L.shoes;
    rrect(c, side ? lx - 0.5 : lx - 1, -5 - lift, side ? 9 : 8, 5, 2); c.fill();
  };
  if (side) { leg(-3 - sw * 5, Math.max(0, -sw) * 2, true); leg(-3 + sw * 5, Math.max(0, sw) * 2, false); }
  else { leg(-7, Math.max(0, sw) * 3, false); leg(1, Math.max(0, -sw) * 3, false); }

  // backpack behind (side view)
  if (side && L.pack) { c.fillStyle = L.pack; rrect(c, -15, -35, 8, 17, 3); c.fill(); }

  // arms
  const arm = (ax, swing) => {
    c.fillStyle = L.shirt; rrect(c, ax - 2.5, -34 + swing, 5, 8, 2); c.fill();
    c.fillStyle = L.skin; rrect(c, ax - 2.2, -27 + swing, 4.4, 8, 2); c.fill();
    c.beginPath(); c.arc(ax, -18.5 + swing, 2.5, 0, TAU); c.fill();
  };
  if (!side) { arm(-13.5, sw * 2); arm(13.5, -sw * 2); }

  // torso
  c.fillStyle = L.shirt;
  if (side) { rrect(c, -9, -36, 18, 21, 6); } else { rrect(c, -12, -36, 24, 21, 6); }
  c.fill();
  c.fillStyle = 'rgba(255,255,255,.08)';
  if (side) c.fillRect(-7, -35, 14, 3); else c.fillRect(-10, -35, 20, 3);

  if (dir === 'down') {
    if (L.pack) { c.fillStyle = shade(L.pack, -0.15); c.fillRect(-10, -36, 2.4, 6); c.fillRect(7.6, -36, 2.4, 6); }
    if (L.text) {
      c.fillStyle = '#FFFFFF';
      c.font = '700 6px ' + FONT.c;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(L.text, 0, -25.5);
    }
  }
  if (dir === 'up' && L.pack) {
    c.fillStyle = L.pack; rrect(c, -10, -35, 20, 18, 4); c.fill();
    c.fillStyle = shade(L.pack, -0.2); rrect(c, -7, -26, 14, 7, 2); c.fill();
  }
  if (side) {
    // single swinging arm
    c.save(); c.translate(0, -32); c.rotate(-sw * 0.6);
    c.fillStyle = L.shirt; rrect(c, -2.5, -1, 5, 8, 2); c.fill();
    c.fillStyle = L.skin; rrect(c, -2.2, 6, 4.4, 8, 2); c.fill();
    c.beginPath(); c.arc(0, 14.5, 2.5, 0, TAU); c.fill();
    c.restore();
  }

  // neck + head
  c.fillStyle = shade(L.skin, -0.1);
  c.fillRect(-3, -39, 6, 4);
  drawHead(c, L, dir);
  c.restore();
}

function drawHead(c, L, dir) {
  const hx = 0, hy = -49;
  const side = dir === 'left' || dir === 'right';
  if (L.style === 'long' || L.style === 'curlylong') {
    c.fillStyle = L.style === 'curlylong' ? L.hair : shade(L.hair, -0.1);
    if (dir === 'up') { rrect(c, -13, -55, 26, 22, 6); c.fill(); }
    else if (side) { rrect(c, -14, -54, 12, 20, 5); c.fill(); }
    else { c.fillRect(-14, -50, 5, 16); c.fillRect(9, -50, 5, 16); }
  }
  // ears
  c.fillStyle = shade(L.skin, -0.06);
  if (!side) { c.beginPath(); c.arc(-12.6, hy + 1.5, 3, 0, TAU); c.arc(12.6, hy + 1.5, 3, 0, TAU); c.fill(); }
  c.fillStyle = L.skin;
  c.beginPath(); c.ellipse(hx, hy, 13, 12.6, 0, 0, TAU); c.fill();
  if (side) { c.fillStyle = shade(L.skin, -0.08); c.beginPath(); c.arc(-2, hy + 1.5, 3, 0, TAU); c.fill(); }

  drawHairSprite(c, L, dir);

  if (dir === 'down') {
    const blink = blinkNow(L.seed || 0);
    for (const ex of [-5, 5]) {
      if (blink) { c.strokeStyle = '#3A2A20'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(ex - 2.4, hy + 2); c.lineTo(ex + 2.4, hy + 2); c.stroke(); continue; }
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(ex, hy + 2, 2.7, 3.1, 0, 0, TAU); c.fill();
      c.fillStyle = L.eyes; c.beginPath(); c.arc(ex, hy + 2.4, 2, 0, TAU); c.fill();
      c.fillStyle = '#14202A'; c.beginPath(); c.arc(ex, hy + 2.5, 1, 0, TAU); c.fill();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(ex + 0.7, hy + 1.6, 0.65, 0, TAU); c.fill();
    }
    c.strokeStyle = L.brow; c.lineWidth = 1.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-7.5, hy - 3); c.quadraticCurveTo(-5, hy - 4.3, -2.6, hy - 3.2); c.stroke();
    c.beginPath(); c.moveTo(7.5, hy - 3); c.quadraticCurveTo(5, hy - 4.3, 2.6, hy - 3.2); c.stroke();
    c.strokeStyle = '#9A4A3A'; c.lineWidth = 1.2;
    c.beginPath(); c.arc(0, hy + 6.3, 2.8, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
    c.fillStyle = 'rgba(255,120,120,.25)';
    c.beginPath(); c.ellipse(-8.6, hy + 5.6, 2.4, 1.4, 0, 0, TAU); c.ellipse(8.6, hy + 5.6, 2.4, 1.4, 0, 0, TAU); c.fill();
    if (L.glasses) {
      c.strokeStyle = '#1E1E26'; c.lineWidth = 1;
      rrect(c, -8.6, hy - 1.2, 7, 6.4, 2); c.stroke(); rrect(c, 1.6, hy - 1.2, 7, 6.4, 2); c.stroke();
      c.beginPath(); c.moveTo(-1.6, hy + 1); c.lineTo(1.6, hy + 1); c.stroke();
    }
    if (L.beard) { c.fillStyle = L.beard; c.beginPath(); c.ellipse(0, hy + 9, 8, 4.5, 0, 0, Math.PI); c.fill(); }
  } else if (side) {
    const blink = blinkNow(L.seed || 0);
    if (blink) { c.strokeStyle = '#3A2A20'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(4.5, hy + 2); c.lineTo(9, hy + 2); c.stroke(); }
    else {
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(7, hy + 2, 2.2, 3, 0, 0, TAU); c.fill();
      c.fillStyle = L.eyes; c.beginPath(); c.arc(7.8, hy + 2.4, 1.7, 0, TAU); c.fill();
      c.fillStyle = '#14202A'; c.beginPath(); c.arc(8.2, hy + 2.5, 0.85, 0, TAU); c.fill();
    }
    c.strokeStyle = L.brow; c.lineWidth = 1.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(4.6, hy - 3.2); c.lineTo(9.6, hy - 3.4); c.stroke();
    c.strokeStyle = '#9A4A3A'; c.lineWidth = 1.1;
    c.beginPath(); c.arc(9.4, hy + 6, 2, 0.1 * Math.PI, 0.6 * Math.PI); c.stroke();
    if (L.glasses) { c.strokeStyle = '#1E1E26'; c.lineWidth = 1; rrect(c, 4, hy - 1.2, 7, 6.4, 2); c.stroke(); c.beginPath(); c.moveTo(4, hy + 1); c.lineTo(-1, hy); c.stroke(); }
    if (L.beard) { c.fillStyle = L.beard; c.beginPath(); c.ellipse(5, hy + 9, 7, 4, 0, 0, Math.PI); c.fill(); }
  }
}

function drawHairSprite(c, L, dir) {
  const hy = -49, col = L.hair;
  const side = dir === 'left' || dir === 'right';
  c.fillStyle = col;
  switch (L.style) {
    case 'jaret': {
      if (dir === 'up') {
        c.beginPath(); c.moveTo(-13.4, hy + 4); c.bezierCurveTo(-15, hy - 10, -7, hy - 15, 0, hy - 14.6);
        c.bezierCurveTo(7, hy - 15, 15, hy - 10, 13.4, hy + 4); c.quadraticCurveTo(0, hy + 9, -13.4, hy + 4); c.fill();
        c.strokeStyle = L.hairDark; c.lineWidth = 1;
        c.beginPath(); c.moveTo(-6, hy - 9); c.quadraticCurveTo(-4, hy - 2, -6, hy + 4); c.moveTo(4, hy - 10); c.quadraticCurveTo(6, hy - 2, 4, hy + 5); c.stroke();
      } else if (side) {
        c.beginPath(); c.moveTo(-13.2, hy + 4); c.bezierCurveTo(-15, hy - 10, -5, hy - 15.5, 3, hy - 14.5);
        c.bezierCurveTo(10, hy - 14, 15, hy - 9, 14.6, hy - 3.5); c.lineTo(10.5, hy - 5.4); c.lineTo(8.2, hy - 3.2); c.lineTo(5, hy - 6);
        c.lineTo(1, hy - 4); c.lineTo(-1, hy + 2); c.lineTo(-5.5, hy + 5); c.closePath(); c.fill();
      } else {
        c.beginPath(); c.moveTo(-13.6, hy + 3); c.bezierCurveTo(-15, hy - 10, -7, hy - 15.3, 1, hy - 14.8);
        c.bezierCurveTo(10, hy - 14.4, 15.4, hy - 8, 13.6, hy + 3); c.lineTo(12, hy - 2); c.lineTo(8.4, hy - 5.6);
        c.lineTo(5.6, hy - 3); c.lineTo(1.4, hy - 7); c.lineTo(-2.4, hy - 4); c.lineTo(-6.4, hy - 6.6);
        c.lineTo(-9.4, hy - 3); c.lineTo(-12, hy - 2.4); c.closePath(); c.fill();
      }
      c.strokeStyle = L.hairHi; c.lineWidth = 1.3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-6, hy - 11.6); c.quadraticCurveTo(0, hy - 13.6, 6, hy - 11.4); c.stroke();
      break;
    }
    case 'bald': {
      c.beginPath(); c.ellipse(-11.5, hy + 1, 2.4, 4.5, 0, 0, TAU); c.ellipse(11.5, hy + 1, 2.4, 4.5, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-3, hy - 8, 4, 2, -0.4, 0, TAU); c.fill();
      break;
    }
    case 'buzz': {
      c.globalAlpha = 0.85;
      c.beginPath(); c.ellipse(0, hy - 2.5, 13.2, 10.8, 0, Math.PI, TAU); c.fill();
      if (dir === 'up') { c.beginPath(); c.ellipse(0, hy, 13.2, 11, 0, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
      break;
    }
    case 'cap': {
      c.fillStyle = col;
      c.beginPath(); c.ellipse(0, hy + 1, 13.6, 9, 0, Math.PI, TAU); c.fill();
      c.fillStyle = L.cap;
      c.beginPath(); c.ellipse(0, hy - 4, 13.8, 10.5, 0, Math.PI, TAU); c.fill();
      if (dir === 'down') { c.beginPath(); c.ellipse(0, hy - 3.6, 12, 3.2, 0, 0, Math.PI); c.fill(); }
      else if (side) { c.beginPath(); c.ellipse(10, hy - 4, 8, 2.4, 0, 0, TAU); c.fill(); }
      else { c.beginPath(); c.ellipse(0, hy, 13.4, 9, 0, 0, TAU); c.fill(); }
      break;
    }
    case 'curly':
    case 'curlylong': {
      const bumps = dir === 'up' ? [[-9, -4], [-4, -9], [3, -10], [9, -6], [11, 0], [-11, 0], [0, -3], [-6, 3], [6, 3]] : [[-10, -3], [-6, -9], [0, -11], [6, -9], [10, -3], [-12, 2], [12, 2]];
      for (const [bx, by] of bumps) { c.beginPath(); c.arc(bx, hy + by, 5.2, 0, TAU); c.fill(); }
      break;
    }
    default: { // short, long, bun, ponytail
      c.beginPath();
      if (dir === 'up') { c.ellipse(0, hy - 1, 13.6, 12.8, 0, 0, TAU); }
      else if (side) { c.moveTo(-13.4, hy + 3); c.bezierCurveTo(-15, hy - 10, 0, hy - 16, 9, hy - 12); c.quadraticCurveTo(14, hy - 9, 13.6, hy - 3); c.quadraticCurveTo(6, hy - 7, 0, hy - 4); c.quadraticCurveTo(-4, hy + 1, -6, hy + 5); c.closePath(); }
      else { c.moveTo(-13.6, hy + 2); c.bezierCurveTo(-15, hy - 11, 15, hy - 11, 13.6, hy + 2); c.quadraticCurveTo(9, hy - 7, 0, hy - 6.5); c.quadraticCurveTo(-9, hy - 7, -13.6, hy + 2); }
      c.fill();
      if (L.style === 'bun') { c.beginPath(); c.arc(0, hy - 13.5, 5.5, 0, TAU); c.fill(); }
      if (L.style === 'ponytail') {
        if (dir === 'up') { c.beginPath(); c.ellipse(0, hy + 9, 3.6, 7, 0, 0, TAU); c.fill(); }
        else if (side) { c.beginPath(); c.ellipse(-14, hy + 2, 3.5, 8, 0.4, 0, TAU); c.fill(); }
      }
    }
  }
}

/* ---------------- Animals ---------------- */
function drawHusky(c, x, y, facing, anim, moving, sc = 1) {
  c.save();
  c.translate(x, y); c.scale(sc * (facing < 0 ? -1 : 1), sc);
  c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(0, 0, 22, 5, 0, 0, TAU); c.fill();
  const sw = moving ? Math.sin(anim) * 4 : 0;
  const gray = '#6F7888', dark = '#4D5563', white = '#F4F6FA';
  const legAt = (lx, off) => { c.fillStyle = white; rrect(c, lx + off, -13, 4.6, 13, 2); c.fill(); };
  legAt(-15, -sw); legAt(9, sw); legAt(-9, sw); legAt(14, -sw);
  // tail
  const wag = Math.sin(performance.now() / 90) * 0.35;
  c.save(); c.translate(-17, -20); c.rotate(-0.4 + wag);
  c.strokeStyle = gray; c.lineWidth = 6; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-8, -10, 0, -15); c.stroke();
  c.strokeStyle = white; c.lineWidth = 4; c.beginPath(); c.moveTo(-1.5, -13.5); c.lineTo(1, -15.5); c.stroke();
  c.restore();
  // body
  c.fillStyle = gray; c.beginPath(); c.ellipse(0, -18, 19, 9.5, 0, 0, TAU); c.fill();
  c.fillStyle = white; c.beginPath(); c.ellipse(1, -13.5, 15, 5, 0, 0, TAU); c.fill();
  c.fillStyle = dark; c.beginPath(); c.ellipse(-2, -24, 12, 3.6, 0, 0, TAU); c.fill();
  // head
  c.fillStyle = gray; c.beginPath(); c.ellipse(18, -28, 9, 8.2, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(12, -33); c.lineTo(13.5, -43); c.lineTo(18, -35); c.fill();
  c.beginPath(); c.moveTo(18, -35.5); c.lineTo(21.5, -44); c.lineTo(24, -33); c.fill();
  c.fillStyle = '#F2B8C0'; c.beginPath(); c.moveTo(13.8, -34.5); c.lineTo(14.4, -40); c.lineTo(16.6, -35.5); c.fill();
  c.fillStyle = white; c.beginPath(); c.ellipse(21, -25, 7.2, 5, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(26.5, -25.5, 5, 3.4, 0, 0, TAU); c.fill();
  c.fillStyle = '#1A1A22'; c.beginPath(); c.arc(31, -26.6, 2, 0, TAU); c.fill();
  c.beginPath(); c.arc(21.6, -30, 1.6, 0, TAU); c.fill();
  c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(22.1, -30.6, 0.6, 0, TAU); c.fill();
  if (moving || Math.sin(performance.now() / 700) > 0) { c.fillStyle = '#F06A8A'; rrect(c, 25, -23, 3.4, 5, 1.6); c.fill(); }
  // collar
  c.fillStyle = '#13306E'; rrect(c, 11, -24, 5, 8, 2); c.fill();
  c.fillStyle = '#FFC94A'; c.beginPath(); c.arc(14.5, -15.6, 1.8, 0, TAU); c.fill();
  c.restore();
}

function drawGoose(c, x, y, facing, t, swimming) {
  c.save(); c.translate(x, y); c.scale(facing < 0 ? -1 : 1, 1);
  if (!swimming) {
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, 0, 14, 4, 0, 0, TAU); c.fill();
    c.strokeStyle = '#1E1E1E'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-2, -9); c.lineTo(-3, 0); c.moveTo(3, -9); c.lineTo(4, 0); c.stroke();
  } else {
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(0, -4, 16 + Math.sin(t * 2) * 1.5, 3.5, 0, 0, TAU); c.stroke();
  }
  const by = swimming ? -7 : -14;
  c.fillStyle = '#8C7D6A'; c.beginPath(); c.ellipse(0, by, 13, 7.5, -0.1, 0, TAU); c.fill();
  c.fillStyle = '#D9D1C4'; c.beginPath(); c.ellipse(1, by + 3.5, 9, 3.5, 0, 0, TAU); c.fill();
  c.fillStyle = '#5E5246'; c.beginPath(); c.ellipse(-3, by - 2, 8, 3.5, -0.15, 0, TAU); c.fill();
  c.fillStyle = '#1C1C1C'; c.beginPath(); c.moveTo(-14, by - 1); c.lineTo(-19, by - 4); c.lineTo(-13, by + 2); c.fill();
  const bobN = Math.sin(t * 3) * 1.2;
  c.strokeStyle = '#1C1C1C'; c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(8, by - 3); c.quadraticCurveTo(13, by - 10, 11, by - 18 + bobN); c.stroke();
  c.fillStyle = '#1C1C1C'; c.beginPath(); c.ellipse(13, by - 19 + bobN, 4.6, 3.6, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(16.5, by - 20 + bobN); c.lineTo(22, by - 18.6 + bobN); c.lineTo(16.5, by - 17.2 + bobN); c.fill();
  c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(12.4, by - 17.6 + bobN, 2.4, 1.4, 0.3, 0, TAU); c.fill();
  c.restore();
}

function drawSquirrel(c, x, y, facing, t, moving) {
  c.save(); c.translate(x, y); c.scale(facing < 0 ? -1 : 1, 1);
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, 0, 8, 2.6, 0, 0, TAU); c.fill();
  const hop = moving ? -Math.abs(Math.sin(t * 14)) * 4 : 0;
  c.translate(0, hop);
  c.fillStyle = '#8E8A86';
  c.beginPath(); c.moveTo(-4, -4); c.bezierCurveTo(-16, -6, -16, -22, -7, -20); c.bezierCurveTo(-11, -16, -9, -9, -3, -7); c.fill();
  c.fillStyle = '#9C9792'; c.beginPath(); c.ellipse(1, -6, 6, 4.6, -0.3, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(6, -10, 3.6, 3.2, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(4.4, -12.4); c.lineTo(5, -15.4); c.lineTo(6.6, -12.6); c.fill();
  c.fillStyle = '#EDE6DC'; c.beginPath(); c.ellipse(2.5, -4.5, 3, 2.2, 0, 0, TAU); c.fill();
  c.fillStyle = '#141414'; c.beginPath(); c.arc(7.2, -10.6, 0.9, 0, TAU); c.fill();
  c.restore();
}

function drawCow(c, x, y, facing, t) {
  c.save(); c.translate(x, y); c.scale(facing < 0 ? -1 : 1, 1);
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, 0, 24, 5, 0, 0, TAU); c.fill();
  c.fillStyle = '#F4F2EE';
  for (const lx of [-16, -10, 9, 15]) { c.fillRect(lx, -12, 4.4, 12); }
  c.beginPath(); c.ellipse(0, -20, 21, 11, 0, 0, TAU); c.fill();
  c.fillStyle = '#1E1E22';
  c.beginPath(); c.ellipse(-8, -23, 7, 5, 0.3, 0, TAU); c.ellipse(7, -17, 5, 4, -0.2, 0, TAU); c.ellipse(-14, -14, 3, 2.5, 0, 0, TAU); c.fill();
  c.fillStyle = '#F2B8B0'; c.beginPath(); c.ellipse(2, -9.5, 4.5, 2.4, 0, 0, TAU); c.fill();
  const nod = Math.sin(t * 1.3) * 1.5;
  c.fillStyle = '#F4F2EE'; c.beginPath(); c.ellipse(22, -24 + nod, 7.4, 6.4, 0, 0, TAU); c.fill();
  c.fillStyle = '#1E1E22'; c.beginPath(); c.ellipse(19, -26 + nod, 4, 3.4, 0, 0, TAU); c.fill();
  c.fillStyle = '#E9A7A0'; c.beginPath(); c.ellipse(27, -21.5 + nod, 4.4, 3.4, 0, 0, TAU); c.fill();
  c.fillStyle = '#141414'; c.beginPath(); c.arc(23.5, -26.5 + nod, 1.1, 0, TAU); c.fill();
  c.fillStyle = '#D9C9A8'; c.fillRect(18, -33 + nod, 2, 4); c.fillRect(24, -33 + nod, 2, 4);
  c.strokeStyle = '#1E1E22'; c.lineWidth = 2; c.beginPath(); c.moveTo(-21, -22); c.quadraticCurveTo(-26, -16, -24, -9); c.stroke();
  c.restore();
}

/* ---------------- Portraits (square, drawn in 100-unit space) ---------------- */
function drawPortrait(c, S, L, mood = 'neutral', opts = {}) {
  c.save();
  c.scale(S / 100, S / 100);
  if (!opts.noBg) {
    const g = c.createLinearGradient(0, 0, 0, 100);
    g.addColorStop(0, shade(L.bg || '#16306E', 0.12)); g.addColorStop(1, shade(L.bg || '#16306E', -0.25));
    c.fillStyle = g; rrect(c, 0, 0, 100, 100, 12); c.fill();
    c.fillStyle = 'rgba(255,255,255,.06)';
    for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(50, 50, 18 + i * 14, 0, TAU); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.04)'; c.stroke(); }
  }
  // shoulders + shirt
  c.fillStyle = L.shirt;
  c.beginPath(); c.moveTo(10, 101); c.bezierCurveTo(12, 82, 26, 76, 40, 74); c.lineTo(60, 74); c.bezierCurveTo(74, 76, 88, 82, 90, 101); c.closePath(); c.fill();
  c.fillStyle = shade(L.skin, -0.12); c.beginPath(); c.moveTo(42, 64); c.lineTo(58, 64); c.lineTo(58, 76); c.quadraticCurveTo(50, 81, 42, 76); c.fill();
  c.strokeStyle = shade(L.shirt, -0.3); c.lineWidth = 2.4; c.beginPath(); c.moveTo(40, 74.5); c.quadraticCurveTo(50, 82, 60, 74.5); c.stroke();
  if (L.pack) { c.fillStyle = L.pack; c.beginPath(); c.moveTo(22, 101); c.lineTo(27, 79); c.lineTo(33, 77); c.lineTo(30, 101); c.fill(); c.beginPath(); c.moveTo(78, 101); c.lineTo(73, 79); c.lineTo(67, 77); c.lineTo(70, 101); c.fill(); }
  if (L.text) {
    c.fillStyle = '#FFFFFF'; c.font = '400 9.6px ' + FONT.d; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(L.text, 50, 92);
  }
  // hair behind
  if (L.style === 'long' || L.style === 'curlylong' || L.style === 'ponytail') {
    c.fillStyle = shade(L.hair, -0.08);
    if (L.style === 'ponytail') { c.beginPath(); c.ellipse(78, 52, 7, 16, 0.3, 0, TAU); c.fill(); }
    else if (L.style === 'curlylong') { for (const [bx, by] of [[22, 50], [20, 64], [26, 76], [78, 50], [80, 64], [74, 76]]) { c.beginPath(); c.arc(bx, by, 10, 0, TAU); c.fill(); } }
    else { rrect(c, 21, 34, 58, 48, 14); c.fill(); }
  }
  // ears
  c.fillStyle = shade(L.skin, -0.05);
  c.beginPath(); c.ellipse(25.5, 51, 5, 6.5, 0, 0, TAU); c.ellipse(74.5, 51, 5, 6.5, 0, 0, TAU); c.fill();
  c.fillStyle = shade(L.skin, -0.16);
  c.beginPath(); c.ellipse(26, 51, 2.2, 3.4, 0, 0, TAU); c.ellipse(74, 51, 2.2, 3.4, 0, 0, TAU); c.fill();
  // head
  c.fillStyle = L.skin; c.beginPath(); c.ellipse(50, 47, 24.5, 27, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(0,0,0,.05)'; c.beginPath(); c.ellipse(50, 66, 18, 7, 0, 0, Math.PI); c.fill();
  drawPortraitHair(c, L);
  drawFace(c, L, mood);
  if (L.beard) { c.fillStyle = L.beard; c.beginPath(); c.moveTo(30, 58); c.quadraticCurveTo(50, 90, 70, 58); c.quadraticCurveTo(62, 68, 50, 68); c.quadraticCurveTo(38, 68, 30, 58); c.fill(); }
  c.restore();
}

function drawPortraitHair(c, L) {
  c.fillStyle = L.hair;
  switch (L.style) {
    case 'jaret': {
      c.beginPath();
      c.moveTo(25.5, 52); c.bezierCurveTo(19, 30, 31, 15, 50, 15.5); c.bezierCurveTo(70, 15, 82, 29, 74.5, 52);
      c.lineTo(72.5, 43); c.quadraticCurveTo(70, 35, 64, 31.5); c.lineTo(62.5, 36.5); c.quadraticCurveTo(57, 29.5, 49.5, 28.5);
      c.lineTo(48.5, 34); c.quadraticCurveTo(42, 28.5, 35, 31.5); c.lineTo(35.5, 37); c.quadraticCurveTo(30, 37.5, 27.5, 44); c.closePath();
      c.fill();
      c.strokeStyle = L.hairDark; c.lineWidth = 1.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(40, 21); c.quadraticCurveTo(44, 26, 43, 31); c.moveTo(56, 19.5); c.quadraticCurveTo(60, 25, 58.5, 30.5); c.moveTo(68, 24); c.quadraticCurveTo(71, 30, 70, 36); c.stroke();
      c.strokeStyle = L.hairHi; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(36, 22); c.quadraticCurveTo(48, 16.5, 60, 19); c.stroke();
      c.lineWidth = 1.6; c.beginPath(); c.moveTo(62, 22.5); c.quadraticCurveTo(68, 25, 71, 31); c.stroke();
      break;
    }
    case 'bald':
      c.beginPath(); c.ellipse(27, 44, 4, 9, 0.2, 0, TAU); c.ellipse(73, 44, 4, 9, -0.2, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(42, 26, 9, 4, -0.4, 0, TAU); c.fill();
      break;
    case 'buzz':
      c.globalAlpha = 0.9; c.beginPath(); c.moveTo(26, 44); c.bezierCurveTo(24, 16, 76, 16, 74, 44); c.quadraticCurveTo(62, 30, 50, 30); c.quadraticCurveTo(38, 30, 26, 44); c.fill(); c.globalAlpha = 1;
      break;
    case 'cap':
      c.beginPath(); c.moveTo(26, 50); c.quadraticCurveTo(25, 40, 30, 36); c.lineTo(70, 36); c.quadraticCurveTo(75, 40, 74, 50); c.fill();
      c.fillStyle = L.cap; c.beginPath(); c.moveTo(24.5, 38); c.bezierCurveTo(24, 12, 76, 12, 75.5, 38); c.closePath(); c.fill();
      c.beginPath(); c.ellipse(50, 38, 30, 5.5, 0, 0, Math.PI); c.fill();
      c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.arc(50, 17.5, 2.4, 0, TAU); c.fill();
      break;
    case 'curly':
    case 'curlylong':
      for (const [bx, by] of [[28, 36], [34, 25], [44, 19], [56, 19], [66, 25], [72, 36], [38, 30], [62, 30], [50, 26]]) { c.beginPath(); c.arc(bx, by, 9.5, 0, TAU); c.fill(); }
      break;
    default:
      c.beginPath(); c.moveTo(25.5, 50); c.bezierCurveTo(19, 22, 81, 22, 74.5, 50); c.quadraticCurveTo(70, 34, 56, 31); c.quadraticCurveTo(44, 36, 30, 38); c.quadraticCurveTo(27, 42, 25.5, 50); c.fill();
      if (L.style === 'bun') { c.beginPath(); c.arc(50, 15, 9, 0, TAU); c.fill(); }
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 2; c.beginPath(); c.moveTo(38, 25); c.quadraticCurveTo(50, 21, 62, 25); c.stroke();
  }
}

function drawFace(c, L, mood) {
  const ey = 49;
  c.lineCap = 'round';
  // brows
  c.strokeStyle = L.brow; c.lineWidth = 2.6;
  const by = mood === 'surprised' ? 36 : 40;
  const tilt = mood === 'worried' ? -2.5 : mood === 'determined' ? 2.5 : 0;
  c.beginPath(); c.moveTo(34, by + 1); c.quadraticCurveTo(39, by - 2 - tilt * 0.3, 45, by + tilt); c.stroke();
  c.beginPath(); c.moveTo(66, by + 1); c.quadraticCurveTo(61, by - 2 - tilt * 0.3, 55, by + tilt); c.stroke();
  // eyes
  for (const ex of [40, 60]) {
    if (mood === 'grin') {
      c.strokeStyle = '#2A1E18'; c.lineWidth = 2.4; c.beginPath(); c.arc(ex, ey + 2, 4.5, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
      continue;
    }
    const big = mood === 'surprised' ? 1.15 : 1;
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(ex, ey, 5.2 * big, 5.8 * big, 0, 0, TAU); c.fill();
    c.fillStyle = L.eyes; c.beginPath(); c.arc(ex, ey + 0.6, mood === 'surprised' ? 3 : 3.7, 0, TAU); c.fill();
    c.fillStyle = '#121A20'; c.beginPath(); c.arc(ex, ey + 0.8, 1.8, 0, TAU); c.fill();
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(ex + 1.4, ey - 1.2, 1.2, 0, TAU); c.fill();
    if (mood === 'tired') {
      c.fillStyle = L.skin; c.fillRect(ex - 6.5, ey - 7, 13, 6.4);
      c.strokeStyle = '#3A2A20'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ex - 5.2, ey - 0.6); c.lineTo(ex + 5.2, ey - 0.6); c.stroke();
    }
  }
  if (L.glasses) {
    c.strokeStyle = '#1E1E26'; c.lineWidth = 2;
    rrect(c, 31.5, 42, 17, 14, 5); c.stroke(); rrect(c, 51.5, 42, 17, 14, 5); c.stroke();
    c.beginPath(); c.moveTo(48.5, 47); c.lineTo(51.5, 47); c.stroke();
  }
  // nose
  c.strokeStyle = shade(L.skin, -0.25); c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(50, 53); c.quadraticCurveTo(47.5, 58, 50.5, 59); c.stroke();
  // cheeks
  c.fillStyle = 'rgba(255,110,110,.2)';
  c.beginPath(); c.ellipse(33, 60, 5, 3, 0, 0, TAU); c.ellipse(67, 60, 5, 3, 0, 0, TAU); c.fill();
  // mouth
  c.strokeStyle = '#8E3E30'; c.fillStyle = '#8E3E30'; c.lineWidth = 2;
  if (mood === 'happy' || mood === 'grin') {
    c.beginPath(); c.moveTo(41, 63); c.quadraticCurveTo(50, 64.5, 59, 63); c.quadraticCurveTo(57, 72, 50, 72); c.quadraticCurveTo(43, 72, 41, 63); c.fill();
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(42.5, 63.6); c.quadraticCurveTo(50, 65, 57.5, 63.6); c.lineTo(57, 65.6); c.quadraticCurveTo(50, 66.6, 43, 65.6); c.fill();
    c.fillStyle = '#E86A74'; c.beginPath(); c.ellipse(50, 70, 4, 1.8, 0, 0, TAU); c.fill();
  } else if (mood === 'surprised') {
    c.beginPath(); c.ellipse(50, 66, 3.6, 4.4, 0, 0, TAU); c.fill();
  } else if (mood === 'tired') {
    c.beginPath(); c.moveTo(44, 66); c.quadraticCurveTo(47, 64.5, 50, 66); c.quadraticCurveTo(53, 67.5, 56, 66); c.stroke();
  } else if (mood === 'worried') {
    c.beginPath(); c.arc(50, 70, 5.5, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
  } else {
    c.beginPath(); c.arc(50, 61, 7, 0.22 * Math.PI, 0.78 * Math.PI); c.stroke();
  }
}

function drawHuskyPortrait(c, S, mood, noBg) {
  c.save(); c.scale(S / 100, S / 100);
  if (!noBg) {
    const g = c.createLinearGradient(0, 0, 0, 100); g.addColorStop(0, '#2A4C9A'); g.addColorStop(1, '#0E2258');
    c.fillStyle = g; rrect(c, 0, 0, 100, 100, 12); c.fill();
  }
  const gray = '#6F7888', white = '#F4F6FA';
  c.fillStyle = gray;
  c.beginPath(); c.moveTo(22, 40); c.lineTo(26, 8); c.lineTo(44, 28); c.fill();
  c.beginPath(); c.moveTo(78, 40); c.lineTo(74, 8); c.lineTo(56, 28); c.fill();
  c.fillStyle = '#F2B8C0';
  c.beginPath(); c.moveTo(27, 34); c.lineTo(29, 16); c.lineTo(39, 28); c.fill();
  c.beginPath(); c.moveTo(73, 34); c.lineTo(71, 16); c.lineTo(61, 28); c.fill();
  c.fillStyle = gray; c.beginPath(); c.ellipse(50, 52, 32, 30, 0, 0, TAU); c.fill();
  c.fillStyle = white;
  c.beginPath(); c.moveTo(50, 30); c.bezierCurveTo(40, 40, 26, 44, 24, 60); c.bezierCurveTo(26, 80, 74, 80, 76, 60); c.bezierCurveTo(74, 44, 60, 40, 50, 30); c.fill();
  c.beginPath(); c.ellipse(36, 42, 7, 4, -0.3, 0, TAU); c.ellipse(64, 42, 7, 4, 0.3, 0, TAU); c.fill();
  c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(50, 66, 14, 10, 0, 0, TAU); c.fill();
  for (const ex of [38, 62]) {
    if (mood === 'grin') { c.strokeStyle = '#1A1A22'; c.lineWidth = 2.6; c.beginPath(); c.arc(ex, 52, 4.5, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke(); continue; }
    c.fillStyle = '#5B3A1E'; c.beginPath(); c.arc(ex, 51, 4.6, 0, TAU); c.fill();
    c.fillStyle = '#121212'; c.beginPath(); c.arc(ex, 51, 2.4, 0, TAU); c.fill();
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(ex + 1.5, 49.5, 1.3, 0, TAU); c.fill();
  }
  c.fillStyle = '#1A1A22'; c.beginPath(); c.ellipse(50, 61, 6, 4.2, 0, 0, TAU); c.fill();
  c.strokeStyle = '#1A1A22'; c.lineWidth = 2; c.lineCap = 'round';
  c.beginPath(); c.moveTo(50, 65); c.lineTo(50, 69); c.quadraticCurveTo(45, 73, 41, 70); c.moveTo(50, 69); c.quadraticCurveTo(55, 73, 59, 70); c.stroke();
  c.fillStyle = '#F06A8A'; c.beginPath(); c.moveTo(46, 71); c.quadraticCurveTo(50, 84, 54, 71); c.fill();
  c.fillStyle = '#13306E'; c.fillRect(28, 82, 44, 8);
  c.fillStyle = '#FFC94A'; c.beginPath(); c.arc(50, 93, 4.5, 0, TAU); c.fill();
  c.restore();
}

function drawGoosePortrait(c, S) {
  c.save(); c.scale(S / 100, S / 100);
  const g = c.createLinearGradient(0, 0, 0, 100); g.addColorStop(0, '#5BA6C9'); g.addColorStop(1, '#2C6E8E');
  c.fillStyle = g; rrect(c, 0, 0, 100, 100, 12); c.fill();
  c.fillStyle = '#8C7D6A'; c.beginPath(); c.ellipse(40, 100, 40, 22, 0, 0, TAU); c.fill();
  c.strokeStyle = '#1C1C1C'; c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.moveTo(42, 92); c.quadraticCurveTo(36, 60, 50, 40); c.stroke();
  c.fillStyle = '#1C1C1C'; c.beginPath(); c.ellipse(56, 34, 16, 12, -0.2, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(68, 30); c.lineTo(90, 36); c.lineTo(68, 42); c.fill();
  c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(52, 42, 9, 5, 0.4, 0, TAU); c.fill();
  c.fillStyle = '#FF5A3A'; c.beginPath(); c.arc(60, 30, 3, 0, TAU); c.fill();
  c.fillStyle = '#121212'; c.beginPath(); c.arc(60.5, 30, 1.6, 0, TAU); c.fill();
  c.strokeStyle = '#1C1C1C'; c.lineWidth = 3; c.beginPath(); c.moveTo(52, 22); c.lineTo(64, 26); c.stroke();
  c.restore();
}

function drawSquirrelPortrait(c, S) {
  c.save(); c.scale(S / 100, S / 100);
  const g = c.createLinearGradient(0, 0, 0, 100); g.addColorStop(0, '#5E9A4A'); g.addColorStop(1, '#2F5E2A');
  c.fillStyle = g; rrect(c, 0, 0, 100, 100, 12); c.fill();
  c.fillStyle = '#8E8A86';
  c.beginPath(); c.moveTo(70, 100); c.bezierCurveTo(110, 80, 100, 20, 76, 18); c.bezierCurveTo(92, 40, 86, 70, 62, 84); c.fill();
  c.fillStyle = '#9C9792'; c.beginPath(); c.ellipse(46, 80, 24, 22, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(46, 48, 22, 19, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(30, 36); c.lineTo(30, 18); c.lineTo(40, 32); c.fill(); c.beginPath(); c.moveTo(62, 36); c.lineTo(62, 18); c.lineTo(52, 32); c.fill();
  c.fillStyle = '#EDE6DC'; c.beginPath(); c.ellipse(46, 58, 12, 9, 0, 0, TAU); c.ellipse(46, 86, 13, 12, 0, 0, TAU); c.fill();
  c.fillStyle = '#121212'; c.beginPath(); c.arc(37, 45, 4.4, 0, TAU); c.arc(55, 45, 4.4, 0, TAU); c.fill();
  c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(38.5, 43.5, 1.4, 0, TAU); c.arc(56.5, 43.5, 1.4, 0, TAU); c.fill();
  c.fillStyle = '#3A2A2A'; c.beginPath(); c.ellipse(46, 54, 3, 2.2, 0, 0, TAU); c.fill();
  c.fillStyle = '#D9A050'; c.beginPath(); c.ellipse(46, 70, 7, 9, 0, 0, TAU); c.fill();
  c.strokeStyle = '#8A5A20'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(42, 66); c.lineTo(50, 66); c.moveTo(42, 72); c.lineTo(50, 72); c.stroke();
  c.restore();
}

function drawPhonePortrait(c, S) {
  c.save(); c.scale(S / 100, S / 100);
  c.fillStyle = '#E8EEF9'; rrect(c, 0, 0, 100, 100, 12); c.fill();
  c.fillStyle = '#0B1F4B'; rrect(c, 30, 12, 40, 76, 8); c.fill();
  c.fillStyle = '#4FA3D9'; rrect(c, 34, 20, 32, 58, 3); c.fill();
  c.fillStyle = '#FFFFFF'; rrect(c, 38, 28, 24, 9, 4); c.fill(); rrect(c, 38, 42, 18, 9, 4); c.fill();
  c.fillStyle = '#FFC94A'; rrect(c, 44, 56, 18, 9, 4); c.fill();
  c.restore();
}

/* ---------------- Item icons (centered at x,y; s ≈ diameter) ---------------- */
function drawIcon(c, kind, x, y, s, t = 0) {
  c.save(); c.translate(x, y); c.scale(s / 40, s / 40);
  const F = col => { c.fillStyle = col; };
  switch (kind) {
    case 'pancakes':
      for (let i = 0; i < 3; i++) { F('#B9773A'); c.beginPath(); c.ellipse(0, 8 - i * 6, 17, 6, 0, 0, TAU); c.fill(); F('#E6A75A'); c.beginPath(); c.ellipse(0, 6 - i * 6, 16, 5, 0, 0, TAU); c.fill(); }
      F('#FFE27A'); c.fillRect(-4, -12, 8, 5); F('#8A4A1A'); c.beginPath(); c.moveTo(-10, -6); c.quadraticCurveTo(-12, 6, -9, 8); c.lineTo(-7, -5); c.fill(); break;
    case 'waffle':
    case 'golden':
      F(kind === 'golden' ? '#FFC94A' : '#D9993E'); rrect(c, -16, -16, 32, 32, 6); c.fill();
      c.strokeStyle = kind === 'golden' ? '#E59A00' : '#A86A22'; c.lineWidth = 2.2;
      for (let i = -8; i <= 8; i += 8) { c.beginPath(); c.moveTo(i, -14); c.lineTo(i, 14); c.moveTo(-14, i); c.lineTo(14, i); c.stroke(); }
      if (kind === 'golden') { F('#FFFFFF'); star(c, 13, -13, 6 + Math.sin(t * 8) * 1.5, 2.4); star(c, -14, 12, 4, 1.6); } break;
    case 'egg':
      F('#FFFFFF'); c.beginPath(); c.moveTo(-16, 2); c.bezierCurveTo(-18, -14, 4, -18, 14, -8); c.bezierCurveTo(20, 4, 10, 16, -2, 14); c.bezierCurveTo(-12, 14, -15, 10, -16, 2); c.fill();
      F('#FFB21E'); c.beginPath(); c.arc(-1, -1, 7, 0, TAU); c.fill(); F('rgba(255,255,255,.6)'); c.beginPath(); c.arc(-3, -3, 2, 0, TAU); c.fill(); break;
    case 'bacon':
      c.lineCap = 'round'; c.strokeStyle = '#B5422E'; c.lineWidth = 10;
      c.beginPath(); c.moveTo(-16, 6); c.bezierCurveTo(-8, -10, 0, 14, 8, -4); c.quadraticCurveTo(12, -10, 16, -6); c.stroke();
      c.strokeStyle = '#F2B49A'; c.lineWidth = 3; c.stroke(); break;
    case 'banana':
      F('#F6D433'); c.beginPath(); c.moveTo(-16, -8); c.quadraticCurveTo(-6, 16, 16, 6); c.quadraticCurveTo(2, 8, -12, -12); c.fill();
      F('#6B4A1A'); c.fillRect(-17, -13, 4, 5); break;
    case 'oj':
      F('rgba(255,255,255,.75)'); c.beginPath(); c.moveTo(-11, -16); c.lineTo(11, -16); c.lineTo(8, 17); c.lineTo(-8, 17); c.fill();
      F('#FF9A1F'); c.beginPath(); c.moveTo(-10, -9); c.lineTo(10, -9); c.lineTo(7.6, 15); c.lineTo(-7.6, 15); c.fill();
      F('#FFC94A'); c.beginPath(); c.arc(9, -16, 6, 0, TAU); c.fill(); break;
    case 'muffin':
      F('#4FA3D9'); c.beginPath(); c.moveTo(-12, 0); c.lineTo(12, 0); c.lineTo(9, 16); c.lineTo(-9, 16); c.fill();
      F('#7A4A2A'); c.beginPath(); c.ellipse(0, -2, 16, 12, 0, Math.PI, TAU); c.fill(); c.beginPath(); c.ellipse(0, 0, 16, 4, 0, 0, TAU); c.fill();
      F('#3A1E10'); for (const [a, b] of [[-6, -6], [3, -10], [7, -3], [-1, -2]]) { c.beginPath(); c.arc(a, b, 1.8, 0, TAU); c.fill(); } break;
    case 'pizza':
      F('#D9993E'); c.beginPath(); c.moveTo(-15, -14); c.quadraticCurveTo(0, -20, 15, -14); c.lineTo(0, 18); c.closePath(); c.fill();
      F('#FFD35A'); c.beginPath(); c.moveTo(-12, -10); c.lineTo(12, -10); c.lineTo(0, 15); c.closePath(); c.fill();
      F('#C8352A'); for (const [a, b] of [[-4, -5], [4, -4], [0, 4]]) { c.beginPath(); c.arc(a, b, 3, 0, TAU); c.fill(); } break;
    case 'burger':
      F('#D9993E'); c.beginPath(); c.ellipse(0, -5, 17, 11, 0, Math.PI, TAU); c.fill();
      F('#5BBF4A'); c.fillRect(-17, -5, 34, 4); F('#FFC233'); c.beginPath(); c.moveTo(-16, -1); c.lineTo(16, -1); c.lineTo(10, 4); c.lineTo(-12, 3); c.fill();
      F('#6B3A22'); rrect(c, -16, 1, 32, 7, 3); c.fill(); F('#D9993E'); rrect(c, -16, 8, 32, 7, 4); c.fill();
      F('#FFF2C8'); for (const [a, b] of [[-6, -10], [2, -12], [8, -9]]) { c.beginPath(); c.ellipse(a, b, 1.6, 1, 0.4, 0, TAU); c.fill(); } break;
    case 'taco':
      F('#F2C14E'); c.beginPath(); c.arc(0, 8, 17, Math.PI, TAU); c.fill();
      F('#5BBF4A'); c.beginPath(); c.arc(0, 6, 13, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(0, 6); c.fill();
      F('#C8352A'); c.beginPath(); c.arc(-5, -2, 2.6, 0, TAU); c.arc(4, -3, 2.6, 0, TAU); c.fill(); break;
    case 'apple':
      F('#D7263D'); c.beginPath(); c.arc(-5, 3, 12, 0, TAU); c.arc(5, 3, 12, 0, TAU); c.fill();
      F('#6B4A1A'); c.fillRect(-1, -14, 3, 7); F('#4CAF50'); c.beginPath(); c.ellipse(6, -12, 6, 3, -0.5, 0, TAU); c.fill();
      F('rgba(255,255,255,.35)'); c.beginPath(); c.ellipse(-8, -3, 3, 5, 0.3, 0, TAU); c.fill(); break;
    case 'cookie':
      F('#C9893E'); c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fill();
      F('#4A2A16'); for (const [a, b] of [[-6, -6], [5, -8], [8, 3], [-3, 6], [-9, 2], [2, -1]]) { c.beginPath(); c.arc(a, b, 2.3, 0, TAU); c.fill(); } break;
    case 'salad':
      F('#4CAF50'); for (const [a, b] of [[-8, -4], [0, -8], [8, -4], [-3, 0], [5, 0]]) { c.beginPath(); c.arc(a, b, 7, 0, TAU); c.fill(); }
      F('#E8483C'); c.beginPath(); c.arc(-4, -6, 3, 0, TAU); c.arc(6, -7, 3, 0, TAU); c.fill();
      F('#FFFFFF'); c.beginPath(); c.moveTo(-17, 0); c.lineTo(17, 0); c.quadraticCurveTo(14, 16, 0, 16); c.quadraticCurveTo(-14, 16, -17, 0); c.fill(); break;
    case 'toast':
      F('#2A1E18'); c.beginPath(); c.moveTo(-14, 16); c.lineTo(-14, -6); c.quadraticCurveTo(-18, -18, -4, -17); c.quadraticCurveTo(0, -20, 4, -17); c.quadraticCurveTo(18, -18, 14, -6); c.lineTo(14, 16); c.closePath(); c.fill();
      F('#4A3A30'); c.fillRect(-9, -8, 18, 18);
      c.strokeStyle = 'rgba(160,160,170,.8)'; c.lineWidth = 2.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-5, -22); c.quadraticCurveTo(-9, -27, -5, -31); c.moveTo(5, -22); c.quadraticCurveTo(1, -27, 5, -31); c.stroke(); break;
    case 'mystery':
      F('#8FA35A'); c.beginPath(); c.moveTo(-16, 8); c.bezierCurveTo(-18, -10, -4, -16, 2, -10); c.bezierCurveTo(10, -18, 20, -6, 16, 6); c.bezierCurveTo(12, 16, -12, 18, -16, 8); c.fill();
      F('#6E8240'); c.beginPath(); c.arc(-4, 2, 4, 0, TAU); c.arc(7, -2, 3, 0, TAU); c.fill();
      F('#2A2A2A'); c.font = '700 16px ' + FONT.b; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 1, 4);
      c.strokeStyle = 'rgba(120,150,60,.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-10, -18); c.quadraticCurveTo(-14, -24, -10, -28); c.moveTo(10, -18); c.quadraticCurveTo(6, -24, 10, -28); c.stroke(); break;
    case 'coffee':
      F('#FFFFFF'); c.beginPath(); c.moveTo(-12, -8); c.lineTo(12, -8); c.lineTo(9, 16); c.lineTo(-9, 16); c.fill();
      F('#13306E'); c.fillRect(-11, -1, 22, 8);
      F('#6B3A22'); c.beginPath(); c.ellipse(0, -8, 12, 3, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-4, -13); c.quadraticCurveTo(-8, -18, -4, -23); c.moveTo(4, -13); c.quadraticCurveTo(0, -18, 4, -23); c.stroke(); break;
    case 'cone':
      F('#D9993E'); c.beginPath(); c.moveTo(-10, -2); c.lineTo(10, -2); c.lineTo(0, 20); c.closePath(); c.fill();
      F('#F7E7C6'); c.beginPath(); c.arc(0, -8, 11, 0, TAU); c.fill(); F('#FF9EB5'); c.beginPath(); c.arc(0, -14, 8, 0, TAU); c.fill(); break;
    case 'tshirt':
      F('#13306E'); c.beginPath(); c.moveTo(-8, -15); c.lineTo(-18, -9); c.lineTo(-14, -1); c.lineTo(-10, -4); c.lineTo(-10, 16); c.lineTo(10, 16); c.lineTo(10, -4); c.lineTo(14, -1); c.lineTo(18, -9); c.lineTo(8, -15); c.quadraticCurveTo(0, -9, -8, -15); c.fill();
      F('#FFFFFF'); c.font = '400 9px ' + FONT.d; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('UC', 0, 3); break;
    case 'sticker':
      F('#FFFFFF'); c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fill(); F('#13306E'); c.beginPath(); c.arc(0, 0, 13.5, 0, TAU); c.fill();
      F('#FFFFFF'); c.beginPath(); c.ellipse(0, 4, 5.5, 4.5, 0, 0, TAU); c.ellipse(-7, -1, 2.2, 2.8, 0, 0, TAU); c.ellipse(-3, -6, 2.2, 2.8, 0, 0, TAU); c.ellipse(3, -6, 2.2, 2.8, 0, 0, TAU); c.ellipse(7, -1, 2.2, 2.8, 0, 0, TAU); c.fill(); break;
    case 'bottle':
      F('#13306E'); rrect(c, -8, -10, 16, 27, 5); c.fill(); F('#C8C8D0'); rrect(c, -5, -17, 10, 8, 2); c.fill();
      F('#FFFFFF'); c.fillRect(-8, 0, 16, 5); break;
    case 'lanyard':
      c.strokeStyle = '#13306E'; c.lineWidth = 5; c.beginPath(); c.moveTo(-10, -16); c.lineTo(0, 6); c.lineTo(10, -16); c.stroke();
      F('#E8EEF9'); rrect(c, -9, 4, 18, 13, 2); c.fill(); F('#C8102E'); c.fillRect(-9, 4, 18, 4); break;
    case 'finger':
      F('#FFC94A'); rrect(c, -12, -2, 24, 18, 6); c.fill(); rrect(c, -5, -19, 10, 20, 5); c.fill();
      F('#13306E'); c.font = '400 9px ' + FONT.d; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('#1', 0, 8); break;
    case 'hoodie':
      F('#FFC94A'); c.beginPath(); c.moveTo(-8, -12); c.quadraticCurveTo(0, -22, 8, -12); c.lineTo(18, -6); c.lineTo(15, 8); c.lineTo(11, 6); c.lineTo(11, 17); c.lineTo(-11, 17); c.lineTo(-11, 6); c.lineTo(-15, 8); c.lineTo(-18, -6); c.closePath(); c.fill();
      F('#E59A00'); c.beginPath(); c.arc(0, -10, 5, 0, Math.PI); c.fill(); F('#FFFFFF'); star(c, 12, -16, 5 + Math.sin(t * 8), 2); break;
    case 'clipboard':
      F('#A86A3A'); rrect(c, -13, -16, 26, 33, 3); c.fill(); F('#FFFFFF'); c.fillRect(-10, -11, 20, 25); F('#9AA0AC'); c.fillRect(-5, -19, 10, 6);
      F('#C8102E'); c.font = '700 7px ' + FONT.c; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('5 AM', 0, -4); c.fillText('CREW', 0, 4);
      F('#9AA0AC'); c.fillRect(-7, 9, 14, 1.5); break;
    case 'brain':
      F('#F59AB8'); for (const [a, b, r] of [[-7, -4, 9], [6, -5, 9], [-2, 5, 9], [9, 5, 7], [-10, 6, 6]]) { c.beginPath(); c.arc(a, b, r, 0, TAU); c.fill(); }
      c.strokeStyle = '#C8577E'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(0, -12); c.quadraticCurveTo(-3, 0, 1, 12); c.moveTo(-10, -3); c.quadraticCurveTo(-5, 0, -8, 5); c.moveTo(9, -3); c.quadraticCurveTo(5, 1, 9, 6); c.stroke(); break;
    case 'book':
      F('#2B6CB0'); rrect(c, -15, -14, 30, 28, 3); c.fill(); F('#FFFFFF'); c.fillRect(-12, 8, 26, 4); F('#FFC94A'); c.fillRect(-7, -8, 16, 4); break;
    case 'pencil':
      c.save(); c.rotate(-0.7); F('#FFC233'); c.fillRect(-4, -16, 8, 26); F('#F2B8C0'); c.fillRect(-4, -20, 8, 5); F('#F4D9B0'); c.beginPath(); c.moveTo(-4, 10); c.lineTo(4, 10); c.lineTo(0, 18); c.fill(); F('#333'); c.beginPath(); c.moveTo(-1.5, 15); c.lineTo(1.5, 15); c.lineTo(0, 18); c.fill(); c.restore(); break;
    case 'paw':
      F('#13306E'); c.beginPath(); c.ellipse(0, 5, 9, 7.5, 0, 0, TAU); c.ellipse(-11, -3, 3.8, 4.8, -0.3, 0, TAU); c.ellipse(-5, -11, 3.8, 4.8, 0, 0, TAU); c.ellipse(5, -11, 3.8, 4.8, 0, 0, TAU); c.ellipse(11, -3, 3.8, 4.8, 0.3, 0, TAU); c.fill(); break;
    case 'atom':
      c.strokeStyle = '#13A39A'; c.lineWidth = 2.4;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(0, 0, 16, 6, i * Math.PI / 3, 0, TAU); c.stroke(); }
      F('#C8102E'); c.beginPath(); c.arc(0, 0, 3.6, 0, TAU); c.fill(); break;
    case 'bulb':
      F('#FFD84A'); c.beginPath(); c.arc(0, -4, 12, 0, TAU); c.fill(); c.fillRect(-6, 4, 12, 6); F('#9AA0AC'); rrect(c, -6, 9, 12, 8, 2); c.fill();
      c.strokeStyle = '#E59A00'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-3, 4); c.lineTo(-3, -4); c.lineTo(3, -4); c.lineTo(3, 4); c.stroke(); break;
    case 'calc':
      F('#3A3F4E'); rrect(c, -13, -16, 26, 33, 4); c.fill(); F('#B9E3C6'); c.fillRect(-9, -12, 18, 8);
      F('#E8EEF9'); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { c.fillRect(-9 + i * 7, 0 + j * 5.4, 4.6, 3.6); } break;
    case 'flag':
      F('#C8102E'); c.beginPath(); c.moveTo(-10, -16); c.lineTo(14, -9); c.lineTo(-10, -2); c.fill(); F('#5A5A66'); c.fillRect(-12, -18, 3, 36); break;
    default:
      F('#FFFFFF'); c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.fill();
  }
  c.restore();
}

function star(c, x, y, r, r2) {
  c.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r2 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath(); c.fill();
}
