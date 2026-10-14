// Le magasin du profil ouvert et de la séance — sans React Native, donc testable (`projectStore.test.ts`).
// ⛳ Lot 2 : remplacé par le moteur Rust via UniFFI (SQLite chiffré, une base par profil). D'ici là,
//    chaque profil a son journal sous sa propre clé locale — jamais sur un serveur.

import { create } from 'zustand';

import type { Entry, ProjectAct, Provenance } from './acts';
import { firstEntries, profileId, readJournal, readProfiles, writeJournal, writeProfiles, type KV, type Profile } from './profiles';
import { seedAmina } from './seed';

/** L'équipe de l'établissement de démonstration (personnages imaginaires). */
export const TEAM = ['Sarah', 'Aïcha', 'Bruno', 'Karim', 'Léa'];

interface ProjectStore {
  profiles: Profile[];
  /** La professionnelle qui a ouvert la séance ; null : séance fermée. */
  pro: string | null;
  /** Le profil ouvert ; null : aucun. */
  person: string | null;
  entries: Entry[];
  openSession: (pro: string) => void;
  closeSession: () => void;
  open: (id: string) => void;
  close: () => void;
  createProfile: (firstName: string, sentence: string) => string;
  act: (author: string, act: ProjectAct, provenance?: Provenance, confirmedBy?: string) => Entry;
  undo: (author: string, rank: number) => void;
  confirm: (rank: number, by: string) => void;
  reset: () => void;
}

/** Au premier lancement, la tablette de démonstration porte le profil d'Amina et son fil. */
function boot(kv: KV): Profile[] {
  let profiles = readProfiles(kv);
  if (!profiles.length) {
    profiles = [{ id: 'amina', firstName: 'Amina' }];
    writeProfiles(kv, profiles);
    if (!readJournal(kv, 'amina').length) writeJournal(kv, 'amina', seedAmina());
  }
  return profiles;
}

export function makeProjectStore(kv: KV) {
  return create<ProjectStore>()((set, get) => {
    const save = (entries: Entry[]) => {
      const id = get().person;
      if (!id) return; // hors séance, rien ne s'écrit
      writeJournal(kv, id, entries);
      set({ entries });
    };
    return {
      profiles: boot(kv),
      pro: null,
      person: null,
      entries: [],
      openSession: (pro) => set({ pro, person: null, entries: [] }),
      closeSession: () => set({ pro: null, person: null, entries: [] }),
      open: (id) => {
        if (!get().pro || !get().profiles.some((p) => p.id === id)) return; // le profil s'ouvre par la séance
        set({ person: id, entries: readJournal(kv, id) });
      },
      close: () => set({ person: null, entries: [] }),
      createProfile: (firstName, sentence) => {
        const pro = get().pro;
        if (!pro || !firstName.trim()) return '';
        const id = profileId(firstName.trim(), get().profiles.map((p) => p.id));
        const profiles = [...get().profiles, { id, firstName: firstName.trim() }];
        writeProfiles(kv, profiles);
        writeJournal(kv, id, firstEntries(id, sentence, pro));
        set({ profiles });
        get().open(id);
        return id;
      },
      act: (author, act, provenance = 'by_hand', confirmedBy) => {
        const e: Entry = { rank: get().entries.length, author, provenance, act, ...(confirmedBy ? { confirmedBy } : {}) };
        save([...get().entries, e]);
        return e;
      },
      undo: (author, rank) => {
        save([...get().entries, { rank: get().entries.length, author, provenance: 'by_hand', undone: rank }]);
      },
      confirm: (rank, by) => {
        // Valider = ré-écrire la proposition, confirmée par un humain, puis compenser l'originale.
        const original = get().entries.find((x) => x.rank === rank && x.provenance === 'hypothesis');
        if (!original?.act) return;
        const n = get().entries.length;
        save([
          ...get().entries,
          { rank: n, author: original.author, provenance: 'generated', confirmedBy: by, act: original.act },
          { rank: n + 1, author: by, provenance: 'by_hand', undone: rank },
        ]);
      },
      reset: () => save(get().person === 'amina' ? seedAmina() : []),
    };
  });
}

