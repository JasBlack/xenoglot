# Xenoglot

Build a new spoken language on top of English grammar, entirely in your browser.

**Live:** https://xenoglot.jas.black

![Xenoglot](og.jpg)

1. **Sounds**: choose your language's sounds from 37 (vowels, stops, hisses, clicks, rolled r…) and give them a voice. Pick the **built-in** synthesizer or a **natural** neural voice (female or male), then a character: ten presets go from a plain voice to a giant, a whispering spirit or a hive choir. You can replace any sound with your own voice, and each sound tells you how to record it.
2. **Words**: every English word gets a permanent new word built from your sounds. Grammar stays English: same word order, and plural, past tense, *-ing*, possessive, *n't* and *-ly* become fixed endings. Edit any word in the dictionary.
3. **Translate**: type English and get the new language written in Latin letters, in its own script and as pronunciation (IPA). As you type it shows how long the speech will be and how long it takes to make. Turn on **fit to a length** to pick an exact length: the voice speeds up or slows down to match, within half to double speed. Hear it and save the audio as an **.mp3 for sharing** (small, plays in WhatsApp, messages and on any phone) or a full-quality **.wav** for editing.
4. **Audio**: drop in a recording of English speech. Xenoglot reads its phrases, rhythm and melody and re-voices it in your language with the same timing. Paste the words spoken for a true translation.
5. **Script**: generate an alphabet (14 styles, 4 pens, weirdness and slant), redraw any letter by hand, and download it as an installable font (.otf, with capitals and basic punctuation) or an alphabet chart (.svg).

### How many sounds does a language need?

English uses about 44 distinct sounds (phonemes). The smallest known set is about 11 (Rotokas), the largest well over 100 (Taa), and most languages use 20 to 40. Fewer sounds just means longer words. The app shows how many words your sounds can make.

## Saving and sharing

- Languages save automatically in your browser. **My languages** keeps them all; switch, duplicate or delete.
- **Share link** copies a link that holds the whole language (sounds, voice, words, alphabet). Anyone who opens it gets a copy. Nothing goes to a server. Recorded voices aren't included, because they're too big for a link.
- **Save ↓** downloads a `.json` file with everything, including your recordings. **Open**, or drop the file anywhere on the page, to load it.
- **Examples** load ready-made languages from `examples/`.

## Run it locally

No build step. Serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` straight from disk also works, except that the example languages need a server.

## Test

```bash
npm install
npx playwright install chromium
npm test
```

## The natural voice

There are two kinds of neural voice, both running in the browser with [onnxruntime-web](https://onnxruntime.ai), in a background worker so the page stays responsive:

- **natural** (female, male): [Piper](https://github.com/rhasspy/piper) voices `en_US-kristin` and `en_US-norman`, trained on public-domain recordings. About 63 MB each. Fast: a few seconds of work for a paragraph.
- **natural+** (female, male): [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache 2.0) with the `af_heart` and `am_michael` voices. More lifelike. One 92 MB model shared by both voices, and slower: roughly 1.5–2× the length of the speech to make it, depending on your computer.

They read your language's sounds directly, so they pronounce invented words as written, with a light English accent. Each downloads once from Hugging Face when you pick it, and then works offline from the browser cache. Pitch, speed, roughness, warble, many voices, metallic and space apply to it. Growl, breathiness, your recordings and audio-track conversion use the built-in voice.

## Privacy

Everything runs in the browser: synthesis (Web Audio API and onnxruntime-web), word generation, audio analysis and font building (opentype.js). No uploads, no accounts, no tracking. The only outside request is the natural voice download from Hugging Face, and only if you choose that voice. The microphone is used only while you record, and only after you allow it.

## Credits

- [opentype.js](https://github.com/opentypejs/opentype.js) (MIT), vendored in `vendor/`
- [onnxruntime-web](https://github.com/microsoft/onnxruntime) 1.20.1 (MIT), vendored in `vendor/ort/`
- [lamejs](https://github.com/zhuker/lamejs) 1.2.1 (LGPL-3.0), the .mp3 encoder, vendored unmodified as a separate file in `vendor/lame/` and loaded only when saving an .mp3
- [Piper](https://github.com/rhasspy/piper) voices from [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices): kristin and norman, trained on public-domain LibriVox recordings
- [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache 2.0), via [onnx-community/Kokoro-82M-v1.0-ONNX](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX): voices af_heart and am_michael
- Fonts: IBM Plex Mono, Archivo and Charis SIL (SIL Open Font License), loaded from Google Fonts

## Licence

MIT © Jas Black
