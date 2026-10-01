/**
 * Native persistence: JSON files in the app's document directory.
 * (A web implementation lives in persist.web.ts.)
 *
 * Saves are crash-safe: data is written to `<name>.tmp` first, the previous file
 * is kept as `<name>.bak`, and only then is the new file moved into place. If the
 * app dies part-way, loading falls back to the newest copy that still parses.
 */
import { Directory, File, Paths } from 'expo-file-system';

const root = () => new Directory(Paths.document, 'chequered');
const careersDir = () => new Directory(root(), 'careers');

function ensureDirs() {
  const r = root();
  if (!r.exists) r.create({ intermediates: true });
  const c = careersDir();
  if (!c.exists) c.create({ intermediates: true });
}

function parseFile<T>(file: File): T | null {
  try {
    if (!file.exists) return null;
    return JSON.parse(file.textSync()) as T;
  } catch {
    return null;
  }
}

function readJson<T>(dir: Directory, name: string): T | null {
  return parseFile<T>(new File(dir, name)) ?? parseFile<T>(new File(dir, `${name}.tmp`)) ?? parseFile<T>(new File(dir, `${name}.bak`));
}

function writeJson(dir: Directory, name: string, data: unknown) {
  ensureDirs();
  const json = JSON.stringify(data);
  const tmp = new File(dir, `${name}.tmp`);
  if (tmp.exists) tmp.delete();
  tmp.create();
  tmp.write(json);
  const target = new File(dir, name);
  if (target.exists) target.moveSync(new File(dir, `${name}.bak`), { overwrite: true });
  tmp.moveSync(new File(dir, name), { overwrite: true });
}

export const persist = {
  loadWorld<T>(): T | null {
    ensureDirs();
    return readJson<T>(root(), 'world.json');
  },
  saveWorld(data: unknown) {
    writeJson(root(), 'world.json', data);
  },
  loadSettings<T>(): T | null {
    ensureDirs();
    return readJson<T>(root(), 'settings.json');
  },
  saveSettings(data: unknown) {
    writeJson(root(), 'settings.json', data);
  },
  loadCareer<T>(id: string): T | null {
    return readJson<T>(careersDir(), `${id}.json`);
  },
  saveCareer(id: string, data: unknown) {
    writeJson(careersDir(), `${id}.json`, data);
  },
  listCareers(): string[] {
    ensureDirs();
    try {
      const ids = new Set<string>();
      for (const x of careersDir().list()) {
        if (!(x instanceof File)) continue;
        // c12.json, c12.json.tmp and c12.json.bak all belong to career c12.
        const m = /^(.+)\.json(\.tmp|\.bak)?$/.exec(x.name);
        if (m) ids.add(m[1]);
      }
      return [...ids];
    } catch {
      return [];
    }
  },
  wipe() {
    try {
      const r = root();
      if (r.exists) r.delete();
    } catch {
      // ignore
    }
  },
};
