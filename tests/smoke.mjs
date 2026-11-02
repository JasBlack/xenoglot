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
  for (const v of ['sounds', 'words', 'translate', 'audio', 'script']) {
    await p.goto(URL0 + '#' + v); await p.waitForTimeout(300);
    const shown = await p.evaluate(() => ['sounds','words','translate','audio','script'].filter(x => document.getElementById('v-' + x).getBoundingClientRect().height > 0));
    check(shown.length === 1 && shown[0] === v, `only the ${v} step is shown`);
  }
  await p.goto(URL0 + '#translate'); await p.waitForTimeout(500);
  check((await p.textContent('#outRoman')).trim().length > 10, 'translation produces words');
  await p.click('#tSpeak');
  await p.waitForFunction(() => /s of speech/.test(document.querySelector('#tStatus').textContent), null, { timeout: 20000 });
  check(true, 'speech renders');
  await p.click('#tStop');
  const [audio] = await Promise.all([p.waitForEvent('download'), p.click('#tSaveAudio')]);
  const wav = await readFile(await audio.path());
  check(audio.suggestedFilename().endsWith('.wav') && wav.subarray(0, 4).toString('latin1') === 'RIFF' && wav.length > 44100, 'speech saves as a .wav file');
  check((await p.$$('#exList .chip')).length >= 1, 'examples listed');
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
  const m = await page({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await m.goto(URL0 + '#translate'); await m.waitForTimeout(600);
  check((await m.evaluate(() => document.documentElement.scrollWidth)) <= 390, 'no sideways scroll on a phone');
  check(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
} finally { await browser.close(); server.close(); }
process.exit(failed ? 1 : 0);
