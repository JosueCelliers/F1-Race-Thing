/**
 * Web persistence (used for browser previews): localStorage.
 */
const K = 'chequered:';

function read<T>(key: string): T | null {
  try {
    const v = globalThis.localStorage?.getItem(K + key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, data: unknown) {
  try {
    globalThis.localStorage?.setItem(K + key, JSON.stringify(data));
  } catch {
    // storage full or unavailable
  }
}

export const persist = {
  loadWorld<T>(): T | null {
    return read<T>('world');
  },
  saveWorld(data: unknown) {
    write('world', data);
  },
  loadSettings<T>(): T | null {
    return read<T>('settings');
  },
  saveSettings(data: unknown) {
    write('settings', data);
  },
  loadCareer<T>(id: string): T | null {
    return read<T>(`career:${id}`);
  },
  saveCareer(id: string, data: unknown) {
    write(`career:${id}`, data);
  },
  listCareers(): string[] {
    const out: string[] = [];
    try {
      const ls = globalThis.localStorage;
      if (!ls) return out;
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k && k.startsWith(`${K}career:`)) out.push(k.slice(`${K}career:`.length));
      }
    } catch {
      // ignore
    }
    return out;
  },
  wipe() {
    try {
      const ls = globalThis.localStorage;
      if (!ls) return;
      const keys: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i);
        if (k && k.startsWith(K)) keys.push(k);
      }
      keys.forEach((k) => ls.removeItem(k));
    } catch {
      // ignore
    }
  },
};
