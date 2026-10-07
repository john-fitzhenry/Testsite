#!/usr/bin/env python3
"""Synthesise the reel's soundtrack from scratch — no samples.

128 BPM, 32 beats = 15 s. Every hit is placed on the same beat timeline as
reel/showreel.js, so the ball's bounces, the letter landings, the tile clicks
and the montage cuts are all sample-accurately in sync with the picture.

    python3 tools/soundtrack.py            # → media/soundtrack.wav (+ .m4a)
"""
import os
import subprocess
import wave

import numpy as np
from scipy import signal

SR = 48000
BPM = 128
BEAT = 60 / BPM
DUR = 32 * BEAT
N = int(round(DUR * SR))
PAD = SR * 4
rng = np.random.default_rng(2026)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def s(b):  # beats → seconds
    return b * BEAT


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(n):
    return np.arange(n) / SR


def ns(dur):
    return int(dur * SR)


# ------------------------------------------------------------------ buses
class Bus:
    def __init__(self):
        self.x = np.zeros((2, N + PAD))

    def add(self, sig, t0, pan=0.0, gain=1.0):
        if sig.ndim == 1:
            a = (pan + 1) * np.pi / 4
            sig = np.vstack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
        i0 = int(round(t0 * SR))
        if i0 < 0:
            sig, i0 = sig[:, -i0:], 0
        n = min(sig.shape[1], self.x.shape[1] - i0)
        if n > 0:
            self.x[:, i0:i0 + n] += sig[:, :n] * gain


drums, music, fx, verb = Bus(), Bus(), Bus(), Bus()


def send(sig, t0, pan=0.0, gain=1.0, wet=0.3, bus=None):
    (bus or fx).add(sig, t0, pan, gain)
    if wet:
        verb.add(sig, t0, pan, gain * wet)


# -------------------------------------------------------------- dsp utils
def sos(kind, f, order=2):
    return signal.butter(order, f, btype=kind, fs=SR, output='sos')


def lp(x, f, order=2):
    return signal.sosfilt(sos('lowpass', f, order), x)


def hp(x, f, order=2):
    return signal.sosfilt(sos('highpass', f, order), x)


def bp(x, f1, f2, order=2):
    return signal.sosfilt(sos('bandpass', [f1, f2], order), x)


def saw(f, n, phase=None):
    """PolyBLEP band-limited sawtooth; f may be scalar or per-sample array."""
    f = np.broadcast_to(np.asarray(f, float), (n,))
    dt = f / SR
    p = np.cumsum(dt) + (rng.random() if phase is None else phase)
    p -= np.floor(p)
    y = 2 * p - 1
    m1 = p < dt
    t1 = p[m1] / dt[m1]
    y[m1] -= t1 + t1 - t1 * t1 - 1
    m2 = p > 1 - dt
    t2 = (p[m2] - 1) / dt[m2]
    y[m2] -= t2 * t2 + t2 + t2 + 1
    return y


def sine(f, n, phase=0.0):
    f = np.broadcast_to(np.asarray(f, float), (n,))
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def attack(n, a=0.002):
    return np.minimum(1, tt(n) / max(a, 1e-6))


def svf(x, fc, q=0.707, mode='lp'):
    """Zavalishin TPT state-variable filter with per-sample cutoff."""
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    g = np.tan(np.pi * np.clip(fc, 20, SR * 0.45) / SR)
    k = 1 / q
    a1 = 1 / (1 + g * (g + k))
    a2 = g * a1
    a3 = g * a2
    ic1 = ic2 = 0.0
    out = np.empty_like(x)
    xs, A1, A2, A3 = x.tolist(), a1.tolist(), a2.tolist(), a3.tolist()
    bpm = mode == 'bp'
    for i in range(len(xs)):
        v3 = xs[i] - ic2
        v1 = A1[i] * ic1 + A2[i] * v3
        v2 = ic2 + A2[i] * ic1 + A3[i] * v3
        ic1 = 2 * v1 - ic1
        ic2 = 2 * v2 - ic2
        out[i] = v1 if bpm else v2
    return out


