# Contributing to GridFail

Thanks for wanting to help. GridFail is a solo hackathon build opening up to
contributors — small, focused PRs beat big rewrites.

## Ground rules

1. **Offline-first is the law.** Every feature must work with the wifi off.
   Anything needing a network is opt-in, labeled, and never blocks core flows.
2. **No mocked integrations.** If it isn't wired up, ship it disabled with an
   honest label — never fake it.
3. **No placeholder content.** Real copy or nothing.
4. **Keep it light.** This app runs on low-end phones during load-shedding.
   Watch bundle size; lazy-load heavy deps (Tesseract, transformers).

## Setup

```bash
npm install
npm run dev
```

Needs Node 20+. First run downloads OCR + model assets on demand; use good
wifi once, then test everything in airplane mode.

## Workflow

1. Fork, branch off `main` (`feat/quiz-timer`, `fix/ocr-crop`).
2. Keep changes tight — one concern per PR.
3. Run checks before pushing:
   ```bash
   npm run lint
   npm run test
   npm run build
   ```
4. Open a PR with the template filled in: what, why, how you tested
   (including an offline pass if you touched runtime code).

## What gets merged

- Bug fixes with repro steps
- Offline-safe features with tests
- Docs that match the code (update both or neither)
- Accessibility and low-end-device performance wins

## What gets closed

- Cloud-dependent features with no offline path
- Dependency adds without a size justification
- AI-generated bulk PRs with no human testing notes

## Questions

Open a discussion or an issue — include what you tried and what device or
browser you tested on.
