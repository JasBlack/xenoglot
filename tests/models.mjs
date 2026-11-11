// Model test: speech-to-text, natural voices and audio conversion with the real models.
// Unlike the smoke test this needs the network: it downloads about 200 MB from Hugging Face the first time.
//   npm run test:models
// Set XENOGLOT_HF to a local mirror (e.g. http://127.0.0.1:8768/) to run it offline.
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HF = process.env.XENOGLOT_HF || 'https://huggingface.co/';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(root, p.endsWith('/') ? p + 'index.html' : p);
  try { const body = await readFile(file); res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const URL0 = `http://127.0.0.1:${server.address().port}/${process.env.XENOGLOT_HF ? '?hf=' + encodeURIComponent(HF) : ''}`;
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failed++; };

// a public-domain recording: JFK, "ask not what your country can do for you", 11 seconds
const sample = path.join(await mkdtemp(path.join(tmpdir(), 'xenoglot-')), 'jfk.wav');
await writeFile(sample, Buffer.from(await (await fetch(HF + 'datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav')).arrayBuffer()));

const browser = await chromium.launch();
const errors = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
  const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
  const idle = () => p.waitForFunction(() => !document.querySelector('#ledVoice').classList.contains('on'), null, { timeout: 300000 });
  const status = (sel, re, timeout = 600000) => p.waitForFunction(([s, r]) => new RegExp(r).test(document.querySelector(s).textContent), [sel, re], { timeout });

  await p.goto(URL0 + '#audio'); await p.waitForTimeout(800);
  await p.setInputFiles('#fileTrack', sample);
  await status('#dInfo', 'phrases');
  await p.click('#dTranscribe');
  await status('#dAsr', 'written down|no speech');
  const heard = (await p.inputValue('#dTranscript')).toLowerCase();
  check(heard.includes('ask not what your country can do for you') && heard.includes('ask what you can do for your country'), 'speech-to-text hears the JFK recording: ' + JSON.stringify(heard.replace(/\n/g, ' / ')));
  check(heard.split('\n').length >= 2, 'it comes back as timed phrases, one per line');

  await p.click('#dGo'); await status('#dStatus', 'made in');
  check(/placed on the original’s timing · built-in voice/.test(await p.textContent('#dStatus')), 'converts with the built-in voice on the original timing');

  for (const [id, label] of [['kristin', 'natural · female'], ['heart', 'natural+ · female']]) {
    await p.goto(URL0 + '#sounds'); await p.waitForTimeout(600);
    await p.click(`#vEngine .chip[data-v="${id}"]`);
    await status('#engineStatus', 'ready'); await p.waitForTimeout(600); await idle();
    await p.goto(URL0 + '#translate'); await p.waitForTimeout(600);
    await p.fill('#enText', 'We came a long way to meet you. Will you speak with us?'); await p.dispatchEvent('#enText', 'input');
    await p.click('#tSpeak'); await status('#tStatus', 'of speech');
    check(/of speech · made in/.test(await p.textContent('#tStatus')), `${label} speaks`);
    await p.click('#tStop');
  }
  await p.goto(URL0 + '#audio'); await p.waitForTimeout(600);
  await p.setInputFiles('#fileTrack', sample); await status('#dInfo', 'phrases');
  await p.click('#dGo'); await status('#dStatus', 'made in');
  check(/placed on the original’s timing · natural\+ · female/.test(await p.textContent('#dStatus')), 'loading another recording clears the old transcript, and it converts with a natural voice: ' + JSON.stringify(await p.textContent('#dStatus')));
  check(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
} finally { await browser.close(); server.close(); }
process.exit(failed ? 1 : 0);
