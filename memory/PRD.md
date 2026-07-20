# PRD — O.S.I.R.I.S. Production Refactor

## Original problem statement
Behavior-preserving architectural refactor of the single-file `osiris-V4.html` (2,332 lines, 158 KB) into a modular, production-ready static web app deployable to GitHub Pages. No redesign, no rewrite, no new features — only incremental structural improvements with identical observable behavior.

## Guiding contract (non-negotiable, all still enforced)
1. Preserve observable behavior (UI, UX, CSS, animations, gameplay, narrator, audio).
2. Preserve save compatibility: `osiris_db_v3`, `osiris_db_v3_backup`, `sessionStorage.osiris_booted`, schema v3 + migration untouched.
3. App stays fully functional after every phase.
4. Improve architecture, then maintainability, only where it solves a real problem.
5. If behavior changes → revert.

## Architecture (as delivered)
- **Entry point**: `App.init()` in `js/app.js`
- **Init order**: Config → Core → Storage → State → Features → UI → Events → Render
- **Dependency direction**: Config → Core → Logic → Features → UI (never reversed)
- **Cycles avoided** via late-binding pattern (`bindUI`, `bindLogic`, `bindDeps`)
- **Storage abstraction**: `StorageInterface` + `LocalStorageAdapter` (active) + `FirebaseAdapter` (stub)
- **Inline `onclick=` handlers preserved** via `Object.assign(window, {...})` inside `App.init()`

## Delivered file tree
```
/app/osiris-refactor/
├── index.html                (38 KB, markup only)
├── .nojekyll                 (0 KB, GH Pages hint)
├── README.md
├── build.py                  (extractor, kept for auditability)
├── osiris-V4.html            (original monolith kept as regression baseline)
├── assets/css/
│   ├── base.css              (12.8 KB)
│   ├── animations.css        (2.4 KB)
│   └── components.css        (5.4 KB)
├── js/
│   ├── app.js                (6.3 KB — the bootstrap)
│   ├── core/                 config, utils, dom, audio + storage/*
│   ├── logic/                state, corruption, purgatory, gamification, bossHp, logic
│   ├── features/             narrator, streak, suggestions, backup, canvasExport, shareURL, reorder, trophyUi
│   └── ui/                   ui, reveal, boot
└── docs/
    ├── architecture.md
    ├── storage.md
    ├── firebase-migration.md
    └── dev-guidelines.md
```
23 JS modules · 3 CSS files · 4 doc files.

## Phases completed (all 11)
| # | Phase | Status | Notes |
|---|---|---|---|
| 1 | CSS extraction (base / animations / components) | ✅ | Cascade order preserved: base(sections 01-04) + animations(05) + components(06-09) = original 01→09 |
| 2 | Config extraction | ✅ | `CONFIG`, `GRADES`, `LEVEL_NAMES`, `ACHIEVEMENTS`, `TASK_SUGGESTIONS` — byte-identical |
| 3 | Utils + DOM cache | ✅ | Pure functions, no behavior change |
| 4 | Storage abstraction | ✅ | `StorageInterface`, `LocalStorageAdapter` active, `FirebaseAdapter` stubbed |
| 5 | State module | ✅ | 5 direct `localStorage` calls routed through adapter; migration path untouched |
| 6 | UI + Reveal + boot | ✅ | Typewriter, count-up, staggered reveals all verified in-browser |
| 7 | Features (Narrator, Streak, Suggestions, Backup, ShareURL, CanvasExport, Reorder, TrophyUI) | ✅ | All extracted verbatim |
| 8 | Logic (Logic, Gamification, Corruption, Purgatory, BossHP) | ✅ | XP formulas, boss tiers, thresholds untouched |
| 9 | Bootstrap `App.init()` + `<script type="module">` | ✅ | Preserves original `window.onload` timing exactly |
| 10 | Cleanup | ✅ | Only proven junk removed (Cloudflare tracking iframe injected by hosting). All defensive code retained. |
| 11 | Documentation | ✅ | README, architecture.md, storage.md, firebase-migration.md, dev-guidelines.md |

## Validation results (browser-verified end-to-end)
- ✅ Boot terminal typewriter sequence (5 kernel log lines) plays correctly
- ✅ Clock/date populate immediately at boot (no `--.--.----` flash)
- ✅ Task INJECT → task list re-renders → progress bar animates → suggestions rotate
- ✅ Task toggle → progress % updates → strike-through animation
- ✅ AVVIA ESAME CONDOTTA → processing overlay 2.5s → verdict reveal → count-up → typewriter narrator → stat cards populate → achievement toasts fire ("PRIMO SANGUE" unlock verified)
- ✅ STATS, TROFEI, REGISTRO, SAFE-01, PURGA modals all open/close
- ✅ Boss HP bar renders with real DMG/HEAL accounting
- ✅ Calendar populates 33 cells (7 weekday header + day cells for July 2026)
- ✅ LocalStorage keys byte-identical: `osiris_db_v3`, `osiris_db_v3_backup`
- ✅ Schema version = 3 after write
- ✅ `sessionStorage.osiris_booted = 'true'` after intro dismissed
- ✅ ShareURL.buildURL() produces `#osiris=<base64>` string
- ✅ Refresh persists task list and completion state
- ✅ Zero console errors (only expected Tailwind CDN warning)
- ✅ Runs from `python3 -m http.server` — GitHub-Pages-ready

## Preview server
Local static server was started on `http://127.0.0.1:8765/` for validation:
```bash
cd /app/osiris-refactor && python3 -m http.server 8765
```

## What's NOT been done (per spec — explicitly out of scope)
- No framework migration (React/Vue/etc). Spec requires pure vanilla JS.
- No Tailwind vendoring. Runtime JIT config cannot be reproduced pixel-identically without a build step.
- No Google Fonts vendoring. Kept on CDN for identical rendering.
- No new features, no UI changes, no gameplay changes.
- `FirebaseAdapter` is a stub only — not wired in.

## Backlog / potential next steps (optional, all P2)
- P2 — Vendor Google Fonts with `unicode-range` subsetting *if* the user is willing to accept sub-pixel rendering differences on some platforms.
- P2 — Add a Tailwind build step (PostCSS) and vendor the compiled CSS *if* the user is willing to accept the added tooling.
- P2 — Wire `FirebaseAdapter` following `docs/firebase-migration.md` for multi-device sync.
- P2 — Add a `<meta name="theme-color">` for mobile PWA installs.

## Delivery method
User will push to `https://github.com/y82ksvwbvs-eng/test-cin-emergent` via the platform's **Save to GitHub** feature (as confirmed in ask_human).
