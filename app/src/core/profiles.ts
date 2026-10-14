// Les profils de la tablette partagée, et la séance qui les ouvre.
//
// - Un profil par personne, étanche : son journal vit sous sa propre clé (`hlux.project.<id>`) ;
//   lot 2 : une base SQLCipher et une clé par profil.
// - Pour entrer, il suffit d'un prénom et d'une phrase : la phrase devient sa première Carte.
// - La séance est **locale** (décision du 2026-10-14) : la professionnelle touche son prénom, puis la
//   personne le sien. Elle ne vit qu'en mémoire : relancer l'application la referme. Hors séance, les
//   profils restent fermés. L'OAuth dieidos remplacera la première étape.
// - Aucun code ni mot de passe pour la personne (garde-fou de l'écran 01).

import type { Entry } from './acts';

export interface Profile { id: string; firstName: string }

export type KV = { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; removeItem: (k: string) => void };

export const PROFILES_KEY = 'hlux.profiles';
export const journalKey = (id: string) => `hlux.project.${id}`;

/** Un identifiant stable et lisible, unique sur la tablette (« amina », « amina-2 »…). */
export function profileId(firstName: string, taken: string[]): string {
  const base = firstName.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'personne';
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return id;
}

export function readProfiles(kv: KV): Profile[] {
  try {
    return JSON.parse(kv.getItem(PROFILES_KEY) ?? '[]') as Profile[];
  } catch {
    return [];
  }
}

export function writeProfiles(kv: KV, profiles: Profile[]): void {
  kv.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function readJournal(kv: KV, id: string): Entry[] {
  const raw = kv.getItem(journalKey(id));
  if (!raw) return [];
  const parsed = JSON.parse(raw) as Entry[] | { state?: { entries?: Entry[] } };
  // Compatibilité : avant le passage 10, le journal d'Amina était persisté par zustand ({ state: { entries } }).
  return Array.isArray(parsed) ? parsed : parsed.state?.entries ?? [];
}

export function writeJournal(kv: KV, id: string, entries: Entry[]): void {
  kv.setItem(journalKey(id), JSON.stringify(entries));
}

/** Un prénom et une phrase : le profil naît avec sa première Carte, dite avec la professionnelle. */
export function firstEntries(id: string, sentence: string, saidWith: string): Entry[] {
  const verbatim = sentence.trim();
  if (!verbatim) return [];
  return [{
    rank: 0, author: id, provenance: 'by_hand',
    act: {
      act: 'card_created', card: 'carte-1', title: verbatim.split(/\s+/).slice(0, 3).join(' '), picto: null,
      verbatim, lang: 'fr', origin: 'written', said_with: saidWith, when: "aujourd'hui",
    },
  }];
}