def stft_shape(x, gain_fn, nper=1024):
    """Time-varying spectral filter: gain_fn(freqs[:,None], times[None,:])."""
    f, t, Z = signal.stft(x, SR, nperseg=nper, noverlap=nper * 3 // 4, boundary='even')
    _, y = signal.istft(Z * gain_fn(f[:, None], t[None, :]), SR, nperseg=nper, noverlap=nper * 3 // 4)
    y = y[:len(x)]
    return np.pad(y, (0, len(x) - len(y)))


def norm(x, peak=1.0):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


# ------------------------------------------------------------- instruments
def kick(punch=1.0, dur=0.55, low=46):
    n = ns(dur)
    t = tt(n)
    f = low + 135 * np.exp(-t * 38) + 38 * np.exp(-t * 8)
    body = sine(f, n) * np.exp(-t * 6.2) * attack(n, 0.0008)
    click = hp(rng.standard_normal(n), 2500) * np.exp(-t * 320) * 0.35 * punch
    return np.tanh(1.7 * (body + click)) * 0.95


def clap():
    n = ns(0.4)
    t = tt(n)
    noise = bp(rng.standard_normal(n), 900, 3200)
    env = np.zeros(n)
    for ti in (0, 0.010, 0.021):
        env += np.where(t >= ti, np.exp(-(t - ti) / 0.0045), 0)
    env += np.where(t >= 0.03, np.exp(-(t - 0.03) / 0.085), 0) * 0.85
    return np.tanh(noise * env * 1.4) * 0.6


def snare(gain=1.0):
    n = ns(0.3)
    t = tt(n)
    body = sine(185 + 60 * np.exp(-t * 60), n) * np.exp(-t * 28)
    nz = bp(rng.standard_normal(n), 1400, 7000) * np.exp(-t * 16)
    return (body * 0.6 + nz * 0.7) * gain


def hat(open_=False, gain=1.0):
    n = ns(0.35 if open_ else 0.08)
    t = tt(n)
    x = hp(rng.standard_normal(n), 7500, 4)
    return x * np.exp(-t / (0.11 if open_ else 0.018)) * gain * 0.5


def crash(dur=2.6, gain=1.0):
    n = ns(dur)
    t = tt(n)
    out = np.vstack([hp(rng.standard_normal(n), 3800, 2) for _ in range(2)])
    env = np.exp(-t / 0.75) * attack(n, 0.001) + 0.6 * np.exp(-t / 0.05)
    return out * env * gain * 0.45


def boom(dur=3.0):
    n = ns(dur)
    t = tt(n)
    y = sine(30 + 52 * np.exp(-t * 3.5), n) * np.exp(-t / 1.1) * attack(n, 0.002)
    y += lp(rng.standard_normal(n), 300) * np.exp(-t * 18) * 0.8
    return np.tanh(y * 2.2) * 0.9


def fm(f, dur, ratio=2.0, index=2.5, idecay=10, adecay=5, a=0.002):
    n = ns(dur)
    t = tt(n)
    mod = np.sin(2 * np.pi * f * ratio * t) * index * np.exp(-t * idecay)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t * adecay) * attack(n, a)


def plink(m, gain=1.0):
    f = midi(m)
    y = fm(f, 1.2, ratio=4.0, index=1.6, idecay=28, adecay=6.5)
    y += 0.35 * fm(f * 2, 1.2, ratio=1.0, index=0.4, idecay=20, adecay=12)
    return y * gain * 0.5


def blip(f0, f1=None, dur=0.07, gain=1.0):
    n = ns(dur)
    t = tt(n)
    f = f0 if f1 is None else f0 * (f1 / f0) ** (t / dur)
    return sine(f, n) * np.exp(-t / (dur * 0.35)) * attack(n, 0.001) * gain * 0.4


def tick(f=3200, gain=1.0):
    n = ns(0.03)
    t = tt(n)
    x = bp(rng.standard_normal(n), f * 0.7, min(f * 1.4, SR * 0.45)) * np.exp(-t / 0.004)
    return (x + 0.3 * np.sin(2 * np.pi * f * t) * np.exp(-t / 0.006)) * gain * 0.7


def whoosh(dur, f0, f1, bw=0.55, gain=1.0, shape=(0.6, 0.4)):
    n = ns(dur)
    x = rng.standard_normal(n)
    y = stft_shape(x, lambda f, t: np.exp(-0.5 * ((np.log2(np.maximum(f, 1)) - np.log2(f0 * (f1 / f0) ** np.clip(t / dur, 0, 1))) / bw) ** 2))
    y /= np.std(y) + 1e-9
    t = tt(n) / dur
    up, down = shape
    env = np.where(t < up, (t / up) ** 2, np.clip(1 - (t - up) / max(down, 1e-6), 0, 1) ** 1.5)
    return y * env * gain * 0.12


def whistle(dur, f_of_t, gain=1.0):
    n = ns(dur)
    t = tt(n)
    f = f_of_t(t / dur) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t))
    env = np.minimum(1, t / 0.02) * np.minimum(1, (dur - t) / 0.04)
    return (sine(f, n) + 0.15 * sine(2 * f, n)) * env * gain * 0.16


