# BUILDLOG — how GridFail got built (awesome-list style)

## The bug that became the product
My school network blocks Hugging Face's model CDN. The offline-AI study app
I wanted to build couldn't download its own brain on the network where I'd
actually use it. So the architecture flipped: instant answers by default,
AI as a background upgrade. The constraint designed the product.

## Day 1 — skeleton that survives judges
Scaffolded Vite + React + TS, set up the remote in the first 10 minutes
(`github.com/devwez/gridfail`), and wrote the 90-second demo script BEFORE
the feature rush. Rule from every winner repo I studied: the demo is the
product. One end-to-end path (library → explain → quiz) working ugly beat
five polished half-features.

## Day 1, hour 2 — speed complaint, fixed right
First Explain took forever: a 230MB summarizer downloading on first tap.
Killed it. Replaced with a two-tier flow: extractive breakdown renders in
milliseconds, LaMini-Flan-T5-77M (~80MB) upgrades in the background and
relabels the answer. Nobody stares at a spinner again.

## Design language
Stole the tokens from my own qura-app (OKLCH green-tinted dark, Comfortaa +
Inter + JetBrains Mono, sidebar + bottom tabs, staggered entrances,
skeleton shimmer). Then stripped the mesh gradients when they started
looking AI-generated. Flat and quiet won.

## The cascade bug
Desktop showed the sidebar AND the mobile tab bar at once. Cause: the base
`nav.tabs` rule sat after the media query in the stylesheet and won the
cascade. Fix: media queries last, always. Verified with computed-style
probes, not eyeballs.

## Offline proof, honestly earned
The OFFLINE pill first lied (navigator.onLine in headless). Fixed with a
same-origin fetch probe every 3 seconds. The green pill in screenshots is
live state. The airplane-mode screenshot in this repo was taken with the
network actually cut.

## Video pipeline
Remotion composition + headless-Chrome screenshot script. Chrome wouldn't
launch did), the headless shell did. Blocked Google Fonts
aborted at the request layer. 90 seconds, captioned for muted judges,
re-renderable with one command. Voiceover slot reserved.

## Numbers
- 9 commits, day 1. Every working checkpoint pushed.
- 0 backends. 0 mocked integrations. 0 hardcoded demo values.
- 80MB optional model. Core works at 0MB downloaded.
- 18 days total runway; demo script written at hour zero.

## What I'd do with more time
Full CAPS corpus seed, spaced repetition schedule, sub-50kb SMS fallback
mode for phones that can't run the model at all.
