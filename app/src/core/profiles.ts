// Les profils de la tablette partagée, et la séance qui les ouvre.
//
// - Un profil par personne, étanche : son journal vit sous sa propre clé (`hlux.project.<id>`) ;
//   lot 2 : une base SQLCipher et une clé par profil.
// - Pour entrer, il suffit d'un prénom et d'une phrase : la phrase devient sa première Carte.
// - La séance est **locale** (décision du 2026-10-14) : la professionnelle touche son prénom, puis la
//   personne le sien. Elle ne vit qu'en mémoire : relancer l'application la referme. Hors séance, les
//   profils restent fermés. L'OAuth dieidos remplacera la première étape.
// - Aucun code ni mot de passe pour la personne (garde-fou de l'écran 01).

import { dayInWords } from './dates';
import type { Entry } from './acts';

export interface Profile {
  id: string;
  firstName: string;
  /** date ISO de la dernière copie emportée */
  lastBackup?: string;
  /** la langue et le registre de la personne : retrouvés à chaque ouverture de son profil */
  lang?: 'fr' | 'ar';
  falc?: boolean;
}

export type KV = { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; removeItem: (k: string) => void; /** efface tout ce qui appartient à un profil, clé de chiffrement comprise */ purge?: (id: string) => void };

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
export function firstEntries(id: string, sentence: string, saidWith: string | null): Entry[] {
  const verbatim = sentence.trim();
  if (!verbatim) return [];
  return [{
    rank: 0, author: id, provenance: 'by_hand',
    act: {
      act: 'card_created', card: 'carte-1', title: verbatim.split(/\s+/).slice(0, 3).join(' '), picto: null,
      verbatim, lang: 'fr', origin: 'written', said_with: saidWith, when: dayInWords(),
    },
  }];
}

/** Le rappel doux : jamais de copie, ou la dernière a plus de 7 jours. */
export const BACKUP_EVERY_DAYS = 7;
export function needsBackup(p: Profile | undefined, now: Date): boolean {
  if (!p) return false;
  if (!p.lastBackup) return true;
  return now.getTime() - new Date(p.lastBackup).getTime() > BACKUP_EVERY_DAYS * 24 * 3600 * 1000;
}

/** Ce que contient un dossier emporté (avant chiffrement). */
export interface Dossier { person: string; firstName: string; entries: Entry[] }

export function readDossier(json: string): Dossier {
  const d = JSON.parse(json) as Partial<Dossier>;
  if (typeof d.person !== 'string' || !Array.isArray(d.entries)) throw new Error("Ce dossier n'a pas la forme attendue.");
  // Les dossiers d'avant le passage 11 n'avaient pas de prénom : on le reprend de l'identifiant.
  const firstName = d.firstName ?? d.person.charAt(0).toUpperCase() + d.person.slice(1);
  return { person: d.person, firstName, entries: d.entries };
}

