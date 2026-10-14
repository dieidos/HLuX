// Le magasin du profil ouvert et de la séance — sans React Native, donc testable (`projectStore.test.ts`).
// ⛳ Lot 2 : remplacé par le moteur Rust via UniFFI (SQLite chiffré, une base par profil). D'ici là,
//    chaque profil a son journal sous sa propre clé locale — jamais sur un serveur.

import { create } from 'zustand';

import type { Entry, ProjectAct, Provenance } from './acts';
import { firstEntries, journalKey, profileId, readJournal, readProfiles, writeJournal, writeProfiles, type Dossier, type KV, type Profile } from './profiles';
import { merge } from './qrCopy';

/** L'établissement de la tablette : son nom et les prénoms de l'équipe (en attendant la connexion dieidos). */
export interface Setup { name: string; team: string[] }
export const SETUP_KEY = 'hlux.setup';

export function readSetup(kv: KV): Setup | null {
  try {
    const s = JSON.parse(kv.getItem(SETUP_KEY) ?? 'null') as Setup | null;
    return s && s.name && Array.isArray(s.team) && s.team.length ? s : null;
  } catch {
    return null;
  }
}

interface ProjectStore {
  /** null tant que l'établissement n'est pas mis en place (premier lancement). */
  setup: Setup | null;
  /** Premier lancement : le nom de l'établissement et les prénoms de l'équipe. */
  configure: (name: string, team: string[]) => boolean;
  /** Relire le stockage (après un changement d'espace : vraie vie ↔ démonstration). Ferme la séance. */
  reload: () => void;
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
  /** Le dossier du profil ouvert, prêt à être chiffré et emporté. */
  dossier: () => Dossier | null;
  /** Une copie a été emportée : la date est notée (rappel doux). */
  markBackedUp: (now: Date) => void;
  /**
   * Recevoir une copie par QR (même personne, autre appareil) : fusion en ajout seul.
   * Si les deux journaux ont divergé, la copie arrive à côté (un second profil) : c'est la personne qui compare.
   */
  receiveCopy: (d: Dossier) => { id: string; diverged: boolean };
  /** Restaurer un dossier : toujours un nouveau profil, jamais par-dessus un autre. */
  restoreProfile: (d: Dossier) => string;
  /** Départ : le profil ouvert est effacé de la tablette (journal et clé). Il faut une copie emportée dans la séance. */
  purge: () => boolean;
  /** Une copie a-t-elle été emportée pendant cette séance ? */
  backedUpNow: boolean;
  /**
   * La page invité, sans séance ni compte : elle ne voit **que** l'invitation et l'idée visée.
   * ⛳ Lot 5 : ces deux gestes passent par le relais dieidos (`/api/ephemeral/invitations`) ; d'ici là,
   * l'aperçu local relit le journal qui porte l'invitation.
   */
  guestRead: (invitation: string) => { firstName: string; entries: Entry[] } | null;
  guestAnswer: (invitation: string, act: ProjectAct, guest: string) => void;
  act: (author: string, act: ProjectAct, provenance?: Provenance, confirmedBy?: string) => Entry;
  undo: (author: string, rank: number) => void;
  confirm: (rank: number, by: string) => void;
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
      setup: readSetup(kv),
      configure: (name, team) => {
        const clean = [...new Set(team.map((t) => t.trim()).filter(Boolean))];
        if (!name.trim() || !clean.length) return false;
        const setup = { name: name.trim(), team: clean };
        kv.setItem(SETUP_KEY, JSON.stringify(setup));
        set({ setup });
        return true;
      },
      reload: () => set({ setup: readSetup(kv), profiles: readProfiles(kv), pro: null, person: null, entries: [], backedUpNow: false }),
      profiles: readProfiles(kv),
      pro: null,
      person: null,
      entries: [],
      backedUpNow: false,
      openSession: (pro) => {
        if (!get().setup?.team.includes(pro)) return; // seule l'équipe de l'établissement ouvre une séance
        set({ pro, person: null, entries: [], backedUpNow: false });
      },
      closeSession: () => set({ pro: null, person: null, entries: [], backedUpNow: false }),
      open: (id) => {
        if (!get().pro || !get().profiles.some((p) => p.id === id)) return; // le profil s'ouvre par la séance
        set({ person: id, entries: readJournal(kv, id), backedUpNow: false });
      },
      close: () => set({ person: null, entries: [], backedUpNow: false }),
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
      dossier: () => {
        const p = get().profiles.find((x) => x.id === get().person);
        return p ? { person: p.id, firstName: p.firstName, entries: get().entries } : null;
      },
      markBackedUp: (now) => {
        const id = get().person;
        if (!id) return;
        const profiles = get().profiles.map((p) => (p.id === id ? { ...p, lastBackup: now.toISOString() } : p));
        writeProfiles(kv, profiles);
        set({ profiles, backedUpNow: true });
      },
      receiveCopy: (d) => {
        if (!get().pro) return { id: '', diverged: false };
        const here = get().profiles.find((p) => p.id === d.person);
        if (!here) return { id: get().restoreProfile(d), diverged: false };
        const { entries, diverged } = merge(readJournal(kv, here.id), d.entries);
        if (diverged) return { id: get().restoreProfile(d), diverged: true };
        writeJournal(kv, here.id, entries);
        get().open(here.id);
        return { id: here.id, diverged: false };
      },
      restoreProfile: (d) => {
        if (!get().pro) return '';
        const id = profileId(d.firstName, get().profiles.map((p) => p.id));
        const profiles = [...get().profiles, { id, firstName: d.firstName }];
        writeProfiles(kv, profiles);
        writeJournal(kv, id, d.entries);
        set({ profiles });
        get().open(id);
        return id;
      },
      purge: () => {
        const id = get().person;
        if (!get().pro || !id || !get().backedUpNow) return false;
        if (kv.purge) kv.purge(id);
        kv.removeItem(journalKey(id));
        const profiles = get().profiles.filter((p) => p.id !== id);
        writeProfiles(kv, profiles);
        set({ profiles, person: null, entries: [], backedUpNow: false });
        return true;
      },
      guestRead: (invitation) => {
        for (const p of get().profiles) {
          const entries = readJournal(kv, p.id);
          if (entries.some((e) => e.act?.act === 'invitation_sent' && e.act.invitation === invitation)) return { firstName: p.firstName, entries };
        }
        return null;
      },
      guestAnswer: (invitation, act, guest) => {
        const p = get().profiles.find((x) => readJournal(kv, x.id).some((e) => e.act?.act === 'invitation_sent' && e.act.invitation === invitation));
        if (!p || act.act !== 'invitation_answered' || act.invitation !== invitation) return; // une seule invitation, une seule réponse
        const entries = readJournal(kv, p.id);
        if (entries.some((e) => e.act?.act === 'invitation_answered' && e.act.invitation === invitation)) return;
        writeJournal(kv, p.id, [...entries, { rank: entries.length, author: guest, provenance: 'by_hand', act }]);
        if (get().person === p.id) set({ entries: readJournal(kv, p.id) });
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
    };
  });
}

