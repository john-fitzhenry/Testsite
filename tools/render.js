#!/usr/bin/env node
/* Offline renderer for reel/showreel.js.
 *
 *   node tools/render.js video  [--samples 8] [--shutter 0.5] [--workers 3] [--out media/showreel.mp4]
 *   node tools/render.js stills --beats 1,4.2,9.5 [--samples 8] [--dir media/stills]
 *
 * Each worker is its own headless Chromium. Frames are produced by calling
 * REEL.renderFrame(i, samples, shutter) — which averages `samples` sub-frames
 * for real motion blur — and read back losslessly as PNG. ffmpeg then adds
 * film grain, muxes media/soundtrack.wav and encodes H.264.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync, execSync } = require('child_process');

function loadPlaywright() {
  try { return require('playwright'); } catch {}
  try { return require('playwright-core'); } catch {}
  const root = execSync('npm root -g').toString().trim();
  return require(path.join(root, 'playwright'));
}
const { chromium } = loadPlaywright();

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const mode = args[0] || 'video';
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };
const SAMPLES = +opt('samples', 8);
const SHUTTER = +opt('shutter', 0.5);
const WORKERS = +opt('workers', Math.max(1, Math.min(4, os.cpus().length - 1)));

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.m4a': 'audio/mp4', '.wav': 'audio/wav' };
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function openPage(port) {
  const browser = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('page error:', e.message); process.exitCode = 1; });
  await page.goto(`http://127.0.0.1:${port}/reel/index.html?render=1`);
  await page.waitForFunction(() => window.REEL);
  await page.evaluate(() => window.REEL.ready);
  return { browser, page };
}
async function grab(page, fn, a) {
  const url = await page.evaluate(([fnSrc, a]) => {
    // eslint-disable-next-line no-new-func
    new Function('REEL', 'a', fnSrc)(window.REEL, a);
    return document.getElementById('reel').toDataURL('image/png');
  }, [fn, a]);
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
}

async function stills(port) {
  const dir = path.resolve(ROOT, opt('dir', 'media/stills'));
  fs.mkdirSync(dir, { recursive: true });
  const beats = opt('beats', '1,5.4,9.5,13.3,18.4,21.5,25.2,31.5').split(',').map(Number);
  const { browser, page } = await openPage(port);
  const BEAT = 60 / 128;
  for (const b of beats) {
    const png = await grab(page, 'REEL.renderTime(a.t, a.s, a.sh)', { t: b * BEAT, s: SAMPLES, sh: SHUTTER });
    const f = path.join(dir, `b${b.toFixed(3).padStart(7, '0')}.png`);
    fs.writeFileSync(f, png);
    console.log('wrote', path.relative(ROOT, f));
  }
  await browser.close();
}

async function video(port) {
  const out = path.resolve(ROOT, opt('out', 'media/showreel.mp4'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-frames-'));
  const probe = await openPage(port);
  const FRAMES = +opt('frames', await probe.page.evaluate(() => window.REEL.FRAMES));
  await probe.browser.close();
  console.log(`rendering ${FRAMES} frames · ${SAMPLES} samples · shutter ${SHUTTER} · ${WORKERS} workers → ${tmp}`);
  const t0 = Date.now();
  let done = 0, next = 0;
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    const { browser, page } = await openPage(port);
    while (true) {
      const i = next++;
      if (i >= FRAMES) break;
      const png = await grab(page, 'REEL.renderFrame(a.i, a.s, a.sh)', { i, s: SAMPLES, sh: SHUTTER });
      fs.writeFileSync(path.join(tmp, `f${String(i).padStart(5, '0')}.png`), png);
      if (++done % 30 === 0 || done === FRAMES) {
        const el = (Date.now() - t0) / 1000;
        process.stdout.write(`  ${done}/${FRAMES}  ${el.toFixed(0)}s  eta ${((el / done) * (FRAMES - done)).toFixed(0)}s\n`);
      }
    }
    await browser.close();
  }));
  const wav = path.join(ROOT, 'media/soundtrack.wav');
  const ff = ['-y', '-framerate', '60', '-i', path.join(tmp, 'f%05d.png')];
  if (fs.existsSync(wav)) ff.push('-i', wav);
  ff.push('-vf', `format=yuv420p,noise=c0s=${opt('grain', '6')}:c0f=t`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', opt('crf', '21'), '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart');
  if (fs.existsSync(wav)) ff.push('-c:a', 'aac', '-b:a', '256k', '-shortest');
  ff.push(out);
  console.log('ffmpeg', ff.join(' '));
  const r = spawnSync('ffmpeg', ff, { stdio: ['ignore', 'ignore', 'inherit'] });
  if (r.status !== 0) throw new Error('ffmpeg failed');
  if (!args.includes('--keep')) fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s → ${path.relative(ROOT, out)}`);
}

(async () => {
  const srv = await serve();
  const port = srv.address().port;
  try { await (mode === 'stills' ? stills(port) : video(port)); }
  finally { srv.close(); }
})().catch(e => { console.error(e); process.exit(1); });