def bwomp(m, dur=0.4, fpeak=2800, gain=1.0, down=False):
    n = ns(dur)
    t = tt(n) / dur
    x = saw(midi(m), n) + saw(midi(m) * 1.006, n)
    fc = 3200 * (180 / 3200) ** t if down else 180 + (fpeak - 180) * np.sin(np.pi * np.clip(t * 1.1, 0, 1)) ** 2
    y = svf(x, fc, q=5)
    env = np.minimum(1, t * dur / 0.005) * (1 - t) ** 1.4
    return np.tanh(y * env * 0.9) * gain * 0.5


def supersaw(notes, dur, fc=1600, a=0.3, r=0.6, detune=(-14, -6, 0, 6, 14), spread=0.75):
    n = ns(dur + r)
    out = np.zeros((2, n))
    for m in notes:
        for k, c in enumerate(detune):
            v = saw(midi(m) * 2 ** (c / 1200), n)
            pan = spread * (k / (len(detune) - 1) * 2 - 1) * (1 if m % 2 else -1)
            ang = (pan + 1) * np.pi / 4
            out[0] += v * np.cos(ang)
            out[1] += v * np.sin(ang)
    t = tt(n)
    env = np.minimum(1, t / a) * np.clip((dur + r - t) / r, 0, 1)
    out = signal.sosfilt(sos('lowpass', fc, 4), out, axis=1) * env
    return out / (len(notes) * len(detune)) * 1.6


def bass_note(m, dur):
    n = ns(dur + 0.03)
    t = tt(n)
    f = midi(m)
    x = saw(f, n) * 0.8 + sine(f / 2, n) * 0.55
    x = lp(x, 900) * 0.6 + lp(x, 260) * 0.6
    env = np.minimum(1, t / 0.004) * np.clip((dur + 0.03 - t) / 0.03, 0, 1) * (0.6 + 0.4 * np.exp(-t * 8))
    return np.tanh(x * env * 1.3) * 0.55


# --------------------------------------------------------------- timeline
KICKS = [b for b in range(4, 28)] + [28, 30, 31]
for b in KICKS:
    drums.add(kick(punch=1.3 if b in (4, 8, 12, 16, 20, 24, 28) else 1.0, low=40 if b == 28 else 46), s(b), gain=1.0)
for b in range(5, 28, 2):
    drums.add(clap(), s(b), gain=0.8)
    verb.add(clap(), s(b), gain=0.18)
