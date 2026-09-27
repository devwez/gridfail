# GridFail — 90-second demo script (write first, demo always)

One-sentence identity (judge repeats this): **study when the grid fails.**

## 0–10s — anchor first, story second
"GridFail is an offline-first study kit. Snap a past paper, get explanations,
flashcards and quizzes — with the wifi off. I built it for load-shedding
season, when ChatGPT dies right before exams."

## 10–20s — what it does
"PWA, zero backend. OCR, a small on-device model, and all storage run on the
phone. Cloud is an optional fallback, and every answer is labeled."

## 20–55s — live path (THE magic moment)
1. Show ONLINE pill, then flip on airplane mode. Pill goes green: OFFLINE.
2. Snap / upload past-paper photo → Read text (Tesseract, local).
3. Save → Open in library → Explain + make cards (on-device).
4. Study tab: answer 2 quiz questions, show score.

## 55–70s — technical proof
"Dexie IndexedDB for papers, pages, cards, attempts. Transformers.js
summarizer cached by the service worker after first load. Tesseract worker
lazy-loads. Export JSON any time — your data never leaves the device."

## 70–85s — impact
"Target user: matric learners in SA townships + hostel students with flaky
wifi. After OFFGRID: full CAPS corpus seed, spaced repetition, SMS fallback
for sub-50kb phones."

## 85–90s — close
"GridFail — study when the grid fails. Repo + live link on the Devpost page."

## Backup
Pre-record this exact path once (screen capture, airplane mode on). If venue
wifi or model cache flakes, play the clip — never fake a live answer.
