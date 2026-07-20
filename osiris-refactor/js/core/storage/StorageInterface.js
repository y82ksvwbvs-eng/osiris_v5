// O.S.I.R.I.S. — Storage abstraction contract.
//
// All persistence must go through an adapter that implements this shape.
// Business logic (State, Backup, ShareURL) must never touch window.localStorage
// directly. Swapping backends (localStorage → Firebase → IndexedDB) then becomes
// a one-line change in app.js.
//
// Contract:
//   get(key)        -> string | null   (synchronous, mirrors localStorage.getItem)
//   set(key, value) -> void            (synchronous, mirrors localStorage.setItem)
//   remove(key)     -> void
//   backup(srcKey, backupKey)   -> void  copies srcKey to backupKey
//   restore(backupKey, dstKey)  -> string | null  copies backupKey to dstKey
//
// The current LocalStorageAdapter is intentionally synchronous to preserve
// the exact call semantics of the original inline code.

export class StorageInterface {
    get(_key)                 { throw new Error('StorageInterface.get not implemented'); }
    set(_key, _value)         { throw new Error('StorageInterface.set not implemented'); }
    remove(_key)              { throw new Error('StorageInterface.remove not implemented'); }
    backup(_src, _dst)        { throw new Error('StorageInterface.backup not implemented'); }
    restore(_backup, _dst)    { throw new Error('StorageInterface.restore not implemented'); }
}