for k in range(4 * 2, 28 * 2):
    b = k / 2
    if k % 2:
        drums.add(hat(open_=(int(b) % 4 == 2), gain=0.9), s(b), pan=0.25)
    if b >= 16:
        drums.add(hat(gain=0.35), s(b + 0.25), pan=-0.3)
for b in (29.5, 30.5, 31.5, 30.25, 30.75, 31.25):
    drums.add(hat(gain=0.5 if b % 1 == 0.5 else 0.25), s(b), pan=0.25)

# snare roll into the drop
roll = [26 + i * 0.25 for i in range(4)] + [27 + i * 0.125 for i in range(4)] + [27.5 + i * 0.0625 for i in range(4)]
for i, b in enumerate(roll):
    drums.add(snare(0.25 + 0.6 * i / len(roll)), s(b), pan=0.1)

# harmony — one chord per bar
BARS = [  # (start beat, pad voicing, bass root)
    (0, [57, 60, 64, 67, 71], None),   # Am9 (intro)
    (4, [53, 57, 60, 64], 41),         # Fmaj7
    (8, [55, 60, 62, 64], 36),         # Cadd9
    (12, [55, 59, 62, 64], 43),        # G6
    (16, [57, 60, 64, 67], 45),        # Am7
    (20, [57, 60, 64, 67, 69], 41),    # Fmaj9
    (24, [55, 60, 62, 67], 43),        # Gsus
]
intro = supersaw(BARS[0][1], s(4), fc=5000, a=1.2, r=0.4)
intro = np.vstack([stft_shape(ch, lambda f, t: 1 / (1 + (f / (250 * (1 + 9 * np.clip(t / s(4), 0, 1) ** 2))) ** 4)) for ch in intro])
music.add(intro, 0, gain=0.8)
for b0, chord, root in BARS[1:]:
    music.add(supersaw(chord, s(4) + 0.05, fc=2300, a=0.03, r=0.25), s(b0), gain=0.85)
    for k in range(4):
        music.add(bass_note(root, s(0.42)), s(b0 + k + 0.5), gain=1.0)
        music.add(bass_note(root + 12, s(0.2)), s(b0 + k + 0.75), gain=0.35)
# gsus → g resolution under the snare roll
music.add(supersaw([55, 59, 62, 67], s(1.5), fc=2400, a=0.02, r=0.1), s(26), gain=0.35)

# arpeggio (b8–24), ping-pong delayed
arp = Bus()
for k in range(8 * 4, 24 * 4):
    b = k / 4
    chord = [c for b0, c, _ in BARS if b0 <= b][-1]
    pat = [0, 2, 1, 3, 2, 4, 1, 3]
    m = chord[pat[k % 8] % len(chord)] + 12
    vel = 0.9 if k % 4 == 0 else 0.55
    arp.add(fm(midi(m), 0.35, ratio=3.0, index=1.2, idecay=22, adecay=11) * vel, s(b), pan=-0.35 if k % 2 else 0.35)
d = ns(s(0.75))
arp_wet = arp.x.copy()
for tap, (gl, gr) in enumerate([(0.0, 0.32), (0.22, 0.0), (0.0, 0.14), (0.07, 0.0)], start=1):
    arp_wet[0, tap * d:] += arp.x[0, :-tap * d] * gl + arp.x[1, :-tap * d] * gl
    arp_wet[1, tap * d:] += arp.x[1, :-tap * d] * gr + arp.x[0, :-tap * d] * gr
music.x += arp_wet * 0.34

# ---- 01 PHYSICS
send(blip(660, 1320, 0.09), s(0.06), gain=0.6, wet=0.4)
send(whistle(s(0.5), lambda u: 1500 * (380 / 1500) ** u, 0.8), s(0.5), wet=0.3)
LANDS = [1, 1.5, 1.75, 1.875, 1.9375, 1.96875]
for i, (b, m) in enumerate(zip(LANDS, [76, 79, 81, 84, 86, 88])):
    g = 0.5 ** i
    send(plink(m, 0.9 * g ** 0.5), s(b), pan=-0.1, wet=0.45)
    drums.add(kick(punch=0.3, dur=0.3, low=60) * 0.6 * g, s(b))
