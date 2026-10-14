// Le journal du profil ouvert, côté interface.
// ⛳ Lot 2 : remplacé par le moteur Rust via UniFFI (SQLite chiffré). D'ici là, journal en mémoire
//    persisté localement (MMKV sur l'appareil, localStorage sur le web) — jamais sur un serveur.

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Entry, ProjectAct, Provenance } from './acts';
import { pending, standing, type ProjectState } from './project';
import { localStorageAdapter } from './storage';
import { seedAmina } from './seed';

interface ProjectStore {
  person: string;
  entries: Entry[];
  act: (author: string, act: ProjectAct, provenance?: Provenance) => Entry;
  undo: (author: string, rank: number) => void;
  confirm: (rank: number, by: string) => void;
  reset: () => void;
}

export const useProject = create<ProjectStore>()(
  persist(
    (set, get) => ({
      person: 'amina',
      entries: seedAmina(),
      act: (author, act, provenance = 'by_hand') => {
        const e: Entry = { rank: get().entries.length, author, provenance, act };
        set({ entries: [...get().entries, e] });
        return e;
      },
      undo: (author, rank) => {
        const e: Entry = { rank: get().entries.length, author, provenance: 'by_hand', undone: rank };
        set({ entries: [...get().entries, e] });
      },
      confirm: (rank, by) => {
        // Valider = ré-écrire la proposition, confirmée par un humain, puis compenser l'originale.
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
      reset: () => set({ entries: seedAmina() }),
    }),
    { name: 'hlux.project.amina', storage: createJSONStorage(() => localStorageAdapter) },
  ),
);

export const useProjectState = (): ProjectState => standing(useProject((s) => s.entries));
export const usePending = () => pending(useProject((s) => s.entries));
