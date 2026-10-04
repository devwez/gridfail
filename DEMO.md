# GridFail — 58-second demo script (matches remotion/Demo.tsx + voiceover.mp3)

One-sentence identity (judge repeats this): **study when the grid fails.**

Live link (end card): **https://gridfail.vercel.app** · repo: github.com/devwez/gridfail

Voice: Piper `en_US-lessac-medium` (60MB on-device TTS), 49.7s narration padded to 58s.

| Time | Scene (frames @30fps) | VO / caption text |
|------|----------------------|-------------------|
| 0–4s | Title card (0–120): HACK47 OFFGRID | "GridFail is an offline-first study kit. Snap a past paper, get explanations, flashcards and quizzes — with the wifi off." |
| 4–13s | Library (120–390): shots/01-library.png | Cap: "Install once. Your library lives on the device." / Sub: "Seeded practice sets, ready with zero signal." |
| 13–22s | Explain (390–660): shots/02-open.png | Cap: "Snap a past paper. Tap Explain." / Sub: "Instant breakdown in milliseconds, AI upgrades in background." |
| 22–31s | Study (660–930): shots/03-study.png | Cap: "Flashcards + quiz, weakest-first." / Sub: "Cards you miss float to the top. Scores persist offline." |
| 31–40s | Offline proof (930–1200): shots/04-offline.png | Cap: "Airplane mode. Still works." / Sub: "The green OFFLINE pill is live state, not a mock." |
| 40–48s | Tech (1200–1440): UNDER THE HOOD card | Cap: "Zero backend. OCR, AI, storage — all on-device." / Sub: "Dexie IndexedDB · Transformers.js · Tesseract, all cached offline." |
| 48–58s | End card (1440–1740) | "GRIDFAIL — TRY IT LIVE · gridfail.vercel.app · Study when the grid fails." |

Render: `npm run render:demo` → out/gridfail-demo.mp4 (58s, 1920×1080).

## Backup
Pre-record this exact path once (screen capture, airplane mode on). If venue
wifi or model cache flakes, play the clip — never fake a live answer.