send(whoosh(s(0.6), 300, 2400, gain=0.7, shape=(0.9, 0.1)), s(2.6), wet=0.2)
send(whistle(s(0.55), lambda u: 300 * (1400 / 300) ** np.sqrt(u), 0.9), s(3.2), wet=0.35)
send(bwomp(48, 0.35, 2600, gain=0.7), s(3.2), wet=0.25)
# the drop
fx.add(crash(2.0, 0.8), s(4))
send(boom(1.6) * 0.6, s(4), wet=0.1)

# ---- 02 TYPE
send(whoosh(s(0.5), 3000, 350, gain=0.8, shape=(0.85, 0.15)), s(4.5), wet=0.2)
for i in range(4):
    send(whoosh(s(0.3), 500, 2500, gain=0.35, shape=(0.5, 0.5)), s(5 + i * 0.045), pan=-0.5 + i * 0.33, wet=0.1)
send(bwomp(41, s(0.5), down=True, gain=0.6), s(5.42), wet=0.2)
for i in range(6):
    send(blip(midi(72 + [0, 2, 4, 7, 9, 12][i]), dur=0.06, gain=0.8), s(6 + i * 0.035), pan=-0.6 + i * 0.24, wet=0.25)
send(whoosh(s(0.5), 120, 900, gain=0.6, shape=(0.4, 0.6)), s(6.36), wet=0.15)
for i in range(4):
    for p, g in ((0.3636, 1.0), (0.7272, 0.45), (0.909, 0.2)):
        send(plink([72, 76, 79, 84][i], 0.55 * g), s(7 + i * 0.055 + p * 0.44), pan=-0.45 + i * 0.3, wet=0.3)
send(blip(200, 900, 0.08, 0.9), s(7.44), wet=0.2)
send(whoosh(s(0.5), 200, 9000, gain=1.1, shape=(0.97, 0.03)), s(7.5), wet=0.15)
fx.add(crash(1.6, 0.6), s(8))

# ---- 03 MORPH
for b, m in ((9, 36), (10, 43), (11, 41)):
    send(bwomp(m, 0.42, 3000, gain=0.55), s(b - 0.1), wet=0.25)
for b in (8, 9, 10, 11):
    send(fm(midi(91), 0.9, ratio=1.0, index=0.2, idecay=5, adecay=8) * 0.12, s(b), wet=0.5)
send(blip(1400, 260, 0.2, 0.9), s(11.4), wet=0.3)

# ---- 04 SYSTEMS
pent = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93]
for k in range(10):
    send(blip(midi(pent[k]), dur=0.05, gain=0.55), s(12.05 + k * 0.045), pan=np.sin(k) * 0.6, wet=0.35)
send(whoosh(s(0.45), 600, 5000, gain=0.4, shape=(0.6, 0.4)), s(12.3), wet=0.2)
for k in range(12):
    send(tick(2600 + 90 * k, 0.6), s(13.2 + k * 0.042), pan=-0.7 + k * 0.12, wet=0.15)
send(tick(1800, 1.0), s(13.68), wet=0.2)
send(tick(2200, 0.8), s(13.7), pan=0.3, wet=0.2)
for k in range(25):
    send(tick(3600 + 40 * (k % 5), 0.45), s(14.18 + k * 0.026), pan=-0.8 + k * 0.066, wet=0.12)
for c in range(17):
    send(tick(2400 + 60 * c, 0.5), s(15.2 + c * 0.03), pan=-0.8 + c * 0.1, wet=0.15)
send(np.flip(whoosh(s(0.5), 400, 3000, gain=0.7, shape=(0.2, 0.8))), s(15.5), wet=0.2)

