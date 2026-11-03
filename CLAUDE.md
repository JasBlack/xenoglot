# Xenoglot (xenoglot.jas.black)

A JAS.BLACK console tool for inventing a spoken language on English grammar: sounds → words → translate → audio → script/font.

## Stack
- Static site, no build step: `index.html`, `style.css`, `app.js` (one IIFE, plain JS).
- Web Audio `OfflineAudioContext` formant synthesizer (no samples). Audio saves as `.wav` (instant, `wavBytes`); `MediaRecorder` only for mic takes and the claude.ai-artifact fallback.
- `vendor/opentype.min.js` 1.3.4 (MIT) builds the font. Vendored, no runtime CDN.
- Natural voice: `vendor/ort/` = onnxruntime-web 1.20.1 wasm-only build (MIT; `ort.wasm.min.js`, `ort-wasm-simd-threaded.mjs`/`.wasm`, about 11 MB), loaded only when a natural voice is picked. Piper models are fetched from Hugging Face on demand (CORS allowed) and kept in Cache Storage `xenoglot-voices-v1`. Optional: the synth is the fallback, so this doesn't break the no-runtime-CDN rule for anything essential.
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
- Words are deterministic: a word comes from `hash(seed + word)`, so the same language always gives the same words. Changing `makeSyl`/`makeWord`/`langWeights` changes every saved language's words. Version 1.2.0 did this once, before launch. After launch, keep the old generator behind a `gen` field on the language rather than changing it in place. Glyphs come from `gseed` + style + weirdness, and hand-drawn letters are stored as points.

## Status
- Works: everything above; desktop and phone layouts (bottom tab bar under 850 px); light/dark; right-click slider reset; Space/N/1–5 shortcuts; save/open/share/examples/drag-drop.
- Verified (Nov 2026): fonts from every style/pen pass fontTools and OTS (the browsers' font sanitizer), with 80 characters (all letters in both cases, space and `! ' , - . ?`). An 8-minute speech-like track converts in about 14 s (4 s analysis, 10 s render) in headless Chromium, with phrase and syllable counts exact (190/190, 1544/1544). The JS heap peaks around 435 MB.
- Verified (1.3.0): both natural voices load and speak in headless Chromium. Model start is about 11–16 s, excluding the download. Three sentences generate in 4–5 s, about 2× real time, single-threaded wasm. Audio levels are healthy and there are no errors. The models were served from local copies in the test, so the real Hugging Face download and Cache Storage reuse in a browser are untested.
- Known issues: the natural voice is an English-trained model, so non-English sounds (y, ø, ɯ, clicks, ɬ) come out approximated. Audio-track conversion and recorded sounds stay on the built-in synth. Long tracks near the 10-minute cap may be heavy for older phones.
- Unverified: the .otf installing on macOS/Windows (it passes OTS, but no OS install was tried); mic recording on iOS Safari.

## Word shapes (1.2.0)
- `FREQ` weights every sound by how common it is across languages, times a per-language factor from the seed (`langWeights`), so each language has favourite sounds.
- `CODA` lists the sounds allowed to end a syllable, weighted. Clicks never end one.
- Clusters only rise in loudness: a stop or fricative plus l/r/ř/w/j. At most one click or catch (`c`, `ʔ`) per word, only after a vowel or at word start. Onsets are forced 93% of the time after a vowel, consonants aren't doubled across a join, and a syllable isn't repeated back to back.

## Recordings (1.2.0)
- `REC` per sound type: `hold` sounds (vowels, nasals, fricatives, glides, trill) play the steady middle of the clip at the synth's duration, and short ones (stops, clicks, catch) play whole, capped at 0.16 s.
- Levels: each clip is scaled so its RMS = synth /a/ RMS for the current voice (`refLevel`, cached per voice) × `REC[type].level`. The levels are the synth's measured mix.
- Hints (`recHint`) appear on the rec buttons, in the take order (bar = hold, dot = short) and as a toast when recording.

## Natural voice (1.3.0)
- `NATURAL` lists the voices (id → label, Hugging Face URL stem, natural pitch). `L.engine` = `synth` | `kristin` | `norman`, stored per language and carried in share links.
- Voices: only public-domain or CC0 Piper voices. kristin and norman (LibriVox, public domain) are used. Also clean: ljspeech, cori, john, bryce, joe (CC0). Avoid ryan and hfc_* (CC BY-NC-SA) and lessac (Blizzard licence).
- Input: the language's IPA from `PM[k].ipa`, `ˈ` before each word, phrases ended with `, . ?`. IDs = `^ _ p1 _ p2 _ … $` from the voice's `phoneme_id_map`. Every IPA symbol Xenoglot uses (including ǀ) is in the map.
- Effects: pitch and throat size become one resample rate (`(pitch/voicePitch)^0.6 × formant^0.8`, clamped 0.5–2). `length_scale = rate / speed` keeps the speed right. Roughness feeds `noise_scale`/`noise_w`. Warble = LFO on detune. Many voices = two detuned, delayed copies. Metallic and space reuse the synth's ring mod and reverb.
- `speakWords` routes speech through the chosen engine and falls back to the synth on any error. Sound previews use it too. `render` (the synth) is still called directly for audio-track conversion.

## Gotchas (hard-won)
- **Levels are measured, not guessed.** `NOISE_TRIM` and the per-sound `ng` values put hiss 10–20 dB under the vowels (s −12, f −22, nasals −10 relative to /a/). Loudness normalises on the 98.5th percentile with tanh soft-clip. Peak normalising let clicks shrink the vowels and made speech sound like noise.
- The vowel tract is a **cascade of resonant low-pass biquads** (Q in dB = 20·log10(F/BW)) plus a fixed lip-radiation IIR. Parallel band-passes sounded hollow and buzzy.
- When measuring a sound with `__xg.run`, the first `[null,.05]` segment shifts everything by 50 ms. Measure from 0.10 s.
- `[hidden]{display:none!important}` must stay in `style.css`: `.view{display:grid}` otherwise shows every step at once.
- Phone layout: `main.console` is a flex column with `align-items:stretch`, and `.lcd.block span` must wrap. The family `.lcd span{white-space:nowrap}` once pushed the page to 834 px wide.
- Right-click reset defaults are captured after a language loads (`captureDefaults()`), not at script start, or they reset to the slider midpoint.
- Downloads use `window.claude.use('downloads')` when hosted as a claude.ai artifact, else a normal `<a download>`. The artifact allowlist has no .otf or .wav, so there the font saves as .ttf and audio records to .webm in real time. The hosted site uses .otf and .wav.
- opentype.js 1.3.4 writes only a glyph's first code point into `cmap`. Capitals need their own glyph copy, not `unicodes:[…]`.
