# GridFail — design spec (2026-09-27)

Built for HACK47 OFFGRID (Sep 15 – Oct 15 2026). Solo build by devwez.
Built with AI assistance (coding agent) for scaffolding and component
adaptation; architecture and integration by devwez.

## What it does
Offline-first AI study kit for power-cut / low-connectivity zones. Install
once, then it works in airplane mode: snap a past-paper photo, get OCR text,
on-device explanation, flashcards + quiz. Everything persists locally.

## Why
Load-shedding in ZA and flaky hostel wifi in India kill ChatGPT-based study
flows exactly before exams. GridFail keeps working when the grid doesn't.
Takes OFFGRID literally — that is the memorable judging hook.

## MVP scope (frozen)
- PWA installable, offline app shell via service worker
- Library: max 3 subjects, 5 seeded CAPS matric papers (static JSON)
- Capture: camera/file upload → Tesseract.js OCR on-device
- Explain: on-device small model via @huggingface/transformers when cached;
  OpenAI API fallback only when online (key in .env, never committed)
- Study: flashcards + simple quiz, Dexie (IndexedDB) persistence
- Offline banner + wifi-off demo mode indicator
- Export JSON only. No auth, no cloud sync, no accounts in v1.

## Non-goals (roadmap, stated honestly in README)
Cloud sync, SMS fallback, multi-user, full CAPS corpus.

## Architecture
Vite + React + TS. No backend. All compute client-side.
- `src/lib/db.ts` — Dexie tables: papers, pages, cards, attempts
- `src/lib/ocr.ts` — Tesseract worker wrapper, lazy-loads eng model
- `src/lib/ai.ts` — transformers pipeline lazy-load, online fallback flag
- `src/lib/seed.ts` — 5 CAPS papers static data
- `src/components/` — Library, Capture, Reader, Cards, Quiz, OfflineBanner
- `vite.config.ts` — vite-plugin-pwa, precache shell + seed JSON

## Data flow
Capture image → OCR text → save page → Explain (local model or online
fallback) → generate cards → study/quiz → attempts recorded → export JSON.

## Error handling (honest, no fakes)
- OCR/model files fail offline before first cache → visible error state with
  retry, never fake text.
- Online fallback unreachable → disabled state, not mocked answer.
- Every AI answer labeled local vs cloud.

## Testing
- `npm run build` passes (tsc).
- Manual demo path: install → airplane mode → snap seed paper → cards → quiz.
- Backup: recorded clip + seeded data if venue network dies.

## Milestones
- Wk1: shell + PWA + library + capture/OCR working
- Wk2: AI explain + cards/quiz + persistence
- Wk3: polish (dark mesh) + deploy + demo video + Devpost page
