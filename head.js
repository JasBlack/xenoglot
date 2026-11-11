// Xenoglot speaking head: a generated wireframe alien drawn like an oscilloscope trace.
// Every seed gives a different creature: skull, eyes, mouth and extras on the outside; a brain, nerves, teeth,
// tongue, bones, windpipes, air sacs and a diaphragm on the inside; and a temperament that decides how it
// moves when nothing is happening. While speech plays, the jaw, lips, tongue and the glowing vocal tract
// follow the sounds actually being spoken (timings from the synthesizer), gated by loudness.
//   const head = XenoHead.create(canvas, { sounds: PM, script });   // PM: key → {t:type, f:[F1,F2,F3], ipa}
//   script (optional): { draw(ctx, word, x, y, height), width(word, height) } draws a word in the language's own letters for the subtitles
//   head.setSeed(1234); head.setInfo({ name: 'Velnari' });
//   head.speak({ buf, timeline:{ segs:[{k,t,d,p,w,en}] }, clock: () => secondsSinceStart }); head.stop();
(function () {
'use strict';
const TAU = Math.PI * 2, WIRE = '228,228,225', GREEN = '57,255,136', VIOLET = '179,107,255';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const hsl = (h, sat, l) => {
  const a = sat / 100 * Math.min(l / 100, 1 - l / 100);
  const f = n => { const k = (n + h / 30) % 12; return Math.round(255 * (l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return `${f(0)},${f(8)},${f(4)}`;
};

/* ---------- DNA: everything that makes one creature different from another ---------- */
function makeDNA(seed) {
  const r = rng(seed * 2654435761 >>> 0), R = (a, b) => a + (b - a) * r(), pick = a => a[Math.floor(r() * a.length)], chance = p => r() < p;
  const d = { seed };
  // the skull
  d.crown = R(.62, 1.0);                                   // cranium half-width
  d.tall = R(.55, 1.25) * (chance(.22) ? R(1.3, 1.8) : 1); // cranium height; some are coneheads
  d.domeP = R(1.7, 3.2);                                   // 2 = round dome, higher = boxier
  d.jawLen = R(.55, 1.05);                                 // widest point down to the chin
  d.taper = R(.28, .85);                                   // chin width as a share of the cranium
  d.cheek = R(-.1, .22);
  d.depth = R(.85, 1.3);                                   // front-to-back against side-to-side
  d.bulge = chance(.5) ? R(.15, .7) : R(-.05, .15);        // back-of-skull bulge
  d.flat = R(.02, .22);
  d.muzzle = chance(.4) ? R(.08, .3) : 0;
  d.brow = chance(.6) ? R(.03, .14) : 0;
  d.mouthV = R(.2, .42);                                   // heights run 0 (chin) to 1 (crown); vm is the widest ring
  d.vm = R(.5, .62);
  d.eyeV = clamp(d.vm + R(-.1, .12), d.mouthV + .16, .78);
  d.browV = d.eyeV + R(.06, .1);
  // eyes
  d.eyeLayout = pick(['pair', 'pair', 'cyclops', 'odd', 'tri', 'row', 'row', 'column', 'cluster', 'cluster', 'cluster', 'ring', 'stalks', 'stalks']);
  d.eyeN = 3 + Math.floor(r() * 4);
  d.eyeSize = R(.08, .2) * (['row', 'cluster', 'ring'].includes(d.eyeLayout) ? .72 : 1);
  d.eyeGap = R(.3, .62);
  d.eyeTilt = R(-.55, .55);
  d.eyeShape = pick(['round', 'round', 'almond', 'almond', 'slit', 'wide']);
  d.eyeRings = 2 + Math.floor(r() * 4);
  d.pupil = pick(['dot', 'dot', 'slit', 'ring', 'bar', 'none']);
  d.bug = chance(.35) ? R(.3, .9) : R(0, .2);              // how far the eyes stand out
  // nose and mouth
  d.nose = pick(['none', 'slits', 'slits', 'ridge', 'ridge', 'hook', 'trunk']);
  d.noseLen = R(.1, .32);
  d.mouthW = R(.3, .75);                                   // half-width in radians around the face
  d.teeth = pick([0, 1, 1, 1, 2, 2, 3]);                   // none, pegs, fangs, needles
  d.jawSwing = R(.28, .5);
  d.mouthKind = pick(['wide', 'wide', 'wide', 'vertical']);
  if (d.mouthKind === 'vertical') d.jawSwing *= .35;
  d.mandibles = chance(.26) ? R(.25, .5) : 0;
  // neck, mesh density, outside extras
  d.neckR = R(.2, .42) * d.crown; d.neckLen = R(.45, 1.0); d.neckRings = 4 + Math.floor(r() * 6);
  d.rings = 24 + Math.floor(r() * 12); d.meridians = pick([6, 8, 8, 10, 12]);
  d.antennae = pick([0, 0, 0, 0, 1, 2, 2, 3]); d.antLen = R(.35, .9); d.antSplay = R(.15, .7);
  d.horns = chance(.25) ? R(.34, .6) : 0; d.hornTurns = R(.6, 1.3);
  d.fins = chance(.3) ? R(.2, .5) : 0; d.finRays = 3 + Math.floor(r() * 4);
  d.crest = chance(.28) ? R(.1, .32) : 0; d.crestN = 5 + Math.floor(r() * 8);
  d.tentacles = chance(.3) ? 3 + Math.floor(r() * 6) : 0; d.tentLen = R(.35, .8);
  d.phase = R(0, TAU);
  // what makes a skull strange: each is off for most heads, and they combine
  d.lobeAmp = chance(.38) ? R(.07, .24) : 0; d.lobeN = pick([2, 3, 3, 4, 5, 6, 8]); d.lobePh = R(0, TAU);
  d.twist = d.lobeAmp && chance(.5) ? R(-3, 3) : 0;
  d.segAmp = chance(.28) ? R(.06, .17) : 0; d.segN = 3 + Math.floor(r() * 5);
  d.waist = chance(.3) ? R(.2, .55) : 0;
  d.sweep = chance(.32) ? R(.35, 1.2) : 0;
  d.hammer = chance(.14) ? R(.45, 1.1) : 0;
  if (chance(.16)) { d.crown *= 1.3; d.taper *= .55; d.jawLen *= 1.15; d.domeP = R(2.6, 4); }   // mushroom cap
  if (d.hammer) { d.eyeLayout = 'pair'; d.eyeGap = 1.42; d.bug = Math.max(d.bug, .4); }
  // the insides
  d.brain = pick(['coil', 'coil', 'orbs', 'orbs', 'spiral', 'crystal', 'twin', 'web']);
  d.brainSize = R(.5, .82);
  d.pipes = [R(.55, 1.2)]; if (chance(.6)) d.pipes.push(R(.3, .9)); if (chance(.3)) d.pipes.push(R(.25, .6));   // windpipes of different bores
  d.sacs = pick([1, 2, 2, 2, 3, 4]); d.sacSize = R(.16, .3);
  d.nasal = d.nose !== 'none' && chance(.7);
  d.diaphragm = pick(['dome', 'dome', 'bellows', 'cone']);
  d.chestW = R(.8, 1.15) * Math.max(d.crown, .7); d.chestH = R(.6, .9);
  d.breath = R(.14, .34);                                  // breaths per second at rest
  d.skin = pick(['none', 'none', 'filaments', 'filaments', 'spines', 'tufts', 'speckle']);
  d.skinN = 40 + Math.floor(r() * 70);
  // temperament: how it carries itself when nothing is happening
  d.temper = { sway: R(.2, .65), speed: R(.22, .6), twitch: chance(.4) ? R(.4, 1) : 0, curious: R(.25, 1), blink: R(1.6, 6.5), every: R(3.5, 9), nod: R(.3, 1) };
  const habits = ['tilt', 'glance', 'yawn', 'shiver', 'lean', 'perk', 'chatter', 'roll'];
  d.habits = []; while (d.habits.length < 3) { const h = pick(habits); if (!d.habits.includes(h)) d.habits.push(h); }
  d.mood = d.temper.twitch > .6 ? 'twitchy' : d.temper.curious > .75 ? 'curious' : d.temper.speed < .32 ? 'calm' : d.temper.sway > .5 ? 'restless' : 'watchful';
  // colours: the family green and violet now and then, otherwise the creature's own
  const hue = R(0, 360), fam = chance(.15);
  d.col = fam ? { feat: GREEN, tract: VIOLET, wire: WIRE, brain: hsl(190, 100, 70), bone: '236,232,214', lung: hsl(330, 90, 72) }
    : { feat: hsl(hue, 100, 62), tract: hsl((hue + R(100, 260)) % 360, 100, 70), wire: hsl(hue, 22, 86), brain: hsl((hue + R(40, 90)) % 360, 100, 72), bone: hsl(hue, 30, 88), lung: hsl((hue + R(150, 210)) % 360, 85, 70) };
  // the hand that draws it: mostly a loose, broken, glowing sketch line; sometimes a clean trace. Some are one colour throughout.
  d.ink = pick(['sketch', 'sketch', 'sketch', 'trace']); d.rough = R(.6, 1.5);
  if (!fam && chance(.35)) { const h2 = R(0, 360); d.col = { feat: hsl(h2, 100, 66), tract: hsl(h2, 90, 78), wire: hsl(h2, 70, 74), brain: hsl(h2, 100, 82), bone: hsl(h2, 45, 88), lung: hsl(h2, 85, 58) }; }
  return d;
}

/* ---------- geometry ---------- */
// a body for the creature: its own silhouette, and a ribcage that follows it
function makeBody(d, chestTop) { const r = rng((d.seed ^ 0xb0d1e5) >>> 0), R = (a, b) => a + (b - a) * r(), pick = a => a[Math.floor(r() * a.length)];
  const b = { type: pick(['barrel', 'hourglass', 'bell', 'bulb', 'shoulders', 'segmented', 'pear']), h: Math.max(d.chestH * 1.3, R(1.05, 1.7)), w: Math.max(d.chestW * .9, R(.75, 1.35)), depth: R(.55, .9), hunch: R(-.15, .35), segN: 2 + Math.floor(r() * 4), lobe: r() < .3 ? R(.05, .14) : 0, lobeN: pick([2, 3, 4, 6]),
    ribN: 3 + Math.floor(r() * 6), ribStyle: pick(['hoops', 'open', 'open', 'claw', 'spiral', 'fan']), ribDroop: R(0, .5), top: chestTop + .14 };
  const prof = u => { const s = Math.sin(Math.PI * u); switch (b.type) {
    case 'hourglass': return .45 + .55 * Math.pow(Math.abs(Math.cos(Math.PI * u)), 1.3);
    case 'bell': return .3 + .7 * Math.pow(u, .7);
    case 'bulb': return .28 + .72 * Math.pow(s, 1.6);
    case 'shoulders': return 1 - .6 * u;
    case 'pear': return .35 + .65 * Math.pow(Math.sin(Math.PI * Math.pow(u, .6) * .95), 1.2) * (.5 + .5 * u) * 1.3;
    case 'segmented': return (.55 + .45 * Math.pow(s, .7)) * (1 + .13 * Math.sin(u * b.segN * TAU));
    default: return .55 + .45 * Math.pow(s, .7); } };
  b.rad = u => lerp(d.neckR * 1.15, b.w * Math.min(1.15, prof(u)), smooth(u / .16)) * (u > .93 ? Math.sqrt(Math.max(0, (1 - u) / .07)) * .6 + .4 : 1);
  b.B = (u, th, k = 1) => { const rr = b.rad(u) * (1 + b.lobe * Math.cos(b.lobeN * th)) * k; return [rr * Math.sin(th), b.top - b.h * u, rr * b.depth * Math.cos(th) - .1 - b.hunch * u * u * .6]; };
  // the neck joins head to body: its own thickness and shape, blending into the body's shoulders
  const nk = { type: pick(['plain', 'thin', 'thick', 'taper', 'funnel', 'ringed', 'ringed', 'bulb', 'waist']), k: R(.8, 1.25), segN: 3 + Math.floor(r() * 4), yT: -d.jawLen * .8, yB: b.top + .01 };
  const np = u => nk.type === 'thin' ? .62 : nk.type === 'thick' ? 1.5 : nk.type === 'taper' ? lerp(.7, 1.6, u) : nk.type === 'funnel' ? lerp(1.5, .7, u) : nk.type === 'ringed' ? 1 + .2 * Math.sin(u * nk.segN * TAU) : nk.type === 'bulb' ? 1 + .7 * Math.exp(-Math.pow((u - .5) / .2, 2)) : nk.type === 'waist' ? 1 - .4 * Math.exp(-Math.pow((u - .5) / .22, 2)) : 1;
  b.N = (u, th, k = 1) => { const rr = lerp(d.neckR * nk.k * np(u), d.neckR * 1.15, smooth((u - .78) / .22)) * k; return [rr * Math.sin(th), lerp(nk.yT, nk.yB, u), rr * .9 * Math.cos(th) - lerp(.08, .1, u)]; };
  b.neck = nk;
  return b; }
function build(d) {
  const yOf = v => v < d.vm ? -d.jawLen * (1 - v / d.vm) : d.tall * (v - d.vm) / (1 - d.vm);
  const wOf = v => {
    if (v >= d.vm) { const u = (v - d.vm) / (1 - d.vm); return d.crown * Math.pow(Math.max(0, 1 - Math.pow(u, d.domeP)), 1 / d.domeP); }
    const u = v / d.vm, s = smooth(u);
    return (d.crown * (d.taper + (1 - d.taper) * s) + d.cheek * d.crown * Math.sin(Math.PI * u)) * (.5 + .5 * Math.min(1, u / .14));
  };
  const hingeY = yOf(d.mouthV) + .16 * d.jawLen, hingeZ = -.28 * d.crown * d.depth;
  // a point on the skin. v: 0 chin → 1 crown; th: 0 front, ±π back; open: 0–1 jaw
  function S(v, th, open) {
    let w = wOf(v); const c = Math.cos(th), up = v > d.vm ? (v - d.vm) / (1 - d.vm) : 0;
    if (d.lobeAmp) w *= 1 + d.lobeAmp * Math.cos(d.lobeN * (th + d.twist * (v - .5)) + d.lobePh) * (v > d.vm ? 1 : .35 + .65 * v / d.vm);
    if (d.segAmp) w *= 1 + d.segAmp * Math.sin(v * d.segN * Math.PI);
    if (d.waist) w *= 1 - d.waist * Math.exp(-Math.pow((v - d.vm * .78) / .075, 2));
    let x = w * Math.sin(th) * (1 + d.hammer * Math.exp(-Math.pow((v - d.eyeV) / .085, 2))), y = yOf(v), z = w * d.depth * c;
    if (d.sweep) z -= d.sweep * d.tall * Math.pow(up, 1.6);
    if (c < 0) z *= 1 + d.bulge * (v > d.vm ? 1 : v / d.vm);
    else {
      z *= 1 - d.flat * (v < d.vm ? 1 : .4);
      z += d.brow * d.crown * Math.exp(-Math.pow((v - d.browV) / .045, 2)) * c * c;
      z += d.muzzle * d.crown * Math.exp(-Math.pow((v - d.mouthV) / .13, 2)) * Math.pow(c, 4);
    }
    if (open > 0 && v < d.mouthV) {   // the lower jaw swings on a hinge behind the mouth
      const a = open * d.jawSwing * Math.min(1, (d.mouthV - v) / .05), ca = Math.cos(a), sa = Math.sin(a), dy = y - hingeY, dz = z - hingeZ;
      y = hingeY + dy * ca - dz * sa; z = hingeZ + dy * sa + dz * ca;
    }
    return [x, y, z];
  }
  function frame(v, th, open) {   // centre and local axes of a patch of skin: across, up, outward
    const c = S(v, th, open), e = .01, tu = norm(sub(S(v, th + e, open), S(v, th - e, open))), tv = norm(sub(S(Math.min(.99, v + e), th, open), S(Math.max(.01, v - e), th, open)));
    let n = norm(cross(tu, tv)); if (n[0] * c[0] + n[2] * c[2] < 0) n = [-n[0], -n[1], -n[2]];
    return { c, tu, tv, n };
  }
  // eyes
  const eyes = [];
  { const er = rng((d.seed ^ 0x5bd1e995) >>> 0), ER = (a, b) => a + (b - a) * er(), g = d.eyeGap, v0 = d.eyeV, s = d.eyeSize, cv = v => clamp(v, d.mouthV + .13, .93);
    const pair = (th, v, sz) => eyes.push({ th: -th, v: cv(v), s: sz, side: -1 }, { th, v: cv(v), s: sz, side: 1 });
    switch (d.eyeLayout) {
      case 'cyclops': eyes.push({ th: 0, v: v0, s: s * 1.7, side: 0 }); break;
      case 'odd': eyes.push({ th: -g, v: v0, s: s * 1.5, side: -1 }, { th: g * 1.1, v: cv(v0 + .05), s: s * .5, side: 1 }); break;
      case 'tri': pair(g, v0, s); eyes.push({ th: 0, v: cv(v0 + .14), s: s * .75, side: 0 }); break;
      case 'row': for (let i = 0; i < d.eyeN; i++) { const u = i / (d.eyeN - 1); eyes.push({ th: lerp(-1.25, 1.25, u) * Math.min(1, .45 + g), v: v0, s: s * (.55 + .45 * Math.sin(Math.PI * u)), side: Math.sign(u - .5) }); } break;
      case 'column': for (let i = 0; i < Math.min(4, d.eyeN); i++) eyes.push({ th: 0, v: cv(v0 - .06 + i * .12), s: s * (1 - .18 * i), side: 0 }); break;
      case 'cluster': pair(g * .8, v0, s); for (let i = 0; i < 2 + Math.floor(d.eyeN / 2); i++) pair(ER(.12, 1.25), v0 + ER(-.1, .24), s * ER(.3, .7)); break;
      case 'ring': { const n = Math.max(6, d.eyeN + 3); for (let i = 0; i < n; i++) eyes.push({ th: -Math.PI + (i + .5) * TAU / n, v: v0, s: s * .8, side: 0 }); break; }
      case 'stalks': { const n = Math.max(2, Math.min(5, d.eyeN - 1));
        for (let i = 0; i < n; i++) eyes.push({ stalk: true, th: lerp(-1.1, 1.1, n > 1 ? i / (n - 1) : .5), v: .86, len: ER(.3, .7), s: s * .85, side: 0, ph: ER(0, 6) });
        if (er() < .5) pair(g, v0, s * .5); break; }
      default: pair(g, v0, s);
    } }
  { const pos = e => S(e.v, e.th, 0), keep = [];   // no eye may overlap another: the smaller one shrinks to fit, or goes
    for (const e of [...eyes].sort((a, b) => b.s - a.s)) { if (!e.stalk) for (const k of keep) { if (k.stalk) continue; const dd = Math.hypot(...sub(pos(e), pos(k))); e.s = Math.min(e.s, dd / 1.32 - k.s); } if (e.s > .03) keep.push(e); }
    eyes.length = 0; eyes.push(...keep); }
  // where the brain sits, and how much room it has
  const vb = d.vm + .42 * (1 - d.vm), pf = S(vb, 0, 0), pb = S(vb, Math.PI, 0), ps = S(vb, Math.PI / 2, 0);
  const brainC = [0, pf[1], (pf[2] + pb[2]) / 2], brainR = Math.max(.12, Math.min((pf[2] - pb[2]) / 2, Math.abs(ps[0]), d.tall * .55) * d.brainSize);
  // fixed scatter for the brain's parts and the skin detail, so a head is the same every time
  const sr = rng((d.seed ^ 0x9e3779b9) >>> 0), SR = (a, b) => a + (b - a) * sr();
  const nodes = []; for (let i = 0; i < 9; i++) { const a = SR(0, TAU), b = Math.acos(SR(-1, 1)), rr = Math.cbrt(SR(.1, 1)) * .8; nodes.push({ p: [Math.sin(b) * Math.cos(a) * rr, Math.cos(b) * rr * .8, Math.sin(b) * Math.sin(a) * rr], r: SR(.1, .22), ph: SR(0, TAU) }); }
  const skin = []; for (let i = 0; i < d.skinN; i++) skin.push({ v: d.skin === 'speckle' ? SR(.08, .96) : d.skin === 'spines' ? SR(.5, .99) : SR(.74, .99), th: SR(-Math.PI, Math.PI), len: SR(.5, 1), ph: SR(0, TAU), tuft: Math.floor(SR(0, 5)) });
  const stalkTop = eyes.reduce((a, e) => e.stalk ? Math.max(a, e.len * .8 + .1) : a, 0);
  const top = d.tall + Math.max(d.antennae ? d.antLen : 0, stalkTop, d.skin === 'filaments' ? .12 : 0) + d.crest;
  const chestTop = -d.jawLen - d.neckLen * .8, bottom = chestTop - d.chestH;
  const reach = Math.max(d.crown * (1 + d.lobeAmp + d.segAmp) * (1 + d.hammer) + (d.sweep ? d.sweep * d.tall * .35 : 0), d.chestW * .8);
  const body = makeBody(d, chestTop);
  // stars scattered over each skin: where on the surface (two fractions), how bright, how big
  const mkStars = (n, salt) => { const r2 = rng((d.seed ^ salt) >>> 0), a = new Float32Array(n * 4); for (let i = 0; i < n; i++) { a[i * 4] = r2(); a[i * 4 + 1] = r2(); a[i * 4 + 2] = .45 + .55 * r2(); a[i * 4 + 3] = .5 + 1.3 * r2(); } return a; };
  const stars = { head: mkStars(2600, 0x51a1), neck: mkStars(260, 0x51a2), body: mkStars(1100, 0x51a3) };
  return { body, stars, d, S, frame, eyes, yOf, wOf, top, bottom, chestTop, reach, col: d.col, mouthY: yOf(d.mouthV), brainC, brainR, nodes, skin, hingeY, hingeZ };
}

// a wire tube along a path: rings plus long strands
function tube(path, rad, sides, out, color, alpha, strands = 3) {
  const rings = [];
  for (let i = 0; i < path.length; i++) {
    const t = norm(sub(path[Math.min(path.length - 1, i + 1)], path[Math.max(0, i - 1)]));
    const a = norm(cross(t, Math.abs(t[1]) > .9 ? [1, 0, 0] : [0, 1, 0])), b = cross(t, a), ring = [], r = rad(i / (path.length - 1));
    for (let k = 0; k < sides; k++) { const an = k / sides * TAU; ring.push(add(add(path[i], a, Math.cos(an) * r), b, Math.sin(an) * r)); }
    rings.push(ring); out.push({ pts: ring, closed: true, color, alpha });
  }
  for (let k = 0; k < sides; k += Math.max(1, Math.floor(sides / strands))) out.push({ pts: rings.map(g => g[k]), color, alpha: alpha * .8 });
  return rings;
}
// a wire ball: rings of latitude and two great circles
function ball(c, rx, ry, rz, out, color, alpha, lat = 3, seg = 18) {
  for (let j = 1; j <= lat; j++) { const a = -Math.PI / 2 + j * Math.PI / (lat + 1), pts = [];
    for (let k = 0; k < seg; k++) { const b = k / seg * TAU; pts.push([c[0] + Math.cos(a) * Math.cos(b) * rx, c[1] + Math.sin(a) * ry, c[2] + Math.cos(a) * Math.sin(b) * rz]); }
    out.push({ pts, closed: true, color, alpha }); }
  for (const rot of [0, Math.PI / 2]) { const pts = [];
    for (let k = 0; k < seg; k++) { const b = k / seg * TAU; pts.push([c[0] + Math.cos(b) * Math.cos(rot) * rx, c[1] + Math.sin(b) * ry, c[2] + Math.cos(b) * Math.sin(rot) * rz]); }
    out.push({ pts, closed: true, color, alpha: alpha * .8 }); }
}
// a bright bead running along a line: nerve signals, breath in a pipe
function spark(pts, u, out, color, w = 2.6) {
  const n = pts.length - 1; if (n < 1) return; const x = ((u % 1) + 1) % 1 * n, i = Math.min(n - 1, Math.floor(x)), f = x - i;
  out.push({ pts: [mix(pts[i], pts[i + 1], Math.max(0, f - .35)), mix(pts[i], pts[i + 1], Math.min(1, f + .35))], color, alpha: 1, w });
}
const ICO = (() => { const g = (1 + Math.sqrt(5)) / 2, v = [];
  for (const a of [-1, 1]) for (const b of [-g, g]) v.push(norm([0, a, b]), norm([a, b, 0]), norm([b, 0, a]));
  const e = []; for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) if (Math.hypot(...sub(v[i], v[j])) < 1.1) e.push([i, j]);
  return { v, e }; })();

// all the line work for one frame.
// m: mouth {jaw, lip, round, at, tight} · t: seconds · amp: loudness 0–1 · st: {blinks[], look, breath, perk, widen, think, chatter}
function lines(H, m, t, amp, st) {
  const d = H.d, out = [], S = H.S, open = m.jaw, C = H.col, WIRE = C.wire, FEAT = C.feat, TRACT = C.tract;
  /* ----- skin: contour rings and meridians ----- */
  for (let i = 0; i < d.rings; i++) { const v = .015 + .975 * i / (d.rings - 1), pts = [];
    for (let k = 0; k < 40; k++) pts.push(S(v, k / 40 * TAU - Math.PI, open));
    out.push({ pts, closed: true, color: WIRE, alpha: .18 }); }
  for (let k = 0; k < d.meridians; k++) { const th = k / d.meridians * TAU - Math.PI + .0001, pts = [];
    for (let i = 0; i <= 30; i++) pts.push(S(.015 + .975 * i / 30, th, open));
    out.push({ pts, color: WIRE, alpha: .12 }); }
  /* ----- skin detail ----- */
  const core = [0, H.yOf(d.vm) + d.tall * .3, H.brainC[2]];
  if (d.skin === 'speckle') for (const k of H.skin) { const p = S(k.v, k.th, k.v < d.mouthV ? open : 0); out.push({ pts: [p, [p[0] + .012, p[1] + .012, p[2]]], color: FEAT, alpha: .5 + .4 * Math.sin(t * 2 + k.ph), w: 1.6 }); }
  else if (d.skin !== 'none') for (const k of H.skin) { const base = S(k.v, d.skin === 'tufts' ? (k.tuft - 2) * .9 + (k.th * .08) : k.th, 0), n = norm(sub(base, core));
    if (d.skin === 'spines') { out.push({ pts: [base, add(base, n, .05 + .1 * k.len + .03 * st.perk)], color: FEAT, alpha: .5 }); continue; }
    const L = (d.skin === 'tufts' ? .14 : .22) * (.5 + k.len), pts = [];
    for (let i = 0; i <= 5; i++) { const u = i / 5, wv = Math.sin(t * 1.3 + k.ph + u * 3) * .035 * u * (1 + 2 * amp);
      pts.push([base[0] + n[0] * L * u * (1 - .3 * u) + wv, base[1] + n[1] * L * u + (d.skin === 'tufts' ? L * .5 * u : -L * .9 * u * u) * (1 - .6 * st.perk), base[2] + n[2] * L * u * (1 - .3 * u) + wv * .6]); }
    out.push({ pts, color: FEAT, alpha: .38 }); }
  /* ----- brain: one of six kinds, each with its own idle motion; busier while speaking ----- */
  { const c = H.brainC, R0 = H.brainR * (1 + .035 * Math.sin(t * 1.9 + d.phase)), act = .25 + 1.6 * amp + st.think, B = C.brain;
    const P = q => [c[0] + q[0] * R0, c[1] + q[1] * R0 * .85, c[2] + q[2] * R0];
    if (d.brain === 'coil') { for (let s = 0; s < 3; s++) { const pts = [];
        for (let i = 0; i <= 70; i++) { const u = i / 70, lon = u * TAU * (2 + s) + s * 2.1, lat = Math.sin(u * TAU * (5 + s * 2) + d.phase + t * .25) * (.95 - .18 * s), rr = .92 - .2 * s;
          pts.push(P([Math.cos(lat) * Math.sin(lon) * rr, Math.sin(lat) * rr, Math.cos(lat) * Math.cos(lon) * rr])); }
        out.push({ pts, color: B, alpha: .55 - .1 * s }); for (let k = 0; k < Math.round(act * 2); k++) spark(pts, t * (.25 + .1 * s) + k * .37 + s * .2, out, B); } }
    else if (d.brain === 'orbs') { const pos = H.nodes.map(n => P(n.p));
      H.nodes.forEach((n, i) => { const r = R0 * n.r * (1 + .25 * Math.sin(t * 2.6 + n.ph) * (.4 + act)); ball(pos[i], r, r, r, out, B, .5, 1, 12); });
      for (let i = 0; i < pos.length; i++) { const j = (i + 1 + (i * 3) % 4) % pos.length, ln = [pos[i], mix(pos[i], pos[j], .5), pos[j]]; ln[1][1] += R0 * .12;
        out.push({ pts: ln, color: B, alpha: .3 }); if (i < act * 5) spark(ln, t * .9 + i * .31, out, B); } }
    else if (d.brain === 'spiral') { for (let s = 0; s < 2; s++) { const pts = [];
        for (let i = 0; i <= 90; i++) { const u = i / 90, a = u * TAU * 4.5 + s * Math.PI + t * .35, rr = .12 + .85 * u; pts.push(P([Math.cos(a) * rr, (u - .5) * 1.1 * (s ? -1 : 1), Math.sin(a) * rr])); }
        out.push({ pts, color: B, alpha: .55 }); for (let k = 0; k < Math.round(act * 2); k++) spark(pts, t * .3 + k * .41 + s * .5, out, B); } }
    else if (d.brain === 'crystal') { for (const [sc, dir, al] of [[1, 1, .55], [.5, -1.7, .7]]) { const a = t * .3 * dir + d.phase, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(a * .6), sb = Math.sin(a * .6);
        const V = ICO.v.map(q => { const x = q[0] * ca + q[2] * sa, z = -q[0] * sa + q[2] * ca, y = q[1] * cb - z * sb, z2 = q[1] * sb + z * cb; return P([x * sc, y * sc, z2 * sc]); });
        ICO.e.forEach(([i, j], k) => { out.push({ pts: [V[i], V[j]], color: B, alpha: al }); if (k % 7 < act * 1.5) spark([V[i], V[j]], t * 1.2 + k * .13, out, B, 2.2); }); } }
    else if (d.brain === 'twin') { for (const sd of [-1, 1]) { const k = 1 + .09 * Math.sin(t * 2.2 + (sd > 0 ? Math.PI : 0)) * (.5 + act), cc = P([sd * .48, 0, 0]); ball(cc, R0 * .46 * k, R0 * .6 * k, R0 * .7 * k, out, B, .5, 4, 20); }
      for (let i = 0; i < 5; i++) { const y = (i - 2) * .16, ln = [P([-.3, y, 0]), P([0, y + .08, .1]), P([.3, y, 0])]; out.push({ pts: ln, color: B, alpha: .4 }); if (i < act * 3) spark(ln, t * 1.4 + i * .23, out, B); } }
    else { for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + d.phase, b = Math.sin(i * 2.4) * 1.1, tip = [Math.cos(b) * Math.cos(a), Math.sin(b), Math.cos(b) * Math.sin(a)], pts = [];   // web: neurons from a core
        for (let k = 0; k <= 6; k++) { const u = k / 6, wv = Math.sin(u * 6 + t * 1.5 + i) * .08 * u; pts.push(P([tip[0] * u + wv, tip[1] * u + wv * .5, tip[2] * u - wv])); }
        out.push({ pts, color: B, alpha: .45 }); if (i % 3 < act * 2) spark(pts, t * .8 + i * .17, out, B); const r = R0 * .05; ball(pts[6], r, r, r, out, B, .5, 1, 8); }
      ball(c, R0 * .16, R0 * .16, R0 * .16, out, B, .7, 2, 12); }
    out.push({ haze: c, r: R0 * 1.5, color: B, alpha: .1 + .12 * Math.min(1, act) });
    // the brain stem runs down into the spine
    out.push({ pts: [P([0, -.8, -.1]), [0, H.yOf(d.vm) - d.jawLen * .35, H.hingeZ - .05], [0, -d.jawLen * .8, -d.neckR * .55]], color: B, alpha: .35 }); }
  /* ----- neck, spine, chest ----- */

  { const n = 9, y0 = -d.jawLen * .93, y1 = H.bottom + d.chestH * .2, z = -d.neckR * .3 - .08, col = [];   // vertebrae
    for (let i = 0; i < n; i++) { const y = lerp(y0, y1, i / (n - 1)), w = .05 + .012 * i, zz = z - .04 * Math.sin(i / (n - 1) * Math.PI);
      out.push({ pts: [[-w * 1.2, y, zz], [w * 1.2, y, zz]], color: C.bone, alpha: .5, w: 1.8 });
      out.push({ pts: [[-w, y, zz], [-w * 2.2, y - .02, zz - .03]], color: C.bone, alpha: .35 }, { pts: [[w, y, zz], [w * 2.2, y - .02, zz - .03]], color: C.bone, alpha: .35 }); col.push([0, y, zz]); }
    out.push({ pts: col, color: C.bone, alpha: .3 }); }
  const breath = st.breath, swell = 1 + .13 * breath;
  { const b = H.body, n = b.ribN, kb = .9 * (1 + .035 * breath);   // the ribcage: hoops, open ribs, drooping claws, a fan or one long spiral
    if (b.ribStyle === 'spiral') { const pts = []; for (let k = 0; k <= 200; k++) { const u = .15 + .7 * k / 200; pts.push(b.B(u, k / 200 * n * TAU * .55, kb)); } out.push({ pts, color: C.bone, alpha: .5 }); }
    else for (let i = 0; i < n; i++) { const u0 = .17 + .66 * (i + .5) / n, gap = b.ribStyle === 'hoops' ? 0 : b.ribStyle === 'fan' ? .95 : .4, droop = (b.ribStyle === 'claw' ? .26 : b.ribStyle === 'fan' ? .05 + .12 * (i - n / 2) / n * 2 : .1 * b.ribDroop);
      for (const sd of [-1, 1]) { const pts = []; for (let k = 0; k <= 22; k++) { const a = lerp(Math.PI, gap, k / 22); pts.push(b.B(clamp(u0 + droop * (1 - a / Math.PI), .05, .97), sd * a, kb)); } out.push({ pts, color: C.bone, alpha: .5 }); } } }
  /* ----- eyes: ball, rings, lids, pupil, and a nerve back to the brain ----- */
  H.eyes.forEach((e, ei) => { let f, c; const blink = st.blinks[ei] || 0;
    if (e.stalk) { const base = S(e.v, e.th, 0), dir = norm([base[0] * .8, .9, base[2] * .5 + .25]), sway = Math.sin(t * 1.5 + e.ph) * .07 * (1 - .7 * st.perk), len = e.len * (1 + .2 * st.perk);
      const tip = [base[0] + dir[0] * len + sway, base[1] + dir[1] * len, base[2] + dir[2] * len + sway * .6], stalk = [base, [lerp(base[0], tip[0], .5) + sway * .3, lerp(base[1], tip[1], .55), lerp(base[2], tip[2], .4)], tip];
      tube(stalk, () => e.s * .22, 5, out, FEAT, .45, 2);
      const n = norm([dir[0] * .5, .05, 1]), tu = norm(cross([0, 1, 0], n)); f = { c: tip, n, tu, tv: cross(n, tu) }; c = tip; }
    else { f = H.frame(e.v, e.th, 0); c = add(f.c, f.n, e.s * d.bug * .12); }
    const es = e.s, bc = add(c, f.n, -es * .55);
    out.push({ eye: e.stalk ? c : add(f.c, f.n, es * .04), n: f.n, r: es * (1 + .1 * st.widen), blink, ei });   // the eye itself is drawn by draw(), set into the skin
    if (ei < 8) out.push({ haze: c, r: es * 2.2, color: FEAT, alpha: .16 * (1 - blink) });
    if (ei < 7) { const nerve = [bc, mix(bc, H.brainC, .5), H.brainC]; nerve[1][1] += .06; out.push({ pts: nerve, color: C.brain, alpha: .28 }); if (blink > .3 || (ei + Math.floor(t * 1.3)) % 5 === 0) spark(nerve, t * 1.5 + ei * .3, out, C.brain, 2); } });
  /* ----- nose ----- */
  const nv = lerp(d.mouthV, d.eyeV, .5), sniff = 1 + .1 * Math.max(0, Math.sin(t * 3 + d.phase)) * (breath > .6 ? 1 : 0);
  if (d.nose === 'slits') for (const s of [-1, 1]) out.push({ pts: [S(nv + .03, s * .07, 0), S(nv - .03, s * .11 * sniff, 0)], color: FEAT, alpha: .8, w: 1.5 });
  else if (d.nose !== 'none') { const pts = [], n = 9, len = d.noseLen * (d.nose === 'ridge' ? .55 : 1);
    for (let i = 0; i <= n; i++) { const u = i / n, v = lerp(d.eyeV + .02, nv - .05, u), p = S(v, 0, 0), bump = d.nose === 'hook' ? Math.pow(Math.sin(Math.PI * Math.pow(u, .7)), 1.3) : Math.sin(Math.PI * u);
      pts.push([p[0], p[1], p[2] + len * d.crown * bump]); }
    if (d.nose === 'trunk') { const path = [];
      for (let i = 0; i <= 8; i++) { const u = i / 8; path.push([Math.sin(t * 1.3 + u * 3 + d.phase) * .05 * u, lerp(H.yOf(nv), H.yOf(d.mouthV) - .5 * d.jawLen, u), S(nv, 0, 0)[2] + d.noseLen * d.crown * (1 + .6 * Math.sin(u * 2.4))]); }
      tube(path, u => .05 * d.crown * (1 - .5 * u) * (1 + .15 * Math.sin(u * 9 - t * 5) * (.2 + amp)), 6, out, FEAT, .6); }
    else { out.push({ pts, color: FEAT, alpha: .85 }); for (const s of [-1, 1]) out.push({ pts: [pts[n - 2], S(nv - .04, s * .1 * sniff, 0), pts[n]], color: FEAT, alpha: .5 }); } }
  /* ----- mouth: lips, every tooth, mandibles, jawbone, tongue ----- */
  const mw = d.mouthW * (1 - .5 * m.round), up = [], lo = [], gap = .006 + .02 * m.lip, vert = d.mouthKind === 'vertical';
  for (let i = 0; i <= 16; i++) { const edge = Math.pow(Math.sin(Math.PI * i / 16), .6); let a, b;
    if (vert) { const v = lerp(d.mouthV - mw * .2, d.mouthV + mw * .2, i / 16), sp = (.012 + .05 * m.lip + .14 * m.jaw) * edge; a = S(v, -sp, 0); b = S(v, sp, 0); }
    else { const th = lerp(-mw, mw, i / 16); a = S(d.mouthV + gap * edge, th, 0); b = S(d.mouthV - gap * edge - .004, th, open); }
    up.push([a[0], a[1], a[2] + .012]); lo.push([b[0], b[1], b[2] + .012]); }
  out.push({ pts: up, color: FEAT, alpha: 1, w: 1.6 }, { pts: lo, color: FEAT, alpha: 1, w: 1.6 });
  if (d.teeth) { const tl = (d.teeth === 1 ? .05 : d.teeth === 2 ? .06 : .1) * d.jawLen;
    const tooth = (row, i, dir, len, taper) => { const a = row[i], b = row[i + 1], off = vert ? [dir * len, 0, -.012] : [0, -dir * len, -.012], mid = mix(a, b, .5);
      out.push({ pts: taper ? [a, add(mid, off), b] : [a, add(mix(a, b, .12), off), add(mix(a, b, .88), off), b], head: 1, color: C.bone, alpha: .8 }); };
    for (let i = 2; i < 14; i++) { const fang = d.teeth === 2 && (i === 3 || i === 12);
      if (d.teeth === 3) { for (const f of [.25, .75]) { const a = mix(up[i], up[i + 1], f), b = mix(lo[i], lo[i + 1], f); out.push({ pts: [a, add(a, vert ? [tl * .7, 0, 0] : [0, -tl, 0])], head: 1, color: C.bone, alpha: .75 }, { pts: [b, add(b, vert ? [-tl * .6, 0, 0] : [0, tl * .8, 0])], head: 1, color: C.bone, alpha: .6 }); } continue; }
      tooth(up, i, 1, tl * (fang ? 2.6 : 1), fang || d.teeth === 2); if (!fang) tooth(lo, i, -1, tl * .8, d.teeth === 2); } }
  if (d.mandibles) for (const sd of [-1, 1]) { const base = S(d.mouthV - .01, sd * d.mouthW * (vert ? .5 : 1.05), open * .3), sp = .1 + .9 * m.jaw + .5 * st.chatter, Lm = d.mandibles, path = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8; path.push([base[0] + sd * Lm * (.4 * Math.sin(Math.PI * u) * (.6 + sp) - .5 * u * (1 - sp)), base[1] - Lm * .85 * u, base[2] + Lm * .45 * Math.sin(Math.PI * u * .8)]); }
    tube(path, u => Lm * .11 * (1 - .85 * u), 5, out, FEAT, .8); }
  for (const sd of [-1, 1]) { const pts = [];   // jawbone, from the hinge round to the chin
    for (let i = 0; i <= 10; i++) { const u = i / 10, p = S(lerp(d.mouthV + .1, .035, Math.pow(u, .7)), sd * lerp(1.95, .12, u), open); pts.push([p[0] * .93, p[1], p[2] * .93]); }
    out.push({ pts, color: FEAT, alpha: .95, w: 1.3 }); }
  const lipP = S(d.mouthV - .002, 0, open * .5), L0 = [0, lipP[1], lipP[2] * .96], corner = [0, H.mouthY + .05, -.18 * d.crown * d.depth], G = [0, -d.jawLen - d.neckLen * .42, -.1];
  const r0 = Math.min(.11 * d.crown, d.neckR * .5), hot = .22 + .78 * amp;
  { const drop = open * d.jawSwing * .16, front = m.at < .3 ? m.tight : 0, back = m.at >= .3 && m.at < .75 ? m.tight : 0, path = [];   // the tongue reaches for where the sound is made
    const P0 = [0, H.mouthY - r0 * 1.5 - drop, corner[2] * .7], P1 = [0, H.mouthY - r0 * 1.1 - drop + back * r0 * 1.3, lerp(corner[2], L0[2], .5)], P2 = [0, L0[1] - r0 * .9 - drop * .8 + front * r0 * 1.2, L0[2] * (.8 + .12 * m.lip)];
    for (let i = 0; i <= 7; i++) { const u = i / 7, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c2 = u * u; path.push([0, a * P0[1] + b * P1[1] + c2 * P2[1], a * P0[2] + b * P1[2] + c2 * P2[2]]); }
    const rings = tube(path, u => r0 * (.75 - .4 * u * u), 8, out, C.lung, .5, 2); rings.forEach((g, gi) => { for (const q of g) q[1] = lerp(q[1], path[gi][1], .45); }); }   /* flattened: a tongue, not a pipe */
  /* ----- the vocal tract: lips → back of the mouth → down the throat. Its shape is the sound being made. ----- */
  { const path = [], N = 20;
    for (let i = 0; i <= N; i++) { const u = i / N, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u; path.push([0, a * L0[1] + b * corner[1] + c * G[1], a * L0[2] + b * corner[2] + c * G[2]]); }
    const rings = tube(path, u => { let r = r0 * (.5 + .5 * Math.sin(Math.PI * Math.pow(u, .8))) * (1 - m.tight * Math.exp(-Math.pow((u - m.at) / .11, 2)));
      if (u < .12) r = lerp(r0 * (.12 + 1.5 * m.lip) * (1 - .4 * m.round), r, u / .12); if (u > .9) r *= lerp(1, .35, (u - .9) / .1); return Math.max(.004, r); }, 10, out, TRACT, hot);
    out.push({ haze: path[6], r: r0 * 4, color: TRACT, alpha: .22 * amp });
    const g = rings[rings.length - 1], pulse = .5 + .5 * Math.sin(t * 40);   // the vocal folds flicker when voiced
    out.push({ pts: g.map(p => [p[0] * (1 + .5 * amp * pulse), p[1] - .01, (p[2] - G[2]) * (1 + .5 * amp * pulse) + G[2]]), closed: true, color: FEAT, alpha: .35 + .65 * amp, w: 2 });
    if (d.nasal) { const np = S(nv - .02, 0, 0), pathN = [path[9], [0, lerp(path[9][1], np[1], .6), path[9][2] + .03], [0, np[1], np[2] * .82]];   // a passage up to the nose
      tube(pathN, u => r0 * .3 * (1 + .25 * Math.sin(u * 7 - t * 6) * amp), 6, out, TRACT, hot * .6, 2); } }
  /* ----- breathing: windpipes of different bores, air sacs that fill and empty, and a diaphragm ----- */
  { const cy = H.chestTop - d.chestH * .45, n = d.sacs, floorY = H.chestTop - d.chestH * .86, sacs = [];
    for (let i = 0; i < n; i++) { const x = n === 1 ? 0 : lerp(-1, 1, i / (n - 1)) * d.chestW * .42, big = 1 - .25 * Math.abs(n === 1 ? 0 : lerp(-1, 1, i / (n - 1))), flutter = 1 + .05 * Math.sin(t * 19 + i) * amp;
      const c = [x, cy + .05 * Math.cos(i * 2.1), -.1], rx = d.sacSize * d.chestW * big * swell * flutter, ry = rx * 1.35; sacs.push({ c, ry });
      ball(c, rx, ry, rx * .8, out, C.lung, .42, 4, 18); out.push({ haze: c, r: ry * 1.5, color: C.lung, alpha: .07 + .1 * amp }); }
    d.pipes.forEach((bore, i) => { const s = sacs[i % n], side = n === 1 ? (i - (d.pipes.length - 1) / 2) * .08 : 0, path = [];
      const A = [G[0] + side, G[1] - .02, G[2]], B = [lerp(A[0], s.c[0], .25), lerp(A[1], s.c[1] + s.ry, .6), -.1], Z = [s.c[0], s.c[1] + s.ry * .85, s.c[2]];
      for (let k = 0; k <= 9; k++) { const u = k / 9, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u; path.push([a * A[0] + b * B[0] + c * Z[0], a * A[1] + b * B[1] + c * Z[1], a * A[2] + b * B[2] + c * Z[2]]); }
      tube(path, u => r0 * .62 * bore * (1 + .22 * Math.sin(u * 10 + t * 7) * amp), 7, out, TRACT, .3 + .5 * amp, 2);   // ripples run up the pipe while it speaks
      if (amp > .05 || breath > .2) spark(path, 1 - ((t * (amp > .05 ? 1.6 : .35) + i * .4) % 1), out, TRACT, 2.2); });
    const W = d.chestW * .78, lift = .5 + .5 * breath - .7 * amp;   // the diaphragm drops to breathe in and kicks up to push air out
    if (d.diaphragm === 'bellows') { for (let i = 0; i < 5; i++) { const y = floorY + i * .045 * (1.4 - lift), w = W * (i % 2 ? .78 : 1), pts = []; for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; pts.push([Math.sin(a) * w, y, Math.cos(a) * w * .55 - .12]); } out.push({ pts, closed: true, color: C.lung, alpha: .5 }); } }
    else { const h = d.chestH * (d.diaphragm === 'cone' ? .34 : .22) * (.35 + .65 * (1 - lift)), spokes = [];
      for (let j = 0; j <= 4; j++) { const u = j / 4, w = W * (1 - u * .96), y = floorY + h * (d.diaphragm === 'cone' ? u : Math.sin(u * Math.PI / 2)), pts = [];
        for (let k = 0; k < 26; k++) { const a = k / 26 * TAU; pts.push([Math.sin(a) * w, y, Math.cos(a) * w * .55 - .12]); } out.push({ pts, closed: true, color: C.lung, alpha: .5 - .06 * j }); spokes.push(pts); }
      for (let k = 0; k < 26; k += 4) out.push({ pts: spokes.map(g => g[k]), color: C.lung, alpha: .3 }); } }
  /* ----- outside extras ----- */
  for (let a = 0; a < d.antennae; a++) { const side = d.antennae === 1 ? 0 : d.antennae === 3 ? a - 1 : a * 2 - 1, base = S(.93, side * .9, 0), path = [], splay = d.antSplay * (1 - .8 * st.perk);
    for (let i = 0; i <= 8; i++) { const u = i / 8, sway = Math.sin(t * 1.7 + a * 2 + d.phase) * .06 * u * u * (1 - st.perk); path.push([base[0] + side * splay * d.antLen * u * u + sway, base[1] + d.antLen * (u - .25 * u * u * (1 - st.perk)), base[2] + .12 * d.antLen * u * u + sway * .5]); }
    out.push({ pts: path, color: FEAT, alpha: .8 }); const tip = path[8], r = .035 + .02 * amp + .015 * st.perk; ball(tip, r, r, r, out, FEAT, .9, 1, 10); }
  if (d.horns) for (const side of [-1, 1]) { const base = S(d.vm + .35 * (1 - d.vm), side * 1.9, 0), path = [], R0 = d.horns * .9, Cn = [base[0], base[1] + R0 * .2, base[2] - R0], ph0 = Math.atan2(-.2, 1);
    for (let i = 0; i <= 18; i++) { const u = i / 18, R = R0 * (1 - .5 * u), ph = ph0 + u * d.hornTurns * TAU; path.push([Cn[0] + side * d.horns * 1.1 * u, Cn[1] + R * Math.sin(ph), Cn[2] + R * Math.cos(ph)]); }
    tube(path, u => d.horns * .24 * (1 - .82 * u), 7, out, FEAT, .7); }
  if (d.fins) for (const side of [-1, 1]) { const tips = [], flap = 1 + .25 * Math.sin(t * 2.3 + d.phase) * (.3 + amp) + .3 * st.perk;
    for (let i = 0; i < d.finRays; i++) { const u = i / (d.finRays - 1), base = S(lerp(d.eyeV - .12, d.eyeV + .14, u), side * 1.57, 0), tip = [base[0] + side * d.fins * (.6 + .4 * Math.sin(Math.PI * u)) * flap, base[1] + d.fins * (u - .3) * .8, base[2] - d.fins * .5 / flap];
      out.push({ pts: [base, tip], color: FEAT, alpha: .55 }); tips.push(tip); }
    out.push({ pts: tips, color: FEAT, alpha: .8 }); }
  if (d.crest) { const tips = [];
    for (let i = 0; i < d.crestN; i++) { const u = i / (d.crestN - 1), base = u < .5 ? S(lerp(.8, .992, u * 2), 0, 0) : S(lerp(.992, .7, (u - .5) * 2), Math.PI, 0), dir = norm(sub(base, [0, d.tall * .35, 0])), tip = add(base, dir, d.crest * (.45 + .55 * Math.sin(Math.PI * u)) * (1 + .35 * st.perk));
      out.push({ pts: [base, tip], color: FEAT, alpha: .6 }); tips.push(tip); }
    out.push({ pts: tips, color: FEAT, alpha: .85 }); }
  for (let i = 0; i < d.tentacles; i++) { const th = lerp(-1.1, 1.1, d.tentacles === 1 ? .5 : i / (d.tentacles - 1)), base = S(.04, th, open), path = [];
    for (let k = 0; k <= 10; k++) { const u = k / 10, wv = Math.sin(t * 2.1 + i * 1.3 + u * 4 + d.phase) * .07 * u * (1 + amp); path.push([base[0] + wv + Math.sin(th) * .1 * u, base[1] - d.tentLen * u, base[2] + Math.cos(t * 1.6 + i + u * 3) * .05 * u + .05 * u]); }
    tube(path, u => .035 * d.crown * (1 - .8 * u), 5, out, FEAT, .45); }
  return out;
}

/* ---------- mouth shapes: what each sound does to the jaw, lips and tongue ---------- */
const PLACE = { p: 'lip', b: 'lip', m: 'lip', f: 'liptooth', v: 'liptooth', w: 'round', t: 'front', d: 'front', n: 'front', s: 'front', z: 'front', l: 'front', r: 'front', 'ř': 'front', 'þ': 'front', 'ł': 'front', c: 'front',
  'š': 'mid', 'ž': 'mid', j: 'mid', k: 'back', g: 'back', 'ŋ': 'back', x: 'back', q: 'deep', h: 'throat', 'ʔ': 'throat' };
function shapeOf(key, sounds) {
  const p = key && sounds[key]; if (!p) return { jaw: 0, lip: .1, round: 0, at: .5, tight: 0, f: null };
  if (p.t === 'V') { const open = clamp((p.f[0] - 250) / 520, 0, 1), front = clamp((p.f[1] - 700) / 1650, 0, 1), round = 'ouyö'.includes(key) ? .8 : 0;
    return { jaw: .18 + .8 * open, lip: .25 + .75 * open, round, at: .55 - .42 * front, tight: .62 * (1 - open), f: p.f }; }
  const hard = p.t === 'stop' || p.t === 'nasal' || p.t === 'click' || p.t === 'glottal' ? .96 : .82, pl = PLACE[key] || 'front';
  const base = { jaw: .14, lip: .3, round: 0, at: .14, tight: hard, f: p.f || null };
  if (pl === 'lip') return { ...base, jaw: .04, lip: 0, tight: .2, at: .3 };
  if (pl === 'liptooth') return { ...base, jaw: .08, lip: .06, tight: .2, at: .3 };
  if (pl === 'round') return { ...base, jaw: .12, lip: .2, round: 1, at: .5, tight: .6 };
  if (pl === 'mid') return { ...base, at: .26 }; if (pl === 'back') return { ...base, jaw: .2, at: .5 };
  if (pl === 'deep') return { ...base, jaw: .24, at: .64 }; if (pl === 'throat') return { ...base, jaw: .22, lip: .45, at: .97 };
  return base;
}

/* ---------- the instrument: draws, animates, listens for speech ---------- */
function create(canvas, opts) {
  const sounds = opts.sounds, ctx = canvas.getContext('2d');
  let H = build(makeDNA(1)), info = { name: '' }, speech = null, env = null, last = performance.now(), T = 0;
  const m = { jaw: 0, lip: .1, round: 0, at: .5, tight: 0 }, F = [0, 500, 1500];
  const drag = { yaw: 0, pitch: 0, on: false, x: 0, y: 0, idle: 0 }, ptr = { x: 0, y: 0, t: -99 };
  const pose = { yaw: 0, pitch: 0, roll: 0, zoom: 1 }, st = { blinks: [], look: [0, 0], breath: 0, perk: 0, widen: 0, think: 0, chatter: 0 };
  const hist = new Float32Array(200); let hi = 0, histT = 0;
  let blinkAt = [], lookTo = [0, 0], nextLook = 1, amp = 0, caption = null, subs = null, segIdx = 0, gest = null, nextGest = 3, jerk = 0, nextJerk = 2, yawn = 0;

  function setSeed(seed) { H = build(makeDNA(seed >>> 0)); st.blinks = H.eyes.map(() => 0); blinkAt = H.eyes.map(() => 1 + Math.random() * H.d.temper.blink); gest = null; nextGest = 2 + Math.random() * 3; }
  function envelope(buf) {
    const d = buf.getChannelData(0), hop = Math.round(buf.sampleRate / 100), n = Math.ceil(d.length / hop), e = new Float32Array(n);
    for (let i = 0; i < n; i++) { let s = 0; const o = i * hop, len = Math.min(hop, d.length - o); for (let j = 0; j < len; j++) s += d[o + j] * d[o + j]; e[i] = Math.sqrt(s / Math.max(1, len)); }
    const sorted = Float32Array.from(e).sort(), ref = sorted[Math.floor(n * .95)] || 1e-6; for (let i = 0; i < n; i++) e[i] = Math.min(1, e[i] / ref); return e;
  }
  // subtitles: the words of the speech in short lines (up to four words or about twenty letters), split where the speaker pauses
  function subtitles(segs) { const words = []; let cur = null;
    for (const s of segs) { if (s.k && s.w) { if (!cur) { cur = { w: s.w, en: s.en || '', t0: s.t, t1: s.t + s.d }; words.push(cur); } else cur.t1 = s.t + s.d; } else cur = null; }
    const out = []; let line = [], len = 0; words.forEach((w, i) => { line.push(w); len += Math.max(w.w.length, w.en.length * .6); const nx = words[i + 1]; if (!nx || line.length >= 4 || len + Math.max(nx.w.length, nx.en.length * .6) > 20 || nx.t0 - w.t1 > .3) { out.push(line); line = []; len = 0; } }); return out.length ? out : null; }
  function speak(s) { speech = s; env = s.buf ? envelope(s.buf) : null; segIdx = 0; caption = null; gest = null; subs = s.timeline && s.timeline.segs ? subtitles(s.timeline.segs) : null; }
  function stop() { speech = null; env = null; caption = null; subs = null; }

  function step(dt) {
    T += dt; const d = H.d, tp = d.temper; let target = shapeOf(null, sounds), loud = 0, f0 = 0, stressed = false;
    if (speech) { const now = speech.clock();
      if (env) { const i = Math.floor(now * 100); loud = i >= 0 && i < env.length ? env[i] : 0; if (now > env.length / 100 + .3) stop(); }
      const segs = speech && speech.timeline && speech.timeline.segs;
      if (segs && segs.length) { if (segIdx >= segs.length || segs[segIdx].t > now) segIdx = 0;
        while (segIdx < segs.length - 1 && segs[segIdx].t + segs[segIdx].d <= now) segIdx++;
        const sg = segs[segIdx];
        if (now >= sg.t && now < sg.t + sg.d + .02) { target = shapeOf(sg.k, sounds); if (sg.k) { f0 = sg.p || 0; stressed = sg.a === 1 && sounds[sg.k] && sounds[sg.k].t === 'V'; if (sg.w) caption = { w: sg.w, en: sg.en || '' }; } } }
      else if (loud > .08) target = { jaw: .25 + .6 * loud, lip: .3 + .6 * loud, round: 0, at: .4, tight: .3 * (1 - loud), f: null };   // no timings: follow the loudness
      const gate = env ? smooth(loud * 2.2) : 1; target = { ...target, jaw: target.jaw * (.35 + .65 * gate), lip: target.lip * (.4 + .6 * gate) };
    }
    // habits: every few seconds the creature does one of its three things
    if (!gest) { nextGest -= dt; if (nextGest < 0) { const type = d.habits[Math.floor(Math.random() * d.habits.length)];
        if (!(speech && (type === 'yawn' || type === 'chatter'))) gest = { type, t: 0, dur: type === 'shiver' ? .7 : type === 'yawn' ? 2.4 : type === 'glance' ? 1.6 : 1.9, dir: Math.random() < .5 ? -1 : 1 };
        nextGest = tp.every * (.5 + Math.random()) * (speech ? 1.6 : 1); } }
    else { gest.t += dt; if (gest.t >= gest.dur) gest = null; }
    const ge = gest ? Math.sin(Math.PI * gest.t / gest.dur) : 0, gdir = gest ? gest.dir : 0, is = k => gest && gest.type === k ? ge : 0, hold = k => gest && gest.type === k ? smooth(Math.min(1, ge * 2.2)) : 0;
    yawn = is('yawn'); st.chatter = is('chatter') ? .5 + .5 * Math.sin(T * 38) : 0;
    const k = 1 - Math.exp(-dt / .045);
    if (!speech && yawn > 0) target = { ...target, jaw: .95 * yawn, lip: .8 * yawn };
    for (const key of ['jaw', 'lip', 'round', 'at', 'tight']) m[key] += (target[key] - m[key]) * (yawn > 0 ? k * .25 : k);
    amp += (loud - amp) * (1 - Math.exp(-dt / .05));
    histT += dt; while (histT > 1 / 60) { histT -= 1 / 60; hist[hi] = amp; hi = (hi + 1) % hist.length; }   // loudness, 60 times a second, for the spiral scope
    if (target.f) for (let i = 1; i < 3; i++) F[i] += (target.f[i - 1] - F[i]) * k;
    F[0] += ((speech && f0) - F[0]) * (1 - Math.exp(-dt / .08));
    // breathing, perking up, widening eyes, thinking
    st.breath = Math.sin(T * TAU * d.breath * (speech ? 1.5 : 1) + d.phase);
    st.perk += ((is('perk') || (speech ? .25 * amp : 0)) - st.perk) * .12; st.widen += ((is('perk') * .8 + amp * .5 + (stressed ? .3 : 0)) - st.widen) * .15; st.think += ((hold('glance') * .4) - st.think) * .1;
    // eyes: each blinks on its own clock; a pointer nearby holds their gaze
    H.eyes.forEach((e, i) => { blinkAt[i] -= dt; if (blinkAt[i] < 0) { st.blinks[i] = 1; blinkAt[i] = tp.blink * (.35 + Math.random() * 1.3); if (Math.random() < .18) blinkAt[i] = .22; } st.blinks[i] = Math.max(yawn * .8, (st.blinks[i] || 0) - dt * 7.5); });
    const watching = T - ptr.t < 3.5;
    nextLook -= dt; if (watching) lookTo = [ptr.x, -ptr.y]; else if (nextLook < 0) { lookTo = [Math.random() * 2 - 1, Math.random() * 2 - 1]; nextLook = .5 + Math.random() * 2.6 / (.5 + tp.twitch); }
    st.look[0] += (lookTo[0] - st.look[0]) * .16; st.look[1] += (lookTo[1] - st.look[1]) * .16;
    // twitches
    if (tp.twitch) { nextJerk -= dt; if (nextJerk < 0) { jerk = (Math.random() - .5) * .3 * tp.twitch; nextJerk = .6 + Math.random() * 3 / tp.twitch; } jerk *= Math.exp(-dt / .12); }
    if (!drag.on) { drag.idle += dt; if (drag.idle > 2.5) { drag.yaw *= .97; drag.pitch *= .97; } }
    // where the head ends up pointing
    const ty = Math.sin(T * tp.speed + d.phase) * tp.sway + Math.sin(T * tp.speed * .43) * tp.sway * .4 + (watching ? ptr.x * .5 * tp.curious : 0) + hold('glance') * gdir * .75 + is('shiver') * Math.sin(T * 46) * .05 + jerk + drag.yaw;
    const tpch = Math.sin(T * tp.speed * .7) * .05 + (watching ? ptr.y * .22 * tp.curious : 0) - amp * .05 * tp.nod - (stressed ? .05 * tp.nod : 0) + is('lean') * .14 - yawn * .22 + st.breath * .012 + drag.pitch;
    const troll = hold('tilt') * gdir * .3 + is('roll') * Math.sin(gest ? gest.t / gest.dur * TAU : 0) * .22 + jerk * .4 + Math.sin(T * tp.speed * .31 + 1) * .03;
    const ease = 1 - Math.exp(-dt / .09);
    pose.yaw += (ty - pose.yaw) * ease; pose.pitch += (tpch - pose.pitch) * ease; pose.roll += (troll - pose.roll) * ease; pose.zoom += ((1 + is('lean') * .07) - pose.zoom) * ease;
  }

  function draw() {
    const W = canvas.width, Hh = canvas.height, dpr = W / Math.max(1, canvas.clientWidth || W), C = H.col, WIREc = C.wire, d = H.d;
    ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0; ctx.fillStyle = '#060607'; ctx.fillRect(0, 0, W, Hh);
    const short = Hh < 230 * dpr, hud = (short ? 30 : 70) * dpr, topPad = (short ? 10 : 30) * dpr, narrow = matchMedia("(max-width:850px)").matches && !short, low = H.body.top - H.body.h * (narrow ? .4 : .55), span = H.top - low, wide = Math.max(2 * H.reach + .3 + (d.fins || d.horns ? .5 : 0), H.body.w * 2.1) * (narrow ? .86 : 1);   // the body runs off the bottom
    const scale = Math.min(W / wide, (Hh - hud - topPad) / (span * 1.02)) * pose.zoom, cx = W / 2, cy = topPad + (Hh - hud - topPad) * .5 + (H.top + low) / 2 * scale;
    const cyaw = Math.cos(pose.yaw), syaw = Math.sin(pose.yaw), cp = Math.cos(pose.pitch), sp = Math.sin(pose.pitch), cr = Math.cos(pose.roll), sr = Math.sin(pose.roll), cam = 4.6, pivot = -d.jawLen * .6;
    const buckets = {}, sketch = d.ink === 'sketch', boil = Math.floor(T * 7), rough = d.rough * dpr, hz = [], eyes = [], bones = { head: {}, back: {}, front: {} };
    const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const proj = p => { const wob = amp * .006 * Math.sin(p[1] * 37 + T * 31), neck = smooth((p[1] - H.chestTop) / (d.neckLen * .8 + .01));   // the chest stays put; the head turns on the neck
        const px = p[0] + wob, py = p[1] - pivot, x0 = lerp(px, px * cr - py * sr, neck), y0 = lerp(py, px * sr + py * cr, neck), ya = lerp(1, cyaw, neck), sa = syaw * neck;
        let x = x0 * ya + p[2] * sa, z = -x0 * sa + p[2] * ya, y = y0 * lerp(1, cp, neck) - z * sp * neck; z = y0 * sp * neck + z * lerp(1, cp, neck); y += pivot;
        const f = cam / (cam - z); return [cx + x * scale * f, cy - y * scale * f, z]; };
    let si = 0;
    for (const ln of lines(H, m, T, amp, st)) {
      if (ln.haze) { const q = proj(ln.haze); hz.push([q[0], q[1], ln.r * scale * 2, ln.color, Math.min(.6, ln.alpha * 2.2)]); continue; }
      if (ln.eye) { const q = proj(ln.eye), q2 = proj(add(ln.eye, ln.n, .05)); let nx = q2[0] - q[0], ny = q[1] - q2[1], nz = (q2[2] - q[2]) * scale; const l = Math.hypot(nx, ny, nz) || 1;   // which way the eye faces, as seen
        eyes.push({ x: q[0], y: q[1], r: ln.r * scale * .97 * cam / (cam - q[2]), nx: nx / l, ny: ny / l, nz: nz / l, blink: ln.blink, ei: ln.ei }); continue; }
      const P = ln.pts.map(proj), n = P.length, end = ln.closed ? n : n - 1;
      if (ln.color === C.bone) {   // bones are clay rolls under the skin: the head's (teeth), and the body's far and near sides
        for (let i = 0; i < end; i++) { const a = P[i], b = P[(i + 1) % n], g = ln.head ? bones.head : (a[2] + b[2]) / 2 < -.24 ? bones.back : bones.front; (g[ln.w || 1] ||= []).push(a[0], a[1], b[0], b[1]); } continue; }
      const plainLn = ln.color === WIREc;
      for (let i = 0; i < end; i++) { let a = P[i], b = P[(i + 1) % n]; si++;
        if (sketch) { if (rnd(si) < (plainLn ? .3 : .1)) continue;   /* a hand-drawn line: gaps, and ends that never quite meet, redrawn a few times a second */
          const j = si * 4 + boil * 977, k2 = rough * (plainLn ? 1.5 : 1.1) * (ln.w ? .6 : 1); a = [a[0] + (rnd(j) - .5) * 2 * k2, a[1] + (rnd(j + 1) - .5) * 2 * k2, a[2]]; b = [b[0] + (rnd(j + 2) - .5) * 2 * k2, b[1] + (rnd(j + 3) - .5) * 2 * k2, b[2]]; }
        const depth = smooth(((a[2] + b[2]) / 2 + 1.1) / 2.2), lvl = Math.max(1, Math.round(ln.alpha * (.22 + .78 * depth) * 6)), key = ln.color + '|' + lvl + '|' + (ln.w || 1);
        (buckets[key] ||= []).push(a[0], a[1], b[0], b[1]); }
    }
    /* ----- the skins: a dark starfield, lit from the upper left, with the creature's colour glowing at the edges ----- */
    const fa = C.feat.split(',').map(Number); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const skin = (pt, NV, NT, flip, uo, us, ut, dim, dark, stars) => { const M = NT + 1, Q = new Array((NV + 1) * M), front = new Uint8Array(NV * NT), fills = {};
      for (let i = 0; i <= NV; i++) for (let j = 0; j <= NT; j++) Q[i * M + j] = proj(pt(i / NV, j / NT * TAU - Math.PI));
      for (let i = 0; i < NV; i++) for (let j = 0; j < NT; j++) { const a = Q[i * M + j], b = Q[i * M + j + 1], c = Q[(i + 1) * M + j + 1], e = Q[(i + 1) * M + j];
        const bx = b[0] - a[0], by = a[1] - b[1], bz = (b[2] - a[2]) * scale, ex = e[0] - a[0], ey = a[1] - e[1], ez = (e[2] - a[2]) * scale;
        let nx = by * ez - bz * ey, ny = bz * ex - bx * ez, nz = bx * ey - by * ex; if (flip) { nx = -nx; ny = -ny; nz = -nz; } const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        if (nz < .02) continue; front[i * NT + j] = 1;   // only the side facing us is drawn
        const nl = Math.max(0, -.453 * nx + .605 * ny + .655 * nz), fr = 1 - nz, ui = uo + i / NV * us, uj = j / NT * ut, aa = .5 + .5 * Math.sin(ui * .11 + uj * .07), bb = .5 + .5 * Math.sin(ui * .05 - uj * .13 + 2);
        const k = (.55 + .6 * nl) * dim * (dark ? 1 - .6 * fr * fr : 1), rim = .03 + .34 * fr * fr;
        const r = Math.min(255, (14 + 26 * aa * bb) * k + fa[0] * rim), g = Math.min(255, (16 + 46 * bb) * k + fa[1] * rim), bl = Math.min(255, (34 + 50 * aa) * k + fa[2] * rim), key = (r >> 3) << 10 | (g >> 3) << 5 | (bl >> 3);
        (fills[key] ||= []).push(a[0], a[1], b[0], b[1], c[0], c[1], e[0], e[1]); }
      for (const key in fills) { const f = fills[key], col = `rgb(${(key >> 10) * 8 + 4},${(key >> 5 & 31) * 8 + 4},${(key & 31) * 8 + 4})`; ctx.beginPath();   // one fill per shade
        for (let i = 0; i < f.length; i += 8) { ctx.moveTo(f[i], f[i + 1]); ctx.lineTo(f[i + 2], f[i + 3]); ctx.lineTo(f[i + 4], f[i + 5]); ctx.lineTo(f[i + 6], f[i + 7]); ctx.closePath(); }
        ctx.fillStyle = ctx.strokeStyle = col; ctx.fill(); ctx.lineWidth = dpr; ctx.stroke(); }
      return () => { const lv = [[], [], []];   // the stars go on last, over whatever lies under the skin
        for (let s = 0; s < stars.length; s += 4) { const fi = stars[s] * NV, fj = stars[s + 1] * NT, i = Math.min(NV - 1, fi | 0), j = Math.min(NT - 1, fj | 0); if (!front[i * NT + j]) continue;
          const u = fj - j, v = fi - i, a = Q[i * M + j], b = Q[i * M + j + 1], c = Q[(i + 1) * M + j + 1], e = Q[(i + 1) * M + j], x0 = a[0] + (b[0] - a[0]) * u, y0 = a[1] + (b[1] - a[1]) * u, x1 = e[0] + (c[0] - e[0]) * u, y1 = e[1] + (c[1] - e[1]) * u;
          lv[Math.min(2, (stars[s + 2] - .45) / .55 * 3 | 0)].push(x0 + (x1 - x0) * v, y0 + (y1 - y0) * v, stars[s + 3] * dpr); }
        lv.forEach((L, k) => { ctx.fillStyle = `rgba(255,255,255,${.5 + .22 * k})`; ctx.beginPath(); for (let i = 0; i < L.length; i += 3) ctx.rect(L[i], L[i + 1], L[i + 2], L[i + 2]); ctx.fill(); }); }; };
    // a clay roll: shadow, body, lit side. Dimmer the deeper it lies
    const clay = (groups, wd, tone) => { const pass = (style, w, dx, dy) => { for (const g of Object.keys(groups).sort((a, b) => b - a)) { const sg = groups[g], k = +g; ctx.beginPath(); for (let i = 0; i < sg.length; i += 4) { ctx.moveTo(sg[i] + dx * k, sg[i + 1] + dy * k); ctx.lineTo(sg[i + 2] + dx * k, sg[i + 3] + dy * k); } ctx.strokeStyle = style; ctx.lineWidth = w * k; ctx.stroke(); } };
      if (tone) { pass('rgba(0,0,0,.3)', wd + 3 * dpr, 1.5 * dpr, 2 * dpr); pass('rgb(84,84,98)', wd, 0, 0); pass('rgb(150,150,152)', wd * .82, -wd * .07, -wd * .09); pass('rgba(255,255,255,.3)', wd * .3, -wd * .2, -wd * .24); }
      else { pass('rgb(46,46,56)', wd, 0, 0); pass('rgb(92,92,98)', wd * .8, 0, 0); } };
    ctx.globalCompositeOperation = 'source-over';
    const B = H.body, sb = skin((u, th) => B.B(u, th, 1 + .02 * st.breath), 18, 40, true, 80, 40, 84, .71, true, H.stars.body), sn = skin((u, th) => B.N(u, th), 8, 28, true, 130, 18, 60, .71, true, H.stars.neck);
    clay(bones.back, 3 * dpr, 0); clay(bones.front, 4 * dpr, 1); sb(); sn();
    const skH = skin((u, th) => H.S(.012 + .98 * u, th, m.jaw), 34, 52, false, 0, 80, 120, 1, false, H.stars.head);
    clay(bones.head, 4 * dpr, 1); skH();
    /* ----- light: the glow round the organs, the fine cream mesh, the glowing features and insides ----- */
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, r, color, al] of hz) { if (r < 2 || al < .01) continue; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${color},${al})`); g.addColorStop(1, `rgba(${color},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); }
    for (const key in buckets) { const [color, lvl, w] = key.split('|'), al = lvl / 6, seg = buckets[key], plain = color === WIREc;
      ctx.beginPath(); for (let i = 0; i < seg.length; i += 4) { ctx.moveTo(seg[i], seg[i + 1]); ctx.lineTo(seg[i + 2], seg[i + 3]); }
      if (plain) { ctx.strokeStyle = `rgba(239,232,216,${.1 + .5 * al})`; ctx.lineWidth = .7 * dpr; ctx.stroke(); continue; }   // the mesh, in cream ink
      if (lvl >= 4) { ctx.strokeStyle = `rgba(${color},${al * .055})`; ctx.lineWidth = (11 + 3 * w) * dpr; ctx.stroke(); }   // bloom
      ctx.strokeStyle = `rgba(${color},${al * .22})`; ctx.lineWidth = (3.2 + 2 * w) * dpr; ctx.stroke();   // the glow
      ctx.strokeStyle = `rgba(${color},${al * .9})`; ctx.lineWidth = w * dpr; ctx.stroke(); }   // the trace
    /* ----- eyes: a black void set into the skin, faint stars round its edge, one bright star that looks where the creature looks ----- */
    const rgbaF = (a, k = 1) => `rgba(${fa.map(v => Math.round(Math.min(255, v * k))).join(',')},${a})`;
    for (const e of eyes) { if (e.nz < .12 || e.r < 1.5 * dpr) continue; const r = e.r, open = 1 - .92 * e.blink;
      ctx.save(); ctx.translate(e.x, e.y); const an = Math.atan2(-e.ny, e.nx); ctx.rotate(an); ctx.scale(Math.max(.3, e.nz), 1); ctx.rotate(-an); ctx.scale(1, open);   // it turns with the surface, flattens as it turns away, and shuts to blink
      ctx.globalCompositeOperation = 'lighter'; let g = ctx.createRadialGradient(0, 0, r * .8, 0, 0, r * 1.7); g.addColorStop(0, rgbaF(.5)); g.addColorStop(1, rgbaF(0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 1.7, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = r * .28; ctx.beginPath(); ctx.arc(0, 0, r * 1.1, 0, TAU); ctx.stroke(); ctx.strokeStyle = rgbaF(.5); ctx.lineWidth = dpr; ctx.beginPath(); ctx.arc(0, 0, r * 1.24, 0, TAU); ctx.stroke();   // the socket
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); g = ctx.createRadialGradient(0, 0, r * .5, 0, 0, r); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, rgbaF(.4)); ctx.fillStyle = g; ctx.fill();
      for (let k = 0; k < 14; k++) { const a = rnd(k + e.ei * 31) * TAU, rr = (.35 + .55 * Math.sqrt(rnd(k * 3 + e.ei * 17))) * r, sz = (.5 + .7 * rnd(k * 9 + e.ei)) * dpr; ctx.fillStyle = `rgba(255,255,255,${.3 + .5 * rnd(k * 5 + e.ei)})`; ctx.fillRect(Math.cos(a) * rr, Math.sin(a) * rr, sz, sz); }
      ctx.strokeStyle = rgbaF(1, 1.25); ctx.lineWidth = 1.2 * dpr; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      if (r > 3 * dpr) { const sx = (st.look[0] * .34 - .12) * r, sy = (-st.look[1] * .3 - .14) * r, L = r * .3; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = dpr * .8; ctx.beginPath(); ctx.moveTo(sx - L, sy); ctx.lineTo(sx + L, sy); ctx.moveTo(sx, sy - L); ctx.lineTo(sx, sy + L); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx, sy, dpr * 1.1, 0, TAU); ctx.fill(); }
      ctx.restore(); }
    // read-outs, drawn on the screen itself so a recording carries them
    ctx.globalCompositeOperation = 'source-over'; const mono = (px, wt = 500) => `${wt} ${px * dpr}px "IBM Plex Mono", ui-monospace, monospace`, pad = 12 * dpr;
    ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.font = mono(9, 600); ctx.fillStyle = 'rgba(146,147,153,1)';
    ctx.fillText((info.name || '').toUpperCase().split('').join(' '), pad, pad); ctx.font = mono(8); ctx.fillText('head ' + (d.seed >>> 0).toString(36).toUpperCase() + ' · ' + d.mood, pad, pad + 14 * dpr);
    { const live = speech && amp > .03, R = (short ? 16 : 34) * dpr, ox = W - pad - R, oy = pad + R, N = hist.length, turns = 5.5, k = F[1] > 50 ? clamp(F[2] / F[1], 1.2, 6) : 3;   // the scope: the last few seconds of the voice wound into a spiral, newest at the rim
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.beginPath();
      for (let i = 0; i < N; i++) { const u = i / (N - 1), h = hist[(hi + i) % N], a = u * turns * TAU - T * (live ? 2.2 : .5), r = R * (.06 + .94 * u) + R / turns * .44 * (.12 + .88 * h) * Math.sin(u * turns * TAU * k + T * 3), x = ox + Math.cos(a) * r, y = oy + Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.strokeStyle = `rgba(${C.feat},${live ? .16 : .07})`; ctx.lineWidth = 4.5 * dpr; ctx.stroke(); ctx.strokeStyle = `rgba(${C.feat},${live ? .95 : .4})`; ctx.lineWidth = dpr; ctx.stroke();
      const ae = turns * TAU - T * (live ? 2.2 : .5); ctx.fillStyle = `rgba(${C.tract},${live ? 1 : .5})`; ctx.beginPath(); ctx.arc(ox + Math.cos(ae) * R, oy + Math.sin(ae) * R, 1.6 * dpr, 0, TAU); ctx.fill(); }   // the bright point writing the trace
    const sy = Hh - 22 * dpr, sh = 16 * dpr;   // the scope: loudness of the speech, with a playhead; a breath trace at rest
    if (env && speech) { const now = speech.clock(), n = env.length; ctx.beginPath();
      for (let x = 0; x <= W - 2 * pad; x += 2 * dpr) { const i = Math.floor(x / (W - 2 * pad) * n), v = env[i] || 0; ctx.moveTo(pad + x, sy - v * sh * .5); ctx.lineTo(pad + x, sy + v * sh * .5 + dpr); }
      ctx.strokeStyle = `rgba(${C.feat},.55)`; ctx.lineWidth = dpr; ctx.stroke();
      const px = pad + clamp(now * 100 / n, 0, 1) * (W - 2 * pad); ctx.beginPath(); ctx.moveTo(px, sy - sh * .8); ctx.lineTo(px, sy + sh * .8); ctx.strokeStyle = `rgba(${C.tract},1)`; ctx.lineWidth = 1.5 * dpr; ctx.stroke(); }
    else { ctx.beginPath(); for (let x = 0; x <= W - 2 * pad; x += 3 * dpr) { const y = sy - Math.sin((T - (1 - x / (W - 2 * pad)) * 6) * TAU * d.breath + d.phase) * sh * .32; x ? ctx.lineTo(pad + x, y) : ctx.moveTo(pad + x, y); }
      ctx.strokeStyle = `rgba(${C.feat},.3)`; ctx.lineWidth = dpr; ctx.stroke(); }
    ctx.globalCompositeOperation = 'source-over'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';   // the word being spoken, and what it means
    if (subs && speech) { const now = speech.clock(); let li = 0; for (let i = 0; i < subs.length; i++) if (subs[i][0].t0 <= now + .05) li = i;
      const line = subs[li], hs = 26 * dpr, gap = 14 * dpr, script = opts.script; ctx.font = mono(10);
      const cols = line.map(w => { const sw = script ? script.width(w.w, hs) : ctx.measureText(w.w).width * 1.6, ew = ctx.measureText(w.en.toLowerCase()).width; return { w, sw, ew, cw: Math.max(sw, ew) }; });
      const total = cols.reduce((a, c) => a + c.cw, 0) + gap * (cols.length - 1), k = Math.min(1, (W - 2 * pad - 20 * dpr) / total), top = Hh - 104 * dpr, bw = total * k + 28 * dpr;
      ctx.fillStyle = 'rgba(11,11,12,.78)'; ctx.fillRect(cx - bw / 2, top, bw, 62 * dpr);
      let x = cx - total * k / 2; ctx.textBaseline = 'top';
      cols.forEach((c, i) => { const nx = line[i + 1], on = now >= c.w.t0 - .04 && now < (nx ? nx.t0 - .04 : c.w.t1 + .25), mid = x + c.cw * k / 2;
        ctx.fillStyle = on ? 'rgba(255,255,255,1)' : 'rgba(228,228,225,.34)';
        if (script) script.draw(ctx, c.w.w, mid - c.sw * k / 2, top + 7 * dpr, hs * k); else { ctx.font = `400 ${20 * k * dpr}px "Charis SIL", Georgia, serif`; ctx.fillText(c.w.w, mid, top + 8 * dpr); }
        ctx.font = mono(Math.max(7, 10 * k), on ? 600 : 400); ctx.fillStyle = on ? `rgba(${C.feat},1)` : 'rgba(146,147,153,.8)'; ctx.fillText(c.w.en.toLowerCase(), mid, top + 41 * dpr);
        if (on) { ctx.fillStyle = `rgba(${C.feat},.9)`; ctx.fillRect(mid - c.cw * k / 2, top + 57 * dpr, c.cw * k, 1.5 * dpr); }
        x += (c.cw + gap) * k; }); }
  }

  function fit() { const dpr = 2, w = Math.round((canvas.clientWidth || 320) * dpr), h = Math.round((canvas.clientHeight || 400) * dpr);   /* always 2×: fine lines stay crisp, recordings are about 688 × 960 */
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; ctx.fillStyle = '#0b0b0c'; ctx.fillRect(0, 0, w, h); } }
  function tick(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; fit(); step(dt); draw(); requestAnimationFrame(tick); }
  canvas.addEventListener('pointerdown', e => { drag.on = true; drag.x = e.clientX; drag.y = e.clientY; drag.idle = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!drag.on) return; drag.yaw = clamp(drag.yaw + (e.clientX - drag.x) * .012, -2.6, 2.6); drag.pitch = clamp(drag.pitch + (e.clientY - drag.y) * .008, -.7, .7); drag.x = e.clientX; drag.y = e.clientY; });
  const up = () => { drag.on = false; drag.idle = 0; }; canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  window.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); if (!r.width) return;   // it watches the pointer
    ptr.x = clamp((e.clientX - (r.left + r.width / 2)) / Math.max(260, innerWidth * .45), -1, 1); ptr.y = clamp((e.clientY - (r.top + r.height / 2)) / Math.max(260, innerHeight * .5), -1, 1); ptr.t = T; }, { passive: true });
  setSeed(1); requestAnimationFrame(tick);
  return { setSeed, setInfo: i => { info = { ...info, ...i }; }, speak, stop, dna: () => H.d, isSpeaking: () => !!speech };
}
window.XenoHead = { create, makeDNA };
})();
