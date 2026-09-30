import { EUROPE } from './names/europe';
import { WORLD_NAMES } from './names/world';
import type { NameGroup } from './types';

/** Name pools per cultural group (referenced by nations via `nameGroup`). */
export const NAME_GROUPS: Record<string, NameGroup> = { ...EUROPE, ...WORLD_NAMES };
