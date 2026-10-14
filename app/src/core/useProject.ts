// Le journal du profil ouvert, côté interface, et la séance qui l'ouvre (`profiles.ts`, `projectStore.ts`).
// ⛳ Lot 2 : remplacé par le moteur Rust via UniFFI (SQLite chiffré, une base par profil).

import { create } from 'zustand';

import { clearDemo, writeDemo } from './demo';
import { currentMode, type Mode } from './mode';
import { makeProjectStore } from './projectStore';
import { pending, standing, type ProjectState } from './project';
import { localStorageAdapter, rawStorage } from './storage';
import { useAids } from './useAids';
import { FACILITY_KEY, useFacility } from './useFacility';

export const useProject = makeProjectStore(localStorageAdapter);

export const useProjectState = (): ProjectState => standing(useProject((s) => s.entries));
export const usePending = () => pending(useProject((s) => s.entries));

/** Le profil ouvert : son identifiant (auteur des gestes) et son prénom (ce qu'on lit à l'écran). */
export function useMe(): { id: string; name: string } {
  const person = useProject((s) => s.person);
  const profiles = useProject((s) => s.profiles);
  const p = profiles.find((x) => x.id === person);
  return { id: p?.id ?? '', name: p?.firstName ?? '' };
}

/** L'équipe de l'établissement (prénoms saisis au premier lancement). */
// Un tableau vide **stable** : un `[]` neuf à chaque rendu ferait boucler le sélecteur de zustand.
const NO_TEAM: string[] = [];
export const useTeam = (): string[] => useProject((s) => s.setup?.team ?? NO_TEAM);

/** L'espace courant : vraie vie ou démonstration. */
export const useMode = create<{ mode: Mode }>()(() => ({ mode: currentMode(rawStorage) }));

/** Après un changement d'espace, tout se relit, et la séance se referme. */
async function rereadAll() {
  useMode.setState({ mode: currentMode(rawStorage) });
  useProject.getState().reload();
  // Relire d'abord ; vider seulement si l'espace n'a rien. (Vider avant écraserait aussitôt, par la
  // persistance, ce que la démonstration vient d'écrire.)
  await useFacility.persist.rehydrate();
  if (!localStorageAdapter.getItem(FACILITY_KEY)) useFacility.setState({ entries: [] });
}

/** Ouvrir la démonstration : elle entre elle-même les données d'Amina et des Lilas. */
export async function enterDemo() {
  writeDemo(rawStorage);
  await rereadAll();
}

/** Quitter la démonstration : ses données sont effacées ; la vraie vie reprend telle qu'elle était. */
export async function leaveDemo() {
  clearDemo(rawStorage);
  await rereadAll();
}

// La langue et « Plus simple » suivent la personne : à l'ouverture de son profil, on les retrouve ;
// quand elle les change, son profil les garde. Hors profil (écrans de l'équipe), le français.
let lastPerson: string | null = null;
useProject.subscribe((s) => {
  if (s.person === lastPerson) return;
  lastPerson = s.person;
  const p = s.profiles.find((x) => x.id === s.person);
  useAids.setState({ lang: p?.lang ?? 'fr', simple: p?.falc ?? false });
});
useAids.subscribe((a, before) => {
  const s = useProject.getState();
  if (!s.person || (a.lang === before.lang && a.simple === before.simple)) return;
  s.setPrefs(a.lang, a.simple);
});

