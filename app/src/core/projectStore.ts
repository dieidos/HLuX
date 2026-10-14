// Le magasin du profil ouvert et de la séance — sans React Native, donc testable (`projectStore.test.ts`).
// ⛳ Lot 2 : remplacé par le moteur Rust via UniFFI (SQLite chiffré, une base par profil). D'ici là,
//    chaque profil a son journal sous sa propre clé locale — jamais sur un serveur.

import { create } from 'zustand';

import type { Entry, ProjectAct, Provenance } from './acts';
import { firstEntries, journalKey, profileId, readJournal, readProfiles, writeJournal, writeProfiles, type Dossier, type KV, type Profile } from './profiles';
import { merge } from './qrCopy';

/**
 * L'appareil : soit la tablette d'un établissement (son nom, les prénoms de l'équipe, en attendant la
 * connexion dieidos), soit le téléphone de la personne, où elle entre directement — le verrou de
 * l'appareil suffit (CDC, « Données locales ») ; pas d'équipe, pas de séance, seulement « Mon projet ».
 */
export interface Setup { name: string; team: string[]; kind?: 'facility' | 'personal'; /** la période du projet d'établissement (ex. 2027–2031) */ period?: string }
export const SETUP_KEY = 'hlux.setup';

export function readSetup(kv: KV): Setup | null {
  try {
    const s = JSON.parse(kv.getItem(SETUP_KEY) ?? 'null') as Setup | null;
    if (!s || !s.name || !Array.isArray(s.team)) return null;
    return s.kind === 'personal' || s.team.length ? s : null;
  } catch {
    return null;
  }
}

interface ProjectStore {
  /** null tant que l'établissement n'est pas mis en place (premier lancement). */
  setup: Setup | null;
  /** Premier lancement : le nom de l'établissement et les prénoms de l'équipe. */
  configure: (name: string, team: string[], period?: string) => boolean;
  /** Mon téléphone : la personne entre avec son prénom (et une phrase, si elle veut). */
  /** `sentence` null : le téléphone se met en place pour recevoir un dossier, sans en créer un. */
  configurePersonal: (firstName: string, sentence: string | null) => string;
  /** Le téléphone de la personne : pas de séance, elle entre directement. */
  personal: () => boolean;
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
  /** La langue et « Plus simple » de la personne ouverte, gardés dans son profil. */
  setPrefs: (lang: 'fr' | 'ar', falc: boolean) => void;
  /**
   * Recevoir une copie par QR (même personne, autre appareil) : fusion en ajout seul.
   * Si les deux journaux ont divergé, la copie arrive à côté (un second profil) : c'est la personne qui compare.
   */
  receiveCopy: (d: Dossier) => { id: string; diverged: boolean };
  /** Le journal d'une autre version (comparaison côte à côte). */
  otherVersion: (id: string) => Entry[];
  /** Retirer l'autre version, une fois que la personne a gardé ce qu'elle voulait. */
  dropVersion: (id: string) => void;
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
      configure: (name, team, period) => {
        const clean = [...new Set(team.map((t) => t.trim()).filter(Boolean))];
        if (!name.trim() || !clean.length) return false;
        const setup: Setup = { name: name.trim(), team: clean, kind: 'facility', ...(period?.trim() ? { period: period.trim() } : {}) };
        kv.setItem(SETUP_KEY, JSON.stringify(setup));
        set({ setup });
        return true;
      },
      configurePersonal: (firstName, sentence) => {
        if (!firstName.trim()) return '';
        const setup: Setup = { name: firstName.trim(), team: [], kind: 'personal' };
        kv.setItem(SETUP_KEY, JSON.stringify(setup));
        set({ setup });
        return sentence === null ? '' : get().createProfile(firstName, sentence);
      },
      personal: () => get().setup?.kind === 'personal',
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
        // Sur une tablette, le profil s'ouvre par la séance ; sur son téléphone, la personne entre directement.
        if ((!get().pro && !get().personal()) || !get().profiles.some((p) => p.id === id)) return;
        set({ person: id, entries: readJournal(kv, id), backedUpNow: false });
      },
      close: () => set({ person: null, entries: [], backedUpNow: false }),
      createProfile: (firstName, sentence) => {
        const pro = get().pro;
        if ((!pro && !get().personal()) || !firstName.trim()) return '';
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
      setPrefs: (lang, falc) => {
        const id = get().person;
        if (!id) return;
        const profiles = get().profiles.map((p) => (p.id === id ? { ...p, lang, falc } : p));
        writeProfiles(kv, profiles);
        set({ profiles });
      },
      markBackedUp: (now) => {
        const id = get().person;
        if (!id) return;
        const profiles = get().profiles.map((p) => (p.id === id ? { ...p, lastBackup: now.toISOString() } : p));
        writeProfiles(kv, profiles);
        set({ profiles, backedUpNow: true });
      },
      receiveCopy: (d) => {
        if (!get().pro && !get().personal()) return { id: '', diverged: false };
        const here = get().profiles.find((p) => p.id === d.person);
        if (!here) return { id: get().restoreProfile(d), diverged: false };
        const { entries, diverged } = merge(readJournal(kv, here.id), d.entries);
        if (diverged) {
          // L'autre version arrive à côté, marquée comme telle ; la personne compare et choisit.
          const id = profileId(d.firstName, get().profiles.map((p) => p.id));
          const profiles = [...get().profiles, { id, firstName: d.firstName, copyOf: here.id }];
          writeProfiles(kv, profiles);
          writeJournal(kv, id, d.entries);
          set({ profiles });
          get().open(here.id);
          return { id, diverged: true };
        }
        writeJournal(kv, here.id, entries);
        get().open(here.id);
        return { id: here.id, diverged: false };
      },
      otherVersion: (id) => readJournal(kv, id),
      dropVersion: (id) => {
        const p = get().profiles.find((x) => x.id === id);
        if (!p?.copyOf) return; // on ne retire ici qu'une « autre version », jamais un dossier
        kv.removeItem(journalKey(id));
        if (kv.purge) kv.purge(id);
        const profiles = get().profiles.filter((x) => x.id !== id);
        writeProfiles(kv, profiles);
        set({ profiles });
      },
      restoreProfile: (d) => {
        if (!get().pro && !get().personal()) return '';
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
        const gone = [id, ...get().profiles.filter((p) => p.copyOf === id).map((p) => p.id)];
        for (const g of gone) {
          kv.removeItem(journalKey(g));
          if (kv.purge) kv.purge(g);
        }
        const profiles = get().profiles.filter((p) => !gone.includes(p.id));
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

