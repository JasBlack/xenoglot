# Xenoglot (xenoglot.jas.black)

A JAS.BLACK console tool for inventing spoken alien languages on English grammar. The mission: every language should sound unique and real. A creature (head + voice) speaks a language (sounds + words + accent + script).

## Stack
- Static site, no build step: `index.html`, `style.css`, `app.js` (one IIFE, plain JS).
- Web Audio `OfflineAudioContext` formant synthesizer (no samples). Audio saves as `.wav` (instant, `wavBytes`) or `.mp3` for sharing (`exportMp3`; WhatsApp won't play .wav inline). `MediaRecorder` only for mic takes and the claude.ai-artifact fallback.
- `.mp3`: `vendor/lame/lame.min.js` = lamejs 1.2.1 (LGPL-3.0, kept as an unmodified separate file so the rest stays MIT), loaded lazily. 128 kbps mono at the buffer's rate (resampled to 44.1 kHz if lamejs can't take it). Measured: a 14 s sentence becomes 223 KB (the .wav is 1.2 MB); an 8-minute track encodes in 12 s to 7.7 MB. ffprobe reads both with exact durations. M4A was considered, but browsers only encode AAC where the OS has an encoder (not Linux, not Firefox).
- `vendor/opentype.min.js` 1.3.4 (MIT) builds the font. Vendored, no runtime CDN.
- Natural voices: `vendor/ort/` = onnxruntime-web 1.20.1 wasm-only build (MIT; `ort.wasm.min.js`, `ort-wasm-simd-threaded.mjs`/`.wasm`, about 11 MB), loaded only when a natural voice is picked. It runs inference in a web worker (`ort.env.wasm.proxy=true`). Piper and Kokoro models are fetched from Hugging Face on demand (CORS allowed) and kept in Cache Storage `xenoglot-voices-v1`. Optional: the synth is the fallback, so this doesn't break the no-runtime-CDN rule for anything essential.
- Google Fonts: IBM Plex Mono, Archivo (family title) and Charis SIL (only for the language's own text, because it carries the IPA letters). Not essential; fallbacks are set.

## Folder map
- `index.html`: head (title/OG per the family's head.html), the top bar (title, five section tabs `nav.steps`, library key), the speaker column (`.headcol`: head, name, speak, new language, new creature, video), the library panel (`.langpanel`, shown with `.open`) and the five section views.
- `head.js`: the speaking head (`window.XenoHead`). Self-contained: DNA from a seed, geometry, line work, mouth shapes, canvas drawing. Knows nothing about languages except the sound table it's given.
- `asr-worker.js`: speech-to-text worker (Whisper tiny.en on onnxruntime-web). Self-contained.
- `style.css`: family tokens (dark + light) and components from `family.css` (Nov 2026), plus Xenoglot's own components built only from those tokens.
- `app.js`, in order: sound palette `PAL` · utilities · language state `DEFAULT`/`PRESETS` · word generation (`makeSyl`, `root`, `affix`, `alienWord`) · translation · synth (`wordsToSegs`, `render`) · playback/export · recordings · take splitting · glyph engine (`GEN`, `genGlyph`, `outline`) · font (`buildFont`) · step UIs · sliders · library/share links/examples/drag-drop · routing · theme and family behaviours · boot.
- `examples/`: example languages plus `index.json` (the list shown under Examples).
- `tests/smoke.mjs`: Playwright smoke test, offline (`npm test`). `tests/models.mjs`: speech-to-text, natural voices and conversion with the real models (`npm run test:models`; needs Hugging Face, or `XENOGLOT_HF=http://127.0.0.1:PORT/` for a local mirror that serves files by name).
- `.github/workflows/test.yml`: runs `npm test` on pushes to main and on pull requests.
- Icons, `og.jpg` (built from the tool's own screen), `site.webmanifest`, `CNAME`, `.nojekyll`.

## Commands
- Run: `python3 -m http.server 8000` → http://localhost:8000
- Debug hooks: add `?debug` to the URL to get `window.__xg` (`getLang`, `setTrim`, `run`) for measuring levels.
- Test: `npm install && npx playwright install chromium && npm test` (30 checks, including the downloads (.wav, .mp3, .otf, video), the length estimate and fit, the welcome, spoken numbers, the phone layout and the head). `npm run test:models` adds 13 checks with real models (every natural voice).
- On localhost only, `?hf=http://…/` makes the app fetch models from that address instead of huggingface.co (tests use it).

## Deployment
GitHub Pages from `main`, root folder. `CNAME` = `xenoglot.jas.black`. Repo `JasBlack/xenoglot`, MIT.

## Data
- `localStorage` keys (versioned): `xenoglot-v1-library` (`{current, langs:{id: language}}`), `xenoglot-v1-recs-<id>` (base64 clips per language), `xenoglot-v1-text`, `xenoglot-ui`.
- Language file (`.json`) = the language object plus `recordings`. Share link = `?l=` + `z` + base64url(deflate-raw(JSON)), glyph points rounded to whole numbers, recordings left out. Links opened twice dedupe by `src`.
- Words are deterministic: a word comes from `hash(seed + word)`, so the same language always gives the same words. Changing `makeSyl`/`makeWord`/`langWeights` changes every saved language's words. Version 1.2.0 did this once, before launch. After launch, keep the old generator behind a `gen` field on the language rather than changing it in place. Glyphs come from `gseed` + style + weirdness, and hand-drawn letters are stored as points.

## Status
- Works: everything above; desktop and phone layouts (bottom tab bar under 850 px, library folded behind one key); light/dark; right-click slider reset; Space/N/1–5 shortcuts; save/open/share/examples/drag-drop; first-visit welcome; home is the translate step.
- Verified (2.0.0): speech-to-text hears the JFK sample word for word, in two timed phrases, 11 s of audio in under 3 s. A 56 s track crossing two 30 s windows gives 8 correct phrases in 8 s. Converted speech lines up with the original within 0.1 s (built-in voice). All checked in headless Chromium with models from a local mirror.
- Verified (Nov 2026): fonts from every style/pen pass fontTools and OTS (the browsers' font sanitizer), with 80 characters (all letters in both cases, space and `! ' , - . ?`). An 8-minute speech-like track converts in about 14 s (4 s analysis, 10 s render) in headless Chromium, with phrase and syllable counts exact (190/190, 1544/1544). The JS heap peaks around 435 MB.
- Verified (1.3.0): both natural voices load and speak in headless Chromium. Model start is about 11–16 s, excluding the download. Three sentences generate in 4–5 s, about 2× real time, single-threaded wasm. Audio levels are healthy and there are no errors. The models were served from local copies in the test, so the real Hugging Face download and Cache Storage reuse in a browser are untested.
- Known issues: the natural voice is an English-trained model, so non-English sounds (y, ø, ɯ, clicks, ɬ) come out approximated. Audio-track conversion and recorded sounds stay on the built-in synth. Long tracks near the 10-minute cap may be heavy for older phones.
- Unverified: the .otf installing on macOS/Windows (it passes OTS, but no OS install was tried); mic recording on iOS Safari; the share sheet (`navigator.share` with files) on a real phone; video recording as H.264 .mp4 (headless Chromium has no H.264 encoder, so tests got .webm); how the head and the voices look and sound to a person.

## Layout and simplification (2.2.0)
- One of everything: one speak key (`#tSpeak`, under the head; it toggles to stop and jumps to the speak section), one new-language key, save audio (`#headAudio`, the .mp3 of the speech, or of the converted track on the audio section) and save video under the head, save/open/share only in the library. The top-bar transport, the status LEDs (kept hidden: the code still lights them), the numbered steps, the panel numbers, the next-step keys and the 1–5 shortcuts are gone. Space and N remain.
- Sections (tabs): speak (`#translate`, home), voice (`#sounds`), words, audio, script. The hashes and `#v-*` ids are unchanged.
- **new language** keeps the creature: `L.head`, `L.engine` and `L.voice` carry over; sounds, word shapes, accent and script are new. **new creature** (`#headNew`) gives a new head and a new voice character (`randomVoice`) and keeps the language.
- Less-used parts fold: `details.more` (options, more ways to save, fine-tune, the words for audio) start closed; `details.panel.fold` wraps record-your-own-voice, how-many-sounds and draw-a-letter (picking a letter opens it).
- Phones (under 850 px): top bar, then the head (34vh), name, a 52 px speak key, the three keys, then the section; tabs are a fixed bottom bar. In the other sections the speaker column shrinks to a 170 px head strip (`body[data-view]`), and head.js uses a compact read-out when the canvas is under 230 px tall.

## Accent (2.2.0)
- `L.accent` = `{stress, stressLen, vLen, cLen, longV, melody, range, gap, tempo, final, qRise}` from `makeAccent(rng)`. `ACCENT0` is how everything was spoken before; Velnari keeps it. Languages saved without one get `makeAccent` from `hash(seed + '|accent')`, the same every time. Carried in files and share links.
- `sylInfo(keys, A, word)` gives vowel positions, the stressed vowel (`first last penult even`), which vowels are long (hash of the word) and each syllable's tone.
- Built-in voice: `wordsToSegs` uses it for durations, the phrase tune (`fall rise step`, or level for the per-syllable tunes `wave tone`, or `flat`), word gaps, pace, final lengthening and whether questions rise.
- Natural voices: `wordIpa` puts `ˈ` where the accent stresses and `ː` after long vowels; `tempo` goes into `length_scale`; `melodyCurve` bends each phrase's pitch with a detune curve on the clip (skipped while fitting a length). The voice's own intonation is still underneath.
- The voice section shows it in words (`renderAccent`) with a **new accent** key.

## 2.5.0: phones, voices, characters, video, speed
- Opening the page: unless the current language is one the person changed, a new random language and creature is made each time (`L.auto = 1`, set after `useLang` because `normaliseLang` strips it from anything loaded). Since 2.6.1 they always start in the same voice, the preset `START_VOICE` = `Elder giant` on the `origin` engine (pitch 45, speed 0.8, throat 0.72), chosen by Jas; **new creature** still rolls a random voice. `saveLang()` (every user edit) removes the flag; the previous untouched auto language is deleted at the next open. Velnari (`DEFAULT`) is now only the fallback shape for `normaliseLang`.
- Audio on phones: `unlockAudio()` runs on every pointerdown/touchend/keydown/click (capture): resumes the context, plays a one-sample buffer, sets `navigator.audioSession.type = 'playback'` where it exists, and on iOS keeps a silent looping `<audio>` playing so the ringer switch doesn't mute Web Audio. Not tested on a real phone.
- Voice names are abstract: `origin` (the synth), quick Piper voices `clarity gravity patience grace haste`, lifelike Kokoro voices `wonder + resolve + reverie + valour + devotion + longing +`. `NATURAL[id].about` says what each was trained on and is the chip's tooltip. The speak section shows `#voiceNudge` while the voice is `origin`; its key switches to a quick voice (one already cached if any).
- Characters: 23 presets. Growl (amplitude shaken at half the pitch) and breath now also apply to recorded voices in `naturalFx`. Breath is band-passed noise whose gain follows each clip's own 10 ms loudness envelope (zero under the quietest 8%); 2.5.0 held it at one level under the whole clip, which was the white-noise bed people heard (fixed 2.6.3). Every character works with every voice, so every character works with every voice. Recordings of your own voice remain origin-only.
- A cached recorded voice starts loading at boot (`piperVoice` after `checkVoiceCache`). `#vTry` says it is making the sample.
- Alphabet styles: 23 (new: constellation, cuneiform, ogham, rings, braille, seismic, petals, crescent, fork). The style list is open by default. `mixed` draws from all of them.
- Video: `#vFmt` picks 9:16 or 4:5 (`xenoglot-v1-vfmt`). `head.setFormat([w, h])` fixes the canvas pixel size while recording (720 wide on phones and machines with 4 cores or fewer, else 1080); CSS `object-fit: contain` keeps it undistorted on screen, and `draw()` lays out for a 360 px wide design. Still MediaRecorder: .mp4 where the browser can, else .webm with a note.
- Head speed: `tick()` times `step + draw`; over 24 ms for 1.5 s lowers `quality` (0–2): canvas scale 2 → 1.5 → 1.25, no bloom pass, half the stars. Under 7 ms for 8 s raises it again.
- Mark (2.5.3): the top right of the monitor carries the JAS.BLACK mark (the eye in a ring with six curling arms from jas.black's `favicon.svg`; `JBARM` is one arm's path as points), drawn in the creature's own style and colour: a disc of starfield skin, the ring in cream ink, arms as three-pass glow lines in `col.feat`, and an almond void eye with faint stars and one cross star that follows `st.look`. The arms turn slowly and bend from the root with the voice; it blinks every 4.3 s. Under it sits the wordmark `jasblack.webp` (passed in as `opts.signature`, a copy of jas.black's `logo-sm.webp`), so screenshots and videos are signed; it is left out on the short phone strip.

## Word shapes (1.2.0)
- `FREQ` weights every sound by how common it is across languages, times a per-language factor from the seed (`langWeights`), so each language has favourite sounds.
- `CODA` lists the sounds allowed to end a syllable, weighted. Clicks never end one.
- Clusters only rise in loudness: a stop or fricative plus l/r/ř/w/j. At most one click or catch (`c`, `ʔ`) per word, only after a vowel or at word start. Onsets are forced 93% of the time after a vowel, consonants aren't doubled across a join, and a syllable isn't repeated back to back.

## Recordings (1.2.0)
- `REC` per sound type: `hold` sounds (vowels, nasals, fricatives, glides, trill) play the steady middle of the clip at the synth's duration, and short ones (stops, clicks, catch) play whole, capped at 0.16 s.
- Levels: each clip is scaled so its RMS = synth /a/ RMS for the current voice (`refLevel`, cached per voice) × `REC[type].level`. The levels are the synth's measured mix.
- Hints (`recHint`) appear on the rec buttons, in the take order (bar = hold, dot = short) and as a toast when recording.

## Natural voice (1.3.0)
- `NATURAL` lists the voices (id → label, Hugging Face URL stem, natural pitch). `L.engine` = `synth` or a voice id, stored per language and carried in share links.
- 2.2.0 voices. Piper (63 MB each): kristin, norman (English, public domain), harri (Finnish, CC0), anna (Hungarian, CC0), vais (Vietnamese vais1000, CC BY 4.0: credit it). Kokoro (one shared 92 MB model, labels end in +): heart, michael, alpha (`jf_alpha`), yunjian (`zm_yunjian`), hindi (`hf_alpha`), nicola (`im_nicola`). Voices trained on other languages say the same IPA with a different accent, which is the point. All Piper voices share one phoneme table; the Vietnamese one lacks ASCII `g`, so `phonemeIds` falls back to `ɡ`. The `pitch` of the new voices is an estimate, not measured.
- Checked licences, not usable: tr_TR-dfki (CC BY-NC-SA), zh_CN-huayan (unknown). kk_KZ-issai (CC BY 4.0) is fine but only comes in the large size.
- Voices: only public-domain or CC0 Piper voices. kristin and norman (LibriVox, public domain) are used. Also clean: ljspeech, cori, john, bryce, joe (CC0). Avoid ryan and hfc_* (CC BY-NC-SA) and lessac (Blizzard licence).
- Input: the language's IPA from `PM[k].ipa`, `ˈ` before each word, phrases ended with `, . ?`. IDs = `^ _ p1 _ p2 _ … $` from the voice's `phoneme_id_map`. Every IPA symbol Xenoglot uses (including ǀ) is in the map.
- Effects: pitch and throat size become one resample rate (`(pitch/voicePitch)^0.6 × formant^0.8`, clamped 0.5–2). `length_scale = rate / speed` keeps the speed right. Roughness feeds `noise_scale`/`noise_w`. Warble = LFO on detune. Many voices = two detuned, delayed copies. Metallic and space reuse the synth's ring mod and reverb.
- `speakWords` routes speech through the chosen engine and falls back to the synth on any error. Sound previews use it too. `render` (the synth) is still called directly for audio-track conversion.

## Kokoro (1.5.0)
- `NATURAL.heart` / `NATURAL.michael` (`kind:'kokoro'`): one shared model `onnx/model_quantized.onnx` (q8, 92 MB; sessions are shared per model URL in `sessions`), plus `voices/af_heart.bin` / `am_michael.bin` (510×256 float32 style vectors, 0.5 MB each). `tokenizer.json`'s `model.vocab` maps IPA symbols to ids.
- Inputs: `input_ids` = `[0, ids…, 0]` (≤ 512), `style` = row `min(len−2, 509)` of the voice file, `speed` = `1/length_scale`. Output `waveform`, 24 kHz. It's deterministic, so fitting a length lands without extra randomness control.
- Sounds: Kokoro writes g as `ɡ` (U+0261). It has no ɬ or ǀ, so `KOKORO_SUB` maps them to ʃ and t. Everything else Xenoglot uses is in its vocab.
- Licence: Apache 2.0, voices included. Other good Kokoro voices: af_bella, af_nicole, bf_emma, am_fenrir, bm_george.
- Measured in headless Chromium (single-thread wasm in a worker; models served locally): Kokoro female 12 s of speech in 18 s, male 14 s in 29 s. Piper is far faster (11 s in 1.7 s). The page's longest freeze while loading or speaking is about 0.1 s. Before the worker, the page froze for several seconds per phrase.
- Faster Kokoro would need multithreaded wasm (needs cross-origin isolation, which GitHub Pages can't set without a service-worker workaround) or the WebGPU build (bigger runtime). Neither is done yet.
- The voice sample played when a voice is picked is kept short (`playSample`), because anything asked for while a slow voice works waits behind it.

## Length estimate and fit (1.4.0)
- The built-in length is exact from `wordsToSegs(...).dur` (+ reverb tail `tailOf(voice)`). The natural length = built-in length × `pace.len[engine]`, a ratio learned after every natural result. "Ready in" = spoken length × `pace.work[engine]` (seconds per pass per second of audio) × `pace.passes` when fitting a natural voice. `pace` persists in `xenoglot-v1-pace`.
- Fit to a length: `fitSpeed` finds the speed multiplier, clamped 0.5–2× (the slider range only offers lengths inside that). For the built-in voice it converges on the exact length using `wordsToSegs` (no rendering). The natural voice gets one correction pass, with `noise_w` held at 0.1 while fitting (Piper's timing is random otherwise), then is padded with silence if short. Measured: built-in 8.0/8.0 s and 20/20 s; natural 8.0/8.0 s and 16/16 s.

## Speech-to-text and audio conversion (2.0.0)
- `asr-worker.js`: 16 kHz mono in, `[{s, e, text}]` out. Log-mel as Whisper defines it (Hann 400, hop 160, 80 Slaney mel bins, plain DFT since 400 isn't a power of two), encoder, then greedy decoding on `decoder_model_merged_quantized` with cached keys/values and Whisper's timestamp rules (`pickToken`). Windows of 30 s; the next window starts at the last unfinished phrase. Silent windows are skipped so the model can't invent words.
- It has its own ort instance in its own worker (not the page's proxy worker), so tensors never cross to the page.
- `track.segs` holds the timed phrases. The transcript box is one line per phrase. `buildSlots`: if the box has as many lines as `track.segs`, each line keeps its phrase's timing (trimmed to where the energy analysis finds sound). Otherwise the words are shared out over the energy phrases by syllable count, as before. Empty box and the option off: rhythm-only invented words.
- `dubSynth` stretches the synth's segments to each slot and follows the original melody. `dubNatural` makes each phrase with the natural voice at the pace that fills its slot, with one correction pass, and squeezes by up to 1.3× if it would run into the next phrase. The natural voice won't go slower than about half speed, so slow originals leave a gap instead of dragging.
- Loading a new track clears a transcript the app wrote and the previous result.

## Speaking head (2.0.0)
- `L.head` is the head's seed (stored with the language, carried in share links; older languages get `hash(seed + '|head')`). `applyHead()` in app.js pushes it to `head.setSeed`.
- `makeDNA(seed)`: skull (crown, tall, dome, jaw, taper, depth, bulge) plus the strange-makers (lobes with optional twist, segments, waist, sweep, hammer, mushroom), eye layout (`pair cyclops odd tri row column cluster ring stalks`), nose, mouth (`wide` or `vertical`), teeth, mandibles, antennae, horns, fins, crest, tentacles, and `col` (feature, tract and wire colours; the family green/violet 15% of the time).
- `S(v, th, open)` is the skin: v 0 chin → 1 crown, th 0 front. The lower jaw swings on a hinge when `open` > 0. Features are placed with `frame(v, th)` so they sit on whatever shape the skull has.
- `lines()` builds every polyline for a frame. `draw()` rotates and projects them, buckets segments by colour and brightness, and strokes each bucket twice (wide faint glow, thin trace) with `lighter` blending over a fading background (the phosphor trail). The read-outs are drawn on the canvas so recordings carry them.
- Insides (2.1.0): `d.brain` (`coil orbs spiral crystal twin web`, each with its own idle motion and `spark` beads that get busier with speech), eye nerves to the brain, eyeballs and lids, every tooth, a tongue that reaches for where the sound is made, jawbone, vertebrae and ribs (`col.bone`), a nasal passage, `d.pipes` (1–3 windpipes of different bores), `d.sacs` air sacs that swell with `st.breath`, and `d.diaphragm` (`dome bellows cone`) that drops to breathe in and kicks up with loudness. `{haze, r}` items are soft radial light behind organs.
- Character (2.1.0): `d.temper` (sway, speed, twitch, curious, blink, every, nod), three `d.habits` from `tilt glance yawn shiver lean perk chatter roll` played every few seconds, `d.mood` shown beside the head id. Each eye blinks on its own clock. Eyes and head follow the pointer for 3.5 s after it moves. The chest stays still while the head turns, tilts and rolls on the neck (`neck` blend in `proj`).
- Line style (2.1.0): `d.ink` = `sketch` (75%) or `trace`. Sketch drops 10–30% of segments by a stable hash and jitters the ends by `d.rough` px, re-rolled 7 times a second, for a broken hand-drawn glow line. 35% of heads are one hue throughout. Bright lines get a third, wide bloom pass.
- Speed: about 35–40 ms a frame in headless Chromium's software canvas (the 2.0.0 head was 21–31). The bloom pass only runs for brightness levels 4 and up, and the faintest mesh lines skip the glow pass; both were measured, keep them.
- Look (2.4.0), chosen from mock-ups. Replaces the phosphor trail (the frame is cleared each time). `draw()` in order: body and neck skins, body bones (far side dim, near side brighter), their stars, head skin, teeth, head stars, organ haze, the skull mesh in thin cream ink, glowing features and insides (unchanged three-pass glow), then the eyes.
  - Skin: `skin(pt, NV, NT, …)` projects a grid (head 34×52, neck 8×28, body 18×40), keeps quads facing the viewer (normal from the projected corners), shades each as a dark starfield colour lit from the upper left plus the creature's `col.feat` at the edges, and fills quads batched by 5-bit colour. It returns a function that draws the stars (`H.stars`, fixed per seed, placed by bilinear interpolation inside their quad) so they land over whatever is under the skin. There is no depth sort within a skin; fine while the head is seen roughly side-on.
  - Body and neck: `makeBody(d, chestTop)` gives `H.body`: `type` (`barrel hourglass bell bulb shoulders segmented pear`), size, hunch, lobes, ribcage (`ribStyle` `hoops open claw spiral fan`, `ribN` 3–8) and `neck` (`plain thin thick taper funnel ringed bulb waist`). `B(u, th)` and `N(u, th)` are the surfaces. Only the top 55% of the body is framed (40% on phones). The old neck rings are gone; the spine (9 vertebrae) runs inside the neck into the body.
  - Bones (`col.bone`: teeth marked `head: 1`, spine, ribs) are drawn by `clay()` as shaded rolls, never as glow lines. Jaw outline and horns use `col.feat` and glow like the eyes.
  - Eyes (domed since 2.6.0): `lines()` emits `{eye, n, r, blink, ei}`; `draw()` paints a glass dome: the base is an ellipse lying in the skin (squashed along the projected normal) joined with a ball offset toward where the eye faces, so it bulges past its base as the head turns. Inside: black void, colour gathering at the edge, faint stars, one cross star that moves with `st.look`, a soft highlight from the upper left, a faint return light below and a glint. Hidden when facing away (`nz < .12`), squashed vertically to blink. `build()` shrinks or drops eyes that would overlap (`dist / 1.55`).
  - Speed: about 40–50 ms a frame in headless Chromium's software canvas (2.1.0 was 35–40).
- Scope (2.4.1): the F0/F1/F2 numbers and resonance curve at the top right are gone. In their place a spiral: the last 200 loudness samples (`hist`, 60 a second) wound over 5.5 turns, newest at the rim, rippled at the F2/F1 ratio, turning faster while it speaks.
- Lip-sync: `play()` calls `head.speak({buf, timeline, clock})`. `buf.timeline.segs` are the synth's own segments (`wordsToSegs` now tags each with its word `w` and English `en`). Neural voices give no timings, so `spreadSegs` stretches the synth's timing for the same words over each clip. The loudness envelope gates the mouth either way. `shapeOf` maps a sound to jaw, lips, rounding and where the tract narrows (vowels from their formants, consonants from `PLACE`).
- Subtitles (2.6.0): `speak()` keeps the words with their timings (`subtitles`); `draw()` breaks them into lines that fit the middle 74% of the frame (clear of the buttons social apps lay over a video) at one fixed size, up to five words, split at pauses over 0.3 s. English (15 px mono) is on top, the creature's script (27 px) under it; the spoken word is brightest. In a tall video (`fmt`, taller than 1.6:1) they sit 24% up from the bottom, above the caption area. Look: `subStyle` 2 is the default: white English, glow in the colour opposite to `col.feat`, over a soft dark patch. `head.setSub(1–4)` still offers matching glow, hard outline and a plate. The script comes from app.js through `opts.script` (`headScript`); without it the head falls back to Latin letters. Drawn on the canvas, so videos carry them.
- Video: `recordVideo` captures the canvas at 30 fps plus the audio with `MediaRecorder`, preferring H.264/AAC .mp4 and falling back to .webm. It is real-time, not frame-exact: a known departure from the family's export rule. The proper fix is WebCodecs with an mp4 muxer.
- Layout: right column above 1280 px, above the step below that, 250 px tall on phones.

## First visit, phones, sharing (2.0.0)
- No hash opens the translate step. `#intro` (inside the translate view) shows until `xenoglot-v1-seen` is set.
- The library panel shows while `#langToggle` adds `.open` to it (`setLib`). Clicking any tab, or any hash change, closes it again.
- `shareAudio` hands the .mp3 to `navigator.share` where files can be shared; the encoded file is kept so a second tap works if the first outlived the tap's permission.
- Numbers in the English are read out (`numberWords`): "42" → "forty two", each word translated.

## Gotchas (hard-won)
- **Levels are measured, not guessed.** `NOISE_TRIM` and the per-sound `ng` values put hiss 10–20 dB under the vowels (s −12, f −22, nasals −10 relative to /a/). Loudness normalises on the 98.5th percentile with tanh soft-clip. Peak normalising let clicks shrink the vowels and made speech sound like noise.
- The vowel tract is a **cascade of resonant low-pass biquads** (Q in dB = 20·log10(F/BW)) plus a fixed lip-radiation IIR. Parallel band-passes sounded hollow and buzzy.
- When measuring a sound with `__xg.run`, the first `[null,.05]` segment shifts everything by 50 ms. Measure from 0.10 s.
- `[hidden]{display:none!important}` must stay in `style.css`: `.view{display:grid}` otherwise shows every step at once.
- Phone layout: `main.console` is a flex column with `align-items:stretch`, and `.lcd.block span` must wrap. The family `.lcd span{white-space:nowrap}` once pushed the page to 834 px wide.
- Right-click reset defaults are captured after a language loads (`captureDefaults()`), not at script start, or they reset to the slider midpoint.
- Downloads use `window.claude.use('downloads')` when hosted as a claude.ai artifact, else a normal `<a download>`. The artifact allowlist has no .otf or .wav, so there the font saves as .ttf and audio records to .webm in real time. The hosted site uses .otf and .wav.
- opentype.js 1.3.4 writes only a glyph's first code point into `cmap`. Capitals need their own glyph copy, not `unicodes:[…]`.
- Threads: with cross-origin isolation, Kokoro only got about 20% faster (18 → 15 s), so no service worker is used to force isolation on GitHub Pages.
- Tests: Playwright's `route.fulfill` with a 90 MB body crashed the page, which is why models are mirrored over HTTP with `?hf=`. `page.goto` to the same URL with a different hash does not reload the page. Headless Chromium has no H.264 encoder.
- The source uses long lines: a `//` comment added mid-line swallows the rest of it. Use `/* */` inside a line. `node --check file.js` catches this.
