/**
 * Native persistence: JSON files in the app's document directory.
 * (A web implementation lives in persist.web.ts.)
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

function readJson<T>(file: File): T | null {
  try {
    if (!file.exists) return null;
    return JSON.parse(file.textSync()) as T;
  } catch {
    return null;
  }
}

function writeJson(file: File, data: unknown) {
  ensureDirs();
  if (!file.exists) file.create({ overwrite: true });
  file.write(JSON.stringify(data));
}

export const persist = {
  loadWorld<T>(): T | null {
    ensureDirs();
    return readJson<T>(new File(root(), 'world.json'));
  },
  saveWorld(data: unknown) {
    writeJson(new File(root(), 'world.json'), data);
  },
  loadSettings<T>(): T | null {
    ensureDirs();
    return readJson<T>(new File(root(), 'settings.json'));
  },
  saveSettings(data: unknown) {
    writeJson(new File(root(), 'settings.json'), data);
  },
  loadCareer<T>(id: string): T | null {
    return readJson<T>(new File(careersDir(), `${id}.json`));
  },
  saveCareer(id: string, data: unknown) {
    writeJson(new File(careersDir(), `${id}.json`), data);
  },
  listCareers(): string[] {
    ensureDirs();
    try {
      return careersDir()
        .list()
        .filter((x): x is File => x instanceof File)
        .map((f) => f.name.replace(/\.json$/, ''));
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
