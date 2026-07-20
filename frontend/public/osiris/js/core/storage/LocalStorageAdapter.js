// O.S.I.R.I.S. — Default storage adapter: browser localStorage.
// Mirrors the exact byte-for-byte behavior of the original inline calls.
import { StorageInterface } from './StorageInterface.js';

export class LocalStorageAdapter extends StorageInterface {
    get(key)          { return localStorage.getItem(key); }
    set(key, value)   { localStorage.setItem(key, value); }
    remove(key)       { localStorage.removeItem(key); }
    backup(src, dst)  {
        const v = localStorage.getItem(src);
        if (v !== null) localStorage.setItem(dst, v);
    }
    restore(backup, dst) {
        const v = localStorage.getItem(backup);
        if (v !== null) localStorage.setItem(dst, v);
        return v;
    }
}
