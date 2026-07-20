// Storage barrel — a single import point for the storage layer.
export { StorageInterface }   from './StorageInterface.js';
export { LocalStorageAdapter } from './LocalStorageAdapter.js';
export { FirebaseAdapter }     from './FirebaseAdapter.js';

// Module-level singleton, wired in App.init() before any consumer touches it.
let _storage = null;
export function setStorage(adapter) { _storage = adapter; }
export function getStorage()        {
    if (!_storage) throw new Error('Storage not initialized. Call setStorage() in App.init().');
    return _storage;
}
