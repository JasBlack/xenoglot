# Xenoglot

Build a new spoken language on top of English grammar, entirely in your browser.

**Live:** https://xenoglot.jas.black

![Xenoglot](og.jpg)

1. **Sounds**: choose your language's sounds from 37 (vowels, stops, hisses, clicks, rolled r…) and give them a voice. Ten presets go from a natural voice to a giant, a whispering spirit or a hive choir. You can replace any sound with your own voice.
2. **Words**: every English word gets a permanent new word built from your sounds. Grammar stays English: same word order, and plural, past tense, *-ing*, possessive, *n't* and *-ly* become fixed endings. Edit any word in the dictionary.
3. **Translate**: type English and get the new language written in Latin letters, in its own script and as pronunciation (IPA). Hear it and save the audio as a .wav file.
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

## Privacy

Everything runs in the browser: synthesis (Web Audio API), word generation, audio analysis and font building (opentype.js). No uploads, no accounts, no tracking. The microphone is used only while you record, and only after you allow it.

## Credits

- [opentype.js](https://github.com/opentypejs/opentype.js) (MIT), vendored in `vendor/`
- Fonts: IBM Plex Mono, Archivo and Charis SIL (SIL Open Font License), loaded from Google Fonts

## Licence

MIT © Jas Black
