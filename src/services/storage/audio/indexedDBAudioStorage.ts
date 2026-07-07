import type { AudioStorageAdapter } from "./audioStorageTypes";

const DB_NAME = "heyin-audio";
const DB_VERSION = 1;
const STORE_NAME = "blobs";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not supported in this browser."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * IndexedDB implementation of AudioStorageAdapter.
 */
export const indexedDBAudioStorage: AudioStorageAdapter = {
  async save(blob: Blob): Promise<string> {
    const db = await openDB();
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(blob, id);
      tx.oncomplete = () => { db.close(); resolve(id); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  },

  async load(id: string): Promise<Blob | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const request = tx.objectStore(STORE_NAME).get(id);
        request.onsuccess = () => { db.close(); resolve(request.result ?? null); };
        request.onerror = () => { db.close(); reject(request.error); };
      });
    } catch { return null; }
  },

  async delete(id: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); resolve(); };
      });
    } catch { /* silent */ }
  },
};
