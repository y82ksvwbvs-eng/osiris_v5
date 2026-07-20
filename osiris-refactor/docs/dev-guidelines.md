# Development guidelines

Short list. Keep the app small, keep behavior locked, don't introduce build steps.

## The rules

1. **Preserve behavior.** If a change is user-visible, it's a feature, not a refactor. Do it in a separate PR with explicit acceptance criteria.
2. **No new dependencies without a strong reason.** Vanilla JS + Tailwind CDN is the entire stack. Anything else must justify the build-step tax.
3. **No framework.** No React, no Vue, no Svelte. The point of this codebase is that a browser + a static file server = everything you need.
4. **Preserve dependency direction.** `Config → Core → Logic → Features → UI`. Never reverse.
5. **No static import cycles.** If two modules must talk at runtime, use the late-binding pattern (`export function bindX(x) { ... }` called from `App.init()`).
6. **All persistence through `Storage`.** Never touch `localStorage` directly outside `js/core/storage/`.
7. **DOM handles via `$('id')`.** The `DOM` cache is the only lookup mechanism.
8. **Never mutate `CONFIG`, `GRADES`, `LEVEL_NAMES`, `ACHIEVEMENTS`, `TASK_SUGGESTIONS`.** They're deep-cloned nowhere — assume they're frozen.
9. **Inline `onclick=` handlers stay legal.** They're the reason `App.init()` does `Object.assign(window, {...})`. If you add a new module that gets called from HTML, add it to that block.
10. **Italian UI text is copy.** Do not translate, do not paraphrase, do not "improve".

## Adding a new module

1. Decide the layer (`core` / `logic` / `feature` / `ui`).
2. Create `js/<layer>/<name>.js`.
3. `import` only from layers to your left (see the arrow diagram in `architecture.md`).
4. If you need something from a layer to your right, add a `bindX()` setter and wire it from `App.init()`.
5. Re-export the module's public object at the bottom: `export { MyModule };`.
6. In `app.js`, add the `import`. If any HTML references `MyModule.foo()`, add `MyModule` to the `Object.assign(window, ...)` block.

## Adding a new persisted field

1. Bump `CONFIG.SCHEMA_VERSION` in `js/core/config.js`.
2. Add a defaulting branch inside `State.migrate()` for the previous version.
3. Set the new field's default on `State.data`.
4. Never remove old fields inside `migrate()` — old saves must still parse.
5. Do NOT rename `CONFIG.STORE_KEY` / `CONFIG.BACKUP_KEY`. Existing users depend on them.

## Debugging checklist

- **UI stops updating?** Look for a missing `State.save()` — it's what triggers `UI.renderAll()`.
- **Value on screen doesn't match `localStorage`?** `State.data` is the source of truth in memory; `save()` writes it out. If `save()` isn't called, memory and disk diverge.
- **"Uncaught ReferenceError: Foo is not defined" from an inline `onclick=`?** You forgot to add `Foo` to the `Object.assign(window, {...})` block in `app.js`.
- **Circular import warning at load?** Convert one side of the cycle to a `bindX()` late-binding.

## Testing

There is no test runner. The behavior contract is: **run the app, exercise the flow, compare to `osiris-V4.html`.** Keep the original monolith in the repo as your regression baseline.

Quick manual smoke check after any change:

```
1. Open in a fresh incognito window.
2. Click ACCEDI AL PROTOCOLLO → boot terminal → dashboard.
3. INJECT a task, toggle the checkbox → progress reads 100% [1/1].
4. AVVIA ESAME CONDOTTA → verdict overlay reveals.
5. SAFE-01 → export .json, then import it back.
6. Refresh → task list persists.
```

If any of those six steps behaves differently than in `osiris-V4.html`, you introduced a regression.
