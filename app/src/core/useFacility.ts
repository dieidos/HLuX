// Copie locale du Projet d'Établissement (lot 5 : synchronisée avec le tableau dieidos).
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { facilityStanding, type FacilityAct, type FacilityState, type FEntry } from './facility';
import { localStorageAdapter } from './storage';

/** Le Projet d'Établissement de la tablette (copie locale ; lot 5 : synchronisé avec le tableau dieidos). */
export const FACILITY_KEY = 'hlux.facility';

interface FacilityStore {
  entries: FEntry[];
  /** `generated` + `confirmedBy` : une proposition de l'IA validée par des humains ; `hypothesis` : pas encore validée. */
  act: (author: string, act: FacilityAct, provenance?: FEntry['provenance'], confirmedBy?: string) => FEntry;
  undo: (author: string, rank: number) => void;
  /** Valider pour le groupe une proposition de l'IA (l'animatrice, après accord du groupe). */
  confirm: (rank: number, by: string) => void;
}

export const useFacility = create<FacilityStore>()(
  persist(
    (set, get) => ({
      entries: [],
      act: (author, act, provenance = 'by_hand', confirmedBy) => {
        const e: FEntry = { rank: get().entries.length, author, provenance, act, ...(confirmedBy ? { confirmedBy } : {}) };
        set({ entries: [...get().entries, e] });
        return e;
      },
      confirm: (rank, by) => {
        const original = get().entries.find((x) => x.rank === rank && x.provenance === 'hypothesis');
        if (!original?.act) return;
        const n = get().entries.length;
        set({
          entries: [
            ...get().entries,
            { rank: n, author: original.author, provenance: 'generated', confirmedBy: by, act: original.act },
            { rank: n + 1, author: by, provenance: 'by_hand', undone: rank },
          ],
        });
      },
      undo: (author, rank) => set({ entries: [...get().entries, { rank: get().entries.length, author, provenance: 'by_hand', undone: rank }] }),
    }),
    { name: FACILITY_KEY, storage: createJSONStorage(() => localStorageAdapter) },
  ),
);

export const useFacilityState = (): FacilityState => facilityStanding(useFacility((s) => s.entries));
