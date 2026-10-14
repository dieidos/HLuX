// Copie locale du Projet d'Établissement (lot 5 : synchronisée avec le tableau dieidos).
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { facilityStanding, type FacilityAct, type FacilityState, type FEntry } from './facility';
import { localStorageAdapter } from './storage';

/** Le CHRS Les Lilas tel que l'Atlas le montre au début de l'écran 07 (personnages imaginaires). */
function seedLilas(): FEntry[] {
  const acts: FacilityAct[] = [
    { act: 'attendance', session: 'mardi 12 janvier', present: ['Aïcha', 'Bruno', 'Karim'], absent: ['Léa'], facilitator: 'Aïcha' },
    { act: 'agenda_item', item: 'local-cvs', title: 'Le local du CVS', source: 'cvs', session: 'mardi 12 janvier' },
    { act: 'agenda_item', item: 'laverie', title: 'Les horaires de la laverie', source: 'consented_word', session: 'mardi 12 janvier' },
    { act: 'mandate_set', to: 'Aïcha' },
    { act: 'finding_placed', finding: 'nuit', title: "L'équipe de nuit prévient", zone: 'fine', source: 'team', author: 'Bruno' },
    { act: 'finding_placed', finding: 'cvs', title: 'Le CVS se réunit', zone: 'fine', source: 'cvs', author: 'Aïcha' },
    { act: 'finding_placed', finding: 'laverie', title: 'Horaires de la laverie', zone: 'unsure', source: 'consented_word', author: 'Karim' },
  ];
  return acts.map((act, i) => ({ rank: i, author: 'aicha', provenance: 'by_hand', act }));
}

interface FacilityStore {
  entries: FEntry[];
  /** `generated` + `confirmedBy` : une proposition de l'IA validée par des humains ; `hypothesis` : pas encore validée. */
  act: (author: string, act: FacilityAct, provenance?: FEntry['provenance'], confirmedBy?: string) => FEntry;
  undo: (author: string, rank: number) => void;
}

export const useFacility = create<FacilityStore>()(
  persist(
    (set, get) => ({
      entries: seedLilas(),
      act: (author, act, provenance = 'by_hand', confirmedBy) => {
        const e: FEntry = { rank: get().entries.length, author, provenance, act, ...(confirmedBy ? { confirmedBy } : {}) };
        set({ entries: [...get().entries, e] });
        return e;
      },
      undo: (author, rank) => set({ entries: [...get().entries, { rank: get().entries.length, author, provenance: 'by_hand', undone: rank }] }),
    }),
    { name: 'hlux.facility.les-lilas', storage: createJSONStorage(() => localStorageAdapter) },
  ),
);

export const useFacilityState = (): FacilityState => facilityStanding(useFacility((s) => s.entries));
