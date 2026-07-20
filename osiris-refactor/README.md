# O.S.I.R.I.S. — Refactored static build

> Modular, framework-free port of the single-file `osiris-V4.html`.
> **Behavior preserved. No redesign, no rewrite, no new features.**

## Quick start

```bash
# Any static server works. Zero build step.
python3 -m http.server 8000
# open http://127.0.0.1:8000/
```

Deploy anywhere that serves static files — GitHub Pages, Netlify, Cloudflare Pages, S3, etc. A `.nojekyll` file is included so GitHub Pages serves the `js/` folder without processing.

## Layout

```
/
├── index.html                markup only (loads ES-module entry)
├── .nojekyll                 tells GitHub Pages: don't touch these folders
├── assets/
│   └── css/
│       ├── base.css          design tokens · CRT · panels · buttons · tasks · tints
│       ├── animations.css    keyframes · corruption FX · glitch band
│       └── components.css    verdict UI · purgatory & boss · modals · streak evolution
├── js/
│   ├── app.js                App.init() — the single bootstrap entry point
│   ├── core/                 config, utils, dom cache, audio, storage
│   │   └── storage/          StorageInterface + LocalStorageAdapter + FirebaseAdapter (stub)
│   ├── logic/                state, gamification, corruption, purgatory, boss, orchestrator
│   ├── features/             narrator, streak, suggestions, backup, share-url, canvas-export, reorder, trophies
│   └── ui/                   rendering, reveal, boot terminal
├── docs/                     architecture, storage, firebase migration, dev guidelines
├── osiris-V4.html            the original monolith (kept as reference — do not edit)
└── build.py                  the extractor used to produce this tree (kept for auditability)
```

## Guarantees

The refactor was carried out under a strict behavior-preservation contract. See [`docs/architecture.md`](docs/architecture.md) for the full checklist. In short:

- ✅ Same `LocalStorage` keys (`osiris_db_v3`, `osiris_db_v3_backup`) and `sessionStorage` key (`osiris_booted`)
- ✅ Same schema version + same migration path
- ✅ Same CSS cascade order (concatenating base → animations → components reproduces the original single stylesheet)
- ✅ Same XP curve, grade tiers, boss HP mechanics
- ✅ Same narrator phrase pool (three tiers, level-aware whiplash)
- ✅ Same corruption/purgatory triggers, same weekly boss window
- ✅ Same inline `onclick="…"` handlers work — every module referenced from HTML is re-attached to `window` in `App.init()`

## Working with the code

- **Adding a new module?** Read [`docs/dev-guidelines.md`](docs/dev-guidelines.md) first: it explains the dependency direction (`Config → Core → Logic → Features → UI`) and how the late-binding pattern breaks import cycles.
- **Swapping storage?** [`docs/storage.md`](docs/storage.md) documents the interface. [`docs/firebase-migration.md`](docs/firebase-migration.md) walks through swapping `LocalStorageAdapter` for the `FirebaseAdapter` stub.
- **Debugging?** Every state mutation goes through `State.save()` which writes to `Storage.set(...)`. Put a breakpoint there to trace persistence.

## Third-party dependencies

Two CDN loads remain in `index.html`:

1. **Tailwind CSS** — kept on CDN because the runtime JIT config (custom `monolith` palette, `Syncopate` / `JetBrains Mono` families) cannot be vendored pixel-identically without introducing a build step. The console warning `cdn.tailwindcss.com should not be used in production` is expected and harmless for this app.
2. **Google Fonts** — `Syncopate` + `JetBrains Mono`. Kept on CDN for identical rendering fidelity across browsers.

Neither is required to be self-hosted for correctness; both were considered for vendoring during Phase 1 and rejected because they would alter observable rendering.
