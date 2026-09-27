# TODO — honest shortcuts, nothing faked

- [ ] First-load model cache needs one online visit before airplane mode.
  UI shows extractive fallback honestly until then. (by design, keep label)
- [ ] Quiz distractors are other cards' answers, not model-generated. Fine
  for v1, upgrade to model-generated in wk3 if time.
- [ ] Photo scans store dataURL in IndexedDB — large albums will bloat.
  Cap: downscale images >1600px before save (wk2).
- [ ] No cloud sync. Export JSON only. Stated in README + Devpost.
- [ ] Cover image is SVG placeholder. Swap for real screenshot before submit.
