# Xenoglot (xenoglot.jas.black)

A JAS.BLACK console tool for inventing a spoken language on English grammar: sounds → words → translate → audio → script/font.

## Stack
- Static site, no build step: `index.html`, `style.css`, `app.js` (one IIFE, plain JS).
- Web Audio `OfflineAudioContext` formant synthesizer (no samples). Audio saves as `.wav` (instant, `wavBytes`); `MediaRecorder` only for mic takes and the claude.ai-artifact fallback.
- `vendor/opentype.min.js` 1.3.4 (MIT) builds the font. Vendored, no runtime CDN.
- Google Fonts: IBM Plex Mono, Archivo (family title) and Charis SIL (only for the language's own text, because it carries the IPA letters). Not essential; fallbacks are set.

## Folder map
- `index.html`: head (title/OG per the family's head.html), markup for the top bar, left column and five step views.
- `style.css`: family tokens (dark + light) and components from `family.css` (Nov 2026), plus Xenoglot's own components built only from those tokens.
- `app.js`, in order: sound palette `PAL` · utilities · language state `DEFAULT`/`PRESETS` · word generation (`makeSyl`, `root`, `affix`, `alienWord`) · translation · synth (`wordsToSegs`, `render`) · playback/export · recordings · take splitting · glyph engine (`GEN`, `genGlyph`, `outline`) · font (`buildFont`) · step UIs · sliders · library/share links/examples/drag-drop · routing · theme and family behaviours · boot.
- `examples/`: example languages plus `index.json` (the list shown under Examples).
- `tests/smoke.mjs`: Playwright smoke test (`npm test`).
- Icons, `og.jpg` (built from the tool's own screen), `site.webmanifest`, `CNAME`, `.nojekyll`.

## Commands
- Run: `python3 -m http.server 8000` → http://localhost:8000
- Debug hooks: add `?debug` to the URL to get `window.__xg` (`getLang`, `setTrim`, `run`) for measuring levels.
- Test: `npm install && npx playwright install chromium && npm test` (17 checks, including the .wav and .otf downloads)

## Deployment
GitHub Pages from `main`, root folder. `CNAME` = `xenoglot.jas.black`. Repo `JasBlack/xenoglot`, MIT.

## Data
- `localStorage` keys (versioned): `xenoglot-v1-library` (`{current, langs:{id: language}}`), `xenoglot-v1-recs-<id>` (base64 clips per language), `xenoglot-v1-text`, `xenoglot-ui`.
- Language file (`.json`) = the language object plus `recordings`. Share link = `?l=` + `z` + base64url(deflate-raw(JSON)), glyph points rounded to whole numbers, recordings left out. Links opened twice dedupe by `src`.
- Words are deterministic: a word comes from `hash(seed + word)`, so the same language always gives the same words. Glyphs come from `gseed` + style + weirdness, and hand-drawn letters are stored as points.

## Status
- Works: everything above; desktop and phone layouts (bottom tab bar under 850 px); light/dark; right-click slider reset; Space/N/1–5 shortcuts; save/open/share/examples/drag-drop.
- Verified (Nov 2026): fonts from every style/pen pass fontTools and OTS (the browsers' font sanitizer), with 80 characters (all letters in both cases, space and `! ' , - . ?`). An 8-minute speech-like track converts in about 14 s (4 s analysis, 10 s render) in headless Chromium, with phrase and syllable counts exact (190/190, 1544/1544). The JS heap peaks around 435 MB.
- Known issues: the voice is a formant synthesizer. It's clear but not human-real. Next step is a neural voice (Piper, MIT, ONNX in the browser) fed with the IPA string, keeping the current effects on top and the synth as fallback. Check each Piper voice's licence before bundling. The build environment couldn't reach huggingface.co, so the models weren't tried yet. Long tracks near the 10-minute cap may be heavy for older phones.
- Unverified: the .otf installing on macOS/Windows (it passes OTS, but no OS install was tried); mic recording on iOS Safari.

## Gotchas (hard-won)
- **Levels are measured, not guessed.** `NOISE_TRIM` and the per-sound `ng` values put hiss 10–20 dB under the vowels (s −12, f −22, nasals −10 relative to /a/). Loudness normalises on the 98.5th percentile with tanh soft-clip. Peak normalising let clicks shrink the vowels and made speech sound like noise.
- The vowel tract is a **cascade of resonant low-pass biquads** (Q in dB = 20·log10(F/BW)) plus a fixed lip-radiation IIR. Parallel band-passes sounded hollow and buzzy.
- When measuring a sound with `__xg.run`, the first `[null,.05]` segment shifts everything by 50 ms. Measure from 0.10 s.
- `[hidden]{display:none!important}` must stay in `style.css`: `.view{display:grid}` otherwise shows every step at once.
- Phone layout: `main.console` is a flex column with `align-items:stretch`, and `.lcd.block span` must wrap. The family `.lcd span{white-space:nowrap}` once pushed the page to 834 px wide.
- Right-click reset defaults are captured after a language loads (`captureDefaults()`), not at script start, or they reset to the slider midpoint.
- Downloads use `window.claude.use('downloads')` when hosted as a claude.ai artifact, else a normal `<a download>`. The artifact allowlist has no .otf or .wav, so there the font saves as .ttf and audio records to .webm in real time. The hosted site uses .otf and .wav.
- opentype.js 1.3.4 writes only a glyph's first code point into `cmap`. Capitals need their own glyph copy, not `unicodes:[…]`.
