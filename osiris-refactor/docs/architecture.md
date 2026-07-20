# Architecture

## Guiding principle

> **Preserve observable behavior first. Improve architecture second. Improve maintainability third.**

Every phase of this refactor left the app fully functional. If a change altered visible behavior, animation timing, save format, or gameplay, it was reverted.

## Module map

```
Config ──► Core ──► Logic ──► Features ──► UI
             ▲                                │
             └────────── window (inline handlers) ────────────┐
                                                              │
                                                        HTML markup
```

Arrows show allowed `import` direction. **No arrow ever points backwards.** UI never imports Logic modules at load time — instead the App entry point uses **late binding** (`bindDeps({ Logic, Reveal, Reorder, TrophyUI })`) so runtime cycles are resolvable without static cycles.

| Layer     | Path              | Depends on                                | May be imported by |
|-----------|-------------------|-------------------------------------------|--------------------|
| Config    | `js/core/config.js` | *(nothing)*                             | anyone             |
| Core      | `js/core/*`         | Config                                  | Logic, Features, UI, App |
| Storage   | `js/core/storage/*` | *(nothing)*                             | Logic (via adapter singleton) |
| Logic     | `js/logic/*`        | Config, Core                            | Features, UI, App |
| Features  | `js/features/*`     | Config, Core, Logic                     | UI, App           |
| UI        | `js/ui/*`           | Config, Core, Logic, Features           | App               |
| App       | `js/app.js`         | *everything*                            | *(entry point)*   |

## Initialization order

`App.init()` performs the following steps in exactly this order:

1. **Config** is already resolved (static import).
2. **Core**: `DOM`, `Utils`, `AudioEngine` are stateless singletons — nothing to initialize.
3. **Storage**: `setStorage(new LocalStorageAdapter())`. All subsequent `State.load()` / `State.save()` calls resolve to this adapter.
4. **Late bindings**: wire the runtime graph via `bindUI(...)` / `bindLogic(...)` / `bindDeps(...)` setters. This step exists purely to sidestep static import cycles (see below).
5. **Window exposure**: every symbol referenced by inline `onclick="..."` handlers in `index.html` is copied onto `window`. This preserves 1:1 the original single-file build's global scope.
6. **Boot**: the exact contents of the original `window.onload` — clock sync, form listener, day-change interval, visibility handler, `ShareURL.checkOnBoot()`, intro overlay logic — are executed unchanged.

## Late binding — why?

Some modules genuinely reference each other at runtime:

- `UI` calls into `Logic` (e.g. `Logic.triggerJudgment()` from a rendered button)
- `Logic` calls into `Reveal` (e.g. `Reveal.runVerdict()` at end of judgment)
- `Reveal` calls into `UI` (e.g. `UI.closeVerdict()`)
- `Reorder`, `TrophyUI`, `Backup`, `CanvasExport`, `ShareURL` all call `UI.popToast`, `UI.fadeInModal`, etc.

If every one of those were expressed as a static `import`, we would have an unresolvable web of circular imports. Instead each module exports a `bindX()` setter that stashes the peer in a module-scoped `let` variable, and `App.init()` calls all the setters after every module has finished loading.

At runtime the graph is fully connected. At *load* time the dependency direction is strictly one-way. **`Config → Core → Logic → Features → UI` is preserved.**

## Storage abstraction

Business logic never touches `localStorage` directly. Everything routes through a `StorageInterface`:

```js
interface StorageInterface {
    get(key): string | null
    set(key, value): void
    remove(key): void
    backup(srcKey, backupKey): void
    restore(backupKey, dstKey): string | null
}
```

The default binding is `LocalStorageAdapter`. A `FirebaseAdapter` stub is present but not wired. See [`storage.md`](storage.md) and [`firebase-migration.md`](firebase-migration.md).

## Behavior-preservation checklist

Verified after the refactor:

- ✅ Imports/exports all resolve; no `Uncaught` errors in browser console
- ✅ Initialization order matches the original (clock/date sync **before** state load)
- ✅ All inline `onclick=` handlers wired (STATS, TROFEI, REGISTRO, SAFE-01, PURGA, INJECT, share/backup, verdict, boss…)
- ✅ Dependency direction preserved; no static import cycles
- ✅ LocalStorage keys byte-identical (`osiris_db_v3`, `osiris_db_v3_backup`)
- ✅ Migration logic (`State.migrate()`) untouched
- ✅ `sessionStorage.osiris_booted` untouched
- ✅ Narrator (three level-tiered phrase pools) untouched
- ✅ AudioEngine synth patches untouched
- ✅ Calendar / statistics / achievements / streaks all render
- ✅ Backup + import + export + share URL all functional
- ✅ Corruption / purgatory triggers untouched
- ✅ Boss HP + weekly reset untouched
- ✅ Runs from any static server; runs from GitHub Pages (with `.nojekyll`)
- ✅ Existing save data (any v1/v2/v3 payload) migrates as before

## File count

|              | Before | After |
|--------------|-------:|------:|
| HTML         |      1 |     1 |
| CSS files    |      0 |     3 |
| JS modules   |      0 |    23 |
| Doc files    |      0 |     4 |
