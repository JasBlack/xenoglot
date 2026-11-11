// Xenoglot speech-to-text worker: Whisper tiny.en (Apache-2.0) on onnxruntime-web, entirely in the browser.
// The page posts 16 kHz mono audio; this posts back phrases with start and end times.
//   in:  {type:'transcribe', pcm:Float32Array, ortBase:'…/vendor/ort/', hf:'https://huggingface.co/'}
//   out: {type:'status', text} · {type:'progress', done, total, segments:[new ones]} · {type:'done', segments} · {type:'error', message}
// A segment is {s, e, text}: seconds from the start of the audio, and the English words spoken.
'use strict';

const SR = 16000, N_FFT = 400, HOP = 160, N_MEL = 80, CHUNK_S = 30, N_FRAMES = 3000;
const REPO = 'onnx-community/whisper-tiny.en/resolve/main/';
const CACHE = 'xenoglot-voices-v1';
const SOT = 50257, EOT = 50256, NO_TS = 50362, TS0 = 50363;   // tiny.en token ids; <|0.00|> is TS0, 0.02 s per step
const MAX_NEW = 224, LAYERS = 4, HEADS = 6, HEAD_DIM = 64;

let ortReady = null, model = null;

function status(text) { postMessage({ type: 'status', text }); }

async function fetchCached(url, label) {
  let cache = null;
  try { cache = await caches.open(CACHE); const hit = await cache.match(url); if (hit) return await hit.arrayBuffer(); } catch (e) { /* no cache storage */ }
  const r = await fetch(url);
  if (!r.ok) throw new Error('The speech-to-text download failed (' + r.status + '). Check your connection and try again.');
  const total = +r.headers.get('content-length') || 0, reader = r.body.getReader(), parts = []; let got = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    parts.push(value); got += value.length;
    if (label && total > 1e6) status(`downloading ${label}: ${(got / 1e6).toFixed(0)} / ${(total / 1e6).toFixed(0)} MB (once, then it works offline)`);
  }
  const blob = new Blob(parts);
  try { if (cache) await cache.put(url, new Response(blob)); } catch (e) { /* quota */ }
  return await blob.arrayBuffer();
}

async function load(ortBase, hf) {
  if (model) return model;
  if (!ortReady) {
    importScripts(ortBase + 'ort.wasm.min.js');
    ort.env.wasm.wasmPaths = ortBase;
    ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1)) : 1;
    ortReady = true;
  }
  const base = hf + REPO;
  status('getting the speech-to-text model…');
  const [vocabBuf, genBuf] = await Promise.all([fetchCached(base + 'vocab.json'), fetchCached(base + 'generation_config.json')]);
  const vocab = JSON.parse(new TextDecoder().decode(vocabBuf)), gen = JSON.parse(new TextDecoder().decode(genBuf));
  const idToTok = []; for (const [tok, id] of Object.entries(vocab)) idToTok[id] = tok;
  const encBuf = await fetchCached(base + 'onnx/encoder_model_quantized.onnx', 'speech-to-text (1 of 2)');
  const decBuf = await fetchCached(base + 'onnx/decoder_model_merged_quantized.onnx', 'speech-to-text (2 of 2)');
  status('starting speech-to-text…');
  const opt = { executionProviders: ['wasm'] };
  const enc = await ort.InferenceSession.create(encBuf, opt), dec = await ort.InferenceSession.create(decBuf, opt);
  model = { enc, dec, idToTok, suppress: gen.suppress_tokens || [], beginSuppress: gen.begin_suppress_tokens || [220, EOT], filters: melFilters(), win: hann() };
  return model;
}

/* ---------- audio → log-mel spectrogram, exactly as Whisper expects ---------- */
function hann() { const w = new Float32Array(N_FFT); for (let n = 0; n < N_FFT; n++) w[n] = 0.5 - 0.5 * Math.cos(2 * Math.PI * n / N_FFT); return w; }
function melFilters() { // librosa's Slaney-scale filterbank: 80 triangles over 0–8000 Hz, area-normalised
  const fsp = 200 / 3, minLogHz = 1000, minLogMel = minLogHz / fsp, logStep = Math.log(6.4) / 27;
  const toMel = f => f >= minLogHz ? minLogMel + Math.log(f / minLogHz) / logStep : f / fsp;
  const toHz = m => m >= minLogMel ? minLogHz * Math.exp(logStep * (m - minLogMel)) : m * fsp;
  const bins = N_FFT / 2 + 1, mLo = toMel(0), mHi = toMel(SR / 2), hz = [];
  for (let i = 0; i < N_MEL + 2; i++) hz.push(toHz(mLo + (mHi - mLo) * i / (N_MEL + 1)));
  const f = new Float32Array(N_MEL * bins);
  for (let i = 0; i < N_MEL; i++) {
    const norm = 2 / (hz[i + 2] - hz[i]);
    for (let k = 0; k < bins; k++) {
      const fr = k * SR / N_FFT, lo = (fr - hz[i]) / (hz[i + 1] - hz[i]), hi = (hz[i + 2] - fr) / (hz[i + 2] - hz[i + 1]);
      f[i * bins + k] = Math.max(0, Math.min(lo, hi)) * norm;
    }
  }
  return f;
}
const COS = new Float32Array(N_FFT), SIN = new Float32Array(N_FFT);
for (let i = 0; i < N_FFT; i++) { COS[i] = Math.cos(2 * Math.PI * i / N_FFT); SIN[i] = Math.sin(2 * Math.PI * i / N_FFT); }

