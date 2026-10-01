/**
 * Web persistence. The universe lives in IndexedDB (large quota, written off the
 * main thread); localStorage is only a fallback when IndexedDB is unavailable,
 * and older saves found there are migrated across on first load.
 */
const K = 'chequered:';
const DB_NAME = 'chequered';
const STORE = 'kv';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => {
        const db = req.result;
        // Another tab upgrading or the browser closing the connection: reopen on next use.
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        db.onclose = () => {
          dbPromise = null;
        };
        resolve(db);
      };
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve) => {
        if (!db) return resolve(undefined);
        try {
          const t = db.transaction(STORE, mode);
          const req = run(t.objectStore(STORE));
          // Resolve on commit, not on request success: a quota failure only surfaces as an abort.
          t.oncomplete = () => resolve(req.result);
          t.onerror = () => resolve(undefined);
          t.onabort = () => resolve(undefined);
        } catch {
          resolve(undefined);
        }
      }),
  );
}

function lsGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(K + key) ?? null;
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string) {
  try {
    globalThis.localStorage?.setItem(K + key, value);
  } catch {
    // storage full or unavailable
  }
}

function lsRemove(key: string) {
  try {
    globalThis.localStorage?.removeItem(K + key);
  } catch {
    // ignore
  }
}

function parse<T>(v: string | null | undefined): T | null {
  if (!v) return null;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

async function read<T>(key: string): Promise<T | null> {
  const db = await openDb();
  if (!db) return parse<T>(lsGet(key));
  const v = await tx<string>('readonly', (s) => s.get(key) as IDBRequest<string>);
  if (typeof v === 'string') return parse<T>(v);
  // Migrate a save written by an older version (localStorage) into IndexedDB.
  const legacy = lsGet(key);
  if (legacy) {
    await tx('readwrite', (s) => s.put(legacy, key));
    lsRemove(key);
  }
  return parse<T>(legacy);
}

function write(key: string, data: unknown): Promise<void> {
  // Serialise now, so later mutations of `data` can't leak into this save.
  const json = JSON.stringify(data);
  return openDb().then(async (db) => {
    const ok = db ? (await tx('readwrite', (s) => s.put(json, key))) !== undefined : false;
    if (!ok) lsSet(key, json);
  });
}

export const persist = {
  loadWorld<T>(): Promise<T | null> {
    return read<T>('world');
  },
  saveWorld(data: unknown): Promise<void> {
    return write('world', data);
  },
  loadSettings<T>(): Promise<T | null> {
    return read<T>('settings');
  },
  saveSettings(data: unknown): Promise<void> {
    return write('settings', data);
  },
  loadCareer<T>(id: string): Promise<T | null> {
    return read<T>(`career:${id}`);
  },
  saveCareer(id: string, data: unknown): Promise<void> {
    return write(`career:${id}`, data);
  },
  async listCareers(): Promise<string[]> {
    const ids = new Set<string>();
    const keys = await tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys());
    for (const k of keys ?? []) if (typeof k === 'string' && k.startsWith('career:')) ids.add(k.slice('career:'.length));
    try {
      const ls = globalThis.localStorage;
      if (ls)
        for (let i = 0; i < ls.length; i++) {
          const k = ls.key(i);
          if (k && k.startsWith(`${K}career:`)) ids.add(k.slice(`${K}career:`.length));
        }
    } catch {
      // ignore
    }
    return [...ids];
  },
  wipe(): Promise<void> {
    // localStorage is cleared synchronously so a save issued right after can't be wiped.
    try {
      const ls = globalThis.localStorage;
      const keys: string[] = [];
      for (let i = 0; ls && i < ls.length; i++) {
        const k = ls.key(i);
        if (k && k.startsWith(K)) keys.push(k);
      }
      keys.forEach((k) => ls?.removeItem(k));
    } catch {
      // ignore
    }
    return tx('readwrite', (s) => s.clear()).then(() => undefined);
  },
};
