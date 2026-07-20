# Storage architecture

## The interface

`js/core/storage/StorageInterface.js`:

```js
export class StorageInterface {
    get(key)                  // -> string | null   (synchronous)
    set(key, value)           // -> void            (synchronous)
    remove(key)               // -> void
    backup(srcKey, backupKey) // -> void  (copies srcKey → backupKey)
    restore(backupKey, dstKey)// -> string | null   (copies backupKey → dstKey)
}
```

**Synchronous by design.** The original inline code used `localStorage.setItem` synchronously inside `State.save()` and `State.load()`. Preserving that call shape means any consumer keeps behaving identically. Any future adapter (Firebase, IndexedDB) must either stay synchronous — e.g. by caching in memory and writing back asynchronously — or the consumers must be converted to async, which is a breaking change we deferred.

## Adapters

| File                                 | Status  | Used when |
|--------------------------------------|---------|-----------|
| `LocalStorageAdapter.js`             | active  | default, wired in `App.init()` |
| `FirebaseAdapter.js`                 | stub    | see `firebase-migration.md` |

## Wiring

`js/app.js`:

```js
import { LocalStorageAdapter, setStorage } from './core/storage/index.js';
// ...
App.init() {
    setStorage(new LocalStorageAdapter());   // ← single line to swap backends
    // ...
}
```

`js/logic/state.js`:

```js
import { getStorage } from '../core/storage/index.js';
const Storage = {
    get(k)    { return getStorage().get(k); },
    set(k, v) { getStorage().set(k, v); }
};
```

That indirection is what lets us drop in another backend later without touching `State` or any consumer.

## Where localStorage was accessed in the original

| Original line | Original call                                              | Now routes through          |
|--------------:|------------------------------------------------------------|-----------------------------|
| 1163          | `localStorage.getItem(CONFIG.STORE_KEY)`                   | `Storage.get`               |
| 1196          | `localStorage.setItem(CONFIG.BACKUP_KEY, JSON.stringify)`  | `Storage.set`               |
| 1197          | `localStorage.setItem(CONFIG.STORE_KEY, JSON.stringify)`   | `Storage.set`               |
| 1202          | `localStorage.getItem(CONFIG.BACKUP_KEY)`                  | `Storage.get`               |
| 2195          | `localStorage.setItem(CONFIG.STORE_KEY, ...)` in ShareURL   | `getStorage().set`          |

`sessionStorage.osiris_booted` was intentionally left as direct `sessionStorage` access — it is a session-only key, not part of the persisted save schema, and the spec required byte-identical preservation of that key.

## Keys (unchanged)

```
osiris_db_v3          ← primary save (managed by State)
osiris_db_v3_backup   ← safe copy written before every save (managed by State)
osiris_booted         ← sessionStorage, session-only, controls intro overlay
```

Schema version is `3` (`CONFIG.SCHEMA_VERSION`). Migration logic in `State.migrate()` still handles v1/v2/v3 payloads.
