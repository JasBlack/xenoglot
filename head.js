// Xenoglot speaking head: a generated wireframe alien drawn like an oscilloscope trace.
// Every seed gives a different skull, eyes, nose, mouth and extras. While speech plays, the jaw, lips and the
// glowing vocal tract follow the sounds actually being spoken (timings from the synthesizer), gated by loudness.
//   const head = XenoHead.create(canvas, { sounds: PM });   // PM: key → {t:type, f:[F1,F2,F3], ipa}
//   head.setSeed(1234); head.setInfo({ name: 'Velnari' });
//   head.speak({ buf, timeline:{ segs:[{k,t,d,p,w,en}] }, clock: () => secondsSinceStart }); head.stop();
(function () {
'use strict';
const TAU = Math.PI * 2, WIRE = '228,228,225', GREEN = '57,255,136', VIOLET = '179,107,255';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t, smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- DNA: everything that makes one head different from another ---------- */
function makeDNA(seed) {
  const r = rng(seed * 2654435761 >>> 0), R = (a, b) => a + (b - a) * r(), pick = a => a[Math.floor(r() * a.length)], chance = p => r() < p;
  const d = { seed };
  d.crown = R(.62, 1.0);                 // cranium half-width
  d.tall = R(.55, 1.25) * (chance(.22) ? R(1.3, 1.8) : 1);   // cranium height; some are coneheads
  d.domeP = R(1.7, 3.2);                 // 2 = round dome, higher = boxier
  d.jawLen = R(.55, 1.05);               // widest point down to the chin
  d.taper = R(.28, .85);                 // chin width as a share of the cranium
  d.cheek = R(-.1, .22);
  d.depth = R(.85, 1.3);                 // front-to-back against side-to-side
  d.bulge = chance(.5) ? R(.15, .7) : R(-.05, .15);   // back-of-skull bulge
  d.flat = R(.02, .22);                  // flatter face
  d.muzzle = chance(.4) ? R(.08, .3) : 0;
  d.brow = chance(.6) ? R(.03, .14) : 0;
  d.mouthV = R(.2, .42);                 // heights are 0 (chin) to 1 (crown); vm is the widest ring
  d.vm = R(.5, .62);
  d.eyeV = clamp(d.vm + R(-.1, .12), d.mouthV + .16, .78);
  d.browV = d.eyeV + R(.06, .1);
  // how the eyes are arranged: most heads have more than two
  d.eyeLayout = pick(['pair', 'pair', 'cyclops', 'odd', 'tri', 'row', 'row', 'column', 'cluster', 'cluster', 'cluster', 'ring', 'stalks', 'stalks']);
  d.eyeN = 3 + Math.floor(r() * 4);
  d.eyeSize = R(.08, .2) * (['row', 'cluster', 'ring'].includes(d.eyeLayout) ? .72 : 1);
  d.eyeGap = R(.3, .62);
  d.eyeTilt = R(-.55, .55);
  d.eyeShape = pick(['round', 'round', 'almond', 'almond', 'slit', 'wide']);
  d.eyeRings = 2 + Math.floor(r() * 4);
  d.pupil = pick(['dot', 'dot', 'slit', 'ring', 'bar', 'none']);
  d.bug = chance(.35) ? R(.3, .9) : R(0, .2);          // how far the eyes stand out
  d.nose = pick(['none', 'slits', 'slits', 'ridge', 'ridge', 'hook', 'trunk']);
  d.noseLen = R(.1, .32);
  d.mouthW = R(.3, .75);                 // half-width in radians around the face
  d.teeth = pick([0, 0, 1, 1, 2, 3]);    // none, pegs, fangs, needles
  d.jawSwing = R(.28, .5);
  d.neckR = R(.2, .42) * d.crown; d.neckLen = R(.45, 1.0); d.neckRings = 4 + Math.floor(r() * 6);
  d.rings = 24 + Math.floor(r() * 12); d.meridians = pick([6, 8, 8, 10, 12]);
  d.antennae = pick([0, 0, 0, 0, 1, 2, 2, 3]); d.antLen = R(.35, .9); d.antSplay = R(.15, .7);
  d.horns = chance(.25) ? R(.34, .6) : 0; d.hornTurns = R(.6, 1.3);
  d.fins = chance(.3) ? R(.2, .5) : 0; d.finRays = 3 + Math.floor(r() * 4);
  d.crest = chance(.28) ? R(.1, .32) : 0; d.crestN = 5 + Math.floor(r() * 8);
  d.tentacles = chance(.3) ? 3 + Math.floor(r() * 6) : 0; d.tentLen = R(.35, .8);
  d.phase = R(0, TAU);
  // what makes a skull strange: each is off for most heads, and they combine
  d.lobeAmp = chance(.38) ? R(.07, .24) : 0; d.lobeN = pick([2, 3, 3, 4, 5, 6, 8]); d.lobePh = R(0, TAU);   // lobes around the cranium, like a brain or a star
  d.twist = d.lobeAmp && chance(.5) ? R(-3, 3) : 0;                                                       // the lobes spiral up the skull
  d.segAmp = chance(.28) ? R(.06, .17) : 0; d.segN = 3 + Math.floor(r() * 5);                             // stacked bulges, insect-like
  d.waist = chance(.3) ? R(.2, .55) : 0;                                                                  // pinched between cranium and jaw
  d.sweep = chance(.32) ? R(.35, 1.2) : 0;                                                                // cranium swept back
  d.hammer = chance(.14) ? R(.45, 1.1) : 0;                                                               // hammerhead: wide at the eyes
  if (chance(.16)) { d.crown *= 1.3; d.taper *= .55; d.jawLen *= 1.15; d.domeP = R(2.6, 4); }             // mushroom: a huge cap on a thin jaw
  if (d.hammer) { d.eyeLayout = 'pair'; d.eyeGap = 1.42; d.bug = Math.max(d.bug, .4); }
  d.mouthKind = pick(['wide', 'wide', 'wide', 'vertical']); if (d.mouthKind === 'vertical') d.jawSwing *= .35;
  d.mandibles = chance(.26) ? R(.25, .5) : 0;
  // colours: the family green and violet now and then, otherwise the head's own
  const hsl = (h, sat, l) => { const a = sat / 100 * Math.min(l / 100, 1 - l / 100), f = n => { const k = (n + h / 30) % 12; return Math.round(255 * (l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; return `${f(0)},${f(8)},${f(4)}`; };
  const hue = R(0, 360);
  d.col = chance(.15) ? { feat: GREEN, tract: VIOLET, wire: WIRE } : { feat: hsl(hue, 100, 62), tract: hsl((hue + R(100, 260)) % 360, 100, 70), wire: hsl(hue, 22, 86) };
  return d;
}

/* ---------- geometry ---------- */
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
    if (open > 0 && v < d.mouthV) { // the lower jaw swings on a hinge behind the mouth
      const a = open * d.jawSwing * Math.min(1, (d.mouthV - v) / .05), ca = Math.cos(a), sa = Math.sin(a), dy = y - hingeY, dz = z - hingeZ;
      y = hingeY + dy * ca - dz * sa; z = hingeZ + dy * sa + dz * ca;
    }
    return [x, y, z];
  }
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  function frame(v, th, open) { // centre and local axes of a patch of skin: across, up, outward
    const c = S(v, th, open), e = .01, tu = norm(sub(S(v, th + e, open), S(v, th - e, open))), tv = norm(sub(S(Math.min(.99, v + e), th, open), S(Math.max(.01, v - e), th, open)));
    let n = norm(cross(tu, tv)); if (n[0] * c[0] + n[2] * c[2] < 0) n = [-n[0], -n[1], -n[2]];
    return { c, tu, tv, n };
  }
  // a wire tube along a path: rings plus three long strands
  function tube(path, rad, sides, out, color, alpha) {
    const rings = [];
    for (let i = 0; i < path.length; i++) {
      const t = norm(sub(path[Math.min(path.length - 1, i + 1)], path[Math.max(0, i - 1)]));
      let a = norm(cross(t, Math.abs(t[1]) > .9 ? [1, 0, 0] : [0, 1, 0])), b = cross(t, a), ring = [], r = rad(i / (path.length - 1));
      for (let k = 0; k < sides; k++) { const an = k / sides * TAU; ring.push(add(add(path[i], a, Math.cos(an) * r), b, Math.sin(an) * r)); }
      rings.push(ring); out.push({ pts: ring, closed: true, color, alpha });
    }
    for (let k = 0; k < sides; k += Math.max(1, Math.floor(sides / 3))) out.push({ pts: rings.map(g => g[k]), color, alpha: alpha * .8 });
    return rings;
  }
  const eyes = [];
  { const er = rng((d.seed ^ 0x5bd1e995) >>> 0), ER = (a, b) => a + (b - a) * er(), g = d.eyeGap, v0 = d.eyeV, s = d.eyeSize, cv = v => clamp(v, d.mouthV + .13, .93);
    const pair = (th, v, sz) => eyes.push({ th: -th, v: cv(v), s: sz, side: -1 }, { th, v: cv(v), s: sz, side: 1 });
    switch (d.eyeLayout) {
      case 'cyclops': eyes.push({ th: 0, v: v0, s: s * 1.7, side: 0 }); break;
      case 'odd': eyes.push({ th: -g, v: v0, s: s * 1.5, side: -1 }, { th: g * 1.1, v: cv(v0 + .05), s: s * .5, side: 1 }); break;
      case 'tri': pair(g, v0, s); eyes.push({ th: 0, v: cv(v0 + .14), s: s * .75, side: 0 }); break;
      case 'row': for (let i = 0; i < d.eyeN; i++) { const u = i / (d.eyeN - 1); eyes.push({ th: lerp(-1.25, 1.25, u) * Math.min(1, .45 + g), v: v0, s: s * (.55 + .45 * Math.sin(Math.PI * u)), side: Math.sign(u - .5) }); } break;
      case 'column': for (let i = 0; i < Math.min(4, d.eyeN); i++) eyes.push({ th: 0, v: cv(v0 - .06 + i * .12), s: s * (1 - .18 * i), side: 0 }); break;
      case 'cluster': pair(g * .8, v0, s); for (let i = 0; i < 2 + Math.floor(d.eyeN / 2); i++) pair(ER(.12, 1.25), v0 + ER(-.1, .24), s * ER(.3, .7)); break;   // spider eyes
      case 'ring': { const n = Math.max(6, d.eyeN + 3); for (let i = 0; i < n; i++) eyes.push({ th: -Math.PI + (i + .5) * TAU / n, v: v0, s: s * .8, side: 0 }); break; }   // all the way round
      case 'stalks': { const n = Math.max(2, Math.min(5, d.eyeN - 1)); for (let i = 0; i < n; i++) eyes.push({ stalk: true, th: lerp(-1.1, 1.1, n > 1 ? i / (n - 1) : .5), v: .86, len: ER(.3, .7), s: s * .85, side: 0, ph: ER(0, 6) });
        if (er() < .5) pair(g, v0, s * .5); break; }
      default: pair(g, v0, s);
    } }
  const stalkTop = eyes.reduce((a, e) => e.stalk ? Math.max(a, e.len * .8 + .1) : a, 0);
  const bottom = -d.jawLen - d.neckLen, top = d.tall + Math.max(d.antennae ? d.antLen : 0, stalkTop) + d.crest;
  const reach = d.crown * (1 + d.lobeAmp + d.segAmp) * (1 + d.hammer) + (d.sweep ? d.sweep * d.tall * .35 : 0);   // half-width to fit on screen
  return { d, S, frame, tube, eyes, yOf, wOf, add, sub, norm, cross, bottom, top, reach, col: d.col, mouthY: yOf(d.mouthV) };
}

// all the line work for one frame. m: mouth state {jaw, lip, round, at, tight}; t: seconds; amp: loudness 0–1
function lines(H, m, t, amp, blink, look) {
  const d = H.d, out = [], S = H.S, open = m.jaw, WIRE = H.col.wire, GREEN = H.col.feat, VIOLET = H.col.tract;
  // skull: contour rings and meridians
  for (let i = 0; i < d.rings; i++) { const v = .015 + .975 * i / (d.rings - 1), pts = [];
    for (let k = 0; k < 40; k++) pts.push(S(v, k / 40 * TAU - Math.PI, open));
    out.push({ pts, closed: true, color: WIRE, alpha: .2 }); }
  for (let k = 0; k < d.meridians; k++) { const th = k / d.meridians * TAU - Math.PI + .0001, pts = [];
    for (let i = 0; i <= 30; i++) pts.push(S(.015 + .975 * i / 30, th, open));
    out.push({ pts, color: WIRE, alpha: .13 }); }
  // neck and shoulders
  for (let i = 0; i < d.neckRings + 2; i++) { const u = i / (d.neckRings + 1), y = -d.jawLen * .7 - (d.neckLen + d.jawLen * .3) * u, flare = i >= d.neckRings ? 1.5 + (i - d.neckRings) * 1.3 : 1, pts = [];
    for (let k = 0; k < 28; k++) { const a = k / 28 * TAU; pts.push([Math.sin(a) * d.neckR * flare, y, Math.cos(a) * d.neckR * .9 * (flare > 1 ? flare * .75 : 1) - .08]); }
    out.push({ pts, closed: true, color: WIRE, alpha: .16 }); }
  // eyes: rings on the skin, with a pupil that looks around and lids that blink
  for (const e of H.eyes) { let f, c;
    if (e.stalk) { const base = S(e.v, e.th, 0), dir = H.norm([base[0] * .8, .9, base[2] * .5 + .25]), sway = Math.sin(t * 1.5 + e.ph) * .07, tip = [base[0] + dir[0] * e.len + sway, base[1] + dir[1] * e.len, base[2] + dir[2] * e.len + sway * .6];
      out.push({ pts: [base, [lerp(base[0], tip[0], .5) + sway * .3, lerp(base[1], tip[1], .55), lerp(base[2], tip[2], .4)], tip], color: GREEN, alpha: .7, w: 1.4 });
      const n = H.norm([dir[0] * .5, .05, 1]), tu = H.norm(H.cross([0, 1, 0], n)); f = { c: tip, n, tu, tv: H.cross(n, tu) }; c = tip; }
    else { f = H.frame(e.v, e.th, 0); c = H.add(f.c, f.n, e.s * d.bug * .6); }
    const tilt = d.eyeTilt * (e.side || 0), ct = Math.cos(tilt), st = Math.sin(tilt);
    const ax = [f.tu[0] * ct + f.tv[0] * st, f.tu[1] * ct + f.tv[1] * st, f.tu[2] * ct + f.tv[2] * st], ay = [f.tv[0] * ct - f.tu[0] * st, f.tv[1] * ct - f.tu[1] * st, f.tv[2] * ct - f.tu[2] * st];
    const sy = (d.eyeShape === 'almond' ? .55 : d.eyeShape === 'slit' ? .3 : d.eyeShape === 'wide' ? .75 : 1) * (1 - .92 * blink), sx = d.eyeShape === 'wide' ? 1.35 : 1;
    for (let j = 1; j <= d.eyeRings; j++) { const r = e.s * j / d.eyeRings, pts = [];
      for (let k = 0; k < 28; k++) { const a = k / 28 * TAU; pts.push(H.add(H.add(c, ax, Math.cos(a) * r * sx), ay, Math.sin(a) * r * sy)); }
      out.push({ pts, closed: true, color: GREEN, alpha: j === d.eyeRings ? .95 : .5 }); }
    if (d.bug > .25 && !e.stalk) for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + .4; out.push({ pts: [H.add(H.add(f.c, ax, Math.cos(a) * e.s * sx), ay, Math.sin(a) * e.s * sy), H.add(H.add(c, ax, Math.cos(a) * e.s * sx), ay, Math.sin(a) * e.s * sy)], color: GREEN, alpha: .35 }); }
    const pc = H.add(H.add(H.add(c, f.n, .012), ax, look[0] * e.s * .4), ay, look[1] * e.s * .3 * sy), pr = e.s * .22;
    if (d.pupil === 'slit') out.push({ pts: [H.add(pc, ay, -e.s * .7 * sy), H.add(pc, ay, e.s * .7 * sy)], color: GREEN, alpha: 1, w: 2 });
    else if (d.pupil === 'bar') out.push({ pts: [H.add(pc, ax, -e.s * .6), H.add(pc, ax, e.s * .6)], color: GREEN, alpha: 1, w: 2 });
    else if (d.pupil !== 'none') { const pts = []; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; pts.push(H.add(H.add(pc, ax, Math.cos(a) * pr), ay, Math.sin(a) * pr * Math.max(.2, sy))); }
      out.push({ pts, closed: true, color: GREEN, alpha: 1, fill: d.pupil === 'dot' }); } }
  // nose
  const nv = lerp(d.mouthV, d.eyeV, .5);
  if (d.nose === 'slits') for (const s of [-1, 1]) out.push({ pts: [S(nv + .03, s * .07, 0), S(nv - .03, s * .11, 0)], color: GREEN, alpha: .8, w: 1.5 });
  else if (d.nose !== 'none') { const pts = [], n = 9, len = d.noseLen * (d.nose === 'ridge' ? .55 : 1);
    for (let i = 0; i <= n; i++) { const u = i / n, v = lerp(d.eyeV + .02, nv - .05, u), p = S(v, 0, 0), bump = d.nose === 'hook' ? Math.pow(Math.sin(Math.PI * Math.pow(u, .7)), 1.3) : Math.sin(Math.PI * u);
      pts.push([p[0], p[1], p[2] + len * d.crown * bump]); }
    if (d.nose === 'trunk') { const tip = pts[pts.length - 1]; pts.length = 6; const path = [];
      for (let i = 0; i <= 8; i++) { const u = i / 8; path.push([Math.sin(t * 1.3 + u * 3 + d.phase) * .05 * u, lerp(H.yOf(nv), H.yOf(d.mouthV) - .5 * d.jawLen, u), S(nv, 0, 0)[2] + d.noseLen * d.crown * (1 + .6 * Math.sin(u * 2.4))]); }
      H.tube(path, u => .05 * d.crown * (1 - .5 * u), 6, out, GREEN, .6); }
    else { out.push({ pts, color: GREEN, alpha: .85 }); for (const s of [-1, 1]) out.push({ pts: [pts[n - 2], S(nv - .04, s * .1, 0), pts[n]], color: GREEN, alpha: .5 }); } }
  // lips and teeth
  const mw = d.mouthW * (1 - .5 * m.round), up = [], lo = [], gap = .006 + .02 * m.lip;
  for (let i = 0; i <= 16; i++) { const edge = Math.pow(Math.sin(Math.PI * i / 16), .6); let a, b;
    if (d.mouthKind === 'vertical') { const v = lerp(d.mouthV - mw * .2, d.mouthV + mw * .2, i / 16), sp = (.012 + .05 * m.lip + .14 * m.jaw) * edge; a = S(v, -sp, 0); b = S(v, sp, 0); }   // opens sideways
    else { const th = lerp(-mw, mw, i / 16); a = S(d.mouthV + gap * edge, th, 0); b = S(d.mouthV - gap * edge - .004, th, open); }
    a = [a[0], a[1], a[2] + .012]; b = [b[0], b[1], b[2] + .012]; up.push(a); lo.push(b); }
  if (d.mandibles) for (const sd of [-1, 1]) { const base = S(d.mouthV - .01, sd * d.mouthW * (d.mouthKind === 'vertical' ? .5 : 1.05), open * .3), sp = .1 + .9 * m.jaw, Lm = d.mandibles, path = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8; path.push([base[0] + sd * Lm * (.4 * Math.sin(Math.PI * u) * (.6 + sp) - .5 * u * (1 - sp)), base[1] - Lm * .85 * u, base[2] + Lm * .45 * Math.sin(Math.PI * u * .8)]); }
    H.tube(path, u => Lm * .11 * (1 - .85 * u), 5, out, GREEN, .8); }
  out.push({ pts: up, color: GREEN, alpha: 1, w: 1.6 }, { pts: lo, color: GREEN, alpha: 1, w: 1.6 });
  if (d.teeth) { const n = d.teeth === 3 ? 13 : 7, len = (d.teeth === 1 ? .045 : .09) * d.jawLen;
    for (let i = 1; i < n; i++) { const k = i / n * 16, a = up[Math.round(k)], b = lo[Math.round(k)], fang = d.teeth === 2 && (i === 2 || i === n - 2) ? 2 : 1;
      const vert = d.mouthKind === 'vertical';   // a vertical mouth's teeth point across it
      if (d.teeth !== 2 || fang === 2 || i % 2) out.push({ pts: [a, vert ? [a[0] + len * .7, a[1], a[2] - .01] : [a[0], a[1] - len * fang, a[2] - .01]], color: WIRE, alpha: .75 });
      if (d.teeth !== 2 && i % 2) out.push({ pts: [b, vert ? [b[0] - len * .7, b[1], b[2] - .01] : [b[0], b[1] + len * .8, b[2] - .01]], color: WIRE, alpha: .6 }); } }
  // the vocal tract: lips → back of the mouth → down the throat. Its shape is the sound being made.
  { const lipP = S(d.mouthV - .002, 0, open * .5), L0 = [0, lipP[1], lipP[2] * .96], corner = [0, H.mouthY + .05, -.18 * d.crown * d.depth], G = [0, -d.jawLen - d.neckLen * .42, -.1], path = [], N = 20;
    for (let i = 0; i <= N; i++) { const u = i / N, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u; path.push([0, a * L0[1] + b * corner[1] + c * G[1], a * L0[2] + b * corner[2] + c * G[2]]); }
    const r0 = Math.min(.11 * d.crown, d.neckR * .5), hot = .22 + .78 * amp;
    const rings = H.tube(path, u => { let r = r0 * (.5 + .5 * Math.sin(Math.PI * Math.pow(u, .8))) * (1 - m.tight * Math.exp(-Math.pow((u - m.at) / .11, 2)));
      if (u < .12) r = lerp(r0 * (.12 + 1.5 * m.lip) * (1 - .4 * m.round), r, u / .12); if (u > .9) r *= lerp(1, .35, (u - .9) / .1); return Math.max(.004, r); }, 10, out, VIOLET, hot);
    const g = rings[rings.length - 1], pulse = .5 + .5 * Math.sin(t * 40); // the vocal folds flicker when voiced
    out.push({ pts: g.map(p => [p[0] * (1 + .5 * amp * pulse), p[1] - .01, (p[2] - G[2]) * (1 + .5 * amp * pulse) + G[2]]), closed: true, color: GREEN, alpha: .35 + .65 * amp, w: 2 }); }
  // extras
  for (let a = 0; a < d.antennae; a++) { const side = d.antennae === 1 ? 0 : d.antennae === 3 ? a - 1 : a * 2 - 1, base = S(.93, side * .9, 0), path = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8, sway = Math.sin(t * 1.7 + a * 2 + d.phase) * .06 * u * u; path.push([base[0] + side * d.antSplay * d.antLen * u * u + sway, base[1] + d.antLen * (u - .25 * u * u), base[2] + .12 * d.antLen * u * u + sway * .5]); }
    out.push({ pts: path, color: GREEN, alpha: .8 }); const tip = path[8], pts = [], r = .035 + .02 * amp;
    for (let k = 0; k < 10; k++) { const an = k / 10 * TAU; pts.push([tip[0] + Math.cos(an) * r, tip[1] + Math.sin(an) * r, tip[2]]); } out.push({ pts, closed: true, color: GREEN, alpha: 1 }); }
  if (d.horns) for (const side of [-1, 1]) { const base = S(d.vm + .35 * (1 - d.vm), side * 1.9, 0), path = [], R0 = d.horns * .9, C = [base[0], base[1] + R0 * .2, base[2] - R0], ph0 = Math.atan2(-.2, 1);
    for (let i = 0; i <= 18; i++) { const u = i / 18, R = R0 * (1 - .5 * u), ph = ph0 + u * d.hornTurns * TAU; path.push([C[0] + side * d.horns * 1.1 * u, C[1] + R * Math.sin(ph), C[2] + R * Math.cos(ph)]); }
    H.tube(path, u => d.horns * .24 * (1 - .82 * u), 7, out, WIRE, .7); }
  if (d.fins) for (const side of [-1, 1]) { const tips = [];
    for (let i = 0; i < d.finRays; i++) { const u = i / (d.finRays - 1), base = S(lerp(d.eyeV - .12, d.eyeV + .14, u), side * 1.57, 0), tip = [base[0] + side * d.fins * (.6 + .4 * Math.sin(Math.PI * u)), base[1] + d.fins * (u - .3) * .8, base[2] - d.fins * .5];
      out.push({ pts: [base, tip], color: GREEN, alpha: .55 }); tips.push(tip); }
    out.push({ pts: tips, color: GREEN, alpha: .8 }); }
  if (d.crest) { const tips = [], mid = [0, d.tall * .35, 0];
    for (let i = 0; i < d.crestN; i++) { const u = i / (d.crestN - 1), base = u < .5 ? S(lerp(.8, .992, u * 2), 0, 0) : S(lerp(.992, .7, (u - .5) * 2), Math.PI, 0), dir = H.norm(H.sub(base, mid)), tip = H.add(base, dir, d.crest * (.45 + .55 * Math.sin(Math.PI * u)));
      out.push({ pts: [base, tip], color: GREEN, alpha: .6 }); tips.push(tip); }
    out.push({ pts: tips, color: GREEN, alpha: .85 }); }
  for (let i = 0; i < d.tentacles; i++) { const th = lerp(-1.1, 1.1, d.tentacles === 1 ? .5 : i / (d.tentacles - 1)), base = S(.04, th, open), path = [];
    for (let k = 0; k <= 10; k++) { const u = k / 10, wv = Math.sin(t * 2.1 + i * 1.3 + u * 4 + d.phase) * .07 * u * (1 + amp); path.push([base[0] + wv + Math.sin(th) * .1 * u, base[1] - d.tentLen * u, base[2] + Math.cos(t * 1.6 + i + u * 3) * .05 * u + .05 * u]); }
    H.tube(path, u => .035 * d.crown * (1 - .8 * u), 5, out, GREEN, .45); }
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
  let H = build(makeDNA(1)), info = { name: '' }, speech = null, env = null, raf = 0, last = performance.now(), T = 0;
  const m = { jaw: 0, lip: .1, round: 0, at: .5, tight: 0 }, F = [0, 500, 1500], drag = { yaw: 0, pitch: 0, on: false, x: 0, y: 0, idle: 0 };
  let blink = 0, nextBlink = 2, look = [0, 0], lookTo = [0, 0], nextLook = 1, amp = 0, caption = null, segIdx = 0;

  function setSeed(seed) { H = build(makeDNA(seed >>> 0)); }
  function envelope(buf) { const d = buf.getChannelData(0), hop = Math.round(buf.sampleRate / 100), n = Math.ceil(d.length / hop), e = new Float32Array(n);
    for (let i = 0; i < n; i++) { let s = 0; const o = i * hop, len = Math.min(hop, d.length - o); for (let j = 0; j < len; j++) s += d[o + j] * d[o + j]; e[i] = Math.sqrt(s / Math.max(1, len)); }
    const sorted = Float32Array.from(e).sort(), ref = sorted[Math.floor(n * .95)] || 1e-6; for (let i = 0; i < n; i++) e[i] = Math.min(1, e[i] / ref); return e; }
  function speak(s) { speech = s; env = s.buf ? envelope(s.buf) : null; segIdx = 0; caption = null; }
  function stop() { speech = null; env = null; caption = null; }

  function step(dt) {
    T += dt; let target = shapeOf(null, sounds), loud = 0, f0 = 0;
    if (speech) { const now = speech.clock();
      if (env) { const i = Math.floor(now * 100); loud = i >= 0 && i < env.length ? env[i] : 0; if (now > env.length / 100 + .3) stop(); }
      const segs = speech && speech.timeline && speech.timeline.segs;
      if (segs && segs.length) { if (segIdx >= segs.length || segs[segIdx].t > now) segIdx = 0;
        while (segIdx < segs.length - 1 && segs[segIdx].t + segs[segIdx].d <= now) segIdx++;
        const sg = segs[segIdx];
        if (now >= sg.t && now < sg.t + sg.d + .02) { target = shapeOf(sg.k, sounds); if (sg.k) { f0 = sg.p || 0; if (sg.w) caption = { w: sg.w, en: sg.en || '' }; } } }
      else if (loud > .08) target = { jaw: .25 + .6 * loud, lip: .3 + .6 * loud, round: 0, at: .4, tight: .3 * (1 - loud), f: null }; // no timings: follow the loudness
      const gate = env ? smooth(loud * 2.2) : 1; target = { ...target, jaw: target.jaw * (.35 + .65 * gate), lip: target.lip * (.4 + .6 * gate) };
    }
    const k = 1 - Math.exp(-dt / .045); for (const key of ['jaw', 'lip', 'round', 'at', 'tight']) m[key] += (target[key] - m[key]) * k;
    amp += (loud - amp) * (1 - Math.exp(-dt / .05));
    if (target.f) for (let i = 1; i < 3; i++) F[i] += (target.f[i - 1] - F[i]) * k; F[0] += ((speech && f0) - F[0]) * (1 - Math.exp(-dt / .08));
    nextBlink -= dt; if (nextBlink < 0) { blink = 1; nextBlink = 2 + Math.random() * 5; } blink = Math.max(0, blink - dt * 7);
    nextLook -= dt; if (nextLook < 0) { lookTo = [Math.random() * 2 - 1, Math.random() * 2 - 1]; nextLook = .6 + Math.random() * 2.5; } look[0] += (lookTo[0] - look[0]) * .12; look[1] += (lookTo[1] - look[1]) * .12;
    if (!drag.on) { drag.idle += dt; if (drag.idle > 2.5) { drag.yaw *= .97; drag.pitch *= .97; } }
  }

  function draw() {
    const W = canvas.width, Hh = canvas.height, dpr = W / Math.max(1, canvas.clientWidth || W), WIRE = H.col.wire, GREEN = H.col.feat, VIOLET = H.col.tract;
    ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(11,11,12,.5)'; ctx.fillRect(0, 0, W, Hh); // phosphor: the last frames linger
    const hud = 70 * dpr, topPad = 30 * dpr, low = -H.d.jawLen - H.d.neckLen * .5, span = H.top - low, wide = 2 * H.reach + .35 + (H.d.fins || H.d.horns ? .55 : 0);   // the shoulders run off the bottom
    const scale = Math.min(W / wide, (Hh - hud - topPad) / (span * 1.03)), cx = W / 2, cy = topPad + (Hh - hud - topPad) * .5 + (H.top + low) / 2 * scale;
    const yaw = Math.sin(T * .42) * .55 + Math.sin(T * .17) * .2 + drag.yaw, pitch = Math.sin(T * .31) * .06 - amp * .05 + drag.pitch, cyaw = Math.cos(yaw), syaw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cam = 4.2;
    const buckets = {};
    for (const ln of lines(H, m, T, amp, blink, look)) {
      const P = ln.pts.map(p => { const wob = amp * .006 * Math.sin(p[1] * 37 + T * 31); let x = (p[0] + wob) * cyaw + p[2] * syaw, z = -(p[0] + wob) * syaw + p[2] * cyaw, y = p[1] * cp - z * sp; z = p[1] * sp + z * cp; const f = cam / (cam - z); return [cx + x * scale * f, cy - y * scale * f, z]; });
      if (ln.fill) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(${ln.color},${.9 * (.45 + .55 * smooth((P[0][2] + 1) / 2))})`; ctx.beginPath(); P.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.fill(); continue; }
      const n = P.length, end = ln.closed ? n : n - 1;
      for (let i = 0; i < end; i++) { const a = P[i], b = P[(i + 1) % n], depth = smooth(((a[2] + b[2]) / 2 + 1.1) / 2.2), lvl = Math.max(1, Math.round(ln.alpha * (.22 + .78 * depth) * 6)), key = ln.color + '|' + lvl + '|' + (ln.w || 1);
        (buckets[key] ||= []).push(a[0], a[1], b[0], b[1]); }
    }
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const key in buckets) { const [color, lvl, w] = key.split('|'), al = lvl / 6, seg = buckets[key];
      ctx.beginPath(); for (let i = 0; i < seg.length; i += 4) { ctx.moveTo(seg[i], seg[i + 1]); ctx.lineTo(seg[i + 2], seg[i + 3]); }
      ctx.strokeStyle = `rgba(${color},${al * (color === WIRE ? .07 : .2)})`; ctx.lineWidth = (3.2 + 2 * w) * dpr; ctx.stroke();   // the glow
      ctx.strokeStyle = `rgba(${color},${al * (color === WIRE ? .6 : .9)})`; ctx.lineWidth = w * dpr * (color === WIRE ? .8 : 1); ctx.stroke(); }              // the trace
    // read-outs, drawn on the screen itself so a recording carries them
    ctx.globalCompositeOperation = 'source-over'; const mono = (px, wt = 500) => `${wt} ${px * dpr}px "IBM Plex Mono", ui-monospace, monospace`, pad = 12 * dpr;
    ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.font = mono(9, 600); ctx.fillStyle = 'rgba(146,147,153,1)';
    ctx.fillText((info.name || '').toUpperCase().split('').join(' '), pad, pad); ctx.font = mono(8); ctx.fillText('head ' + (H.d.seed >>> 0).toString(36).toUpperCase(), pad, pad + 14 * dpr);
    ctx.textAlign = 'right'; const live = speech && amp > .03;
    [['F0', F[0]], ['F1', F[1]], ['F2', F[2]]].forEach(([lab, val], i) => { const x = W - pad - (2 - i) * 46 * dpr;
      ctx.font = mono(7); ctx.fillStyle = `rgba(${VIOLET},.9)`; ctx.fillText(lab, x, pad); ctx.font = mono(10, 600); ctx.fillStyle = live ? 'rgba(228,228,225,1)' : 'rgba(146,147,153,.6)'; ctx.fillText(live && val > 20 ? String(Math.round(val)) : '···', x, pad + 10 * dpr); });
    // the resonance curve: where the vocal tract is ringing right now
    { const gw = 132 * dpr, gh = 20 * dpr, gx = W - pad - gw, gy = pad + 30 * dpr; ctx.globalCompositeOperation = 'lighter'; ctx.beginPath();
      for (let i = 0; i <= 44; i++) { const hz = 100 + i / 44 * 3400; let v = .06; for (let j = 1; j < 3; j++) { const bw = 90 + j * 60; v += (live ? 1 : .25) / (1 + Math.pow((hz - F[j]) / bw, 2)) * (j === 1 ? 1 : .7); }
        const x = gx + i / 44 * gw, y = gy + gh - Math.min(1, v) * gh; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.strokeStyle = `rgba(${GREEN},${live ? .85 : .3})`; ctx.lineWidth = dpr; ctx.stroke(); }
    // the scope: the speech's loudness trace with a playhead
    const sy = Hh - 22 * dpr, sh = 16 * dpr;
    if (env && speech) { const now = speech.clock(), n = env.length; ctx.beginPath();
      for (let x = 0; x <= W - 2 * pad; x += 2 * dpr) { const i = Math.floor(x / (W - 2 * pad) * n), v = env[i] || 0; ctx.moveTo(pad + x, sy - v * sh * .5); ctx.lineTo(pad + x, sy + v * sh * .5 + dpr); }
      ctx.strokeStyle = `rgba(${GREEN},.55)`; ctx.lineWidth = dpr; ctx.stroke();
      const px = pad + clamp(now * 100 / n, 0, 1) * (W - 2 * pad); ctx.beginPath(); ctx.moveTo(px, sy - sh * .8); ctx.lineTo(px, sy + sh * .8); ctx.strokeStyle = `rgba(${VIOLET},1)`; ctx.lineWidth = 1.5 * dpr; ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(pad, sy); ctx.lineTo(W - pad, sy); ctx.strokeStyle = `rgba(${GREEN},.25)`; ctx.lineWidth = dpr; ctx.stroke(); }
    // the word being spoken, and what it means
    ctx.globalCompositeOperation = 'source-over'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    if (caption && speech) { ctx.font = `400 ${22 * dpr}px "Charis SIL", Georgia, serif`;
      const tw = Math.max(ctx.measureText(caption.w).width, 60 * dpr) + 28 * dpr; ctx.fillStyle = 'rgba(11,11,12,.72)'; ctx.fillRect(cx - tw / 2, Hh - 86 * dpr, tw, 48 * dpr);   // a plain patch so the wire doesn't run through the words
      ctx.fillStyle = 'rgba(228,228,225,1)'; ctx.fillText(caption.w, cx, Hh - 62 * dpr);
      ctx.font = mono(9); ctx.fillStyle = `rgba(${GREEN},.9)`; ctx.fillText((caption.en || '').toLowerCase(), cx, Hh - 46 * dpr); }
  }

  function tick(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; fit(); step(dt); draw(); raf = requestAnimationFrame(tick); }
  function fit() { const dpr = 2, /* always drawn at 2×: fine lines stay crisp, and a recording is about 688 × 960 */ w = Math.round((canvas.clientWidth || 320) * dpr), h = Math.round((canvas.clientHeight || 400) * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; ctx.fillStyle = '#0b0b0c'; ctx.fillRect(0, 0, w, h); } }
  canvas.addEventListener('pointerdown', e => { drag.on = true; drag.x = e.clientX; drag.y = e.clientY; drag.idle = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!drag.on) return; drag.yaw = clamp(drag.yaw + (e.clientX - drag.x) * .012, -2.6, 2.6); drag.pitch = clamp(drag.pitch + (e.clientY - drag.y) * .008, -.7, .7); drag.x = e.clientX; drag.y = e.clientY; });
  const up = () => { drag.on = false; drag.idle = 0; }; canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  raf = requestAnimationFrame(tick);
  return { setSeed, setInfo: i => { info = { ...info, ...i }; }, speak, stop, dna: () => H.d, isSpeaking: () => !!speech,
    still() { fit(); step(0); for (let i = 0; i < 6; i++) draw(); } };   // draw one settled frame now (for tests and screenshots)
}
window.XenoHead = { create, makeDNA };
})();