# ---- 05 3D
send(whoosh(s(1.2), 60, 400, bw=0.8, gain=0.9, shape=(0.4, 0.6)), s(16), wet=0.3)
for k in range(18):
    send(blip(midi(pent[k % 10] + 12), dur=0.04, gain=0.25), s(16.04 + k * 0.032), pan=np.cos(k * 1.7) * 0.8, wet=0.4)
for b0, b1 in ((17.45, 18), (18.45, 19), (19.4, 19.95)):
    send(whoosh(s(b1 - b0), 300, 4000, gain=0.6, shape=(0.85, 0.15)), s(b0), wet=0.2)
send(bwomp(45, 0.38, 2600, gain=0.5), s(18), wet=0.25)
send(bwomp(52, 0.38, 3000, gain=0.5), s(19), wet=0.25)
fx.add(crash(1.4, 0.45), s(20))

# ---- 06 LINE
n = ns(s(1))
tt_ = tt(n)
hum = (saw(midi(57) * (1 + 0.004 * np.sin(2 * np.pi * 7 * tt_)), n) + saw(midi(64), n)) * (0.5 + 0.5 * np.sin(2 * np.pi * 8.53 * tt_) ** 2)
send(lp(hum, 1600) * np.minimum(1, tt_ / 0.05) * np.clip((s(1) - tt_) / 0.2, 0, 1) * 0.07, s(20.1), wet=0.3)
send(whoosh(s(0.55), 400, 6000, gain=0.6, shape=(0.8, 0.2)), s(21.95), wet=0.2)
send(whoosh(s(0.5), 5000, 300, gain=0.6, shape=(0.6, 0.4)), s(23.4), wet=0.2)
fx.add(crash(1.2, 0.5), s(24))

# ---- 07 RHYTHM
send(whistle(s(0.16), lambda u: 300 * 4 ** u, 0.8), s(24.5), wet=0.3)
for k in range(5):
    send(fm(midi(84 + [0, 3, 7, 10, 12][k]), 0.12, ratio=2.0, index=3, idecay=40, adecay=30) * 0.35, s(25 + k * 0.06), pan=-0.6 + 0.3 * k, wet=0.3)
for k in range(8):
    if rng.random() < 0.8:
        n2 = ns(s(0.06))
        gl = np.sign(np.sin(2 * np.pi * rng.choice([220, 330, 440, 880]) * tt(n2))) * 0.16 + rng.standard_normal(n2) * 0.06
        fx.add(gl, s(25.5 + k * 0.0625), pan=rng.uniform(-0.6, 0.6))
for k, m in enumerate([84, 88, 91, 96]):
    send(plink(m, 0.4), s(26 + k * 0.03), pan=-0.4 + k * 0.27, wet=0.6)
send(bwomp(43, s(0.45), 2200, gain=0.45), s(26.5), wet=0.2)
for k in range(16):
    send(blip(midi(72 + k * 1.5), dur=0.03, gain=0.5), s(27 + k * 0.03125), wet=0.15)
# riser + reverse crash, then a quarter-beat of silence
send(whoosh(s(3.75), 350, 9500, bw=0.5, gain=0.9, shape=(0.995, 0.005)), s(24), wet=0.2)
n = ns(s(3.75))
u = tt(n) / s(3.75)
send(lp(saw(110 * 8 ** u, n), 3000) * u ** 2.5 * 0.08, s(24), wet=0.2)
send(np.flip(crash(s(0.3), 0.8), axis=1)[0], s(27.45), wet=0.0)

# ---- 08 HELLO
fx.add(crash(3.2, 1.0), s(28))
send(boom(3.4), s(28), gain=0.95, wet=0.15)
music.add(supersaw([48, 55, 59, 62, 64, 67], s(4) + 0.1, fc=2600, a=0.005, r=0.6), s(28), gain=0.75)
music.add(bass_note(36, s(3.5)), s(28), gain=1.0)
verb.add(supersaw([60, 64, 67, 71, 74], 0.4, fc=4000, a=0.005, r=0.2)[0], s(28), gain=0.5)
send(whistle(s(1.0), lambda u: 700 + 900 * np.sin(np.pi * u) - 250 * u, 0.7), s(28.02), wet=0.3)
for b, m, g in ((29, 84, 1.0), (29.25, 79, 0.5), (29.375, 76, 0.28)):
    send(plink(m, 0.9 * g), s(b), pan=0.25, wet=0.5)
    drums.add(kick(punch=0.2, dur=0.25, low=70) * 0.35 * g, s(b))
