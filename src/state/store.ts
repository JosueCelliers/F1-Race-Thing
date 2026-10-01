import { create } from 'zustand';
import type { CareerRecord, World } from '../sim/types';
import { createWorld, WORLD_VERSION } from '../sim/world';
import { setHapticsEnabled } from '../ui/haptics';
import { persist } from './persist';

export interface Settings {
  haptics: boolean;
  sound: boolean;
  /** Default race viewing mode. */
  raceMode: 'watch' | 'highlights' | 'instant';
  /** Default broadcast speed multiplier. */
  speed: 1 | 2 | 4;
  spinSpeed: 'normal' | 'fast';
}

const DEFAULT_SETTINGS: Settings = { haptics: true, sound: true, raceMode: 'highlights', speed: 2, spinSpeed: 'normal' };

interface GameStore {
  ready: boolean;
  world: World | null;
  /** Bumped on every world mutation (the world object is mutated in place). */
  rev: number;
  settings: Settings;
  archive: Record<string, CareerRecord>;
  load: () => Promise<void>;
  ensureWorld: () => World;
  resetUniverse: () => void;
  mutate: (fn: (w: World) => void) => void;
  saveCareer: (rec: CareerRecord) => void;
  setSettings: (s: Partial<Settings>) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;

export const useGame = create<GameStore>((set, get) => ({
  ready: false,
  world: null,
  rev: 0,
  settings: DEFAULT_SETTINGS,
  archive: {},
  load: async () => {
    const settings = { ...DEFAULT_SETTINGS, ...((await persist.loadSettings<Settings>()) ?? {}) };
    setHapticsEnabled(settings.haptics);
    let world = await persist.loadWorld<World>();
    if (world && world.version !== WORLD_VERSION) world = null;
    const archive: Record<string, CareerRecord> = {};
    for (const id of await persist.listCareers()) {
      const rec = await persist.loadCareer<CareerRecord>(id);
      if (rec) archive[id] = rec;
    }
    set({ ready: true, world, settings, archive });
  },
  ensureWorld: () => {
    let w = get().world;
    if (!w) {
      w = createWorld(Math.floor(Math.random() * 2 ** 31));
      persist.saveWorld(w);
      set({ world: w, rev: get().rev + 1 });
    }
    return w;
  },
  resetUniverse: () => {
    const settings = get().settings;
    set({ world: null, archive: {}, rev: get().rev + 1 });
    void persist.wipe().then(() => persist.saveSettings(settings));
  },
  mutate: (fn) => {
    const w = get().world;
    if (!w) return;
    fn(w);
    set({ rev: get().rev + 1 });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const cur = get().world;
      if (cur) persist.saveWorld(cur);
    }, 250);
  },
  saveCareer: (rec) => {
    persist.saveCareer(rec.id, rec);
    set({ archive: { ...get().archive, [rec.id]: rec } });
  },
  setSettings: (s) => {
    const settings = { ...get().settings, ...s };
    setHapticsEnabled(settings.haptics);
    persist.saveSettings(settings);
    set({ settings });
  },
}));

/** Subscribe to the world and re-render on every mutation. */
export function useWorld(): World | null {
  useGame((s) => s.rev);
  return useGame((s) => s.world);
}

export function flushSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = undefined;
  const w = useGame.getState().world;
  if (w) persist.saveWorld(w);
}
