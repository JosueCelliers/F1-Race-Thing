import { beforeEach, describe, expect, it, vi } from 'vitest';

// A tiny in-memory stand-in for expo-file-system's File/Directory API.
vi.mock('expo-file-system', () => {
  const files = new Map<string, string>();
  const dirs = new Set<string>();
  const join = (parts: unknown[]) => parts.map((p) => (typeof p === 'string' ? p : (p as { uri: string }).uri)).join('/');
  class Directory {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = join(parts);
    }
    get exists() {
      return dirs.has(this.uri);
    }
    create() {
      dirs.add(this.uri);
    }
    delete() {
      for (const k of [...files.keys()]) if (k.startsWith(this.uri + '/')) files.delete(k);
      for (const d of [...dirs]) if (d === this.uri || d.startsWith(this.uri + '/')) dirs.delete(d);
    }
    list() {
      return [...files.keys()].filter((k) => k.slice(0, k.lastIndexOf('/')) === this.uri).map((k) => new File(k));
    }
  }
  class File {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = join(parts);
    }
    get name() {
      return this.uri.slice(this.uri.lastIndexOf('/') + 1);
    }
    get exists() {
      return files.has(this.uri);
    }
    create() {
      if (files.has(this.uri)) throw new Error('exists');
      files.set(this.uri, '');
    }
    write(s: string) {
      files.set(this.uri, s);
    }
    textSync() {
      return files.get(this.uri) ?? '';
    }
    delete() {
      files.delete(this.uri);
    }
    moveSync(dest: File, opts?: { overwrite?: boolean }) {
      if (files.has(dest.uri) && !opts?.overwrite) throw new Error('destination exists');
      files.set(dest.uri, files.get(this.uri) ?? '');
      files.delete(this.uri);
      this.uri = dest.uri;
    }
  }
  return { File, Directory, Paths: { document: new Directory('doc') }, __files: files };
});

const fsMock = (await import('expo-file-system')) as unknown as { __files: Map<string, string> };
const { persist } = await import('../persist');
const files = fsMock.__files;

describe('native persistence', () => {
  beforeEach(() => {
    persist.wipe();
    files.clear();
  });

  it('round-trips the world and keeps the previous save as a backup', () => {
    persist.saveWorld({ year: 2026 });
    persist.saveWorld({ year: 2027 });
    expect(persist.loadWorld<{ year: number }>()?.year).toBe(2027);
    expect(JSON.parse(files.get('doc/chequered/world.json.bak')!).year).toBe(2026);
    expect(files.has('doc/chequered/world.json.tmp')).toBe(false);
  });

  it('survives a crash in the middle of writing', () => {
    persist.saveWorld({ year: 2026 });
    // The app died while writing the next save: a truncated temp file is left behind.
    files.set('doc/chequered/world.json.tmp', '{"year": 20');
    expect(persist.loadWorld<{ year: number }>()?.year).toBe(2026);
  });

  it('survives a crash between the two renames', () => {
    persist.saveWorld({ year: 2026 });
    persist.saveWorld({ year: 2027 });
    // Old file already moved to .bak, new one still sitting in .tmp.
    files.set('doc/chequered/world.json.tmp', files.get('doc/chequered/world.json')!);
    files.delete('doc/chequered/world.json');
    expect(persist.loadWorld<{ year: number }>()?.year).toBe(2027);
  });

  it('falls back to the backup when the main file is corrupt', () => {
    persist.saveWorld({ year: 2026 });
    persist.saveWorld({ year: 2027 });
    files.set('doc/chequered/world.json', 'garbage');
    expect(persist.loadWorld<{ year: number }>()?.year).toBe(2026);
  });

  it('lists each archived career once', () => {
    persist.saveCareer('c1', { id: 'c1' });
    persist.saveCareer('c1', { id: 'c1', v: 2 });
    persist.saveCareer('c2', { id: 'c2' });
    expect(persist.listCareers().sort()).toEqual(['c1', 'c2']);
    expect(persist.loadCareer<{ v: number }>('c1')?.v).toBe(2);
  });
});
