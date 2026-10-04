# GridFail perf report

Measured 2026-10-04. Toolchain: `npx lighthouse` 13.5.0, headless Chrome
(installed at `C:\Program Files\Google\Chrome`), served via `npm run preview`
(port 4173, production `dist/`). Mobile = default Moto-G-class emulation,
desktop = `--preset=desktop`.

## Scores

| Suite    | Perf | A11y | Best practices | SEO |
|----------|------|------|----------------|-----|
| Mobile   | 95   | 100  | 100            | 100 |
| Desktop  | 99   | 100  | 100            | 100 |

Bar (90+ all four, both suites): **pass**.

Mid-point run (after lazy-OCR + meta/aria, before font/contrast/robots
fixes) scored mobile 83/95/100/92 and desktop 96/95/100/92. The original
all-static-import bundle was never Lighthouse-scored — the tesseract
change landed before the first run, so no number is claimed for it.

Final field metrics (mobile): FCP 1.9s, LCP 2.5s, TBT 100ms, CLS 0.001,
Speed Index 1.9s. Desktop: FCP 0.4s, LCP 0.9s, TBT 0ms, CLS 0, SI 0.4s.

## Bundle (`npm run build`, `vite v8.3.1`)

| Asset | Before (raw / gzip) | After (raw / gzip) |
|-------|---------------------|--------------------|
| `assets/index-*.js` (app + react + framer-motion + dexie) | 478.93 kB / 154.37 kB | **462.21 kB / 147.73 kB** |
| `assets/src-*.js` (tesseract.js, lazy) | bundled above | **17.23 kB / 7.30 kB** (0 bytes on first paint) |
| `assets/transformers.web-*.js` (already lazy via `import()`) | 538.15 kB / 155.17 kB | 538.15 kB / 155.17 kB (unchanged, on-demand only) |
| `assets/index-*.css` | 8.32 kB / 2.47 kB | 8.32 kB / 2.47 kB |
| `index.html` | 1.42 kB | 1.89 kB (more meta, async fonts) |
| `ort-*.wasm` (26.8 MB, transformers runtime) | on-demand, never initial | unchanged, still on-demand |

Initial JS on first paint: **462 kB raw / 148 kB gzip**. PWA precache:
26 entries, ~1.9 MB (wasm and mp3 excluded by `globPatterns`).

## What changed (perf-safe only, no runtime behavior)

1. `src/lib/ocr.ts` — `tesseract.js` static import became a dynamic
   `import()` inside `getWorker()` (type-only `import type` keeps types).
   OCR code now loads only when Capture runs. Main chunk −16.7 kB.
2. `index.html` — Google Fonts stylesheet made non-render-blocking
   (`media="print"` + `onload` swap, `preload as="style"`, `noscript`
   fallback). Render-blocking estimate: 1870ms → 300ms. Added
   `og:type`, `twitter:*` cards, `apple-touch-icon`.
3. `src/index.css` — `--faint` raised `oklch(0.45…)` → `oklch(0.62…)`
   so 11–12px secondary text passes 4.5:1 contrast (was the only a11y fail).
4. `src/App.tsx` — `width`/`height` on both `mark.png` imgs (61×46 sidebar,
   72×54 header, matching 4:3 intrinsic), `aria-label` on both navs,
   `aria-pressed` on tab buttons, labels on file input + textarea,
   `role="status"` on net pill, `role="progressbar"` with values on both
   progress bars.
5. `public/robots.txt` — new, `Allow: /`. Preview SPA fallback served HTML
   for `/robots.txt`, which Lighthouse counted as 40 errors (only SEO fail).

`@huggingface/transformers` verified lazy already (`await import()` in
`src/lib/ai.ts`). `remotion` + `puppeteer-core` are in dependencies but never
imported under `src/` — not in the web bundle (used by `remotion/` CLI only).

## JS bundle budget

- Initial JS: **≤ 500 kB raw / ≤ 160 kB gzip** (now 462 / 148).
- Lazy chunks (`transformers.web`, `src-*` OCR): uncapped but must stay
  behind user intent (model download button, Capture tab).
- `ort-*.wasm` (26.8 MB): must never enter precache or initial load —
  enforced by Workbox `globPatterns` excluding `wasm`. Re-check after any
  `@huggingface/transformers` upgrade.
- Images: page-served images ≤ 150 kB each; `og.png` 73 kB ok.

## Deliberately left unfixed

- ~77 kB "unused JavaScript" in main chunk (framer-motion + react-dom paths
  not hit on load). Splitting framer-motion would delay first tab transition;
  runtime risk, kept.
- `public/voiceover.mp3` (1.47 MB) ships to `dist/` but only `remotion/`
  references it. Moving it breaks the demo-video build; excluded from
  precache so web users never fetch it.
- `public/devpost-*.png` + `public/shots/` (~780 kB in `dist/`, unreferenced
  by the app) are Devpost/README submission assets; moving them breaks README
  links. Not precached (pngs are, actually — `globPatterns` includes png;
  accepted, they double as offline submission copies).
- `mark.png` served at 400×300 intrinsic for ≤72px display (~15 kB
  image-delivery saving available). Resizing breaks the PWA manifest size
  declaration (`400x300`); kept.
- `llms-txt` / `ard-schema` audits fail (agentic-browsing category, not in
  the 90+ bar); ignored.
- Google Fonts still external (school Wi-Fi can block it); page renders in
  system fallbacks either way thanks to the async pattern. Self-hosting into
  `public/fonts/` (currently empty) is the follow-up.

Build stays green (`tsc -b && vite build`), `npm test` 5/5 pass.
