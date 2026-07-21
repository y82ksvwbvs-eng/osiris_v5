// O.S.I.R.I.S. — Firebase storage adapter (STUB).
//
// Present for architectural completeness. Not wired into the app.
// NOTE: This file is intentionally a stub and is OPTIONAL. It is not required
// for the app to function offline. To avoid confusion, enable this adapter only
// if you add Firebase SDKs and credentials; otherwise keep using the default
// local-storage adapter that persists data on-device.
// When you're ready to migrate:
//   1. Add firebase-app.js + firebase-firestore.js (or the modular v10 SDK) to index.html
//   2. Fill in the constructor with your Firebase config
//   3. Implement each method to read/write a per-user document
//   4. In js/app.js swap `new LocalStorageAdapter()` -> `new FirebaseAdapter(...)`.
//
// The adapter must remain synchronous OR you must make State.load/save async as well.
// See docs/firebase-migration.md for the full playbook.
import { StorageInterface } from './StorageInterface.js';

export class FirebaseAdapter extends StorageInterface {
    constructor(config /* { apiKey, projectId, userId, ... } */) {
        super();
        this._config = config || null;
        // TODO: initialize Firebase app + Firestore client here
    }
    get(_key)         { throw new Error('FirebaseAdapter.get: not implemented (stub)'); }
    set(_key, _value) { throw new Error('FirebaseAdapter.set: not implemented (stub)'); }
    remove(_key)      { throw new Error('FirebaseAdapter.remove: not implemented (stub)'); }
    backup(_s, _d)    { throw new Error('FirebaseAdapter.backup: not implemented (stub)'); }
    restore(_b, _d)   { throw new Error('FirebaseAdapter.restore: not implemented (stub)'); }
}
