# AI Evolution Museum — delivery report

Build verification completed on 2026-10-04:

- `npm run build` — passed (TypeScript + Vite production bundle)
- `npm test` — passed (6 files, 44 tests)
- Registry — 30 unique executable experiments
- Runtime — fixed timestep, seeded reset/replay, visibility throttling, DPR-aware Canvas 2D, adaptive quality, display-only draw budgets and cleanup
- UI — local demo login/create-account affordance, searchable Experiment Library, autoplay modes, era-anchor timeline scrubber, pause/step/reset, live parameters, debug panel, presentation mode, PNG capture, reduced motion/high contrast and responsive layout
- Visual systems — deterministic TransitionEngine with ten transition languages, year-aware theme variables, and an optional low-volume Web Audio soundscape (off by default)
- Documentation — runtime preview image, bilingual product naming, MIT license, historical scope and third-party notices

The archive intentionally excludes `node_modules`; run `npm install` after extracting. The production `dist/` directory is included as an offline preview artifact.