function logMel(pcm, m) { // pcm: up to 30 s at 16 kHz → Float32Array(80 × 3000)
  const n = SR * CHUNK_S, half = N_FFT / 2, bins = half + 1;
  const x = new Float32Array(n + N_FFT); // 30 s, zero-padded, then reflect-padded by 200 samples each side
  x.set(pcm.subarray(0, Math.min(pcm.length, n)), half);
  for (let i = 0; i < half; i++) { x[half - 1 - i] = x[half + 1 + i]; x[half + n + i] = x[half + n - 2 - i]; }
  const out = new Float32Array(N_MEL * N_FRAMES), fr = new Float32Array(N_FFT), pw = new Float32Array(bins);
  let max = -Infinity;
  for (let t = 0; t < N_FRAMES; t++) {
    const o = t * HOP; let energy = 0;
    for (let i = 0; i < N_FFT; i++) { const v = x[o + i] * m.win[i]; fr[i] = v; energy += v * v; }
    if (energy < 1e-12) pw.fill(0);
    else for (let k = 0; k < bins; k++) { // a plain DFT: 400 isn't a power of two, and this is quick enough
      let re = 0, im = 0, idx = 0;
      for (let i = 0; i < N_FFT; i++) { re += fr[i] * COS[idx]; im -= fr[i] * SIN[idx]; idx += k; if (idx >= N_FFT) idx -= N_FFT; }
      pw[k] = re * re + im * im;
    }
    for (let i = 0; i < N_MEL; i++) {
      let s = 0; const row = i * bins;
      for (let k = 0; k < bins; k++) s += m.filters[row + k] * pw[k];
      const v = Math.log10(Math.max(s, 1e-10)); out[i * N_FRAMES + t] = v; if (v > max) max = v;
    }
  }
  const floor = max - 8;
  for (let i = 0; i < out.length; i++) out[i] = (Math.max(out[i], floor) + 4) / 4;
  return out;
}

