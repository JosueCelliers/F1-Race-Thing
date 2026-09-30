import { create } from 'zustand';
import type { SeasonReview } from '../sim/career';
import type { CareerRecord, HighlightSpec } from '../sim/types';

/** Ephemeral (non-persisted) UI state shared between screens. */
interface SessionStore {
  review: SeasonReview | null;
  setReview: (r: SeasonReview | null) => void;
  replay: { spec: HighlightSpec; title?: string } | null;
  setReplay: (r: { spec: HighlightSpec; title?: string } | null) => void;
  justRetired: CareerRecord | null;
  setJustRetired: (r: CareerRecord | null) => void;
}

export const useSession = create<SessionStore>((set) => ({
  review: null,
  setReview: (review) => set({ review }),
  replay: null,
  setReplay: (replay) => set({ replay }),
  justRetired: null,
  setJustRetired: (justRetired) => set({ justRetired }),
}));
