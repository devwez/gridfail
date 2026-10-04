# Changelog

All notable changes to GridFail. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows SemVer once 1.0 ships.

## [0.1.0] — 2026-10-04

First public release — HACK47 OFFGRID submission.

### Added

- Offline-first study kit: scan past papers (Tesseract.js OCR), two-tier
  explanations (instant extractive + background LaMini-Flan-T5 upgrade),
  flashcards, weakest-first MCQ quizzes — all in IndexedDB, zero backend.
- Installable PWA with service-worker precache and honest offline pill
  (same-origin probe, not `navigator.onLine`).
- Optional bring-your-own-key OpenAI fallback for online sessions.
- 90-second captioned demo video (`out/gridfail-demo.mp4`, Remotion pipeline).
- Headless screenshot pipeline (`shots.cjs`) with network actually cut.
- Unit tests for the explain/card pipeline (`vitest`, 5 tests).
- Repo hygiene: MIT license, contributing guide, security policy, code of
  conduct, issue/PR templates, CI (lint + test + build).
- Docs: README, SUBMISSION, DEMO script, BUILDLOG, TODO, frozen MVP spec.

### Known limitations

- First-load model cache needs one online visit before airplane mode.
- Quiz distractors reuse other cards' answers (model-generated cards next).
- Large photo scans stored as dataURLs — downscale cap planned.
- No cloud sync; JSON export only.
