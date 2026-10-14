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
      undo: (author, rank) => set({ entries: [...get().entries, { rank: get().entries.length, author, provenance: 'by_hand', undone: rank }] }),
    }),
    { name: FACILITY_KEY, storage: createJSONStorage(() => localStorageAdapter) },
  ),
);

export const useFacilityState = (): FacilityState => facilityStanding(useFacility((s) => s.entries));