/* ---------- tokens → text (GPT-2 byte-level BPE) ---------- */
const BYTE_OF = (() => { // the reversible byte ↔ printable-character table GPT-2 tokenizers use
  const bs = []; for (let i = 33; i <= 126; i++) bs.push(i); for (let i = 161; i <= 172; i++) bs.push(i); for (let i = 174; i <= 255; i++) bs.push(i);
  const cs = bs.slice(); let n = 0;
  for (let b = 0; b < 256; b++) if (!bs.includes(b)) { bs.push(b); cs.push(256 + n++); }
  const map = {}; bs.forEach((b, i) => { map[String.fromCodePoint(cs[i])] = b; }); return map;
})();
function decodeText(ids, idToTok) {
  const bytes = [];
  for (const id of ids) { const tok = idToTok[id]; if (!tok) continue; for (const ch of tok) { const b = BYTE_OF[ch]; if (b != null) bytes.push(b); } }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/* ---------- one 30-second window: encode, then decode greedily with Whisper's timestamp rules ---------- */
function pickToken(logits, tokens, m) {
  const V = logits.length, NEG = -Infinity;
  for (const t of m.suppress) logits[t] = NEG;
  logits[NO_TS] = NEG;
  const gen = tokens.slice(1); // generated so far, after <|startoftranscript|>
  if (!gen.length) { // must open with a timestamp, within the first second
    for (const t of m.beginSuppress) logits[t] = NEG;
    for (let i = 0; i < TS0; i++) logits[i] = NEG;
    for (let i = TS0 + 51; i < V; i++) logits[i] = NEG;
  } else {
    const last = gen[gen.length - 1], lastTs = last >= TS0, prevTs = gen.length < 2 || gen[gen.length - 2] >= TS0;
    if (lastTs) { if (prevTs) for (let i = TS0; i < V; i++) logits[i] = NEG; else for (let i = 0; i < EOT; i++) logits[i] = NEG; } // timestamps come in pairs
    let latest = -1; for (const t of gen) if (t >= TS0) latest = t;
    if (latest >= 0) { const from = lastTs && !prevTs ? latest : latest + 1; for (let i = TS0; i < from; i++) logits[i] = NEG; } // never go back in time
  }
  // if timestamps together are likelier than any single word, it's time for a timestamp
  let maxText = NEG, maxTs = NEG; for (let i = 0; i < TS0; i++) if (logits[i] > maxText) maxText = logits[i]; for (let i = TS0; i < V; i++) if (logits[i] > maxTs) maxTs = logits[i];
  if (maxTs > NEG) { let sum = 0; for (let i = TS0; i < V; i++) sum += Math.exp(logits[i] - maxTs); if (maxTs + Math.log(sum) > maxText) for (let i = 0; i < TS0; i++) logits[i] = NEG; }
  let best = EOT, bv = NEG; for (let i = 0; i < V; i++) if (logits[i] > bv) { bv = logits[i]; best = i; }
  return best;
}

async function decodeWindow(pcm, m) {
  const feats = new ort.Tensor('float32', logMel(pcm, m), [1, N_MEL, N_FRAMES]);
  const hidden = (await m.enc.run({ input_features: feats }))[m.enc.outputNames[0]];
  const empty = () => new ort.Tensor('float32', new Float32Array(0), [1, HEADS, 0, HEAD_DIM]);
  let past = {}; for (let i = 0; i < LAYERS; i++) for (const side of ['decoder', 'encoder']) for (const kv of ['key', 'value']) past[`past_key_values.${i}.${side}.${kv}`] = empty();
  const tokens = [SOT]; let feed = [SOT], useCache = false, repeats = 0;
  for (let step = 0; step < MAX_NEW; step++) {
    const out = await m.dec.run({ input_ids: new ort.Tensor('int64', BigInt64Array.from(feed.map(BigInt)), [1, feed.length]), encoder_hidden_states: hidden,
      use_cache_branch: new ort.Tensor('bool', [useCache], [1]), ...past });
    const lg = out.logits, V = lg.dims[2], row = lg.data.subarray((lg.dims[1] - 1) * V, lg.dims[1] * V);
    for (let i = 0; i < LAYERS; i++) for (const kv of ['key', 'value']) {
      past[`past_key_values.${i}.decoder.${kv}`] = out[`present.${i}.decoder.${kv}`];
      if (!useCache) past[`past_key_values.${i}.encoder.${kv}`] = out[`present.${i}.encoder.${kv}`]; // the cached branch returns placeholders for these
    }
    const next = pickToken(Float32Array.from(row), tokens, m);
    if (next === EOT) break;
    repeats = next === tokens[tokens.length - 1] && next < TS0 ? repeats + 1 : 0; if (repeats > 8) break; // stuck in a loop
    tokens.push(next); feed = [next]; useCache = true;
  }
  return tokens.slice(1);
}

function toSegments(gen, windowLen, m) { // → {segments, advance}: phrases in this window, and how far to move on
  const segs = []; let start = null, text = [], lastClose = 0;
  for (const t of gen) {
    if (t >= TS0) { const sec = (t - TS0) * 0.02;
      if (text.length) { segs.push({ s: start == null ? lastClose : start, e: sec, text: decodeText(text, m.idToTok) }); text = []; start = null; lastClose = sec; }
      else start = sec;
    } else text.push(t);
  }
  let advance = windowLen;
  if (text.length) { // speech cut off by the end of the window
    if (segs.length && start != null && start > 0) advance = start;                // redo it at the start of the next window
    else segs.push({ s: start == null ? lastClose : start, e: windowLen, text: decodeText(text, m.idToTok) });
  } else if (start != null && segs.length && start > 0 && start < windowLen) advance = start; // a phrase was about to begin
  return { segments: segs.filter(x => x.text.trim() && x.e > x.s), advance: Math.max(1, Math.min(windowLen, advance)) };
}

async function transcribe(pcm, m) {
  const total = pcm.length / SR, all = []; let seek = 0;
  while (seek < total - 0.2) {
    const from = Math.floor(seek * SR), win = pcm.subarray(from, from + SR * CHUNK_S), winLen = Math.min(CHUNK_S, total - seek);
    let energy = 0; for (let i = 0; i < win.length; i += 7) energy += win[i] * win[i];
    let fresh = [], advance = winLen;
    if (Math.sqrt(energy / Math.max(1, win.length / 7)) > 0.0015) { // skip silence rather than let the model invent words for it
      const r = toSegments(await decodeWindow(win, m), winLen, m); advance = r.advance;
      fresh = r.segments.map(x => ({ s: +(seek + x.s).toFixed(2), e: +Math.min(total, seek + x.e).toFixed(2), text: x.text.trim() }));
      all.push(...fresh);
    }
    seek += advance;
    postMessage({ type: 'progress', done: Math.min(total, seek), total, segments: fresh });
  }
  return all;
}

self.onmessage = async e => {
  const d = e.data; if (!d || d.type !== 'transcribe') return;
  try {
    const m = await load(d.ortBase, d.hf);
    status('listening…');
    postMessage({ type: 'done', segments: await transcribe(d.pcm, m) });
  } catch (err) { postMessage({ type: 'error', message: (err && err.message) || String(err) }); }
};
