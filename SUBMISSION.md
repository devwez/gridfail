# GridFail — OFFGRID submission draft (Devpost fields)

## Project Name
GridFail — study when the grid fails

## Short Description
Offline-first AI study kit: snap a past paper, get explanations, flashcards
and quizzes with the wifi off. Built for load-shedding season.

## Problem
In South Africa, load-shedding kills connectivity exactly when matric
learners need to study. In hostels across India, shared wifi collapses every
evening. Every AI study tool assumes permanent internet — when the grid
fails, studying stops. The learners hit hardest are the ones who can least
afford it.

## Solution
GridFail is a PWA with zero backend. Install once over any connection, then
everything runs on-device: Tesseract.js reads photographed past papers, a
small local model (LaMini-Flan-T5, cached by the service worker) explains
answers, and flashcards plus multiple-choice quizzes persist in IndexedDB.
Answers appear instantly with an honest extractive breakdown, then upgrade
quietly to AI explanations labeled on-device vs cloud. A green OFFLINE pill
proves the app never phones home.

## Demo Link
https://gridfail.vercel.app

## Source Code
https://github.com/devwez/gridfail

## Demo Video
TODO: 90-second cut per DEMO.md, YouTube unlisted, captions on.

## Tech Stack
Vite + React + TS · vite-plugin-pwa (service worker, precache) · Dexie
(IndexedDB) · Tesseract.js (on-device OCR) · @huggingface/transformers
(LaMini-Flan-T5-77M, on-device) · Framer Motion · OpenAI API (optional
online fallback only, key never committed)

## Build Process
Built solo during OFFGRID over 18 days. Wk1: offline shell + library +
capture/OCR. Wk2: two-tier instant explain, MCQ quiz with worst-first
ordering, offline-AI download panel. Wk3: polish, deploy, demo video.
Hardest part: making on-device AI feel fast — solved with instant
extractive answers first, model upgrade in background.
Next: full CAPS corpus seed, spaced repetition, sub-50kb SMS fallback mode.

## Disclosure
Built with AI assistance for scaffolding and component adaptation;
architecture and integration by devwez (@devwez).
Seed practice prompts written for this app. No scraped exam content.