send(whoosh(s(0.85), 9000, 2500, gain=0.35, shape=(0.3, 0.7)), s(28.85), wet=0.4)
for i in range(7):
    send(tick(4200, 0.35), s(29.45 + i * 0.065), pan=-0.6 + i * 0.2, wet=0.3)
send(kick(punch=0.6, dur=0.4, low=55) * 0.4, s(30), wet=0)
send(tick(1500, 0.9), s(30), wet=0.3)
send(whoosh(s(0.6), 2500, 11000, bw=0.4, gain=0.35, shape=(0.6, 0.4)), s(31.0), wet=0.5)
send(blip(500, 1100, 0.08, 0.5), s(31.3), wet=0.3)
send(plink(84, 0.55), s(31.6), wet=0.6)
music.add(bass_note(36, s(1.8)), s(30), gain=0.5)

# ------------------------------------------------------------------- mix
t_all = tt(N + PAD)
duck = np.ones(N + PAD)
for b in KICKS:
    x = t_all - s(b)
    m = x >= 0
    duck[m] *= 1 - 0.62 * np.exp(-x[m] / 0.11) * np.minimum(1, x[m] / 0.004)


def make_ir(rt60=2.4, pre=0.018):
    n = ns(rt60)
    t = tt(n)
    ir = rng.standard_normal((2, n)) * np.exp(-6.9 * t / rt60)
    dark = signal.sosfilt(sos('lowpass', 2200, 2), ir, axis=1)
    w = np.clip(t / rt60 * 2, 0, 1)
    ir = ir * (1 - w) + dark * w
    ir = signal.sosfilt(sos('highpass', 180, 2), ir, axis=1)
    ir = np.pad(ir, ((0, 0), (ns(pre), 0)))
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


ir = make_ir()
wet = np.vstack([signal.fftconvolve(verb.x[c], ir[c])[:N + PAD] for c in range(2)]) * 0.33

mix = drums.x * 0.8 + music.x * duck * 0.8 + fx.x * 0.9 + wet
# dropout before the final impact (b27.75 → b28)
drop = np.ones(N + PAD)
x = t_all
drop *= 1 - 0.94 * np.clip((x - s(27.72)) / 0.03, 0, 1) * (x < s(28))
mix *= drop
mix = signal.sosfilt(sos('highpass', 24, 2), mix, axis=1)
mix = mix[:, :N]
# master: soft-knee saturation + peak normalise to −1 dBFS
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
mix = norm(mix, 10 ** (-1 / 20))
fade = np.clip((DUR - tt(N)) / 0.35, 0, 1) ** 1.5
mix *= fade * np.minimum(1, tt(N) / 0.005)

out_wav = os.path.join(ROOT, 'media', 'soundtrack.wav')
os.makedirs(os.path.dirname(out_wav), exist_ok=True)
pcm = np.clip(mix.T + (rng.random(mix.T.shape) - rng.random(mix.T.shape)) / 32768, -1, 1)
with wave.open(out_wav, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((pcm * 32767).astype('<i2').tobytes())
rms = 20 * np.log10(np.sqrt(np.mean(mix ** 2)) + 1e-12)
print(f'wrote {os.path.relpath(out_wav, ROOT)}  {DUR:.3f}s  rms {rms:.1f} dBFS')
out_m4a = out_wav[:-4] + '.m4a'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', out_wav, '-c:a', 'aac', '-b:a', '192k', out_m4a], check=True)
print(f'wrote {os.path.relpath(out_m4a, ROOT)}')
