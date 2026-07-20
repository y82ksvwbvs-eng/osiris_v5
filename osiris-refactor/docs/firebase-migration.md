# Firebase migration — the playbook

The refactor ships a `FirebaseAdapter` stub. This document explains how to activate it if/when you want to move the archive off the browser and into a per-user cloud document.

> ⚠️ **This is not free of behavior change.** Firestore is asynchronous. The current adapter contract is synchronous. You have two options — pick one before writing any code.

## Option A — sync facade, async writes underneath (recommended)

Keep `Storage.get(key)` / `Storage.set(key, val)` synchronous. Fill them from an in-memory cache that `FirebaseAdapter.init()` populates once at startup. Persist changes to Firestore in the background (fire-and-forget with retry). This preserves 100% of the existing `State.load()` / `State.save()` control flow.

Downsides: writes lag by ~50-500ms. Cross-device changes only surface on next load (unless you add a Firestore listener that patches the cache).

## Option B — go async

Convert `Storage.get` / `Storage.set` to return `Promise`s. Then convert `State.load()`, `State.save()`, `State.restoreBackup()`, `ShareURL.saveState()` to `async`. Everything that transitively calls those becomes `async`. **This is a breaking change to the module contract and to most of `Logic`, `UI`, `Backup`, `ShareURL`.** Not recommended for a "preserve behavior" refactor. Only pursue this if you're doing another major rewrite anyway.

---

## Recipe (Option A)

### 1. Add Firebase SDK to `index.html`

```html
<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
  import { getFirestore, doc, getDoc, setDoc }
       from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
  window.__firebase = { initializeApp, getFirestore, doc, getDoc, setDoc };
</script>
```

Or (cleaner) install via a bundler if you decide to introduce one later.

### 2. Fill in `FirebaseAdapter`

```js
// js/core/storage/FirebaseAdapter.js
export class FirebaseAdapter extends StorageInterface {
    constructor({ firebaseConfig, userId }) {
        super();
        this._app  = window.__firebase.initializeApp(firebaseConfig);
        this._db   = window.__firebase.getFirestore(this._app);
        this._user = userId;
        this._cache = {};              // key -> serialized string
        this._pendingWrite = null;
    }

    async warmup() {
        const ref  = window.__firebase.doc(this._db, 'osiris_saves', this._user);
        const snap = await window.__firebase.getDoc(ref);
        if (snap.exists()) this._cache = snap.data();
    }

    get(key)          { return this._cache[key] ?? null; }
    set(key, value)   {
        this._cache[key] = value;
        this._scheduleFlush();
    }
    remove(key)       { delete this._cache[key]; this._scheduleFlush(); }
    backup(src, dst)  { if (this._cache[src] != null) this._cache[dst] = this._cache[src]; this._scheduleFlush(); }
    restore(bkp, dst) { const v = this._cache[bkp] ?? null; if (v != null) this._cache[dst] = v; this._scheduleFlush(); return v; }

    _scheduleFlush() {
        clearTimeout(this._pendingWrite);
        this._pendingWrite = setTimeout(async () => {
            const ref = window.__firebase.doc(this._db, 'osiris_saves', this._user);
            try { await window.__firebase.setDoc(ref, this._cache); }
            catch (e) { console.warn('Firestore write failed', e); }
        }, 200);
    }
}
```

### 3. Swap the adapter in `app.js`

```js
// Before:
setStorage(new LocalStorageAdapter());

// After:
const fb = new FirebaseAdapter({ firebaseConfig: {...}, userId: currentUser.uid });
await fb.warmup();          // ← the only place you need `await`
setStorage(fb);
```

### 4. That's it

No changes needed in `State`, `Logic`, `UI`, `Backup`, `ShareURL`, or anywhere else. They all still call `Storage.get(k)` / `Storage.set(k, v)` and see the exact same synchronous return values.

## Considerations

- **Authentication is out of scope** for the storage layer. Wire up your auth provider *before* calling `App.init()` and pass the resulting `userId` into `FirebaseAdapter`.
- **Conflict resolution**: if the same user opens two devices, last-write-wins by default. The existing "Copy URL Transfer" feature (`ShareURL`) remains as a manual escape hatch.
- **Backups**: the `osiris_db_v3_backup` key is still written on every save, but now inside the same Firestore document. Good enough for corrupt-parse recovery.
- **Rollback**: revert `app.js` to `setStorage(new LocalStorageAdapter())` and the app returns to fully-offline mode. Existing Firestore documents remain unchanged.
