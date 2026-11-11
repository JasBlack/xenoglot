// Smoke test: serves the folder, opens it in Chromium and walks every step.
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webmanifest':'application/manifest+json' };
const server = http.createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(root, p.endsWith('/') ? p + 'index.html' : p);
  try { const body = await readFile(file); res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const URL0 = `http://127.0.0.1:${server.address().port}/`;
let failed = 0;
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failed++; };

const browser = await chromium.launch();
const errors = [];
const page = async (opts = {}) => {
  const ctx = await browser.newContext({ acceptDownloads: true, ...opts });
  await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
  const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message)); return p;
};
try {
  const p = await page({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL0); await p.waitForTimeout(800);
  check((await p.title()) === 'Xenoglot - JAS.BLACK', 'tab title');
  check(await p.isVisible('#v-translate') && await p.isVisible('#intro'), 'a first visit opens on the speak section with the welcome');
  const stop = () => p.evaluate(() => { const k = document.querySelector('#tSpeak'); if (k.classList.contains('playing')) k.click(); });
  const open = id => p.evaluate(i => { document.querySelector(i).open = true; }, id);
  await p.click('#introClose'); await p.reload(); await p.waitForTimeout(600);
  check(!(await p.isVisible('#intro')), 'the welcome stays closed once dismissed');
  for (const v of ['sounds', 'words', 'translate', 'audio', 'script']) {
    await p.goto(URL0 + '#' + v); await p.waitForTimeout(300);
    const shown = await p.evaluate(() => ['sounds','words','translate','audio','script'].filter(x => document.getElementById('v-' + x).getBoundingClientRect().height > 0));
    check(shown.length === 1 && shown[0] === v, `only the ${v} section is shown`);
  }
  await p.goto(URL0 + '#translate'); await p.waitForTimeout(500);
  check((await p.textContent('#outRoman')).trim().length > 10, 'translation produces words');
  const typed = await p.inputValue('#enText');
  await p.fill('#enText', 'I have 42 ships'); await p.dispatchEvent('#enText', 'input');
  check((await p.$$eval('#outRoman .w', w => w.map(x => x.title).join(' '))) === 'I have forty two ships', 'numbers are spoken as words');
  await p.fill('#enText', typed); await p.dispatchEvent('#enText', 'input');
  await p.click('#tSpeak');
  await p.waitForFunction(() => /s of speech/.test(document.querySelector('#tStatus').textContent), null, { timeout: 20000 });
  check(true, 'speech renders');
  await stop();
  const est = await p.textContent('#tEst');
  const made = await p.textContent('#tStatus');
  check(/≈ .+ of speech · ready in about/.test(est) && est.match(/≈ ([\d.]+) s/)?.[1] === made.match(/^([\d.]+) s/)?.[1], 'length estimate matches the built-in voice');
  await open('#tOpts'); await p.click('label:has(#fitOn)');
  await p.fill('#fitSecs', '8'); await p.dispatchEvent('#fitSecs', 'input');
  await p.evaluate(() => { document.querySelector('#tStatus').textContent = ''; });
  await p.click('#tSpeak');
  await p.waitForFunction(() => /of speech/.test(document.querySelector('#tStatus').textContent), null, { timeout: 20000 });
  await stop();
  check(/^8\.0 s of speech \(asked for 8\.0 s\)/.test(await p.textContent('#tStatus')), 'fit to a length lands 8 s exactly');
  await p.click('label:has(#fitOn)');
  await open('#tMore');
  const [audio] = await Promise.all([p.waitForEvent('download'), p.click('#tSaveAudio')]);
  const wav = await readFile(await audio.path());
  check(audio.suggestedFilename().endsWith('.wav') && wav.subarray(0, 4).toString('latin1') === 'RIFF' && wav.length > 44100, 'speech saves as a .wav file');
  const [share] = await Promise.all([p.waitForEvent('download'), p.click('#tSaveMp3')]);
  const mp3 = await readFile(await share.path());
  const mp3ok = mp3.subarray(0, 3).toString('latin1') === 'ID3' || (mp3[0] === 0xff && (mp3[1] & 0xe0) === 0xe0);
  check(share.suggestedFilename().endsWith('.mp3') && mp3ok && mp3.length > 10000 && mp3.length < wav.length / 3, 'speech saves as a small .mp3 for sharing');
  await p.click('#langToggle');
  check((await p.$$('#exList .chip')).length >= 1, 'examples listed in the library');
  await p.click('#exList .chip:nth-child(2)'); await p.waitForTimeout(600);
  const name = await p.inputValue('#langName');
  await p.click('#btnShare'); await p.waitForTimeout(300);
  const link = await p.inputValue('#shareOut');
  check(link.includes('?l=z') || link.includes('?l=j'), 'share link made');
  const words = await p.textContent('#outRoman');
  const q = await page({ viewport: { width: 1280, height: 900 } });
  await q.goto(link); await q.waitForTimeout(900);
  check((await q.inputValue('#langName')) === name, 'share link opens the same language');
  await q.goto(URL0 + '#translate'); await q.waitForTimeout(400);
  check((await q.textContent('#outRoman')) === words, 'share link gives the same words');
  await p.goto(URL0 + '#script'); await p.waitForTimeout(800);
  check(!(await p.textContent('#fStatus')).trim(), 'font builds');
  const [font] = await Promise.all([p.waitForEvent('download'), p.click('#fSave')]);
  const otf = await readFile(await font.path());
  check(font.suggestedFilename().endsWith('.otf') && otf.subarray(0, 4).toString('latin1') === 'OTTO', 'font saves as an OpenType .otf file');
  // the speaking head
  await p.goto(URL0 + '#translate'); await p.waitForTimeout(700);
  const lit = () => p.evaluate(() => { const c = document.querySelector('#headCanvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i] + d[i + 1] + d[i + 2] > 120) n++; return n; });
  check((await lit()) > 300, 'the head is drawn on the monitor');
  const seedA = await p.getAttribute('#headCanvas', 'data-seed'); await p.click('#headNew'); await p.waitForTimeout(200);
  const seedB = await p.getAttribute('#headCanvas', 'data-seed');
  check(seedA && seedB !== seedA, 'new creature grows a different head');
  await p.waitForTimeout(1500); await stop();
  const before = await p.textContent('#outRoman'); await p.click('#btnRandom'); await p.waitForTimeout(700);
  check((await p.getAttribute('#headCanvas', 'data-seed')) === seedB && (await p.textContent('#outRoman')) !== before, 'new language changes the words and keeps the head');
  await p.fill('#enText', 'Hello traveler.'); await p.dispatchEvent('#enText', 'input');
  const [video] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.click('#headVideo')]);
  const vid = await readFile(await video.path()), webm = vid.readUInt32BE(0) === 0x1a45dfa3, mp4 = vid.subarray(4, 8).toString('latin1') === 'ftyp';
  check(/\.(mp4|webm)$/.test(video.suggestedFilename()) && (webm || mp4) && vid.length > 30000, 'the head speaking saves as a video file');
  const m = await page({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await m.goto(URL0 + '#translate'); await m.waitForTimeout(600);
  check((await m.evaluate(() => document.documentElement.scrollWidth)) <= 390, 'no sideways scroll on a phone');
  const folded = !(await m.isVisible('#libSel')); await m.tap('#langToggle');
  check(folded && await m.isVisible('#libSel'), 'on a phone the library is folded until asked for');
  check(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
} finally { await browser.close(); server.close(); }
process.exit(failed ? 1 : 0);
