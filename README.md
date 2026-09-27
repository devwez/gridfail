# GridFail

Offline-first AI study kit for power-cut zones. Install once, study in
airplane mode: snap a past-paper photo, get text, explanations, flashcards
and quizzes — all on-device.

Built for [HACK47 OFFGRID](https://hack47-offgrid.devpost.com) (Sep 15 – Oct
15 2026) by [@devwez](https://github.com/devwez). Built with AI assistance
for scaffolding and component adaptation; architecture and integration by
devwez.

## The demo (60 seconds)
1. Open the installed app, flip on airplane mode.
2. Snap a matric past-paper photo.
3. Read the extracted text, tap Explain (runs on-device).
4. Drill the auto-made flashcards, run the quiz.
5. Banner stays green: OFFLINE — everything still works.

## Stack
Vite + React + TS, vite-plugin-pwa, Dexie (IndexedDB), Tesseract.js (OCR),
@huggingface/transformers (on-device AI), Framer Motion. No backend.
Optional online fallback via OpenAI API (key in `.env`, never committed).
Every answer is labeled local vs cloud.

## Run it
```bash
npm install
npm run dev
```

## Status
Wk1 in progress: PWA shell + library + capture/OCR. See
`docs/superpowers/specs/2026-09-27-gridfail-design.md` for scope and
roadmap. Shortcuts are tracked in TODO.md, nothing is faked — unfinished
work shows as disabled, not mocked.
